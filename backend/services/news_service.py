import httpx
import re
from utils.logger import add_log

AGENT = "NewsService"

def get_company_news(company: str) -> list[dict]:
    add_log(AGENT, f"Fetching live news for {company}")
    try:
        url = f"https://news.google.com/rss/search?q={company}+hiring+funding&hl=en-US&gl=US&ceid=US:en"
        response = httpx.get(url, timeout=8.0)
        titles = re.findall(r'<title>(.*?)</title>', response.text)[2:7]
        add_log(AGENT, f"Found {len(titles)} news items for {company}")
        return [{"headline": t} for t in titles]
    except Exception as e:
        add_log(AGENT, f"News fetch failed for {company}: {e}")
        return []
