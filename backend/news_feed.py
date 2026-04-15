import feedparser
import time

# Cache to prevent getting blocked for hitting RSS feeds too fast
_NEWS_CACHE = {
    "timestamp": 0,
    "data": []
}

CACHE_EXPIRY = 600  # 10 minutes

def get_latest_news():
    global _NEWS_CACHE
    now = time.time()
    
    if now - _NEWS_CACHE["timestamp"] < CACHE_EXPIRY and _NEWS_CACHE["data"]:
        return _NEWS_CACHE["data"]

    # Popular security RSS feeds
    # You can mix and match, but The Hacker News provides concise headlines
    feed_url = "http://feeds.feedburner.com/TheHackersNews"
    
    try:
        parsed = feedparser.parse(feed_url)
        news_items = []
        
        # Grab top 5 articles
        for entry in parsed.entries[:5]:
            news_items.append({
                "title": entry.title,
                "link": entry.link,
                "date": entry.published if hasattr(entry, 'published') else "Recent"
            })
            
        if news_items:
            _NEWS_CACHE["timestamp"] = now
            _NEWS_CACHE["data"] = news_items
            return news_items
            
    except Exception as e:
        print(f"Error fetching news feed: {e}")
    
    return _NEWS_CACHE.get("data", [])
