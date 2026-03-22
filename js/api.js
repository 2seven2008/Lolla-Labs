// ─── API Client ───────────────────────────────────────────────────────────────
const API = {
  baseUrl: "/api",

  _getToken() {
    return localStorage.getItem("lolla_token");
  },

  _authHeaders() {
    const token = this._getToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  },

  async _handleResponse(res) {
    if (res.status === 401) {
      // Token expired or invalid — force logout
      localStorage.removeItem("lolla_token");
      localStorage.removeItem("lolla_agent");
      window.location.replace("/login");
      throw new Error("Sessão expirada");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async get(endpoint) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this._authHeaders(),
    });
    return this._handleResponse(res);
  },

  async post(endpoint, body) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this._authHeaders(),
      body: JSON.stringify(body),
    });
    return this._handleResponse(res);
  },

  async postPublic(endpoint, body) {
    // No auth header — for public endpoints like login and enviar-look
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async postForm(endpoint, formData) {
    // multipart — no Content-Type header (browser sets boundary automatically)
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async patch(endpoint, body) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PATCH",
      headers: this._authHeaders(),
      body: JSON.stringify(body),
    });
    return this._handleResponse(res);
  },
};
