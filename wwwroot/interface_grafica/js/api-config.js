(function () {
    const API_REMOTA = "https://desktop.tail9c6db9.ts.net";

    const protocoloNativo = window.location.protocol === "capacitor:";
    const origemNativa = window.location.hostname === "localhost"
        && window.location.port !== "5050";

    const estaNoAplicativo = protocoloNativo || origemNativa;

    window.API_BASE_URL = estaNoAplicativo ? API_REMOTA : "";

    window.apiUrl = function (rota) {
        const caminho = String(rota).replace(/^\/+/, "");
        return window.API_BASE_URL
            ? window.API_BASE_URL + "/" + caminho
            : "/" + caminho;
    };
})();
