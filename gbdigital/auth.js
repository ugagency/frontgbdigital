// auth.js - Gerenciamento de Autenticação Supabase
const SUPABASE_URL = 'https://agzknkebggfytlqcsuuu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemtua2ViZ2dmeXRscWNzdXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDMzODUsImV4cCI6MjA4NjM3OTM4NX0.c2pFotvELY6ZopuQSMlzqUwluKc0HenIAvWuZVclQz0';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos da UI de Auth
const authOverlay = document.getElementById('authOverlay');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const headerAuthMenu = document.getElementById('headerAuthMenu');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const authError = document.getElementById('authError');
const authSuccess = document.getElementById('authSuccess');
const authSuccessBtn = document.getElementById('authSuccessBtn');

let isLoginMode = true;
let isAnonymous = true; // Default to anonymous

// --- FUNÇÕES DE AUTH ---

async function handleAuth(e) {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;

    authError.classList.add('hidden');
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = isLoginMode ? 'Acessando...' : 'Criando conta...';

    try {
        if (isLoginMode) {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            authOverlay.classList.add('hidden');
        } else {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
            });
            if (error) throw error;

            authForm.classList.add('hidden');
            authSuccess.classList.remove('hidden');
        }
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isLoginMode ? 'Acessar Sistema' : 'Criar Conta';
    }
}

async function logout() {
    isAnonymous = true;
    await supabaseClient.auth.signOut();
    window.location.reload();
}

function openAuthModal(mode = 'login') {
    isLoginMode = mode === 'login';
    authForm.classList.remove('hidden');
    authSuccess.classList.add('hidden');

    authSubmitBtn.textContent = isLoginMode ? 'Acessar Sistema' : 'Criar Conta';
    toggleAuthMode.textContent = isLoginMode
        ? 'Não tem uma conta? Criar conta'
        : 'Já tem uma conta? Entrar';

    authOverlay.classList.remove('hidden');
    authOverlay.classList.add('flex');
}

// --- CONTROLE DE ESTADO ---

function updateAuthState(session) {
    const authElements = document.querySelectorAll('.auth-only');

    if (session) {
        isAnonymous = false;
        authOverlay.classList.add('hidden');
        headerAuthMenu.innerHTML = `
            <button onclick="openAvatarManager()" class="text-[10px] uppercase font-bold tracking-wider text-secondary hover:underline transition-colors mr-2">
                👤 Meus Bonecos
            </button>
            <button onclick="openCloset()" class="text-[10px] uppercase font-bold tracking-wider text-secondary hover:underline transition-colors mr-2">
                🏠 Meu Closet
            </button>
            <button onclick="openHistory()" class="text-[10px] uppercase font-bold tracking-wider text-secondary hover:underline transition-colors mr-2">
                📜 Histórico
            </button>
            <button onclick="logout()" class="text-[10px] uppercase tracking-wider text-muted hover:text-secondary transition-colors">
                Sair
            </button>
        `;
        // Mostrar elementos apenas para logados (como as Tabs)
        authElements.forEach(el => {
            el.classList.remove('hidden');
            if (el.tagName === 'DIV' && el.classList.contains('auth-only')) el.classList.add('flex');
        });
    } else {
        isAnonymous = true;
        headerAuthMenu.innerHTML = `
            <button onclick="openAuthModal('login')" class="text-[10px] uppercase tracking-wider text-muted hover:text-primary transition-colors">
                Entrar
            </button>
            <button onclick="openAuthModal('signup')" class="text-[10px] uppercase tracking-wider text-secondary hover:underline transition-colors font-bold">
                Criar Conta
            </button>
        `;
        // Esconder elementos exclusivos para logados
        authElements.forEach(el => {
            el.classList.add('hidden');
            if (el.tagName === 'DIV' && el.classList.contains('auth-only')) el.classList.remove('flex');
        });
    }
    // Notify script.js
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { isAnonymous, session } }));
}

// --- EVENT LISTENERS ---

authForm.addEventListener('submit', handleAuth);

closeAuthBtn.addEventListener('click', () => {
    authOverlay.classList.add('hidden');
});

toggleAuthMode.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authSubmitBtn.textContent = isLoginMode ? 'Acessar Sistema' : 'Criar Conta';
    toggleAuthMode.textContent = isLoginMode
        ? 'Não tem uma conta? Criar conta'
        : 'Já tem uma conta? Entrar';
});

authSuccessBtn.addEventListener('click', () => {
    isLoginMode = true;
    authForm.classList.remove('hidden');
    authSuccess.classList.add('hidden');
    toggleAuthMode.click();
});

supabaseClient.auth.onAuthStateChange((event, session) => {
    updateAuthState(session);
});

(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    updateAuthState(session);
})();

// Expõe globalmente
window.logout = logout;
window.openAuthModal = openAuthModal;
window.getAuthState = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return { isAnonymous, session };
};
window.supabaseClient = supabaseClient; // Para que o script.js possa usar
