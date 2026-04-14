import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User

async def check_user():
    email = "bsvishwananth@gmail.com"
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            print(f"User found: {user.email}")
            print(f"Hashed password: {user.password_hash}")
            print(f"Is active: {user.is_active}")
        else:
            print(f"User NOT found: {email}")

if __name__ == "__main__":
    asyncio.run(check_user())
