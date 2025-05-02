const express = require("express");
const jwt = require("jsonwebtoken");

function logMeIn(host, port) {
    const app = express();

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

    app.use(express.json());

    app.get("/", (req, res) => {
        res.status(200).json({ message: "Hello World!" });
    });

    app.post("/login", (req, res) => {
        const { username, password } = req.body;
        // console.log(req.body);

        if (username === "xavier.login" && password === "1234") {
            const token = jwt.sign(
                {
                    username: username,
                    password: password,
                },

                JWT_SECRET_KEY,
            );

            // console.log(username, password);

            res.status(200).json({ jwt: token });
        } else {
            res.status(401).json({ error: "Invalid username or password" });
        }
    });

    app.get("/secret", (req, res) => {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        jwt.verify(token, JWT_SECRET_KEY, (error, _) => {
            if (error) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            res.status(200).json({ message: "Access granted" });
        });
    });

    const server = app.listen(port, host, () => {
        console.log(`Server running at http://${host}:${port}/`);
    });

    return server;
}

module.exports = {
    logMeIn,
};
