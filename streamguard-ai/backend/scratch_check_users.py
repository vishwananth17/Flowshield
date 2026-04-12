
import asyncio
import sys
import os

# Add the backend directory to path
sys.path.append(os.getcwd())

from app.core.dependencies import get_db
from app.models.user import User
from sqlalchemy import select

async def check():
    iter_db = get_db()
    db = await anext(iter_db)
    try:
        result = await db.execute(select(User.email))
        emails = [r[0] for r in result.all()]
        print("REGISTERED_EMAILS_START")
        for email in emails:
            print(email)
        print("REGISTERED_EMAILS_END")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(check())
