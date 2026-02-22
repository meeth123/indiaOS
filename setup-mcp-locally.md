# Setup MCP Code Execution Locally for Claude Code

Reference: https://www.anthropic.com/engineering/code-execution-with-mcp

## What This Does

Instead of Claude calling MCP tools directly (which dumps raw data into context and
consumes massive tokens), Claude **writes and executes code** that interacts with MCP
servers. Processing happens in the execution environment; only final results are returned.

Real-world impact: **98.7% token reduction** (150,000 → 2,000 tokens in one example).

---

## Prerequisites

- Node.js >= 18 installed
- Claude Code installed: `npm install -g @anthropic-ai/claude-code`
- Logged in: `claude login`

---

## Step 1 — Add MCP Servers

Run the following commands from any directory. These register servers globally for your
user (`~/.claude.json`).

### 1a. Filesystem Server (gives Claude access to project files)

```bash
claude mcp add --scope user --transport stdio filesystem -- \
  npx -y @modelcontextprotocol/server-filesystem /home/user/indiaOS
```

### 1b. Python Code Execution Server (runs Python locally in a sandbox)

```bash
claude mcp add --scope user --transport stdio python-repl -- \
  npx -y @pydantic/mcp-run-python stdio
```

> **Alternative (cloud sandbox via e2b):** If you prefer isolated cloud sandboxes,
> sign up at https://e2b.dev, get an API key, then:
> ```bash
> claude mcp add --scope user --transport stdio e2b -- \
>   npx -y @e2b/mcp-server --api-key YOUR_E2B_API_KEY
> ```

---

## Step 2 — Verify Configuration

```bash
claude mcp list
```

Expected output:
```
filesystem   stdio   npx -y @modelcontextprotocol/server-filesystem /home/user/indiaOS
python-repl  stdio   npx -y @pydantic/mcp-run-python stdio
```

Config is stored at `~/.claude.json`. You can also edit it directly:

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/indiaOS"]
    },
    "python-repl": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@pydantic/mcp-run-python", "stdio"]
    }
  }
}
```

---

## Step 3 — Project-Level Config (Optional, for Team Sharing)

To share MCP config with the team, create `.mcp.json` at the project root:

```bash
# This writes to .mcp.json in the current directory
claude mcp add --scope project --transport stdio filesystem -- \
  npx -y @modelcontextprotocol/server-filesystem /home/user/indiaOS
```

Or create `.mcp.json` manually:

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/indiaOS"]
    }
  }
}
```

Commit `.mcp.json` to version control. Team members will be prompted to approve it on
first use.

---

## Step 4 — Start Claude Code and Check Server Status

```bash
claude
```

Inside the session, verify MCP servers are connected:

```
/mcp
```

You should see all configured servers listed as active.

---

## Step 5 — Use the Code Execution Pattern

### The Key Idea

Do NOT ask Claude to call tools directly like:
```
> List all TypeScript files    ← pulls everything into context, expensive
```

Instead, ask Claude to **write and run code** that uses MCP tools:
```
> Write a script that reads all .ts files via the filesystem server,
  counts lines per file, and return only the top 10 by size
```

Claude will:
1. Write a Python/JS script
2. Execute it via the python-repl or e2b MCP server
3. Return only the final processed result (not raw file contents)

### Example Prompts for This Project

```
> Write and run a script using the filesystem MCP to count all TODO comments
  across the /src directory and group them by file

> Use the filesystem MCP to read package.json and list all dependencies
  with their versions in a markdown table

> Write a Python script via the python-repl MCP that reads the Supabase
  migration files and summarizes the schema changes over time

> Use code execution to scan all .tsx files for accessibility issues
  (missing alt tags, aria labels) and return a CSV report
```

---

## Useful Commands Reference

| Task | Command |
|------|---------|
| List all MCP servers | `claude mcp list` |
| Get server details | `claude mcp get <name>` |
| Remove a server | `claude mcp remove <name>` |
| Check status in session | `/mcp` |
| Reset project approvals | `claude mcp reset-project-choices` |
| Increase output token limit | `export MAX_MCP_OUTPUT_TOKENS=50000` |
| Set server startup timeout | `MCP_TIMEOUT=30000 claude` |

---

## Environment Variables (Optional Tuning)

Add to your shell profile (`~/.bashrc` or `~/.zshrc`):

```bash
# Allow larger MCP tool outputs (default is 25,000 tokens)
export MAX_MCP_OUTPUT_TOKENS=50000

# Extend server startup timeout to 30s (default 10s)
export MCP_TIMEOUT=30000
```

---

## Security Notes

- Only add MCP servers you trust — Anthropic does not vet all community packages
- Project-scoped `.mcp.json` requires explicit approval from each team member on first use
- For servers that read files/URLs, be aware of prompt injection risk from untrusted content
- Never commit API keys into `.mcp.json` — use environment variable expansion instead:

```json
{
  "mcpServers": {
    "e2b": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@e2b/mcp-server"],
      "env": {
        "E2B_API_KEY": "${E2B_API_KEY}"
      }
    }
  }
}
```

---

## Troubleshooting

**Server not connecting:**
```bash
# Check if npx can resolve the package
npx -y @modelcontextprotocol/server-filesystem --help

# Extend timeout if startup is slow
MCP_TIMEOUT=30000 claude
```

**Output being truncated:**
```bash
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

**Server listed but not working inside session:**
```
/mcp    # check status inside claude session
```
Then remove and re-add the server:
```bash
claude mcp remove filesystem
claude mcp add --scope user --transport stdio filesystem -- \
  npx -y @modelcontextprotocol/server-filesystem /home/user/indiaOS
```

---

## Further Reading

- MCP Servers registry: https://github.com/modelcontextprotocol/servers
- Build a custom MCP server: https://modelcontextprotocol.io/quickstart/server
- Claude Code MCP docs: https://docs.anthropic.com/en/docs/claude-code/mcp
- Anthropic blog post: https://www.anthropic.com/engineering/code-execution-with-mcp
