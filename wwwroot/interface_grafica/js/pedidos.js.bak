document.addEventListener("DOMContentLoaded", () => {
    // Verificar se usuário está logado
    if (!auth.estaLogado()) {
        window.location.href = '/interface_grafica/tela-login.html?returnUrl=' + encodeURIComponent(window.location.pathname);
        return;
    }

    carregarPedidos();
});

async function carregarPedidos() {
    const pedidosLista = document.querySelector(".pedidos-lista");
    const mensagemVazia = document.querySelector(".nenhum-pedido");
    const query = new URLSearchParams(window.location.search);
    const idPedidoRecente = Number(query.get('id'));

    if (!pedidosLista || !mensagemVazia) return;

    try {
      // Garantir que o objeto `auth` esteja disponível (carregado pelo auth.js)
      if (typeof auth === 'undefined') {
        throw new Error('Módulo de autenticação indisponível');
      }

      const usuario = auth.obterUsuario();
      if (!usuario || !usuario.id_usuario) {
        throw new Error('Usuário não autenticado');
      }

      const resposta = await fetch(`/api/pedidos?id_usuario=${usuario.id_usuario}`);
      if (!resposta.ok) {
        throw new Error(`Erro na requisição: ${resposta.status}`);
      }

      const pedidos = await resposta.json();

      if (!Array.isArray(pedidos) || pedidos.length === 0) {
        mensagemVazia.style.display = 'block';
        pedidosLista.innerHTML = '';
        return;
      }

      // Se algum pedido não trouxer imagem do produto, buscar pelo produto para tentar preencher
      await Promise.all(pedidos.map(async (pedido) => {
        if (!pedido.produto_imagem && pedido.id_produto) {
          try {
            const produtoResp = await fetch(`/api/produtos/${pedido.id_produto}`);
            if (produtoResp.ok) {
              const produtoDados = await produtoResp.json();
              pedido.produto_imagem = produtoDados?.nome_imagem ?? null;
            }
          } catch (fetchErro) {
            console.warn('Não foi possível buscar imagem do produto para pedido', pedido.id_pedido, fetchErro);
          }
        }
      }));

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
    const imagemProduto = pedido.produto_imagem
        ? `/interface_grafica/img/${encodeURIComponent(pedido.produto_imagem)}`
        : '/interface_grafica/img/pc.png';

    const mediaHtml = `<img src="${imagemProduto}" alt="Imagem do ${pedido.produto_nome}" onerror="this.onerror=null; this.src='/interface_grafica/img/pc.png'" />`;

    return `
      <article class="pedido-card ${destaque ? 'pedido-card--recente' : ''}">
        <div class="pedido-card__media">
          ${mediaHtml}
        </div>

        <div class="pedido-card__content">
          <header class="pedido-card__header">
            <div>
              <strong>Pedido #${pedido.id_pedido}</strong>
              <span class="pedido-card__date"><i class="bi bi-calendar3"></i> ${dataFormatada}</span>
            </div>
          </header>

          <div class="pedido-card__body">
            <div class="pedido-card__item">
              <span><i class="bi bi-box-seam pedido-card__icon"></i> Produto</span>
              <strong>${pedido.produto_nome ?? 'Produto desconhecido'}</strong>
            </div>
            <div class="pedido-card__item">
              <span><i class="bi bi-basket pedido-card__icon"></i> Quantidade</span>
              <strong>${pedido.quantidade} un.</strong>
            </div>
            <div class="pedido-card__item">
              <span><i class="bi bi-currency-dollar pedido-card__icon"></i> Valor total</span>
              <strong>R$ ${Number(pedido.total_pago).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div class="pedido-card__item">
              <span><i class="bi bi-credit-card-2-front pedido-card__icon"></i> Pagamento</span>
              <strong>${pedido.metodo_pagamento.toUpperCase()} (${pedido.parcelas}x)</strong>
            </div>
            <div class="pedido-card__item pedido-card__item--full">
              <span><i class="bi bi-geo-alt pedido-card__icon"></i> Entrega</span>
              <strong>${pedido.endereco_entrega}</strong>
            </div>
          </div>

          <div class="pedido-card__footer">
            <span class="pedido-card__status">Pedido recebido</span>
            <span>${previsao}</span>
            ${destaque ? '<span class="pedido-card__tag">Pedido recente</span>' : ''}
          </div>
        </div>
      </article>
    `;
}