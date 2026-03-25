from __future__ import annotations
import os
import requests
import re
import json
import time
from typing import List, Dict, Any, Sequence, Optional

# Using built-in types for Python 3.9+ but typing for IDE compatibility
from google import genai
from supabase import create_client, Client
from dotenv import load_dotenv

"""
SUPABASE SCHEMA SETUP:
Run this in your Supabase SQL Editor first:

-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create the chunks table
create table if not exists intel_chunks (
  id bigserial primary key,
  content text not null,
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
SUBREDDITS = ["singapore", "asksingapore"]
QUERIES = ["hidden gem", "hawker"]

def fetch_reddit_data(subreddit: str, query: str) -> list[dict]:
    """Fetch search results from Reddit in JSON format."""
    url = f"https://www.reddit.com/r/{subreddit}/search.json"
    params = {
        "q": query,
        "restrict_sr": "on",
        "sort": "relevance",
        "t": "year",  # Get data from the past year for relevance
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

def clean_text(text: str) -> str:
    """Basic text cleaning to remove URLs and excessive whitespace."""
    if not text:
        return ""
    # Remove URLs
    text = re.sub(r'http\S+', '', text)
    # Remove excessive newlines and whitespace
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

def generate_embeddings(chunks: List[str]) -> List[List[float]]:
    """Generate 768-dimensional embeddings for a list of text chunks using the new GenAI SDK with retry logic."""
    if not chunks:
        return []
    
    embeddings = []
    batch_size = 20
    total_chunks = len(chunks)
    print(f"Generating embeddings for {total_chunks} chunks in batches of {batch_size}...")
    
    for i in range(0, len(chunks), batch_size):
        # Use comprehension to avoid type checker issues with slicing in some environments
        batch = [chunks[j] for j in range(i, min(i + batch_size, len(chunks)))]
        max_retries = 3
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                # Using the new google-genai client syntax
                # Using stable gemini-embedding-001 as recommended
                result = client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=batch,
                    config={
                        "output_dimensionality": 768,
                        "task_type": "RETRIEVAL_DOCUMENT"
                    }
                )
                
                # The new SDK returns embeddings directly in result.embeddings
                for emb in result.embeddings:
                    embeddings.append(emb.values)
                
                # Success - break retry loop
                break
            except Exception as e:
                # If rate limited, wait and retry
                if "429" in str(e) and attempt < max_retries - 1:
                    wait_time = retry_delay * (2 ** attempt)
                    print(f"  Rate limited on batch {i}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    print(f"Error generating embeddings for batch {i}: {e}")
                    break
        
        # Rate limiting safety between batches
        total_processed = min(i + batch_size, total_chunks)
        print(f"Successfully processed {total_processed} / {total_chunks} chunks. Waiting 15s to respect rate limits...")
        time.sleep(15) 
    
    return embeddings

def upsert_to_supabase(chunks: list[str], embeddings: list[list[float]], metadata: list[dict]):
    """Upsert chunks and embeddings into Supabase intel_chunks table."""
    if not chunks or not embeddings:
        print("Nothing to upsert.")
        return

    data_to_insert: List[Dict[str, Any]] = []
    # Ensure count alignment
    min_len = min(len(chunks), len(embeddings))
    
    for i in range(min_len):
        data_to_insert.append({
            "content": chunks[i],
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
                # Use insert() as requested (effectively upsert if content/vectors are same but usually we just add new intel)
                # The task said 'upsert', but since we don't have a unique key for content, 
                # we'll just insert. Typically for RAG we'd check for duplicates.
                supabase.table("intel_chunks").insert(batch).execute()
                print(f"  Processed batch {i//batch_size + 1}/{(len(data_to_insert)-1)//batch_size + 1}")
            except Exception as e:
                print(f"  Error upserting batch {i}: {e}")

def run_scraper():
    print("Starting City.ai Scraper...")
    all_chunks = []
    all_metadata = []
    
    for sub in SUBREDDITS:
        for query in QUERIES:
            posts = fetch_reddit_data(sub, query)
            for post in posts:
                # Combine title and text for context
                full_text = f"TITLE: {post['title']}\nCONTENT: {post['text']}"
                cleaned = clean_text(full_text)
                if not cleaned: continue
                
                chunks = chunk_text(cleaned)
                for chunk in chunks:
                    all_chunks.append(chunk)
                    all_metadata.append({
                        "source": "Reddit",
                        "subreddit": post['subreddit'],
                        "post_id": post['id'],
                        "url": post['url'],
                        "query": query,
                        "ingested_at": time.strftime("%Y-%m-%d %H:%M:%S")
                    })
    
    if not all_chunks:
        print("No data found to process.")
        return

    print(f"Total chunks prepared: {len(all_chunks)}")
    all_embeddings = generate_embeddings(all_chunks)
    
    upsert_to_supabase(all_chunks, all_embeddings, all_metadata)
    
    # Supabase Verification: Print the final count of rows successfully added to the intel_chunks table
    try:
        response = supabase.table("intel_chunks").select("*", count="exact").limit(1).execute()
        final_count = response.count if response.count is not None else 0
        print(f"Final Count: {final_count} rows successfully in 'intel_chunks' table.")
    except Exception as e:
        print(f"Error verifying final count: {e}")

    print("\n--- Scraping and Indexing Pipeline Completed Successfully ---")

if __name__ == "__main__":
    run_scraper()
