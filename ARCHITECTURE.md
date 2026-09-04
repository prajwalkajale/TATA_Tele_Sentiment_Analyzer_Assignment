# Telecom Sentiment Analyzer - Architecture

## High-Level Architecture

```text
User
  |
  v
Login Screen
  |
  v
React UI - Next.js App Router
  |
  | uploads or pastes .txt transcript
  v
FileUpload Component
  |
  | POST /api/analyze
  v
Next.js API Route - Orchestration Gateway
  |
  | if N8N_WEBHOOK_URL exists
  v
n8n Workflow - Agentic Orchestration Layer
  |
  | structured telecom sentiment prompt
  v
OpenAI LLM
  |
  | strict JSON response
  v
n8n Respond to Webhook
  |
  v
Next.js API Route validates response with Zod
  |
  v
Dashboard Component
  |
  v
Summary, KPI Cards, Sentiment Chart, Emotion Mix, Sentence-Level Table
```

## Fallback Architecture

For Vercel deployment or local testing without n8n:

```text
React UI
  |
  v
Next.js API Route - /api/analyze
  |
  | if OPENAI_API_KEY exists
  v
OpenAI LLM
  |
  v
Zod Validation
  |
  v
Dashboard
```

If no OpenAI key is configured, the API returns a deterministic demo analysis so the reviewer can still test the complete user flow.

## Component Responsibilities

### React UI

Files:

- `components/LoginScreen.tsx`
- `components/FileUpload.tsx`
- `components/Dashboard.tsx`
- `app/page.tsx`

Responsibilities:

- Handles basic demo login.
- Accepts `.txt` uploads or sample transcript loading.
- Calls `/api/analyze`.
- Displays the final insight dashboard.

### Next.js API Route

File:

- `app/api/analyze/route.ts`

Responsibilities:

- Receives transcript text from the UI.
- Validates basic request constraints.
- Sends the transcript to n8n when `N8N_WEBHOOK_URL` is configured.
- Falls back to direct OpenAI orchestration when n8n is not configured.
- Falls back to demo mock output when no OpenAI key is available.
- Validates final response shape with Zod before returning data to the UI.

### n8n Workflow

File:

- `n8n/workflow.json`

Responsibilities:

- Exposes a POST webhook at `/webhook/analyze-sentiment`.
- Sends the transcript and structured prompt to OpenAI.
- Parses the OpenAI JSON response.
- Returns the telecom sentiment payload to the Next.js API route.

### AI Layer

Provider:

- OpenAI Chat Completions API

Responsibilities:

- Classifies overall sentiment.
- Produces sentence-level sentiment.
- Provides clear AI reasoning.
- Extracts telecom KPIs.
- Detects customer emotions.
- Generates conversation summary and recommended actions.

### Validation Layer

File:

- `lib/analysis-schema.ts`

Responsibilities:

- Defines the expected result schema using Zod.
- Ensures frontend receives consistent typed data.
- Prevents malformed LLM or n8n responses from breaking the dashboard.

## Data Flow

```text
1. User logs in with agent / password123.
2. User uploads or pastes a telecom transcript.
3. FileUpload sends transcript to /api/analyze.
4. API route checks N8N_WEBHOOK_URL.
5. If present, API forwards transcript to n8n.
6. n8n sends structured prompt to OpenAI.
7. OpenAI returns strict JSON.
8. n8n returns parsed JSON to the API route.
9. API route validates the JSON using Zod.
10. Dashboard renders business-ready insights.
```

## Extracted Telecom Insights

The system extracts:

- Overall Sentiment: Positive, Negative, or Neutral call outcome.
- Sentiment Score: Numerical trend from -1 to +1.
- Sentence-Level Sentiment: Line-by-line sentiment labels and reasoning.
- Churn Risk: Likelihood that the customer may leave.
- First Contact Resolution: Whether the issue appears resolved in the first interaction.
- Customer Effort Score: Whether the customer had to work hard to get help.
- Emotion Detection: Customer emotional state such as frustration, relief, trust, or confusion.
- Conversation Summary: Brief executive-ready summary of the call.
- Recommended Actions: Follow-up steps for support or retention teams.

## Deployment Architecture

### Vercel Demo

```text
Vercel
  |
  v
Next.js App + API Route
  |
  v
OpenAI
```

Best for:

- Fast demo deployment.
- Serverless hosting.
- Keeping API keys off the client.

### Docker + n8n Enterprise Mode

```text
Docker Compose Network
  |
  |-- Next.js web container - port 3000
  |
  |-- n8n container - port 5678
          |
          v
        OpenAI
```

Best for:

- Enterprise orchestration.
- On-premise or private-network deployments.
- Adding workflow automation such as CRM updates, ticket creation, audit logging, or QA routing.

## Clean Separation

```text
UI Layer
  React components and dashboard rendering

Orchestration Layer
  Next.js API route and optional n8n workflow

AI Layer
  OpenAI sentiment and KPI analysis

Validation Layer
  Zod schema enforcing strict JSON contracts
```

This separation matches the assignment requirement for:

```text
UI -> n8n -> AI
```

while preserving a practical Vercel fallback:

```text
UI -> Next.js API -> AI
```
