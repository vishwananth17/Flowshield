"""
FlowShield AI - Realistic Transaction Dataset Generator (10,000+ Records)
Generates high-fidelity, realistic transaction records for test-ready MVP validation,
benchmarking false positive rates, and evaluating multi-scenario fraud detection.
"""

import os
import csv
import random
import argparse
from datetime import datetime, timedelta

def generate_dataset(total_count: int = 10000, fraud_ratio: float = 0.15, output_file: str = "synthetic_transactions_10k.csv"):
    os.makedirs(os.path.dirname(output_file) if os.path.dirname(output_file) else ".", exist_ok=True)

    # 1. Seed pools for realistic customer graph
    num_normal_customers = int(total_count * 0.4)
    normal_customer_ids = [f"cust_{1000 + i}" for i in range(num_normal_customers)]
    customer_device_map = {cid: f"dev_{random.randint(10000, 99999)}" for cid in normal_customer_ids}
    customer_avg_spend = {cid: round(random.uniform(800.0, 6500.0), 2) for cid in normal_customer_ids}

    # BINS & Merchants
    NORMAL_BINS = ["411111", "459123", "524188", "512345", "607000", "652150", "371449"]
    CARDS = ["visa", "mastercard", "rupay", "amex"]
    PAYMENT_CHANNELS = ["upi", "card", "netbanking"]
    
    DOMESTIC_CITIES = [
        ("Mumbai", "103.211.200."),
        ("Bengaluru", "122.161.45."),
        ("Delhi", "182.73.120."),
        ("Hyderabad", "14.139.60."),
        ("Chennai", "157.48.90."),
        ("Pune", "115.112.80.")
    ]

    FOREIGN_CITIES = [
        ("Amsterdam", "NL", "185.220.101.", True),  # Tor exit node cluster
        ("Hanoi", "VN", "113.160.20.", True),       # Datacenter proxy cluster
        ("St. Petersburg", "RU", "194.26.29.", True),
        ("New York", "US", "198.51.100.", False),
        ("London", "GB", "81.149.120.", False)
    ]

    start_date = datetime.utcnow() - timedelta(days=30)
    records = []

    fraud_count = int(total_count * fraud_ratio)
    normal_count = total_count - fraud_count

    print(f"Generating {total_count} transactions ({normal_count} Normal, {fraud_count} Fraud / Suspicious)...")

    # ─────────────────────────────────────────────────────────────
    # A. NORMAL TRANSACTIONS (85%)
    # ─────────────────────────────────────────────────────────────
    for i in range(normal_count):
        txn_id = f"txn_norm_{100000 + i}"
        cid = random.choice(normal_customer_ids)
        did = customer_device_map[cid]
        avg_spend = customer_avg_spend[cid]

        # Natural spend distribution around customer average (log-normal feel)
        spend_factor = random.choice([0.4, 0.7, 1.0, 1.2, 1.8, 2.2])
        amount = round(max(49.0, avg_spend * spend_factor + random.uniform(-50, 50)), 2)

        city, ip_prefix = random.choice(DOMESTIC_CITIES)
        ip = f"{ip_prefix}{random.randint(1, 254)}"
        
        # Timestamp distribution: past 30 days, peak during 9 AM - 11 PM
        days_offset = random.uniform(0, 30)
        hour = random.choices(
            population=list(range(24)),
            weights=[1, 1, 1, 1, 1, 2, 4, 6, 8, 9, 10, 10, 10, 9, 8, 8, 9, 10, 10, 9, 7, 5, 3, 2]
        )[0]
        timestamp = (start_date + timedelta(days=days_offset)).replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))

        records.append({
            "transaction_id": txn_id,
            "timestamp": timestamp.isoformat() + "Z",
            "customer_id": cid,
            "amount": amount,
            "currency": "INR",
            "payment_channel": random.choice(PAYMENT_CHANNELS),
            "card_bin": random.choice(NORMAL_BINS),
            "card_last4": f"{random.randint(1000, 9999)}",
            "ip_address": ip,
            "ip_city": city,
            "ip_country": "IN",
            "billing_country": "IN",
            "device_id": did,
            "is_proxy_or_tor": 0,
            "velocity_10m": random.choice([1, 1, 1, 1, 2]),
            "device_trust_score": random.randint(75, 99),
            "has_3ds": 1 if amount > 2000 else random.choice([0, 1]),
            "scenario_type": "normal_authorized_checkout",
            "is_fraud": 0
        })

    # ─────────────────────────────────────────────────────────────
    # B. SUSPICIOUS & ATTACK TRANSACTIONS (15%)
    # ─────────────────────────────────────────────────────────────
    scenarios = [
        "card_testing_bot",
        "velocity_spike_burst",
        "tor_exit_relay",
        "account_takeover",
        "geo_disparity",
        "high_value_anomaly",
        "failed_payment_flood"
    ]

    for i in range(fraud_count):
        txn_id = f"txn_susp_{500000 + i}"
        scenario = random.choice(scenarios)
        days_offset = random.uniform(0, 30)
        timestamp = start_date + timedelta(days=days_offset)

        if scenario == "card_testing_bot":
            # Micro charges < 100 INR, extreme velocity, proxy
            records.append({
                "transaction_id": txn_id,
                "timestamp": timestamp.isoformat() + "Z",
                "customer_id": f"cust_bot_{random.randint(100, 999)}",
                "amount": round(random.uniform(35.0, 95.0), 2),
                "currency": "INR",
                "payment_channel": "card",
                "card_bin": "411111",
                "card_last4": f"{random.randint(1000, 9999)}",
                "ip_address": f"113.160.20.{random.randint(1, 254)}",
                "ip_city": "Hanoi",
                "ip_country": "VN",
                "billing_country": "IN",
                "device_id": f"dev_cluster_tk881_{random.randint(1, 5)}",
                "is_proxy_or_tor": 1,
                "velocity_10m": random.randint(14, 25),
                "device_trust_score": random.randint(5, 20),
                "has_3ds": 0,
                "scenario_type": "card_testing_bot",
                "is_fraud": 1
            })

        elif scenario == "velocity_spike_burst":
            # 8-15 transactions in 10 minutes from single device hash
            records.append({
                "transaction_id": txn_id,
                "timestamp": timestamp.isoformat() + "Z",
                "customer_id": f"cust_rapid_{random.randint(10, 50)}",
                "amount": round(random.uniform(4000.0, 18000.0), 2),
                "currency": "INR",
                "payment_channel": "card",
                "card_bin": "524188",
                "card_last4": f"{random.randint(1000, 9999)}",
                "ip_address": f"103.211.200.{random.randint(1, 254)}",
                "ip_city": "Mumbai",
                "ip_country": "IN",
                "billing_country": "IN",
                "device_id": f"dev_burst_{random.randint(1, 10)}",
                "is_proxy_or_tor": 0,
                "velocity_10m": random.randint(8, 16),
                "device_trust_score": random.randint(20, 40),
                "has_3ds": 0,
                "scenario_type": "velocity_spike_burst",
                "is_fraud": 1
            })

        elif scenario == "tor_exit_relay":
            # Tor exit node in Netherlands / Russia, cross border mismatch
            city, country, ip_pref, is_proxy = random.choice([FOREIGN_CITIES[0], FOREIGN_CITIES[2]])
            records.append({
                "transaction_id": txn_id,
                "timestamp": timestamp.isoformat() + "Z",
                "customer_id": f"cust_anon_{random.randint(100, 999)}",
                "amount": round(random.uniform(12000.0, 45000.0), 2),
                "currency": "INR",
                "payment_channel": "card",
                "card_bin": "402400",
                "card_last4": f"{random.randint(1000, 9999)}",
                "ip_address": f"{ip_pref}{random.randint(1, 254)}",
                "ip_city": city,
                "ip_country": country,
                "billing_country": "IN",
                "device_id": f"dev_tor_{random.randint(100, 999)}",
                "is_proxy_or_tor": 1,
                "velocity_10m": random.randint(1, 3),
                "device_trust_score": random.randint(10, 25),
                "has_3ds": 0,
                "scenario_type": "tor_exit_relay",
                "is_fraud": 1
            })

        elif scenario == "account_takeover":
            # Known customer, unrecognized new device, 8x-15x normal purchase amount
            cid = random.choice(normal_customer_ids)
            avg = customer_avg_spend[cid]
            records.append({
                "transaction_id": txn_id,
                "timestamp": timestamp.isoformat() + "Z",
                "customer_id": cid,
                "amount": round(avg * random.uniform(8.0, 16.0), 2),
                "currency": "INR",
                "payment_channel": "card",
                "card_bin": "371449",
                "card_last4": f"{random.randint(1000, 9999)}",
                "ip_address": f"182.73.120.{random.randint(1, 254)}",
                "ip_city": "Delhi",
                "ip_country": "IN",
                "billing_country": "IN",
                "device_id": f"dev_unrecognized_{random.randint(10000, 99999)}",
                "is_proxy_or_tor": 0,
                "velocity_10m": random.randint(2, 4),
                "device_trust_score": random.randint(30, 50),
                "has_3ds": 1,
                "scenario_type": "account_takeover",
                "is_fraud": 1
            })

        elif scenario == "high_value_anomaly":
            # Huge purchase > 1,50,000 INR from brand-new customer with low trust score
            records.append({
                "transaction_id": txn_id,
                "timestamp": timestamp.isoformat() + "Z",
                "customer_id": f"cust_whale_{random.randint(100, 999)}",
                "amount": round(random.uniform(145000.0, 320000.0), 2),
                "currency": "INR",
                "payment_channel": "netbanking",
                "card_bin": "512345",
                "card_last4": f"{random.randint(1000, 9999)}",
                "ip_address": f"14.139.60.{random.randint(1, 254)}",
                "ip_city": "Hyderabad",
                "ip_country": "IN",
                "billing_country": "IN",
                "device_id": f"dev_new_{random.randint(10000, 99999)}",
                "is_proxy_or_tor": 0,
                "velocity_10m": 1,
                "device_trust_score": random.randint(20, 45),
                "has_3ds": 1,
                "scenario_type": "high_value_anomaly",
                "is_fraud": 1
            })

        else: # failed_payment_flood or geo_disparity
            records.append({
                "transaction_id": txn_id,
                "timestamp": timestamp.isoformat() + "Z",
                "customer_id": f"cust_multi_{random.randint(100, 999)}",
                "amount": round(random.uniform(5000.0, 22000.0), 2),
                "currency": "INR",
                "payment_channel": "card",
                "card_bin": "411111",
                "card_last4": f"{random.randint(1000, 9999)}",
                "ip_address": f"194.26.29.{random.randint(1, 254)}",
                "ip_city": "St. Petersburg",
                "ip_country": "RU",
                "billing_country": "IN",
                "device_id": f"dev_storm_{random.randint(100, 999)}",
                "is_proxy_or_tor": 1,
                "velocity_10m": random.randint(6, 12),
                "device_trust_score": random.randint(15, 35),
                "has_3ds": 0,
                "scenario_type": "failed_payment_flood",
                "is_fraud": 1
            })

    # Shuffle records so normal and fraud are naturally interleaved chronologically
    records.sort(key=lambda r: r["timestamp"])

    # Write CSV
    fieldnames = list(records[0].keys())
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Successfully generated {len(records)} transactions saved to: {output_file}")
    print(f"Normal: {normal_count} ({normal_count/total_count*100:.1f}%) | Fraud/Suspicious: {fraud_count} ({fraud_count/total_count*100:.1f}%)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate realistic transaction dataset for FlowShield testing")
    parser.add_argument("--count", type=int, default=10000, help="Total transactions to generate (default: 10,000)")
    parser.add_argument("--ratio", type=float, default=0.15, help="Fraud / attack ratio (default: 0.15)")
    parser.add_argument("--out", type=str, default="streamguard-ai/backend/datasets/synthetic_transactions_10k.csv", help="Output CSV path")
    args = parser.parse_args()

    generate_dataset(total_count=args.count, fraud_ratio=args.ratio, output_file=args.out)
