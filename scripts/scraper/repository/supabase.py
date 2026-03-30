import os
import hashlib
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("Error: Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
    exit(1)

# Initialize client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def compute_hash(text: str) -> str:
    """Compute MD5 hash for a string."""
    return hashlib.md5(text.encode()).hexdigest()

def get_last_run_timestamp() -> float:
    """Retrieve tracking timestamp from Supabase."""
    try:
        response = supabase.table("scraper_state").select("value").eq("key", "last_run_timestamp").execute()
        if response.data:
            return float(response.data[0]["value"])
    except: pass
    return 0.0

def save_last_run_timestamp(timestamp: float):
    """Save progress timestamp to Supabase."""
    try:
        supabase.table("scraper_state").upsert({"key": "last_run_timestamp", "value": str(timestamp)}).execute()
    except Exception as e:
        print(f"Error saving timestamp: {e}")

def filter_existing_chunks(hash_data: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Deduplicate against existing data in Supabase."""
    if not hash_data: return {}
    hashes = list(hash_data.keys())
    existing = set()
    
    for i in range(0, len(hashes), 100):
        batch = hashes[i:i+100]
        try:
            res = supabase.table("intel_chunks").select("content_hash").in_("content_hash", batch).execute()
            if res.data:
                for item in res.data: existing.add(item["content_hash"])
        except: continue
        
    return {h: d for h, d in hash_data.items() if h not in existing}

def upsert_to_supabase(chunks: List[str], embeddings: List[List[float]], metadata: List[Dict], hashes: List[str]):
    """Batch upsert results to the vector database."""
    data = []
    min_len = min(len(chunks), len(embeddings), len(hashes))
    for i in range(min_len):
        data.append({
            "content": chunks[i], "content_hash": hashes[i],
            "embedding": embeddings[i], "metadata": metadata[i]
        })
    
    if data:
        print(f"Syncing {len(data)} records to Supabase...")
        for i in range(0, len(data), 100):
            batch = data[i:i+100]
            try:
                supabase.table("intel_chunks").upsert(batch, on_conflict="content_hash").execute()
            except Exception as e:
                print(f"  Error syncing batch: {e}")
