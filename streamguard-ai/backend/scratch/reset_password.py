import asyncio
import bcrypt
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Database URL from your production env
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def reset_password():
    email = "bsvishwananth@gmail.com"
    new_password = "#vishwananth17"
    
    # Hash the password manualy using bcrypt
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
    
    engine = create_async_engine(DATABASE_URL)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        # Check if user exists
        result = await session.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
        user = result.fetchone()
        
        if user:
            print(f"User {email} found. Updating password...")
            await session.execute(
                text("UPDATE users SET password_hash = :hash WHERE email = :email"),
                {"hash": hashed_password, "email": email}
            )
            await session.commit()
            print("Password updated successfully!")
        else:
            print(f"User {email} not found in database.")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_password())
