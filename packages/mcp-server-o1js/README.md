# o1js MCP Server

## Overview
A Model Context Protocol (MCP) server implementation that provides search capabilities on o1js documentation, o1js codebase and chat history of o1js related channels in Mina Protocol Discord server.

## Components

### Tools
The server offers three tools:

- `search_discord`
   - Search for related discussions in Mina Protocol Discord server 
   - Input:
     - `query` (string)
     - `nResults`(number)
   - Returns: Query results

- `search_documentation`
   - Search for related documents in o1js documentation
   - Input:
     - `query` (string)
     - `nResults`(number)

   - Returns: Query results

- `search_o1js`
   - Search for related codes in o1js codebase
   - Input:
     - `query` (string)
     - `nResults`(number)
   - Returns: Query results


## Usage with Claude Desktop

- Navigate to Claude Settings > Developer > Edit Config
- Open with a text editor

```bash
# Add the server to your claude_desktop_config.json
"mcpServers": {
  "mcp-server-o1js": {
    "command": "npx",
      "args": [
        "-y",
        "mcp-server-o1js",
        "-g",
        "https://mcp-o1js.gcp.o1test.net"
      ]
  }
}
```

## Usage with Cursor

- Navigate to Cursor Settings  > MCP Tools
- Click the "+ Add New MCP Server" button

```bash
# Add the server to your .cursor/mcp.json
"mcpServers": {
  "mcp-server-o1js": {
    "command": "npx",
      "args": [
        "-y",
        "mcp-server-o1js",
        "-g",
        "https://mcp-o1js.gcp.o1test.net"
      ]
  }
}
```
