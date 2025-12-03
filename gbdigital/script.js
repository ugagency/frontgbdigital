// script.js - lógica do AI Look
const webhookUrl = 'https://automacoes-n8n.infrassys.com/webhook-test/gbdigital';

const inputMain = document.getElementById('input-main');
const inputRef = document.getElementById('input-ref');
const previewMain = document.getElementById('preview-main');
const previewRef = document.getElementById('preview-ref');
const iconMain = document.getElementById('icon-main');
const iconRef = document.getElementById('icon-ref');
const fileMainName = document.getElementById('file-main-name');
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

let fileMain = null;
let fileRef = null;

function updateGenerateState() {
    // Enable only if base image exists OR mode from_scratch
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const can = (fileMain !== null) || mode === 'from_scratch';
    generateBtn.disabled = !can;
}

function handleFileInput(file, previewEl, iconEl, nameEl, removeBtn, setter) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Máx 10MB.');
        return;
    }
    const url = URL.createObjectURL(file);
    previewEl.src = url;
    previewEl.classList.remove('hidden');
    iconEl.classList.add('hidden');
    nameEl.textContent = file.name;
    removeBtn.classList.remove('hidden');
    setter(file);
    updateGenerateState();
}

inputMain.addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    fileMain = f;
    handleFileInput(f, previewMain, iconMain, fileMainName, removeMain, (v) => fileMain = v);
});

inputRef.addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    fileRef = f;
    handleFileInput(f, previewRef, iconRef, fileRefName, removeRef, (v) => fileRef = v);
});

removeMain.addEventListener('click', () => {
    fileMain = null;
    previewMain.src = '';
    previewMain.classList.add('hidden');
    iconMain.classList.remove('hidden');
    fileMainName.textContent = 'Arraste sua foto aqui ou selecione um arquivo.';
    removeMain.classList.add('hidden');
    inputMain.value = '';
    updateGenerateState();
});

removeRef.addEventListener('click', () => {
    fileRef = null;
    previewRef.src = '';
    previewRef.classList.add('hidden');
    iconRef.classList.remove('hidden');
    fileRefName.textContent = 'Enviar referência melhora o resultado.';
    removeRef.classList.add('hidden');
    inputRef.value = '';
    updateGenerateState();
});

document.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener('change', updateGenerateState));
updateGenerateState();

resetBtn.addEventListener('click', () => {
    // reset all
    fileMain = null;
    fileRef = null;
    previewMain.src = '';
    previewRef.src = '';
    previewMain.classList.add('hidden');
    previewRef.classList.add('hidden');
    iconMain.classList.remove('hidden');
    iconRef.classList.remove('hidden');
    fileMainName.textContent = 'Arraste sua foto aqui ou selecione um arquivo.';
    fileRefName.textContent = 'Enviar referência melhora o resultado.';
    removeMain.classList.add('hidden');
    removeRef.classList.add('hidden');
    inputMain.value = '';
    inputRef.value = '';
    promptEl.value = '';
    document.querySelector('input[name="mode"][value="generate"]').checked = true;
    resultSection.classList.add('hidden');
    updateGenerateState();
});

// basic drag & drop
['dragenter', 'dragover'].forEach(evt => {
    document.getElementById('dropzone-main').addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('ring-2', 'ring-primary'); });
    document.getElementById('dropzone-ref').addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('ring-2', 'ring-primary'); });
});
['dragleave', 'drop'].forEach(evt => {
    document.getElementById('dropzone-main').addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('ring-2', 'ring-primary'); });
    document.getElementById('dropzone-ref').addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('ring-2', 'ring-primary'); });
});
document.getElementById('dropzone-main').addEventListener('drop', e => {
    const f = e.dataTransfer.files[0];
    if (f) { fileMain = f; handleFileInput(f, previewMain, iconMain, fileMainName, removeMain, (v) => fileMain = v); }
});
document.getElementById('dropzone-ref').addEventListener('drop', e => {
    const f = e.dataTransfer.files[0];
    if (f) { fileRef = f; handleFileInput(f, previewRef, iconRef, fileRefName, removeRef, (v) => fileRef = v); }
});

async function sendGenerate() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const prompt = promptEl.value || '';

    if (!fileMain && mode !== 'from_scratch') {
        alert('Envie sua foto base ou selecione "Criar look do zero".');
        return;
    }

    const fd = new FormData();
    if (fileMain) fd.append('image_base', fileMain, fileMain.name);
    if (fileRef) fd.append('image_reference', fileRef, fileRef.name);
    fd.append('prompt', prompt);
    fd.append('mode', mode);

    try {
        loadingOverlay.classList.remove('hidden');
        generateBtn.disabled = true;

        const res = await fetch(webhookUrl, {
            method: 'POST',
            body: fd
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error("Erro no servidor: " + res.status + " - " + errText);
        }

        // AGORA A RESPOSTA É UM BLOB (binário)
        const blob = await res.blob();

        if (!blob || blob.size === 0) {
            throw new Error("O N8N retornou um arquivo vazio.");
        }

        // Criar URL temporária da imagem
        const imageUrl = URL.createObjectURL(blob);

        // Mostrar a imagem
        resultImage.src = imageUrl;
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Botão de download
        downloadBtn.href = imageUrl;
        downloadBtn.setAttribute("download", "ai-look.png");

    } catch (err) {
        console.error(err);
        alert("Erro ao gerar imagem: " + (err.message || err));
    } finally {
        loadingOverlay.classList.add('hidden');
        generateBtn.disabled = false;
    }
}

generateBtn.addEventListener('click', sendGenerate);
regenerateBtn.addEventListener('click', sendGenerate);
