import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )


def get_vip_leaderboard():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            rank_number,
            honorific_title,
            full_name,
            position_title
        FROM current_vip_leaderboard
        ORDER BY rank_number;
    """)

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return rows