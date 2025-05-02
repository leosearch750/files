const axios = require("axios");

async function run() {
    try {
        const res = await axios.get("http://localhost:3000");

        console.log(res.headers["x-ratelimit-limit"]);
        console.log(res.headers["x-ratelimit-remaining"]);
        console.log(res.headers["x-ratelimit-reset"]); // milliseconds
        console.log(res.headers["x-ratelimit-reset"] * 1000 - Date.now());
    } catch (err) {
        console.error("Request failed: ", err.message);
    }
}

run();

module.exports = {
    run,
};
