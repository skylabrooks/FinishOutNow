# 10 - Model Context Protocol (MCP) Instructions

This document outlines the Model Context Protocol (MCP) servers available in this environment and provides instructions on how to use them effectively.

## Available Servers

The following MCP servers are configured in `.roo/mcp.json`:

1.  **context7** (`@upstash/context7-mcp`)
2.  **sequentialthinking** (`@modelcontextprotocol/server-sequential-thinking`)
3.  **filesystem** (`@modelcontextprotocol/server-filesystem`)
4.  **puppeteer** (`@modelcontextprotocol/server-puppeteer`)
5.  **memory** (`@modelcontextprotocol/server-memory`)

---

## Server Details & Usage

### 1. context7
*   **Package**: `@upstash/context7-mcp`
*   **Description**: Provides context management capabilities, likely leveraging Upstash for persistence or caching. It is useful for retrieving relevant context or storing information for later retrieval.
*   **How to Use**:
    *   Use this server when you need to store or retrieve project-specific context that needs to persist or be shared.
    *   Look for tools related to `store_context`, `retrieve_context`, or similar.

### 2. sequentialthinking
*   **Package**: `@modelcontextprotocol/server-sequential-thinking`
*   **Description**: A tool designed to facilitate complex problem-solving by allowing a step-by-step thinking process.
*   **How to Use**:
    *   **When**: Use this when facing a complex problem that requires breaking down into multiple logical steps.
    *   **Tool**: `sequential_thinking`
    *   **Parameters**:
        *   `thought`: The current thought or step in the process.
        *   `thought_history`: An array of previous thoughts.
        *   `step`: The current step number.
        *   `total_steps`: The estimated total number of steps.
    *   **Workflow**: Call this tool iteratively. In each call, update the `step` and `thought_history`. This helps in maintaining a clear chain of thought and allows for self-correction.

### 3. filesystem
*   **Package**: `@modelcontextprotocol/server-filesystem`
*   **Description**: Grants access to the local filesystem.
*   **Scope**: Configured for `/Users/DELL/FinishOutNow`.
*   **How to Use**:
    *   **When**: Use this to read, write, list, or manipulate files within the allowed directory.
    *   **Tools**: Typically includes `read_file`, `write_file`, `list_directory`, `get_file_info`, etc.
    *   **Note**: This overlaps with standard system tools but might offer specialized file operations exposed via MCP.

### 4. puppeteer
*   **Package**: `@modelcontextprotocol/server-puppeteer`
*   **Description**: Provides browser automation capabilities using Puppeteer.
*   **How to Use**:
    *   **When**: Use this for tasks involving web scraping, testing web applications, or taking screenshots of websites.
    *   **Tools**:
        *   `navigate`: Go to a URL.
        *   `screenshot`: Capture the current page.
        *   `click`, `type`, `evaluate`: Interact with page elements.
    *   **Scenario**: "Go to google.com and search for 'MCP protocols'" -> Use `navigate` then `type` and `click`.

### 5. memory
*   **Package**: `@modelcontextprotocol/server-memory`
*   **Description**: A persistent memory server that likely implements a knowledge graph or key-value store.
*   **How to Use**:
    *   **When**: Use this to remember user preferences, project details, or specific facts that should persist across sessions.
    *   **Tools**:
        *   `create_graph`: Initialize a knowledge graph.
        *   `add_entity`, `add_relation`: Build the graph.
        *   `read_graph`, `search_graph`: Retrieve information.
    *   **Benefit**: Helps build a "long-term memory" for the assistant regarding the project.

---

## General Usage Tips

*   **Discovery**: If you are unsure about the specific tools a server provides, you can often ask the system to "list tools" for a specific server (if the environment supports such introspection).
*   **Chaining**: You can combine tools from different servers. For example, use `sequentialthinking` to plan a scraping task, then use `puppeteer` to execute it, and finally `filesystem` to save the results.
*   **Error Handling**: If an MCP tool fails, check the error message carefully. It might be due to missing parameters or permission issues (especially with `filesystem`).
