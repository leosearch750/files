// Entry point of the application

import { calculateLayout } from "./utils";
import "./debug";
// Import updated socket utils including subscribe/unsubscribe
import { initSocket, socket, subscribe, unsubscribe, sendMessage } from "../utils/streams";
import { createAlert } from "../utils/notify"; // Import notification util
import { initCanvas, renderCanvasUpdate, resetValues, toggleTooltip } from "../rooms/canvas/utils"; // Import canvas utils

// Initialize the layout
calculateLayout();

let currentRoom = null;
let roomConfig = null;
let initialCanvas = null;
let canvasSubscriptionId = null; // To store the ID for the canvas subscription
let chatSubscriptionId = null; // To store the ID for the chat subscription

/**
 * Handles incoming pixel update data from the subscription.
 * @param {object} data - The pixel update data { roomSlug, posX, posY, color }.
 */
const handlePixelUpdate = (data) => {
    // The documentation format is { roomSlug, posX, posY, color }
    // The renderCanvasUpdate function expects (color, x, y)
    if (data && typeof data.posX === 'number' && typeof data.posY === 'number' && typeof data.color === 'number') {
        // console.log(`Received pixel update via subscription: x=${data.posX}, y=${data.posY}, color=${data.color}`);
        renderCanvasUpdate(data.color, data.posX, data.posY);
    } else {
        console.warn("Received invalid pixel update data via subscription:", data);
    }
};

/**
 * Handles incoming chat messages from the subscription.
 * @param {object} data - The chat message data { roomSlug, authorUid, sentAt, content }.
 */
const handleChatMessage = (data) => {
    // Placeholder for Step 5: Display chat messages
    if (data && data.content) {
        console.log(`Chat message in room ${data.roomSlug}: ${data.content} (from ${data.authorUid})`);
        // TODO: Implement chat message display in the UI
        // Example: addChatMessageToUI(data.authorUid, data.content, data.sentAt);
        createAlert("Chat", `New message: ${data.content}`, "info"); // Simple notification for now
    } else {
        console.warn("Received invalid chat message data:", data);
    }
};

/**
 * Sets up subscriptions for canvas updates and chat messages.
 * @param {string} roomSlug - The slug of the room to subscribe to.
 */
const setupSubscriptions = (roomSlug) => {
    if (!socket) {
        console.error("Socket not initialized. Cannot set up subscriptions.");
        return;
    }

    // Unsubscribe from previous subscriptions if any
    if (canvasSubscriptionId !== null) {
        unsubscribe(canvasSubscriptionId);
        canvasSubscriptionId = null;
    }
    if (chatSubscriptionId !== null) {
        unsubscribe(chatSubscriptionId);
        chatSubscriptionId = null;
    }

    // Subscribe to canvas updates
    console.log(`Subscribing to canvas stream for room: ${roomSlug}`);
    canvasSubscriptionId = subscribe('rooms.canvas.getStream', roomSlug, handlePixelUpdate);
    if (canvasSubscriptionId === null) {
        createAlert("Error", "Failed to initiate canvas subscription.", "error");
    }

    // Subscribe to chat messages
    console.log(`Subscribing to chat for room: ${roomSlug}`);
    chatSubscriptionId = subscribe('rooms.getChat', roomSlug, handleChatMessage);
     if (chatSubscriptionId === null) {
        createAlert("Error", "Failed to initiate chat subscription.", "error");
    }
};

/**
 * Displays the canvas using the fetched configuration and initial state.
 * @param {object} config - The room configuration.
 * @param {Array<number>} canvasState - The initial canvas pixel data.
 */
const displayCanvas = (config, canvasState) => {
    try {
        console.log("Initializing canvas display...");
        createAlert("Initializing Canvas", "Setting up the canvas...", "info");
        initCanvas(config, canvasState);
        createAlert("Canvas Ready", "Canvas is ready.", "success");

        // Setup subscriptions now that canvas is ready
        if (currentRoom && currentRoom.slug) {
             setupSubscriptions(currentRoom.slug);
        } else {
            console.error("Cannot setup subscriptions: currentRoom or room slug is missing.");
            createAlert("Error", "Missing room information for subscriptions.", "error");
        }

    } catch (error) {
        console.error("Failed to display canvas:", error);
        createAlert("Canvas Error", `Failed to display the canvas: ${error.message}`, "error");
    }
};

/**
 * Fetches the room configuration and the initial canvas state.
 * @param {object} roomData - Data received when joining the room (should include slug).
 */
const fetchConfigAndCanvas = async (roomData) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
        createAlert("Configuration Error", "VITE_API_URL is not defined.", "error");
        return;
    }
    // Ensure we have the room slug, needed for subscriptions
    const roomSlug = roomData?.slug;
    if (!roomSlug) {
        createAlert("Error", "Room slug not found after joining.", "error");
        return;
    }
    currentRoom = roomData; // Store current room info (including slug)

    try {
        // 3. Fetch the configuration
        console.log(`Fetching configuration for room: ${roomSlug}...`);
        createAlert("Fetching Data", `Fetching configuration for ${roomSlug}...`, "info");
        // Assuming config endpoint might be room-specific or generic
        // Let's try a potentially room-specific endpoint first, fallback to generic
        let configUrl = `${apiUrl}/api/rooms/${roomSlug}/config`;
        let configResponse = await fetch(configUrl);
        if (!configResponse.ok) {
            console.warn(`Failed to fetch config from ${configUrl}, trying generic /api/config...`);
            configUrl = `${apiUrl}/api/config`; // Fallback to generic endpoint from Step 1 example
            configResponse = await fetch(configUrl);
        }
        if (!configResponse.ok) {
            const errorText = await configResponse.text();
            throw new Error(`Failed to fetch config: ${configResponse.status} ${configResponse.statusText} - ${errorText}`);
        }
        roomConfig = await configResponse.json();
        console.log("Configuration received:", roomConfig);
        createAlert("Data Received", "Room configuration loaded.", "success");

        // 4. Fetch the canvas
        console.log(`Fetching canvas state for room: ${roomSlug}...`);
        createAlert("Fetching Data", `Fetching canvas state for ${roomSlug}...`, "info");
        // Assuming canvas endpoint might be room-specific or generic
        let canvasUrl = `${apiUrl}/api/rooms/${roomSlug}/canvas`;
        let canvasResponse = await fetch(canvasUrl);
         if (!canvasResponse.ok) {
            console.warn(`Failed to fetch canvas from ${canvasUrl}, trying generic /api/canvas...`);
            canvasUrl = `${apiUrl}/api/canvas`; // Fallback to generic endpoint from Step 1 example
            canvasResponse = await fetch(canvasUrl);
        }
        if (!canvasResponse.ok) {
            const errorText = await canvasResponse.text();
            throw new Error(`Failed to fetch canvas: ${canvasResponse.status} ${canvasResponse.statusText} - ${errorText}`);
        }
        initialCanvas = await canvasResponse.json();
        console.log("Canvas received (initial state).");
        createAlert("Data Received", "Initial canvas loaded.", "success");

        // 5. Display the canvas (Task 5)
        displayCanvas(roomConfig, initialCanvas);

    } catch (error) {
        console.error("Failed to fetch config or canvas:", error);
        createAlert("Fetch Error", `Failed to load room data: ${error.message}`, "error");
    }
};


/**
 * Main function to initialize the application logic.
 */
const main = async () => {
    try {
        // Reset state if re-initializing
        resetValues();
        currentRoom = null;
        roomConfig = null;
        initialCanvas = null;
        if (canvasSubscriptionId !== null) unsubscribe(canvasSubscriptionId);
        if (chatSubscriptionId !== null) unsubscribe(chatSubscriptionId);
        canvasSubscriptionId = null;
        chatSubscriptionId = null;

        // 1. Connect to the server using Socket.io
        await initSocket();

        if (!socket || !socket.connected) {
            createAlert("Error", "Failed to establish socket connection.", "error");
            return;
        }

        // 2. Join the main room (Using the old joinRoom event from Step 1 PDF)
        // NOTE: The new socket documentation doesn't explicitly show a 'joinRoom' event.
        // It focuses on 'subscription' messages. We might need clarification if 'joinRoom'
        // is still used or if joining is implicit with the first subscription.
        // For now, keeping the Step 1 logic for joining.
        const roomToJoin = "main";
        console.log(`Attempting to join room: ${roomToJoin}`);
        createAlert("Joining Room", `Attempting to join room: ${roomToJoin}...`, "info");

        const handleJoinRoom = (data) => {
            socket.off("joinRoom", handleJoinRoom); // Remove listener
            console.log("Successfully joined room (via joinRoom event):", data);
            // Assuming 'data' contains the room slug needed for subscriptions
            if (data && data.slug) {
                 createAlert("Room Joined", `Successfully joined room: ${data.name || data.slug}`, "success");
                 // Proceed to fetch config/canvas which will then setup subscriptions
                 fetchConfigAndCanvas(data);
            } else {
                console.error("Joined room data does not contain slug:", data);
                createAlert("Error", "Joined room, but slug is missing. Cannot subscribe.", "error");
                // Attempt to fetch config/canvas anyway? Or stop?
                // Let's try fetching with the assumption slug is 'main'
                fetchConfigAndCanvas({ slug: roomToJoin, name: roomToJoin });
            }
        };

        const handleSocketError = (errorData) => {
            console.error("Socket error received:", errorData);
            let message = "An unknown server error occurred.";
            if (typeof errorData === "string") {
                message = errorData;
            } else if (errorData && errorData.message) {
                message = errorData.message;
            }
            createAlert("Server Error", `Received error: ${message}`, "error");
        };

        // Add listeners for the old joinRoom event (pending clarification)
        socket.on("joinRoom", handleJoinRoom);
        // The generic 'message' listener in streams.js handles subscription errors
        // socket.on("error", handleSocketError); // Keep or remove? The 'message' listener might cover errors with IDs.

        // Emit the old joinRoom event (pending clarification)
        socket.emit("joinRoom", roomToJoin, (ack) => {
            if (ack && ack.error) {
                console.error("Error joining room (ack):", ack.error);
                createAlert("Room Join Error", `Failed to join room ${roomToJoin}: ${ack.error}`, "error");
                socket.off("joinRoom", handleJoinRoom);
            }
        });

    } catch (error) {
        console.error("Initialization failed:", error);
        createAlert("Initialization Error", `Failed to initialize the application: ${error.message || error}`, "error");
    }
};

// Run the main application logic
main();

// --- Example Usage for sendMessage (e.g., called from a UI button) ---
/*
function sendChatMessage(messageContent) {
    if (currentRoom && currentRoom.slug) {
        sendMessage(currentRoom.slug, messageContent);
    } else {
        createAlert("Error", "Cannot send message: Not in a room.", "error");
    }
}
// Example: Attach to a button click
// document.getElementById('send-chat-button').addEventListener('click', () => {
//     const input = document.getElementById('chat-input');
//     if (input.value) {
//         sendChatMessage(input.value);
//         input.value = ''; // Clear input
//     }
// });
*/

