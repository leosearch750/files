// throttleDebounce.js

/**
 * Debounce function - delays execution until after wait milliseconds 
 * have elapsed since the last time it was invoked.
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} - A debounced version of the given function
 */
function debounce(func, wait) {
    let timeoutId;
    
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

/**
 * Throttle function - limits the rate at which a function can fire.
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to wait between executions
 * @returns {Function} - A throttled version of the given function
 */
function throttle(func, wait) {
    let lastExecution = 0;
    let timeoutId;
    let lastArgs;
    
    return function(...args) {
        const now = Date.now();
        const timeSinceLastExecution = now - lastExecution;
        
        lastArgs = args;
        
        if (!timeoutId) {
            if (timeSinceLastExecution >= wait) {
                // Execute immediately if enough time has passed
                func.apply(this, lastArgs);
                lastExecution = now;
            } else {
                // Schedule execution for remaining time
                timeoutId = setTimeout(() => {
                    func.apply(this, lastArgs);
                    lastExecution = Date.now();
                    timeoutId = null;
                }, wait - timeSinceLastExecution);
            }
        }
    };
}

if (typeof window === "undefined") {
    module.exports = {
        debounce,
        throttle,
    };
}
