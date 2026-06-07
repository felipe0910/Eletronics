// Gerenciar a página do carrinho
document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrinho();
    configurarEventos();
});

function renderizarCarrinho() {
    const carrinho = carrinhoManager.obterCarrinho();
    const carrinhoLista = document.getElementById('carrinho-lista');
    const carrinhoVazio = document.getElementById('carrinho-vazio');
    const contadorCarrinho = document.getElementById('carrinho-contador');

    if (!carrinhoLista || !carrinhoVazio) return;

    // Limpar lista anterior
    carrinhoLista.innerHTML = '';

    if (carrinho.length === 0) {
        carrinhoLista.style.display = 'none';
        carrinhoVazio.style.display = 'block';
        contadorCarrinho.textContent = '0 itens';
        atualizarResumo();
        return;
    }

    carrinhoLista.style.display = 'flex';
    carrinhoVazio.style.display = 'none';

    // Renderizar cada item
    carrinho.forEach(item => {
        const subTotal = (item.preco * item.quantidade).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const itemHtml = `
            <div class="carrinho-item" data-id="${item.id_produto}">
                <div class="item-imagem">
                    <img src="/interface_grafica/img/${encodeURIComponent(item.nome_imagem)}" 
                         alt="${item.nome}" 
                         onerror="this.src='/interface_grafica/img/placeholder.png'">
                </div>
                <div class="item-detalhes">
                    <h3 class="item-nome">${item.nome}</h3>
                    <div class="item-preco">R$ ${item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div class="item-controles">
                    <div class="item-quantidade">
                        <button class="btn-qty btn-diminuir" data-id="${item.id_produto}">−</button>
                        <div class="quantidade-num">${item.quantidade}</div>
                        <button class="btn-qty btn-aumentar" data-id="${item.id_produto}">+</button>
                    </div>
                    <div class="subtotal-item">R$ ${subTotal}</div>
                    <button class="btn-remove" data-id="${item.id_produto}" aria-label="Remover item">×</button>
                </div>
            </div>
        `;

        carrinhoLista.innerHTML += itemHtml;
    });

    // Atualizar contador
    const totalItens = carrinhoManager.obterTotalItens();
    contadorCarrinho.textContent = `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`;

    // Atualizar resumo
    atualizarResumo();

    // Configurar eventos dos botões
    configurarEventosItens();
}

function configurarEventosItens() {
    // Botões de aumentar/diminuir
    document.querySelectorAll('.btn-aumentar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const item = carrinhoManager.obterItem(id);
            if (item) {
                carrinhoManager.atualizarQuantidade(id, item.quantidade + 1);
                renderizarCarrinho();
            }
        });
    });

    document.querySelectorAll('.btn-diminuir').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const item = carrinhoManager.obterItem(id);
            if (item && item.quantidade > 1) {
                carrinhoManager.atualizarQuantidade(id, item.quantidade - 1);
                renderizarCarrinho();
            }
        });
    });

    // Botões de remover (apenas o '×')
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const item = carrinhoManager.obterItem(id);
            if (item) {
                mostrarModalConfirmacao(id, item.nome);
            }
        });
    });
}

function mostrarModalConfirmacao(id, nomeProduto) {
    const modal = document.getElementById('modal-confirmar');
    const mensagem = document.getElementById('modal-mensagem');
    const btnConfirmar = document.getElementById('btn-confirmar-remove');
    const btnCancelar = document.getElementById('btn-cancelar-remove');

    if (!modal) return;

    mensagem.textContent = `Você tem certeza que deseja remover "${nomeProduto}" do carrinho?`;
    modal.style.display = 'flex';

    // Limpar event listeners anteriores
    const novaConfirmar = btnConfirmar.cloneNode(true);
    const novaCancelar = btnCancelar.cloneNode(true);
    btnConfirmar.parentElement.replaceChild(novaConfirmar, btnConfirmar);
    btnCancelar.parentElement.replaceChild(novaCancelar, btnCancelar);

    // Configurar novos event listeners
    novaConfirmar.addEventListener('click', () => {
        carrinhoManager.removerDoCarrinho(id);
        renderizarCarrinho();
        modal.style.display = 'none';
    });

    novaCancelar.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function atualizarResumo() {
    const subtotal = carrinhoManager.obterTotalPreco();
    const frete = 0; // Frete grátis
    const total = subtotal + frete;

    const resumoSubtotal = document.getElementById('resumo-subtotal');
    const resumoFrete = document.getElementById('resumo-frete');
    const resumoTotal = document.getElementById('resumo-total');

    if (resumoSubtotal) {
        resumoSubtotal.textContent = `R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (resumoFrete) {
        resumoFrete.textContent = frete === 0 ? 'Grátis' : `R$ ${frete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (resumoTotal) {
        resumoTotal.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Preencher lista resumida de produtos
    const resumoLista = document.getElementById('resumo-lista');
    if (resumoLista) {
        resumoLista.innerHTML = '';
        carrinhoManager.obterCarrinho().forEach(item => {
            const linha = document.createElement('div');
            linha.className = 'linha-resumo';
            const nome = document.createElement('div');
            nome.className = 'linha-nome';
            nome.textContent = item.nome;
            const preco = document.createElement('div');
            preco.className = 'linha-preco';
            preco.textContent = `R$ ${ (item.preco * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }`;
            linha.appendChild(nome);
            linha.appendChild(preco);
            resumoLista.appendChild(linha);
        });
    }
}

function configurarEventos() {
    // Botão de checkout
    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            const carrinho = carrinhoManager.obterCarrinho();
            if (carrinho.length === 0) {
                alert('Seu carrinho está vazio!');
                return;
            }

            // Redirecionar para checkout
            window.location.href = '/interface_grafica/checkout.html';
        });
    }

    // Botão de limpar carrinho
    const btnLimpar = document.getElementById('btn-limpar-carrinho');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
                carrinhoManager.limparCarrinho();
                renderizarCarrinho();
            }
        });
    }
}

// Listener para atualizar carrinho quando for modificado em outra aba
window.addEventListener('storage', (event) => {
    if (event.key === 'carrinhoEletronics') {
        renderizarCarrinho();
    }
});

// Listener para carrinho atualizado localmente
document.addEventListener('carrinhoAtualizado', () => {
    renderizarCarrinho();
});
