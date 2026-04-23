# Mochii MCP Server

An MCP (Model Context Protocol) server that exposes the Mochii project management platform API as tools for AI agents.

## Setup

```bash
cd mochii-mcp-server
npm install
npm run build
```

## Configuration

Set these environment variables:

| Variable | Description |
|----------|-------------|
| `MOCHII_API_KEY` | **Required.** Platform API key (starts with `mochi_`) |
| `MOCHII_API_URL` | API endpoint. Defaults to the production Supabase function URL |

## Usage with Claude Desktop / Cursor / etc.

Add to your MCP config:

```json
{
  "mcpServers": {
    "mochii": {
      "command": "node",
      "args": ["/path/to/mochii-mcp-server/dist/index.js"],
      "env": {
        "MOCHII_API_KEY": "mochi_your_key_here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List projects with optional filters |
| `get_project` | Get project by ID |
| `create_project` | Create a new project |
| `update_project` | Update project fields |
| `delete_project` | Permanently delete a project |
| `list_tasks` | List tasks (filter by project, status, assignee) |
| `get_task` | Get task details + comment count |
| `create_task` | Create a new task |
| `update_task` | Update task fields |
| `delete_task` | Permanently delete a task |
| `list_comments` | List comments on a task |
| `add_comment` | Add a comment to a task |
| `list_clients` | List clients |
| `create_client` | Create a new client |
| `list_members` | List org members |

## Generating an API Key

Use the `mochii-api-keys` edge function (requires admin JWT auth):

```bash
curl -X POST \
  https://excgujbdnaapaddhuhcr.supabase.co/functions/v1/mochii-api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "generate", "name": "My Integration"}'
```

The response includes the full API key **once** — save it immediately.
