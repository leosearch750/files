function scriptFailedLoad(src) {
    const container = document.getElementById("order");
    const errorDiv = document.createElement("div");

    errorDiv.id = "errorscript";
    errorDiv.innerHTML = `
    <p><b>Script '${src.split("/").pop()}' does not exist.</b></p>`;
    container.appendChild(errorDiv);
}
