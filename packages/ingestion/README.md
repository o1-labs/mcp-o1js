# Ingestion Package

This project provides a data ingestion pipeline for processing Markdown files, Discord chat exports, and TypeScript code, generating embeddings using OpenAI, and storing them in a Qdrant vector database.

## Features

- Process Markdown files with metadata
- Process Discord chat export files
- Process typescript codebase
- Generate embeddings using OpenAI's embedding models
- Store documents and embeddings in a Qdrant vector database

## Prerequisites

- Node.js
- OpenAI API key
- Qdrant DB server (running locally or remotely)

## Installation

1. Pull submodules:
   ```bash
   git submodule --init
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration (use `.env.example` as a template):
   ```bash
   cp .env.example .env
   # Then edit the .env file with your actual configuration values
   ```


## Usage

1. Place your Discord export files (JSON) in the `data/discord` directory
3. Build the project:
   ```bash
   npm run build
   ```

4. Run the ingestion process:
   ```bash
   npm start
   ```

## Project Structure

```
ingestion/
├── src/
│   ├── index.ts                  # Entry point
│   ├── config.ts                 # Configuration
│   ├── ingestors/                # Ingestor modules
│   │   ├──── discord.ts          # Discord chat export ingestion module
│   │   ├──── markdown.ts         # Markdown ingestion module for docs
│   │   └──── typescript.ts       # TypeScript ingestion module for o1js
│   ├── embeddings/               # Embedding generation modules
│   │   └──── openai.ts           # OpenAI embedding generator module
│   └── storage/                  # Storage adaptors
│       └──── qdrant.ts           # Adapter for Qdrant Vector Database
├── data/
│   ├── discord/                  # Place Discord exports here (in JSON)
│   ├── docs2/                    # Contains o1js documentation (markdown)
│   ├── o1js/                     # Contains o1js source code
├── .env.example                  # Example environment variables
├── package.json
├── README.md                     
└── tsconfig.json
```

## How It Works

1. **Markdown Processing**:
   - Reads Markdown files from the specified directory
   - Extracts frontmatter metadata
   - Splits content into manageable chunks
   - Preserves metadata with each chunk

2. **Discord Export Processing**:
   - Reads Discord export JSON files
   - Groups messages by day to maintain conversation context
   - Formats messages into a readable conversation format
   - Splits conversations into chunks
  
3. **TypeScript Processing**:
   - Reads TypeScript (`.ts`) files from the specified directory.
   - Extracts metadata such as classes, functions, interfaces, types, and exports using the TypeScript compiler.
   - Extracts import statements from code chunks.
   - Splits file content into manageable chunks.

4. **Embedding Generation**:
   - Uses OpenAI's embedding models to generate vector embeddings

5. **Storage**:
   - Stores documents and embeddings in Qdrant vector database


