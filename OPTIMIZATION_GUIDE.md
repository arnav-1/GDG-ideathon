# Optimization Guide: Maximizing Context & Answer Quality

## Current Implementation
- ✅ HyDE (Hypothetical Document Embeddings) for better semantic search
- ✅ Metadata filtering (department-based)
- ✅ Top-10 retrieval for diversity
- ✅ Chain-of-Thought reasoning with thinking tags

## Recommended Optimizations (Priority Order)

### 1. **Semantic Re-Ranking (High Impact - Easy)**
**Problem**: Retrieved documents may not be optimally ranked.
**Solution**: Re-rank top-10 using cross-encoder models.
```python
# Add to retriever_node after fetching docs
from langchain.retrievers.document_compressors import LLMListCompressor
# Re-rank by relevance to original query after semantic search
```
**Expected Gain**: 15-25% improvement in answer relevance.

---

### 2. **Hybrid Search: Keyword + Semantic (High Impact - Medium)**
**Problem**: Pure semantic search can miss exact matches.
**Solution**: Combine BM25 (keyword) with vector search.
```python
# Create hybrid retriever
from langchain.retrievers import Chroma  # or use BM25Retriever
# Ensemble: 60% semantic + 40% keyword
```
**Expected Gain**: 20-30% improvement for specific technical queries.

---

### 3. **Query Expansion & Decomposition (Medium Impact - Medium)**
**Problem**: Complex queries may be missed with single search.
**Solution**: Expand user query into multiple sub-queries before retrieval.
```python
# In planner_node, generate 2-3 alternative queries
llm.invoke("Generate 3 variations of: {user_query}")
# Retrieve for each variation, deduplicate, merge
```
**Expected Gain**: 10-20% for multi-faceted questions.

---

### 4. **Context Compression & Prompt Optimization (Medium Impact - Easy)**
**Problem**: Long context can waste tokens and reduce clarity.
**Solution**: Compress context to only relevant sentences.
```python
# Use LLMListCompressor before synthesizer
from langchain.retrievers.document_compressors import LLMListCompressor
compressor = LLMListCompressor(llm=llm)
```
**Expected Gain**: Faster responses, better focus on relevant info.

---

### 5. **Dynamic k-Parameter (Low-Medium Impact - Easy)**
**Problem**: Fixed k=10 may be too rigid.
**Solution**: Adjust k based on query complexity.
```python
# In retriever_node
query_complexity = len(state['user_query'].split())
k = min(15, max(5, query_complexity // 3))  # Scale k from 5 to 15
```
**Expected Gain**: 5-10% optimization of token usage.

---

### 6. **Multi-Step Retrieval (High Impact - Hard)**
**Problem**: First pass retrieval may miss context.
**Solution**: Iterative retrieval with clarification.
```python
# Add retrieval loop
step_1: docs = similarity_search(hyde_query, k=10)
step_2: synthesizer evaluates if sufficient context exists
step_3: if insufficient, trigger expanded search with lower similarity threshold
```
**Expected Gain**: 25-40% for complex enterprise questions.

---

### 7. **Semantic Caching (Medium Impact - Medium)**
**Problem**: Repeated queries waste API calls.
**Solution**: Cache embeddings and responses.
```python
import hashlib
cache = {}  # In production: Redis

query_hash = hashlib.md5(user_query.encode()).hexdigest()
if query_hash in cache:
    return cache[query_hash]
```
**Expected Gain**: 50%+ cost reduction for repeated queries.

---

### 8. **Chunk Size & Overlap Tuning (Low Impact - Easy)**
**Problem**: Current chunk size may be suboptimal.
**Experiment**: Try chunk sizes 800, 1000, 1200 with overlaps 150, 200, 250.
**Metric**: Measure F1 score of retrieved chunks vs. relevant sections.
**Expected Gain**: 5-15% precision improvement.

---

### 9. **Metadata Enrichment (Medium Impact - Hard)**
**Problem**: Limited metadata filtering (only department).
**Solution**: Add doc-level metadata during ingestion:
- Document type (spec, guide, FAQ, release notes)
- Target audience (enterprise, SMB, developer)
- Update date (recency)
- Confidence score (official vs. community)

```python
# In ingest.py
doc.metadata.update({
    "doc_type": classify_doc_type(filename),
    "audience": extract_audience(content),
    "recency": get_last_modified_date(file),
    "confidence": 0.95  # official docs
})
```
**Expected Gain**: 20-30% for filtered expert queries.

---

### 10. **Language-Specific Optimization (Low Impact - Easy)**
**Problem**: Non-English queries may lose semantic richness.
**Solution**: Translate to English for retrieval, translate answer back.
```python
# Translate before HyDE generation
if language != "English":
    user_query = translator.translate(user_query, target="English")
    # Then generate HyDE in English
    # Translate final answer to requested language
```
**Expected Gain**: 10-20% for non-English users.

---

## Implementation Roadmap

### Phase 1 (This Week) - Quick Wins
1. ✅ Semantic Re-Ranking (1-2 hours)
2. ✅ Dynamic k-parameter (30 mins)
3. ✅ Context compression (1 hour)

### Phase 2 (Next Week) - Medium Effort
4. Hybrid search setup (2 hours)
5. Query expansion (2-3 hours)
6. Semantic caching Redis setup (1-2 hours)

### Phase 3 (Future) - Advanced
7. Multi-step retrieval (4-6 hours)
8. Metadata enrichment re-ingestion (2-3 hours)
9. Evaluation framework with F1/BLEU metrics (4-5 hours)

---

## Immediate Next Steps

```python
# Add to backend/graph.py retriever_node (right after similarity_search)

# Re-rank docs by relevance to BOTH hyde_query and original query
from sklearn.preprocessing import normalize
import numpy as np

# Get embeddings for user query (for re-ranking)
user_query_embedding = embeddings.embed_query(state['user_query'])
hyde_embedding = embeddings.embed_query(hyde_query)

# Simple re-ranking: weighted average of similarities
ranked_docs = []
for doc in docs:
    doc_embedding = embeddings.embed_query(doc.page_content)
    # Cosine similarity
    score_hyde = np.dot(doc_embedding, hyde_embedding) / (np.linalg.norm(doc_embedding) * np.linalg.norm(hyde_embedding))
    score_user = np.dot(doc_embedding, user_query_embedding) / (np.linalg.norm(doc_embedding) * np.linalg.norm(user_query_embedding))
    
    # Weight: 70% HyDE relevance, 30% original query relevance
    combined_score = (0.7 * score_hyde + 0.3 * score_user)
    ranked_docs.append((combined_score, doc))

# Re-sort
ranked_docs.sort(reverse=True, key=lambda x: x[0])
docs = [doc for _, doc in ranked_docs[:5]]  # Keep top-5 after re-ranking
```

---

## Metrics to Track

- **Latency**: Target < 3 sec/query
- **Answer Relevance**: Human eval (1-5 scale)
- **Citation Accuracy**: % of facts actually in source
- **Context Utilization**: Avg tokens used vs. max available
- **Cost per Query**: Track API spend
