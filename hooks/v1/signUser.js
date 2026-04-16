import { useState } from "react";
import { supabase } from "../../lib-supa/v1/api";
import { sanitizeInput, generateSecureToken, timingPrevention } from "../../lib-supa/v1/security";
import { authRateLimiter01 } from "../../lib-supa/v1.1/loginRateLimiter";

export const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState(""); // Added error state
  const [loading, setLoading] = useState(false); // Optional: loading state

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    // Clear previous error
    setErrorMessage("");

    //rate limit check(browser side)
    const ratelimit = authRateLimiter01.check(email || null, 5, 15*60*1000);

    if(ratelimit.limited) {
      const waitMinutes = Math.ceil(ratelimit.remainingTime/60000);
      setErrorMessage(`Too many attempts. Please wait ${waitMinutes} minutes.`);
      return;
    }
    
    //sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    // Validation
    if(!sanitizedEmail || !sanitizedPassword) {
      setErrorMessage("Email and password are required");
      return;
    }
    
    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(sanitizedEmail)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    
    // Password validation
    if(sanitizedPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    if(isSignUp) {
      const signUpData = {
        email: sanitizedEmail,
        password: sanitizedPassword,
      };
      
      // Add user metadata if name exists
      if(sanitizedName !== '') {
        signUpData.options = {
          data: {
            name: sanitizedName,
            security_token: generateSecureToken(),
            created_at: new Date().toISOString()
          }
        };
      }
      
      const { data, error: signUpError } = await supabase.auth.signUp(signUpData);

      if(signUpError) {
        setErrorMessage(signUpError.message);
        setLoading(false);
        return;
      }
      
      const success = !signUpError && data?.user;
      
      if(success) {
        authRateLimiter01.clear(email);
      }
      
      console.log("Sign up successful! Check your email to confirm.", data);
      
      // Clear form on success
      setName("");
      setEmail("");
      setPassword("");
      setErrorMessage("");
      
    } else {
      await timingPrevention(attempts);
      
      setAttempts(prev => prev + 1);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword
      });
      
      if(signInError) {
        // Display user-friendly error message
        if(signInError.message === "Invalid login credentials") {
          setErrorMessage("Invalid email or password. Please try again.");
        } else {
          setErrorMessage(signInError.message);
        }
        setLoading(false);
        return;
      }
      
      const success = !signInError && data?.user;
      
      if(success) {
        authRateLimiter01.clear(email);
        setName("");
        setEmail("");
        setPassword("");
        setAttempts(0);
        setErrorMessage("");
      }
      
      console.log("Sign in successful!", data);
    }
    
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-950 p-10 rounded-2xl shadow-2xl border border-gray-800">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            {isSignUp ? "Sign Up" : "Sign In"}
          </h2>
        </div>

        {/* Error Message Display */}
        {errorMessage && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage("")}
                className="flex-shrink-0 text-gray-400 hover:text-gray-300"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="ChooseYourUserName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg placeholder-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg placeholder-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="Minimum of 6 Characters is Required"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg placeholder-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isSignUp ? "Signing up..." : "Signing in..."}</span>
                </div>
              ) : (
                <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(""); // Clear error when switching modes
              }}
              disabled={loading}
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200 disabled:opacity-50"
            >
              Switch to {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};