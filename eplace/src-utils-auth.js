// This file handles the authentication flow and authenticated API requests.

import jwt_decode from "jwt-decode";
import { createAlert } from "./notify";

// --- Constants --- //
const AUTH_TOKEN_KEY = "eplace_auth_token";
const AUTH_STATE_KEY = "eplace_auth_state"; // For OAuth 2.0 state parameter

// Environment variables from .env
const AUTH_URL = import.meta.env.VITE_AUTH_URL;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const REDIRECT_URI = window.location.origin + "/complete/epita/"; // Callback URL

// --- Token Management --- //

/**
 * Stores the JWT token in localStorage.
 * @param {string} token - The JWT token.
 */
const storeToken = (token) => {
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
        console.error("Error storing token in localStorage:", error);
        createAlert("Storage Error", "Could not save authentication state.", "error");
    }
};

/**
 * Retrieves the JWT token from localStorage.
 * @returns {string | null} The JWT token or null if not found.
 */
const getToken = () => {
    try {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
        console.error("Error retrieving token from localStorage:", error);
        return null;
    }
};

/**
 * Removes the JWT token from localStorage.
 */
const removeToken = () => {
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
        console.error("Error removing token from localStorage:", error);
    }
};

/**
 * Decodes the JWT token.
 * @param {string} token - The JWT token.
 * @returns {object | null} The decoded payload or null if decoding fails.
 */
const decodeToken = (token) => {
    try {
        return jwt_decode(token);
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};

/**
 * Checks if the JWT token is expired.
 * @param {string | null} token - The JWT token.
 * @returns {boolean} True if the token is expired or invalid, false otherwise.
 */
const isTokenExpired = (token) => {
    if (!token) {
        return true;
    }
    const decoded = decodeToken(token);
    if (!decoded || typeof decoded.exp !== "number") {
        console.warn("Token is invalid or does not contain expiry information.");
        return true; // Treat invalid tokens as expired
    }
    const currentTime = Date.now() / 1000; // Convert ms to seconds
    // Add a small buffer (e.g., 60 seconds) to account for clock skew
    const buffer = 60;
    return decoded.exp < currentTime - buffer;
};

// --- Authentication Flow --- //

/**
 * Generates a random string for the OAuth 2.0 state parameter.
 * @param {number} length - The desired length of the state string.
 * @returns {string} A random string.
 */
const generateState = (length = 32) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let state = "";
    for (let i = 0; i < length; i++) {
        state += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return state;
};

/**
 * Redirects the user to the authentication provider (CRI) login page.
 */
const redirectToLogin = () => {
    if (!AUTH_URL || !CLIENT_ID) {
        console.error("Authentication environment variables (VITE_AUTH_URL, VITE_CLIENT_ID) are not set.");
        createAlert("Config Error", "Authentication is not configured correctly.", "error");
        return;
    }

    // Generate and store state parameter for CSRF protection
    const state = generateState();
    try {
        localStorage.setItem(AUTH_STATE_KEY, state);
    } catch (error) {
        console.error("Failed to save auth state:", error);
        createAlert("Storage Error", "Could not save authentication state.", "error");
        return;
    }

    // Construct the authorization URL (assuming standard OIDC/OAuth2 endpoints)
    const authEndpoint = `${AUTH_URL}/auth`; // Adjust if CRI uses a different path
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "openid profile email", // Standard OIDC scopes
        state: state,
    });

    console.log(`Redirecting to login: ${authEndpoint}?${params.toString()}`);
    window.location.href = `${authEndpoint}?${params.toString()}`;
};

/**
 * Exchanges the authorization code for a JWT token.
 * This should be called from the callback page (/complete/epita/).
 * @param {string} code - The authorization code received from the auth provider.
 * @param {string} expectedState - The state parameter stored before redirection.
 * @param {string} receivedState - The state parameter received in the callback URL.
 * @returns {Promise<string | null>} A promise that resolves with the JWT token or null on error.
 */
const exchangeCodeForToken = async (code, expectedState, receivedState) => {
    if (!AUTH_URL || !CLIENT_ID) {
        console.error("Authentication environment variables are not set.");
        return null;
    }

    // Validate state parameter
    if (!expectedState || !receivedState || expectedState !== receivedState) {
        console.error("Invalid state parameter. Possible CSRF attack.");
        createAlert("Auth Error", "Invalid state parameter received.", "error");
        return null;
    }

    const tokenEndpoint = `${AUTH_URL}/token`; // Adjust if CRI uses a different path

    try {
        const response = await fetch(tokenEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                // Client secret might be required depending on OIDC client type
                // client_secret: "YOUR_CLIENT_SECRET",
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error(`Failed to exchange code for token: ${response.status}`, errorData);
            createAlert("Auth Error", `Failed to get token: ${errorData.message || response.statusText}`, "error");
            return null;
        }

        const data = await response.json();
        if (!data.access_token) {
            console.error("Token endpoint response did not include access_token:", data);
            createAlert("Auth Error", "Received invalid token response from server.", "error");
            return null;
        }

        // TODO: Handle refresh_token if provided
        return data.access_token;

    } catch (error) {
        console.error("Error exchanging code for token:", error);
        createAlert("Network Error", "Failed to communicate with authentication server.", "error");
        return null;
    }
};

/**
 * Checks authentication status. If not authenticated or token expired, redirects to login.
 * @returns {boolean} True if authenticated and token is valid, false otherwise.
 */
const checkAuthentication = () => {
    const token = getToken();
    if (isTokenExpired(token)) {
        console.log("Token is missing or expired. Redirecting to login.");
        removeToken(); // Ensure invalid token is removed
        redirectToLogin();
        return false;
    }
    console.log("User is authenticated.");
    return true;
};

// --- Authenticated API Request --- //

/**
 * Makes an authenticated request to the API.
 * Adds the Authorization header with the JWT token.
 * Handles 401 Unauthorized errors by redirecting to login.
 * @param {string} url - The API endpoint URL.
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<Response>} The fetch Response object.
 * @throws {Error} If not authenticated or if the fetch fails for other reasons.
 */
const authedAPIRequest = async (url, options = {}) => {
    const token = getToken();

    if (isTokenExpired(token)) {
        console.warn("Authentication required or token expired. Redirecting to login.");
        removeToken();
        redirectToLogin();
        // Throw an error or return a specific response to prevent further execution
        throw new Error("Authentication required");
    }

    // Ensure headers object exists
    const headers = { ...(options.headers || {}) };

    // Add Authorization header
    headers["Authorization"] = `Bearer ${token}`;

    const updatedOptions = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, updatedOptions);

        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
            console.warn("Received 401 Unauthorized from API. Token might be invalid or expired.");
            removeToken();
            redirectToLogin();
            throw new Error("Unauthorized"); // Throw error after initiating redirect
        }

        return response;

    } catch (error) {
        // Re-throw network errors or other fetch-related issues
        console.error("API request failed:", error);
        // Avoid redirecting for general network errors, only for auth issues
        if (error.message !== "Authentication required" && error.message !== "Unauthorized") {
             createAlert("API Error", `Request failed: ${error.message}`, "error");
        }
        throw error;
    }
};

// Export necessary functions
export { 
    storeToken, 
    getToken, 
    removeToken, 
    isTokenExpired, 
    decodeToken, 
    redirectToLogin, 
    exchangeCodeForToken, 
    checkAuthentication, 
    authedAPIRequest, 
    AUTH_STATE_KEY 
};

