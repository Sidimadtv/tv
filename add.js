<script type="text/javascript">
document.addEventListener("DOMContentLoaded", function () {

  // =========================
  // 🔒 Enhanced Authentication
  // =========================

  const AUTH_API_URL = atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6anV5M0lxREtnWFlKTkVXVnBvQkZPMjN2Yzg3TGVRU0hPXzlVNjVoOXhRUG51SVo5U2lqOHh1YzFVdDlYYjRoVE9JdkEvZXhlYw==');
  const SESSION_KEY = 'blog_auth_session';
  const SESSION_DURATION = 3 * 60 * 60 * 1000; // 3 hours

  // State
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

  // =========================
  // Utility functions
  // =========================
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

  // =========================
  // Session & Authentication
  // =========================
  function checkAuth() {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data.expires > Date.now()) {
          authenticateUser();
          return true;
        } else localStorage.removeItem(SESSION_KEY);
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    return false;
  }

  function authenticateUser() {
    authOverlay.classList.remove('show');
    blogContent.classList.add('authenticated');
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    if (window.sessionTimerInterval) clearInterval(window.sessionTimerInterval);
    showLogin();
    console.log('👋 User logged out successfully');
  }

  function showLogin() {
    authOverlay.classList.add('show');
    blogContent.classList.remove('authenticated');
    showScreen('loginScreen');
    setTimeout(() => {
      const loginEmailField = document.getElementById('loginEmail');
      if (loginEmailField) loginEmailField.focus();
    }, 100);
  }

  // =========================
  // JSONP Authentication Request
  // =========================
  function makeAuthRequest(action, data) {
    return new Promise((resolve, reject) => {
      const callbackName = 'authCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Request timeout'));
      }, 10000);

      function cleanup() {
        if (window[callbackName]) delete window[callbackName];
        if (timeoutId) clearTimeout(timeoutId);
        const script = document.getElementById(callbackName);
        if (script) script.remove();
      }

      window[callbackName] = function(result) {
        cleanup();
        console.log('✅ JSONP result:', result);
        resolve(result);
      };

      const script = document.createElement('script');
      script.id = callbackName;

      const params = new URLSearchParams({ callback: callbackName, action, ...data });
      script.src = `${AUTH_API_URL}?${params.toString()}`;
      script.onerror = () => {
        cleanup();
        reject(new Error('Script loading failed'));
      };

      document.head.appendChild(script);
      console.log('📤 JSONP request:', script.src);
    });
  }

  // =========================
  // Form Handlers
  // =========================
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault(); hideMessages(); setLoading('loginButton', true);
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!email || !password) { showError('Please enter both email and password'); setLoading('loginButton', false); return; }
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

  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault(); hideMessages(); setLoading('signupButton', true);
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirm = document.getElementById('confirmPassword').value.trim();
    if (!email || !password || !confirm) { showError('Please fill in all fields'); setLoading('signupButton', false); return; }
    if (password !== confirm) { showError('Passwords do not match'); setLoading('signupButton', false); return; }
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

  forgotForm.addEventListener('submit', async function (e) {
    e.preventDefault(); hideMessages(); setLoading('forgotButton', true);
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) { showError('Please enter your email address'); setLoading('forgotButton', false); return; }
    try {
      const res = await makeAuthRequest('forgot_password', { email });
      if (res.success) { currentEmail = email; showSuccess(res.message); setTimeout(() => showScreen('otpScreen'), 2000); }
      else showError(res.message || 'Failed to send reset code');
    } catch (err) { showError(err.message); }
    setLoading('forgotButton', false);
  });

  otpForm.addEventListener('submit', async function (e) {
    e.preventDefault(); hideMessages(); setLoading('otpButton', true);
    const otp = document.getElementById('otpCode').value.trim();
    if (!otp) { showError('Please enter the 6-digit code'); setLoading('otpButton', false); return; }
    try {
      const res = await makeAuthRequest('verify_otp', { email: currentEmail, otp });
      if (res.success) { currentOTP = otp; showSuccess(res.message); setTimeout(() => showScreen('resetScreen'), 2000); }
      else showError(res.message || 'Invalid code');
    } catch (err) { showError(err.message); }
    setLoading('otpButton', false);
  });

  resetForm.addEventListener('submit', async function (e) {
    e.preventDefault(); hideMessages(); setLoading('resetButton', true);
    const newP = document.getElementById('newPassword').value.trim();
    const confirmP = document.getElementById('confirmNewPassword').value.trim();
    if (!newP || !confirmP) { showError('Please fill in both password fields'); setLoading('resetButton', false); return; }
    if (newP !== confirmP) { showError('Passwords do not match'); setLoading('resetButton', false); return; }
    try {
      const res = await makeAuthRequest('reset_password', { email: currentEmail, otp: currentOTP, newPassword: newP });
      if (res.success) {
        showSuccess(res.message);
        setTimeout(() => showScreen('loginScreen'), 3000);
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
        currentEmail = ''; currentOTP = '';
      } else showError(res.message || 'Password reset failed');
    } catch (err) { showError(err.message); }
    setLoading('resetButton', false);
  });

  // =========================
  // Navigation buttons
  // =========================
  document.getElementById('showSignup').addEventListener('click', e => { e.preventDefault(); showScreen('signupScreen'); });
  document.getElementById('showLogin').addEventListener('click', e => { e.preventDefault(); showScreen('loginScreen'); });
  document.getElementById('showForgotPassword').addEventListener('click', e => { e.preventDefault(); showScreen('forgotScreen'); });
  document.getElementById('backToLogin').addEventListener('click', e => { e.preventDefault(); showScreen('loginScreen'); });
  document.getElementById('backToForgot').addEventListener('click', e => { e.preventDefault(); showScreen('forgotScreen'); });
  document.getElementById('resendOTP').addEventListener('click', async e => {
    e.preventDefault();
    if (!currentEmail) return;
    try {
      const res = await makeAuthRequest('forgot_password', { email: currentEmail });
      if (res.success) showSuccess('New code sent to your email');
      else showError(res.message || 'Failed to resend code');
    } catch (err) { showError(err.message); }
  });

  // =========================
  // Session Sync Across Tabs
  // =========================
  window.addEventListener('storage', e => {
    if (e.key === SESSION_KEY) {
      if (!e.newValue) logout();
      else {
        try {
          const data = JSON.parse(e.newValue);
          if (data.expires > Date.now() && !blogContent.classList.contains('authenticated')) authenticateUser();
          else logout();
        } catch { logout(); }
      }
    }
  });

  // =========================
  // Immediate Auth Check
  // =========================
  if (!checkAuth()) showLogin();

  // =========================
  // Security & Restrictions
  // =========================
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !checkAuth()) showLogin(); });
  blogContent.addEventListener('contextmenu', e => { if (!blogContent.classList.contains('authenticated')) e.preventDefault(); });
  document.addEventListener('keydown', e => {
    if (!blogContent.classList.contains('authenticated')) {
      if (e.ctrlKey && ['c','a','s','p'].includes(e.key)) e.preventDefault();
      if (e.key==='F12' || (e.ctrlKey && e.shiftKey && ['I','C','J'].includes(e.key)) || (e.ctrlKey && e.key==='U')) {
        e.preventDefault(); showError('Access denied. Please login first.');
      }
    }
  });

});
</script>
