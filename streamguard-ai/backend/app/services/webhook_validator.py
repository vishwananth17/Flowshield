import socket
import ipaddress
import urllib.parse
import logging

logger = logging.getLogger(__name__)

def is_safe_webhook_url(url: str) -> bool:
    """
    Validates a URL to prevent Server-Side Request Forgery (SSRF).
    Ensures the domain resolves only to public, non-reserved IP addresses.
    """
    try:
        parsed_url = urllib.parse.urlparse(url)
        if parsed_url.scheme not in ("http", "https"):
            logger.warning(f"SSRF Check: Invalid scheme '{parsed_url.scheme}' in URL '{url}'")
            return False
            
        hostname = parsed_url.hostname
        if not hostname:
            logger.warning(f"SSRF Check: Missing hostname in URL '{url}'")
            return False
            
        # 1. Resolve host to all associated IP addresses
        # socket.getaddrinfo returns a list of 5-tuples. The 5th element is (sockaddr) which contains the IP.
        try:
            addr_info = socket.getaddrinfo(hostname, None)
        except socket.gaierror as e:
            logger.warning(f"SSRF Check: Hostname '{hostname}' could not be resolved: {e}")
            return False
            
        resolved_ips = []
        for info in addr_info:
            ip = info[4][0]
            resolved_ips.append(ip)
            
        # Remove duplicates
        resolved_ips = list(set(resolved_ips))
        
        # 2. Check each IP address against disallowed ranges
        for ip_str in resolved_ips:
            try:
                ip = ipaddress.ip_address(ip_str)
            except ValueError:
                logger.warning(f"SSRF Check: Invalid IP format '{ip_str}' resolved from '{hostname}'")
                return False
                
            # Disallowed private and reserved ranges
            is_disallowed = (
                ip.is_loopback or      # 127.0.0.0/8, ::1 (loopback interfaces)
                ip.is_private or       # 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7 (RFC 1918 & RFC 4193)
                ip.is_link_local or    # 169.254.0.0/16, fe80::/10 (Link-Local / AWS IMDS)
                ip.is_multicast or     # 224.0.0.0/4, ff00::/8 (Multicast)
                ip.is_unspecified or   # 0.0.0.0, ::
                ip.is_reserved         # RFC 1112 / RFC 3513
            )
            
            if is_disallowed:
                logger.warning(f"SSRF Check: Blocking URL '{url}' because it resolves to reserved/private IP '{ip_str}'")
                return False
                
        return True
    except Exception as e:
        logger.error(f"SSRF Check: Error validating URL '{url}': {e}")
        return False
