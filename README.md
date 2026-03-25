# city.ai: Hyperlocal Intelligence for Singapore

city.ai is a next-generation hyperlocal intelligence agent designed specifically for Singapore. Unlike generic travel guides, city.ai surfaces authentic community knowledge, location-verified intelligence, and real-time local insights.

## 🚀 Purpose
To provide travelers and residents with "the real local intelligence" — moving beyond Google Search results to offer specific place recommendations, hawker stall numbers, SGD pricing, and MRT-relative context.

## 🛠️ Technical Stack
- **Frontend**: React 18
- **Build Tool**: Vite (Native ESM)
- **Architecture**: Decoupled AI Service Layer for flexible model integration
- **Styling**: Vanilla CSS with a focus on high-fidelity, high-performance UI
- **Intelligence**: Integrated with Anthropic's Claude 3.5 Sonnet for deterministic, JSON-structured responses

## ✨ Key Features
- **Community-Sourced Intel**: Aggregates signals from verified local sources (Reddit, X, local contributors).
- **Trust & Freshness Metrics**: Every recommendation includes a trust score and a "freshness" timestamp to ensure reliability.
- **Contradiction-Aware UI**: Automatically highlights conflicting community reports, allowing users to make informed decisions.
- **Personalized Onboarding**: Tailors results based on travel style, budget range, and specific interests.

## 🏁 Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd city.ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory and add your AI API key:
   ```env
   AI_API_KEY=your_api_key_here
   ```

4. Launch the development server:
   For full functionality (including AI intel), use [Vercel CLI](https://vercel.com/cli):
   ```bash
   npm install -g vercel
   vercel dev
   ```
   *Note: Using standard `npm run dev` will only launch the UI without the backend proxy.*

## 📂 Project Structure
- `api/chat.js`: Vercel Serverless Function handling AI orchestration and security.
- `src/services/aiService.js`: Thin frontend wrapper for intelligence logic.
- `src/App.jsx`: Main application state and UI orchestration.
- `src/index.css`: Design system and component styling.
