// Entry point of the application

import $ from "jquery"; // Import jQuery
import { calculateLayout } from "./utils";
import "./debug";
// Import updated socket utils including subscribe/unsubscribe
import { initSocket, socket, subscribe, unsubscribe, sendMessage } from "../utils/streams";
import { createAlert } from "../utils/notify"; // Import notification util
import { initCanvas, renderCanvasUpdate, resetValues, toggleTooltip } from "../rooms/canvas/utils"; // Import canvas utils

// Initialize the layout
calculateLayout();

// --- DOM Elements --- //
const roomNameElement = $("#room-name")?.[0];
const roomDescriptionElement = $("#room-description")?.[0];

// --- Global State --- //
let currentRoom = null; // Stores data received from joinRoom event (incl. slug, name)
let roomConfig = null; // Stores config fetched from /api/config or /api/rooms/:slug/config
let initialCanvas = null;
let canvasSubscriptionId = null; // To store the ID for the canvas subscription
let chatSubscriptionId = null; // To store the ID for the chat subscription

/**
 * Updates the room header UI elements.
 * @param {string} name - The name of the room.
 * @param {string} description - The description of the room.
 */
const updateRoomHeader = (name, description = "") => {
    if (roomNameElement) {
        roomNameElement.textContent = name || "E/PLACE"; // Use name or default
    }
    if (roomDescriptionElement) {
        // Description might not be available in all contexts, handle gracefully
        roomDescriptionElement.textContent = description;
    }
};

/**
 * Handles incoming pixel update data from the subscription.
 * @param {object} data - The pixel update data { roomSlug, posX, posY, color }.
 */
const handlePixelUpdate = (data) => {
    if (data && typeof data.posX === "number" && typeof data.posY === "number" && typeof data.color === "number") {
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
    if (data && data.content) {
        console.log(`Chat message in room ${data.roomSlug}: ${data.content} (from ${data.authorUid})`);
        createAlert("Chat", `New message: ${data.content}`, "info");
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
    if (canvasSubscriptionId !== null) unsubscribe(canvasSubscriptionId);
    if (chatSubscriptionId !== null) unsubscribe(chatSubscriptionId);

    console.log(`Subscribing to canvas stream for room: ${roomSlug}`);
    canvasSubscriptionId = subscribe("rooms.canvas.getStream", roomSlug, handlePixelUpdate);
    if (canvasSubscriptionId === null) createAlert("Error", "Failed to initiate canvas subscription.", "error");

    console.log(`Subscribing to chat for room: ${roomSlug}`);
    chatSubscriptionId = subscribe("rooms.getChat", roomSlug, handleChatMessage);
    if (chatSubscriptionId === null) createAlert("Error", "Failed to initiate chat subscription.", "error");
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
 * @param {object} roomData - Data received when joining the room (should include slug, name).
 */
const fetchConfigAndCanvas = async (roomData) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
        createAlert("Configuration Error", "VITE_API_URL is not defined.", "error");
        return;
    }
    const roomSlug = roomData?.slug;
    if (!roomSlug) {
        createAlert("Error", "Room slug not found after joining.", "error");
        return;
    }
    currentRoom = roomData; // Store current room info

    // Update header with initial room name from join data
    updateRoomHeader(currentRoom.name || currentRoom.slug);

    try {
        // 3. Fetch the configuration
        console.log(`Fetching configuration for room: ${roomSlug}...`);
        createAlert("Fetching Data", `Fetching configuration for ${roomSlug}...`, "info");
        let configUrl = `${apiUrl}/api/rooms/${roomSlug}/config`;
        let configResponse = await fetch(configUrl);
        if (!configResponse.ok) {
            console.warn(`Failed to fetch config from ${configUrl}, trying generic /api/config...`);
            configUrl = `${apiUrl}/api/config`;
            configResponse = await fetch(configUrl);
        }
        if (!configResponse.ok) {
            const errorText = await configResponse.text();
            throw new Error(`Failed to fetch config: ${configResponse.status} ${configResponse.statusText} - ${errorText}`);
        }
        roomConfig = await configResponse.json();
        console.log("Configuration received:", roomConfig);
        createAlert("Data Received", "Room configuration loaded.", "success");

        // Update header again with potentially more detailed info from config
        // Assuming config might have 'name' and 'description' fields
        updateRoomHeader(roomConfig.name || currentRoom.name || roomSlug, roomConfig.description || "");

        // 4. Fetch the canvas
        console.log(`Fetching canvas state for room: ${roomSlug}...`);
        createAlert("Fetching Data", `Fetching canvas state for ${roomSlug}...`, "info");
        let canvasUrl = `${apiUrl}/api/rooms/${roomSlug}/canvas`;
        let canvasResponse = await fetch(canvasUrl);
        if (!canvasResponse.ok) {
            console.warn(`Failed to fetch canvas from ${canvasUrl}, trying generic /api/canvas...`);
            canvasUrl = `${apiUrl}/api/canvas`;
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
        // Update header to show error state?
        updateRoomHeader(`Error loading ${roomSlug}`);
    }
};

/**
 * Main function to initialize the application logic.
 */
const main = async () => {
    try {
        // Reset state
        resetValues();
        updateRoomHeader("E/PLACE", "Loading..."); // Set initial header
        currentRoom = null;
        roomConfig = null;
        initialCanvas = null;
        if (canvasSubscriptionId !== null) unsubscribe(canvasSubscriptionId);
        if (chatSubscriptionId !== null) unsubscribe(chatSubscriptionId);
        canvasSubscriptionId = null;
        chatSubscriptionId = null;

        // 1. Connect to the server
        await initSocket();
        if (!socket || !socket.connected) {
            createAlert("Error", "Failed to establish socket connection.", "error");
            updateRoomHeader("Connection Error");
            return;
        }

        // 2. Join the main room (Using old joinRoom event)
        const roomToJoin = "main";
        console.log(`Attempting to join room: ${roomToJoin}`);
        createAlert("Joining Room", `Attempting to join room: ${roomToJoin}...`, "info");
        updateRoomHeader(`Joining ${roomToJoin}...`);

        const handleJoinRoom = (data) => {
            socket.off("joinRoom", handleJoinRoom);
            console.log("Successfully joined room (via joinRoom event):", data);
            if (data && data.slug) {
                createAlert("Room Joined", `Successfully joined room: ${data.name || data.slug}`, "success");
                fetchConfigAndCanvas(data);
            } else {
                console.error("Joined room data does not contain slug:", data);
                createAlert("Error", "Joined room, but slug is missing. Cannot subscribe.", "error");
                fetchConfigAndCanvas({ slug: roomToJoin, name: roomToJoin }); // Try with default slug
            }
        };

        socket.on("joinRoom", handleJoinRoom);

        socket.emit("joinRoom", roomToJoin, (ack) => {
            if (ack && ack.error) {
                console.error("Error joining room (ack):", ack.error);
                createAlert("Room Join Error", `Failed to join room ${roomToJoin}: ${ack.error}`, "error");
                updateRoomHeader(`Failed to join ${roomToJoin}`);
                socket.off("joinRoom", handleJoinRoom);
            }
        });

    } catch (error) {
        console.error("Initialization failed:", error);
        createAlert("Initialization Error", `Failed to initialize the application: ${error.message || error}`, "error");
        updateRoomHeader("Initialization Error");
    }
};

// Run the main application logic
main();

// --- Step 2 Placeholder --- //
// TODO: Add authentication logic here

