// script.js - Lógica AI Look (Versão Editorial v2.0)
const webhookUrl = 'https://automacoes-n8n.infrassys.com/webhook/gbdigital';
const chatWebhookUrl = 'https://automacoes-n8n.infrassys.com/webhook/webchat';

// Elementos da Interface (Mapeados para o HTML Novo)
const inputMain = document.getElementById('input-main');
const inputRef = document.getElementById('input-ref');
const previewMain = document.getElementById('preview-main');
const previewRef = document.getElementById('preview-ref');

// Elementos Específicos do Novo Design
const placeholderMain = document.getElementById('upload-placeholder-main'); // O bloco de ícone/texto
const iconRef = document.getElementById('icon-ref'); // Ícone pequeno da referência
const scanLine = document.getElementById('scan-main'); // O laser

// Textos e Botões
const fileRefName = document.getElementById('file-ref-name'); // Nome do arquivo APENAS na referência
const removeMain = document.getElementById('remove-main');
const removeRef = document.getElementById('remove-ref');
const generateBtn = document.getElementById('generateBtn');
const resetBtn = document.getElementById('resetBtn');
const promptEl = document.getElementById('prompt');
const loadingOverlay = document.getElementById('loadingOverlay');

// Áreas de Resultado
const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');
const regenerateBtn = document.getElementById('regenerateBtn');

// Estado Global
let fileMain = null;
let fileRef = null;

// --- CONFIGURAÇÃO DE LIMITE ANÔNIMO ---
const ANON_LIMIT = 3;
const counterContainer = document.getElementById('anonymousCounter');
const counterText = document.getElementById('remainingCount');

// --- FUNÇÕES UTILITÁRIAS ---

function updateGenerateState() {
    const modeInput = document.querySelector('input[name="mode"]');
    const mode = modeInput ? modeInput.value : 'generate';
    // Permite gerar se tiver foto principal E foto de referência, OU se o modo for "criar do zero"
    const can = (fileMain !== null && fileRef !== null) || mode === 'from_scratch';

    generateBtn.disabled = !can;

    // Feedback visual no botão
    if (can) {
        generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        generateBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Manipulador de Arquivos Genérico Adaptado
function handleFileSelection(file, type) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Máx 10MB.');
        return;
    }

    const url = URL.createObjectURL(file);

    if (type === 'main') {
        fileMain = file;
        previewMain.src = url;
        previewMain.classList.remove('hidden');

        // Esconde o placeholder (Ícone + Texto "Toque para adicionar")
        if (placeholderMain) placeholderMain.classList.add('hidden');

        // Mostra botão remover
        removeMain.classList.remove('hidden');

        // ATIVA EFEITO LASER (SCAN)
        if (scanLine) {
            scanLine.style.display = 'block';
            // Desliga após 2.5s para simular leitura
            setTimeout(() => {
                scanLine.style.display = 'none';
            }, 2500);
        }
    }
    else if (type === 'ref') {
        fileRef = file;
        previewRef.src = url;
        previewRef.classList.remove('hidden');

        // UI Específica da barra pequena
        if (iconRef) iconRef.classList.add('hidden');
        if (fileRefName) {
            fileRefName.textContent = file.name;
            fileRefName.classList.add('text-primary'); // Destaca o nome
        }
        removeRef.classList.remove('hidden');
    }

    updateGenerateState();
}

// --- EVENT LISTENERS ---

// Input Principal (Foto do Usuário)
inputMain.addEventListener('change', e => handleFileSelection(e.target.files[0], 'main'));

// Input Referência (Roupa)
inputRef.addEventListener('change', e => handleFileSelection(e.target.files[0], 'ref'));

// Botão Remover Principal
removeMain.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita abrir o seletor de arquivos ao clicar em remover
    fileMain = null;
    previewMain.src = '';
    previewMain.classList.add('hidden');

    // Traz de volta o placeholder
    if (placeholderMain) placeholderMain.classList.remove('hidden');

    removeMain.classList.add('hidden');
    inputMain.value = '';

    // Garante que o laser pare
    if (scanLine) scanLine.style.display = 'none';

    updateGenerateState();
});

// Botão Remover Referência
removeRef.addEventListener('click', () => {
    fileRef = null;
    previewRef.src = '';
    previewRef.classList.add('hidden');

    if (iconRef) iconRef.classList.remove('hidden');
    if (fileRefName) {
        fileRefName.textContent = 'Adicionar roupa de referência (Obrigatório)';
        fileRefName.classList.remove('text-primary');
    }

    removeRef.classList.add('hidden');
    inputRef.value = '';
    updateGenerateState();
});

// Listeners dos Radio Buttons (Modos) - REMOVIDO (Agora é input hidden)
// document.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener('change', updateGenerateState));

// Reset Total
resetBtn.addEventListener('click', () => {
    // Simula cliques nos botões de remover para limpar estados
    if (fileMain) removeMain.click();
    if (fileRef) removeRef.click();

    promptEl.value = '';
    // document.querySelector('input[name="mode"][value="generate"]').checked = true; // Desnecessário para hidden
    resultSection.classList.add('hidden');
    updateGenerateState();
});

// --- DRAG & DROP (Corrigido) ---

const dropZoneMain = document.getElementById('dropzone-main');

// Apenas o Dropzone principal tem suporte a Drag&Drop visual agora
if (dropZoneMain) {
    ['dragenter', 'dragover'].forEach(evt => {
        dropZoneMain.addEventListener(evt, e => {
            e.preventDefault();
            e.stopPropagation();
            dropZoneMain.classList.add('border-secondary', 'bg-gray-50'); // Highlight visual
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZoneMain.addEventListener(evt, e => {
            e.preventDefault();
            e.stopPropagation();
            dropZoneMain.classList.remove('border-secondary', 'bg-gray-50');
        });
    });

    dropZoneMain.addEventListener('drop', e => {
        const f = e.dataTransfer.files[0];
        if (f) handleFileSelection(f, 'main');
    });
}

// --- ENVIO (GERAÇÃO) ---

async function sendGenerate() {
    const modeInput = document.querySelector('input[name="mode"]');
    const mode = modeInput ? modeInput.value : 'generate';
    const prompt = promptEl.value || '';

    if ((!fileMain || !fileRef) && mode !== 'from_scratch') {
        alert('Por favor, adicione sua foto base e a roupa de referência.');
        return;
    }

    // Checar Limite Anônimo
    const auth = await window.getAuthState();
    if (auth.isAnonymous) {
        const count = parseInt(localStorage.getItem('anon_gen_count') || '0');
        if (count >= ANON_LIMIT) {
            const limitModal = document.getElementById('limitModal');
            if (limitModal) {
                limitModal.classList.remove('hidden');
                limitModal.classList.add('flex');
            } else {
                alert('Você atingiu o limite de 3 gerações gratuitas. Crie uma conta para continuar usando ilimitadamente!');
                window.location.reload();
            }
            return;
        }
    }

    const fd = new FormData();
    if (fileMain) fd.append('image_base', fileMain, fileMain.name);
    if (fileRef) fd.append('image_reference', fileRef, fileRef.name);
    fd.append('prompt', prompt);
    fd.append('mode', mode);

    try {
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex'); // Garante flexbox para centralizar
        generateBtn.disabled = true;

        const res = await fetch(webhookUrl, {
            method: 'POST',
            body: fd
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error("Erro no servidor: " + res.status);
        }

        const blob = await res.blob();
        if (!blob || blob.size === 0) throw new Error("Imagem vazia retornada.");

        const imageUrl = URL.createObjectURL(blob);

        resultImage.src = imageUrl;
        resultSection.classList.remove('hidden');

        // Scroll suave até o resultado
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

        downloadBtn.href = imageUrl;
        downloadBtn.setAttribute("download", `ai-look-${Date.now()}.png`);

        // Incrementa contador se for anônimo
        const auth = await window.getAuthState();
        if (auth.isAnonymous) {
            let count = parseInt(localStorage.getItem('anon_gen_count') || '0');
            count++;
            localStorage.setItem('anon_gen_count', count.toString());
            updateAnonymousUI();
        }

    } catch (err) {
        console.error(err);
        alert("Ops! Algo deu errado na geração: " + err.message);
    } finally {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.classList.remove('flex');
        generateBtn.disabled = false;
    }
}

generateBtn.addEventListener('click', sendGenerate);
regenerateBtn.addEventListener('click', sendGenerate);


// --- CHAT WIDGET LOGIC (Mantida e Estilizada) ---

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const chatFileInput = document.getElementById('chat-file-input');
const chatImagePreviewContainer = document.getElementById('chat-image-preview-container');
const chatImagePreview = document.getElementById('chat-image-preview');
const removeChatImageBtn = document.getElementById('remove-chat-image');

let chatFile = null;

chatFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        chatFile = file;
        const url = URL.createObjectURL(file);
        chatImagePreview.src = url;
        chatImagePreviewContainer.classList.remove('hidden');
        chatImagePreviewContainer.classList.add('flex');
    }
});

removeChatImageBtn.addEventListener('click', () => {
    chatFile = null;
    chatImagePreview.src = '';
    chatImagePreviewContainer.classList.add('hidden');
    chatFileInput.value = '';
});

function appendMessage(text, isUser = false, imageUrl = null) {
    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`;

    let contentHtml = '';

    if (imageUrl) {
        contentHtml += `<img src="${imageUrl}" class="max-w-[150px] rounded-xl mb-1 border border-secondary/20 block ${isUser ? 'ml-auto' : ''}">`;
    }

    if (text) {
        const bubbleClass = isUser
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none';

        contentHtml += `<div class="${bubbleClass} rounded-2xl py-3 px-4 text-sm shadow-sm max-w-[85%] leading-relaxed">${text}</div>`;
    }

    div.innerHTML = contentHtml;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text && !chatFile) return;

    const currentText = text;
    const currentFile = chatFile;

    // UI Update
    let userImageUrl = null;
    if (currentFile) userImageUrl = URL.createObjectURL(currentFile);

    appendMessage(currentText, true, userImageUrl);

    // Reset Input
    chatInput.value = '';
    chatFile = null;
    chatImagePreviewContainer.classList.add('hidden');
    chatFileInput.value = '';

    // Loading Bubble
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'chat-loading';
    loadingDiv.className = 'flex justify-start';
    loadingDiv.innerHTML = `
        <div class="bg-white border text-gray-800 rounded-tl-none rounded-2xl py-3 px-4 shadow-sm flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const fd = new FormData();
    fd.append('message', currentText);
    if (currentFile) {
        fd.append('image', currentFile, currentFile.name);
        fd.append('has_image', 'true');
    } else {
        fd.append('has_image', 'false');
    }

    try {
        const res = await fetch(chatWebhookUrl, { method: 'POST', body: fd });
        if (!res.ok) throw new Error("Erro");

        const data = await res.json();
        const loadingEl = document.getElementById('chat-loading');
        if (loadingEl) loadingEl.remove();

        const botReply = data.text || data.message || data.output || "Entendi!";
        appendMessage(botReply, false);

    } catch (err) {
        const loadingEl = document.getElementById('chat-loading');
        if (loadingEl) loadingEl.remove();
        appendMessage("Desculpe, tive um problema de conexão.", false);
    }
}

sendChatBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// --- FUNÇÕES DE LIMITE ANÔNIMO ---

function updateAnonymousUI() {
    if (typeof window.getAuthState !== 'function') return;

    window.getAuthState().then(auth => {
        if (auth.isAnonymous) {
            const count = parseInt(localStorage.getItem('anon_gen_count') || '0');
            const remaining = Math.max(0, ANON_LIMIT - count);

            if (counterContainer) counterContainer.classList.remove('hidden');
            if (counterText) {
                counterText.textContent = remaining;
                if (remaining === 0) {
                    counterText.classList.remove('text-secondary');
                    counterText.classList.add('text-red-500');
                    generateBtn.disabled = true;
                    // Procura o span interno para não perder o ícone se houver
                    const btnSpan = generateBtn.querySelector('span');
                    if (btnSpan) btnSpan.textContent = "Limite Atingido";
                    else generateBtn.textContent = "Limite Atingido";
                }
            }
        } else {
            if (counterContainer) counterContainer.classList.add('hidden');
        }
    });
}

// Escuta evento de entrada anônima
window.addEventListener('auth:anonymous', updateAnonymousUI);

// Inicialização
updateGenerateState();
updateAnonymousUI();