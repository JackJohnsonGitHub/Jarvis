export function createWorkflowSnapshot(meta) {
    return {
        name: meta.name,
        description: meta.description,
        phases: meta.phases?.map((phase) => phase.title) ?? [],
        logs: [],
        agents: [],
        agentCount: 0,
        runningCount: 0,
        doneCount: 0,
        errorCount: 0,
    };
}
export function recomputeWorkflowSnapshot(snapshot) {
    const runningCount = snapshot.agents.filter((agent) => agent.status === "running").length;
    const doneCount = snapshot.agents.filter((agent) => agent.status === "done").length;
    const errorCount = snapshot.agents.filter((agent) => agent.status === "error").length;
    return { ...snapshot, agentCount: snapshot.agents.length, runningCount, doneCount, errorCount };
}
export function createWidgetWorkflowDisplay(ctx, options = {}) {
    const key = options.key ?? "workflow";
    const placement = options.placement ?? "belowEditor";
    const showStatus = options.showStatus ?? false;
    // Mutable state captured by the component closure so re-renders
    // always read the latest snapshot even though the factory ran once.
    let snapshot;
    let completed = false;
    // Store the factory so update()/complete() can re-register it to trigger re-render.
    const widgetFactory = (_tui, theme) => ({
        render: () => (snapshot ? renderWorkflowLines(snapshot, options, theme) : []),
        invalidate: () => { },
    });
    if (ctx.hasUI) {
        ctx.ui.setWidget(key, widgetFactory, { placement });
    }
    return {
        update(s) {
            snapshot = s;
            if (!ctx.hasUI)
                return;
            if (showStatus)
                ctx.ui.setStatus(key, statusLine(s, completed));
            ctx.ui.setWidget(key, widgetFactory, { placement });
        },
        complete(s) {
            snapshot = s;
            completed = true;
            if (!ctx.hasUI)
                return;
            if (showStatus)
                ctx.ui.setStatus(key, statusLine(s, true));
            ctx.ui.setWidget(key, widgetFactory, { placement });
        },
        clear() {
            if (!ctx.hasUI)
                return;
            if (showStatus)
                ctx.ui.setStatus(key, undefined);
            ctx.ui.setWidget(key, undefined);
        },
    };
}
export function createToolUpdateWorkflowDisplay(onUpdate, ctx, options = {}) {
    const widget = ctx ? createWidgetWorkflowDisplay(ctx, options) : undefined;
    const streamToolUpdates = options.streamToolUpdates ?? !ctx?.hasUI;
    const emit = (snapshot, completed = false) => {
        if (streamToolUpdates) {
            onUpdate?.({
                content: [{ type: "text", text: renderWorkflowText(snapshot, completed) }],
                details: snapshot,
            });
        }
        if (completed)
            widget?.complete(snapshot);
        else
            widget?.update(snapshot);
    };
    return {
        update(snapshot) {
            emit(snapshot, false);
        },
        complete(snapshot) {
            emit(snapshot, true);
        },
        clear() {
            widget?.clear();
        },
    };
}
/** Identity passthrough for contexts where no theme is available (tool text output). */
const NO_THEME = { fg: (_c, t) => t, bold: (t) => t };
export function renderWorkflowLines(snapshot, options = {}, theme = NO_THEME) {
    const maxAgents = options.maxAgents ?? 8;
    const showResultPreviews = options.showResultPreviews ?? false;
    const state = snapshot.errorCount > 0
        ? `, ${snapshot.errorCount} errors`
        : snapshot.runningCount > 0
            ? `, ${snapshot.runningCount} running`
            : "";
    // Build header with token info (and cost when the provider reports it)
    const usage = snapshot.tokenUsage;
    const costInfo = usage?.cost ? ` · $${usage.cost.toFixed(4)}` : "";
    const tokenInfo = usage ? ` · ${usage.total.toLocaleString()} tokens${costInfo}` : "";
    const lines = [
        `${theme.bold(`◆ Workflow: ${snapshot.name}`)} (${snapshot.doneCount}/${snapshot.agentCount} done${state}${tokenInfo})`,
    ];
    const phaseNames = snapshot.phases.length
        ? snapshot.phases
        : unique(snapshot.agents.map((agent) => agent.phase).filter(Boolean));
    const rendered = new Set();
    for (const phase of phaseNames) {
        const agents = snapshot.agents.filter((agent) => agent.phase === phase);
        for (const agent of agents)
            rendered.add(agent);
        const done = agents.filter((agent) => agent.status === "done").length;
        const running = agents.filter((agent) => agent.status === "running").length;
        const errors = agents.filter((agent) => agent.status === "error").length;
        const skipped = agents.filter((agent) => agent.status === "skipped").length;
        const complete = agents.length > 0 && done + errors + skipped === agents.length;
        const marker = running > 0 || (!complete && snapshot.currentPhase === phase) ? "▶" : complete ? "✓" : " ";
        lines.push(theme.fg("accent", `  ${marker} ${phase}`) +
            theme.fg("dim", ` ${done}/${agents.length}${running ? ` · ${running} running` : ""}${errors ? ` · ${errors} errors` : ""}${skipped ? ` · ${skipped} skipped` : ""}`));
        const visibleAgents = agents.slice(-maxAgents);
        for (const agent of visibleAgents) {
            const order = `[${agent.id}]`;
            const result = showResultPreviews && agent.resultPreview ? ` — ${agent.resultPreview}` : "";
            const agentTokens = agent.tokens ? theme.fg("dim", ` [${agent.tokens.toLocaleString()} tok]`) : "";
            lines.push(`    ${order} ${statusIcon(agent.status)} ${shorten(agent.label, 48)}${agentTokens}${result}`);
        }
        if (agents.length > visibleAgents.length)
            lines.push(theme.fg("dim", `    … ${agents.length - visibleAgents.length} earlier agents`));
    }
    const unphased = snapshot.agents.filter((agent) => !rendered.has(agent));
    if (unphased.length) {
        lines.push(theme.fg("accent", "  Unphased"));
        for (const agent of unphased.slice(-maxAgents)) {
            const result = showResultPreviews && agent.resultPreview ? ` — ${agent.resultPreview}` : "";
            const agentTokens = agent.tokens ? theme.fg("dim", ` [${agent.tokens.toLocaleString()} tok]`) : "";
            lines.push(`    [${agent.id}] ${statusIcon(agent.status)} ${shorten(agent.label, 48)}${agentTokens}${result}`);
        }
    }
    return lines;
}
export function renderWorkflowText(snapshot, completed = false) {
    const header = completed ? "Workflow completed" : "Workflow running";
    return [header, ...renderWorkflowLines(snapshot)].join("\n");
}
function statusLine(snapshot, completed) {
    if (completed)
        return `workflow ✓ ${snapshot.name}: ${snapshot.doneCount}/${snapshot.agentCount}`;
    if (snapshot.runningCount > 0)
        return `workflow ${snapshot.name}: ${snapshot.runningCount} running, ${snapshot.doneCount}/${snapshot.agentCount} done`;
    return `workflow ${snapshot.name}: ${snapshot.doneCount}/${snapshot.agentCount} done`;
}
function statusIcon(status) {
    switch (status) {
        case "queued":
            return "○";
        case "running":
            return "●";
        case "done":
            return "✓";
        case "error":
            return "✗";
        case "skipped":
            return "-";
    }
}
function unique(values) {
    return [...new Set(values)];
}
function shorten(value, max) {
    const text = value.replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
export function preview(value, max = 80) {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    if (!text)
        return "";
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
