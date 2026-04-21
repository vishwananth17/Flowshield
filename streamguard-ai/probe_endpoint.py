import httpx
import asyncio

URLS = [
    "https://flowshieldai-backend-production.up.railway.app/",
    "https://flowshield-backend-ani8.onrender.com/",
    "https://flowshield-backend-ani8.onrender.com/api/v1/"
]

async def probe():
    async with httpx.AsyncClient() as client:
        for url in URLS:
            try:
                print(f"Probing {url}...")
                resp = await client.get(url)
                print(f"Status: {resp.status_code}")
                print(f"Body: {resp.text}\n")
            except Exception as e:
                print(f"Error probing {url}: {e}\n")

if __name__ == "__main__":
    asyncio.run(probe())
