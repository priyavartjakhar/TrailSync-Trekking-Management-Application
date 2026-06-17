import urllib.request
import json

try:
    print("Logging in...")
    req = urllib.request.Request('http://localhost:8000/api/auth/login', data=json.dumps({'email': 'admin@trailsync.com', 'password': 'admin123'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
    response = urllib.request.urlopen(req)
    cookie = response.headers.get('Set-Cookie')
    print("Login ok")
except Exception as e:
    print("Login error:", e)

try:
    print("Fetching dashboard...")
    req2 = urllib.request.Request('http://localhost:8000/api/admin/dashboard_data', headers={'Cookie': cookie} if cookie else {})
    response2 = urllib.request.urlopen(req2)
    data = json.loads(response2.read().decode('utf-8'))
    print("Dashboard data keys:", data.keys())
except Exception as e:
    print("Dashboard error:", e)
