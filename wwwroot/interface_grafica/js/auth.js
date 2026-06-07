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

    // Sempre manter o carrinho visível
    let html = `
        <a href="/interface_grafica/carrinho.html" aria-label="carrinho de compras" class="icon-carrinho">
            <img src="/interface_grafica/img/carrinho.png" alt="Carrinho" />
            <span class="cart-counter" style="display: none; position: absolute; top: -8px; right: -8px; background: #e74c3c; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">0</span>
        </a>
    `;

    if (auth.estaLogado()) {
        const usuario = auth.obterUsuario();
        html += `
            <div class="user-menu" style="display: flex; align-items: center; gap: 12px;">
                <span class="user-name" style="font-size: 0.9rem; color: #333;">
                    ${usuario.nome}
                </span>
                <button id="btn-logout" class="btn-logout" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 0.9rem; text-decoration: underline;">
                    Sair
                </button>
            </div>
        `;
    } else {
        // Estado padrão: botão de login
        html += `
            <a href="/interface_grafica/tela-login.html" class="button-conta" style="display: flex; align-items: center; justify-content: center;">
                <img src="/interface_grafica/img/user.png" alt="Login" />
            </a>
        `;
    }

    userActions.innerHTML = html;

    // Configurar logout
    const btn = document.getElementById('btn-logout');
    if (btn) {
        btn.addEventListener('click', () => {
            auth.logout();
            alert('Desconectado com sucesso!');
            window.location.href = '/interface_grafica/index.html';
        });
    }

    // Atualizar contador do carrinho
    atualizarContadorCarrinho();
}

function atualizarContadorCarrinho() {
    const carrinho = carrinhoManager.obterCarrinho();
    const contador = document.querySelector('.cart-counter');
    if (contador) {
        const total = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
        contador.textContent = total;
        contador.style.display = total > 0 ? 'flex' : 'none';
    }
}
