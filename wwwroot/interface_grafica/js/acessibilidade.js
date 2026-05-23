// Este bloco garante que o script só corre quando a página estiver 100% carregada
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Cria dinamicamente a tag de script que liga o teu site ao servidor do Hand Talk
    const scriptHandTalk = document.createElement("script");
    scriptHandTalk.src = "https://plugin.handtalk.me/web/latest/handtalk.min.js";
    scriptHandTalk.async = true;

    // 2. Assim que o script terminar de carregar, ele ativa a Inteligência Artificial
    scriptHandTalk.onload = () => {
        try {
            // Inicializa o avatar com o teu token oficial ativo
            window.ht = new HandTalkAPI({
                token: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" // <-- COLE O SEU TOKEN REAL AQUI DENTRO
            });
            console.log("🤖 Avatar de LIBRAS inicializado com sucesso globalmente!");
        } catch (erro) {
            console.error("Erro ao carregar a IA de LIBRAS:", erro);
        }
    };

    // 3. Adiciona o script ao cabeçalho da página de forma invisível
    document.head.appendChild(scriptHandTalk);
});