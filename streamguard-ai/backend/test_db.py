import asyncio
import asyncpg

async def test():
    try:
        conn = await asyncpg.connect(
            'postgresql://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require'
        )
        result = await conn.fetchval('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = $1', 'public')
        print(f'PASS: Tables found: {result}')
        await conn.close()
    except Exception as e:
        print(f'FAIL: {e}')

if __name__ == "__main__":
    asyncio.run(test())
