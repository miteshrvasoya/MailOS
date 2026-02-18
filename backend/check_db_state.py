import psycopg2
from psycopg2.extras import RealDictCursor

def check_db_state():
    try:
        conn = psycopg2.connect(
            dbname='mailos',
            user='postgres',
            password='root',
            host='localhost',
            port='5432'
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check credentials
        cur.execute('SELECT user_id, updated_at FROM google_credential LIMIT 1')
        cred = cur.fetchone()
        print(f"CRED_UPDATED_AT={cred['updated_at']}")
        
        # Check recent insights
        cur.execute('SELECT COUNT(*) as count FROM emailinsight')
        print(f"TOTAL_INSIGHTS={cur.fetchone()['count']}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db_state()
