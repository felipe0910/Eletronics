document.addEventListener("DOMContentLoaded", () => {
  carregarProdutosDaTabela();

  const searchForm = document.querySelector('.search-form');
  const searchInput = document.getElementById('search-input');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const term = searchInput.value.trim();
      const dest = 'produtos.html' + (term ? `?q=${encodeURIComponent(term)}` : '');
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
        const resposta = await fetch(window.apiUrl(rota));
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

        const mensagemVazia = document.querySelector('.produtos-grid__empty');
        if (listaProdutos.length === 0) {
            if (mensagemVazia) {
                mensagemVazia.style.display = 'block';
            }
            if (grid) {
                grid.style.display = 'none';
            }
            return;
        }

        if (mensagemVazia) {
            mensagemVazia.style.display = 'none';
        }
        if (grid) {
            grid.style.display = 'grid';
        }

        listaProdutos.forEach(produto => {
            grid.innerHTML += `
              <article class="produto-card" role="listitem" data-id="${produto.id_produto}">
                <button class="produto-fav" aria-label="Adicionar aos favoritos"></button>
                <figure class="produto-figure">
                  <img src="img/${encodeURIComponent(produto.nome_imagem)}" alt="${produto.nome}" class="produto-img" />
                </figure>
                <div class="produto-info">
                  <h3 class="produto-titulo">${produto.nome}</h3>
                  <p class="produto-preco">R$ ${produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div class="produto-actions">
                  <button class="produto-botao btn-adicionar-carrinho" data-produto='${JSON.stringify({
                    id_produto: produto.id_produto,
                    nome: produto.nome,
                    preco: produto.preco,
                    nome_imagem: produto.nome_imagem
                  })}'>
                    🛒 Adicionar ao Carrinho
                  </button>
                  <a class="produto-botao btn-comprar" href="compras.html?id=${produto.id_produto}">
                     Comprar Agora
                  </a>
                </div>
              </article>
            `;
        });

        // Configurar event listeners dos botões
        configurarBotoesCarrinho();

        console.log("🚀 Front-end atualizado com os dados reais do SQL Server!");

    } catch (erro) {
        console.error("Erro ao carregar dados no JavaScript:", erro);
    }
}

// Configurar botões de adicionar ao carrinho
function configurarBotoesCarrinho() {
    const botoesAdicionar = document.querySelectorAll('.btn-adicionar-carrinho');
    
    botoesAdicionar.forEach(botao => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            
            try {
                const produtoData = JSON.parse(botao.dataset.produto);
                carrinhoManager.adicionarAoCarrinho(produtoData, 1);
                
                // Mostrar feedback visual
                mostrarNotificacaoAdicao(botao, produtoData.nome);
                
                // Atualizar contador no header
                atualizarContadorCarrinho();
            } catch (erro) {
                console.error('Erro ao adicionar ao carrinho:', erro);
                alert('Erro ao adicionar produto ao carrinho');
            }
        });
    });
}

// Mostrar notificação quando produto é adicionado
function mostrarNotificacaoAdicao(botao, nomeProduto) {
    const textoOriginal = botao.innerHTML;
    botao.innerHTML = '✓ Adicionado!';
    botao.style.background = '#2bb9c0';
    botao.style.color = 'white';
    
    setTimeout(() => {
        botao.innerHTML = textoOriginal;
        botao.style.background = '';
        botao.style.color = '';
    }, 2000);
}
