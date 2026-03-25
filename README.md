# city.ai: Hyperlocal Intelligence for Singapore

city.ai is a next-generation hyperlocal intelligence agent designed specifically for Singapore. Unlike generic travel guides, city.ai surfaces authentic community knowledge, location-verified intelligence, and real-time local insights using a Retrieval-Augmented Generation (RAG) pipeline.

## 🚀 Purpose
To provide travelers and residents with "the real local intelligence" — moving beyond Google Search results to offer specific place recommendations, hawker stall numbers, SGD pricing, and MRT-relative context.

## 🛠️ Technical Stack
- **Frontend**: React 18
- **Build Tool**: Vite (Native ESM)
- **Database**: Supabase with `pgvector` for similarity search
- **AI Models**: 
  - **Chat**: Google Gemini 2.5 Flash
  - **Embeddings**: Google `gemini-embedding-001`
- **RAG Pipeline**: Python-based scraper harvesting verified community intel from Reddit (r/singapore, r/asksingapore)
- **Deployment**: Vercel Serverless Functions for AI orchestration

## ✨ Key Features
- **Reddit Community Intel**: Aggregates signals and "hidden gem" tips from verified local subreddits.
- **Trust & Freshness Metrics**: Every recommendation includes a trust score and a "freshness" timestamp to ensure reliability.
- **Contradiction-Aware UI**: Automatically highlights conflicting community reports, allowing users to make informed decisions.
- **Personalized Onboarding**: Tailors results based on travel style, budget range, and specific interests.

## 🏁 Getting Started

### Prerequisites
- **Node.js**: v18+ (Latest LTS recommended)
- **Python**: 3.9+ (for scraper functionality)
- **Vercel CLI**: `npm install -g vercel` (Required for local backend functionality)
- **Supabase**: Account with `pgvector` enabled

---

## 💻 Web App Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd city.ai
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root directory (use `.env.example` as a template):
   ```env
   # Gemini API Keys
   AI_API_KEY=your_gemini_chat_key_here
   GEMINI_API_KEY=your_gemini_embedding_key_here

   # Supabase Credentials
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Run the Development Server:**
   To use the AI features (serverless functions), you **must** run the project via the Vercel CLI to proxy the local API:
   ```bash
   vercel dev
   ```
   The app will typically be available at `http://localhost:3000`.

---

## 🕷️ RAG Pipeline (The Scraper)

The scraper harvests community intel from Reddit and stores it as vector embeddings in Supabase.

### 1. Database Initialization
Before running the scraper, execute the following SQL in your Supabase SQL Editor to enable `pgvector` and create the required table/functions:

```sql
-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create the chunks table
create table if not exists intel_chunks (
  id bigserial primary key,
  content text not null,
  metadata jsonb,
  embedding vector(768)
);

-- Index for similarity search
create index on intel_chunks using hnsw (embedding vector_cosine_ops);

-- Search function for the backend
create or replace function match_intel (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    intel_chunks.id,
    intel_chunks.content,
    intel_chunks.metadata,
    1 - (intel_chunks.embedding <=> query_embedding) as similarity
  from intel_chunks
  where 1 - (intel_chunks.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
```

### 2. Python Setup
1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 3. Execution
Run the scraper to populate your database with local intel:
```bash
python scraper.py
```
*Note: The scraper is configured with rate limiting (15s delay between batches) to respect Gemini Free Tier limits.*

---

## 🚀 Deployment

The project is designed to be deployed on **Vercel**:

1. Link your project: `vercel link`
2. Push your environment variables: `vercel env pull`
3. Deploy to production: `vercel --prod`

---

## 📂 Project Structure
- `api/chat.js`: Vercel Serverless Function handling Gemini orchestration and Supabase RAG logic.
- `scraper.py`: Python crawler for harvesting and embedding community intel.
- `src/services/aiService.js`: Thin frontend wrapper for backend intelligence.
- `src/App.jsx`: Main application state and UI orchestration.
- `src/index.css`: Design system and premium component styling.
- `package.json`: Project manifest and dependencies.
- `vercel.json`: Vercel configuration for API routing.
