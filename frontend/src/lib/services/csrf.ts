import api from './axios';

// Store the token in memory
let csrfToken: string | null = null;

// Get CSRF token from memory
// export function getCSRFToken(): string | null {
//   return csrfToken;
// }

// Fetch a new CSRF token
export async function fetchCSRFToken(): Promise<string> {
  // Fetch a new CSRF token from the server
  try {
    const response = await api.get('/csrf');
    csrfToken = response.data.csrf_token;
    if (!csrfToken) {
      throw new Error('CSRF token not received from server');
    }
    return csrfToken;
  } catch (error) {
    throw error;
  }
}

// Global singleton for token initialization to prevent race conditions
let initializePromise: Promise<void> | null = null;

export async function initializeCSRF(): Promise<void> {
  // If initialization is already in progress, return the existing promise
  if (initializePromise) {
    return initializePromise;
  }
  
  // Create a new initialization promise
  initializePromise = _initializeCSRF();
  
  try {
    await initializePromise;
  } finally {
    // Clear the promise reference when done (successful or not)
    // so future calls will try again if needed
    initializePromise = null;
  }
}

async function _initializeCSRF(): Promise<void> {
  try {
    // Always fetch a fresh token on initialization
    await fetchCSRFToken();
    
    // Set the token in the default headers for all future requests
    if (csrfToken) {
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
    }
  } catch (error) {
    throw error; // Re-throw to allow proper handling upstream
  }
}

// Function to synchronize token between tabs/windows if needed
export function refreshCSRFToken(): Promise<void> {
  return initializeCSRF();
}

// Function to read CSRF token from cookies
function getCSRFTokenFromCookie(): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// Get CSRF token from cookie
export function getCSRFToken(): string | null {
  return getCSRFTokenFromCookie();
}

