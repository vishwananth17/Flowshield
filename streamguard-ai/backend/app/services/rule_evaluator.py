import operator
from typing import Dict, Any, List

class SafeRuleEvaluator:
    """
    AST-based Risk Rules Logic Tree Evaluator.
    Mitigates OWASP injection risks by avoiding eval() and exec() entirely.
    Supports complex nested trees using logical and/or/not operators.
    """
    
    OPERATORS = {
        "==": operator.eq,
        "!=": operator.ne,
        ">": operator.gt,
        "<": operator.lt,
        ">=": operator.ge,
        "<=": operator.le,
        "in": lambda x, y: x in y if y else False,
        "contains": lambda x, y: y in x if x else False
    }

    def evaluate(self, condition: Any, features: Dict[str, Any]) -> bool:
        """Recursively parses and evaluates logical tree structures against feature dictionary."""
        if not isinstance(condition, dict):
            return False
            
        if "and" in condition:
            return all(self.evaluate(sub, features) for sub in condition["and"])
            
        if "or" in condition:
            return any(self.evaluate(sub, features) for sub in condition["or"])
            
        if "not" in condition:
            return not self.evaluate(condition["not"], features)
            
        # Leaf condition e.g. {"field": "amount_inr", "operator": ">", "value": 50000}
        field = condition.get("field")
        op_str = condition.get("operator")
        target_val = condition.get("value")
        
        if field is None or op_str is None:
            return False
            
        feat_val = features.get(field)
        op_func = self.OPERATORS.get(op_str)
        if not op_func:
            return False
            
        try:
            # Handle float conversions if comparing numeric fields
            if isinstance(feat_val, (int, float)) and isinstance(target_val, (int, float)):
                return op_func(float(feat_val), float(target_val))
            return op_func(feat_val, target_val)
        except Exception:
            return False
