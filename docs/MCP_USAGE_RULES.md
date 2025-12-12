# Kilo Code MCP Tool Usage Rules

## Overview
These rules govern the usage of Model Context Protocol (MCP) tools within the FinishOutNow (Kilo Code) platform. The platform leverages MCP servers to extend capabilities for documentation retrieval, sequential thinking, file system operations, browser automation, and knowledge management. These rules ensure efficient, secure, and context-aware tool utilization while maintaining awareness of user stories and platform requirements.

## Available MCP Tools and Usage Guidelines

### 1. Context7 (`mcp_context7_*`)
**Purpose:** Retrieve up-to-date documentation and code examples for libraries and frameworks.

**Tools:**
- `mcp_context7_resolve-library-id`: Resolves library names to Context7-compatible IDs.
- `mcp_context7_get-library-docs`: Fetches documentation for libraries.

**When to Use:**
- When implementing new features requiring external library documentation.
- For API integration research and code examples.
- When updating dependencies or learning new frameworks.
- Prioritize over general web searches for technical documentation.

**Rules:**
- Always resolve library ID before fetching docs.
- Use `mode='code'` for API references and examples, `mode='info'` for conceptual guides.
- Reference user stories related to AI features, lead analysis, and integration workflows.

### 2. Sequential Thinking (`mcp_sequentialthinking_*`)
**Purpose:** Dynamic and reflective problem-solving through structured thought processes.

**Tools:**
- `mcp_sequentialthinking_sequentialthinking`: Guides step-by-step analytical thinking.

**When to Use:**
- For complex problem-solving in AI analysis, lead scoring, or predictive modeling.
- When breaking down multi-step tasks like appointment setting workflows or geospatial analysis.
- For hypothesis generation and verification in project probability predictions.

**Rules:**
- Use when problems require adaptive thinking or course correction.
- Generate solution hypotheses and verify against user journey requirements.
- Incorporate user stories from lead discovery through appointment conversion.

### 3. Filesystem (`mcp_filesystem_*`)
**Purpose:** File and directory operations within allowed directories.

**Tools:**
- `mcp_filesystem_read_file`, `mcp_filesystem_read_text_file`: Read file contents.
- `mcp_filesystem_write_file`, `mcp_filesystem_edit_file`: Write/modify files.
- `mcp_filesystem_create_directory`, `mcp_filesystem_list_directory`: Directory management.
- `mcp_filesystem_move_file`, `mcp_filesystem_search_files`: File operations.
- `mcp_filesystem_get_file_info`, `mcp_filesystem_list_allowed_directories`: Metadata and access info.

**When to Use:**
- For data ingestion from permit APIs and creative signals.
- When processing lead data, scoring jobs, or generating reports.
- For managing service configurations and test files.

**Rules:**
- Operate only within allowed directories (check `list_allowed_directories`).
- Use for backend services like `services/ingestion/`, `services/ml/`, `services/geospatial/`.
- Ensure file operations align with user stories for data aggregation and analysis.

### 4. Puppeteer (`mcp_puppeteer_*`)
**Purpose:** Browser automation for web scraping and interaction.

**Tools:**
- `mcp_puppeteer_puppeteer_navigate`: Navigate to URLs.
- `mcp_puppeteer_puppeteer_screenshot`: Capture screenshots.
- `mcp_puppeteer_puppeteer_click`, `mcp_puppeteer_puppeteer_fill`, etc.: Interact with pages.

**When to Use:**
- For scraping permit data from city websites.
- When testing web interfaces or appointment setting workflows.
- For automated data collection from external sources.

**Rules:**
- Use for ingestion services like `services/ingestion/dallas.ts`, `services/ingestion/plano.ts`.
- Respect website terms of service and rate limits.
- Integrate with user stories for lead discovery and aggregation.

### 5. Memory (`mcp_memory_*`)
**Purpose:** Knowledge graph management for entities, relations, and observations.

**Tools:**
- `mcp_memory_create_entities`, `mcp_memory_create_relations`: Build knowledge graph.
- `mcp_memory_add_observations`, `mcp_memory_read_graph`: Manage data.
- `mcp_memory_search_nodes`, `mcp_memory_open_nodes`: Query graph.
- `mcp_memory_delete_*`: Remove data.

**When to Use:**
- For network recommendations and relationship graphs.
- When tracking contractor profiles, lead histories, and benchmarking data.
- For AI feature context and predictive analytics.

**Rules:**
- Use active voice for relations (e.g., "contractor pursues lead").
- Maintain graph for geospatial analysis and contractor networking.
- Reference user stories for profile management and network features.

## General Usage Rules

### Tool Selection Priority
1. Use MCP tools when they directly address the task (e.g., filesystem for file ops, context7 for docs).
2. Prefer native tools for simple operations (read_file over mcp_filesystem_read_text_file if available).
3. Combine tools for complex workflows (e.g., puppeteer + filesystem for data ingestion).

### Context Awareness
- Always consider the current user role (Contractor, Rep, Admin) from user stories.
- Align tool usage with platform features: lead intelligence, AI scoring, appointment setting.
- Ensure actions support the full user journey: discovery → analysis → claiming → conversion.

### Security and Compliance
- Operate within allowed directories and respect data privacy.
- Use secure authentication for external APIs and services.
- Maintain audit logs for administrative actions.

### Performance Considerations
- Batch operations when possible (e.g., multiple file reads).
- Cache results for frequently accessed data (leads, analytics).
- Monitor tool usage to prevent rate limiting or resource exhaustion.

### Error Handling
- Implement fallback mechanisms if MCP tools fail.
- Log errors and notify administrators for critical failures.
- Retry transient failures with exponential backoff.

## User Stories Integration

The platform must maintain awareness of the following user story categories:

- **Lead Discovery and Aggregation**: Use filesystem and puppeteer for data collection.
- **AI Lead Analysis and Scoring**: Leverage sequential thinking and context7 for model development.
- **Lead Claiming System**: Implement with memory graph for claim tracking.
- **Appointment Setting Workflow**: Use puppeteer for web interactions, memory for status tracking.
- **Geospatial Analysis**: Combine filesystem and memory for location-based features.
- **Contractor Benchmarking**: Utilize memory for performance data and analytics.
- **Network Recommendations**: Build relationship graphs with memory tools.
- **Project Probability Predictions**: Apply sequential thinking for predictive modeling.
- **User Authentication and Profiles**: Secure access with role-based permissions.
- **Dashboard and Lead Management**: Real-time updates using filesystem and memory.
- **Reporting and Analytics**: Generate reports with filesystem operations.
- **Offline and Mobile Support**: Ensure mobile compatibility in tool usage.

## Implementation Guidelines

- Document tool usage in service files (e.g., comments in `services/aiFeatures.ts`).
- Test MCP integrations in `tests/integration/` directories.
- Update these rules as new tools or user stories are added.
- Ensure all code changes align with production readiness requirements.

## Maintenance

- Review tool effectiveness quarterly.
- Update library IDs and documentation sources regularly.
- Monitor for deprecated tools and migrate accordingly.
- Train development team on proper tool usage and user story alignment.