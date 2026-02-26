import urllib.request
import urllib.error

req = urllib.request.Request('http://localhost:8000/api/v1/gmail/sync?user_id=caf7f110-d845-4cdb-97a6-091e6d512cd2', data=b'{}', headers={'Content-Type': 'application/json'})
try:
    r = urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    with open("error_trace.html", "wb") as f:
        f.write(e.read())
