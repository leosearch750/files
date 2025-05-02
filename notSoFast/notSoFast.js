const http = require("http");

function get(path, host, port) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: host,
            port: port,
            path: path,
            method: "GET",
        };

        const req = http.request(options, (res) => {
            let data = "";

            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                const headers = res.headers;
                const statusCode = res.statusCode;

                resolve({ data, headers, statusCode });
            });
        });

        req.on("error", reject);
        req.end();
    });
}

async function notSoFast(host, port) {
    const articles = [];

    // Récupérer le nombre total d'articles
    const { data: countData } = await get("/articles", host, port);
    const total = JSON.parse(countData).message;

    for (let id = 0; id < total; id++) {
        while (true) {
            const { data, headers, statusCode } = await get(
                `/articles/${id}`,
                host,
                port,
            );

            if (statusCode === 200) {
                articles.push(JSON.parse(data));
                break;
            }

            // headers : retry intelligent
            const remaining = parseInt(headers["x-ratelimit-remaining"]);
            const reset = parseFloat(headers["x-ratelimit-reset"]);

            if (remaining === 0) {
                const now = Date.now() / 1000;
                const waitTime = Math.max(0, reset - now + 0.05); // petit buffer

                await new Promise((r) => setTimeout(r, waitTime * 1000));
            } else {
                await new Promise((r) => setTimeout(r, 200)); // petite pause
            }
        }
    }

    return articles;
}

/*
(async () => {
    const startTime = Date.now();
    const articlesList = await notSoFast("localhost", 3000);
    const endTime = Date.now();

    console.log("elapsed:", endTime - startTime, "ms");
    console.log("length:", articlesList.length);
})();
*/

module.exports = {
    notSoFast,
};
