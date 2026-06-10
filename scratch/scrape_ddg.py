import urllib.request
import urllib.parse
import re
import ssl
import json

def get_unsplash_ids_via_ddg(query):
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(f"site:unsplash.com/photos {query}")
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    context = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, context=context) as response:
            html = response.read().decode('utf-8')
            # Look for photo URLs like https://unsplash.com/photos/abc-123 or https://unsplash.com/photos/xyz
            # DDG encodes them, e.g. u=https://unsplash.com/photos/some-id
            # Matches could be unsplash.com/photos/([a-zA-Z0-9_-]+)
            matches = re.findall(r'unsplash\.com/photos/([a-zA-Z0-9_-]+)', html)
            # Filter out non-photo paths like 'license', 'terms', etc.
            invalid_paths = {'license', 'terms', 'privacy', 'about', 'join', 'login', 'explore', 'images', 'backgrounds'}
            ids = [m for m in matches if m not in invalid_paths and len(m) >= 6]
            return list(set(ids))
    except Exception as e:
        print(f"Error fetching DDG for {query}: {e}")
        return []

queries = ["mountain", "forest", "hill", "lake", "valley", "hiking", "trekking", "woods", "glacier"]
all_ids = set()
for q in queries:
    ids = get_unsplash_ids_via_ddg(q)
    all_ids.update(ids)
    print(f"DDG Query '{q}' found {len(ids)} IDs. Total unique so far: {len(all_ids)}")

final_list = sorted(list(all_ids))
print("Final unique IDs count:", len(final_list))
with open("scratch/unsplash_ids_ddg.json", "w") as f:
    json.dump(final_list, f, indent=2)
print("Saved to scratch/unsplash_ids_ddg.json")
