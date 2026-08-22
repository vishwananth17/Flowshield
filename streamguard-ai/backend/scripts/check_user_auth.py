import sys, os
sys.path.insert(0, os.path.abspath('.'))
import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User
from app.core.security import verify_password, hash_password

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == 'bsvishwananth@gmail.com'))
        user = res.scalar_one_or_none()
        if user:
            print(f'User found: {user.email}')
            print(f'Hash: {user.password_hash}')
            test_passwords = ['#vishwananth17', 'vishwananth17', 'password', 'password123', 'admin', 'admin123', 'Flowshield@123', 'Vishwananth@17', '12345678', 'StrongPassword123!']
            for p in test_passwords:
                matched = verify_password(p, user.password_hash)
                print(f'Password \"{p}\": matched={matched}')
        else:
            print('User not found')

if __name__ == '__main__':
    asyncio.run(main())
