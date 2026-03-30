import time
import requests
from typing import List, Dict

# Queries and Targets
SUBREDDITS = [
    "singapore", "asksingapore", "singaporehappenings",
    "SingaporeReviews", "SingaporeEats", "SingaporeCafes",
    "sgdatingscene", "singaporefood"
]
QUERIES = [
    "hidden gem", "hawker", "must try", 
    "honest review", "date night", "avoid"
]

def fetch_reddit_data(subreddit: str, query: str, since_timestamp: float = 0.0) -> List[Dict]:
    """Fetch search results from Reddit JSON API."""
    time.sleep(1) # Gentle delay for Reddit rate limits
    
    url = f"https://www.reddit.com/r/{subreddit}/search.json"
    params = {
        "q": f"{query} created_utc:>{since_timestamp}" if since_timestamp else query,
        "restrict_sr": "on",
        "sort": "new",
        "limit": 50
    }
    headers = {"User-Agent": "CityAI-Scraper/1.1 (by /u/city_ai)"}
    
    print(f"Fetching r/{subreddit} for '{query}'...")
    try:
        response = requests.get(url, params=params, headers=headers)
        if response.status_code != 200:
            return []
        
        data = response.json()
        posts = []
        for post in data.get("data", {}).get("children", []):
            post_data = post.get("data", {})
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
