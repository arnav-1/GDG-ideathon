import time
import asyncio
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from backend.graph import create_graph

# Load environment variables
load_dotenv(dotenv_path="backend/.env")

async def benchmark_groq_performance():
    print("🚀 Starting Groq Performance Benchmark...")
    
    # Initialize the graph
    # Note: We use the existing graph structure from backend.graph
    app = create_graph()
    
    # Complex query to trigger multiple nodes (Planner -> Retriever -> Synthesizer -> Evaluator)
    inputs = {
        "user_query": "Compare the 2024 and 2025 performance metrics for the SKN project and identify any conflicting data points regarding retrieval latency.",
        "persona": "Technical Expert",
        "language": "English"
    }
    
    config = {"configurable": {"thread_id": "benchmark_test"}}
    
    t0 = time.perf_counter()
    ttft = None
    total_tokens = 0
    full_response = ""
    
    print(f"📡 Sending query to LangGraph...")
    
    # Stream the graph execution to capture TTFT and metadata
    async for event in app.astream(inputs, config=config, stream_mode="updates"):
        current_time = time.perf_counter()
        
        # Capture TTFT when the first node (likely 'planner') finishes
        if ttft is None:
            ttft = current_time - t0
            print(f"⏱️  Time to First Token/Node (TTFT): {ttft:.4f}s")
        
        # Log which node is executing
        for node_name, output in event.items():
            print(f"📍 Node '{node_name}' completed.")
            if node_name == "synthesizer":
                # Extract response text for token estimation
                full_response = output.get("final_answer", "")
            elif node_name == "evaluator":
                 # Extract feedback if helpful
                 pass

    t2 = time.perf_counter()
    total_duration = t2 - t0
    generation_duration = t2 - (t0 + ttft) if ttft else total_duration
    
    # Token estimation:
    # 1. Split by whitespace to get words
    # 2. Add ~30% for sub-tokens/punctuation in Llama (1.3 multiplier)
    words = full_response.split()
    estimated_tokens = len(words) * 1.3
    
    tps = estimated_tokens / generation_duration if generation_duration > 0 and len(words) > 0 else 0
    
    print("\n" + "="*40)
    print("📊 BENCHMARK RESULTS")
    print("="*40)
    print(f"Model: {os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')}")
    print(f"Total Duration: {total_duration:.2f}s")
    print(f"TTFT: {ttft:.4f}s")
    print(f"Estimated Tokens: {estimated_tokens:.0f}")
    print(f"TPS (Tokens Per Second): {tps:.2f}")
    print(f"Full Response Sample: {full_response[:100]}...")
    print("="*40)
    
    if tps > 500:
        print("✅ Resume Claim '500+ TPS' is VALID for this model.")
    else:
        print("⚠️  Resume Claim '500+ TPS' is INVALID. Recommendation: Switch to llama-3.1-8b-instant.")

if __name__ == "__main__":
    asyncio.run(benchmark_groq_performance())
