import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class FieldEncryption:
    def __init__(self, secret_key: str):
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"flowshield_salt_v1",
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(
            kdf.derive(secret_key.encode())
        )
        self.cipher = Fernet(key)

    def encrypt(self, value: str) -> str:
        if not value:
            return ""
        return self.cipher.encrypt(
            value.encode()
        ).decode()

    def decrypt(self, encrypted: str) -> str:
        if not encrypted:
            return ""
        return self.cipher.decrypt(
            encrypted.encode()
        ).decode()

# Initialize instance with DB encryption key if available
DB_ENCRYPTION_KEY = os.getenv("DB_ENCRYPTION_KEY", "fallback_dev_db_encryption_key_32_chars!!")
field_encryption = FieldEncryption(DB_ENCRYPTION_KEY)
