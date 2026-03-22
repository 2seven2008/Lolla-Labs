// ─── Auth Helpers ─────────────────────────────────────────
const Auth = {
  getToken() {
    return localStorage.getItem('lolla_token');
  },

  getAgent() {
    const raw = localStorage.getItem('lolla_agent');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem('lolla_token');
    localStorage.removeItem('lolla_agent');
    window.location.href = '/login';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/login';
      return false;
    }
    return true;
  }
};
