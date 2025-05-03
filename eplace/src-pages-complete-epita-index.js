// This script handles the OAuth callback for EPITA authentication.

import { exchangeCodeForToken, storeToken, AUTH_STATE_KEY } from "../../utils/auth.js";

// DOM Elements for feedback
const messageElement = document.getElementById("auth-message");
const errorElement = document.getElementById("auth-error");

/**
 * Displays an error message on the page.
 * @param {string} message - The error message to display.
 */
const displayError = (message) => {
    console.error("Authentication Callback Error:", message);
    if (messageElement) {
        messageElement.textContent = "Authentication failed.";
    }
    if (errorElement) {
        errorElement.textContent = message;
    }
    // Optionally provide a link back to the home page
    // errorElement.innerHTML += ", <a href=\"/\">Go back home</a>";
};

/**
 * Main function to process the authentication callback.
 */
const handleCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const receivedState = params.get("state");

    let expectedState = null;
    try {
        expectedState = localStorage.getItem(AUTH_STATE_KEY);
    } catch (error) {
        displayError("Could not retrieve authentication state from storage.");
        return;
    }

    // Always remove the state from storage after retrieving it
    try {
        localStorage.removeItem(AUTH_STATE_KEY);
    } catch (error) {
        console.warn("Could not remove auth state from storage:", error);
    }

    if (!code) {
        displayError("Authorization code not found in URL.");
        return;
    }

    if (!receivedState) {
        displayError("State parameter not found in URL.");
        return;
    }

    if (!expectedState) {
        displayError("Expected state not found in storage. Please try logging in again.");
        return;
    }

    if (receivedState !== expectedState) {
        displayError("Invalid state parameter. Possible CSRF attack detected. Please try logging in again.");
        return;
    }

    // State is valid, proceed to exchange code for token
    if (messageElement) {
        messageElement.textContent = "Exchanging code for token...";
    }

    const token = await exchangeCodeForToken(code, expectedState, receivedState);

    if (token) {
        storeToken(token);
        if (messageElement) {
            messageElement.textContent = "Authentication successful! Redirecting...";
        }
        // Redirect to the main application page
        window.location.href = "/";
    } else {
        // exchangeCodeForToken should have already displayed an error via createAlert
        // but we update the callback page UI as well.
        displayError("Failed to obtain authentication token from the server. Check console for details.");
    }
};

// Run the callback handler when the page loads
handleCallback();

