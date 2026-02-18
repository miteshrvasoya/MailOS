import psycopg2
from psycopg2.extras import RealDictCursor

def check_sync_results():
    try:
        conn = psycopg2.connect(
            dbname='mailos',
            user='postgres',
            password='root',
            host='localhost',
            port='5432'
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT COUNT(*) as count FROM emailinsight')
        total_emails = cur.fetchone()['count']
        
        cur.execute('SELECT id, subject, sent_at FROM emailinsight ORDER BY sent_at DESC LIMIT 5')
        recent_emails = cur.fetchall()
        
        cur.close()
        conn.close()
        return total_emails, recent_emails
    except Exception as e:
        print(f"Error: {e}")
        return None, None

if __name__ == "__main__":
    total, recent = check_sync_results()
    if total is not None:
        print(f"TOTAL_EMAILS={total}")
        print("RECENT_EMAILS:")
        for re in recent:
            print(f"- {re['subject']} (ID: {re['id']}, Sent: {re['sent_at']})")
    else:
        print("Failed to fetch results")
