const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(method, path, body, opts = {}) {
  const token = localStorage.getItem("auth_token");

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let fetchBody;
  if (body instanceof FormData) {
    fetchBody = body;
  } else if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";
    fetchBody = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: fetchBody,
    ...opts,
  });

  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_roles");
    window.location.href = "/login";
    throw new ApiError(401, "Phiên đăng nhập hết hạn");
  }

  let json;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    json = await res.json();
  } else {
    const text = await res.text();
    if (!res.ok) throw new ApiError(res.status, text || "Lỗi không xác định");
    return text;
  }

  if (!res.ok) {
    const msg =
      json?.message || json?.error || `Lỗi ${res.status}`;
    throw new ApiError(res.status, msg, json);
  }

  // Auto-unwrap {code, message, data} wrapper
  if (json && typeof json === "object" && "data" in json && ("code" in json || "message" in json)) {
    return json.data;
  }

  return json;
}

const get = (path, opts) => request("GET", path, undefined, opts);
const post = (path, body, opts) => request("POST", path, body, opts);
const put = (path, body, opts) => request("PUT", path, body, opts);
const del = (path, body, opts) => request("DELETE", path, body, opts);

// ─── eAccount ───────────────────────────────────────────────────────────────

export const eAccount = {
  login: (email, password) =>
    post("/internal/auth/generate-token", { email, password }),

  getProfile: () => get("/account/profile"),

  updateProfile: (body) => put("/account/profile", body),

  createUser: (body) => post("/management/account/create", body),

  checkDeletable: (email) =>
    post("/management/account/check-deletable", { email }),

  deleteUser: (email) =>
    post("/management/account/delete", { email }),

  searchUser: (email) =>
    post("/management/account/search", { email }),

  searchUserRoles: (email) =>
    post("/permissions/search-user-roles", { email }),

  syncRoles: (email, roles) =>
    post("/permissions/sync", { email, roles }),

  getSystemRoles: () => get("/permissions/system-roles"),

  checkAccess: (email, requiredRole) =>
    post("/internal/permissions/check-access", { email, requiredRole }),
};

// ─── eForm ──────────────────────────────────────────────────────────────────

export const eForm = {
  getForm: (formId) => get(`/owner/form?formId=${formId}`),

  findForms: (body = {}, page = 0, size = 8) =>
    post(`/owner/find-form?page=${page}&size=${size}&sort=createdDate,desc`, body),

  createForm: (body) => post("/owner/form", body),

  updateForm: (body) => put("/owner/form", body),

  duplicateForm: (formId) =>
    post(`/owner/duplicate-form?formId=${formId}`),

  deleteForm: (formId) => del(`/owner/form?formId=${encodeURIComponent(formId)}`),

  checkEdit: (formId) => get(`/common/check-edit?formId=${formId}`),

  publishForm: (formId) =>
    get(`/owner/form/change-status?formId=${formId}`),

  unpublishForm: (formId) =>
    del(`/owner/form/change-status?formId=${formId}`),

  getFormData: (formDataId) => get(`/form-data/${formDataId}`),

  submitFormData: (body) => post("/owner/form-data", body),
};

// ─── eFlow ──────────────────────────────────────────────────────────────────

export const eFlow = {
  initWorkflow: (body) => post("/workflow/init", body),

  getWorkflowGroup: () => get("/workflow/group"),

  listWorkflows: (body = {}) => post("/workflow", body),

  getSummary: (flowId) => get(`/workflow/${flowId}/summary`),

  updateInfo: (flowId, body) => put(`/workflow/${flowId}/info`, body),

  setStatus: (flowId, status) =>
    post(`/workflow/${flowId}/status`, status),

  deleteWorkflow: (flowId) => del(`/workflow/${flowId}`),

  getDefinition: (flowId) => get(`/workflow/${flowId}/definition`),

  addNode: (flowId, body) => post(`/workflow/${flowId}/node`, body),

  updateNodeMetadata: (nodeId, body) =>
    put(`/node/${nodeId}/metadata`, body),

  addEdge: (flowId, body) => post(`/workflow/${flowId}/edge`, body),

  deleteElements: (body) => del("/workflow/elements", body),

  addPerformer: (nodeId, body) =>
    post(`/node/${nodeId}/performer`, body),

  getPerformers: (nodeId) => get(`/node/${nodeId}/performers`),

  deletePerformer: (performerId) => del(`/performers/${performerId}`),

  mapForm: (nodeId, body) => post(`/node/${nodeId}/map-form`, body),

  mapVariable: (mapFormId, body) =>
    post(`/map-form/${mapFormId}/variable`, body),

  setFormula: (variableId, body) =>
    put(`/variable/${variableId}/formula`, body),

  getInheritance: (nodeId) =>
    get(`/node/${nodeId}/inheritance-blueprint`),

  configSwitch: (switchId, body) =>
    post(`/switch/${switchId}/config`, body),

  addRelateDemand: (body) => post("/relate-demand", body),

  getDemands: (switchId) => get(`/switch/${switchId}/demands`),

  getNextNode: (flowId, body) =>
    post(`/internal/flow/${flowId}/next-node`, body),

  getActionPlan: (nodeId) =>
    get(`/internal/node/${nodeId}/action-plan`),

  proxyUsers: (query) =>
    get(`/proxy/eaccount/users${query ? `?q=${encodeURIComponent(query)}` : ""}`),

  proxyPublishedForms: () => get("/proxy/eform/published-forms"),
};

// ─── eRequest ───────────────────────────────────────────────────────────────

export const eRequest = {
  getMyWorkflows: () => get("/request/workflows"),

  initTicket: (body) => post("/request/ticket/init", body),

  getRelatedOptions: (query) =>
    get(`/request/ticket/related-options${query ? `?q=${encodeURIComponent(query)}` : ""}`),

  getMyRequests: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/request/tickets/my-requests${qs ? `?${qs}` : ""}`);
  },

  getPendingTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/request/tickets/pending-tasks${qs ? `?${qs}` : ""}`);
  },

  exportTickets: (body) => post("/request/ticket/export", body),

  getTicketDetail: (ticketId) =>
    get(`/request/ticket/${ticketId}/detail`),

  getStepConfig: (ticketId) =>
    get(`/request/ticket/${ticketId}/step-config`),

  submitTicket: (ticketId, body) =>
    post(`/request/ticket/${ticketId}/submit`, body),

  actionTicket: (ticketId, body) =>
    post(`/request/ticket/${ticketId}/action`, body),

  getHistory: (ticketId) =>
    get(`/request/ticket/${ticketId}/history`),

  getSLA: (ticketId) => get(`/request/ticket/${ticketId}/sla`),

  getRelated: (ticketId) =>
    get(`/request/ticket/${ticketId}/related`),

  commentTicket: (ticketId, body) =>
    post(`/request/ticket/${ticketId}/comment`, body),

  deleteComment: (commentId) => del(`/ticket-comments/${commentId}`),
};

// ─── eAi ────────────────────────────────────────────────────────────────────

export const eAi = {
  uploadDocument: (file, formName) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("formName", formName);
    return post("/document-maps", fd);
  },

  getStatus: (taskId) => get(`/document-maps/${taskId}/status`),

  getResult: (taskId) => get(`/document-maps/${taskId}/result`),

  submitSync: (file, formName) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("formName", formName);
    return post("/document-maps/sync", fd);
  },

  getRawText: (taskId) => get(`/document-maps/${taskId}/raw-text`),

  createFromPdf: (body) => post("/request/ai/create-from-pdf", body),

  verifyAiData: (taskId) =>
    get(`/request/ai/verify-data?taskId=${taskId}`),
};
