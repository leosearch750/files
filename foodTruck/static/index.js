function addFood(name) {
    const container = document.getElementById("order");
    const foodDiv = document.createElement("div");

    foodDiv.classList.add("food");
    foodDiv.innerHTML = `
    <p>${name}</p>
    <button onclick=" order('${name}')">Order</button>`;
    container.appendChild(foodDiv);
}

function logToDisplay(message, type = "info") {
    const displayElement = document.getElementById("display");
    const logMessage = document.createElement("div");

    logMessage.textContent = message;
    logMessage.classList.add("log-message", type);
    displayElement.appendChild(logMessage);

    displayElement.scrollTop = displayElement.scrollHeight;
    setTimeout(() => {
        logMessage.remove();
    }, 5000);
}

console.log = logToDisplay;

function loadMenu() {
    if (document.getElementById("errorscript") === null) {
        Object.keys(recipes).forEach((category) => {
            Object.keys(recipes[category]).forEach((recipeName) => {
                addFood(recipeName);
            });
        });
    }
}

var isDirtyFoodtruck = false;
var pageTitle = document.getElementById("page-title");
var switchButton = document.getElementById("switch-button");

function loadScript(isDirty) {
    var scriptContainer = document.body;
    var currentScripts = [...scriptContainer.querySelectorAll("script")].filter(
        (script) => {
            var name_script = script.src.split("/").pop();

            return /(dirty)?foodtruck\.js/i.test(name_script);
        },
    );

    // currentScripts should return only one value
    scriptToLoad = isDirty ? "dirtyFoodTruck.js" : "foodTruck.js";
    document.body.removeChild(currentScripts[0]);

    const script = document.createElement("script");

    script.src = scriptToLoad;

    script.onerror = () => scriptFailedLoad(scriptToLoad);
    script.onload = () => loadMenu();
    document.body.appendChild(script);
}

switchButton.addEventListener("click", () => {
    isDirtyFoodtruck = !isDirtyFoodtruck;
    pageTitle.textContent = isDirtyFoodtruck ? "Dirty Foodtruck" : "Foodtruck";
    switchButton.querySelector("a").textContent = isDirtyFoodtruck
        ? "Switch to Foodtruck"
        : "Switch to Dirty Foodtruck";
    var orderDiv = document.getElementById("order");

    orderDiv.innerHTML = "";

    loadScript(isDirtyFoodtruck);
});

loadMenu();
