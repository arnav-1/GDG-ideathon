import asyncio
import aiohttp
import time
import statistics

async def send_request(session, url, thread_id):
    payload = {
        "query": "Verify the system concurrency limits.",
        "persona": "Technical Expert",
        "language": "English",
        "thread_id": thread_id
    }
    start = time.perf_counter()
    try:
        async with session.post(url, json=payload, timeout=60) as response:
            await response.text()
            end = time.perf_counter()
            return end - start, response.status
    except Exception as e:
        return None, str(e)

async def test_concurrency(concurrency_level):
    url = "http://localhost:8001/api/v1/query"
    print(f"\n🚀 Testing Concurrency Level: {concurrency_level} threads...")
    
    async with aiohttp.ClientSession() as session:
        tasks = [send_request(session, url, f"mem_test_{concurrency_level}_{i}") for i in range(concurrency_level)]
        start_batch = time.perf_counter()
        results = await asyncio.gather(*tasks)
        end_batch = time.perf_counter()
        
    durations = [r[0] for r in results if r[0] is not None]
    errors = [r[1] for r in results if r[0] is None]
    
    if durations:
        avg = statistics.mean(durations)
        print(f"📊 Results for {concurrency_level} concurrent requests:")
        print(f"   Avg Response Time: {avg:.4f}s")
        print(f"   Total Batch Time: {end_batch - start_batch:.4f}s")
        print(f"   Success Rate: {len(durations)}/{concurrency_level}")
    else:
        print(f"❌ All {concurrency_level} requests failed.")
        
    if errors:
        print(f"   Errors: {set(errors)}")

async def run_memory_benchmark():
    print("🧠 Starting Phase 3: Stateful Concurrency Limit Test")
    print("💡 Please monitor Task Manager / htop for RAM usage spikes.")
    
    levels = [10, 25, 50]
    
    for level in levels:
        await test_concurrency(level)
        print("⏳ Waiting 2s for cooldown...")
        await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(run_memory_benchmark())
