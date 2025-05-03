// === 0. Globale Variabler og Konstanter START ===
let squad = [];
let playersOnPitch = {}; // { playerId: element }
let playersOnBench = []; // [playerId1, playerId2]
let nextPlayerId = 1;
let draggedPlayerId = null;
let draggedElement = null;
let dragSource = null; // 'squad', 'pitch', 'bench'

const MAX_PLAYERS_ON_PITCH = 11;

const STORAGE_KEY_SQUAD = 'fotballtaktiker_squad';
const STORAGE_KEY_LAST_STATE = 'fotballtaktiker_lastState';
const STORAGE_KEY_SETUPS = 'fotballtaktiker_setups';
// === 0. Globale Variabler og Konstanter END ===


// === 1. DOM Element Referanser START ===
const sidebar = document.querySelector('.sidebar');
const onPitchListElement = document.getElementById('on-pitch-list');
const benchListElement = document.getElementById('bench-list');
const squadListElement = document.getElementById('squad-list');
const onPitchCountElement = document.getElementById('on-pitch-count');
const onBenchCountElement = document.getElementById('on-bench-count');
const pitchElement = document.getElementById('pitch');
const benchElement = document.getElementById('bench');
const addPlayerButton = document.getElementById('add-player-button');
const playerBorderColorInput = document.getElementById('player-border-color');
const setBorderColorButton = document.getElementById('set-border-color-button');
const toggleDrawModeButton = document.getElementById('toggle-draw-mode-button');
const clearDrawingsButton = document.getElementById('clear-drawings-button');
const setupNameInput = document.getElementById('setup-name');
const saveSetupButton = document.getElementById('save-setup-button');
const loadSetupSelect = document.getElementById('load-setup-select');
const loadSetupButton = document.getElementById('load-setup-button');
const deleteSetupButton = document.getElementById('delete-setup-button');
const exportPngButton = document.getElementById('export-png-button');
const pitchContainer = document.getElementById('pitch-container');
const drawingCanvas = document.getElementById('drawing-canvas');
const ballElement = document.getElementById('ball');
const addPlayerModal = document.getElementById('add-player-modal');
const closeButton = addPlayerModal.querySelector('.close-button');
const newPlayerNameInput = document.getElementById('new-player-name');
const newPlayerImageUpload = document.getElementById('new-player-image-upload');
const newPlayerImageUrlInput = document.getElementById('new-player-image-url');
const newPlayerRoleInput = document.getElementById('new-player-role');
const confirmAddPlayerButton = document.getElementById('confirm-add-player');
// === 1. DOM Element Referanser END ===


// === 2. Modal Håndtering START ===
function openAddPlayerModal() {
    addPlayerModal.style.display = 'block';
    newPlayerNameInput.value = '';
    newPlayerImageUpload.value = '';
    newPlayerImageUrlInput.value = '';
    newPlayerRoleInput.value = '';
    newPlayerNameInput.focus();
}

function closeAddPlayerModal() {
    addPlayerModal.style.display = 'none';
}

function handleAddPlayerConfirm() {
    // --- DEBUGGING START ---
    console.log('handleAddPlayerConfirm: Funksjonen startet.');
    // --- DEBUGGING END ---

    const name = newPlayerNameInput.value.trim();
    const imageFile = newPlayerImageUpload.files[0];
    let imageUrl = newPlayerImageUrlInput.value.trim();
    const role = newPlayerRoleInput.value.trim();

    // --- DEBUGGING START ---
    console.log('handleAddPlayerConfirm: Data fra modal:', { name, imageUrl, role, imageFile });
    // --- DEBUGGING END ---

    if (!name) {
        // --- DEBUGGING START ---
        console.log('handleAddPlayerConfirm: Navn mangler, avbryter.');
        // --- DEBUGGING END ---
        alert('Spillernavn må fylles ut.');
        return;
    }

    let finalImageUrl = '';
    if (imageUrl) {
        finalImageUrl = imageUrl;
    } else if (imageFile) {
        console.warn("Filopplasting støttes ikke for lagring enda. Bruk URL.");
    }

    const maxId = squad.reduce((max, p) => Math.max(max, parseInt(p.id.split('-')[1])), 0);
    nextPlayerId = maxId + 1;

    const newPlayer = {
        id: `player-${nextPlayerId}`,
        name: name, imageUrl: finalImageUrl, role: role,
        position: { x: 50, y: 50 }, borderColor: 'black'
    };

    // --- DEBUGGING START ---
    console.log('handleAddPlayerConfirm: Opprettet spillerobjekt:', newPlayer);
    // --- DEBUGGING END ---

    squad.push(newPlayer);
    // --- DEBUGGING START ---
    console.log('handleAddPlayerConfirm: Spiller lagt til i squad array:', squad);
    // --- DEBUGGING END ---

    saveSquad();
     // --- DEBUGGING START ---
    console.log('handleAddPlayerConfirm: saveSquad() kalt.');
    // --- DEBUGGING END ---

    renderUI();
     // --- DEBUGGING START ---
    console.log('handleAddPlayerConfirm: renderUI() kalt.');
    // --- DEBUGGING END ---

    closeAddPlayerModal();
     // --- DEBUGGING START ---
    console.log('handleAddPlayerConfirm: closeAddPlayerModal() kalt, funksjonen avslutter.');
    // --- DEBUGGING END ---
}
// === 2. Modal Håndtering END ===


// === 3. UI Rendering (Oppdatering av Grensesnitt) START ===
function renderUI() {
    renderOnPitchList();
    renderBench();
    renderSquadList();
    onPitchCountElement.textContent = Object.keys(playersOnPitch).length;
    onBenchCountElement.textContent = playersOnBench.length;
}

function renderOnPitchList() {
    onPitchListElement.innerHTML = '';
    const playerIdsOnPitch = Object.keys(playersOnPitch);
    if (playerIdsOnPitch.length === 0) { onPitchListElement.innerHTML = '<li><i>Ingen spillere på banen.</i></li>'; return; }
    const sortedPlayers = playerIdsOnPitch.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name));
    sortedPlayers.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = player.name + (player.role ? ` (${player.role})` : '');
        listItem.setAttribute('data-player-id', player.id);
        listItem.classList.add('on-pitch-player-item');
        onPitchListElement.appendChild(listItem);
    });
}

function renderBench() {
    benchListElement.innerHTML = '';
    if (playersOnBench.length === 0) { benchListElement.innerHTML = '<li><i>Benken er tom.</i></li>'; return; }
    const sortedPlayers = playersOnBench.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name));
    sortedPlayers.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = player.name + (player.role ? ` (${player.role})` : '');
        listItem.setAttribute('data-player-id', player.id);
        listItem.classList.add('bench-player-item', 'draggable');
        listItem.setAttribute('draggable', true);
        benchListElement.appendChild(listItem);
    });
    addDragListenersToBenchItems();
}

function renderSquadList() {
    squadListElement.innerHTML = '';
    const availablePlayers = squad.filter(p => !playersOnPitch[p.id] && !playersOnBench.includes(p.id)).sort((a, b) => a.name.localeCompare(b.name));
    if (availablePlayers.length === 0 && squad.length > 0) { squadListElement.innerHTML = '<li><i>Alle spillere er plassert.</i></li>'; }
    else if (squad.length === 0) { squadListElement.innerHTML = '<li><i>Ingen spillere i troppen.</i></li>'; }
    else {
        availablePlayers.forEach(player => {
            const listItem = document.createElement('li');
            listItem.textContent = player.name + (player.role ? ` (${player.role})` : '');
            listItem.setAttribute('data-player-id', player.id);
            listItem.classList.add('squad-player-item', 'draggable');
            listItem.setAttribute('draggable', true);
            squadListElement.appendChild(listItem);
        });
    }
     addDragListenersToSquadItems();
}
// === 3. UI Rendering (Oppdatering av Grensesnitt) END ===


// === 4. Spillerbrikke Håndtering (på banen) START ===
function createPlayerPieceElement(player, xPercent, yPercent) {
    const piece = document.createElement('div');
    piece.classList.add('player-piece', 'draggable');
    piece.setAttribute('data-player-id', player.id);
    piece.setAttribute('draggable', true);
    piece.style.left = `${xPercent}%`;
    piece.style.top = `${yPercent}%`;
    piece.style.transform = 'translate(-50%, -50%)';
    const imgContainer = document.createElement('div');
    imgContainer.classList.add('player-image-container');
    imgContainer.style.borderColor = player.borderColor || 'black';
    const imgDiv = document.createElement('div');
    imgDiv.classList.add('player-image');
    if (player.imageUrl && !player.imageUrl.startsWith('placeholder-file:')) imgDiv.style.backgroundImage = `url('${player.imageUrl}')`;
    else imgDiv.style.backgroundColor = '#aaa';
    imgContainer.appendChild(imgDiv);
    piece.appendChild(imgContainer);
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('player-name');
    nameDiv.textContent = player.name;
    piece.appendChild(nameDiv);
    piece.addEventListener('dragstart', handleDragStartPiece);
    piece.addEventListener('dragend', handleDragEnd);
    return piece;
}

function getPlayerById(playerId) {
    if (!playerId) return null;
    return squad.find(p => p.id === playerId) || null;
}
// === 4. Spillerbrikke Håndtering (på banen) END ===


// === 5. Drag and Drop Logikk START ===
function addDragListenersToSquadItems() { /* ... */ }
function addDragListenersToBenchItems() { /* ... */ }
function handleDragStart(event) { /* ... */ }
function handleDragStartBench(event) { /* ... */ }
function handleDragStartPiece(event) { /* ... */ }
function handleDragOver(event, targetType) { /* ... */ }
function handleDragLeave(event, targetType) { /* ... */ }
function handleDropOnPitch(event) { /* ... */ }
function handleDropOnBench(event) { /* ... */ }
function handleDragEnd(event) { /* ... */ }
function resetDragState() { /* ... */ }
// === 5. Drag and Drop Logikk END ===


// === 6. Lokal Lagring (localStorage) START ===
function saveSquad() { try { localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(squad)); } catch (e) { console.error("Feil ved lagring av tropp:", e); alert("Kunne ikke lagre troppen."); }}
function loadSquad() { /* ... */ }
function getCurrentStateData() { /* ... */ }
function saveCurrentState() { /* ... */ }
function applyState(stateData) { /* ... */ }
function loadLastState() { /* ... */ }
function clearPitch() { /* ... */ }
function getSavedSetups() { /* ... */ }
function handleSaveSetup() { /* ... */ }
function handleLoadSetup() { /* ... */ }
function handleDeleteSetup() { /* ... */ }
function populateSetupDropdown() { /* ... */ }
// === 6. Lokal Lagring (localStorage) END ===


// === 7. Event Listeners START ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initialiserer app...'); // DEBUG
    loadSquad();
    loadLastState();
    populateSetupDropdown();

    // Modal Listeners
    addPlayerButton.addEventListener('click', openAddPlayerModal);
    closeButton.addEventListener('click', closeAddPlayerModal);
    window.addEventListener('click', (event) => { if (event.target === addPlayerModal) closeAddPlayerModal(); });

    // --- DEBUGGING START ---
    if (confirmAddPlayerButton) {
         confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm);
         console.log('DOMContentLoaded: Event listener lagt til for confirmAddPlayerButton.');
    } else {
        console.error('DOMContentLoaded: Fant IKKE confirmAddPlayerButton!');
    }
    // --- DEBUGGING END ---


    // Drag and Drop Listeners
    pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch'));
    pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch'));
    pitchElement.addEventListener('drop', handleDropOnPitch);
    benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench'));
    benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench'));
    benchElement.addEventListener('drop', handleDropOnBench);

    // Lagre/Laste Oppsett Listeners
    saveSetupButton.addEventListener('click', handleSaveSetup);
    loadSetupButton.addEventListener('click', handleLoadSetup);
    deleteSetupButton.addEventListener('click', handleDeleteSetup);

    console.log('DOMContentLoaded: Initialisering ferdig.'); // DEBUG
});
// === 7. Event Listeners END ===

// Kopier inn resten av funksjonene fra forrige versjon her (fra Seksjon 5 og 6)
// Spesielt: addDragListeners..., handleDragStart..., handleDragOver/Leave/Drop/End, resetDragState, save/load funksjoner etc.
// Disse ble forkortet til /* ... */ for lesbarhet i denne kodesnutten.
