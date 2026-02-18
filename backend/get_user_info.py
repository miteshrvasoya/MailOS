import psycopg2
from psycopg2.extras import RealDictCursor

def get_user():
    try:
        conn = psycopg2.connect(
            dbname='mailos',
            user='postgres',
            password='root',
            host='localhost',
            port='5432'
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT id, email, last_history_id FROM "user" LIMIT 1')
        user = cur.fetchone()
        cur.close()
        conn.close()
        return user
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return None

if __name__ == "__main__":
    user = get_user()
    if user:
        print(f"USER_ID={user['id']}")
        print(f"EMAIL={user['email']}")
        print(f"LAST_HISTORY_ID={user['last_history_id']}")
    else:
        print("No user found")
