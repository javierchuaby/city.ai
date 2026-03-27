from __future__ import annotations
import os
import requests
import re
import json
import time
import time
import concurrent.futures
import hashlib
from typing import List, Dict, Any, Sequence, Optional, Tuple

# Using built-in types for Python 3.9+ but typing for IDE compatibility
from google import genai
from supabase import create_client, Client
from dotenv import load_dotenv

"""
SUPABASE SCHEMA SETUP:
Run this in your Supabase SQL Editor first:

-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create the chunks table with a unique constraint on content for idempotency
create table if not exists intel_chunks (
  id bigserial primary key,
  content text not null unique,
  metadata jsonb,
  embedding vector(768)
);

-- Index for similarity search
create index on intel_chunks using hnsw (embedding vector_cosine_ops);

-- Search function for the backend
create or replace function match_intel (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    intel_chunks.id,
    intel_chunks.content,
    intel_chunks.metadata,
    1 - (intel_chunks.embedding <=> query_embedding) as similarity
  from intel_chunks
  where 1 - (intel_chunks.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
"""

# Load environment variables
load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([GEMINI_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("Error: Missing required environment variables (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
    exit(1)

# Initialize clients
client = genai.Client(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Queries
SUBREDDITS = [
    # "singapore", 
    # "asksingapore", 
    # "singaporehappenings",
    # "SingaporeReviews",
    "SingaporeEats",
    "SingaporeCafes",
    "sgdatingscene",
    "singaporefood"
]
QUERIES = [
    "hidden gem",    # The original niche
    "hawker",        # The food niche
    "must try",      # Intent-based (Food/Cafes)
    "honest review", # Quality-based (Reviews/Happenings)
    "date night",    # Context-based (Dating/Cafes)
    "avoid"          # Sentiment-based (Scams/ Tourist traps)
]

def fetch_reddit_data(subreddit: str, query: str, since_timestamp: float = 0.0) -> list[dict]:
    """Fetch search results from Reddit in JSON format."""
    url = f"https://www.reddit.com/r/{subreddit}/search.json"
    params = {
        "q": f"{query} created_utc:>{since_timestamp}" if since_timestamp else query,
        "restrict_sr": "on",
        "sort": "new", # Sort by new for better incremental efficiency
        "t": "all",    # Use 'all' since we are filtering by timestamp in the query
        "limit": 50
    }
    # Reddit requires a custom User-Agent to avoid 429 errors
    headers = {"User-Agent": "CityAI-Scraper/1.0 (by /u/city_ai)"}
    
    print(f"Fetching r/{subreddit} for '{query}'...")
    try:
        response = requests.get(url, params=params, headers=headers)
        if response.status_code != 200:
            print(f"Failed to fetch data: {response.status_code} - {response.text[:100]}")
            return []
        
        data = response.json()
        posts = []
        for post in data.get("data", {}).get("children", []):
            post_data = post.get("data", {})
            # Only include posts with actual content or interesting titles
            posts.append({
                "title": post_data.get("title", ""),
                "text": post_data.get("selftext", ""),
                "url": f"https://reddit.com{post_data.get('permalink', '')}",
                "id": post_data.get("id"),
                "subreddit": subreddit,
                "created": post_data.get("created_utc")
            })
        return posts
    except Exception as e:
        print(f"Error fetching from Reddit: {e}")
        return []

def get_last_run_timestamp() -> float:
    """Retrieve the last successful run timestamp from Supabase."""
    try:
        response = supabase.table("scraper_state").select("value").eq("key", "last_run_timestamp").execute()
        if response.data and len(response.data) > 0:
            return float(response.data[0]["value"])
    except Exception as e:
        print(f"Error fetching last run timestamp: {e}")
    return 0.0

def save_last_run_timestamp(timestamp: float):
    """Save the current run timestamp to Supabase."""
    try:
        supabase.table("scraper_state").upsert({
            "key": "last_run_timestamp",
            "value": str(timestamp)
        }).execute()
        print(f"Saved new last_run_timestamp: {timestamp}")
    except Exception as e:
        print(f"Error saving last run timestamp: {e}")

def clean_text(text: str) -> str:
    """Basic text cleaning to remove URLs, normalize whitespace, and lowercase."""
    if not text:
        return ""
    # Remove URLs
    text = re.sub(r'http\S+', '', text)
    # Lowercase and normalize whitespace
    text = text.lower()
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def chunk_text(text: str, chunk_size: int = 500) -> list[str]:
    """Split text into chunks of roughly chunk_size characters."""
    if not text or len(text) < 50: # Skip very short snippets
        return []
    
    # We try to split on sentences to avoid cutting in the middle
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) <= chunk_size:
            current_chunk += sentence + " "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
            
    if current_chunk:
        chunks.append(current_chunk.strip())
        
    return chunks

def generate_embeddings(chunks: List[str]) -> Tuple[List[List[float]], bool]:
    """Generate embeddings for chunks. Returns (embeddings, success_flag).
    If flag is False, it means a terminal failure occurred and these are partial results.
    """
    if not chunks:
        return [], True
    
    embeddings = []
    batch_size = 50
    total_chunks = len(chunks)
    print(f"Generating embeddings for {total_chunks} chunks in batches of {batch_size}...")
    
    for i in range(0, len(chunks), batch_size):
        batch = [chunks[j] for j in range(i, min(i + batch_size, len(chunks)))]
        max_retries = 3
        retry_delay = 5
        batch_success = False
        
        for attempt in range(max_retries):
            try:
                result = client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=batch,
                    config={
                        "output_dimensionality": 768,
                        "task_type": "RETRIEVAL_DOCUMENT"
                    }
                )
                
                for emb in result.embeddings:
                    embeddings.append(emb.values)
                
                batch_success = True
                total_processed = min(i + batch_size, total_chunks)
                print(f"Successfully processed {total_processed} / {total_chunks} chunks.")
                break
            except Exception as e:
                err_msg = str(e)
                if "429" in err_msg:
                    # 1. Detect Daily Quota Exhaustion (Abort immediately)
                    if "PerDay" in err_msg or "daily" in err_msg.lower():
                        print(f"\n[QUOTA EXHAUSTED] Daily Gemini API limit reached (1,000 req/day).")
                        print("Retrying will not help. Please wait until your quota resets (usually midnight PT).")
                        return embeddings, False
                    
                    # 2. Handle Per-Minute Rate Limits (Retry with buffer)
                    if attempt < max_retries - 1:
                        # Attempt to parse retry delay from API response
                        # Look for "retry in X.Xs" pattern common in GenAI errors
                        delay = retry_delay * (2 ** attempt)  # Default fallback
                        match = re.search(r"retry in (\d+\.?\d*)s", err_msg)
                        if match:
                            delay = float(match.group(1)) + 3  # Add 3s buffer as requested
                            print(f"  Rate limit: API requested {match.group(1)}s. Waiting {delay:.1f}s (3s buffer)...")
                        else:
                            print(f"  Rate limit: {err_msg[:100]}... Retrying in {delay}s...")
                        
                        time.sleep(delay)
                        continue

                # Terminal failure
                print(f"CRITICAL: Terminal failure at batch index {i} after {max_retries} attempts.")
                print(f"Error: {err_msg}")
                return embeddings, False

        # Rate limiting safety between batches
        if i + batch_size < total_chunks:
            print("  Waiting 5s to respect rate limits...")
            time.sleep(5) 
    
    return embeddings, True

def filter_existing_chunks(hash_data: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Check Supabase for chunks that already exist based on MD5 hash.
    Returns a filtered dictionary containing only new chunks.
    """
    if not hash_data:
        return {}
    
    all_hashes = list(hash_data.keys())
    existing_hashes = set()
    # Hashes are small (32 chars), so we can use larger batches safely
    batch_size = 50
    total_to_check = len(all_hashes)
    
    print(f"Persistent Deduplication: Checking Supabase for {total_to_check} existing hashes...")
    
    for i in range(0, total_to_check, batch_size):
        batch = all_hashes[i:i+batch_size]
        try:
            # Check if any of these hashes already exist in the database
            response = supabase.table("intel_chunks").select("content_hash").in_("content_hash", batch).execute()
            if response.data:
                for item in response.data:
                    existing_hashes.add(item["content_hash"])
        except Exception as e:
            print(f"  Warning: batch check failed at index {i}. Error: {e}")
            continue
            
    # Filter the hash_data dictionary
    new_data = {h: data for h, data in hash_data.items() if h not in existing_hashes}
    
    if existing_hashes:
        print(f"  Skipping {len(existing_hashes)} chunks already stored in Supabase.")
    
    return new_data

def upsert_to_supabase(chunks: list[str], embeddings: list[list[float]], metadata: list[dict], hashes: list[str]):
    """Upsert chunks and embeddings into Supabase intel_chunks table."""
    if not chunks or not embeddings:
        print("Nothing to upsert.")
        return

    data_to_insert: List[Dict[str, Any]] = []
    # Ensure count alignment
    min_len = min(len(chunks), len(embeddings), len(hashes))
    
    for i in range(min_len):
        data_to_insert.append({
            "content": chunks[i],
            "content_hash": hashes[i],
            "embedding": embeddings[i],
            "metadata": metadata[i]
        })
    
    if data_to_insert:
        print(f"Upserting {len(data_to_insert)} records to Supabase...")
        batch_size = 50
        for i in range(0, len(data_to_insert), batch_size):
            # Use comprehension to avoid type checker issues with slicing in some environments
            batch = [data_to_insert[j] for j in range(i, min(i + batch_size, len(data_to_insert)))]
            try:
                # Use upsert() with 'on_conflict="content_hash"' to prevent indexing duplicates
                # This ensures the scraper is idempotent and aligns with the engineering grit claim.
                supabase.table("intel_chunks").upsert(batch, on_conflict="content_hash").execute()
                print(f"  Processed batch {i//batch_size + 1}/{(len(data_to_insert)-1)//batch_size + 1}")
            except Exception as e:
                print(f"  Error upserting batch {i}: {e}")

def run_scraper():
    print("Starting City.ai Scraper...")
    
    # 1. Get last run timestamp for Incremental Scouting
    last_ts = get_last_run_timestamp()
    if last_ts > 0:
        print(f"Incremental Scouting: Fetching posts created after {time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(last_ts))}")
    
    hash_data = {}
    duplicates_found = 0
    max_created_utc = last_ts
    
    # Task combination for parallel execution
    tasks = [(sub, query) for sub in SUBREDDITS for query in QUERIES]
    
    print(f"Parallel Fetching: Launching {len(tasks)} threads for Reddit scouting...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        # Map tasks to the fetch function, passing last_ts for incremental scouting
        future_to_task = {executor.submit(fetch_reddit_data, sub, query, last_ts): (sub, query) for sub, query in tasks}
        
        for future in concurrent.futures.as_completed(future_to_task):
            sub, query = future_to_task[future]
            try:
                posts = future.result()
                for post in posts:
                    # Update max timestamp
                    if post['created'] > max_created_utc:
                        max_created_utc = post['created']
                        
                    # Combine title and text for context
                    full_text = f"TITLE: {post['title']}\nCONTENT: {post['text']}"
                    cleaned = clean_text(full_text)
                    if not cleaned: continue
                    
                    chunks = chunk_text(cleaned)
                    for chunk in chunks:
                        # Generate MD5 hash for the chunk
                        chunk_hash = hashlib.md5(chunk.encode()).hexdigest()
                        
                        if chunk_hash not in hash_data:
                            hash_data[chunk_hash] = {
                                "content": chunk,
                                "metadata": {
                                    "source": "Reddit",
                                    "subreddit": post['subreddit'],
                                    "post_id": post['id'],
                                    "url": post['url'],
                                    "query": query,
                                    "created": post['created'],
                                    "ingested_at": time.strftime("%Y-%m-%d %H:%M:%S")
                                }
                            }
                        else:
                            duplicates_found += 1
            except Exception as e:
                print(f"Error processing {sub} for '{query}': {e}")
    
    if not hash_data:
        print("No new data found to process.")
        # Even if no data, we can update the timestamp if we saw some old posts
        # but fetch_reddit_data with created_utc:> should only return new ones
        return

    # --- Persistent Deduplication: Save API Credits ---
    # We cross-reference hashes with Supabase BEFORE calling expensive embeddings
    hash_data = filter_existing_chunks(hash_data)
    
    if not hash_data:
        print("Knowledge base is already up to date. No new embeddings needed.")
        # Update the state to the latest timestamp we found
        if max_created_utc > last_ts:
            save_last_run_timestamp(max_created_utc)
        return

    all_hashes = list(hash_data.keys())
    all_contents = [v["content"] for v in hash_data.values()]
    all_metadata = [v["metadata"] for v in hash_data.values()]

    print(f"Total NEW chunks to process: {len(all_contents)} (Found {duplicates_found} in-memory duplicates)")
    
    # Graceful Error Handling: Process in work batches to save progress incrementally
    work_batch_size = 200
    total_upserted = 0
    any_failure = False
    
    for i in range(0, len(all_contents), work_batch_size):
        end_idx = min(i + work_batch_size, len(all_contents))
        batch_contents = all_contents[i:end_idx]
        batch_metadata = all_metadata[i:end_idx]
        batch_hashes = all_hashes[i:end_idx]
        
        print(f"\n--- Processing Work Batch {i//work_batch_size + 1}: Chunks {i} to {end_idx} ---")
        
        batch_embeddings, success = generate_embeddings(batch_contents)
        
        # Even if a failure occurred, upsert whatever partial embeddings we managed to get
        if batch_embeddings:
            num_to_upsert = len(batch_embeddings)
            upsert_to_supabase(
                batch_contents[:num_to_upsert], 
                batch_embeddings, 
                batch_metadata[:num_to_upsert], 
                batch_hashes[:num_to_upsert]
            )
            total_upserted += num_to_upsert

        if not success:
            print(f"\n[ABORTED] Terminal failure during work batch {i//work_batch_size + 1}.")
            any_failure = True
            break

    if any_failure:
        print(f"\nSession aborted early. Successfully saved {total_upserted} / {len(all_contents)} new chunks.")
        print("Progress has been partially saved. Remaining data will be picked up in the next run.")
    else:
        print(f"\nSession complete. Successfully saved {total_upserted} / {len(all_contents)} new chunks.")
        # Only update the state timestamp if the entire run was successful to ensure total consistency
        if max_created_utc > last_ts:
            save_last_run_timestamp(max_created_utc)
    
    # Supabase Verification: Print the final count
    try:
        response = supabase.table("intel_chunks").select("*", count="exact").limit(1).execute()
        final_count = response.count if response.count is not None else 0
        print(f"Final Count: {final_count} rows successfully in 'intel_chunks' table.")
    except Exception as e:
        print(f"Error verifying final count: {e}")

    print("\n--- Scraping and Indexing Pipeline Completed Successfully ---")

if __name__ == "__main__":
    run_scraper()
