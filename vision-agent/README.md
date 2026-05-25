# Language Teacher Agent

Voice-only AI language teacher. Speaks English and teaches the student any target language through spoken conversation. Powered by **OpenAI Realtime** (speech-to-speech) over **Stream Edge** (WebRTC transport).

## Prerequisites

| Tool | Install |
|------|---------|
| Python 3.12+ | `brew install python@3.12` |
| uv | `brew install uv` or `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

## Setup

**1. Add your OpenAI key to the root `.env`**

```bash
# .env  (already has STREAM_API_KEY / STREAM_API_SECRET)
OPENAI_API_KEY=sk-...
```

**2. Install dependencies**

```bash
cd vision-agent
uv sync
```

## Run

### Browser demo (development)

```bash
uv run agent.py run
```

Opens a browser link where you can talk to the teacher. Defaults to teaching Spanish.

### HTTP server (production / Expo integration)

```bash
uv run agent.py serve --host 0.0.0.0 --port 8000
```

**Start a lesson session** — pass `target_language` to control which language is taught:

```bash
curl -X POST http://localhost:8000/calls/default/call-id-123/sessions \
  -H "Content-Type: application/json" \
  -d '{"target_language": "French"}'
```

**Health check:**

```bash
curl http://localhost:8000/health
```

## How it works

1. `getstream.Edge()` reads `STREAM_API_KEY` and `STREAM_API_SECRET` from the root `.env` automatically.
2. `openai.Realtime()` reads `OPENAI_API_KEY` from the root `.env`. It handles STT and TTS natively — no separate speech services needed.
3. `target_language` is passed as a query parameter when starting a session and injected into the system prompt.
4. The agent greets the student in English and conducts the entire lesson in English, using the target language only to demonstrate words and pronunciation.
