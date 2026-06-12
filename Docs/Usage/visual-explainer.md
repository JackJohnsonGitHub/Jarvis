# Visual Explainer

Generate beautiful, self-contained HTML diagrams, architecture overviews, data tables, and technical visualizations. This guide covers when and how to use visual-explainer.

## Overview

Visual-explainer creates HTML files for:
- System architecture diagrams
- Flowcharts and pipelines
- Data tables and comparisons
- Sequence diagrams
- ER/schema diagrams
- Implementation plans
- Project recaps

**Output location:** `~/.agent/diagrams/`

**Key principle:** Always open the result in the browser. Never fall back to ASCII art.

## When to Use

### Proactive Table Rendering

**Automatic trigger:** Any time Jarvis would render an ASCII box-drawing table with:
- **4+ rows** OR
- **3+ columns**

**Examples:**
- Requirement audits (request vs plan)
- Feature comparisons
- Status reports
- Configuration matrices
- Test result summaries
- Dependency lists
- API endpoint inventories

Jarvis will automatically generate an HTML table instead and tell you the file path. A brief text summary may still appear in chat, but the table itself is the HTML page.

### User Requests

When you ask for:
- "Create a diagram of..."
- "Show me the architecture..."
- "Generate a visual explanation..."
- "Make a comparison table..."
- "Visualize the workflow..."

### Complex Explanations

When explaining:
- System designs
- Code changes (diff reviews)
- Implementation plans
- Project status
- Technical concepts

## Diagram Types

### Architecture / System Diagrams

**Three approaches:**

1. **Simple topology (<10 elements)** - Use Mermaid with automatic edge routing
2. **Text-heavy overviews (<15 elements)** - CSS Grid cards with descriptions
3. **Complex (15+ elements)** - Hybrid: simple Mermaid overview + detailed CSS Grid cards

**Example request:**
> "Create a visual diagram of the WebSocket modem architecture"

### Flowcharts / Pipelines

Use Mermaid for automatic node positioning and edge routing.

**Example request:**
> "Generate a flowchart showing the message processing pipeline"

### Data Tables

HTML `<table>` with:
- Sticky headers (stays visible when scrolling)
- Alternating row backgrounds
- Row hover highlighting
- Responsive wrapper (horizontal scroll for wide tables)
- Status indicators (colored badges, never emoji)

**Example request:**
> "Create a comparison table of the three frameworks"

### Sequence Diagrams

Mermaid sequence diagrams with lifelines, messages, and activation boxes.

**Example request:**
> "Show a sequence diagram for the authentication flow"

### Implementation Plans

Visual breakdown of:
- Overview/purpose
- Flow diagram
- File structure with descriptions
- Key implementation details (snippets, not full files)
- API/interface summary
- Usage examples

**Example request:**
> "Generate a visual implementation plan for the caching layer"

## Aesthetic Directions

Jarvis varies aesthetic choices to avoid generic AI-generated appearance.

### Constrained Aesthetics (Preferred)

**Blueprint** - Technical drawing feel, deep slate/blue, monospace labels, precise borders

**Editorial** - Serif headlines, generous whitespace, muted earth tones or deep navy + gold

**Paper/ink** - Warm cream background, terracotta/sage accents, informal feel

**Monochrome terminal** - Green/amber on near-black, monospace everything, optional CRT glow

### Flexible Aesthetics

**IDE-inspired** - Real color schemes: Dracula, Nord, Catppuccin, Solarized, Gruvbox, One Dark, Rosé Pine

**Data-dense** - Small type, tight spacing, maximum information, muted colors

### Explicitly Forbidden

- Neon dashboard (cyan + magenta + purple)
- Gradient mesh (pink/purple/cyan blobs)
- Inter font + violet/indigo + gradient text (AI slop)

Each diagram uses a different font pairing and aesthetic from previous generations.

## Typography

### Font Pairings (Used)

- **DM Sans + Fira Code** - Technical, precise
- **Instrument Serif + JetBrains Mono** - Editorial, refined
- **IBM Plex Sans + IBM Plex Mono** - Reliable, readable
- **Bricolage Grotesque + Fragment Mono** - Bold, characterful
- **Plus Jakarta Sans + Azeret Mono** - Rounded, approachable

### Forbidden Fonts

- Inter, Roboto, Arial, Helvetica (as primary `--font-body`)
- system-ui alone

## Color Palettes

### Good Accent Palettes

- **Terracotta + sage** - Warm, earthy
- **Teal + slate** - Technical, precise
- **Rose + cranberry** - Editorial, refined
- **Amber + emerald** - Data-focused
- **Deep blue + gold** - Premium, sophisticated

### Forbidden Accent Colors

- `#8b5cf6`, `#7c3aed`, `#a78bfa` (indigo/violet - Tailwind defaults)
- `#d946ef` (fuchsia)
- Cyan-magenta-pink combination

## Rendering Approaches

| Content Type | Approach | Why |
|--------------|----------|-----|
| Architecture (text-heavy) | CSS Grid + arrows | Rich card content needs CSS control |
| Architecture (topology) | Mermaid | Visible connections need auto-routing |
| Flowchart / pipeline | Mermaid | Automatic node positioning |
| Sequence diagram | Mermaid | Lifelines need automatic layout |
| Data flow | Mermaid + edge labels | Connections need auto-routing |
| ER / schema | Mermaid | Relationship lines need auto-routing |
| State machine | Mermaid | Transitions need automatic layout |
| Mind map | Mermaid | Hierarchical branching |
| Class diagram | Mermaid | Inheritance/composition lines |
| Data table | HTML `<table>` | Semantic, accessible, copy-paste |
| Timeline | CSS | Simple linear layout |
| Dashboard | CSS Grid + Chart.js | Card grid with embedded charts |

## Mermaid Diagrams

### Theming

Always use `theme: 'base'` with custom `themeVariables` to match page palette.

```javascript
%%{
  init: {
    'theme': 'base',
    'themeVariables': {
      'primaryColor': '#1e40af',
      'primaryTextColor': '#fff',
      'primaryBorderColor': '#3b82f6',
      'lineColor': '#60a5fa',
      'fontSize': '16px',
      'fontFamily': 'DM Sans, sans-serif'
    }
  }
}%%
```

### Layout Direction

**Prefer `flowchart TD` (top-down)** over `flowchart LR` (left-to-right) for complex diagrams.

LR spreads horizontally and makes labels unreadable with many nodes. Use LR only for simple 3-4 node linear flows.

### Line Breaks in Labels

Use `<br/>` inside quoted labels. **Never use `\n`** (renders as literal text).

```
A["Copilot Backend<br/>/api + /api/voicebot"]
```

### Zoom Controls

Every Mermaid diagram must have:
- Zoom controls (+/−/reset/expand buttons)
- Ctrl/Cmd+scroll zoom
- Click-and-drag panning
- Click-to-expand (opens full-size in new tab)

**Never use bare `<pre class="mermaid">`** — it has no controls and becomes unusable.

### Scaling for Large Diagrams

- **10-12 nodes:** Increase `fontSize` to 18-20px, set `INITIAL_ZOOM` to 1.5-1.6
- **15+ elements:** Use hybrid pattern (simple overview + CSS Grid cards)

## Generated Images (Optional)

If `surf` CLI is available, Jarvis can generate AI illustrations via Gemini.

**Check availability:**
```bash
which surf
```

**When to use:**
- Hero banners establishing visual tone
- Conceptual illustrations (mental models, user journeys)
- Educational diagrams that benefit from artistic rendering
- Decorative accents reinforcing aesthetic

**When to skip:**
- Anything Mermaid or CSS handles well
- Generic decoration
- Data-heavy pages (images distract)

Images embed as base64 data URIs for self-containment.

## Animation

### Purposeful Animations

- **Staggered fade-ins** on page load (guide the eye)
- **Hover transitions** on interactive elements
- **Entrance reveals** for cards and sections

### Forbidden Animations

- Animated glowing box-shadows (`@keyframes glow`)
- Pulsing/breathing effects on static content
- Continuous animations after page load

Always respect `prefers-reduced-motion`.

## Quality Checks

Before delivering, verify:

1. **The squint test** - Can you perceive hierarchy with blurred eyes?
2. **The swap test** - Would generic fonts/colors make this indistinguishable?
3. **Both themes** - Toggle light/dark mode; both should look intentional
4. **Information completeness** - Does it convey what was asked?
5. **No overflow** - Resize browser; no content clips
6. **Mermaid zoom controls** - Every diagram has controls
7. **File opens cleanly** - No console errors or layout shifts

## Sharing Pages

Share diagrams via Vercel when `vercel-deploy` skill is available.

**Command:**
```bash
bash ~/.pi/agent/skills/visual-explainer/scripts/share.sh <html-file>
```

**Output:**
```
✓ Shared successfully!
Live URL:  https://skill-deploy-abc123.vercel.app
Claim URL: https://vercel.com/claim-deployment?code=...
```

- URL is live immediately
- Works in any browser
- Deployments are public
- Default retention: 30 days

## Example Workflows

### Creating Architecture Diagram

**User:** "Create a visual diagram of the modem architecture"

**Jarvis will:**
1. Read visual-explainer skill
2. Choose aesthetic direction (varies each time)
3. Select rendering approach (Mermaid, CSS, or hybrid)
4. Generate self-contained HTML
5. Write to `~/.agent/diagrams/modem-architecture.html`
6. Open in browser
7. Report file path

### Proactive Table Rendering

**User:** "Compare React, Vue, and Angular"

**Jarvis will:**
1. Recognize this produces a 3+ column table
2. Automatically generate HTML table instead of ASCII
3. Write to `~/.agent/diagrams/framework-comparison.html`
4. Open in browser
5. Provide brief summary in chat
6. Report file path

### Implementation Plan

**User:** "Generate a visual implementation plan for the caching layer"

**Jarvis will:**
1. Read visual-explainer skill and templates
2. Structure as: overview → flow → file structure → details → API → examples
3. Choose aesthetic (Editorial, Blueprint, etc.)
4. Generate HTML with Mermaid + code blocks
5. Write to `~/.agent/diagrams/caching-layer-plan.html`
6. Open in browser
7. Report file path

## Common Requests

### "Show me the architecture"
→ Architecture diagram (Mermaid or CSS Grid based on complexity)

### "Create a flowchart"
→ Mermaid flowchart with TD layout

### "Compare these options"
→ HTML table with sticky headers

### "Visualize this workflow"
→ Mermaid sequence or flowchart

### "Generate an implementation plan"
→ Multi-section HTML with diagrams + code

### "Make a dashboard"
→ CSS Grid cards with metrics and charts

## Tips

1. **Be specific** - Describe what you want to see
2. **Trust the aesthetic choice** - Jarvis varies it deliberately
3. **Review in browser** - HTML diagrams are interactive
4. **Share when needed** - Use the share script for collaborators
5. **Iterate if needed** - "Make the API section more detailed"

## File Structure

Every diagram is a single `.html` file:
- Self-contained (no external assets except CDN fonts/libraries)
- Semantic HTML
- Inline CSS with custom properties
- Optional inline JavaScript for interactivity

**Location:** `~/.agent/diagrams/<descriptive-name>.html`

**Opening:**
- macOS: `open ~/.agent/diagrams/filename.html`
- Linux: `xdg-open ~/.agent/diagrams/filename.html`

## Anti-Patterns to Avoid

Jarvis is trained to avoid these "AI slop" signals:

- Inter/Roboto as primary font
- Indigo/violet gradient text
- Emoji section headers
- Glowing animated shadows
- Neon cyan-magenta-pink
- Uniform visual treatment (no hierarchy)
- Three-dot window chrome on code blocks

Each generation uses distinctive typography, colors, and layout to avoid generic appearance.

## Summary

Visual-explainer transforms technical concepts into beautiful HTML diagrams:
- **Proactive tables** - 4+ rows or 3+ columns triggers auto-generation
- **Varied aesthetics** - Each diagram looks distinct
- **Interactive** - Zoom, pan, expand Mermaid diagrams
- **Shareable** - One command to deploy live URL
- **Self-contained** - Single HTML file, works offline

Request a diagram naturally, and Jarvis handles the rest.
