const http = require("http");

const server = http.createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
        res.statusCode = 200; // Set the status code to 200
        res.setHeader("Content-Type", "application/json");
        res.setHeader("x-ratelimit-limit", "1000");
        res.setHeader("x-ratelimit-remaining", "999");
        res.setHeader(
            "x-ratelimit-reset",
            `${Math.floor(Date.now() / 1000) + 60}`,
        );
        res.end(JSON.stringify({ message: "Hello World!" }));
    } else if (req.url === "/echo" && req.method === "GET") {
        res.statusCode = 200; // Set the status code to 200
        req.body = "";
        req.on("data", function (chunk) {
            // get the request body
            req.body += chunk;
        });
        req.on("end", function () {
            // send the request body
            res.end(req.body);
        });
    } else {
        res.statusCode = 404; // Set the status code to 404
        // Warning the format of the response body is the default one
        res.end("Not found"); // Ends the process, sending its argument as body data
    }
});

server.listen(3000, () => {
    console.log("Server is listening on port 3000");
});
