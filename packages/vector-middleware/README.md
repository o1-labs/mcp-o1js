# Vector Middleware Package

This project provides middleware functionality connecting vector databases (like Qdrant) with MCP servers. It implements rate limiting mechanism to protect against potentially malicious actors.


## Features

- Retrivial from Qdrant vector database
- Rate limiting for API consumption management
- API endpoint for the MCP server

## Prerequisites

- Node.js 16+
- TypeScript
- OpenAI API key
- Qdrant DB server (running locally or remotely)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your configuration (use `.env.example` as a template):
   ```bash
   cp .env.example .env
   # Then edit the .env file with your actual configuration values
   ```

## Usage

1. Build the project:
   ```bash
   npm run build
   ```

2. Run the middleware:
   ```bash
   npm start
   ```

## Project Structure

```
ingestion/
├── src/
│   ├── index.ts                  
│   ├── config.ts               
│   ├── embedding.ts           
│   ├── qdrant.ts            
│   ├── ratelimit.ts              
├── .env.example         
├── package.json
├── README.md                     
└── tsconfig.json
```

