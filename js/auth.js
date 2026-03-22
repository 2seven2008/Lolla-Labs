// ─── Auth Helpers ─────────────────────────────────────────────────────────────
// Usado em todas as páginas que precisam de autenticação.
// Inclua este script em agentes.html e chame Auth.requireAuth() no topo da página.

const Auth = {
  TOKEN_KEY: "lolla_token",
  AGENT_KEY: "lolla_agent",

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getAgent() {
    const raw = localStorage.getItem(this.AGENT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    const token = this.getToken();
    if (!token) return false;

    // Decode payload (no signature check — server always validates)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      // exp is in seconds
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        this._clear();
        return false;
      }
    } catch {
      this._clear();
      return false;
    }

    return true;
  },

  _clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.AGENT_KEY);
  },

  logout() {
    this._clear();
    window.location.href = "/login";
  },

  /**
   * Call at the top of any protected page.
   * Redirects to /login if no valid token exists.
   * Returns true if authenticated, false otherwise.
   */
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.replace("/login");
      return false;
    }
    return true;
  },

  /**
   * Persists token and agent info after a successful login API response.
   */
  saveSession(token, agent) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.AGENT_KEY, JSON.stringify(agent));
  },
};
