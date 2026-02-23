// script.js - Lógica AI Look (Versão v5.0 - Full Management & History)
const webhookUrl = 'https://automacoes-n8n.infrassys.com/webhook/ailooks';
const chatWebhookUrl = 'https://automacoes-n8n.infrassys.com/webhook/webchat';

// Elementos da Interface
const inputMain = document.getElementById('input-main');
const inputRef = document.getElementById('input-ref');
const previewMain = document.getElementById('preview-main');
const previewRef = document.getElementById('preview-ref');
const placeholderMain = document.getElementById('upload-placeholder-main');
const iconRef = document.getElementById('icon-ref');
const scanLine = document.getElementById('scan-main');
const fileRefName = document.getElementById('file-ref-name');
const removeMain = document.getElementById('remove-main');
const removeRef = document.getElementById('remove-ref');
const generateBtn = document.getElementById('generateBtn');
const resetBtn = document.getElementById('resetBtn');
const promptEl = document.getElementById('prompt');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');
const regenerateBtn = document.getElementById('regenerateBtn');

// Elementos Phase 2 & 3 (Guarda-Roupa & Avatar)
const saveAvatarBtn = document.getElementById('saveAvatarBtn');
const saveWardrobeBtn = document.getElementById('saveWardrobeBtn');
const avatarGallery = document.getElementById('avatar-gallery');
const wardrobeGallery = document.getElementById('wardrobe-gallery');

// Tabs
const tabAvatarUpload = document.getElementById('tab-avatar-upload');
const tabAvatarSaved = document.getElementById('tab-avatar-saved');
const tabAvatarManequin = document.getElementById('tab-avatar-manequin');
const sectionAvatarUpload = document.getElementById('section-avatar-upload');
const sectionAvatarSaved = document.getElementById('section-avatar-saved');
const sectionAvatarManequin = document.getElementById('section-avatar-manequin');
const tabWardrobeUpload = document.getElementById('tab-wardrobe-upload');
const tabWardrobeSaved = document.getElementById('tab-wardrobe-saved');
const sectionWardrobeUpload = document.getElementById('section-wardrobe-upload');
const sectionWardrobeSaved = document.getElementById('section-wardrobe-saved');

// Modais
const notificationModal = document.getElementById('notificationModal');
const notificationTitle = document.getElementById('notificationTitle');
const notificationMessage = document.getElementById('notificationMessage');
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmSuccessBtn = document.getElementById('confirmSuccessBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');

// Closet, Avatar & History Full Views
const wardrobeFullView = document.getElementById('wardrobeFullView');
const fullWardrobeGrid = document.getElementById('full-wardrobe-grid');
const addClosetItemBtn = document.getElementById('addClosetItemBtn');
const inputClosetAdd = document.getElementById('input-closet-add');

const avatarFullView = document.getElementById('avatarFullView');
const fullAvatarGrid = document.getElementById('full-avatar-grid');
const addAvatarBtn = document.getElementById('addAvatarBtn');
const inputAvatarAdd = document.getElementById('input-avatar-add');

const historyFullView = document.getElementById('historyFullView');
const fullHistoryGrid = document.getElementById('full-history-grid');

// Estado Global
let fileMain = null;
let fileRef = null;
const AVATAR_LIMIT = 3;
const ANON_LIMIT = 3;

// --- CUSTOM ALERTS ---
function showAlert(message, title = 'Aviso') {
    if (!notificationModal) return alert(message);
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notificationModal.classList.remove('hidden');
    notificationModal.classList.add('flex');
}

function showConfirm(message, title = 'Tem certeza?') {
    if (!confirmModal) return Promise.resolve(confirm(message));
    return new Promise((resolve) => {
        confirmMessage.textContent = message;
        const cTitle = document.getElementById('confirmTitle');
        if (cTitle) cTitle.textContent = title;
        confirmModal.classList.remove('hidden');
        confirmModal.classList.add('flex');
        const end = (res) => {
            confirmModal.classList.add('hidden');
            confirmSuccessBtn.onclick = null;
            confirmCancelBtn.onclick = null;
            resolve(res);
        };
        confirmSuccessBtn.onclick = () => end(true);
        confirmCancelBtn.onclick = () => end(false);
    });
}

// --- LOGICA DO ROLETE (WHEEL PICKER) ---
const wheelModal = document.getElementById('wheelPickerModal');
const summaryContexto = document.getElementById('summary-contexto');
const summaryMomento = document.getElementById('summary-momento');
const summaryClima = document.getElementById('summary-clima');
const summaryFormalidade = document.getElementById('summary-formalidade');
const summaryEstilo = document.getElementById('summary-estilo');

const currentWheelSelection = { contexto: 'Jantar', momento: 'Dia', clima: 'Calor', formalidade: '1', estilo: 'Old Money' };

function openWheelPicker() {
    if (!wheelModal) return;
    wheelModal.classList.remove('hidden');
    // Sincronizar roletes com estado atual ao abrir
    syncWheel('wheel-contexto', currentWheelSelection.contexto);
    syncWheel('wheel-momento', currentWheelSelection.momento);
    syncWheel('wheel-clima', currentWheelSelection.clima);
    syncWheel('wheel-formalidade', currentWheelSelection.formalidade);
    syncWheel('wheel-estilo', currentWheelSelection.estilo);
}

function closeWheelPicker() {
    if (wheelModal) wheelModal.classList.add('hidden');
}

function syncWheel(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    const item = Array.from(el.children).find(c => c.getAttribute('data-val') === val);
    if (item) {
        el.scrollTop = item.offsetTop - el.offsetTop - 80; // Centraliza aprox.
    }
}

function confirmWheelSelection() {
    const ctx = getCenterValue('wheel-contexto');
    const m = getCenterValue('wheel-momento');
    const c = getCenterValue('wheel-clima');
    const f = getCenterValue('wheel-formalidade');
    const e = getCenterValue('wheel-estilo');

    currentWheelSelection.contexto = ctx;
    currentWheelSelection.momento = m;
    currentWheelSelection.clima = c;
    currentWheelSelection.formalidade = f;
    currentWheelSelection.estilo = e;

    if (summaryContexto) summaryContexto.innerText = ctx;

    if (summaryMomento) summaryMomento.innerText = m;
    if (summaryClima) summaryClima.innerText = c;
    if (summaryFormalidade) summaryFormalidade.innerText = f;
    if (summaryEstilo) summaryEstilo.innerText = e;

    closeWheelPicker();
    updateGenerateState();
}
function updateVisuals(el) {
    const center = el.scrollTop + el.offsetHeight / 2;
    Array.from(el.querySelectorAll('.wheel-item')).forEach(child => {
        const childCenter = child.offsetTop - el.offsetTop + child.offsetHeight / 2;
        const dist = Math.abs(childCenter - center);
        const ratio = Math.max(0, 1 - dist / 110);
        child.style.opacity = 0.3 + (ratio * 0.7);
        child.style.transform = `scale(${0.8 + (ratio * 0.2)}) rotateX(${(childCenter - center) / 1.5}deg)`;
    });
}

function getCenterValue(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const center = el.scrollTop + el.offsetHeight / 2;
    let closest = null;
    let minDiff = Infinity;

    Array.from(el.querySelectorAll('.wheel-item')).forEach(child => {
        const val = child.getAttribute('data-val');
        const childCenter = child.offsetTop - el.offsetTop + child.offsetHeight / 2;
        const diff = Math.abs(childCenter - center);
        if (diff < minDiff) {
            minDiff = diff;
            closest = val;
        }
    });
    return closest;
}

// Adicionar ouvintes de scroll para efeito visual em tempo real
['wheel-contexto', 'wheel-momento', 'wheel-clima', 'wheel-formalidade', 'wheel-estilo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.onscroll = () => updateVisuals(el);
});

// --- CLOSET DIGITAL ---
function openCloset() {
    const modal = document.getElementById('wardrobeFullView');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    loadFullWardrobe();
}
window.openCloset = openCloset;

async function loadFullWardrobe() {
    if (!window.supabaseClient || !fullWardrobeGrid) return;
    fullWardrobeGrid.innerHTML = '<div class="col-span-full py-20 text-center animate-pulse text-muted">Carregando seu closet...</div>';

    const { data, error } = await window.supabaseClient.from('user_wardrobe').select('*').order('created_at', { ascending: false });
    if (error) {
        fullWardrobeGrid.innerHTML = '<p class="col-span-full text-center py-20">Erro ao carregar.</p>';
        return;
    }

    fullWardrobeGrid.innerHTML = data.length ? '' : '<p class="col-span-full text-center py-20 italic">Seu closet está vazio. Clique no botão acima para adicionar peças!</p>';
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'group relative bg-white rounded-2xl overflow-hidden shadow-sm aspect-[3/4] cursor-pointer border border-gray-100';
        div.innerHTML = `
            <img src="${item.image_url}" class="w-full h-full object-cover transition-transform group-hover:scale-105">
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button class="bg-white text-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase use-btn">Usar Peça</button>
                <button class="bg-red-500 text-white p-1.5 rounded-full delete-full-btn"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>`;
        div.onclick = (e) => {
            if (e.target.closest('.delete-full-btn')) { deleteWardrobeItem(item.id, item.image_url, true); return; }
            fileRef = item.image_url; previewRef.src = item.image_url; previewRef.classList.remove('hidden'); if (iconRef) iconRef.classList.add('hidden'); removeRef.classList.remove('hidden'); if (fileRefName) fileRefName.textContent = "Peça do Closet"; updateGenerateState(); wardrobeFullView.classList.add('hidden'); switchTab('wardrobe', 'saved');
        };
        fullWardrobeGrid.appendChild(div);
    });
}

// --- AVATAR MANAGER ---
function openAvatarManager() {
    const modal = document.getElementById('avatarFullView');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    loadFullAvatars();
}
window.openAvatarManager = openAvatarManager;

async function loadFullAvatars() {
    if (!window.supabaseClient || !fullAvatarGrid) return;
    fullAvatarGrid.innerHTML = '<div class="col-span-full py-20 text-center animate-pulse text-muted">Carregando seus bonecos...</div>';

    const { data, error } = await window.supabaseClient.from('user_avatars').select('*').order('created_at', { ascending: false });
    if (error) {
        fullAvatarGrid.innerHTML = '<p class="col-span-full text-center py-20">Erro ao carregar.</p>';
        return;
    }

    fullAvatarGrid.innerHTML = data.length ? '' : '<p class="col-span-full text-center py-20 italic">Você não tem bonecos salvos. Clique no botão acima para adicionar!</p>';
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'group relative bg-white rounded-2xl overflow-hidden shadow-sm aspect-[3/4] cursor-pointer border border-gray-100';
        div.innerHTML = `
            <img src="${item.image_url}" class="w-full h-full object-cover transition-transform group-hover:scale-105">
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button class="bg-white text-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase use-btn">Usar Boneco</button>
                <button class="bg-red-500 text-white p-1.5 rounded-full delete-full-btn"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>`;
        div.onclick = (e) => {
            if (e.target.closest('.delete-full-btn')) { deleteAvatar(item.id, item.image_url, true); return; }
            fileMain = item.image_url; previewMain.src = item.image_url; previewMain.classList.remove('hidden'); if (placeholderMain) placeholderMain.classList.add('hidden'); removeMain.classList.remove('hidden'); updateGenerateState(); avatarFullView.classList.add('hidden'); switchTab('avatar', 'saved');
        };
        fullAvatarGrid.appendChild(div);
    });
}

// --- HISTORY MANAGER ---
function openHistory() {
    if (!historyFullView) return;
    historyFullView.classList.remove('hidden');
    historyFullView.classList.add('flex');
    loadHistory();
}
window.openHistory = openHistory;

async function loadHistory() {
    if (!window.supabaseClient || !fullHistoryGrid) return;
    fullHistoryGrid.innerHTML = '<div class="col-span-full py-20 text-center animate-pulse text-muted">Carregando seu histórico...</div>';

    const { data, error } = await window.supabaseClient.from('user_history').select('*').order('created_at', { ascending: false });
    if (error) {
        fullHistoryGrid.innerHTML = '<p class="col-span-full text-center py-20">Erro ao carregar histórico.</p>';
        return;
    }

    fullHistoryGrid.innerHTML = data.length ? '' : '<p class="col-span-full text-center py-20 italic">Nenhuma geração encontrada. Comece a criar para ver suas fotos aqui!</p>';
    data.forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const div = document.createElement('div');
        div.className = 'group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all';
        div.innerHTML = `
            <div class="relative aspect-square overflow-hidden bg-gray-50">
                <img src="${item.image_url}" class="w-full h-full object-contain transition-transform group-hover:scale-105">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a href="${item.image_url}" download class="bg-white text-primary p-2 rounded-full hover:bg-black hover:text-white transition-colors">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </a>
                    <button class="bg-red-500 text-white p-2 rounded-full delete-history-btn hover:bg-black transition-colors">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
            <div class="p-4 bg-white">
                <p class="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">${date}</p>
                <p class="text-xs text-primary line-clamp-2 italic leading-relaxed">"${item.prompt || 'Sem descrição'}"</p>
            </div>`;
        div.querySelector('.delete-history-btn').onclick = () => deleteHistoryItem(item.id, item.image_url);
        fullHistoryGrid.appendChild(div);
    });
}

async function deleteHistoryItem(id, url) {
    if (await showConfirm("Remover esta geração do histórico permanentemente?")) {
        try {
            const path = url.split('/public/history/')[1];
            await window.supabaseClient.from('user_history').delete().eq('id', id);
            if (path) await window.supabaseClient.storage.from('history').remove([path]);
            loadHistory();
        } catch (e) { showAlert("Erro ao deletar."); }
    }
}

// --- UTILITÁRIOS ---
function updateGenerateState() {
    const can = (fileMain !== null && fileRef !== null);
    if (generateBtn) {
        generateBtn.disabled = !can;
        generateBtn.classList.toggle('opacity-50', !can);
    }
}

// --- CONFIGURAÇÃO DE MANEQUINS ---
const MANEQUIN_URLS = {
    male_athletic: 'manequins/male_athletic.png',
    male_average: 'manequins/male_average.png',
    male_robust: 'manequins/male_robust.png',
    female_athletic: 'manequins/female_athletic.png',
    female_average: 'manequins/female_average.png',
    female_robust: 'manequins/female_robust.png'
};

// Injetar caminhos dos artifacts se disponíveis
window.ManequinPaths = {};

function initManequins(paths) {
    window.ManequinPaths = paths;
    Object.keys(paths).forEach(key => {
        const img = document.getElementById(`img_${key}`);
        if (img) img.src = paths[key];
    });
}

function filterManequin(gender) {
    const btnM = document.getElementById('btn-manequin-male');
    const btnF = document.getElementById('btn-manequin-female');
    const gridM = document.getElementById('grid-manequin-male');
    const gridF = document.getElementById('grid-manequin-female');

    if (gender === 'male') {
        btnM.className = 'flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary text-white rounded-lg transition-all';
        btnF.className = 'flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-muted rounded-lg hover:bg-gray-200 transition-all';
        gridM.classList.remove('hidden');
        gridF.classList.add('hidden');
    } else {
        btnF.className = 'flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary text-white rounded-lg transition-all';
        btnM.className = 'flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-muted rounded-lg hover:bg-gray-200 transition-all';
        gridF.classList.remove('hidden');
        gridM.classList.add('hidden');
    }
}

async function setManequin(key) {
    const url = window.ManequinPaths[key] || MANEQUIN_URLS[key];
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        fileMain = new File([blob], `${key}.png`, { type: 'image/png' });
        previewMain.src = url;
        previewMain.classList.remove('hidden');
        placeholderMain?.classList.add('hidden');
        removeMain?.classList.remove('hidden');
        saveAvatarBtn?.classList.add('hidden'); // Não salva manequim genérico nos avatares
        updateGenerateState();
    } catch (e) {
        console.error("Erro ao carregar manequim:", e);
        showAlert("Erro ao carregar o manequim selecionado.");
    }
}

function handleFileSelection(file, type) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'main') {
        fileMain = file; previewMain.src = url; previewMain.classList.remove('hidden'); placeholderMain?.classList.add('hidden'); removeMain?.classList.remove('hidden');
        if (saveAvatarBtn) saveAvatarBtn.classList.remove('hidden');
    } else {
        fileRef = file; previewRef.src = url; previewRef.classList.remove('hidden'); iconRef?.classList.add('hidden'); removeRef?.classList.remove('hidden');
        if (fileRefName) fileRefName.textContent = file.name;
        if (saveWardrobeBtn) saveWardrobeBtn.classList.remove('hidden');
    }
    updateGenerateState();
}

// --- SUPABASE OPS ---
async function uploadToSupabase(file, bucket) {
    const user = (await window.supabaseClient.auth.getUser()).data.user;
    const fileName = `${user.id}/${Date.now()}.${file.name?.split('.').pop() || 'png'}`;
    await window.supabaseClient.storage.from(bucket).upload(fileName, file);
    return window.supabaseClient.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
}

async function saveAvatar() {
    try {
        saveAvatarBtn.disabled = true;
        const originalText = saveAvatarBtn.textContent;
        saveAvatarBtn.innerHTML = '<span class="animate-spin mr-2">...</span> Salvando...';

        const { count } = await window.supabaseClient.from('user_avatars').select('*', { count: 'exact', head: true });
        if (count >= AVATAR_LIMIT) {
            showAlert(`Limite de ${AVATAR_LIMIT} bonecos atingido.`);
            saveAvatarBtn.innerHTML = originalText;
            saveAvatarBtn.disabled = false;
            return;
        }

        const url = await uploadToSupabase(fileMain, 'avatars');
        await window.supabaseClient.from('user_avatars').insert([{
            user_id: (await window.supabaseClient.auth.getUser()).data.user.id,
            image_url: url
        }]);

        showAlert("Boneco salvo com sucesso!", "Sucesso");
        loadAvatars();
        saveAvatarBtn.classList.add('hidden');
    } catch (e) {
        console.error("Save Avatar Error:", e);
        showAlert("Erro ao salvar boneco.");
    } finally {
        saveAvatarBtn.disabled = false;
    }
}

async function saveWardrobe() {
    try {
        saveWardrobeBtn.disabled = true;
        const originalText = saveWardrobeBtn.textContent;
        saveWardrobeBtn.innerHTML = '<span class="animate-spin mr-2">...</span> Salvando...';

        const url = await uploadToSupabase(fileRef, 'wardrobe');
        await window.supabaseClient.from('user_wardrobe').insert([{
            user_id: (await window.supabaseClient.auth.getUser()).data.user.id,
            image_url: url
        }]);

        showAlert("Peça salva no closet!", "Sucesso");
        loadWardrobe();
        saveWardrobeBtn.classList.add('hidden');
    } catch (e) {
        console.error("Save Wardrobe Error:", e);
        showAlert("Erro ao salvar peça no closet.");
    } finally {
        saveWardrobeBtn.disabled = false;
    }
}

async function handleClosetAdd(file) {
    if (!file) return;
    try {
        addClosetItemBtn.disabled = true;
        addClosetItemBtn.innerHTML = '<span class="animate-spin text-xs">...</span>';
        const url = await uploadToSupabase(file, 'wardrobe');
        await window.supabaseClient.from('user_wardrobe').insert([{ user_id: (await window.supabaseClient.auth.getUser()).data.user.id, image_url: url }]);
        showAlert("Nova peça adicionada!", "Sucesso");
        loadFullWardrobe(); loadWardrobe();
    } catch (err) { showAlert("Erro ao adicionar."); }
    finally { addClosetItemBtn.disabled = false; addClosetItemBtn.innerHTML = '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M12 4v16m8-8H4" /></svg> Adicionar Peça'; }
}

async function handleAvatarAddInManager(file) {
    if (!file) return;
    try {
        addAvatarBtn.disabled = true;
        addAvatarBtn.innerHTML = '<span class="animate-spin text-xs">...</span>';
        const { count } = await window.supabaseClient.from('user_avatars').select('*', { count: 'exact', head: true });
        if (count >= AVATAR_LIMIT) return showAlert(`Limite atingido.`);
        const url = await uploadToSupabase(file, 'avatars');
        await window.supabaseClient.from('user_avatars').insert([{ user_id: (await window.supabaseClient.auth.getUser()).data.user.id, image_url: url }]);
        showAlert("Novo boneco adicionado!", "Sucesso");
        loadFullAvatars(); loadAvatars();
    } catch (err) { showAlert("Erro ao adicionar."); }
    finally { addAvatarBtn.disabled = false; addAvatarBtn.innerHTML = '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M12 4v16m8-8H4" /></svg> Adicionar Boneco'; }
}

async function deleteAvatar(id, url, isFull = false) {
    if (await showConfirm("Excluir permanentemente?")) {
        try {
            const path = url.split('/public/avatars/')[1];
            await window.supabaseClient.from('user_avatars').delete().eq('id', id);
            if (path) await window.supabaseClient.storage.from('avatars').remove([path]);
            if (isFull) loadFullAvatars(); loadAvatars();
            if (fileMain === url) removeMain.click();
        } catch (e) { }
    }
}

async function deleteWardrobeItem(id, url, isFull = false) {
    if (await showConfirm("Excluir do closet?")) {
        try {
            const path = url.split('/public/wardrobe/')[1];
            await window.supabaseClient.from('user_wardrobe').delete().eq('id', id);
            if (path) await window.supabaseClient.storage.from('wardrobe').remove([path]);
            if (isFull) loadFullWardrobe(); loadWardrobe();
            if (fileRef === url) removeRef.click();
        } catch (e) { }
    }
}

async function loadAvatars() {
    if (!window.supabaseClient || !avatarGallery) return;
    const { data } = await window.supabaseClient.from('user_avatars').select('*').order('created_at', { ascending: false });
    avatarGallery.innerHTML = data?.length ? '' : '<p class="col-span-full py-4 text-center text-[10px] text-muted italic">Vazio.</p>';
    data?.forEach(item => {
        const div = document.createElement('div');
        div.className = 'aspect-[3/4] relative rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-secondary transition-all group';
        div.innerHTML = `<img src="${item.image_url}" class="w-full h-full object-cover">
            <button class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 delete-btn"><svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg></button>`;
        div.onclick = (e) => {
            if (e.target.closest('.delete-btn')) { deleteAvatar(item.id, item.image_url); return; }
            fileMain = item.image_url; previewMain.src = item.image_url; previewMain.classList.remove('hidden'); placeholderMain?.classList.add('hidden'); removeMain?.classList.remove('hidden'); updateGenerateState();
        };
        avatarGallery.appendChild(div);
    });
}

async function loadWardrobe() {
    if (!window.supabaseClient || !wardrobeGallery) return;
    const { data } = await window.supabaseClient.from('user_wardrobe').select('*').order('created_at', { ascending: false });
    wardrobeGallery.innerHTML = data?.length ? '' : '<p class="col-span-full py-4 text-center text-[10px] text-muted italic">Vazio.</p>';
    data?.forEach(item => {
        const div = document.createElement('div');
        div.className = 'aspect-square relative rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-secondary transition-all group';
        div.innerHTML = `<img src="${item.image_url}" class="w-full h-full object-cover">
            <button class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 delete-btn"><svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg></button>`;
        div.onclick = (e) => {
            if (e.target.closest('.delete-btn')) { deleteWardrobeItem(item.id, item.image_url); return; }
            fileRef = item.image_url; previewRef.src = item.image_url; previewRef.classList.remove('hidden'); iconRef?.classList.add('hidden'); removeRef?.classList.remove('hidden'); if (fileRefName) fileRefName.textContent = "Peça Salva"; updateGenerateState();
        };
        wardrobeGallery.appendChild(div);
    });
}

// --- EVENTS ---
inputMain?.addEventListener('change', e => handleFileSelection(e.target.files[0], 'main'));
inputRef?.addEventListener('change', e => handleFileSelection(e.target.files[0], 'ref'));
if (removeMain) removeMain.onclick = () => { fileMain = null; previewMain.classList.add('hidden'); placeholderMain?.classList.remove('hidden'); removeMain.classList.add('hidden'); saveAvatarBtn?.classList.add('hidden'); updateGenerateState(); };
if (removeRef) removeRef.onclick = () => { fileRef = null; previewRef.classList.add('hidden'); iconRef?.classList.remove('hidden'); if (fileRefName) fileRefName.textContent = 'Adicionar roupa'; removeRef.classList.add('hidden'); saveWardrobeBtn?.classList.add('hidden'); updateGenerateState(); };
if (resetBtn) resetBtn.onclick = () => {
    removeMain?.click();
    removeRef?.click();
    if (promptEl) promptEl.value = '';
    resultSection?.classList.add('hidden');
};

if (addClosetItemBtn) addClosetItemBtn.onclick = () => inputClosetAdd?.click();
if (inputClosetAdd) inputClosetAdd.onchange = e => handleClosetAdd(e.target.files[0]);
if (addAvatarBtn) addAvatarBtn.onclick = () => inputAvatarAdd?.click();
if (inputAvatarAdd) inputAvatarAdd.onchange = e => handleAvatarAddInManager(e.target.files[0]);

if (saveAvatarBtn) saveAvatarBtn.onclick = saveAvatar;
if (saveWardrobeBtn) saveWardrobeBtn.onclick = saveWardrobe;

function switchTab(type, target) {
    const isAv = type === 'avatar';
    const tabU = isAv ? tabAvatarUpload : tabWardrobeUpload;
    const tabS = isAv ? tabAvatarSaved : tabWardrobeSaved;
    const tabM = isAv ? tabAvatarManequin : null;

    const secU = isAv ? sectionAvatarUpload : sectionWardrobeUpload;
    const secS = isAv ? sectionAvatarSaved : sectionWardrobeSaved;
    const secM = isAv ? sectionAvatarManequin : null;

    if (!tabU || !tabS) return;

    // Reset classes
    [tabU, tabS, tabM].filter(Boolean).forEach(t => {
        t.className = 'flex-1 pb-2 text-[8px] md:text-xs font-bold uppercase tracking-wider text-muted border-b-2 border-transparent';
    });
    [secU, secS, secM].filter(Boolean).forEach(s => {
        s.classList.add('hidden');
    });

    // Set active
    if (target === 'upload') {
        tabU.className = 'flex-1 pb-2 text-[8px] md:text-xs font-bold uppercase tracking-wider text-primary border-b-2 border-primary';
        secU.classList.remove('hidden');
    } else if (target === 'saved') {
        tabS.className = 'flex-1 pb-2 text-[8px] md:text-xs font-bold uppercase tracking-wider text-primary border-b-2 border-primary';
        secS.classList.remove('hidden');
        isAv ? loadAvatars() : loadWardrobe();
    } else if (target === 'manequin' && tabM) {
        tabM.className = 'flex-1 pb-2 text-[8px] md:text-xs font-bold uppercase tracking-wider text-primary border-b-2 border-primary';
        secM.classList.remove('hidden');
    }
}

tabAvatarUpload && (tabAvatarUpload.onclick = () => switchTab('avatar', 'upload'));
tabAvatarSaved && (tabAvatarSaved.onclick = () => switchTab('avatar', 'saved'));
tabAvatarManequin && (tabAvatarManequin.onclick = () => switchTab('avatar', 'manequin'));
tabWardrobeUpload && (tabWardrobeUpload.onclick = () => switchTab('wardrobe', 'upload'));
tabWardrobeSaved && (tabWardrobeSaved.onclick = () => switchTab('wardrobe', 'saved'));

// --- GENERATION ---
async function sendGenerate() {
    if (!fileMain || !fileRef) return showAlert("Envie as fotos (Boneco e Roupa).");
    const auth = await window.getAuthState();
    if (auth.isAnonymous && parseInt(localStorage.getItem('anon_gen_count') || '0') >= ANON_LIMIT) return document.getElementById('limitModal')?.classList.remove('hidden');

    try {
        loadingOverlay?.classList.remove('hidden');
        loadingOverlay?.classList.add('flex');

        // Constrói prompt final a partir dos seletores do rolete e opção de armário
        const prioritizeStatus = 'on'; // Fixado como ON conforme solicitado
        const finalPrompt = `Modo: Gerar Look, Contexto: ${currentWheelSelection.contexto}, Momento: ${currentWheelSelection.momento}, Clima: ${currentWheelSelection.clima}, Nível de Formalidade: ${currentWheelSelection.formalidade}, Estilo: ${currentWheelSelection.estilo}, Priorizar meu armário: ${prioritizeStatus}`;

        const fd = new FormData();
        fd.append('image_base', await (async () => { if (typeof fileMain === 'string') { const r = await fetch(fileMain); return await r.blob(); } return fileMain; })(), 'image_base.png');
        fd.append('image_reference', await (async () => { if (typeof fileRef === 'string') { const r = await fetch(fileRef); return await r.blob(); } return fileRef; })(), 'image_ref.png');
        fd.append('prompt', finalPrompt);
        fd.append('mode', 'generate');

        console.log("Enviando para Webhook:", webhookUrl);
        const res = await fetch(webhookUrl, { method: 'POST', body: fd });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Servidor retornou erro ${res.status}: ${errText}`);
        }

        // Detecta o tipo de conteúdo para decidir como ler o stream
        const contentType = res.headers.get("content-type") || "";
        console.log("Headers recebidos:", Object.fromEntries(res.headers.entries()));
        console.log("Content-Type detectado:", contentType);

        let blob;
        let finalUrl;

        try {
            if (contentType.toLowerCase().includes("application/json")) {
                console.log("Iniciando processamento JSON...");
                const data = await res.json();
                const item = Array.isArray(data) ? data[0] : data;
                const edited = item.edited || item.Edited;
                const justificativa = item.justificativa || item.Justificativa;

                // Chat em bloco isolado para não quebrar a imagem
                try {
                    if (justificativa) {
                        console.log("Justificativa no JSON encontrada.");
                        addChatMessage(justificativa, 'ai', true);
                    }
                } catch (chatErr) { console.error("Erro ao adicionar chat (JSON):", chatErr); }

                if (edited) {
                    finalUrl = edited.startsWith('http') || edited.startsWith('data:') ? edited : `data:image/png;base64,${edited}`;
                    resultImage.src = finalUrl;
                    downloadBtn.href = finalUrl;
                    console.log("Imagem configurada a partir de JSON.");
                    const r = await fetch(finalUrl);
                    blob = await r.blob();
                }
            } else {
                console.log("Iniciando processamento BINÁRIO...");
                // Headers em bloco isolado
                try {
                    const hJust = res.headers.get("x-justificativa") || res.headers.get("justificativa");
                    if (hJust) {
                        const decoded = decodeURIComponent(hJust.replace(/\+/g, ' '));
                        addChatMessage(decoded, 'ai', true);
                    }
                } catch (headerErr) { console.error("Erro nos headers/chat (Binário):", headerErr); }

                blob = await res.blob();
                console.log("Blob binário pronto, tamanho:", blob.size);
                if (blob.size === 0) throw new Error("A IA retornou um arquivo vazio.");

                finalUrl = URL.createObjectURL(blob);
                resultImage.src = finalUrl;
                downloadBtn.href = finalUrl;
                console.log("Imagem configurada a partir de Blob binário.");
            }
        } catch (err) {
            console.error("Erro crítico no processamento da resposta:", err);
            throw err;
        }

        console.log("Exibindo seção de resultado (#resultSection)");
        resultSection.classList.remove('hidden');

        // Permanentemente Salva no Histórico se estiver logado
        if (!auth.isAnonymous && auth.session && blob) {
            try {
                const historyUrl = await uploadToSupabase(blob, 'history');
                await window.supabaseClient.from('user_history').insert([{
                    user_id: auth.session.user.id,
                    prompt: promptEl?.value || 'Geração via IA',
                    image_url: historyUrl
                }]);
            } catch (historyErr) { console.error("History Save Error:", historyErr); }
        }

        if (auth.isAnonymous) {
            const count = (parseInt(localStorage.getItem('anon_gen_count') || '0') + 1);
            localStorage.setItem('anon_gen_count', count.toString());
        }
    } catch (e) {
        console.error("Erro na Geração:", e);
        showAlert(e.message || "Erro na conexão com o servidor de IA.", "Falha na Geração");
    } finally {
        loadingOverlay?.classList.add('hidden');
        updateGenerateState();
    }
}
generateBtn && (generateBtn.onclick = sendGenerate);
regenerateBtn && (regenerateBtn.onclick = sendGenerate);

// --- CHAT ---
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const chatMessagesContainer = document.getElementById('chat-messages');

/**
 * Adiciona uma mensagem ao chat
 * @param {string} content - Texto da mensagem
 * @param {string} sender - 'user' ou 'ai'
 * @param {boolean} isAI - Se é uma mensagem da consultora
 */
function addChatMessage(content, sender, isAI = false) {
    if (!chatMessagesContainer) return;

    const div = document.createElement('div');
    div.className = isAI ? 'flex justify-start mb-4 animate-fade-in' : 'flex justify-end mb-4 animate-fade-in';

    if (isAI) {
        // Divide o conteúdo em parágrafos (considerando \n\n como separador)
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());

        if (paragraphs.length > 1) {
            const firstPara = paragraphs[0];
            const restOfContent = paragraphs.slice(1).join('\n\n');

            div.innerHTML = `
                <div class="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none py-3 px-4 text-sm shadow-sm max-w-[85%]">
                    <p class="font-serif font-bold text-gray-900 mb-1">Consultoria AI ✨</p>
                    <div class="leading-relaxed">${firstPara.replace(/\n/g, '<br>')}</div>
                    
                    <div class="hidden-content hidden mt-2 pt-2 border-t border-gray-50 animate-fade-in">
                        <div class="leading-relaxed">${restOfContent.replace(/\n/g, '<br>')}</div>
                    </div>
                    
                    <button class="read-more-btn text-secondary font-bold text-xs mt-2 hover:underline flex items-center gap-1 transition-all">
                        <span>Ler mais...</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            `;

            // Lógica para expandir o conteúdo
            const btn = div.querySelector('.read-more-btn');
            const target = div.querySelector('.hidden-content');
            btn.onclick = () => {
                target.classList.remove('hidden');
                btn.remove();
                // Scroll para garantir que o conteúdo novo seja visto
                chatMessagesContainer.scrollTo({
                    top: chatMessagesContainer.scrollHeight,
                    behavior: 'smooth'
                });
            };
        } else {
            // Mensagem curta (parágrafo único)
            div.innerHTML = `
                <div class="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none py-3 px-4 text-sm shadow-sm max-w-[85%]">
                    <p class="font-serif font-bold text-gray-900 mb-1">Consultoria AI ✨</p>
                    <div class="leading-relaxed">${content.replace(/\n/g, '<br>')}</div>
                </div>
            `;
        }
    } else {
        div.innerHTML = `
            <div class="bg-primary text-white rounded-2xl rounded-tr-none py-3 px-4 text-sm shadow-card max-w-[85%]">
                <p class="leading-relaxed">${content}</p>
            </div>
        `;
    }

    chatMessagesContainer.appendChild(div);

    // Scroll suave para o final
    chatMessagesContainer.scrollTo({
        top: chatMessagesContainer.scrollHeight,
        behavior: 'smooth'
    });
}

async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addChatMessage(text, 'user');
    chatInput.value = '';

    try {
        const res = await fetch(chatWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        addChatMessage(data.text || "Ok!", 'ai', true);
    } catch (e) {
        console.error("Erro no chat:", e);
        addChatMessage("Desculpe, tive um problema ao processar sua mensagem. Tente novamente em instantes.", 'ai', true);
    }
}
sendChatBtn && (sendChatBtn.onclick = sendChatMessage);

window.addEventListener('auth:change', () => {
    window.getAuthState().then(auth => {
        if (!auth.isAnonymous) { loadAvatars(); loadWardrobe(); }
        const counter = document.getElementById('anonymousCounter');
        if (counter) counter.classList.toggle('hidden', !auth.isAnonymous);
    });
});
updateGenerateState();

// Inicialização de Modelos (Usando caminhos relativos na pasta manequins/)
initManequins({
    male_athletic: 'manequins/male_athletic.png',
    male_average: 'manequins/male_average.png',
    male_robust: 'manequins/male_robust.png',
    female_athletic: 'manequins/female_athletic.png',
    female_average: 'manequins/female_average.png',
    female_robust: 'manequins/female_robust.png'
});
