import sqlite3
import json

DB_FILE = "cdi.db"


def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS workers (
            id TEXT PRIMARY KEY,
            category TEXT,
            role TEXT,
            pincode TEXT,
            device_id TEXT,
            upi TEXT,
            platform TEXT,
            reliability_score REAL,
            consent_weather INTEGER DEFAULT 1,
            consent_gps INTEGER DEFAULT 1,
            consent_orders INTEGER DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS premium_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            worker_id TEXT,
            week_start TEXT,
            premium_amount REAL,
            risk_score REAL,
            shap_breakdown TEXT
        );
        CREATE TABLE IF NOT EXISTS events (
            event_id TEXT PRIMARY KEY,
            worker_id TEXT,
            start_time TEXT,
            end_time TEXT,
            total_payout REAL,
            status TEXT
        );
        CREATE TABLE IF NOT EXISTS event_intervals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT,
            timestamp TEXT,
            state TEXT,
            raw_cdi REAL,
            final_cdi REAL,
            trust_score REAL,
            trust_status TEXT,
            exclusion_flag TEXT,
            payout_increment REAL,
            accumulated REAL,
            rainfall REAL,
            wind_speed REAL,
            visibility REAL
        );
        CREATE TABLE IF NOT EXISTS exclusion_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            worker_id TEXT,
            timestamp TEXT,
            exclusion_type TEXT,
            reason TEXT,
            action TEXT
        );
    """)
    conn.commit()
    conn.close()


def log_exclusion(worker_id, ts, exc_type, reason, action):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        "INSERT INTO exclusion_logs (worker_id, timestamp, exclusion_type, reason, action) VALUES (?,?,?,?,?)",
        (worker_id, ts, exc_type, reason, action),
    )
    conn.commit()
    conn.close()


def log_premium(worker_id, amt, risk, shap_dict):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        "INSERT INTO premium_history (worker_id, premium_amount, risk_score, shap_breakdown) VALUES (?,?,?,?)",
        (worker_id, amt, risk, json.dumps(shap_dict)),
    )
    conn.commit()
    conn.close()
