// Définition de la variable globale LOGIN_URL
window.LOGIN_URL = new URL("https://cri.epita.fr/authorize");
LOGIN_URL.searchParams.append("client_id", "assistants-atelier-js");
LOGIN_URL.searchParams.append("scope", "epita profile picture");
LOGIN_URL.searchParams.append(
    "redirect_uri",
    "http://localhost:8080/complete/epita/",
);
LOGIN_URL.searchParams.append("response_type", "code");

// Gestion du clic sur le bouton Sign-In
document.getElementById("redirectBtn").addEventListener("click", () => {
    window.location.href = LOGIN_URL.toString();
});
