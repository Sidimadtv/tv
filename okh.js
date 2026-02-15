document.addEventListener('DOMContentLoaded', function () {
  // 🔒 Enhanced Authentication JS - External Version

  const AUTH_API_URL = atob(
    'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6anV5M0lxREtnWFlKTkVXVnBvQkZPMjN2Yzg3TGVRU0hPXzlVNjVoOXhRUG51SVo5U2lqOHh1YzFVdDlYYjRoVE9JdkEvZXhlYw=='
  );

  const SESSION_KEY = 'blog_auth_session';
  const SESSION_DURATION = 3 * 60 * 60 * 1000; // 3 hours

  let currentEmail = '';
  let currentOTP = '';

  // DOM Elements
  const authOverlay = document.getElementById('authOverlay');
  const blogContent = document.getElementById('blogContent');

  const loginScreen = document.getElementById('loginScreen');
  const signupScreen = document.getElementById('signupScreen');
  const forgotScreen = document.getElementById('forgotScreen');
  const otpScreen = document.getElementById('otpScreen');
  const resetScreen = document.getElementById('resetScreen');

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const forgotForm = document.getElementById('forgotForm');
  const otpForm = document.getElementById('otpForm');
  const resetForm = document.getElementById('resetForm');

  const authError = document.getElementById('authError');
  const authSuccess = document.getElementById('authSuccess');

  // ─── Utility Functions ─────────────────────────────────────────────
  function showScreen(screenId) {
    [loginScreen, signupScreen, forgotScreen, otpScreen, resetScreen].forEach(
      (s) => {
        if (s) s.style.display = 'none';
      }
    );

    const screen = document.getElementById(screenId);
    if (screen) screen.style.display = 'block';
    hideMessages();
  }

  function showError(msg) {
    if (authError) {
      authError.textContent = msg;
      authError.style.display = 'block';
    }
    if (authSuccess) authSuccess.style.display = 'none';
  }

  function showSuccess(msg) {
    if (authSuccess) {
      authSuccess.textContent = msg;
      authSuccess.style.display = 'block';
    }
    if (authError) authError.style.display = 'none';
  }

  function hideMessages() {
    if (authError) authError.style.display = 'none';
    if (authSuccess) authSuccess.style.display = 'none';
  }

  function setLoading(buttonId, loading) {
    const btn = document.getElementById(buttonId);
    const txt = document.getElementById(buttonId.replace('Button', 'Text'));
    const load = document.getElementById(buttonId.replace('Button', 'Loading'));

    if (btn && txt && load) {
      btn.disabled = loading;
      txt.style.display = loading ? 'none' : 'inline';
      load.style.display = loading ? 'inline-block' : 'none';
    }
  }

  // ─── Session & Authentication ──────────────────────────────────────
  function authenticateUser() {
    if (authOverlay) authOverlay.classList.remove('show');
    if (blogContent) blogContent.classList.add('authenticated');
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    if (window.sessionTimerInterval) clearInterval(window.sessionTimerInterval);
    showLogin();
    console.log('👋 User logged out');
  }

  function checkAuth() {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const s = JSON.parse(session);
        if (s.expires > Date.now()) {
          authenticateUser();
          return true;
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    return false;
  }

  function showLogin() {
    if (authOverlay) authOverlay.classList.add('show');
    if (blogContent) blogContent.classList.remove('authenticated');
    showScreen('loginScreen');

    setTimeout(() => {
      const f = document.getElementById('loginEmail');
      if (f) f.focus();
    }, 100);
  }

  // ─── API Requests ─────────────────────────────────────────────────
  async function makeAuthRequest(action, data) {
    try {
      return await makeFetchRequest(action, data);
    } catch (e) {
      console.warn('Fetch failed, trying JSONP:', e.message);
      return await makeJSONPRequest(action, data);
    }
  }

  async function makeFetchRequest(action, data) {
    const req = { action, ...data };
    const res = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(req),
      mode: 'cors',
      cache: 'no-cache',
    });

    if (!res.ok) throw new Error(`Server error (${res.status}): ${res.statusText}`);
    return await res.json();
  }

  function makeJSONPRequest(action, data) {
    return new Promise((resolve, reject) => {
      const cb = 'authCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout'));
      }, 10000);

      const cleanup = () => {
        if (window[cb]) delete window[cb];
        if (timeoutId) clearTimeout(timeoutId);
        const s = document.getElementById(cb);
        if (s) s.remove();
      };

      window[cb] = function (result) {
        cleanup();
        resolve(result);
      };

      const script = document.createElement('script');
      script.id = cb;
      const params = new URLSearchParams({ callback: cb, action, ...data });
      script.src = `${AUTH_API_URL}?${params.toString()}`;
      script.onerror = () => {
        cleanup();
        reject(new Error('JSONP fail'));
      };
      document.head.appendChild(script);
    });
  }

  // ─── Form Handlers ────────────────────────────────────────────────
  if (loginForm)
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideMessages();
      setLoading('loginButton', true);

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      if (!email || !password) {
        showError('Enter email & password');
        setLoading('loginButton', false);
        return;
      }

      try {
        const r = await makeAuthRequest('login', { username: email, password });
        if (r.success) {
          localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ user: r.user, expires: Date.now() + SESSION_DURATION })
          );
          authenticateUser();
          document.getElementById('loginEmail').value = '';
          document.getElementById('loginPassword').value = '';
        } else showError(r.message || 'Login failed');
      } catch (err) {
        showError(err.message);
      }

      setLoading('loginButton', false);
    });

  if (signupForm)
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideMessages();
      setLoading('signupButton', true);

      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value.trim();
      const confirm = document.getElementById('confirmPassword').value.trim();

      if (!email || !password || !confirm) {
        showError('Fill all fields');
        setLoading('signupButton', false);
        return;
      }

      if (password !== confirm) {
        showError('Passwords do not match');
        setLoading('signupButton', false);
        return;
      }

      try {
        const r = await makeAuthRequest('signup', { username: email, password });
        if (r.success) {
          showSuccess(r.message);
          setTimeout(() => showScreen('loginScreen'), 2000);
          document.getElementById('signupEmail').value = '';
          document.getElementById('signupPassword').value = '';
          document.getElementById('confirmPassword').value = '';
        } else showError(r.message || 'Signup failed');
      } catch (err) {
        showError(err.message);
      }

      setLoading('signupButton', false);
    });

  if (forgotForm)
    forgotForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideMessages();
      setLoading('forgotButton', true);

      const email = document.getElementById('forgotEmail').value.trim();

      if (!email) {
        showError('Enter your email');
        setLoading('forgotButton', false);
        return;
      }

      try {
        const r = await makeAuthRequest('forgot_password', { email });
        if (r.success) {
          currentEmail = email;
          showSuccess(r.message);
          setTimeout(() => showScreen('otpScreen'), 2000);
        } else showError(r.message || 'Failed to send code');
      } catch (err) {
        showError(err.message);
      }

      setLoading('forgotButton', false);
    });

  if (otpForm)
    otpForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideMessages();
      setLoading('otpButton', true);

      const otp = document.getElementById('otpCode').value.trim();
      if (!otp) {
        showError('Enter 6-digit code');
        setLoading('otpButton', false);
        return;
      }

      try {
        const r = await makeAuthRequest('verify_otp', { email: currentEmail, otp });
        if (r.success) {
          currentOTP = otp;
          showSuccess(r.message);
          setTimeout(() => showScreen('resetScreen'), 2000);
        } else showError(r.message || 'Invalid code');
      } catch (err) {
        showError(err.message);
      }

      setLoading('otpButton', false);
    });

  if (resetForm)
    resetForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideMessages();
      setLoading('resetButton', true);

      const newPass = document.getElementById('newPassword').value.trim();
      const confirm = document.getElementById('confirmNewPassword').value.trim();

      if (!newPass || !confirm) {
        showError('Fill both fields');
        setLoading('resetButton', false);
        return;
      }

      if (newPass !== confirm) {
        showError('Passwords do not match');
        setLoading('resetButton', false);
        return;
      }

      try {
        const r = await makeAuthRequest('reset_password', {
          email: currentEmail,
          otp: currentOTP,
          newPassword: newPass,
        });

        if (r.success) {
          showSuccess(r.message);
          setTimeout(() => showScreen('loginScreen'), 3000);
          document.getElementById('newPassword').value = '';
          document.getElementById('confirmNewPassword').value = '';
          currentEmail = '';
          currentOTP = '';
        } else showError(r.message || 'Reset failed');
      } catch (err) {
        showError(err.message);
      }

      setLoading('resetButton', false);
    });

  // ─── Navigation Links ─────────────────────────────────────────────
  const navMap = [
    ['showSignup', 'signupScreen'],
    ['showLogin', 'loginScreen'],
    ['showForgotPassword', 'forgotScreen'],
    ['backToLogin', 'loginScreen'],
    ['backToForgot', 'forgotScreen'],
  ];

  navMap.forEach(([id, screen]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', (e) => {
      e.preventDefault();
      showScreen(screen);
    });
  });

  const resendBtn = document.getElementById('resendOTP');
  if (resendBtn)
    resendBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (currentEmail) {
        try {
          const r = await makeAuthRequest('forgot_password', { email: currentEmail });
          if (r.success) showSuccess('New code sent');
          else showError(r.message || 'Failed');
        } catch (err) {
          showError(err.message);
        }
      }
    });

  // ─── Cross-Page Session Sync ──────────────────────────────────────
  window.addEventListener('storage', function (e) {
    if (e.key === SESSION_KEY) {
      if (e.newValue === null) logout();
      else {
        try {
          const s = JSON.parse(e.newValue);
          if (s.expires > Date.now() && blogContent && !blogContent.classList.contains('authenticated'))
            authenticateUser();
          else logout();
        } catch {
          logout();
        }
      }
    }
  });

  // ─── Initial Auth Check ───────────────────────────────────────────
  if (!checkAuth()) showLogin();

  // ─── Block Unauthorized Actions ──────────────────────────────────
  if (blogContent)
    blogContent.addEventListener('contextmenu', (e) => {
      if (!blogContent.classList.contains('authenticated')) e.preventDefault();
    });

  document.addEventListener('keydown', (e) => {
    if (!blogContent.classList.contains('authenticated')) {
      if (e.ctrlKey && ['c', 'a', 's', 'p'].includes(e.key)) e.preventDefault();
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'C', 'J'].includes(e.key)) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        showError('Access denied. Please login first.');
      }
    }
  });

  console.log('External auth.js loaded ✅');
});
