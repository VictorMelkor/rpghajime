from flask import Flask, request, jsonify, render_template, abort
from supabase import create_client
import os
import random
import time

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
ROLL_TOKEN   = os.getenv("ROLL_TOKEN")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)

# Páginas HTML
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/<page>")
def page(page):
    try:
        return render_template(f"{page}.html")
    except:
        abort(404)

# API
@app.route("/api/feed", methods=["GET"])
def get_feed():
    limit = int(request.args.get("limit", 50))
    after = request.args.get("after")

    q = supabase.table("feed").select("*").order("id", desc=True).limit(limit)

    if after:
        q = q.gt("id", int(after))

    res = q.execute()
    return jsonify(res.data or [])

@app.route("/api/roll", methods=["POST"])
def roll():
    token = request.headers.get("X-ROLL-TOKEN")
    if token != ROLL_TOKEN:
        return jsonify({"error": "unauthorized"}), 403

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

        if diceCount < 1:
            diceCount = 1
        if diceCount > 100:
            diceCount = 100

        allowed = [2, 3, 4, 6, 8, 10, 12, 20]
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
        "roll_kind": rollKind,
        "lines": result_lines,
        "total": total_sum,
        "time": int(time.time())
    }

    res = supabase.table("feed").insert(entry).execute()

    if res.error:
        return jsonify({"error": "db_error"}), 500

    return jsonify(entry)

if __name__ == "__main__":
    app.run(debug=True)
