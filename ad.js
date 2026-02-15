document.addEventListener('DOMContentLoaded', function () {
  // -------------------
  // CONFIGURATION
  // -------------------
  const AUTH_API_URL = atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6anV5M0lxREtnWFlKTkVXVnBvQkZPMjN2Yzg3TGVRU0hPXzlVNjVoOXhRUG51SVo5U2lqOHh1YzFVdDlYYjRoVE9JdkEvZXhlYw==');
  const SESSION_KEY = 'blog_auth_session';
  const SESSION_DURATION = 3 * 60 * 60 * 1000; // 3 hours

  // -------------------
  // STATE
  // -------------------
  let currentEmail = '';
  let currentOTP = '';

  // -------------------
  // DOM ELEMENTS
  // -------------------
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

  // -------------------
  // UTILITY FUNCTIONS
  // -------------------
  function showScreen(screenId) {
    [loginScreen, signupScreen, forgotScreen, otpScreen, resetScreen].forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
    hideMessages();
  }

  function showError(msg) {
    authError.textContent = msg;
    authError.style.display = 'block';
    authSuccess.style.display = 'none';
  }

  function showSuccess(msg) {
    authSuccess.textContent = msg;
    authSuccess.style.display = 'block';
    authError.style.display = 'none';
  }

  function hideMessages() {
    authError.style.display = 'none';
    authSuccess.style.display = 'none';
  }

  function setLoading(buttonId, loading) {
    const btn = document.getElementById(buttonId);
    const text = document.getElementById(buttonId.replace('Button', 'Text'));
    const loader = document.getElementById(buttonId.replace('Button', 'Loading'));
    if (btn && text && loader) {
      btn.disabled = loading;
      text.style.display = loading ? 'none' : 'inline';
      loader.style.display = loading ? 'inline-block' : 'none';
    }
  }

  function authenticateUser() {
    authOverlay.classList.remove('show');
    blogContent.classList.add('authenticated');
  }

  function showLogin() {
    authOverlay.classList.add('show');
    blogContent.classList.remove('authenticated');
    showScreen('loginScreen');
    setTimeout(() => document.getElementById('loginEmail')?.focus(), 100);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    if (window.sessionTimerInterval) clearInterval(window.sessionTimerInterval);
    showLogin();
    console.log('👋 User logged out');
  }

  function checkAuth() {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return false;
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
    return false;
  }

  // -------------------
  // API REQUESTS
  // -------------------
  async function makeAuthRequest(action, data) {
    try {
      return await makeFetchRequest(action, data);
    } catch (fetchErr) {
      console.warn('⚠️ Fetch failed, trying JSONP:', fetchErr.message);
      try {
        return await makeJSONPRequest(action, data);
      } catch (jsonpErr) {
        console.error('❌ Both fetch and JSONP failed');
        throw new Error('Unable to connect to authentication server.');
      }
    }
  }

  async function makeFetchRequest(action, data) {
    const payload = { action, ...data };
    const res = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors',
      cache: 'no-cache'
    });

    const text = await res.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.warn('Server returned non-JSON:', text);
      throw new Error('Server response is invalid JSON');
    }

    if (!res.ok) throw new Error(result.message || `Server error (${res.status})`);
    return result;
  }

  function makeJSONPRequest(action, data) {
    return new Promise((resolve, reject) => {
      const callbackName = 'authCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const timeoutId = setTimeout(() => { cleanup(); reject(new Error('Request timeout')); }, 10000);

      const cleanup = () => {
        delete window[callbackName];
        clearTimeout(timeoutId);
        document.getElementById(callbackName)?.remove();
      };

      window[callbackName] = (result) => { cleanup(); resolve(result); };

      const script = document.createElement('script');
      script.id = callbackName;
      const params = new URLSearchParams({ callback: callbackName, action, ...data });
      script.src = `${AUTH_API_URL}?${params.toString()}`;
      script.onerror = () => { cleanup(); reject(new Error('JSONP failed')); };

      document.head.appendChild(script);
    });
  }

  // -------------------
  // FORM HANDLERS
  // -------------------
  loginForm?.addEventListener('submit', async e => {
    e.preventDefault(); hideMessages(); setLoading('loginButton', true);
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!email || !password) return showError('Enter email and password'), setLoading('loginButton', false);

    try {
      const res = await makeAuthRequest('login', { username: email, password });
      if (res.success) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ user: res.user, expires: Date.now() + SESSION_DURATION }));
        authenticateUser();
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
      } else showError(res.message || 'Login failed');
    } catch (err) { showError(err.message); }
    setLoading('loginButton', false);
  });

  signupForm?.addEventListener('submit', async e => {
    e.preventDefault(); hideMessages(); setLoading('signupButton', true);
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirm = document.getElementById('confirmPassword').value.trim();

    if (!email || !password || !confirm) return showError('Fill all fields'), setLoading('signupButton', false);
    if (password !== confirm) return showError('Passwords do not match'), setLoading('signupButton', false);

    try {
      const res = await makeAuthRequest('signup', { username: email, password });
      if (res.success) {
        showSuccess(res.message);
        setTimeout(() => showScreen('loginScreen'), 2000);
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('confirmPassword').value = '';
      } else showError(res.message || 'Signup failed');
    } catch (err) { showError(err.message); }
    setLoading('signupButton', false);
  });

  // Similar handlers can be added for forgotForm, otpForm, resetForm
  // (You can copy the same pattern)

  // -------------------
  // NAVIGATION
  // -------------------
  document.getElementById('showSignup')?.addEventListener('click', e => { e.preventDefault(); showScreen('signupScreen'); });
  document.getElementById('showLogin')?.addEventListener('click', e => { e.preventDefault(); showScreen('loginScreen'); });
  document.getElementById('showForgotPassword')?.addEventListener('click', e => { e.preventDefault(); showScreen('forgotScreen'); });

  // -------------------
  // INITIALIZE
  // -------------------
  if (!checkAuth()) showLogin();
});
