// Pulls the Stitch project into design/stitch/ (DESIGN.md, screens.json, HTML + PNG per screen).
// Usage: node scripts/stitch-pull.mjs
// Reads the Stitch MCP server config (URL + API key) from ~/.claude.json, so no secret lives in the repo.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "8229975157933039003";
const OUT = "design/stitch";

const claudeConfig = JSON.parse(readFileSync(join(homedir(), ".claude.json"), "utf8"));
const server = Object.entries(claudeConfig.projects ?? {}).find(
  ([path, p]) => path.toLowerCase().endsWith("/solstice") && p.mcpServers?.stitch,
)?.[1].mcpServers.stitch;
if (!server) throw new Error("No `stitch` MCP server configured for this project in ~/.claude.json");

let sessionId;
async function rpc(method, params, id) {
  const res = await fetch(server.url, {
    method: "POST",
    headers: {
      ...server.headers,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, ...(id ? { id } : {}) }),
  });
  sessionId = res.headers.get("mcp-session-id") ?? sessionId;
  const text = await res.text();
  if (!id) return;
  const body = text.includes("data:")
    ? text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).pop()
    : text;
  const json = JSON.parse(body);
  if (json.error || json.result?.isError) throw new Error(`${method}: ${JSON.stringify(json).slice(0, 500)}`);
  return json.result;
}

const callTool = async (name, args) =>
  JSON.parse((await rpc("tools/call", { name, arguments: args }, 2)).content[0].text);

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "stitch-pull", version: "1" } }, 1);
await rpc("notifications/initialized", {});

const project = await callTool("get_project", { name: `projects/${PROJECT_ID}` });
const { screens } = await callTool("list_screens", { projectId: PROJECT_ID });

mkdirSync(`${OUT}/screens`, { recursive: true });
if (project.designTheme?.designMd) writeFileSync(`${OUT}/DESIGN.md`, project.designTheme.designMd);

let previous = [];
try {
  previous = JSON.parse(readFileSync(`${OUT}/screens.json`, "utf8")).screens.map((s) => s.id);
} catch {}

const index = [];
for (const s of screens) {
  const id = s.name.split("/").pop();
  const file = `screens/${slug(s.title)}`;
  if (s.htmlCode?.downloadUrl) writeFileSync(`${OUT}/${file}.html`, await (await fetch(s.htmlCode.downloadUrl)).text());
  if (s.screenshot?.downloadUrl)
    writeFileSync(`${OUT}/${file}.png`, Buffer.from(await (await fetch(s.screenshot.downloadUrl)).arrayBuffer()));
  index.push({ id, title: s.title, device: s.deviceType ?? "ASSET", size: `${s.width}x${s.height}`, file });
}

writeFileSync(
  `${OUT}/screens.json`,
  JSON.stringify(
    { project: `projects/${PROJECT_ID}`, title: project.title, pulled: new Date().toISOString().slice(0, 10), screens: index },
    null,
    2,
  ) + "\n",
);

const added = index.filter((s) => !previous.includes(s.id));
console.log(`Pulled ${index.length} screens (${added.length} new)`);
for (const s of added) console.log(`  + ${s.file}  [${s.device}]  ${s.title}`);
