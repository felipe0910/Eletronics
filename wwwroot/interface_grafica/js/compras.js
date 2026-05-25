document.addEventListener("DOMContentLoaded", () => {
    carregarDetalhesDoProduto();
});

let produtoSelecionado = null;

async function carregarDetalhesDoProduto() {
    const urlParams = new URLSearchParams(window.location.search);
    const idProduto = urlParams.get('id');

    if (!idProduto) {
        console.error("Nenhum ID de produto foi encontrado na URL.");
        return;
    }

    try {
        const resposta = await fetch(`/api/produtos/${idProduto}`);
        if (!resposta.ok) throw new Error("Produto não encontrado no banco.");
        
        produtoSelecionado = await resposta.json();

        // Mapeia os elementos do HTML usando as classes corretas
        const titulo = document.querySelector(".comprar__titulo"); 
        const preco = document.querySelector(".comprar__preco");
        const descricao = document.querySelector(".comprar__descricao-texto");
        const imagem = document.querySelector(".comprar__imagem img");

        if (titulo) titulo.textContent = produtoSelecionado.nome;
        if (preco) preco.textContent = `R$ ${produtoSelecionado.preco.toFixed(2)}`;
        if (descricao) descricao.textContent = produtoSelecionado.descricao_comercial;
        
        if (imagem) {
            imagem.src = `img/${produtoSelecionado.nome_imagem}`;
            imagem.alt = produtoSelecionado.nome;
        }

        console.log(`🚀 Dados do produto ${idProduto} renderizados com sucesso!`);

        configurarBotaoComprar(idProduto);

    } catch (erro) {
        console.error("Erro ao alimentar a página de compras:", erro);
    }
}

function configurarBotaoComprar(idProduto) {
    const botao = document.querySelector(".comprar__botao");
    if (!botao) return;

    botao.addEventListener("click", async (evento) => {
        evento.preventDefault();

        const enderecoInput = document.querySelector("#txt-endereco");
        const metodoSelecionado = document.querySelector('input[name="metodo-pagamento"]:checked');

        const endereco = enderecoInput?.value.trim();
        const metodo = metodoSelecionado?.value;

        if (!endereco) {
            alert("Informe o endereço de entrega antes de finalizar a compra.");
            enderecoInput?.focus();
            return;
        }

        if (!metodo) {
            alert("Selecione um método de pagamento.");
            return;
        }

        if (!produtoSelecionado) {
            alert("Erro interno: produto não carregado.");
            return;
        }

        const pedido = {
            id_produto: Number(idProduto),
            quantidade: 1,
            total_pago: produtoSelecionado.preco,
            metodo_pagamento: metodo,
            parcelas: 1,
            endereco_entrega: endereco
        };

        try {
            const resposta = await fetch('/api/pedidos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pedido)
            });

            if (!resposta.ok) {
                const erro = await resposta.json();
                throw new Error(erro?.mensagem ?? 'Falha ao registrar o pedido.');
            }

            const dados = await resposta.json();
            localStorage.setItem('ultimoPedidoId', dados.id_pedido);

            alert('Pedido registrado com sucesso!');
            window.location.href = '/interface_grafica/pedidos.html?id=' + dados.id_pedido;
        } catch (erro) {
            console.error('Erro ao enviar o pedido:', erro);
            alert('Não foi possível finalizar a compra. Tente novamente.');
        }
    });
}