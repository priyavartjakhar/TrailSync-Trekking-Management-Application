import urllib.request
import re
import json
import ssl

def get_unsplash_ids(query):
    url = f"https://unsplash.com/s/photos/{query}"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    # Bypass SSL verification
    context = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, context=context) as response:
            html = response.read().decode('utf-8')
            # Look for photo IDs in the HTML. Unsplash photo IDs are alphanumeric with a pattern like photo-123456789-abcdef1234
            matches = re.findall(r'photo-\d+-[a-f0-9]+', html)
            # Filter matches that are at least 15 characters long to avoid partial patterns
            valid_matches = [m for m in matches if len(m) > 15]
            return list(set(valid_matches))
    except Exception as e:
        print(f"Error fetching {query}: {e}")
        return []

queries = ["mountain", "forest", "hill", "lake", "valley", "hiking", "trekking", "nature-landscape", "himalayas", "woods", "glacier"]
all_ids = set()
for q in queries:
    ids = get_unsplash_ids(q)
    all_ids.update(ids)
    print(f"Query '{q}' found {len(ids)} valid IDs. Total unique so far: {len(all_ids)}")
    if len(all_ids) >= 150:
        break

final_list = sorted(list(all_ids))
print("Final unique IDs count:", len(final_list))
with open("scratch/unsplash_ids.json", "w") as f:
    json.dump(final_list, f, indent=2)
print("Saved to scratch/unsplash_ids.json")
