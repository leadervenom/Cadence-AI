from fastapi import FastAPI
from backend.database import get_vip_leaderboard


app = FastAPI(title="Cadence AI Engine API")


@app.get("/")
def root():
    return {
        "message": "Cadence AI Engine backend is running"
    }


@app.get("/api/vips/leaderboard")
def vip_leaderboard():
    rows = get_vip_leaderboard()

    return [
        {
            "rank_number": row[0],
            "honorific_title": row[1],
            "full_name": row[2],
            "position_title": row[3]
        }
        for row in rows
    ]