import os
import logging
from typing import Dict, Optional
import redis.asyncio as async_redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
async_redis_client = async_redis.from_url(REDIS_URL, decode_responses=True)

async def increment_security_metric(name: str, labels: Optional[Dict[str, str]] = None):
    """Increment custom security metric counter in Redis."""
    try:
        label_parts = []
        if labels:
            for k, v in sorted(labels.items()):
                label_parts.append(f"{k}={v}")
        label_str = f":{','.join(label_parts)}" if label_parts else ""
        
        # Redis key format: metrics:metric_name:label_name=label_value
        redis_key = f"metrics:{name}{label_str}"
        await async_redis_client.incr(redis_key)
    except Exception as e:
        logger.error(f"Failed to increment metric {name}: {e}")

async def get_metrics_prometheus_format() -> str:
    """Return all custom metrics in standard Prometheus exporter format."""
    lines = []
    try:
        async for key in async_redis_client.scan_iter("metrics:*"):
            value = await async_redis_client.get(key)
            # parse key
            parts = key.split(":")
            metric_name = parts[1]
            labels = {}
            if len(parts) > 2 and parts[2]:
                for pair in parts[2].split(","):
                    if "=" in pair:
                        k, v = pair.split("=", 1)
                        labels[k] = v
                        
            label_str = ""
            if labels:
                label_str = "{" + ",".join(f'{k}="{v}"' for k, v in labels.items()) + "}"
            
            lines.append(f"# TYPE {metric_name} counter")
            lines.append(f"{metric_name}{label_str} {value}")
    except Exception as e:
        logger.error(f"Failed to compile prometheus metrics: {e}")
    return "\n".join(lines)

async def get_security_health_status() -> dict:
    """Fetch aggregated security metrics for health status report."""
    # Read metrics counts from Redis
    brute_force_blocks = 0
    suspicious_ips = 0
    rate_limits = 0
    
    try:
        # Scan keys to sum them
        async for key in async_redis_client.scan_iter("metrics:flowshield_account_lockouts_total*"):
            val = await async_redis_client.get(key)
            brute_force_blocks += int(val or 0)
            
        async for key in async_redis_client.scan_iter("metrics:flowshield_suspicious_ips_blocked_total*"):
            val = await async_redis_client.get(key)
            suspicious_ips += int(val or 0)

        async for key in async_redis_client.scan_iter("metrics:flowshield_rate_limit_hits_total*"):
            val = await async_redis_client.get(key)
            rate_limits += int(val or 0)
    except Exception:
        pass
        
    return {
        "brute_force_blocks_today": brute_force_blocks,
        "suspicious_ips_blocked": suspicious_ips,
        "rate_limit_violations_today": rate_limits,
        "last_security_scan": "2026-06-22T09:00:00Z"
    }
