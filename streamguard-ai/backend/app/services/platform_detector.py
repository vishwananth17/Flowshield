import socket
import ipaddress
import urllib.parse
import httpx
import re
import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

def is_private_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified)
    except ValueError:
        return True

async def resolve_hostname_ip(hostname: str) -> str:
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        if addr_info:
            return addr_info[0][4][0]
    except Exception:
        pass
    return ""

async def validate_url_for_ssrf(url: str) -> Tuple[bool, str, str]:
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            return False, "Only HTTP and HTTPS protocols are allowed", ""
        
        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid domain name", ""
            
        ip = await resolve_hostname_ip(hostname)
        if not ip:
            return False, "Could not resolve domain name", ""
            
        if is_private_ip(ip):
            return False, "SSRF protection: Resolves to a private/reserved IP range", ""
            
        normalized = urllib.parse.urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))
        return True, "", normalized
    except Exception as e:
        return False, f"URL validation failed: {str(e)}", ""

async def detect_platform(url: str) -> Dict[str, Any]:
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
        
    is_valid, error_msg, normalized_url = await validate_url_for_ssrf(url)
    if not is_valid:
        return {
            "detected": False,
            "platform": "unknown",
            "confidence": "low",
            "store_name": "",
            "supports_oauth": False,
            "error": error_msg
        }
        
    parsed = urllib.parse.urlparse(normalized_url)
    hostname = parsed.hostname.lower() if parsed.hostname else ""
    
    # 1. Fast checks via domain
    if hostname.endswith(".myshopify.com"):
        store_name = hostname.replace(".myshopify.com", "")
        return {
            "detected": True,
            "platform": "shopify",
            "confidence": "high",
            "store_name": store_name,
            "supports_oauth": True
        }
        
    if hostname == "pages.razorpay.com" or hostname == "rzp.io" or hostname.endswith(".rzp.io"):
        return {
            "detected": True,
            "platform": "razorpay_pages",
            "confidence": "high",
            "store_name": "Razorpay Payment Page",
            "supports_oauth": False
        }
        
    if hostname.endswith("payu.in") or hostname.endswith("payumoney.com"):
        return {
            "detected": True,
            "platform": "payu",
            "confidence": "high",
            "store_name": "PayU Store",
            "supports_oauth": False
        }
        
    if hostname.endswith("instamojo.com") or hostname.endswith("imjo.in"):
        return {
            "detected": True,
            "platform": "instamojo",
            "confidence": "high",
            "store_name": "Instamojo Store",
            "supports_oauth": False
        }
        
    # 2. HTML and response headers checks
    try:
        current_url = normalized_url
        headers_dict = {}
        html_content = ""
        
        async with httpx.AsyncClient(verify=True) as client:
            for _ in range(4): # Limit redirect depth
                is_val, err, current_url = await validate_url_for_ssrf(current_url)
                if not is_val:
                    raise Exception(err)
                    
                response = await client.get(current_url, timeout=5.0, follow_redirects=False)
                if response.status_code in (301, 302, 303, 307, 308):
                    loc = response.headers.get("location")
                    if loc:
                        current_url = urllib.parse.urljoin(current_url, loc)
                        continue
                
                headers_dict = response.headers
                html_content = response.text
                break
                
        # Shopify signals
        if "X-Shopify-Stage" in headers_dict or "X-ShopId" in headers_dict or "X-Shopify-Shop-Api-Call-Limit" in headers_dict:
            return {
                "detected": True,
                "platform": "shopify",
                "confidence": "high",
                "store_name": hostname,
                "supports_oauth": True
            }
            
        if "cdn.shopify.com" in html_content or "Shopify.theme" in html_content:
            return {
                "detected": True,
                "platform": "shopify",
                "confidence": "high",
                "store_name": hostname,
                "supports_oauth": True
            }
            
        # WooCommerce signals
        if "woocommerce" in html_content or "wp-content/plugins/woocommerce" in html_content or re.search(r'name="generator"\s+content="WooCommerce', html_content, re.IGNORECASE):
            return {
                "detected": True,
                "platform": "woocommerce",
                "confidence": "high",
                "store_name": hostname,
                "supports_oauth": False
            }
            
        # Razorpay Payment Pages signals
        if "checkout.razorpay.com" in html_content or "razorpay-payment-button" in html_content or "rzp-button" in html_content:
            return {
                "detected": True,
                "platform": "razorpay_pages",
                "confidence": "high",
                "store_name": hostname,
                "supports_oauth": False
            }
            
        # PayU signals
        if "payu.in" in html_content or "payumoney" in html_content or "pm-checkout" in html_content:
            return {
                "detected": True,
                "platform": "payu",
                "confidence": "medium",
                "store_name": hostname,
                "supports_oauth": False
            }
            
        # Instamojo signals
        if "instamojo" in html_content or "imjo.in" in html_content:
            return {
                "detected": True,
                "platform": "instamojo",
                "confidence": "medium",
                "store_name": hostname,
                "supports_oauth": False
            }
            
    except Exception as e:
        logger.debug(f"Fetch platform detection failed: {str(e)}")
        
    return {
        "detected": False,
        "platform": "unknown",
        "confidence": "low",
        "store_name": "",
        "supports_oauth": False
    }
