# Git The Point

Analyze any public GitHub repository with retrieval-augmented generation (RAG).

Git The Point ingests repository source files, chunks and embeds them, stores vectors in ChromaDB, and powers two user experiences:

- Architecture summary generation
- Conversational Q&A over the indexed codebase

## What It Does

- Accepts a GitHub repository URL
- Downloads and extracts the repository archive
- Filters source-like files and chunks content by line boundaries
- Generates embeddings with OpenAI (`text-embedding-3-small`)
- Stores vectors + metadata in ChromaDB
- Answers questions and generates summaries with OpenAI (`gpt-4.1-mini`)

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- OpenAI API
- ChromaDB

## High-Level Architecture

1. `POST /api/ingest`
2. `processRepo()` pipeline:
	 - download repository zip
	 - extract files
	 - filter supported file types
	 - chunk files
	 - embed chunks
	 - store vectors in Chroma
3. Results page (`/results/[repoId]`) loads:
	 - architecture summary (`POST /api/summary`)
	 - chat interface (`POST /api/ask`)

Core pipeline modules live in `lib/`:

- `lib/ingest/*`
- `lib/chunking/chunkFile.ts`
- `lib/embeddings/embedChunks.ts`
- `lib/vectorStore/*`
- `lib/rag/askQuestion.ts`
- `lib/summary/generateSummary.ts`

## Project Structure

```text
app/
	api/
		ingest/route.ts      # Ingests and indexes a repository
		ask/route.ts         # Q&A endpoint over indexed vectors
		summary/route.ts     # Architecture summary endpoint
	results/[repoId]/      # Analysis UI
lib/
	ingest/                # Download/extract/filter repository files
	chunking/              # Chunking logic
	embeddings/            # OpenAI embedding calls
	vectorStore/           # Chroma collection and writes
	rag/                   # Question answering flow
	summary/               # Summary generation flow
```

## Prerequisites

- Node.js 20+
- npm 10+
- Running ChromaDB instance (default expected at `http://localhost:8000`)
- OpenAI API key

## Environment Variables

Create a `.env.local` file in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key
```

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

Request:

```json
{
	"repoUrl": "https://github.com/owner/repo"
}
```

Response:

```json
{
	"ok": true,
	"result": {
		"id": "<repo-id>",
		"chunkCount": 123
	}
}
```

### `POST /api/summary`

Request:

```json
{
	"repoId": "<repo-id>"
}
```

Response:

```json
{
	"summary": "..."
}
```

### `POST /api/ask`

Request:

```json
{
	"repoId": "<repo-id>",
	"question": "How is auth implemented?"
}
```

Response:

```json
{
	"answer": "...",
	"sources": [
		{
			"file": "app/api/auth/route.ts",
			"startLine": 12,
			"endLine": 45
		}
	]
}
```

## Current Limitations

- Ingestion currently downloads `main.zip`; repositories using only `master` (or another default branch) may fail.
- Only a fixed allow-list of file extensions is indexed (`.js`, `.ts`, `.tsx`, `.jsx`, `.py`, `.java`, `.go`, `.rb`, `.md`, `.json`, `.html`, `.css`).
- Chroma endpoint is currently hardcoded to `http://localhost:8000`.
- Temporary files are written under `/tmp`.

## Troubleshooting

- `Invalid GitHub URL`
	- Ensure URL format is `https://github.com/<owner>/<repo>`.
- `Repository not found`
	- Verify repo exists and is public.
- `Access denied` during download
	- GitHub may be rate-limiting requests or repo is private.
- OpenAI errors
	- Confirm `OPENAI_API_KEY` is set in `.env.local`.
- Chroma connection errors
	- Verify Chroma is running and reachable on port `8000`.

## Recommended Next Improvements

- Resolve default branch dynamically via GitHub API instead of assuming `main`.
- Add persistent metadata storage for indexed repositories.
- Add end-to-end tests for ingest, summary, and ask flows.
- Make Chroma URL configurable via environment variable.
