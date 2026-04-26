import time
import requests
import statistics

def benchmark_latency():
    print("🚀 Starting Phase 2: Orchestration Latency Test...")
    url = "http://localhost:8001/api/v1/query"  # Updated endpoint path
    
    questions = [
        "What is the core mission of the SKN project?",
        "How many agents are used in the graph?",
        "What is the role of the Conflict Manager?",
        "Explain the recursive self-correction loop.",
        "What tech stack is used in the neuroplex backend?",
        "How is hybrid retrieval implemented?",
        "What model is used for inference?",
        "Explain the persona-driven synthesis.",
        "How does the Evaluator node work?",
        "What is the purpose of the real-time reasoning trace?",
        "Compare 2024 and 2025 metrics.",
        "How are documents ingested into the system?",
        "What is the difference between Technical and Commercial personas?",
        "Tell me about the glassmorphic frontend.",
        "How does Pinecone help in this architecture?",
        "What are the prerequisites for deployment?",
        "Is the system stateful or stateless?",
        "How are citations formatted in the answer?",
        "What is the role of the Planner node?",
        "How does the system handle conflicting data?"
    ]
    
    latencies = []
    
    print(f"📡 Sending {len(questions)} sequential requests to {url}...")
    
    for i, q in enumerate(questions):
        try:
            start_time = time.perf_counter()
            payload = {
                "query": q,
                "persona": "Technical Expert",
                "language": "English",
                "thread_id": f"latency_test_{i}"
            }
            response = requests.post(url, json=payload, timeout=30)
            end_time = time.perf_counter()
            
            if response.status_code == 200:
                duration = end_time - start_time
                latencies.append(duration)
                print(f"✅ Q{i+1} completed in {duration:.4f}s")
            else:
                print(f"❌ Q{i+1} failed with status {response.status_code}")
        except Exception as e:
            print(f"🔥 Error on Q{i+1}: {e}")

    if not latencies:
        print("⛔ No successful requests to benchmark.")
        return

    avg_latency = statistics.mean(latencies)
    median_latency = statistics.median(latencies)
    p95 = statistics.quantiles(latencies, n=20)[18]  # Approx P95
    
    print("\n" + "="*40)
    print("📊 ORCHESTRATION LATENCY RESULTS")
    print("="*40)
    print(f"Average Latency: {avg_latency:.4f}s")
    print(f"Median Latency: {median_latency:.4f}s")
    print(f"P95 Latency: {p95:.4f}s")
    print("="*40)
    
    if avg_latency <= 1.2:
        print("✅ Resume Claim 'sub-1.2s' is VALID.")
    else:
        # Check if we should recommend async Pinecone or if it's just LLM latency
        print("⚠️  Average Latency > 1.2s. Potential bottleneck detected.")
        print("Recommendation: Implement async_req=True for Pinecone or reduce agent hops.")

if __name__ == "__main__":
    benchmark_latency()
