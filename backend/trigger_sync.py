import requests
import json

def trigger_sync(user_id):
    url = "http://localhost:8000/api/v1/gmail/sync"
    payload = {
        "user_id": user_id,
        "mode": "full",
        "limit": 10
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # USER_ID=caf7f110-d845-4cdb-97a6-091e6d512cd2
    trigger_sync("caf7f110-d845-4cdb-97a6-091e6d512cd2")
