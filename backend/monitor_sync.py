import requests
import time

def monitor_sync(user_id):
    url = f"http://localhost:8000/api/v1/gmail/sync/status/{user_id}"
    for i in range(10):
        try:
            response = requests.get(url)
            print(f"Status {i+1}: {response.json()}")
        except Exception as e:
            print(f"Error: {e}")
        time.sleep(1)

if __name__ == "__main__":
    # USER_ID=caf7f110-d845-4cdb-97a6-091e6d512cd2
    monitor_sync("caf7f110-d845-4cdb-97a6-091e6d512cd2")
