"""Verify CORS headers are present on every type of response."""
import urllib.request
import urllib.error

ORIGIN = "https://www.mailos.in"
BASE = "http://localhost:8000"

def test(label, url, method="GET"):
    print(f"\n{'='*60}")
    print(f"  {label}  [{method} {url}]")
    print(f"{'='*60}")
    req = urllib.request.Request(url, headers={"Origin": ORIGIN}, method=method)
    try:
        r = urllib.request.urlopen(req)
        print(f"  Status: {r.getcode()}")
        acao = r.headers.get("Access-Control-Allow-Origin", "MISSING!")
        print(f"  Access-Control-Allow-Origin: {acao}")
        print(f"  CORS OK: {acao == ORIGIN}")
    except urllib.error.HTTPError as e:
        print(f"  Status: {e.code}")
        acao = e.headers.get("Access-Control-Allow-Origin", "MISSING!")
        print(f"  Access-Control-Allow-Origin: {acao}")
        print(f"  CORS OK: {acao == ORIGIN}")

# 1. Root (should 200)
test("Root endpoint", f"{BASE}/")

# 2. Preflight OPTIONS
test("Preflight OPTIONS", f"{BASE}/api/v1/dashboard/overview", method="OPTIONS")

# 3. 404 user (triggers HTTPException)
test("404 Not Found", f"{BASE}/api/v1/dashboard/overview?user_id=00000000-0000-0000-0000-000000000000")

# 4. 401 Missing user (triggers HTTPException)
test("401 Unauthorized", f"{BASE}/api/v1/dashboard/overview")
