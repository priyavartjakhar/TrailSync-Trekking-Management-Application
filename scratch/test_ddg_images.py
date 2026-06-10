import urllib.request
import urllib.parse
import re
import json
import ssl

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
        print("Error getting vqd:", e)
    return None

def get_ddg_images(query):
    vqd = get_vqd(query)
    if not vqd:
        print("Could not get vqd for", query)
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
                if img_url:
                    images.append(img_url)
            return images
    except Exception as e:
        print("Error fetching images:", e)
    return []

# Test
urls = get_ddg_images("mountain forest hill unsplash")
print("Found", len(urls), "images")
if urls:
    print("First 5 images:")
    for u in urls[:5]:
        print(u)
