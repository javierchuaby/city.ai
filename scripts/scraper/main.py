from __future__ import annotations
import sys
import os
import time
import concurrent.futures
from typing import Dict, Any

# Ensure scripts directory is in path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from clients.reddit import fetch_reddit_data, SUBREDDITS, QUERIES
from services.embeddings import clean_text, chunk_text, generate_embeddings
from repository.supabase import (
    get_last_run_timestamp, 
    save_last_run_timestamp, 
    filter_existing_chunks, 
    upsert_to_supabase,
    compute_hash
)

def run_scraper():
    print("Starting City.ai Scraper (Modularized)...")
    last_ts = get_last_run_timestamp()
    
    # 1. Fetch
    scouted_posts = {}
    max_ts = last_ts
    tasks = [(sub, query) for sub in SUBREDDITS for query in QUERIES]
    
    # Concurrent fetching to improve performance
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        f_to_t = {executor.submit(fetch_reddit_data, s, q, last_ts): (s, q) for s, q in tasks}
        for f in concurrent.futures.as_completed(f_to_t):
            posts = f.result()
            for p in posts:
                if p['created'] > max_ts: max_ts = p['created']
                if p['id'] not in scouted_posts: scouted_posts[p['id']] = p

    # 2. Chunk & Hash
    hash_data = {}
    for p in scouted_posts.values():
        cleaned = clean_text(f"TITLE: {p['title']}\nCONTENT: {p['text']}")
        if not cleaned: continue
        for chunk in chunk_text(cleaned):
            ch_hash = compute_hash(chunk)
            if ch_hash not in hash_data:
                hash_data[ch_hash] = {
                    "content": chunk,
                    "metadata": {
                        "source": "Reddit", "subreddit": p['subreddit'], "post_id": p['id'],
                        "url": p['url'], "created": p['created'], "ingested_at": time.strftime("%Y-%m-%d %H:%M:%S")
                    }
                }

    # 3. Filter & Process
    hash_data = filter_existing_chunks(hash_data)
    if not hash_data:
        print("Knowledge base is already up to date.")
        if max_ts > last_ts: save_last_run_timestamp(max_ts)
        return

    print(f"Pool for today: {len(hash_data)} chunks. (Free Tier Limits apply).")
    all_chunks = [v["content"] for v in hash_data.values()]
    all_meta = [v["metadata"] for v in hash_data.values()]
    all_hashes = list(hash_data.keys())
    
    embeddings, success = generate_embeddings(all_chunks)
    if embeddings:
        upsert_to_supabase(all_chunks, embeddings, all_meta, all_hashes)
    
    if success:
        if max_ts > last_ts: save_last_run_timestamp(max_ts)
        print("Cycle completed successfully.")
    else:
        print("Cycle paused (Daily quota or error). Resume tomorrow.")

if __name__ == "__main__":
    run_scraper()
