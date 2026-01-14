from flask import Flask, request, jsonify, send_from_directory
import json
import os
import random
import threading
import time

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
FEED_PATH = os.path.join(DATA_DIR, "feed.json")

lock = threading.Lock()

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

if not os.path.exists(FEED_PATH):
    with open(FEED_PATH, "w", encoding="utf-8") as f:
        json.dump([], f)

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)

@app.route("/api/feed", methods=["GET"])
def get_feed():
    with lock:
        try:
            with open(FEED_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
        except:
            data = []
    return jsonify(data)

@app.route("/api/roll", methods=["POST"])
def roll():
    payload = request.get_json(force=True)

    player   = (payload.get("player") or "—").strip()
    rollKind = (payload.get("rollKind") or "Rolagem").strip()
    lines    = payload.get("rolls") or []

    result_lines = []
    total_sum = 0

    for l in lines:
        diceCount = int(l.get("diceCount") or 1)
        diceType  = int(l.get("diceType") or 20)
        mod       = int(l.get("mod") or 0)

        # validações
        if diceCount < 1:
            diceCount = 1
        if diceCount > 100:
            diceCount = 100
        allowed = [2,3,4,6,8,10,12,20]
        if diceType not in allowed:
            diceType = 20

        rolls = [random.randint(1, diceType) for _ in range(diceCount)]
        line_total = sum(rolls) + mod
        total_sum += line_total

        result_lines.append({
            "dice": f"{diceCount}d{diceType}",
            "rolls": rolls,
            "mod": mod,
            "line_total": line_total
        })

    entry = {
        "player": player,
        "rollKind": rollKind,
        "lines": result_lines,
        "total": total_sum,
        "time": int(time.time())
    }

    with lock:
        try:
            with open(FEED_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
        except:
            data = []

        if not isinstance(data, list):
            data = []

        data.append(entry)

        with open(FEED_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    return jsonify(entry)

if __name__ == "__main__":
    app.run(debug=True)
