// Sistema de autenticação baseado em localStorage
// Gerencia login, logout e exibição de usuário logado

class Auth {
    constructor() {
        this.usuarioKey = 'usuarioLogado';
        this.usuarioLogado = this.obterUsuarioDoStorage();
    }

    obterUsuarioDoStorage() {
        try {
            const data = localStorage.getItem(this.usuarioKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Erro ao ler usuário do localStorage', e);
            return null;
        }
    }

    salvarUsuarioNoStorage(usuario) {
        try {
            localStorage.setItem(this.usuarioKey, JSON.stringify(usuario));
            this.usuarioLogado = usuario;
        } catch (e) {
            console.error('Erro ao salvar usuário no localStorage', e);
        }
    }

    estaLogado() {
        return this.usuarioLogado && this.usuarioLogado.id_usuario > 0;
    }

    obterUsuario() {
        return this.usuarioLogado;
    }

    obterIdUsuario() {
        return this.usuarioLogado?.id_usuario || null;
    }

    logout() {
        try {
            localStorage.removeItem(this.usuarioKey);
            this.usuarioLogado = null;
        } catch (e) {
            console.error('Erro ao fazer logout', e);
        }
    }
}

// Instância global
const auth = new Auth();

// Ao carregar a página, verificar se há usuário logado e atualizar header
document.addEventListener('DOMContentLoaded', () => {
    atualizarHeader();
});

function atualizarHeader() {
    const userActions = document.querySelector('.user-actions');
    if (!userActions) return;

    if (auth.estaLogado()) {
        const usuario = auth.obterUsuario();
        // Não inserir link "Meus Pedidos" aqui para evitar duplicação com o menu de navegação.
        userActions.innerHTML = `
            <div class="user-menu">
                <span class="user-name">
                    <i class="bi bi-person-circle"></i>
                    ${usuario.nome}
                </span>
                <button id="btn-logout" class="btn-logout">
                    <i class="bi bi-box-arrow-right"></i>
                    Sair
                </button>
            </div>
        `;

        const btn = document.getElementById('btn-logout');
        if (btn) {
            btn.addEventListener('click', () => {
                auth.logout();
                alert('Desconectado com sucesso!');
                window.location.href = '/interface_grafica/home.html';
            });
        }
    } else {
        // Estado padrão: botão de login
        userActions.innerHTML = `
            <a href="#" aria-label="carrinho de compras" class="icon-carrinho">
                <img src="img/carrinho.png" alt="" />
            </a>
            <a href="/interface_grafica/tela-login.html" class="button-conta">
                <i class="bi bi-person"></i>
            </a>
        `;
    }
}
