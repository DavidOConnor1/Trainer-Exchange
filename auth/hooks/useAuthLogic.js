// hooks/useAuthLogic.js
import { useState } from 'react';
import { supabase } from '../../lib/api';
import securityService from '../../lib/security';

export const useAuthLogic = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Create rate limiters for different actions
  const loginRateLimiter = securityService.getRateLimiter('login', 5, 15 * 60 * 1000);
  const signupRateLimiter = securityService.getRateLimiter('signup', 3, 60 * 60 * 1000);

  // Validate and sanitize inputs
  const validateAndSanitizeInputs = () => {
    const sanitizedName = securityService.sanitizeName(name, 50);
    const sanitizedEmail = securityService.sanitizeEmail(email, 254);
    const sanitizedPassword = securityService.sanitizePassword(password, 128);

    // Basic validation
    if (!sanitizedEmail || !sanitizedPassword) {
      setErrorMessage('Email and password are required');
      return null;
    }

    if (!securityService.isValidEmail(sanitizedEmail)) {
      setErrorMessage('Please enter a valid email address');
      return null;
    }

    if (sanitizedPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return null;
    }

    return { sanitizedName, sanitizedEmail, sanitizedPassword };
  };

  // Handle sign up
  const handleSignUp = async (sanitizedName, sanitizedEmail, sanitizedPassword) => {
    // Check rate limit for signup
    const identifier = sanitizedEmail;
    if (!signupRateLimiter.canProceed(identifier)) {
      setErrorMessage('Too many signup attempts. Please try again later.');
      return false;
    }

    const signUpData = {
      email: sanitizedEmail,
      password: sanitizedPassword,
    };

    // Add user metadata if name exists
    if (sanitizedName && sanitizedName !== '') {
      signUpData.options = {
        data: {
          name: sanitizedName,
          security_token: securityService.generateSecureToken(32),
          created_at: new Date().toISOString()
        }
      };
    }

    const { data, error: signUpError } = await supabase.auth.signUp(signUpData);

    if (signUpError) {
      setErrorMessage(securityService.escapeHtml(signUpError.message));
      return false;
    }

    const success = !!data?.user;
    if (success) {
      signupRateLimiter.clear(identifier);
      // Clear form on success
      setName('');
      setEmail('');
      setPassword('');
      setErrorMessage('');
    }

    console.log('Sign up successful! Check your email to confirm.', data);
    return success;
  };

  // Handle sign in
  const handleSignIn = async (sanitizedEmail, sanitizedPassword) => {
    // Add timing prevention to obscure response time
    await securityService.timingPrevention(attempts);
    
    // Check rate limit for login
    const identifier = sanitizedEmail;
    if (!loginRateLimiter.canProceed(identifier)) {
      setErrorMessage('Too many login attempts. Please wait 15 minutes.');
      return false;
    }

    setAttempts(prev => prev + 1);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: sanitizedPassword
    });

    if (signInError) {
      // Use timing-safe error message (don't reveal if email exists)
      setErrorMessage('Invalid email or password');
      console.error('Sign in error:', signInError.message);
      return false;
    }

    const success = !!data?.user;
    if (success) {
      loginRateLimiter.clear(identifier);
      setEmail('');
      setPassword('');
      setAttempts(0);
      setErrorMessage('');
    }

    console.log('Sign in successful!', data);
    return success;
  };

  // Main submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      // Validate and sanitize inputs
      const sanitized = validateAndSanitizeInputs();
      if (!sanitized) {
        setLoading(false);
        return;
      }

      const { sanitizedName, sanitizedEmail, sanitizedPassword } = sanitized;

      let success = false;
      if (isSignUp) {
        success = await handleSignUp(sanitizedName, sanitizedEmail, sanitizedPassword);
      } else {
        success = await handleSignIn(sanitizedEmail, sanitizedPassword);
      }

      return success;
    } catch (error) {
      console.error('Auth error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Switch between sign up and sign in
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMessage('');
    setAttempts(0);
  };

  return {
    // State
    isSignUp,
    name,
    email,
    password,
    loading,
    errorMessage,
    attempts,
    
    // Setters
    setName,
    setEmail,
    setPassword,
    
    // Handlers
    handleSubmit,
    toggleMode,
  };
};