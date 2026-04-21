import hashlib

def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

key = "sg_live_BTgUphDPHZu5ekm1fIJhl_cMaVINVkOl"
print(f"Calculated Hash: {hash_api_key(key)}")
