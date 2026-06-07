// Sistema de gerenciamento de carrinho baseado em localStorage
// Persiste os itens do carrinho entre navegações

class CarrinhoManager {
    constructor() {
        this.carrinhoKey = 'carrinhoEletronics';
        this.carrinho = this.obterCarrinho();
    }

    obterCarrinho() {
        try {
            const data = localStorage.getItem(this.carrinhoKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Erro ao ler carrinho do localStorage', e);
            return [];
        }
    }

    salvarCarrinho() {
        try {
            localStorage.setItem(this.carrinhoKey, JSON.stringify(this.carrinho));
            this.notificarAtualizacao();
        } catch (e) {
            console.error('Erro ao salvar carrinho no localStorage', e);
        }
    }

    // Adicionar produto ao carrinho
    adicionarAoCarrinho(produto, quantidade = 1) {
        const itemExistente = this.carrinho.find(item => item.id_produto === produto.id_produto);
        
        if (itemExistente) {
            // Se o produto já está no carrinho, aumenta a quantidade
            itemExistente.quantidade += quantidade;
        } else {
            // Se não existe, adiciona um novo item
            this.carrinho.push({
                id_produto: produto.id_produto,
                nome: produto.nome,
                preco: produto.preco,
                nome_imagem: produto.nome_imagem,
                quantidade: quantidade
            });
        }
        
        this.salvarCarrinho();
        return true;
    }

    // Remover produto do carrinho
    removerDoCarrinho(id_produto) {
        this.carrinho = this.carrinho.filter(item => item.id_produto !== id_produto);
        this.salvarCarrinho();
        return true;
    }

    // Atualizar quantidade de um produto
    atualizarQuantidade(id_produto, novaQuantidade) {
        if (novaQuantidade <= 0) {
            this.removerDoCarrinho(id_produto);
            return false;
        }
        
        const item = this.carrinho.find(item => item.id_produto === id_produto);
        if (item) {
            item.quantidade = novaQuantidade;
            this.salvarCarrinho();
            return true;
        }
        return false;
    }

    // Limpar carrinho
    limparCarrinho() {
        this.carrinho = [];
        this.salvarCarrinho();
        return true;
    }

    // Obter total de itens
    obterTotalItens() {
        return this.carrinho.reduce((total, item) => total + item.quantidade, 0);
    }

    // Obter total em reais
    obterTotalPreco() {
        return this.carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    }

    // Obter item específico
    obterItem(id_produto) {
        return this.carrinho.find(item => item.id_produto === id_produto);
    }

    // Verificar se produto está no carrinho
    estaNoCarrinho(id_produto) {
        return this.carrinho.some(item => item.id_produto === id_produto);
    }

    // Sistema de observadores para atualizar componentes
    observadores = [];

    adicionarObservador(callback) {
        this.observadores.push(callback);
    }

    notificarAtualizacao() {
        this.observadores.forEach(callback => callback(this.carrinho));
        // Dispara evento customizado
        document.dispatchEvent(new CustomEvent('carrinhoAtualizado', { detail: this.carrinho }));
    }
}

// Instância global
const carrinhoManager = new CarrinhoManager();

// Listener para atualizar header quando o carrinho mudar
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('carrinhoAtualizado', () => {
        atualizarContadorCarrinho();
    });
});
