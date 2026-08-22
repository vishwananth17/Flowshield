import sys, os
sys.path.insert(0, os.path.abspath('.'))
import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User
from app.core.security import hash_password

async def main():
    target_email = 'bsvishwananth@gmail.com'
    new_password = '#vishwananth17'
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == target_email))
        user = res.scalar_one_or_none()
        if user:
            user.password_hash = hash_password(new_password)
            user.is_active = True
            await db.commit()
            print(f'Successfully updated password for {target_email} to \"{new_password}\"')
        else:
            print(f'User {target_email} not found')

if __name__ == '__main__':
    asyncio.run(main())
