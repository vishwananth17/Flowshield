import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def get_active_key():
    async with AsyncSessionLocal() as session:
        print("Checking active API keys...")
        result = await session.execute(text("SELECT key, name FROM api_keys WHERE is_active = true LIMIT 5"))
        keys = result.all()
        if not keys:
            print("No active keys found. Checking all keys...")
            result = await session.execute(text("SELECT key, name FROM api_keys LIMIT 5"))
            keys = result.all()
        
        for key, name in keys:
            print(f"Key Found: {key} (Name: {name})")

if __name__ == "__main__":
    asyncio.run(get_active_key())
