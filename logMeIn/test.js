const axios = require("axios");
const { logMeIn } = require("./logMeIn");

// Démarrer le serveur
const server = logMeIn("localhost", 3000);

async function runTests() {
    try {
        // Test GET /
        const res1 = await axios.get("http://localhost:3000/");

        console.log("GET /:", res1.data);

        // Test POST /login (succès)
        const res2 = await axios.post("http://localhost:3000/login", {
            username: "xavier.login",
            password: "1234",
        });

        console.log("POST /login (succès):", res2.data);

        // Test GET /secret avec JWT
        const res3 = await axios.get("http://localhost:3000/secret", {
            headers: { Authorization: `Bearer ${res2.data.jwt}` },
        });

        console.log("GET /secret (succès):", res3.data);

        // Test POST /login (échec)
        try {
            await axios.post("http://localhost:3000/login", {
                username: "fake.user",
                password: "0000",
            });
        } catch (err) {
            console.log("POST /login (échec):", err.response.data);
        }
    } catch (err) {
        console.error("Erreur:", err.message);
    } finally {
        server.close(); // Arrêter le serveur
    }
}

runTests();
