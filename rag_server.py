import os
import math
import re
from typing import List, Optional
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
app = FastAPI(
    title="Raibar Homestay GenAI RAG API",
    description="Hybrid Dense-Vector (Embeddings + Cosine Similarity) & Lexical RAG Pipeline",
    version="1.0.0",
)
# Allow Angular frontend (http://localhost:4200) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ─── 1. DATA MODELS (Pydantic Schemas) ───────────────────────────────────────
class KnowledgeChunk(BaseModel):
    id: str
    title: str
    category: str
    content: str
    keywords: List[str] = []
class RagQueryRequest(BaseModel):
    question: str
    gemini_api_key: Optional[str] = None
    chunks: List[KnowledgeChunk] = []
class RagQueryResponse(BaseModel):
    answer: str
    sources: List[str]
    top_scores: List[float]
    retrieval_mode: str
    actionLink: Optional[str] = "/booking"
    actionLabel: Optional[str] = "Book Room →"
# ─── 2. DEFAULT KNOWLEDGE BASE (Used if frontend sends empty chunks) ─────────
DEFAULT_CHUNKS: List[KnowledgeChunk] = [
    KnowledgeChunk(
        id="KB-ROOMS",
        title="Rooms & Multi-Room Group Rule",
        category="Rooms & Pricing",
        content=(
            "Raibar Homestay has 2 mountain-view rooms: "
            "1) The Buransh Room (₹2,200/night, max 2 guests, King bed, private balcony). "
            "2) The Deodar Room (₹2,000/night, max 2 guests, Queen bed, forest view). "
            "Each room accommodates a maximum of 2 guests. For 3-4 guests, both rooms "
            "are automatically combined (₹4,200/night total)."
        ),
        keywords=["room", "price", "cost", "rate", "guest", "buransh", "deodar"],
    ),
    KnowledgeChunk(
        id="KB-TRIPS",
        title="Garhwal Temple Tour Packages",
        category="Temple Trips",
        content=(
            "We organize 3 guided temple tours from the homestay: "
            "1) 3-Day Pauri & Kyunkaleshwar Darshan (₹4,200/person). "
            "2) 4-Day Siddhbali, Tarkeshwar & Lansdowne Circuit (₹6,400/person). "
            "3) 5-Day Complete Garhwal Shakti Peeth Yatra covering Dhari Devi, "
            "Jwalpa Devi & Kandoliya (₹8,800/person)."
        ),
        keywords=["trip", "tour", "temple", "package", "yatra", "dhari", "tarkeshwar"],
    ),
    KnowledgeChunk(
        id="KB-FOOD",
        title="Authentic Pahadi Home-Cooked Food",
        category="Food & Dining",
        content=(
            "We serve fresh organic Garhwali meals: Mandua (finger millet) rotis, "
            "Jhangora kheer, Pahadi dal (chainsu, gahat), Bhatt ki churkani, and "
            "fresh cow milk & rhododendron juice. Breakfast is complimentary."
        ),
        keywords=["food", "meal", "breakfast", "dinner", "pahadi", "menu"],
    ),
    KnowledgeChunk(
        id="KB-LOCATION",
        title="Location & How to Reach Pauri Garhwal",
        category="Travel & Route",
        content=(
            "Located in Pauri Garhwal, Uttarakhand (1,800m altitude). "
            "Nearest railway station: Kotdwar (85 km, ~3 hrs) & Rishikesh (115 km). "
            "Nearest airport: Jolly Grant Airport, Dehradun (130 km)."
        ),
        keywords=["location", "reach", "distance", "kotdwar", "rishikesh", "airport"],
    ),
]
# ─── 3. VECTOR MATH: COSINE SIMILARITY & HYBRID SCORING ──────────────────────
def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """
    Computes Cosine Similarity between two dense embedding vectors:
        similarity = (A · B) / (||A|| * ||B||)
    """
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
def lexical_bm25_score(query: str, chunk: KnowledgeChunk) -> float:
    """
    Lightweight lexical keyword + term-frequency scorer used for Hybrid Search
    (combining sparse keyword score + dense embedding score).
    """
    tokens = [
        t for t in re.sub(r"[^a-z0-9\s]", " ", query.lower()).split()
        if len(t) > 1
    ]
    if not tokens:
        return 0.0
    haystack = f"{chunk.title} {chunk.category} {chunk.content}".lower()
    kw_set = [k.lower() for k in chunk.keywords]
    score = 0.0
    for tok in tokens:
        for kw in kw_set:
            if tok in kw or kw in tok:
                score += 0.35
        if tok in haystack:
            score += 0.15
    return min(score, 1.0)
def retrieve_top_k_chunks(
    query: str,
    chunks: List[KnowledgeChunk],
    api_key: Optional[str],
    top_k: int = 3,
):
    """
    Step 1 of RAG: RETRIEVAL
    - If Gemini API key is available, generates 768-dim dense embeddings using
      `models/text-embedding-004` and ranks chunks via Hybrid Score:
          FinalScore = 0.75 * CosineSimilarity + 0.25 * LexicalScore
    - Otherwise, falls back to pure Lexical TF/Keyword ranking.
    """
    if HAS_GENAI and api_key:
        try:
            genai.configure(api_key=api_key)
            texts = [f"{c.title} ({c.category}): {c.content}" for c in chunks]
            # Embed all chunks + user query into 768-dim vectors
            doc_emb_res = genai.embed_content(
                model="models/text-embedding-004",
                content=texts,
                task_type="retrieval_document",
            )
            query_emb_res = genai.embed_content(
                model="models/text-embedding-004",
                content=query,
                task_type="retrieval_query",
            )
            doc_vectors = [np.array(v, dtype=np.float32) for v in doc_emb_res["embedding"]]
            query_vector = np.array(query_emb_res["embedding"], dtype=np.float32)
            scored = []
            for idx, chunk in enumerate(chunks):
                dense_sim = cosine_similarity(query_vector, doc_vectors[idx])
                sparse_sim = lexical_bm25_score(query, chunk)
                hybrid_score = (0.75 * dense_sim) + (0.25 * sparse_sim)
                scored.append((hybrid_score, chunk))
            scored.sort(key=lambda x: x[0], reverse=True)
            top = scored[:top_k]
            return [c for _, c in top], [round(s, 4) for s, _ in top], "hybrid_dense_embeddings"
        except Exception:
            pass
    # Fallback: Sparse Lexical Retrieval
    scored = [(lexical_bm25_score(query, c), c) for c in chunks]
    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:top_k]
    return [c for _, c in top], [round(s, 4) for s, _ in top], "sparse_lexical_bm25"
# ─── 4. DETERMINISTIC MULTI-ROOM CALCULATOR (Prevents Math Hallucinations) ───
def compute_group_pricing_context(query: str) -> str:
    """
    Extracts guest count & nights from the user query and pre-calculates
    exact room requirements (max 2 guests/room) so the LLM never hallucinates math.
    """
    guest_match = re.search(r"(\d+)\s*(?:guest|guests|person|people|pax|member)", query, re.I)
    night_match = re.search(r"(\d+)\s*(?:night|nights|day|days)", query, re.I)
    guests = int(guest_match.group(1)) if guest_match else 2
    nights = int(night_match.group(1)) if night_match else 1
    rooms_needed = math.ceil(guests / 2)
    if rooms_needed == 1:
        nightly = 2000
    else:
        nightly = 4200  # Buransh (2200) + Deodar (2000)
    total = nightly * nights
    return (
        f"Pre-calculated Group Rule for Query: {guests} guest(s) for {nights} night(s) "
        f"requires {rooms_needed} room(s) (max 2 guests/room). "
        f"Combined nightly rate: ₹{nightly:,}/night | Total for {nights} night(s): ₹{total:,}."
    )
# ─── 5. FASTAPI ENDPOINT: /api/rag ───────────────────────────────────────────
@app.post("/api/rag", response_model=RagQueryResponse)
def ask_rag_endpoint(payload: RagQueryRequest):
    """
    Full RAG Pipeline Endpoint:
    1. Retrieve Top-K chunks (Dense Embeddings + Cosine Similarity + Lexical Hybrid).
    2. Augment Prompt with retrieved chunks + deterministic pricing calculation.
    3. Generate Grounded Response using Gemini 1.5 Flash (or deterministic fallback).
    """
    chunks = payload.chunks if payload.chunks else DEFAULT_CHUNKS
    api_key = payload.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
    # STEP 1: RETRIEVAL
    top_chunks, top_scores, mode = retrieve_top_k_chunks(
        query=payload.question,
        chunks=chunks,
        api_key=api_key,
        top_k=3,
    )
    # STEP 2: AUGMENTATION
    context_block = "\n\n".join(
        [f"[{c.category} — {c.title}]\n{c.content}" for c in top_chunks]
    )
    math_context = compute_group_pricing_context(payload.question)
    augmented_prompt = f"""You are the official AI Concierge for Raibar Homestay in Pauri Garhwal, Uttarakhand.
Answer the guest's question ONLY using the Retrieved Context and Pre-calculated Pricing Rule below.
Do NOT invent facts or prices. Keep your response warm, concise (3-5 sentences), and helpful.
--- RETRIEVED KNOWLEDGE CHUNKS ---
{context_block}
--- DETERMINISTIC PRICING RULE ---
{math_context}
Guest Question: {payload.question}
"""
    sources = list(dict.fromkeys([c.category for c in top_chunks]))
    is_trip = any("trip" in c.category.lower() for c in top_chunks)
    # STEP 3: GENERATION
    if HAS_GENAI and api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(augmented_prompt)
            if response and response.text:
                return RagQueryResponse(
                    answer=response.text.strip(),
                    sources=sources,
                    top_scores=top_scores,
                    retrieval_mode=mode,
                    actionLink="/trip-booking" if is_trip else "/booking",
                    actionLabel="Book Temple Trip →" if is_trip else "Book Room →",
                )
        except Exception:
            pass
    # Deterministic Grounded Synthesis (when running without an external LLM key)
    synthesized = (
        f"Based on our live homestay records:\n"
        f"• {top_chunks[0].content}\n"
        f"• {math_context}"
    )
    return RagQueryResponse(
        answer=synthesized,
        sources=sources,
        top_scores=top_scores,
        retrieval_mode=mode,
        actionLink="/trip-booking" if is_trip else "/booking",
        actionLabel="Book Temple Trip →" if is_trip else "Book Room →",
    )