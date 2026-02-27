"""Test querying the dashboard stats directly with a real user to see if the DB fails."""
from app.api.v1.endpoints.dashboard import _compute_dashboard_stats
from app.db.session import engine
from sqlmodel import Session, select
from app.models.user import User
from app.models.email import EmailInsight
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import json

def test():
    with Session(engine) as db:
        user = db.exec(select(User).limit(1)).first()
        if not user:
            print("No users in DB!")
            return
        
        print(f"Testing real user ID: {user.id}")
        
        try:
            url = f"http://localhost:8000/api/v1/dashboard/overview?user_id={user.id}"
            req = Request(url, headers={"Origin": "https://www.mailos.in"})
            r = urlopen(req)
            print("SUCCESS 200")
            print(json.loads(r.read())["stats"])
        except HTTPError as e:
            print(f"FAILED {e.code}")
            print(e.read().decode())

if __name__ == "__main__":
    test()
