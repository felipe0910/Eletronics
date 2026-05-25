document.addEventListener("DOMContentLoaded", carregarPedidos);

async function carregarPedidos() {
    const pedidosLista = document.querySelector(".pedidos-lista");
    const mensagemVazia = document.querySelector(".nenhum-pedido");
    const query = new URLSearchParams(window.location.search);
    const idPedidoRecente = Number(query.get('id'));

    if (!pedidosLista || !mensagemVazia) return;

    try {
        const resposta = await fetch('/api/pedidos');
        if (!resposta.ok) throw new Error('Não foi possível carregar os pedidos.');

        const pedidos = await resposta.json();

        if (!Array.isArray(pedidos) || pedidos.length === 0) {
            mensagemVazia.style.display = 'block';
            pedidosLista.innerHTML = '';
            return;
        }

        mensagemVazia.style.display = 'none';
        pedidosLista.innerHTML = pedidos.map((pedido) => criarCardPedido(pedido, pedido.id_pedido === idPedidoRecente)).join('');
    } catch (erro) {
        console.error('Erro ao carregar pedidos:', erro);
        mensagemVazia.style.display = 'block';
        pedidosLista.innerHTML = '<p>Erro ao carregar pedidos. Tente novamente mais tarde.</p>';
    }
}

function calcularPrevisaoEntrega(dataCompra) {
    const data = new Date(dataCompra);
    if (isNaN(data.getTime())) return '1 a 2 dias úteis';

    function proximoDiaUtil(d) {
        const novaData = new Date(d);
        novaData.setDate(novaData.getDate() + 1);
        const diaSemana = novaData.getDay();
        if (diaSemana === 0) {
            novaData.setDate(novaData.getDate() + 1);
        } else if (diaSemana === 6) {
            novaData.setDate(novaData.getDate() + 2);
        }
        return novaData;
    }

    const primeiroDia = proximoDiaUtil(data);
    const segundoDia = proximoDiaUtil(primeiroDia);
    const formato = { day: '2-digit', month: '2-digit' };

    return `entre ${primeiroDia.toLocaleDateString('pt-BR', formato)} e ${segundoDia.toLocaleDateString('pt-BR', formato)}`;
}

function criarCardPedido(pedido, destaque) {
    const data = new Date(pedido.data_compra);
    const dataFormatada = isNaN(data.getTime())
        ? pedido.data_compra
        : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    const previsao = calcularPrevisaoEntrega(pedido.data_compra);
    const caixa = destaque ? 'style="border: 2px solid #001338; background: #f4f9ff;"' : 'style="border: 1px solid #ddd;"';

    return `
      <article class="pedido-card" ${caixa}>
        <header class="pedido-card__header">
          <strong>Pedido #${pedido.id_pedido}</strong>
          <span>${dataFormatada}</span>
        </header>
        <div class="pedido-card__body">
          <p><strong>Produto:</strong> ${pedido.produto_nome ?? 'Produto desconhecido'}</p>
          <p><strong>Quantidade:</strong> ${pedido.quantidade}</p>
          <p><strong>Valor total:</strong> R$ ${Number(pedido.total_pago).toFixed(2)}</p>
          <p><strong>Método de pagamento:</strong> ${pedido.metodo_pagamento}</p>
          <p><strong>Parcelas:</strong> ${pedido.parcelas}</p>
          <p><strong>Endereço de entrega:</strong> ${pedido.endereco_entrega}</p>
          <p><strong>Status:</strong> Pedido recebido</p>
          <p><strong>Previsão:</strong> ${previsao}</p>
        </div>
        ${destaque ? '<div class="pedido-card__tag" style="margin-top: 12px; padding: 10px; background:#001338; color:#fff; border-radius:8px; display:inline-block;">Pedido recente</div>' : ''}
      </article>
    `;
}
