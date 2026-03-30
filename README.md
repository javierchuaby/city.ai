# city.ai: Hyperlocal Intelligence for Singapore

city.ai is a next-generation hyperlocal intelligence agent designed specifically for Singapore. Unlike generic travel guides, city.ai surfaces authentic community knowledge, location-verified intelligence, and real-time local insights using a Retrieval-Augmented Generation (RAG) pipeline.

## 🚀 Purpose
To provide travelers and residents with "the real local intelligence" — moving beyond Google Search results to offer specific place recommendations, hawker stall numbers, SGD pricing, and MRT-relative context.

## 🛠️ Technical Stack
- **Frontend**: React 19 (Feature-Sliced Design)
- **Build Tool**: Vite 8 (Native ESM)
- **Database**: Supabase with `pgvector` for similarity search
- **AI Models**: 
  - **Chat**: Google Gemini 2.5 Flash / 2.0 Flash (Multi-model fallback)
  - **Embeddings**: Google `gemini-embedding-2-preview` (768d, L2 normalized)
- **RAG Pipeline**: Python-based scraper harvesting verified community intel from Reddit (r/singapore, r/asksingapore)
- **Deployment**: Vercel Serverless Functions (Consolidated Composition Root)

## ✨ Key Features
- **Reddit Community Intel**: Aggregates signals and "hidden gem" tips from verified local subreddits.
- **Trust & Freshness Metrics**: Every recommendation reflects a trust score and a "freshness" timestamp.
- **Contradiction-Aware UI**: Automatically highlights conflicting community reports for user transparency.
- **Reputation & Points System**: Gamified "intel contribution" points that track user engagement.
- **Personalized Onboarding**: Tailors results based on travel style, budget, and interests.

## 🏁 Getting Started

### Prerequisites
- **Node.js**: v18+ 
- **Python**: 3.9+ (Modularized scraper)
- **Vercel CLI**: `npm install -g vercel` (Required for local serverless development)
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
   Create a `.env` file in the root directory (use `.env.example` as a template). For the backend to function, ensure `GEMINI_API_KEY` (or `AI_API_KEY`) and Supabase credentials are set.

4. **Run the Development Server:**
   To use the AI features (serverless functions), you **must** run the project via the Vercel CLI to proxy the local API:
   ```bash
   vercel dev
   ```
   The app will typically be available at `http://localhost:3000`.

---

## 🕷️ RAG Pipeline (The Scraper)

The scraper harvests community intel from Reddit and stores it as vector embeddings in Supabase with MD5-based deduplication for cost efficiency.

### 1. Database Initialization
Before running the scraper, execute the following SQL in your Supabase SQL Editor to enable `pgvector` and create the required tables:

```sql
-- Enable the pgvector extension
create extension if not exists vector;

-- Create the chunks table with content hashing for idempotency
create table if not exists intel_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  content_hash text unique, -- Strategic MD5 hashing for deduplication
  metadata jsonb,
  embedding vector(768)
);

-- State tracking for incremental scraping
create table if not exists scraper_state (
  key text primary key,
  value jsonb
);

-- Index for similarity search
create index on intel_chunks using hnsw (embedding vector_cosine_ops);

-- Search function for the backend (RAG)
create or replace function match_intel (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
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

### 2. Python Setup (Modularized)
1. Navigate to the scripts directory:
   ```bash
   cd scripts
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 3. Execution (Recommended)
From the **root** directory, run the scraper via the `npm` script:
```bash
npm run scraper
```

*Note: The scraper includes built-in rate limiting (15s delay between batches) and retry logic to respect Gemini Free Tier quotas.*

---

## 🚀 Deployment

The project is designed to be deployed on **Vercel** with a consolidated serverless architecture:

1. **Link your project**: `vercel link`
2. **Configure variables**: Add `GEMINI_API_KEY` (or `AI_API_KEY`), `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` to your Vercel Dashboard.
3. **Sync local env (optional)**: `vercel env pull .env`
4. **Deploy to production**: `vercel --prod`

---

## 📂 Project Structure

```text
├── api/                  # Vercel Serverless Functions (Layered Architecture)
│   ├── _lib/             # Internal logic (not exposed as endpoints)
│   │   ├── clients/      # SDK clients (Gemini, Supabase)
│   │   ├── config/       # Centralized configuration & Zod validation
│   │   ├── repositories/ # Data access layer (Supabase)
│   │   ├── services/     # Business logic (AI orchestration, RAG)
│   │   └── utils/        # Schema, prompts & parsing logic
│   └── chat.js           # Public Endpoint / Composition Root
├── scripts/              # Python RAG Pipeline
│   ├── scraper/          # Reddit crawler implementation
│   └── venv/             # Python Virtual Environment
├── src/                  # Front-end (Feature-Sliced Design)
│   ├── app/              # Application layer (Entry point, Providers, Global styles)
│   ├── assets/           # Static assets (Images, Global styles)
│   ├── pages/            # Full pages (Landing, Onboarding, etc.)
│   ├── widgets/          # Complex UI blocks (ChatPanel, Sidebar)
│   ├── entities/         # Business entities (User, Chat models/hooks)
│   └── shared/           # Reusable helpers (API client, Hooks, UI components)
├── vercel.json           # Vercel deployment configuration
└── package.json          # Node.js dependencies & scripts
```

### Detailed Breakdown

#### 🏗️ Backend (`api/`)
| Layer | Description |
|:---|:---|
| `_lib/services/` | **Orchestration Layer**. Business logic, AI prompt engineering, and core RAG flows. |
| `_lib/repositories/` | **Data Access Layer**. Encapsulates all query/search logic for Supabase and Vector DB. |
| `_lib/clients/` | **External SDKs**. Singleton-pattern initializers for Gemini and Supabase clients. |
| `chat.js` | **Public Entrypoint**. Composition root for the search/chat endpoint. |

#### 💠 Frontend (`src/`)
*Following [Feature-Sliced Design](https://feature-sliced.design/docs/get-started/tutorial) methodology.*

| Slice | Responsibility |
|:---|:---|
| `app/` | Higher-level app logic: Providers, global styles, and the entry component. |
| `pages/` | Composition of full application screens (Landing page, Insight dashboards). |
| `widgets/` | Autonomous UI blocks (e.g., the Chat Panel, Sidebar modules). |
| `entities/` | Business-domain models (User data, Chat history hooks). |
| `shared/` | The groundwork: UI components (buttons, inputs), generic utility functions, and constants. |

#### 🕷️ Data Scripts (`scripts/`)
| Component | Function |
|:---|:---|
| `scraper/` | **Modular Crawler**: Orchestrates the fetch/parse/embed/sync cycle via `main.py`. |
| `scraper/services/` | **Embeddings**: Local L2 normalization and Gemini embedding generation. |
| `scraper/repository/` | **Persistence**: Supabase `upsert` logic with MD5-based deduplication. |
| `requirements.txt` | Python dependencies (PRAW, Supabase-py, Google-GenAI SDK). |
