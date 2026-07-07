const INDEX_KEY = "project-index";
const TOKEN_USAGE_KEY = "token-usage-by-client";
const DELETED_PROJECTS_KEY = "deleted-projects";
const DELETED_MESSAGES_KEY = "deleted-messages";

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function handleOptions() {
  return json({}, { status: 204 });
}

function unauthorized() {
  return json({ error: "未授权。" }, { status: 401 });
}

function assertAuth(request, env) {
  if (!env.SYNC_TOKEN) {
    return true;
  }

  const header = request.headers.get("Authorization") || "";
  return header === `Bearer ${env.SYNC_TOKEN}`;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}


function normalizeTokenUsage(usage = {}) {
  return {
    requests: Number(usage.requests) || 0,
    prompt: Number(usage.prompt) || 0,
    completion: Number(usage.completion) || 0,
    total: Number(usage.total) || 0,
  };
}

function normalizeTokenUsageByClient(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((items, [clientId, usage]) => {
    if (clientId) {
      items[clientId] = normalizeTokenUsage(usage);
    }
    return items;
  }, {});
}

async function getTokenUsageByClient(env) {
  const raw = await env.DIALOGUE_TRANSLATOR_SYNC.get(TOKEN_USAGE_KEY);
  return normalizeTokenUsageByClient(raw ? JSON.parse(raw) : {});
}

async function mergeTokenUsageByClient(env, incomingUsageByClient = {}) {
  const local = await getTokenUsageByClient(env);
  const merged = { ...local };

  Object.entries(normalizeTokenUsageByClient(incomingUsageByClient)).forEach(([clientId, incoming]) => {
    const existing = normalizeTokenUsage(merged[clientId]);
    merged[clientId] = incoming.total >= existing.total ? incoming : existing;
  });

  await env.DIALOGUE_TRANSLATOR_SYNC.put(TOKEN_USAGE_KEY, JSON.stringify(merged));
  return merged;
}

function normalizeDeletedProjects(value = {}) {
  if (Array.isArray(value)) {
    return value.reduce((items, item) => {
      if (item?.id) {
        items[item.id] = item.deletedAt || item.updatedAt || new Date().toISOString();
      }
      return items;
    }, {});
  }

  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.entries(value).reduce((items, [id, deletedAt]) => {
    if (id && deletedAt) {
      items[id] = deletedAt;
    }
    return items;
  }, {});
}

function normalizeDeletedMessages(value = {}) {
  if (Array.isArray(value)) {
    return value.reduce((projects, item) => {
      const projectId = item?.projectId;
      const messageId = item?.messageId || item?.id;

      if (projectId && messageId) {
        projects[projectId] = {
          ...(projects[projectId] || {}),
          [messageId]: item.deletedAt || item.updatedAt || new Date().toISOString(),
        };
      }

      return projects;
    }, {});
  }

  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.entries(value).reduce((projects, [projectId, messages]) => {
    if (!projectId || !messages || typeof messages !== "object") {
      return projects;
    }

    const normalizedMessages = Object.entries(messages).reduce((items, [messageId, deletedAt]) => {
      if (messageId && deletedAt) {
        items[messageId] = deletedAt;
      }
      return items;
    }, {});

    if (Object.keys(normalizedMessages).length) {
      projects[projectId] = normalizedMessages;
    }

    return projects;
  }, {});
}

async function getDeletedProjects(env) {
  const raw = await env.DIALOGUE_TRANSLATOR_SYNC.get(DELETED_PROJECTS_KEY);
  return normalizeDeletedProjects(raw ? JSON.parse(raw) : {});
}

async function getDeletedMessages(env) {
  const raw = await env.DIALOGUE_TRANSLATOR_SYNC.get(DELETED_MESSAGES_KEY);
  return normalizeDeletedMessages(raw ? JSON.parse(raw) : {});
}

async function mergeDeletedProjects(env, incomingDeletedProjects = {}) {
  const local = await getDeletedProjects(env);
  const merged = { ...local };

  Object.entries(normalizeDeletedProjects(incomingDeletedProjects)).forEach(([projectId, deletedAt]) => {
    const incomingTime = new Date(deletedAt || 0).getTime() || 0;
    const localTime = new Date(merged[projectId] || 0).getTime() || 0;

    if (incomingTime > localTime) {
      merged[projectId] = deletedAt;
    }
  });

  await env.DIALOGUE_TRANSLATOR_SYNC.put(DELETED_PROJECTS_KEY, JSON.stringify(merged));
  return merged;
}

async function mergeDeletedMessages(env, incomingDeletedMessages = {}) {
  const local = await getDeletedMessages(env);
  const merged = { ...local };

  Object.entries(normalizeDeletedMessages(incomingDeletedMessages)).forEach(([projectId, messages]) => {
    Object.entries(messages).forEach(([messageId, deletedAt]) => {
      const incomingTime = new Date(deletedAt || 0).getTime() || 0;
      const localTime = new Date(merged[projectId]?.[messageId] || 0).getTime() || 0;

      if (incomingTime > localTime) {
        merged[projectId] = {
          ...(merged[projectId] || {}),
          [messageId]: deletedAt,
        };
      }
    });
  });

  await env.DIALOGUE_TRANSLATOR_SYNC.put(DELETED_MESSAGES_KEY, JSON.stringify(merged));
  return merged;
}
function normalizeProject(project = {}) {
  const now = new Date().toISOString();
  return {
    id: String(project.id || crypto.randomUUID()),
    name: String(project.name || "未命名项目"),
    languageA: String(project.languageA || "中文"),
    languageB: String(project.languageB || "英语"),
    messages: Array.isArray(project.messages) ? project.messages : [],
    createdAt: project.createdAt || now,
    updatedAt: project.updatedAt || now,
    isPinned: Boolean(project.isPinned),
    isArchived: Boolean(project.isArchived),
    recordsFolderName: project.recordsFolderName || "",
  };
}

function messageTime(message) {
  return new Date(message?.updatedAt || message?.createdAt || 0).getTime() || 0;
}

function projectTime(project) {
  const messageTimes = (project.messages || []).map(messageTime);
  return Math.max(new Date(project.updatedAt || 0).getTime() || 0, ...messageTimes, 0);
}

function isProjectDeleted(project, deletedProjects = {}) {
  const deletedTime = new Date(deletedProjects[project?.id] || 0).getTime() || 0;
  return deletedTime && deletedTime >= projectTime(project);
}

function filterDeletedMessages(project, deletedMessages = {}) {
  const projectDeletedMessages = deletedMessages[project.id] || {};
  return {
    ...project,
    messages: (project.messages || []).filter((message) => {
      const deletedTime = new Date(projectDeletedMessages[message?.id] || 0).getTime() || 0;
      return !deletedTime || deletedTime < messageTime(message);
    }),
  };
}

function mergeProjects(localProject, remoteProject, deletedMessages = {}) {
  const local = filterDeletedMessages(normalizeProject(localProject), deletedMessages);
  const remote = filterDeletedMessages(normalizeProject(remoteProject), deletedMessages);
  const messageMap = new Map((local.messages || []).map((message) => [message.id, message]));
  const localOrder = (local.messages || []).map((message) => message.id);
  const remoteOnly = [];

  for (const remoteMessage of remote.messages || []) {
    if (!remoteMessage?.id) {
      continue;
    }

    const localMessage = messageMap.get(remoteMessage.id);

    if (!localMessage || messageTime(remoteMessage) >= messageTime(localMessage)) {
      messageMap.set(remoteMessage.id, remoteMessage);
    }

    if (!localOrder.includes(remoteMessage.id)) {
      remoteOnly.push(remoteMessage.id);
    }
  }

  const newerProject = projectTime(remote) >= projectTime(local) ? remote : local;

  return {
    ...local,
    ...newerProject,
    id: local.id,
    messages: [...localOrder, ...remoteOnly]
      .map((id) => messageMap.get(id))
      .filter(Boolean)
      .filter((message) => !deletedMessages[local.id]?.[message.id] || new Date(deletedMessages[local.id][message.id]).getTime() < messageTime(message)),
    updatedAt: new Date(Math.max(projectTime(local), projectTime(remote), Date.now())).toISOString(),
  };
}

async function getIndex(env) {
  const raw = await env.DIALOGUE_TRANSLATOR_SYNC.get(INDEX_KEY);
  const ids = raw ? JSON.parse(raw) : [];
  return Array.isArray(ids) ? ids : [];
}

async function saveIndex(env, ids) {
  await env.DIALOGUE_TRANSLATOR_SYNC.put(INDEX_KEY, JSON.stringify([...new Set(ids)]));
}

async function getProject(env, id) {
  const raw = await env.DIALOGUE_TRANSLATOR_SYNC.get(`project:${id}`);
  return raw ? JSON.parse(raw) : null;
}

async function putProject(env, project) {
  await env.DIALOGUE_TRANSLATOR_SYNC.put(`project:${project.id}`, JSON.stringify(project));
  const ids = await getIndex(env);
  if (!ids.includes(project.id)) {
    ids.unshift(project.id);
    await saveIndex(env, ids);
  }
}

async function listProjects(env) {
  const ids = await getIndex(env);
  const deletedProjects = await getDeletedProjects(env);
  const deletedMessages = await getDeletedMessages(env);
  const projects = [];

  for (const id of ids) {
    const project = await getProject(env, id);
    if (project && !isProjectDeleted(project, deletedProjects)) {
      projects.push(filterDeletedMessages(project, deletedMessages));
    }
  }

  projects.sort((first, second) => projectTime(second) - projectTime(first));
  return projects;
}

async function syncOne(request, env) {
  const body = await readJson(request);
  const deletedProjects = await mergeDeletedProjects(env, body.deletedProjects);
  const deletedMessages = await mergeDeletedMessages(env, body.deletedMessages);
  const incoming = normalizeProject(body.project || body);
  if (isProjectDeleted(incoming, deletedProjects)) {
    return json({ project: null, deletedProjects, deletedMessages });
  }
  const existing = await getProject(env, incoming.id);
  const merged = existing ? mergeProjects(existing, incoming, deletedMessages) : filterDeletedMessages(incoming, deletedMessages);
  await putProject(env, merged);
  return json({ project: merged, deletedProjects, deletedMessages });
}

async function syncAll(request, env) {
  const body = await readJson(request);
  const incomingProjects = Array.isArray(body.projects) ? body.projects : [];
  const tokenUsageByClient = await mergeTokenUsageByClient(env, body.tokenUsageByClient);
  const deletedProjects = await mergeDeletedProjects(env, body.deletedProjects);
  const deletedMessages = await mergeDeletedMessages(env, body.deletedMessages);

  for (const project of incomingProjects) {
    const incoming = normalizeProject(project);
    if (isProjectDeleted(incoming, deletedProjects)) {
      continue;
    }
    const existing = await getProject(env, incoming.id);
    const merged = existing ? mergeProjects(existing, incoming, deletedMessages) : filterDeletedMessages(incoming, deletedMessages);
    await putProject(env, merged);
  }

  return json({
    projects: await listProjects(env),
    deletedProjects: await getDeletedProjects(env),
    deletedMessages: await getDeletedMessages(env),
    tokenUsageByClient,
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    if (!assertAuth(request, env)) {
      return unauthorized();
    }

    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true });
      }

      if (request.method === "GET" && url.pathname === "/projects") {
        return json({
          projects: await listProjects(env),
          deletedProjects: await getDeletedProjects(env),
          deletedMessages: await getDeletedMessages(env),
          tokenUsageByClient: await getTokenUsageByClient(env),
        });
      }

      if (request.method === "POST" && url.pathname === "/projects/sync") {
        return syncOne(request, env);
      }

      if (request.method === "POST" && url.pathname === "/projects/sync-all") {
        return syncAll(request, env);
      }

      return json({ error: "Not found" }, { status: 404 });
    } catch (error) {
      return json({ error: error.message || "同步服务错误。" }, { status: 500 });
    }
  },
};
