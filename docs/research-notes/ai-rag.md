# Retrieval-Augmented Generation research notes (2026-09-21)

## Videos
- rag-embeddings-similarity: Transformers, the tech behind LLMs | Deep Learning Chapter 5 (3Blue1Brown, 27:14), from "Word embeddings" at 747s (about 8 minutes of embedding geometry and dot products). Alternate: Cosine Similarity, Clearly Explained!!! (StatQuest with Josh Starmer, 10:13). The same 3Blue1Brown video is used in ai-llm at a different chapter (1342s).
- rag-vector-databases: What is a Vector Database? Powering Semantic Search & AI Applications (IBM Technology, 9:48, Mar 2025). Alternates: Vector Database Search - HNSW Explained (DataMListic, 8:02) and 18 Months of Pgvector Learnings in 47 Minutes (Tiger Data, 47:12) for pgvector practice.
- rag-chunking-strategies: The 5 Levels Of Text Splitting For Retrieval (Greg Kamradt, 1:08:59, Jan 2024); still the canonical walkthrough of character, recursive, document-specific, semantic and agentic splitting. Alternates: Anthropic's Contextual Retrieval Explained (Prompt Engineering, 16:14) and Production RAG with LangChain & Vector Databases (freeCodeCamp.org, 7:38:38, May 2026) from "Late Chunking vs Early Chunking" at 23066s.
- rag-retrieval-reranking: Top 3 RAG Retrieval Strategies: Sparse, Dense, & Hybrid Explained (IBM Technology, 8:28, Oct 2025). Alternates: The Complete Guide to Hybrid Search in RAG (Dave Ebbelaar, 59:17, May 2026) and Learn RAG From Scratch (freeCodeCamp.org, 2:33:11) from "Query Translation (RAG Fusion)" at 1700s, which implements reciprocal rank fusion.
- rag-full-pipeline: Production RAG with LangChain & Vector Databases (freeCodeCamp.org) from "Debugging RAG Systems" at 5596s (a different chapter from the chunking alternate). Alternates: RAG Evaluation: Precision, Recall, Faithfulness, RAGAS Explained Clearly (Logical Lenses, 12:19, Nov 2025) and Securing AI Agents: How to Prevent Hidden Prompt Injection Attacks (IBM Technology, 10:07, Jan 2026).
- The freeCodeCamp Production RAG description lists "Token Budgeting" at 1:13:49, out of order (likely 2:13:49); none of the chosen chapters depend on it.
- No search-URL fallbacks; all videos confirmed embeddable.

## References
- `anthropic.com/news/contextual-retrieval` redirects to `/engineering/contextual-retrieval`; `weaviate.io/developers/weaviate/concepts/vector-index` redirects to `docs.weaviate.io/weaviate/concepts/vector-index`; the sbert retrieve-rerank page moved under `/examples/sentence_transformer/applications/`; the Cormack RRF PDF moved to `cormack.uwaterloo.ca`.
- Iframe previews blocked: platform.claude.com, anthropic.com, github.com (pgvector), docs.voyageai.com (X-Frame-Options DENY), docs.langchain.com, roadmap.sh. Embeddable: pinecone.io, weaviate.io, docs.weaviate.io, elastic.co, sbert.net, docs.ragas.io, genai.owasp.org, cormack.uwaterloo.ca.

## Facts verified
- Claude embeddings doc: Anthropic has no embedding model and points to Voyage AI (voyage-4 family, rerank-2.5, voyage-context-4); Voyage vectors are normalized so cosine equals dot product and cosine/L2 rank identically; `input_type` query vs document prepends different prompts; Matryoshka truncation needs renormalization.
- pgvector README: operators (`<#>` is negative inner product because index scans are ascending), exact search by default, HNSW vs IVFFlat tradeoffs (IVFFlat needs data first), `m` 16 / `ef_construction` 64 / `hnsw.ef_search` 40, post-index filtering and iterative scans, index dimension limits (vector 2,000; halfvec 4,000; bit 64,000), inner product recommended for normalized vectors.
- Anthropic contextual retrieval post: 50–100 tokens of context per chunk; top-20 retrieval failures reduced 35% (contextual embeddings), 49% (+ contextual BM25), 67% (+ reranking); $1.02 per million document tokens with caching; knowledge bases under 200k tokens can go straight into the prompt.
- Elastic RRF docs: `score += 1 / (k + rank)`, `rank_constant` defaults to 60; documents contribute only from lists that contain them.
- OWASP Top 10 for LLM Applications is still the 2025 edition (LLM01 Prompt Injection, LLM08 Vector and Embedding Weaknesses). Claude citations return exact cited spans (char/page locations).
- Code challenges: expected values were generated from the reference solutions and every case was checked by hand (cosine scores, chunk packing, RRF sums).
