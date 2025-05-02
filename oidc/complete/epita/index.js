// Définition de la variable globale END_SESSION_URL
window.END_SESSION_URL = "https://cri.epita.fr/end-session";

// Fonction pour extraire le code d'autorisation de l'URL
function getAuthorizationCode() {
    const urlParams = new URLSearchParams(window.location.search);

    return urlParams.get("code");
}

// Fonction pour décoder le JWT
function decodeJWT(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    return JSON.parse(atob(base64));
}

// Gestion du clic sur le bouton Request Infos
document.getElementById("RequestBtn").addEventListener("click", async () => {
    const code = getAuthorizationCode();

    if (!code) {
        console.error("No authorization code found");
        return;
    }

    try {
        const formData = new FormData();

        formData.append("client_id", "assistants-atelier-js");
        formData.append(
            "redirect_uri",
            "http://localhost:8080/complete/epita/",
        );
        formData.append("grant_type", "authorization_code");
        formData.append("code", code);

        const response = await fetch("/auth-api", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const idToken = data.id_token;
        const userInfo = decodeJWT(idToken);

        // Affichage des informations utilisateur
        document.getElementById("name").textContent = userInfo.name;
        document.getElementById("campus").textContent = userInfo.zoneinfo;
        document.getElementById("grad-year").textContent =
            userInfo.graduation_years;

        // Gestion de l'image
        const imageUrl = userInfo.picture_square.replace(
            "/photos/square/",
            "/photos/medium/",
        );

        document.getElementById("image").src = imageUrl;

        // Gestion des groupes
        const listElement = document.getElementById("list");

        listElement.innerHTML = ""; // Vide la liste

        if (userInfo.groups && Array.isArray(userInfo.groups)) {
            userInfo.groups.forEach((group) => {
                const li = document.createElement("li");

                li.textContent = `${group.slug} ${group.name}`;
                listElement.appendChild(li);
            });
        }
    } catch (error) {
        console.error("Error fetching user info:", error);
    }
});

// Gestion du clic sur le bouton End Session
document.getElementById("EndBtn").addEventListener("click", () => {
    window.location.href = END_SESSION_URL;
});
