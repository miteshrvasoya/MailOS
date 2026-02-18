import requests
import uuid

# User ID from logs
USER_ID = "caf7f110-d845-4cdb-97a6-091e6d512cd2"

def trigger_classify():
    url = "http://localhost:8000/api/v1/gmail/classify"
    payload = {
        "user_id": USER_ID,
        "limit": 100,
        "mode": "preview"
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    trigger_classify()
