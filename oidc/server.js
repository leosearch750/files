const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

/**
 * The requests sent to our local server running on http://localhost:8080
 * will pass by the reverse proxy and be sent to a specified path.
 *
 * In our case,
 * /auth-api -> https://cri.epita.fr/token
 **/

const path = `https://cri.epita.fr/token`;
const proxyAuth = createProxyMiddleware("/auth-api", {
    target: path,
    changeOrigin: true,
    pathRewrite: {
        "^/auth-api": "",
    },
});

app.get("/", (req, res) => {
    res.sendFile("main.html", { root: "./" });
});

app.use(proxyAuth, express.static("./"));

const port = 8080;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
