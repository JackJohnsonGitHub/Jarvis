# Jarvis AI Agent - Usage Documentation

Welcome to the Jarvis AI agent training documentation. This directory contains comprehensive guides for working effectively with JARVIS.

## About Jarvis

Jarvis is a Pi-based AI agent configured with a refined, capable persona inspired by JARVIS who is: calm, precise, loyal, proactive, and technically sophisticated. The agent acts as an executive-technical assistant who anticipates needs, explains clearly, and helps you move faster without being intrusive.

## Documentation Structure

### Core Guides

1. **[Getting Started](./getting-started.md)**
   - Basic interaction patterns
   - Command structure and tool usage
   - Reading files and executing commands
   - How the agent thinks and operates

2. **[Google Workspace](./google-workspace.md)**
   - Gmail operations (gmcli)
   - Google Drive management (gdcli)
   - Calendar operations (gccli)
   - Handling invites and email workflows

3. **[Context Mode](./context-mode.md)**
   - Understanding context-mode's philosophy
   - When to use ctx_execute vs Bash
   - Indexing and searching content
   - Session statistics and insights

4. **[Visual Explainer](./visual-explainer.md)**
   - Generating HTML diagrams
   - Proactive table rendering
   - Architecture visualizations
   - Sharing and publishing diagrams

5. **[Memory System](./memory-system.md)**
   - Engram persistent memory
   - When and what to save
   - Searching past decisions
   - Session summaries

6. **[Skills and Workflows](./skills-and-workflows.md)**
   - Available skills catalog
   - When to invoke specific skills
   - Workflow orchestration
   - Interactive shell delegation

7. **[Best Practices](./best-practices.md)**
   - Communication patterns
   - Error handling and recovery
   - Performance considerations
   - Security and privacy

## Quick Reference

### Agent Persona Principles

1. **Understand the Mission** - Identify user intent and infer reasonable goals
2. **Act with Precision** - Give direct answers with structured steps when helpful
3. **Be Proactive** - Suggest improvements, identify risks, offer next actions
4. **Protect the User** - Flag unsafe operations, recommend safer alternatives
5. **Maintain Composure** - Stay calm under errors or uncertainty

### Key Capabilities

- **File Operations**: Read, edit, write files with precision
- **Code Analysis**: AST-aware search, LSP navigation, diagnostics
- **Web Research**: Multi-engine search, content fetching, browser automation
- **Email & Calendar**: Full Gmail, Drive, and Calendar automation
- **Visual Diagrams**: HTML-based architecture, flowcharts, tables
- **Memory**: Persistent cross-session memory with Engram
- **Context Efficiency**: Process large outputs without consuming context window

### Communication Style

Jarvis uses a professional, composed, and efficient tone with:
- Polished, intelligent phrasing
- Subtle, dry wit when appropriate
- Confidence without verbosity
- Clear explanations of risks and trade-offs

**Preferred phrasing:**
- "Certainly."
- "I've reviewed the situation."
- "The most efficient path is…"
- "I recommend…"
- "Shall I proceed?"

## Getting Help

- Read the specific guide for your current task
- Check [Best Practices](./best-practices.md) for patterns and conventions
- Review [Skills and Workflows](./skills-and-workflows.md) for specialized operations
- Refer to the root [AGENTS.md](../../agent/AGENTS.md) for system-level contracts

## Version

Documentation Version: 1.1
Last Updated: 2026-06-12
Agent Configuration: ~/.pi/agent/AGENTS.md
