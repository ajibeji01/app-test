from flask import Flask, request, jsonify
import json
import random
import os

app = Flask(__name__)

# Load user data
DATA_FILE = "passwords.json"
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump({}, f)

def load_data():
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

@app.route("/")
def home():
    return "Welcome to the Feinbucks System!"

@app.route("/signup", methods=["POST"])
def signup():
    data = load_data()
    req = request.json
    username = req.get("username")
    password = req.get("password")

    if username in data:
        return jsonify({"error": "Username already taken"}), 400

    data[username] = {"Password": password, "Notes": "", "Feinbucks": "0"}
    save_data(data)
    return jsonify({"message": "Signup successful"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = load_data()
    req = request.json
    username = req.get("username")
    password = req.get("password")

    if username not in data or data[username]["Password"] != password:
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({"message": "Login successful", "Feinbucks": data[username]["Feinbucks"], "Notes": data[username]["Notes"]})

@app.route("/balance/<username>", methods=["GET"])
def get_balance(username):
    data = load_data()
    if username not in data:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"Feinbucks": data[username]["Feinbucks"]})

@app.route("/notes/<username>", methods=["GET", "POST"])
def manage_notes(username):
    data = load_data()
    if username not in data:
        return jsonify({"error": "User not found"}), 404

    if request.method == "GET":
        return jsonify({"Notes": data[username]["Notes"]})
    
    elif request.method == "POST":
        req = request.json
        new_notes = req.get("notes", "")
        data[username]["Notes"] = new_notes
        save_data(data)
        return jsonify({"message": "Notes updated successfully"})

@app.route("/gamble/<username>", methods=["POST"])
def gamble(username):
    data = load_data()
    if username not in data:
        return jsonify({"error": "User not found"}), 404

    req = request.json
    bet = float(req.get("bet", 0))
    feinbucks = float(data[username]["Feinbucks"])

    if feinbucks < bet:
        return jsonify({"error": "Insufficient Feinbucks"}), 400

    data[username]["Feinbucks"] = str(feinbucks - bet)
    result = random.choices([0, 1.2, 1.5, 2], weights=[40, 30, 20, 10])[0]
    winnings = bet * result
    data[username]["Feinbucks"] = str(float(data[username]["Feinbucks"]) + winnings)
    save_data(data)

    return jsonify({"result": result, "winnings": winnings, "new_balance": data[username]["Feinbucks"]})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
