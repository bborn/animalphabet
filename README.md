# 🦁 Animalphabet

Watch AI play the animal name game — and learn from its mistakes.

**The Rules:**
1. Name an animal
2. The next animal must start with the last letter of the previous one
3. No repeats
4. See how long the chain can get!

**The Twist:** The AI remembers its failures and learns strategy lessons that improve future games.

## Demo

[animalphabet.pages.dev](https://animalphabet.pages.dev) *(update with your URL)*

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Install

```bash
cd animalphabet
npm install
```

### Create KV Namespaces

```bash
# Create namespaces for strategy memory and leaderboard
npx wrangler kv:namespace create STRATEGY
npx wrangler kv:namespace create LEADERBOARD
```

Copy the namespace IDs from the output and add them to `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "STRATEGY"
id = "your-strategy-namespace-id"

[[kv_namespaces]]
binding = "LEADERBOARD"
id = "your-leaderboard-namespace-id"
```

### Local Development

```bash
npm run dev
```

Open http://localhost:8787

### Deploy

```bash
npm run deploy
```

## How It Works

1. **Game Loop**: The frontend calls `/api/turn` with the current chain and required starting letter
2. **AI Decision**: Cloudflare Workers AI (Llama 3.1) picks an animal, with strategy context from previous games
3. **Learning**: When a game ends, the AI analyzes what went wrong and saves a lesson
4. **Memory**: Future games include learned lessons in the prompt, helping avoid the same mistakes

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Static Assets  │────▶│ Cloudflare Worker │────▶│ Workers AI  │
│   (HTML/JS/CSS) │     │   (Hono router)   │     │ (Llama 3.1) │
└─────────────────┘     └────────┬─────────┘     └─────────────┘
                                 │
                        ┌────────┴────────┐
                        ▼                 ▼
                 ┌────────────┐    ┌────────────┐
                 │ KV: STRATEGY│    │KV: LEADERBOARD│
                 │  (lessons)  │    │  (scores)  │
                 └────────────┘    └────────────┘
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/turn` | POST | Get next animal for the chain |
| `/api/end-game` | POST | Submit completed game for learning |
| `/api/leaderboard` | GET | Get top scores |
| `/api/lessons` | GET | Get recent learned lessons |

## License

MIT
