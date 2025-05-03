// This file handles the sockets communication based on the provided documentation

import { io } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid'; // Import uuid v4
import { createAlert } from "./notify";

let socket;
// Use a Map to store active subscriptions, mapping UUID string to subscription details
const activeSubscriptions = new Map(); // Map<string, { path: string, roomSlug: string, callback: Function }>

/**
 * Initializes the socket connection to the server.
 * @returns {Promise<Socket>} A promise that resolves with the socket instance once connected.
 */
const initSocket = () => {
    if (socket && socket.connected) {
        return Promise.resolve(socket);
    }
    if (socket) {
        socket.connect();
    } else {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
            console.error("VITE_API_URL is not defined in .env file");
            createAlert("Configuration Error", "VITE_API_URL is not defined. Please check your .env file.", "error");
            return Promise.reject("VITE_API_URL not defined");
        }
        console.log(`Attempting to connect to socket server at ${apiUrl}`);
        socket = io(apiUrl, {});
    }

    return new Promise((resolve, reject) => {
        socket.off("connect");
        socket.off("connect_error");
        socket.off("disconnect");
        socket.off("message");

        socket.on("connect", () => {
            console.log("Socket connected successfully:", socket.id);
            createAlert("Connection", "Connected to the server.", "success");
            // Re-subscribe on reconnect
            activeSubscriptions.forEach((sub, id) => {
                console.log(`Re-subscribing to ${sub.path} for room ${sub.roomSlug} with id ${id}`);
                emitSubscription(id, sub.path, sub.roomSlug);
            });
            resolve(socket);
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            createAlert("Connection Error", `Failed to connect to the server: ${err.message}`, "error");
            reject(err);
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
            createAlert("Connection Lost", `Disconnected from the server: ${reason}`, "warning");
        });

        // Central listener for messages
        socket.on("message", (msg) => {
            if (msg && msg.id !== undefined) {
                 // ID can be string (UUID) or number (if server uses numbers for some responses)
                const subscriptionId = String(msg.id); // Ensure ID is treated as string for map lookup
                if (msg.result && msg.result.type === "data") {
                    const subscription = activeSubscriptions.get(subscriptionId);
                    if (subscription && subscription.callback) {
                        subscription.callback(msg.result.data.json);
                    } else if (msg.result.data?.json?.event) {
                         console.log("Received event data:", msg.result.data.json);
                    }
                } else if (msg.result && msg.result.type === "started") {
                    console.log(`Subscription started for id: ${subscriptionId}`);
                } else if (msg.error) {
                    console.error(`Error for request/subscription id ${subscriptionId}:`, msg.error.json);
                    createAlert("Subscription Error", `Failed subscription ${subscriptionId}: ${msg.error.json?.message || "Unknown error"}`, "error");
                    // Optionally remove failed subscription
                    // activeSubscriptions.delete(subscriptionId);
                } else {
                     console.log("Received unhandled message type:", msg);
                }
            } else {
                console.warn("Received message without id or invalid format:", msg);
            }
        });
    });
};

/**
 * Emits a subscription message to the server.
 * @param {string} id - The subscription ID (UUID string).
 * @param {string} path - The subscription path.
 * @param {string} roomSlug - The room slug.
 */
const emitSubscription = (id, path, roomSlug) => {
    if (!socket || !socket.connected) {
        console.error("Socket not connected. Cannot emit subscription.");
        return;
    }
    const message = {
        id: id, // Use the provided UUID string
        method: "subscription",
        params: {
            path: path,
            input: {
                json: {
                    roomSlug: roomSlug,
                },
            },
        },
    };
    console.log("Emitting subscription:", message);
    socket.emit("message", message);
}

/**
 * Subscribes to a specific room stream.
 * @param {string} path - The subscription path ("rooms.canvas.getStream" or "rooms.getChat").
 * @param {string} roomSlug - The slug of the room.
 * @param {Function} callback - Function to call when data is received.
 * @returns {string | null} The subscription ID (UUID string), used for unsubscribing, or null on error.
 */
const subscribe = (path, roomSlug, callback) => {
    if (!socket) {
        console.error("Socket not initialized. Call initSocket first.");
        return null;
    }
    if (path !== 'rooms.canvas.getStream' && path !== 'rooms.getChat') {
        console.error(`Invalid subscription path: ${path}`);
        return null;
    }

    const id = uuidv4(); // Generate UUID v4 for the subscription ID
    activeSubscriptions.set(id, { path, roomSlug, callback });
    emitSubscription(id, path, roomSlug);
    console.log(`Subscription initiated with ID: ${id} for path: ${path}`);
    return id;
};

/**
 * Unsubscribes from a specific stream.
 * @param {string} id - The subscription ID (UUID string) returned by subscribe().
 */
const unsubscribe = (id) => {
    if (!socket || !socket.connected) {
        console.error("Socket not connected. Cannot unsubscribe.");
        return;
    }
    if (!activeSubscriptions.has(id)) {
        console.warn(`No active subscription found for id: ${id}`);
        return;
    }

    const message = {
        id: id, // Use the UUID string
        method: "subscription.stop",
    };
    console.log("Emitting unsubscription:", message);
    socket.emit("message", message);
    activeSubscriptions.delete(id);
};

/**
 * Sends a chat message to a specific room.
 * @param {string} roomSlug - The slug of the room.
 * @param {string} messageContent - The content of the message.
 */
const sendMessage = (roomSlug, messageContent) => {
    if (!socket || !socket.connected) {
        console.error("Socket not connected. Cannot send message.");
        createAlert("Error", "Not connected to server.", "error");
        return;
    }

    const message = {
        // Mutations might not need an ID according to docs, but adding one might help track responses if server supports it.
        // id: uuidv4(), // Optional: Generate UUID for mutation if needed
        method: "mutation",
        params: {
            path: "rooms.sendMessage",
            input: {
                json: {
                    roomSlug: roomSlug,
                    message: messageContent,
                },
            },
        },
    };
    console.log("Emitting message:", message);
    socket.emit("message", message);
};

// Export the functions and the socket instance
export { initSocket, socket, subscribe, unsubscribe, sendMessage };

