function sleep(s) {
    return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

if (typeof window === "undefined") {
    module.exports = {
        sleep,
    };
} else {
    globalThis.sleep = sleep;
}
