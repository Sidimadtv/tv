(function () {
  "use strict";

  const AUTH_API_URL = atob("aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6anV5M0lxREtnWFlKTkVXVnBvQkZPMjN2Yzg3TGVRU0hPXzlVNjVoOXhRUG51SVo5U2lqOHh1YzFVdDlYYjRoVE9JdkEvZXhlYw==");
  const SESSION_KEY = "blog_auth_session";
  const SESSION_DURATION = 3 * 60 * 60 * 1000;

  function safeGet(id) {
    return document.getElementById(id);
  }

  function initAuthSystem() {
    const authOverlay = safeGet("authOverlay");
    const blogContent = safeGet("blogContent");
    const loginForm = safeGet("loginForm");
    const signupForm = safeGet("signupForm");
    const forgotForm = safeGet("forgotForm");
    const otpForm = safeGet("otpForm");
    const resetForm = safeGet("resetForm");

    if (!authOverlay || !blogContent) {
      console.warn("Auth elements missing.");
      return;
    }

    function checkAuth() {
      const session = localStorage.getItem(SESSION_KEY);
      if (!session) return false;

      try {
        const data = JSON.parse(session);
        if (data.expires > Date.now()) {
          authOverlay.classList.remove("show");
          blogContent.classList.add("authenticated");
          return true;
        }
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
      return false;
    }

    function logout() {
      localStorage.removeItem(SESSION_KEY);
      authOverlay.classList.add("show");
      blogContent.classList.remove("authenticated");
    }

    async function request(action, payload) {
      const res = await fetch(AUTH_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action, ...payload })
      });
      return res.json();
    }

    loginForm?.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = safeGet("loginEmail")?.value.trim();
      const password = safeGet("loginPassword")?.value.trim();
      if (!email || !password) return;

      try {
        const result = await request("login", { username: email, password });
        if (result.success) {
          localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({
              user: result.user,
              expires: Date.now() + SESSION_DURATION
            })
          );
          checkAuth();
        }
      } catch (err) {
        console.error(err);
      }
    });

    blogContent.addEventListener("contextmenu", function (e) {
      if (!blogContent.classList.contains("authenticated")) {
        e.preventDefault();
      }
    });

    if (!checkAuth()) {
      authOverlay.classList.add("show");
    }

    setInterval(() => {
      if (!checkAuth()) logout();
    }, 60000);
  }

  document.addEventListener("DOMContentLoaded", initAuthSystem);
})();
