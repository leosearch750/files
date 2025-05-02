/* FIXME */

function addToken() {
    /* FIXME */
}

window.addToken = addToken;

/*
function parseJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error("Invalid token format");

        const payload = parts[1];
        const decoded = atob(payload); // decode base64
        return JSON.parse(decoded);
    } catch (e) {
        return null;
    }
}

function displayUserInfo(data) {
    const name = data.name || "No name";
    const email = data.email || "No email";
    const age = data.age !== undefined ? data.age : "No age";

    document.getElementById("name").innerHTML = name;
    document.getElementById("email").innerHTML = email;
    document.getElementById("age").innerHTML = age;

    document.getElementById("userInfo").style.display = "block";
    document.getElementById("error").innerHTML = "";
}

function addToken() {
    const input = document.getElementById("inputJWT").value.trim();
    const data = parseJWT(input);

    if (data && typeof data === "object") {
        localStorage.setItem("jwtToken", input);
        displayUserInfo(data);
    } else {
        document.getElementById("error").innerHTML = "Invalid token";
        document.getElementById("userInfo").style.display = "none";
    }
}

window.onload = () => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
        const data = parseJWT(token);
        if (data) {
            displayUserInfo(data);
        }
    }
};

*/

/*
function addToken() {
    const inputJWT = document.getElementById('inputJWT').value;
    const errorDiv = document.getElementById('error');
    const userInfoDiv = document.getElementById('userInfo');

    // Reset l'affichage
    errorDiv.textContent = '';
    userInfoDiv.style.display = 'none';

    try {
        // Vérification basique du format JWT (3 parties séparées par des points)
        const parts = inputJWT.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        // Décodage du payload (partie 2 du JWT)
        const payload = JSON.parse(atob(parts[1]));

        // Stockage dans le localStorage
        localStorage.setItem('userToken', inputJWT);

        // Affichage des informations utilisateur
        displayUserInfo(payload);
    } catch (error) {
        // Gestion des erreurs
        errorDiv.innerHTML = 'Invalid token';
        userInfoDiv.style.display = 'none';
    }
}

function displayUserInfo(payload) {
    const userInfoDiv = document.getElementById('userInfo');
    const nameSpan = document.getElementById('name');
    const emailSpan = document.getElementById('email');
    const ageSpan = document.getElementById('age');

    // Affichage des informations (avec gestion des champs manquants)
    nameSpan.innerHTML = payload.name || 'No name';
    emailSpan.innerHTML = payload.email || 'No email';
    ageSpan.innerHTML = payload.age !== undefined ? payload.age : 'No age';

    // Afficher la div userInfo
    userInfoDiv.style.display = 'block';
}

// Au chargement de la page, vérifier si un token existe déjà
window.onload = function() {
    const storedToken = localStorage.getItem('userToken');
    if (storedToken) {
        try {
            const parts = storedToken.split('.');
            const payload = JSON.parse(atob(parts[1]));
            displayUserInfo(payload);
        } catch (error) {
            // En cas d'erreur, supprimer le token invalide
            localStorage.removeItem('userToken');
        }
    }
};

window.addToken = addToken;
*/
