    // Configuration
      const AUTH_API_URL = 'https://script.google.com/macros/s/AKfycby9HWykx8usz2tNENeoONVm5bXDhk0jzh7GDdSO8IlBxm_5iCfm8dpWyrMECRyAI-jArQ/exec';
      const SESSION_KEY = blog_auth_session;
      const SESSION_DURATION = 1 * 60 * 60 * 1000; // 1 hour
      
      // State management
      let currentEmail = ;
      let currentOTP = ;
      
      // DOM elements
    
      // Screens
     
      const signupScreen = document.getElementById(signupScreen);
    
      // Forms
   
      // Messages
      const authError = document.getElementById(authError);
      const authSuccess = document.getElementById(authSuccess);
      
  
      function showError(message) {
        authError.textContent = message;
        authError.style.display = block;
        authSuccess.style.display = none;
      }
      
      function showSuccess(message) {
        authSuccess.textContent = message;
        authSuccess.style.display = block;
        authError.style.display = none;
      }
      
      function hideMessages() {
        authError.style.display = none;
        authSuccess.style.display = none;
      }
      
      function setLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        const text = document.getElementById(buttonId.replace(Button, Text));
        const loader = document.getElementById(buttonId.replace(Button, Loading));
        
        if (button && text && loader) {
          button.disabled = loading;
          text.style.display = loading ? none : inline;
          loader.style.display = loading ? inline-block : none;
        }
      }
      
      // Authentication functions
      function checkAuth() {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
          try {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            
            if (sessionData.expires  now) {
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
        authOverlay.classList.add(show);
        blogContent.classList.remove(authenticated);
        showScreen(loginScreen);
        setTimeout(() = {
          const loginEmailField = document.getElementById(loginEmail);
          if (loginEmailField) loginEmailField.focus();
        }, 100);
      }
      
      function authenticateUser() {
        authOverlay.classList.remove(show);
        blogContent.classList.add(authenticated);
      }
      
      function logout() {
        // Clear session
        localStorage.removeItem(SESSION_KEY);
        
        // Clear session timer
        if (window.sessionTimerInterval) {
          clearInterval(window.sessionTimerInterval);
        }
        
        // Show login screen
        showLogin();
        
        console.log(👋 User logged out successfully);
      }
      
      
      
      // API request function with fallback support
      async function makeAuthRequest(action, data) {
        console.log(🔄 Making auth request:, action, to URL:, AUTH_API_URL);
        
        // Try modern fetch first
        try {
          return await makeFetchRequest(action, data);
        } catch (fetchError) {
          console.warn(&#9888;&#65039; Fetch failed, trying JSONP fallback:, fetchError.message);
          
          // Fallback to JSONP for better compatibility
          try {
            return await makeJSONPRequest(action, data);
          } catch (jsonpError) {
            console.error(&#10060; Both methods failed);
            throw new Error(Unable to connect to authentication server. Please try refreshing the page or contact support.);
          }
        }
      }
      
      // Modern fetch method
      async function makeFetchRequest(action, data) {
        const requestData = { action, ...data };
        console.log(📤 Fetch request data:, requestData);
        
        const response = await fetch(AUTH_API_URL, {
          method: POST,
          headers: { 
            Content-Type: text/plain // Changed to avoid CORS preflight
          },
          body: JSON.stringify(requestData),
          mode: cors,
          cache: no-cache
        });
        
        console.log(📥 Response status:, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(Server error response:, errorText);
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(&#9989; Fetch result:, result);
        return result;
      }
      
      // JSONP fallback method
      function makeJSONPRequest(action, data) {
        return new Promise((resolve, reject) = {
          const callbackName = authCallback_ + Date.now() + _ + Math.random().toString(36).substr(2, 9);
          const timeoutId = setTimeout(() = {
            cleanup();
            reject(new Error(Request timeout));
          }, 10000); // 10 second timeout
          
          const cleanup = () = {
            if (window[callbackName]) {
              delete window[callbackName];
            }
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            const script = document.getElementById(callbackName);
            if (script) {
              script.remove();
            }
          };
          
          // Set up callback
          window[callbackName] = function(result) {
            cleanup();
            console.log(&#9989; JSONP result:, result);
            resolve(result);
          };
          
          // Create script tag for JSONP
          const script = document.createElement(script);
          script.id = callbackName;
          
          const params = new URLSearchParams({
            callback: callbackName,
            action: action,
            ...data
          });
          
          script.src = `${AUTH_API_URL}?${params.toString()}`;
          script.onerror = () = {
            cleanup();
            reject(new Error(Script loading failed));
          };
          
          document.head.appendChild(script);
          console.log(📤 JSONP request:, script.src);
        });
      }
      
      // Login form handler
      loginForm.addEventListener(submit, async function(e) {
        e.preventDefault();
        hideMessages();
        setLoading(loginButton, true);
        
        const email = document.getElementById(loginEmail).value.trim();
        const password = document.getElementById(loginPassword).value.trim();
        
        if (!email || !password) {
          showError(Please enter both email and password);
          setLoading(loginButton, false);
          return;
        }
        
        try {
          const result = await makeAuthRequest(login, { username: email, password });
          
          if (result.success) {
            const sessionData = {
              user: result.user,
              expires: new Date().getTime() + SESSION_DURATION
            };
            
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
            authenticateUser();
            
            // Clear form
            document.getElementById(loginEmail).value = ;
            document.getElementById(loginPassword).value = ;
          } else {
            showError(result.message || Login failed);
          }
        } catch (error) {
          showError(error.message);
        }
        
        setLoading(loginButton, false);
      });
      
      // Signup form handler
      signupForm.addEventListener(submit, async function(e) {
        e.preventDefault();
        hideMessages();
        setLoading(signupButton, true);
        
        const email = document.getElementById(signupEmail).value.trim();
        const password = document.getElementById(signupPassword).value.trim();
        const confirmPassword = document.getElementById(confirmPassword).value.trim();
        
        if (!email || !password || !confirmPassword) {
          showError(Please fill in all fields);
          setLoading(signupButton, false);
          return;
        }
        
        if (password !== confirmPassword) {
          showError(Passwords do not match);
          setLoading(signupButton, false);
          return;
        }
        
        try {
          const result = await makeAuthRequest(signup, { username: email, password });
          
          if (result.success) {
            showSuccess(result.message);
            setTimeout(() = showScreen(loginScreen), 2000);
            
            // Clear form
            document.getElementById(signupEmail).value = ;
            document.getElementById(signupPassword).value = ;
            document.getElementById(confirmPassword).value = ;
          } else {
            showError(result.message || Signup failed);
          }
        } catch (error) {
          showError(error.message);
        }
        
        setLoading(signupButton, false);
      });
      
      // Forgot password form handler
      forgotForm.addEventListener(submit, async function(e) {
        e.preventDefault();
        hideMessages();
        setLoading(forgotButton, true);
        
        const email = document.getElementById(forgotEmail).value.trim();
        
        if (!email) {
          showError(Please enter your email address);
          setLoading(forgotButton, false);
          return;
        }
        
        try {
          const result = await makeAuthRequest(forgot_password, { email });
          
          if (result.success) {
            currentEmail = email;
            showSuccess(result.message);
            setTimeout(() = showScreen(otpScreen), 2000);
          } else {
            showError(result.message || Failed to send reset code);
          }
        } catch (error) {
          showError(error.message);
        }
        
        setLoading(forgotButton, false);
      });
      
      // OTP form handler
      otpForm.addEventListener(submit, async function(e) {
        e.preventDefault();
        hideMessages();
        setLoading(otpButton, true);
        
        const otp = document.getElementById(otpCode).value.trim();
        
        if (!otp) {
          showError(Please enter the 6-digit code);
          setLoading(otpButton, false);
          return;
        }
        
        try {
          const result = await makeAuthRequest(verify_otp, { email: currentEmail, otp });
          
          if (result.success) {
            currentOTP = otp;
            showSuccess(result.message);
            setTimeout(() = showScreen(resetScreen), 2000);
          } else {
            showError(result.message || Invalid code);
          }
        } catch (error) {
          showError(error.message);
        }
        
        setLoading(otpButton, false);
      });
      
      // Reset password form handler
      resetForm.addEventListener(submit, async function(e) {
        e.preventDefault();
        hideMessages();
        setLoading(resetButton, true);
        
        const newPassword = document.getElementById(newPassword).value.trim();
        const confirmNewPassword = document.getElementById(confirmNewPassword).value.trim();
        
        if (!newPassword || !confirmNewPassword) {
          showError(Please fill in both password fields);
          setLoading(resetButton, false);
          return;
        }
        
        if (newPassword !== confirmNewPassword) {
          showError(Passwords do not match);
          setLoading(resetButton, false);
          return;
        }
        
        try {
          const result = await makeAuthRequest(reset_password, {
            email: currentEmail,
            otp: currentOTP,
            newPassword: newPassword
          });
          
          if (result.success) {
            showSuccess(result.message);
            setTimeout(() = showScreen(loginScreen), 3000);
            
            // Clear form
            document.getElementById(newPassword).value = ;
            document.getElementById(confirmNewPassword).value = ;
            currentEmail = ;
            currentOTP = ;
          } else {
            showError(result.message || Password reset failed);
          }
        } catch (error) {
          showError(error.message);
        }
        
        setLoading(resetButton, false);
      });
      
      // Navigation event listeners
      document.getElementById(showSignup).addEventListener(click, (e) = {
        e.preventDefault();
        showScreen(signupScreen);
      });
      
      document.getElementById(showLogin).addEventListener(click, (e) = {
        e.preventDefault();
        showScreen(loginScreen);
      });
      
      document.getElementById(showForgotPassword).addEventListener(click, (e) = {
        e.preventDefault();
        showScreen(forgotScreen);
      });
      
      document.getElementById(backToLogin).addEventListener(click, (e) = {
        e.preventDefault();
        showScreen(loginScreen);
      });
      
      document.getElementById(backToForgot).addEventListener(click, (e) = {
        e.preventDefault();
        showScreen(forgotScreen);
      });
      
      document.getElementById(resendOTP).addEventListener(click, async (e) = {
        e.preventDefault();
        if (currentEmail) {
          try {
            const result = await makeAuthRequest(forgot_password, { email: currentEmail });
            if (result.success) {
              showSuccess(New code sent to your email);
            } else {
              showError(result.message || Failed to resend code);
            }
          } catch (error) {
            showError(error.message);
          }
        }
      });
      
      
      // Test server connection
      async function testConnection() {
        try {
          console.log(🔍 Testing server connection...);
          
          // Try fetch first
          try {
            const response = await fetch(AUTH_API_URL, {
              method: GET,
              mode: cors,
              cache: no-cache
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log(&#9989; Server connection successful (fetch):, data);
              return true;
            }
          } catch (fetchError) {
            console.warn(&#9888;&#65039; Fetch test failed, trying JSONP:, fetchError.message);
          }
          
          // Try JSONP fallback
          const testResult = await new Promise((resolve) = {
            const callbackName = testCallback_ + Date.now();
            const timeoutId = setTimeout(() = {
              cleanup();
              resolve(false);
            }, 5000);
            
            const cleanup = () = {
              if (window[callbackName]) {
                delete window[callbackName];
              }
              const script = document.getElementById(callbackName);
              if (script) {
                script.remove();
              }
              clearTimeout(timeoutId);
            };
            
            window[callbackName] = function(data) {
              cleanup();
              console.log(&#9989; Server connection successful (JSONP):, data);
              resolve(true);
            };
            
            const script = document.createElement(script);
            script.id = callbackName;
            script.src = `${AUTH_API_URL}?callback=${callbackName}`;
            script.onerror = () = {
              cleanup();
              resolve(false);
            };
            
            document.head.appendChild(script);
          });
          
          return testResult;
          
        } catch (error) {
          console.error(&#10060; All connection tests failed:, error);
          return false;
        }
      }
      
      // Initialize
      // Cross-page session synchronization
      function syncSessionAcrossPages() {
        window.addEventListener(storage, function(e) {
          if (e.key === SESSION_KEY) {
            if (e.newValue === null) {
              console.log(🔄 Session cleared in another tab, logging out);
              logout();
            } else {
              try {
                const sessionData = JSON.parse(e.newValue);
                const now = new Date().getTime();
                if (sessionData.expires  now) {
                  console.log(🔄 Session updated in another tab, syncing);
                  if (!blogContent.classList.contains(authenticated)) {
                    authenticateUser();
                  }
                } else {
                  logout();
                }
              } catch (e) {
                console.error(Session sync error:, e);
                logout();
              }
            }
          }
        });
      }
      
      // Immediate authentication check - runs before DOM is ready
      function immediateAuthCheck() {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
          try {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            if (sessionData.expires  now) {
              // User is authenticated - ensure overlay is hidden
              const overlay = document.getElementById(authOverlay);
              const content = document.getElementById(blogContent);
              if (overlay) overlay.classList.remove(show);
              if (content) content.classList.add(authenticated);
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
      
      // Run immediate check
      immediateAuthCheck();
      
      document.addEventListener(DOMContentLoaded, async function() {
        console.log(🚀 Authentication system initializing...);
        console.log(📡 Server URL:, AUTH_API_URL);
        console.log(🔄 Cross-page session sync enabled);
        
        // Enable cross-page session synchronization
        syncSessionAcrossPages();
        
        // Test server connection first
        const connectionOk = await testConnection();
        
        if (!connectionOk) {
          showError(Unable to connect to authentication server. Please check your internet connection and try again.);
        }
        
        // Enhanced authentication check - check immediately on load
        const isAuthenticated = checkAuth();
        if (isAuthenticated) {
          console.log(&#9989; User authenticated from stored session);
          // User is authenticated, hide overlay and show content immediately
          authOverlay.classList.remove(show);
          blogContent.classList.add(authenticated);
        } else {
          console.log(&#10060; No valid session found, showing login);
          // Only show login overlay if not authenticated
          setTimeout(() = {
            if (!checkAuth()) {
              showLogin();
            }
          }, 100);
        }
        
        // Enhanced session monitoring
        setInterval(() = {
          if (!checkAuth() && !authOverlay.classList.contains(show)) {
            console.log(&#9888;&#65039; Session expired, showing login);
            showLogin();
          }
        }, 60000);
        
        // Additional session validation every 10 seconds
        setInterval(() = {
          const session = localStorage.getItem(SESSION_KEY);
          if (session) {
            try {
              const sessionData = JSON.parse(session);
              const now = new Date().getTime();
              const timeLeft = sessionData.expires - now;
              
              if (timeLeft = 0) {
                console.log(&#8987; Session expired, forcing logout);
                logout();
              }
            } catch (e) {
              console.error(Session validation error:, e);
              logout();
            }
          }
        }, 10000);
      });
      
      // Security features
      document.addEventListener(visibilitychange, function() {
        if (!document.hidden && !checkAuth()) {
          showLogin();
        }
      });
      
      blogContent.addEventListener(contextmenu, function(e) {
        if (!blogContent.classList.contains(authenticated)) {
          e.preventDefault();
        }
      });
      
      document.addEventListener(keydown, function(e) {
        if (!blogContent.classList.contains(authenticated)) {
          if (e.ctrlKey && [c, a, s, p].includes(e.key)) {
            e.preventDefault();
          }
          if (e.key === F12 || (e.ctrlKey && e.shiftKey && [I, C, J].includes(e.key)) || (e.ctrlKey && e.key === U)) {
            e.preventDefault();
            showError(Access denied. Please login first.);
          }
        }
      });