# Telecom Sentiment Analyzer

Full-stack AI sentiment analysis application for the Tata Tele Business Services coding assignment. The app lets a user log in, upload or paste a telecom support conversation, analyze the conversation with an LLM-backed orchestration layer, and review sentiment, business KPIs, emotion detection, and line-level reasoning in a professional dashboard.

##Vercel link
https://telecom-sentiment-analyzer.vercel.app

## Architecture

```text
React UI (Next.js App Router + Tailwind)
        |
        v
Orchestration Layer
  - Vercel/serverless path: Next.js API route at /api/analyze
  - Enterprise/local path: n8n webhook service on port 5678
        |
        v
LLM (OpenAI or compatible provider)
        |
        v
Validated JSON insights rendered in the dashboard
```

## Core Features

- Basic demo login with hardcoded credentials for assignment review.
- `.txt` transcript upload and sample telecom transcript loader.
- Server-side AI orchestration through `app/api/analyze/route.ts`.
- Strict JSON output validation with Zod before data reaches the UI.
- Dashboard with summary, KPI cards, sentiment trajectory chart, emotion mix, recommended actions, and sentence-level reasoning.
- Docker Compose setup with Next.js and n8n on the same network for local enterprise-style orchestration.

## Telecom KPIs Extracted

### Churn Risk

Churn Risk identifies whether the customer shows signs of leaving, such as repeated service failures, unresolved frustration, price dissatisfaction, or loss of trust. This helps telecom teams prioritize retention follow-up and proactively protect revenue.

### First Contact Resolution

First Contact Resolution estimates whether the issue was solved during the first interaction. In telecom support, higher FCR reduces repeat calls, improves customer satisfaction, and lowers operational cost for contact-center teams.

### Customer Effort Score

Customer Effort Score evaluates how hard the customer had to work to get help. Signals such as repeated troubleshooting, transfers, unclear answers, or proactive agent ownership directly affect perceived service quality and long-term loyalty.

## Design Rationale

The live Vercel deployment uses the Next.js API route as the orchestration layer because it is serverless, simple to deploy, and keeps API keys off the client. This route receives transcript text from the React UI, prompts the LLM with a strict JSON schema, validates the response, and returns clean data to the dashboard.

The provided Docker setup adds an `n8n` service for enterprise or on-premise deployments. In that model, the Next.js app can call an n8n webhook at `http://n8n:5678/webhook/analyze-sentiment`, and n8n can orchestrate additional steps such as CRM updates, ticket creation, QA workflows, or multi-provider AI routing before returning the analysis.

## Running The Live Vercel Demo

1. Open the deployed Vercel URL for the project.
2. Log in with:

```text
Username: agent
Password: password123
```

3. Upload a `.txt` conversation transcript or click **Load Sample Telecom Transcript**.
4. Click **Analyze**.
5. Review the dashboard for sentiment, KPIs, emotion detection, trajectory chart, and line-by-line reasoning.

## Running Locally Without Docker

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your OpenAI key to `.env.local`:

```bash
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

If `OPENAI_API_KEY` is not provided, the app uses a deterministic demo fallback so reviewers can still test the UI and dashboard flow.

## Running Locally With Docker And n8n

Create a `.env` file for Docker Compose:

```bash
cp .env.example .env
```

Start the full local stack:

```bash
docker compose up --build
```

Open the services:

```text
Next.js app: http://localhost:3000
n8n:         http://localhost:5678
```

Both services run on the same Docker network. The Next.js container is configured with:

```text
N8N_WEBHOOK_URL=http://n8n:5678/webhook/analyze-sentiment
```

This makes it straightforward to replace or extend the Next.js fallback orchestration path with a real n8n workflow.

## Project Structure

```text
app/
  api/analyze/route.ts     Server-side AI orchestration and JSON validation
  layout.tsx               App metadata and global layout
  page.tsx                 Login, upload flow, and dashboard integration
components/
  Dashboard.tsx            Results dashboard with KPIs, chart, and table
  FileUpload.tsx           Upload, sample transcript, loading, and error handling
  LoginScreen.tsx          Demo authentication screen
lib/
  analysis-schema.ts       Shared Zod schema and TypeScript types
  sample-transcript.ts     Telecom sample transcript for easy testing
docker-compose.yml         Local Next.js + n8n stack
Dockerfile                 Production Next.js container build
```

## Evaluation Alignment

- **AI Quality:** Structured prompting asks for sentiment labels, numerical scores, evidence-based reasoning, telecom KPIs, emotion detection, and recommended actions.
- **Architecture:** UI calls an orchestration boundary, which then calls the LLM and validates the response before rendering.
- **UX/UI:** Dashboard emphasizes readable business insights, sentiment trend visualization, and evidence-level auditability.
- **Creativity:** Adds emotion mix, issue category inference, recommended actions, and telecom-specific customer-experience KPIs.
