#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── Config ───────────────────────────────────────────────────────

const API_URL =
    process.env.MOCHII_API_URL ||
    "https://excgujbdnaapaddhuhcr.supabase.co/functions/v1/mochii-api";
const API_KEY = process.env.MOCHII_API_KEY || "";

if (!API_KEY) {
    console.error("Error: MOCHII_API_KEY environment variable is required");
    process.exit(1);
}

// ─── HTTP helper ──────────────────────────────────────────────────

async function api(
    path: string,
    options: { method?: string; body?: unknown; params?: Record<string, string> } = {}
) {
    const url = new URL(`${API_URL}/${path}`);
    if (options.params) {
        for (const [k, v] of Object.entries(options.params)) {
            if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
        }
    }

    const resp = await fetch(url.toString(), {
        method: options.method || "GET",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await resp.json();
    if (!resp.ok) {
        throw new Error(data.error || `HTTP ${resp.status}`);
    }
    return data;
}

// ─── Server ───────────────────────────────────────────────────────

const server = new McpServer({
    name: "mochii",
    version: "1.0.0",
});

// ─── Projects ─────────────────────────────────────────────────────

server.tool(
    "list_projects",
    "List all projects in the Mochii organization. Supports pagination and status filtering.",
    {
        limit: z.number().optional().describe("Max results (default 50, max 200)"),
        offset: z.number().optional().describe("Offset for pagination"),
        status: z.string().optional().describe("Filter by status (e.g. 'active', 'completed')"),
    },
    async (args) => {
        const params: Record<string, string> = {};
        if (args.limit) params.limit = String(args.limit);
        if (args.offset) params.offset = String(args.offset);
        if (args.status) params.status = args.status;
        const result = await api("projects", { params });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

server.tool(
    "get_project",
    "Get detailed information about a specific project by ID.",
    {
        id: z.string().describe("Project UUID"),
    },
    async (args) => {
        const result = await api(`projects/${args.id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

server.tool(
    "create_project",
    "Create a new project in the organization.",
    {
        name: z.string().describe("Project name"),
        description: z.string().optional().describe("Project description"),
        status: z.string().optional().describe("Project status (default: 'active')"),
        start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
        client_id: z.string().optional().describe("Client UUID to associate"),
        project_type: z.string().optional().describe("Project type (default: 'default')"),
    },
    async (args) => {
        const result = await api("projects", { method: "POST", body: args });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

server.tool(
    "update_project",
    "Update fields on an existing project.",
    {
        id: z.string().describe("Project UUID"),
        name: z.string().optional().describe("New name"),
        description: z.string().optional().describe("New description"),
        status: z.string().optional().describe("New status"),
        start_date: z.string().optional().describe("New start date"),
        due_date: z.string().optional().describe("New due date"),
    },
    async (args) => {
        const { id, ...body } = args;
        const result = await api(`projects/${id}`, { method: "PUT", body });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

// ─── Tasks ────────────────────────────────────────────────────────

server.tool(
    "list_tasks",
    "List tasks with optional filters for project, status, and assignee.",
    {
        limit: z.number().optional().describe("Max results (default 50, max 200)"),
        offset: z.number().optional().describe("Offset for pagination"),
        project_id: z.string().optional().describe("Filter by project UUID"),
        status: z.string().optional().describe("Filter by status (e.g. 'pending', 'in_progress', 'completed')"),
        assignee_profile_id: z.string().optional().describe("Filter by assignee profile UUID"),
    },
    async (args) => {
        const params: Record<string, string> = {};
        if (args.limit) params.limit = String(args.limit);
        if (args.offset) params.offset = String(args.offset);
        if (args.project_id) params.project_id = args.project_id;
        if (args.status) params.status = args.status;
        if (args.assignee_profile_id) params.assignee_profile_id = args.assignee_profile_id;
        const result = await api("tasks", { params });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

server.tool(
    "get_task",
    "Get detailed information about a specific task, including comment count.",
    {
        id: z.string().describe("Task UUID"),
    },
    async (args) => {
        const result = await api(`tasks/${args.id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

server.tool(
    "create_task",
    "Create a new task in the organization.",
    {
        title: z.string().describe("Task title"),
        description: z.string().optional().describe("Task description"),
        status: z.string().optional().describe("Status (default: 'pending')"),
        priority: z.string().optional().describe("Priority: low, medium, high (default: 'medium')"),
        due_date: z.string().optional().describe("Due date (ISO 8601)"),
        assignee_profile_id: z.string().optional().describe("Assignee profile UUID"),
        project_id: z.string().optional().describe("Project UUID to link to"),
        section_id: z.string().optional().describe("Section UUID within the project"),
        estimated_hours: z.number().optional().describe("Estimated hours"),
    },
    async (args) => {
        const result = await api("tasks", { method: "POST", body: args });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

server.tool(
    "update_task",
    "Update fields on an existing task.",
    {
        id: z.string().describe("Task UUID"),
        title: z.string().optional().describe("New title"),
        description: z.string().optional().describe("New description"),
        status: z.string().optional().describe("New status"),
        priority: z.string().optional().describe("New priority"),
        due_date: z.string().optional().describe("New due date"),
        assignee_profile_id: z.string().optional().describe("New assignee UUID"),
        estimated_hours: z.number().optional().describe("New estimated hours"),
        actual_hours: z.number().optional().describe("Actual hours spent"),
    },
    async (args) => {
        const { id, ...body } = args;
        const result = await api(`tasks/${id}`, { method: "PUT", body });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

// ─── Comments ─────────────────────────────────────────────────────

server.tool(
    "list_comments",
    "List comments on a specific task.",
    {
        task_id: z.string().describe("Task UUID"),
        limit: z.number().optional().describe("Max results (default 50)"),
    },
    async (args) => {
        const params: Record<string, string> = {};
        if (args.limit) params.limit = String(args.limit);
        const result = await api(`tasks/${args.task_id}/comments`, { params });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

server.tool(
    "add_comment",
    "Add a comment to a task.",
    {
        task_id: z.string().describe("Task UUID"),
        content: z.string().describe("Comment text"),
        is_internal: z.boolean().optional().describe("Mark as internal-only (default: false)"),
    },
    async (args) => {
        const { task_id, ...body } = args;
        const result = await api(`tasks/${task_id}/comments`, { method: "POST", body });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

// ─── Clients ──────────────────────────────────────────────────────

server.tool(
    "list_clients",
    "List all clients in the organization.",
    {},
    async () => {
        const result = await api("clients");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

server.tool(
    "create_client",
    "Create a new client in the organization.",
    {
        name: z.string().describe("Client name"),
        status: z.string().optional().describe("Status (default: 'active')"),
        metadata: z.record(z.string(), z.unknown()).optional().describe("Additional metadata as key-value pairs"),
    },
    async (args) => {
        const result = await api("clients", { method: "POST", body: args });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

// ─── Members ──────────────────────────────────────────────────────

server.tool(
    "list_members",
    "List all member profiles in the organization.",
    {},
    async () => {
        const result = await api("profiles");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

// ─── Start ────────────────────────────────────────────────────────

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Mochii MCP Server running on stdio");
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
