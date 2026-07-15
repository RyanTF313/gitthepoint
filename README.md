# Git The Point

Analyze any public GitHub repository with retrieval-augmented generation (RAG).

Git The Point ingests repository source files, chunks and embeds them, stores vectors in ChromaDB, and powers two user experiences:

- Architecture summary generation
- Conversational Q&A over the indexed codebase

## What It Does

- Accepts a GitHub repository URL
- Downloads and extracts the repository archive (default branch via GitHub API)
- Filters source-like files and chunks content by line boundaries
- Generates embeddings with OpenAI (`text-embedding-3-small`)
- Stores vectors + metadata in ChromaDB
- Answers questions and generates summaries with OpenAI (`gpt-4.1-mini`)
- Issues a per-repo access token (TTL) so `repoId` alone is not enough to query

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- OpenAI API
- ChromaDB

## High-Level Architecture

1. `POST /api/ingest` starts an async job and returns `jobId` immediately
2. Client polls `GET /api/ingest/status/[jobId]` for percent/stage + final tokens
3. `processRepo()` pipeline:
   - download repository zip (size-capped)
   - safe-extract files
   - filter supported file types (async, with secret-ish filename skips)
   - chunk files
   - embed chunks in rate-limited batches with retries
   - store vectors in Chroma (batched)
   - register repo metadata + access token
4. Results page (`/results/[repoId]?token=...`) loads:
   - architecture summary (`POST /api/summary`)
   - file highlights (`POST /api/files`)
   - chat interface (`POST /api/ask`, multi-turn)

## Prerequisites

- Node.js 20+
- npm 10+
- Running ChromaDB instance (default `http://localhost:8000`)
- OpenAI API key

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Notable variables:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Required for embeddings + chat |
| `CHROMA_URL` | Chroma HTTP endpoint (default `http://localhost:8000`) |
| `API_SECRET` | Optional global gate for all API routes |
| `GITHUB_TOKEN` | Optional; improves GitHub API rate limits |
| `MAX_ZIP_BYTES` / `MAX_FILES` / `MAX_CHUNKS` | Resource caps |
| `REPO_TTL_MS` | Access-token lifetime for indexed repos |

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start ChromaDB (Docker example):

```bash
docker run --rm -p 8000:8000 chromadb/chroma
```

3. Start the app:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

## API Contracts

### `POST /api/ingest`

Starts an async ingest job.

Request:

```json
{
  "repoUrl": "https://github.com/owner/repo"
}
```

Response `202`:

```json
{
  "ok": true,
  "jobId": "<job-id>",
  "result": { "id": "<job-id>" }
}
```

### `GET /api/ingest/status/[id]`

Poll progress. On completion, `progress.complete` is true and `result` includes the access token:

```json
{
  "ok": true,
  "progress": {
    "percent": 100,
    "stage": "done",
    "message": "ingestion complete",
    "complete": true
  },
  "result": {
    "id": "<repo-id>",
    "accessToken": "<token>",
    "chunkCount": 123,
    "expiresInMs": 86400000
  }
}
```

### `POST /api/summary` / `POST /api/ask` / `POST /api/files`

Require `repoId` plus `accessToken` (body, `x-repo-token` header, or `?token=`).

`/api/ask` also accepts `history` for multi-turn chat:

```json
{
  "repoId": "<repo-id>",
  "accessToken": "<token>",
  "question": "How is auth implemented?",
  "history": [
    { "role": "user", "content": "What is this repo?" },
    { "role": "assistant", "content": "..." }
  ]
}
```

### `POST /api/contact`

Accepts `multipart/form-data` with `name`, `email`, `message`. Rate-limited; currently logs submissions (no mail provider wired).

## Security & Limits

- Optional `API_SECRET` for all routes
- Per-IP rate limits on ingest / ask / summary / contact
- Zip path traversal protection
- Download / file / chunk size caps
- Temp zip + extract directories cleaned after ingest
- Per-repo access tokens with TTL (in-memory registry)
- Safe client error messages (details logged server-side)

## Current Limitations

- Repo registry / job queue are in-memory (lost on process restart; not multi-instance safe)
- Only a fixed allow-list of file extensions is indexed
- Temporary files use `/tmp` during ingest
- Contact form does not send email yet

## Troubleshooting

- `Invalid GitHub URL` — use `https://github.com/<owner>/<repo>`
- `Repository not found` — verify the repo exists and is public
- `Missing repository access token` — re-run ingest; open the results link with `?token=`
- OpenAI errors — confirm `OPENAI_API_KEY` in `.env.local`
- Chroma connection errors — verify `CHROMA_URL` and that Chroma is running
