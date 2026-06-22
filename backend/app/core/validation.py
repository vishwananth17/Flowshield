import re
import os
import pydantic
from html import escape
from typing import Optional, Dict, Union, Literal

# Dynamic Pydantic V1/V2 compatibility layer
if pydantic.__version__.startswith("2"):
    from pydantic.v1 import BaseModel, validator, constr, confloat, conint
else:
    from pydantic import BaseModel, validator, constr, confloat, conint

# PII Detection (Layer 5.2)
PII_PATTERNS = {
    "aadhaar": r'\b[2-9]\d{11}\b',
    "pan": r'\b[A-Z]{5}[0-9]{4}[A-Z]\b',
    "passport": r'\b[A-Z]{1,2}[0-9]{7}\b',
    "phone": r'\b[6-9]\d{9}\b',
    "email_in_id": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
}

def detect_pii(value: str, field_name: str) -> None:
    if not isinstance(value, str):
        return
    for pii_type, pattern in PII_PATTERNS.items():
        if re.search(pattern, value):
            try:
                import asyncio
                from app.core.monitoring import increment_security_metric
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(increment_security_metric("flowshield_pii_detected_total", {"field": field_name}))
                else:
                    asyncio.run(increment_security_metric("flowshield_pii_detected_total", {"field": field_name}))
            except Exception:
                pass
            raise ValueError(
                f"Field '{field_name}' appears to contain "
                f"{pii_type} — do not send PII in this field. "
                f"See docs: flowshieldai.com/docs#pii-policy"
            )

# XSS Prevention (Layer 5.4)
def sanitize_string(s: str) -> str:
    return escape(s.strip())

# Path Traversal Prevention (Layer 5.5)
def safe_filename(filename: str) -> str:
    filename = os.path.basename(filename)
    filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
    return filename

# JSON Depth Limiting (Layer 5.6)
def check_json_depth(data, depth=0, max_depth=10):
    if depth > max_depth:
        raise ValueError("JSON depth limit exceeded")
    if isinstance(data, dict):
        for k, v in data.items():
            check_json_depth(v, depth + 1, max_depth)
    elif isinstance(data, list):
        for item in data:
            check_json_depth(item, depth + 1, max_depth)

# Pydantic Schema Hardening (Layer 5.1)
class MerchantInput(BaseModel):
    id: Optional[constr(max_length=128)] = None
    name: constr(min_length=1, max_length=255)
    category: Optional[constr(regex=r'^\d{4}$')] = None

    @validator("name")
    def sanitize_name(cls, v):
        # Sanitize and detect PII
        sanitized = sanitize_string(v)
        detect_pii(sanitized, "merchant.name")
        return sanitized

class CardInput(BaseModel):
    number_masked: Optional[constr(max_length=19)] = None
    expiry: Optional[constr(regex=r'^(0[1-9]|1[0-2])\/\d{2,4}$')] = None

class CustomerInput(BaseModel):
    id: constr(max_length=128)
    ip: Optional[str] = None
    country: Optional[constr(regex=r'^[A-Z]{2}$')] = None
    city: Optional[constr(max_length=128)] = None

    @validator("id")
    def validate_customer_id(cls, v):
        detect_pii(v, "customer.id")
        return sanitize_string(v)

    @validator("ip")
    def validate_ip(cls, v):
        if v:
            import ipaddress
            try:
                ipaddress.ip_address(v)
            except ValueError:
                raise ValueError("Invalid IP address")
        return v

class TransactionAnalyzeRequest(BaseModel):
    transaction_id: Optional[constr(
        max_length=128,
        regex=r'^[a-zA-Z0-9_\-]+$'
    )] = None

    amount: confloat(ge=0.01, le=10_000_000)
    currency: constr(regex=r'^[A-Z]{3}$')
    merchant: Optional[MerchantInput] = None
    card: Optional[CardInput] = None
    customer: Optional[CustomerInput] = None

    channel: Optional[Literal[
        "web", "mobile", "pos", "api", "ivr"
    ]] = "web"

    metadata: Optional[Dict[str, Union[str, int, float]]] = {}

    @validator("transaction_id")
    def validate_tx_id(cls, v):
        if v:
            detect_pii(v, "transaction_id")
            return sanitize_string(v)
        return v

    @validator("metadata")
    def validate_metadata(cls, v):
        if not v:
            return v
        if len(v) > 20:
            raise ValueError("Max 20 metadata keys")
        for key, val in v.items():
            if len(str(key)) > 64:
                raise ValueError("Metadata key too long")
            if len(str(val)) > 256:
                raise ValueError("Metadata value too long")
            
            # Detect PII and sanitize values if string
            if isinstance(val, str):
                sanitized_val = sanitize_string(val)
                detect_pii(sanitized_val, f"metadata[{key}]")
                v[key] = sanitized_val
        return v

# SQL Injection Prevention Pattern Detector (Layer 5.3)
SQLI_PATTERNS = [
    r'(?i)\b(union|select|insert|update|delete|drop|alter|create|truncate|rename)\b',
    r'(?i)(exec|execute|sp_executesql)\b',
    r'--|\/\*|\*\/',
    r'(?i)\b(or|and)\b\s+\d+\s*=\s*\d+'
]

def detect_sql_injection(input_str: str) -> bool:
    if not isinstance(input_str, str):
        return False
    for pattern in SQLI_PATTERNS:
        if re.search(pattern, input_str):
            return True
    return False
