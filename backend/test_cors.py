import urllib.request
import urllib.error

url = 'http://localhost:8000/api/v1/dashboard/overview?user_id=28bea4f8-fe0f-457c-8df1-d3b1d316da66'
req = urllib.request.Request(url, headers={'Origin': 'https://www.mailos.in'})

print("--- Testing GET ---")
try:
    r = urllib.request.urlopen(req)
    print("Status:", r.getcode())
    print(r.headers)
except urllib.error.HTTPError as e:
    print("Status:", e.code)
    print(e.headers)
