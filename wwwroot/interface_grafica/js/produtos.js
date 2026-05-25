document.addEventListener("DOMContentLoaded", () => {
  carregarProdutosDaTabela();

  const searchForm = document.querySelector('.search-form');
  const searchInput = document.getElementById('search-input');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const term = searchInput.value.trim();
      const dest = '/interface_grafica/produtos.html' + (term ? `?q=${encodeURIComponent(term)}` : '');
      window.location.href = dest;
    });
  }
});

async function carregarProdutosDaTabela() {
    const grid = document.querySelector(".produtos-grid");
    if (!grid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('categoria');
    const q = urlParams.get('q');
    const pageTitle = document.querySelector('.produtos-title');
    const searchInput = document.getElementById('search-input');
    if (searchInput && q) searchInput.value = q;

    const params = [];
    if (categoria) params.push(`categoria=${encodeURIComponent(categoria)}`);
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    const rota = '/api/produtos' + (params.length ? ('?' + params.join('&')) : '');

    try {
        const resposta = await fetch(rota);
        const listaProdutos = await resposta.json();

        grid.innerHTML = "";

        const contador = document.querySelector(".selecionados strong");
        if (contador) contador.textContent = listaProdutos.length;

        const categoriaLabels = {
          computadores: 'Computadores',
          notebooks: 'Notebooks',
          smartphones: 'Smartphones',
          fones: 'Fones'
        };

        let categoriaNome;
        if (q) {
          categoriaNome = `Resultados para: "${q}"`;
        } else {
          categoriaNome = categoria ? (categoriaLabels[categoria.toLowerCase()] || categoria.charAt(0).toUpperCase() + categoria.slice(1)) : 'Todos os produtos';
        }
        if (pageTitle) pageTitle.textContent = categoriaNome;

        listaProdutos.forEach(produto => {
            grid.innerHTML += `
              <article class="produto-card" role="listitem">
                <button class="produto-fav" aria-label="Adicionar aos favoritos"></button>
                <figure class="produto-figure">
                  <img src="img/${produto.nome_imagem}" alt="${produto.nome}" class="produto-img" />
                </figure>
                <div class="produto-info">
                  <h3 class="produto-titulo">${produto.nome}</h3>
                  <p class="produto-preco">R$ ${produto.preco.toFixed(2)}</p>
                </div>
                <div class="produto-actions">
                  <a class="produto-botao" href="compras.html?id=${produto.id_produto}">Comprar</a>
                </div>
              </article>
            `;
        });

        console.log("🚀 Front-end atualizado com os dados reais do SQL Server!");

    } catch (erro) {
        console.error("Erro ao carregar dados no JavaScript:", erro);
    }
}