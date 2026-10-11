// Gerenciar página de checkout
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se o usuário está logado
    if (!auth.estaLogado()) {
        window.location.href = 'tela-login.html?returnUrl=' + encodeURIComponent('checkout.html');
        return;
    }

    renderizarItensCheckout();
    configurarFormCheckout();
});

function renderizarItensCheckout() {
    const carrinho = carrinhoManager.obterCarrinho();
    const listaItems = document.getElementById('checkout-items-list');

    if (!listaItems) return;

    if (carrinho.length === 0) {
        listaItems.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Seu carrinho está vazio. <a href="produtos.html">Voltar às compras</a></p>';
        return;
    }

    listaItems.innerHTML = '';

    let total = 0;

    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;

        const itemHtml = `
            <div class="checkout-item">
                <div class="checkout-item-imagem">
                    <img src="img/${encodeURIComponent(item.nome_imagem)}"
                         alt="${item.nome}"
                         onerror="this.src='img/placeholder.png'">
                </div>
                <div class="checkout-item-info">
                    <h3 class="checkout-item-nome">${item.nome}</h3>
                    <div class="checkout-item-detalhes">
                        <span>${item.quantidade}x R$ ${item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div class="checkout-item-preco">
                    R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div>
        `;

        listaItems.innerHTML += itemHtml;
    });

    // Atualizar resumo
    atualizarResumoCheckout(total);
}

function atualizarResumoCheckout(subtotal) {
    const frete = 0; // Frete grátis
    const total = subtotal + frete;

    const resumoSubtotal = document.getElementById('resumo-subtotal');
    const resumoFrete = document.getElementById('resumo-frete');
    const resumoTotal = document.getElementById('resumo-total');

    if (resumoSubtotal) {
        resumoSubtotal.textContent = `R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (resumoFrete) {
        resumoFrete.textContent = 'Grátis';
    }

    if (resumoTotal) {
        resumoTotal.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

function configurarFormCheckout() {
    const form = document.getElementById('form-checkout');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validar formulário
        const endereco = document.getElementById('endereco').value.trim();
        const cidade = document.getElementById('cidade').value.trim();
        const estado = document.getElementById('estado').value.trim();
        const cep = document.getElementById('cep').value.trim();
        const metodoPagamento = document.querySelector('input[name="metodo-pagamento"]:checked')?.value;

        if (!endereco || !cidade || !estado || !cep) {
            alert('Por favor, preencha todos os campos de endereço.');
            return;
        }

        if (!metodoPagamento) {
            alert('Selecione um método de pagamento.');
            return;
        }

        // Criar pedidos para cada item do carrinho
        const carrinho = carrinhoManager.obterCarrinho();
        const usuario = auth.obterUsuario();

        const enderecoCompleto = `${endereco}, ${cidade}, ${estado} ${cep}`;

        try {
            const btn = document.querySelector('.btn-finalizar-compra');
            btn.disabled = true;
            btn.textContent = 'Processando...';

            // Criar pedidos para cada produto
            const pedidos = [];
            for (const item of carrinho) {
                const pedido = {
                    id_usuario: usuario.id_usuario,
                    id_produto: item.id_produto,
                    quantidade: item.quantidade,
                    total_pago: Number((item.preco * item.quantidade).toFixed(2)),
                    metodo_pagamento: metodoPagamento,
                    parcelas: 1,
                    endereco_entrega: enderecoCompleto
                };

                const resposta = await fetch(window.apiUrl('/api/pedidos'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(pedido)
                });

                const dataResposta = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(dataResposta?.mensagem || 'Erro ao processar pedido');
                }

                pedidos.push(dataResposta);
            }

            // Limpar carrinho após sucesso
            carrinhoManager.limparCarrinho();

            alert('Compra realizada com sucesso!');

            // Redirecionar para pedidos
            if (pedidos.length > 0) {
                window.location.href = `pedidos.html?id=${pedidos[0].id_pedido}`;
            } else {
                window.location.href = 'pedidos.html';
            }

        } catch (erro) {
            console.error('Erro ao processar checkout:', erro);
            alert(erro.message || 'Erro ao processar a compra. Tente novamente.');

            const btn = document.querySelector('.btn-finalizar-compra');
            btn.disabled = false;
            btn.textContent = 'Finalizar Compra';
        }
    });
}
