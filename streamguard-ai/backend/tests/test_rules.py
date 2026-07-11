import pytest
from app.services.rule_evaluator import SafeRuleEvaluator

def test_safe_rule_evaluator():
    evaluator = SafeRuleEvaluator()
    
    features = {
        "amount_inr": 75000.00,
        "customer_country": "KP",
        "is_night": 1,
        "is_new_device": 1
    }
    
    # Simple rule: amount > 50000
    rule_1 = {
        "field": "amount_inr",
        "operator": ">",
        "value": 50000
    }
    assert evaluator.evaluate(rule_1, features) is True
    
    # Nested AND rule
    rule_and = {
        "and": [
            {"field": "customer_country", "operator": "==", "value": "KP"},
            {"field": "is_night", "operator": "==", "value": 1}
        ]
    }
    assert evaluator.evaluate(rule_and, features) is True
    
    # Nested OR rule with NOT
    rule_or = {
        "or": [
            {"field": "is_new_device", "operator": "==", "value": 0},
            {"not": {"field": "customer_country", "operator": "==", "value": "IN"}}
        ]
    }
    assert evaluator.evaluate(rule_or, features) is True
