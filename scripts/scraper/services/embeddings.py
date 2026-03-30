import os
import re
import time
from typing import List, Tuple
import numpy as np
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Configuration for Gemini Free Tier (1,000 RPD / 30K TPM)
BATCH_SIZE = 40            # Group size for embed_content calls
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: Missing required environment variable (GEMINI_API_KEY)")
    exit(1)

# Initialize client
client = genai.Client(api_key=GEMINI_API_KEY)

def clean_text(text: str) -> str:
    """Clean and normalize text for better embedding quality."""
    if not text: return ""
    text = re.sub(r'http\S+', '', text)
    text = text.lower()
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def chunk_text(text: str, chunk_size: int = 500) -> List[str]:
    """Split text into manageable chunks on sentence boundaries."""
    if not text or len(text) < 50: return []
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current = [], ""
    for s in sentences:
        if len(current) + len(s) <= chunk_size: current += s + " "
        else:
            if current: chunks.append(current.strip())
            current = s + " "
    if current: chunks.append(current.strip())
    return chunks

def normalize_l2(vector: List[float]) -> List[float]:
    """Apply L2 normalization for 768d vector compatibility with 1e-12 epsilon."""
    v = np.array(vector, dtype=np.float64)
    norm = np.linalg.norm(v)
    if norm < 1e-12:
        return vector
    return (v / norm).tolist()

def generate_embeddings(chunks: List[str]) -> Tuple[List[List[float]], bool]:
    """Generate embeddings synchronously with Free Tier rate protections."""
    if not chunks: return [], True
    
    embeddings = []
    total = len(chunks)
    print(f"Processing {total} chunks in steps of {BATCH_SIZE}...")
    
    for i in range(0, total, BATCH_SIZE):
        batch = chunks[i : i + BATCH_SIZE]
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                result = client.models.embed_content(
                    model="gemini-embedding-2-preview",
                    contents=batch,
                    config=types.EmbedContentConfig(output_dimensionality=768, task_type="RETRIEVAL_DOCUMENT")
                )
                for emb in result.embeddings:
                    embeddings.append(normalize_l2(emb.values))
                
                print(f"  Ingested {min(i + BATCH_SIZE, total)} / {total} chunks.")
                break
            except Exception as e:
                err = str(e).lower()
                is_rate_limit = "429" in err or "resource_exhausted" in err
                is_connection_issue = any(phrase in err for phrase in ["disconnected", "connection", "503", "timeout", "unavailable"])
                
                if is_rate_limit:
                    if "perday" in err or "daily" in err:
                        print("\n[QUOTA] Daily limit (1,000 RPD) reached. Stopping loop.")
                        return embeddings, False
                    
                    delay = 15 * (2 ** attempt)
                    print(f"  Rate limited. Retrying in {delay}s...")
                    time.sleep(delay)
                    continue
                
                if is_connection_issue and attempt < max_retries - 1:
                    delay = 5 * (2 ** attempt)
                    print(f"  Connection issue detected: {e}. Retrying in {delay}s (Attempt {attempt+2}/{max_retries})...")
                    time.sleep(delay)
                    continue

                print(f"CRITICAL failure: {e}")
                return embeddings, False
        
        if i + BATCH_SIZE < total:
            time.sleep(12) # Safeguard for TPM/RPM
            
    return embeddings, True
