import urllib.request
import urllib.parse
import re
import json
import ssl
import time

def get_vqd(query):
    url = f"https://duckduckgo.com/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    context = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, context=context) as response:
            html = response.read().decode('utf-8')
            match = re.search(r'vqd=[\'"]?([^\'&"]+)[\'"]?', html)
            if match:
                return match.group(1)
    except Exception as e:
        print(f"Error getting vqd for '{query}':", e)
    return None

def get_ddg_unsplash_images(query):
    vqd = get_vqd(query)
    if not vqd:
        return []
    
    url = f"https://duckduckgo.com/i.js?q={urllib.parse.quote(query)}&o=json&vqd={vqd}"
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    context = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, context=context) as response:
            data = json.loads(response.read().decode('utf-8'))
            results = data.get('results', [])
            images = []
            for r in results:
                img_url = r.get('image')
                if img_url and 'unsplash.com' in img_url and '/photo-' in img_url:
                    # Clean up the URL query parameters to get a nice high-res image link
                    # We can strip the extra tokens but keep sizing/quality parameters
                    # Example: https://images.unsplash.com/photo-12345678?w=800&q=80
                    base_url = img_url.split('?')[0]
                    clean_url = f"{base_url}?auto=format&fit=crop&w=800&q=80"
                    images.append(clean_url)
            return images
    except Exception as e:
        print(f"Error fetching images for '{query}':", e)
    return []

queries = [
    "mountain unsplash",
    "forest unsplash",
    "hill landscape unsplash",
    "valley unsplash",
    "himalayas unsplash",
    "woods nature unsplash",
    "lake mountains unsplash",
    "hiking trail unsplash",
    "alpine landscape unsplash",
    "wilderness mountains unsplash"
]

all_urls = set()
for q in queries:
    print(f"Searching for '{q}'...")
    urls = get_ddg_unsplash_images(q)
    all_urls.update(urls)
    print(f"Found {len(urls)} Unsplash images. Total unique so far: {len(all_urls)}")
    time.sleep(1) # Be polite to DDG

final_urls = sorted(list(all_urls))
print(f"\nFinal count of unique Unsplash landscape images: {len(final_urls)}")

# Save to backend/unsplash_images.json
with open("backend/unsplash_images.json", "w") as f:
    json.dump(final_urls, f, indent=2)
print("Saved to backend/unsplash_images.json")
