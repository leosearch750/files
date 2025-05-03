// This file handles the room canvas DOM manipulation
// Functions includes:
// - initCanvas (initialize the canvas)
// - renderCanvasUpdate (render a canvas update)
// - getPlacementData (get the necessary data to place a pixel)
// - toggleTooltip (toggle the tooltip and display the pixel's information)

import $ from "jquery";

const canvasContainer = $("#canvas-container")?.[0];
const canvas = $("#canvas")?.[0];
const canvasCtx = canvas.getContext("2d");
const selector = $("#selector")?.[0];

const positionTooltip = $("#position-tooltip")?.[0];
const tooltip = $("#tooltip")?.[0];
const colorPicker = $("#color-picker")?.[0];
const colorWheelContainer = $("#color-wheel-container")?.[0];
const colorWheel = $("#color-wheel")?.[0];

// Assume tooltip internal elements for displaying color info
const tooltipColorPreview = $("#tooltip-color-preview")?.[0];
const tooltipColorValue = $("#tooltip-color-value")?.[0];
// Add placeholders for potential future info (user, timestamp)
const tooltipUserInfo = $("#tooltip-user-info")?.[0];
const tooltipTimestamp = $("#tooltip-timestamp")?.[0];

/**
 * Global variables
 */
let board, palette, selectedColorIdx;
let animation;

const zoomSpeed = 1 / 25;
let zoom = 2.5;

let x, y;
let cx = 0;
let cy = 0;
let target = { x: 0, y: 0 };
let isDrag = false;

/**
 * Returns the necessary data to place a pixel
 * @returns {{color: number, posX: number, posY: number}} the data
 */
export const getPlacementData = () => ({
    color: selectedColorIdx,
    posX: target.x,
    posY: target.y,
});

/**
 * Toggle the tooltip and display the pixel's information
 * @param {boolean} state
 */
export const toggleTooltip = async (state = false) => {
    tooltip.style.display = state ? "flex" : "none";

    if (state) {
        // Display pixel information: Coordinates (already handled by positionDisplay), Color.
        // User and Timestamp might be added in later steps.
        if (board && palette && canvas && typeof target.x === 'number' && typeof target.y === 'number') {
            const pixelX = target.x;
            const pixelY = target.y;
            const canvasWidth = canvas.width;

            if (pixelX >= 0 && pixelX < canvasWidth && pixelY >= 0 && pixelY < canvas.height) {
                const index = pixelY * canvasWidth + pixelX;
                const colorIndex = board[index];

                if (typeof colorIndex === 'number' && colorIndex >= 0 && colorIndex < palette.length) {
                    const colorHex = palette[colorIndex];

                    // Update color preview
                    if (tooltipColorPreview) {
                        tooltipColorPreview.style.backgroundColor = colorHex;
                    }
                    // Update color value text
                    if (tooltipColorValue) {
                        tooltipColorValue.textContent = colorHex;
                    }
                    // Placeholder for future info (Step 3/4)
                    if (tooltipUserInfo) {
                        tooltipUserInfo.textContent = "User: ?"; // Placeholder
                    }
                    if (tooltipTimestamp) {
                        tooltipTimestamp.textContent = "Time: ?"; // Placeholder
                    }
                } else {
                    console.warn(`Invalid color index ${colorIndex} at [${pixelX}, ${pixelY}]`);
                    if (tooltipColorValue) tooltipColorValue.textContent = "N/A";
                    if (tooltipColorPreview) tooltipColorPreview.style.backgroundColor = "transparent";
                }
            } else {
                console.warn(`Target coordinates [${pixelX}, ${pixelY}] out of bounds`);
                if (tooltipColorValue) tooltipColorValue.textContent = "Out";
                 if (tooltipColorPreview) tooltipColorPreview.style.backgroundColor = "transparent";
            }
        } else {
            console.warn("Cannot display tooltip info: board, palette, or target not ready.");
            if (tooltipColorValue) tooltipColorValue.textContent = "Error";
            if (tooltipColorPreview) tooltipColorPreview.style.backgroundColor = "transparent";
        }
    }
};

/**
 * Calculate the target position according to the top left corner of the canvas
 * @param {*} event
 * @returns {x: number, y: number} the target position
 */
const calculateTarget = (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasLeft = rect.left + window.pageXOffset;
    const canvasTop = rect.top + window.pageYOffset;

    return {
        x: Math.floor(
            ((event?.pageX ?? window.innerWidth / 2) - canvasLeft) * scaleX,
        ),
        y: Math.floor(
            ((event?.pageY ?? window.innerHeight / 2) - canvasTop) * scaleY,
        ),
    };
};

/**
 * Update the position tooltip
 * @param {*} event
 */
const positionUpdate = (event) => positionDisplay(calculateTarget(event));

/**
 * Update the position tooltip
 * @param {{x: number, y: number}} targetCoords
 */
const positionDisplay = ({ x: targetX, y: targetY }) => {
    // Update coordinate display
    positionTooltip.innerText = `X=${targetX} Y=${targetY}`;

    // Update main canvas transform
    canvas.style.transform = `translate(${cx}px, ${cy}px) scale(${zoom})`;

    // Calculate selector transform
    let selectorX = cx + canvas.width * zoom;
    let selectorY = cy + canvas.height * zoom;

    if (canvas.width % 2 !== 0) {
        selectorX += zoom / 2;
        selectorY += zoom / 2;
    }

    selectorX %= zoom;
    selectorY %= zoom;
    selectorX -= zoom / 2;
    selectorY -= zoom / 2;

    selector.style.transform = `translate(${selectorX}px, ${selectorY}px) scale(${zoom})`;
};

// Toggle the color wheel on click on the color picker
colorPicker.addEventListener("click", () => {
    const state = colorWheelContainer.style.display;

    colorWheelContainer.style.display =
        !state || state === "none" ? "block" : "none";
});

/**
 * Transform #RRGGBB to 0xBBGGRRAA (used for ImageData)
 * @param {string} hex
 * @returns {number} the 32 bits color
 */
const transformHexTo32Bits = (hex) => {
    // Ensure hex is a valid 7-character string (#RRGGBB)
    if (!hex || hex.length !== 7 || hex[0] !== '#') {
        console.warn(`Invalid hex color format: ${hex}. Using black.`);
        return 0xFF000000; // Return black (ABGR format for Uint32Array)
    }
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    // Return in ABGR format for ImageData buffer
    return (255 << 24) | (b << 16) | (g << 8) | r;
};

/**
 * Render the entire canvas based on pixel data and color palette.
 * @param {number[]} pixels - Array of color indices for each pixel.
 * @param {string[]} colors - Array of hex color strings (#RRGGBB).
 */
const renderCanvas = (pixels, colors) => {
    if (!canvas || !canvasCtx) {
        console.error("Canvas or context not available for rendering.");
        return;
    }
    const img = canvasCtx.createImageData(canvas.width, canvas.height);
    const data = new Uint32Array(img.data.buffer);

    board = pixels; // Store the pixel data globally
    palette = colors; // Store the palette globally

    for (let i = 0; i < pixels.length; i++) {
        const colorIndex = pixels[i];
        if (colorIndex >= 0 && colorIndex < colors.length) {
            data[i] = transformHexTo32Bits(colors[colorIndex]);
        } else {
            console.warn(`Invalid color index ${colorIndex} at pixel ${i}. Using black.`);
            data[i] = 0xFF000000; // Black in ABGR
        }
    }

    canvasCtx.putImageData(img, 0, 0);
    canvasCtx.imageSmoothingEnabled = false;
    canvas.style.imageRendering = "pixelated";

    // --- Color Wheel Setup ---
    // Remove all the colors from the color wheel
    while (colorWheel.firstChild) {
        colorWheel.removeChild(colorWheel.firstChild);
    }

    // Add the colors to the color wheel
    for (let i = 0; i < colors.length; i++) {
        const btn = document.createElement("button");
        colorWheel.appendChild(btn);

        btn.addEventListener("click", () => {
            selectedColorIdx = i;
            colorPicker.style.color = colors[i];
            colorPicker.style.border = `${colors[i]} 0.1rem solid`;
            // Optionally close the color wheel after selection
            // colorWheelContainer.style.display = "none";
        });

        btn.style.backgroundColor = colors[i];
    }
    // Set initial selected color (index 0)
    selectedColorIdx = 0;
    if (colors.length > 0) {
        colorPicker.style.color = colors[0];
        colorPicker.style.border = `${colors[0]} 0.1rem solid`;
    }
};

/**
 * Initialize the canvas dimensions, state, and interactions.
 * @param {object} roomConfig - Configuration object for the room.
 * @param {number[]} pixels - Initial pixel data array.
 */
export const initCanvas = (roomConfig, pixels) => {
    if (!roomConfig || !roomConfig.metadata || !roomConfig.settings) {
        console.error("Invalid roomConfig provided to initCanvas.");
        return;
    }
    const canvasDimensions = roomConfig.metadata.canvasDimensions;
    const roomColors = roomConfig.settings.roomColors.split(",");

    if (!canvas || !canvasDimensions || !roomColors || !pixels) {
         console.error("Missing required data for initCanvas.");
         return;
    }

    canvas.width = canvasDimensions;
    canvas.height = canvasDimensions;

    // Set initial view/target to center
    target = { x: Math.floor(canvasDimensions / 2), y: Math.floor(canvasDimensions / 2) };
    positionDisplay(target);

    renderCanvas(pixels, roomColors);
};

/**
 * Update a single pixel on the canvas.
 * @param {number} colorIndex - The new color index for the pixel.
 * @param {number} pixelX - The x-coordinate of the pixel.
 * @param {number} pixelY - The y-coordinate of the pixel.
 */
export const renderCanvasUpdate = (colorIndex, pixelX, pixelY) => {
    if (!board || !palette || !canvasCtx || !canvas) {
        console.error("Canvas not initialized. Cannot update pixel.");
        return;
    }

    const canvasWidth = canvas.width;
    if (pixelX < 0 || pixelX >= canvasWidth || pixelY < 0 || pixelY >= canvas.height) {
        console.warn(`Pixel update coordinates [${pixelX}, ${pixelY}] out of bounds.`);
        return;
    }

    if (colorIndex < 0 || colorIndex >= palette.length) {
        console.warn(`Invalid color index ${colorIndex} for pixel update.`);
        return;
    }

    // Update the board data
    const index = pixelY * canvasWidth + pixelX;
    board[index] = colorIndex;

    // Update the ImageData directly for performance
    // (putImageData is faster for single pixels than recreating the whole buffer)
    const colorHex = palette[colorIndex];
    const color32Bit = transformHexTo32Bits(colorHex);
    const imgData = canvasCtx.createImageData(1, 1);
    const data = new Uint32Array(imgData.data.buffer);
    data[0] = color32Bit;
    canvasCtx.putImageData(imgData, pixelX, pixelY);

    // If the tooltip is currently visible and showing this pixel, update it
    if (tooltip.style.display === 'flex' && target.x === pixelX && target.y === pixelY) {
        toggleTooltip(true); // Re-render tooltip with new color
    }
};

/**
 * Reset the canvas view and interaction state.
 */
export const resetValues = () => {
    zoom = 2.5;
    cx = 0;
    cy = 0;
    isDrag = false;
    target = { x: canvas ? Math.floor(canvas.width / 2) : 0, y: canvas ? Math.floor(canvas.height / 2) : 0 };

    positionDisplay(target);
    colorWheelContainer.style.display = "none";
    toggleTooltip(false);
};

// --- Event Listeners --- //

// Handle scroll on canvas for zooming
document.addEventListener("wheel", (e) => {
    if (e.target !== canvas && e.target !== canvasContainer) return;

    clearInterval(animation);
    toggleTooltip(false);

    const delta = Math.sign(e.deltaY) * zoomSpeed;
    const zoomFactor = 1 + delta;
    const oldZoom = zoom;
    const newZoom = Math.max(2.5, Math.min(40, oldZoom * zoomFactor));

    const mouseX = e.clientX - window.innerWidth / 2;
    const mouseY = e.clientY - window.innerHeight / 2;

    const newCx = mouseX - (mouseX - cx) * (newZoom / oldZoom);
    const newCy = mouseY - (mouseY - cy) * (newZoom / oldZoom);

    if (newZoom !== oldZoom) {
        zoom = newZoom;
        cx = newCx;
        cy = newCy;
        positionUpdate(e); // Pass event to update target based on mouse position during zoom
    }
});

let dragStartX, dragStartY;
// Handle click and drag on canvas for panning
document.addEventListener("mousedown", (e) => {
    if (e.target !== canvas && e.target !== canvasContainer) return;
    if (e.button === 2) return; // Ignore right click

    e.preventDefault();
    clearInterval(animation);

    isDrag = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    document.addEventListener("mousemove", mouseMove);
});

// Smooth animation function
function easeOutQuart(t, b, c, d) {
    t /= d;
    t--;
    return -c * (t * t * t * t - 1) + b;
}

// Handle mouse release (end of pan or click)
document.addEventListener("mouseup", (e) => {
    document.removeEventListener("mousemove", mouseMove);

    if (e.target !== canvas && e.target !== canvasContainer) return;
    if (e.button === 2) return;

    e.preventDefault();

    // Get the final target pixel position
    target = calculateTarget(e);

    if (
        target.x >= 0 &&
        target.x < canvas.width &&
        target.y >= 0 &&
        target.y < canvas.height
    ) {
        if (!isDrag) {
            // --- Click Animation --- //
            const duration = 500; // Shorter duration
            const startZoom = zoom;
            const endZoom = Math.max(15, Math.min(40, zoom)); // Zoom in on click

            const clickX = e.clientX - window.innerWidth / 2;
            const clickY = e.clientY - window.innerHeight / 2;

            // Calculate target center based on clicked pixel
            const targetCx = -(target.x - canvas.width / 2) * endZoom;
            const targetCy = -(target.y - canvas.height / 2) * endZoom;

            const startCx = cx;
            const startCy = cy;
            const startTime = Date.now();

            if (Math.abs(targetCx - startCx) < 10 && Math.abs(targetCy - startCy) < 10 && Math.abs(endZoom - startZoom) < 1) {
                // If already close, just snap and show tooltip
                cx = targetCx;
                cy = targetCy;
                zoom = endZoom;
                positionDisplay(target);
                toggleTooltip(true);
            } else {
                // Animate zoom and pan
                clearInterval(animation);
                animation = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    if (elapsed >= duration) {
                        clearInterval(animation);
                        cx = targetCx;
                        cy = targetCy;
                        zoom = endZoom;
                        positionDisplay(target);
                        toggleTooltip(true); // Show tooltip after animation
                        return;
                    }
                    const t = elapsed / duration;
                    zoom = easeOutQuart(t, startZoom, endZoom - startZoom, 1);
                    cx = easeOutQuart(t, startCx, targetCx - startCx, 1);
                    cy = easeOutQuart(t, startCy, targetCy - startCy, 1);
                    positionUpdate(e); // Update display during animation
                }, 10);
            }
        } else {
             // Update position display after drag ends
             positionDisplay(target);
        }
    } else {
        // Clicked outside canvas bounds
        toggleTooltip(false);
    }
});

// Handle mouse move during drag (panning)
const mouseMove = (e) => {
    e.preventDefault();

    const currentX = e.clientX;
    const currentY = e.clientY;
    const dx = currentX - dragStartX;
    const dy = currentY - dragStartY;

    if (!isDrag && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) { // Threshold to detect drag
        isDrag = true;
        toggleTooltip(false); // Hide tooltip when dragging starts
    }

    if (isDrag) {
        cx += dx;
        cy += dy;
        dragStartX = currentX;
        dragStartY = currentY;
        positionUpdate(e); // Update display during pan
    }
};

