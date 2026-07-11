import psycopg2

db_url = "postgresql://postgres.wtlzvrnxkzifdzxfqcbu:vishwananth17@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

def main():
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        print("Updating password for bsvishwananth@gmail.com in auth.users with 10 rounds salt...")
        cur.execute("""
            UPDATE auth.users
            SET encrypted_password = crypt('#vishwananth17', gen_salt('bf', 10))
            WHERE email = 'bsvishwananth@gmail.com';
        """)
        conn.commit()
        print("Password updated successfully!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    main()
