# MCP o1js Project

This project provides TypeScript packages for o1js Model Context Protocol (MCP) server.

## Project Structure

This is a monorepo containing multiple packages:

- `packages/ingestion`: A package for data ingestion from various sources
- `packages/mcp-o1js`: The core library for interacting with MCP using O1JS
- `packages/vector-middleware`: An API gateway for interacting with vector databases

## Requirements

- Node.js
- Npm

## Setup

To set up the project, run:

```bash
npm install
```

## Build

To build all packages, run:

```bash
npm build
```

## Development

### Project Structure

```
packages/
├── ingestion/                    # Data ingestion package
│   └── src/
│       ├── index.ts              # Entry point
│       ├── config.ts             # Configuration
│       ├── ingestors/            # Data ingestors
│       │   ├── discord.ts        # Discord chat ingestion
│       │   ├── markdown.ts       # Markdown ingestion
│       │   └── typescript.ts     # TypeScript code ingestion
│       ├── embeddings/           # Embeddings generation
│       │   └── openai.ts         # OpenAI embedding service
│       └── storage/              # Vector storage
│           └── qdrant.ts         # Qdrant vector database adapter
├── mcp-server-o1js/              # MCP server package for o1js
│   └── src/
│       └── index.ts              # Entry point
└── vector-middleware/            # API Gateway for vector search
    └── src/
        ├── index.ts              # Entry point
        ├── qdrant.ts             # Qdrant integration
        ├── embedding.ts          # Embedding service
        ├── ratelimit.ts          # Rate limiting middleware
        └── config.ts             # Configuration 
```