"""
Unit & Acceptance Tests for Flowshield AI Probability Engine, Decision Engine, and Feedback Learning
Tests all 6 core scenarios specified in the acceptance criteria.
"""

import sys
import os
import unittest
from decimal import Decimal

# Ensure backend path is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.signal_collector import SignalCollector
from app.services.probability_engine import ProbabilityEngine
from app.services.decision_engine import DecisionEngine


class MockRedis:
    def __init__(self):
        self.data = {}
        self.sets = {}
        self.hashes = {}
        self.lists = {}

    async def get(self, k):
        return self.data.get(k)

    async def set(self, k, v, ex=None):
        self.data[k] = v

    async def incr(self, k):
        val = int(self.data.get(k, 0)) + 1
        self.data[k] = str(val)
        return val

    async def expire(self, k, ttl):
        pass

    async def sadd(self, k, *members):
        if k not in self.sets:
            self.sets[k] = set()
        for m in members:
            self.sets[k].add(m)
        return len(members)

    async def scard(self, k):
        return len(self.sets.get(k, set()))

    async def sismember(self, k, member):
        return member in self.sets.get(k, set())

    async def hset(self, k, mapping):
        if k not in self.hashes:
            self.hashes[k] = {}
        self.hashes[k].update(mapping)

    async def hgetall(self, k):
        return self.hashes.get(k, {})

    async def lpush(self, k, val):
        if k not in self.lists:
            self.lists[k] = []
        self.lists[k].insert(0, val)


class TestProbabilityAndDecisionEngine(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        self.mock_redis = MockRedis()
        self.signal_collector = SignalCollector(self.mock_redis)
        self.prob_engine = ProbabilityEngine()
        self.decision_engine = DecisionEngine()

    async def test_scenario_1_spouse_card_false_positive_trap(self):
        """
        Scenario 1 — The spouse's card (false positive trap):
        Card issuing: Canada, IP: Spain, Billing: India, Name mismatch: moderate,
        Card history with merchant: 8 prior transactions.
        Expected: APPROVE (history overrides weak signals).
        """
        raw_tx = {
            "amount": 2500.0,
            "customer_id": "cust_spouse_01",
            "customer_name": "Priya Sharma",
            "card_holder_name": "Rajesh Sharma",
            "card_issuing_country": "CA",
            "billing_country": "IN",
            "ip_country": "ES",
            "card_history_with_merchant": 8,
            "three_ds_result": "not_enrolled"
        }

        collected = await self.signal_collector.collect_signals(raw_tx)
        signals = collected["signals"]

        # Card history should be 8
        self.assertEqual(signals["card_history_with_merchant"], 8)

        prob_res = self.prob_engine.compute_risk_score(signals)
        decision_res = self.decision_engine.decide(prob_res, signals)

        # Risk score must be <= 0.35 and decision must be "approve"
        self.assertLessEqual(prob_res["risk_score"], 0.35)
        self.assertEqual(decision_res["decision"], "approve")
        self.assertEqual(decision_res["tier"], "low_risk")

    async def test_scenario_2_vpn_user_false_positive_trap(self):
        """
        Scenario 2 — The VPN user (false positive trap):
        is_vpn: true, card_history: 3 prior transactions,
        amount: 1.2x average, 3DS: authenticated.
        Expected: APPROVE (3DS + history + normal amount).
        """
        raw_tx = {
            "amount": 1200.0,
            "account_avg_spend_30d": 1000.0,
            "customer_id": "cust_vpn_02",
            "is_vpn": True,
            "card_history_with_merchant": 3,
            "three_ds_result": "authenticated",
            "known_device": True
        }

        collected = await self.signal_collector.collect_signals(raw_tx)
        signals = collected["signals"]

        prob_res = self.prob_engine.compute_risk_score(signals)
        decision_res = self.decision_engine.decide(prob_res, signals)

        self.assertLessEqual(prob_res["risk_score"], 0.35)
        self.assertEqual(decision_res["decision"], "approve")

    async def test_scenario_3_clear_card_testing_ring(self):
        """
        Scenario 3 — Clear card testing:
        card_multi_account_use: 6 accounts in 10 min,
        velocity_card_1min: 22, amount: ₹1.
        Expected: BLOCK (hard rule triggers immediately).
        """
        raw_tx = {
            "amount": 1.0,
            "customer_id": "cust_bot_test",
            "card_multi_account_use": 6,
            "velocity_card_1min": 22
        }

        collected = await self.signal_collector.collect_signals(raw_tx)
        signals = collected["signals"]

        prob_res = self.prob_engine.compute_risk_score(signals)
        decision_res = self.decision_engine.decide(prob_res, signals)

        # Both hard rules (multi-account > 4 and velocity > 15) trigger immediate BLOCK
        self.assertEqual(decision_res["decision"], "block")
        self.assertEqual(decision_res["tier"], "hard_rule")

    async def test_scenario_4_account_takeover(self):
        """
        Scenario 4 — Account takeover signal:
        known_device: false (new device), days_since_last_transaction: 180,
        amount_vs_average: 12x, password_reset_before_purchase: true.
        Expected: BLOCK or CHALLENGE (score > 0.72).
        """
        raw_tx = {
            "amount": 60000.0,
            "account_avg_spend_30d": 5000.0,
            "known_device": False,
            "days_since_last_transaction": 180,
            "password_reset_before_purchase": True,
            "three_ds_result": "failed"
        }

        collected = await self.signal_collector.collect_signals(raw_tx)
        signals = collected["signals"]

        prob_res = self.prob_engine.compute_risk_score(signals)
        decision_res = self.decision_engine.decide(prob_res, signals)

        self.assertGreater(prob_res["risk_score"], 0.70)
        self.assertIn(decision_res["decision"], ["challenge", "block"])

    async def test_scenario_5_legitimate_large_first_purchase(self):
        """
        Scenario 5 — Legitimate large first purchase:
        account_age_days: 1, amount: ₹25,000, 3DS: authenticated,
        device: new, IP: matches billing.
        Expected: CHALLENGE with 3DS or APPROVE (not flat block).
        """
        raw_tx = {
            "amount": 25000.0,
            "account_avg_spend_30d": 1000.0,
            "account_age_days": 1,
            "three_ds_result": "authenticated",
            "known_device": False,
            "billing_country": "IN",
            "ip_country": "IN"
        }

        collected = await self.signal_collector.collect_signals(raw_tx)
        signals = collected["signals"]

        prob_res = self.prob_engine.compute_risk_score(signals)
        decision_res = self.decision_engine.decide(prob_res, signals)

        # Must NOT be blocked; 3DS authentication mitigates the new-account spike
        self.assertNotEqual(decision_res["decision"], "block")

    async def test_scenario_6_post_checkout_learning(self):
        """
        Scenario 6 — Post-checkout learning:
        Outcome reported with feedback_label=1 -> updates customer risk profile and network radar.
        """
        from app.workers.feedback_learner import FeedbackLearner

        learner = FeedbackLearner(self.mock_redis)

        # Update customer profile with confirmed fraud
        profile = await learner.update_customer_risk_profile(
            customer_id="cust_bad_actor_99",
            org_id="org_test_01",
            label=1
        )

        self.assertEqual(profile["fraud_count"], "1")
        self.assertEqual(profile["dispute_count"], "1")
        self.assertGreater(float(profile["fraud_rate"]), 0.0)

        # Confirm another 2 frauds to test automatic blacklist promotion (>= 3)
        await learner.update_customer_risk_profile("cust_bad_actor_99", "org_test_01", 1)
        await learner.update_customer_risk_profile("cust_bad_actor_99", "org_test_01", 1)

        is_high_risk = await self.mock_redis.sismember("high_risk_customers:org_test_01", "cust_bad_actor_99")
        self.assertTrue(is_high_risk)

    async def test_dispute_feedback_integration(self):
        """
        Verify that dispute outcomes (chargeback_received on lost, fraud_cleared on won)
        dynamically adjust customer risk profiles via FeedbackLearner.
        """
        from app.workers.feedback_learner import FeedbackLearner
        from app.models.transaction_outcome import TransactionOutcome
        from datetime import datetime, UTC
        from unittest.mock import MagicMock
        import uuid

        learner = FeedbackLearner(self.mock_redis)

        mock_tx = MagicMock()
        mock_tx.customer_id = "cust_dispute_01"
        mock_tx.signals_json = {}
        mock_tx.created_at = datetime.now(UTC)
        mock_tx.decision = "allow"
        mock_tx.risk_score = Decimal("0.2500")

        test_org_id = uuid.uuid4()

        # 1. Dispute lost (chargeback confirmed -> label=1)
        lost_outcome = TransactionOutcome(
            id=uuid.uuid4(),
            transaction_id=uuid.uuid4(),
            org_id=test_org_id,
            original_decision="allow",
            original_risk_score=Decimal("0.2500"),
            outcome_type="chargeback_received",
            outcome_date=datetime.now(UTC),
            days_after_transaction=14,
            outcome_source="dispute_resolution",
            feedback_label=1,
            notes="Dispute lost by merchant."
        )

        res_lost = await learner.process_new_outcome(
            outcome=lost_outcome,
            db=None,
            tx=mock_tx
        )
        self.assertEqual(res_lost["status"], "processed")
        self.assertTrue(res_lost["is_fraud"])
        self.assertIn("customer_profile", res_lost)
        self.assertEqual(res_lost["customer_profile"]["fraud_count"], "1")

        # 2. Dispute won (merchant defended successfully -> label=0)
        won_outcome = TransactionOutcome(
            id=uuid.uuid4(),
            transaction_id=uuid.uuid4(),
            org_id=test_org_id,
            original_decision="challenge",
            original_risk_score=Decimal("0.5500"),
            outcome_type="fraud_cleared",
            outcome_date=datetime.now(UTC),
            days_after_transaction=10,
            outcome_source="dispute_resolution",
            feedback_label=0,
            notes="Dispute won by merchant with delivery proof."
        )

        res_won = await learner.process_new_outcome(
            outcome=won_outcome,
            db=None,
            tx=mock_tx
        )
        self.assertEqual(res_won["status"], "processed")
        self.assertFalse(res_won["is_fraud"])
        self.assertIn("customer_profile", res_won)
        self.assertEqual(res_won["customer_profile"]["fraud_count"], "1")  # preserved from prior
        self.assertEqual(res_won["customer_profile"]["total_transactions"], "3")


if __name__ == "__main__":
    unittest.main()
