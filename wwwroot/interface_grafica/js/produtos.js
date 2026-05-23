document.addEventListener("DOMContentLoaded", () => {
    carregarProdutosDaTabela();
});

async function carregarProdutosDaTabela() {
    const grid = document.querySelector(".produtos-grid");
    if (!grid) return;

    try {
        // Faz a chamada para a rota que criamos no Program.cs
        const resposta = await fetch('/api/produtos');
        const listaCelulares = await resposta.json();

        // Limpa as repetições estáticas antigas do seu HTML
        grid.innerHTML = "";

        // Atualiza a contagem automática para 9 celulares no topo da tela
        const contador = document.querySelector(".selecionados strong");
        if (contador) contador.textContent = listaCelulares.length;

        // Injeta os cards na tela mantendo seu layout e usando as fotos da sua pasta img/
        listaCelulares.forEach(celular => {
            grid.innerHTML += `
              <article class="produto-card" role="listitem">
                <button class="produto-fav" aria-label="Adicionar aos favoritos"></button>
                <figure class="produto-figure">
                  <img src="img/${celular.nome_imagem}" alt="${celular.nome}" class="produto-img" />
                </figure>
                <div class="produto-info">
                  <h3 class="produto-titulo">${celular.nome}</h3>
                  <p class="produto-preco">R$ ${celular.preco.toFixed(2)}</p>
                </div>
                <div class="produto-actions">
                  <a class="produto-botao" href="compras.html?id=${celular.id_produto}">Comprar</a>
                </div>
              </article>
            `;
        });

        console.log("🚀 Front-end atualizado com os dados reais do SQL Server!");

    } catch (erro) {
        console.error("Erro ao carregar dados no JavaScript:", erro);
    }
}