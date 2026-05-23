document.addEventListener("DOMContentLoaded", () => {
    carregarDetalhesDoProduto();
});

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
        
        const produto = await resposta.json();

        // Mapeia os elementos do HTML usando as classes corretas
        const titulo = document.querySelector(".comprar__titulo"); 
        const preco = document.querySelector(".comprar__preco");
        const descricao = document.querySelector(".comprar__descricao-texto");
        const imagem = document.querySelector(".comprar__imagem img");

        if (titulo) titulo.textContent = produto.nome;
        if (preco) preco.textContent = `R$ ${produto.preco.toFixed(2)}`;
        if (descricao) descricao.textContent = produto.descricao_comercial;
        
        if (imagem) {
            imagem.src = `img/${produto.nome_imagem}`;
            imagem.alt = produto.nome;
        }

        console.log(`🚀 Dados do produto ${idProduto} renderizados com sucesso!`);

    } catch (erro) {
        console.error("Erro ao alimentar a página de compras:", erro);
    }
}