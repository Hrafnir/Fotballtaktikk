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
// Lister i sidebar
const onPitchListElement = document.getElementById('on-pitch-list'); // NY
const benchListElement = document.getElementById('bench-list');
const squadListElement = document.getElementById('squad-list');
// Telleverk i sidebar
const onPitchCountElement = document.getElementById('on-pitch-count'); // NY
const onBenchCountElement = document.getElementById('on-bench-count'); // NY
// Drop targets
const pitchElement = document.getElementById('pitch');
const benchElement = document.getElementById('bench'); // Selve benk-diven (drop target)
// Knapper og inputs
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
// Andre elementer
const pitchContainer = document.getElementById('pitch-container');
const drawingCanvas = document.getElementById('drawing-canvas');
const ballElement = document.getElementById('ball');
// Modal
const addPlayerModal = document.getElementById('add-player-modal');
const closeButton = addPlayerModal.querySelector('.close-button');
const newPlayerNameInput = document.getElementById('new-player-name');
const newPlayerImageUpload = document.getElementById('new-player-image-upload');
const newPlayerImageUrlInput = document.getElementById('new-player-image-url');
const newPlayerRoleInput = document.getElementById('new-player-role');
const confirmAddPlayerButton = document.getElementById('confirm-add-player');
// === 1. DOM Element Referanser END ===


// === 2. Modal Håndtering START ===
// (Ingen endringer her, behold som før)
function openAddPlayerModal() { /* ... */ }
function closeAddPlayerModal() { /* ... */ }
function handleAddPlayerConfirm() {
    const name = newPlayerNameInput.value.trim();
    const imageFile = newPlayerImageUpload.files[0];
    let imageUrl = newPlayerImageUrlInput.value.trim();
    const role = newPlayerRoleInput.value.trim();

    if (!name) { alert('Spillernavn må fylles ut.'); return; }
    let finalImageUrl = '';
    if (imageUrl) finalImageUrl = imageUrl;
    else if (imageFile) console.warn("Filopplasting støttes ikke for lagring enda. Bruk URL.");

    const maxId = squad.reduce((max, p) => Math.max(max, parseInt(p.id.split('-')[1])), 0);
    nextPlayerId = maxId + 1;
    const newPlayer = {
        id: `player-${nextPlayerId}`,
        name: name, imageUrl: finalImageUrl, role: role,
        position: { x: 50, y: 50 }, borderColor: 'black'
    };

    squad.push(newPlayer);
    saveSquad();
    renderUI();
    closeAddPlayerModal();
    console.log("Spiller lagt til, tropp lagret.");
}
// === 2. Modal Håndtering END ===


// === 3. UI Rendering (Oppdatering av Grensesnitt) START ===

/**
 * Hovedfunksjon for å rendre hele sidebar UI basert på gjeldende state.
 */
function renderUI() {
    renderOnPitchList(); // NY
    renderBench();
    renderSquadList(); // Tilgjengelige spillere
    // Oppdater tellere
    onPitchCountElement.textContent = Object.keys(playersOnPitch).length;
    onBenchCountElement.textContent = playersOnBench.length;
}

/**
 * Oppdaterer listen over spillere PÅ BANEN i sidepanelet.
 */
function renderOnPitchList() {
    onPitchListElement.innerHTML = ''; // Tøm listen først
    const playerIdsOnPitch = Object.keys(playersOnPitch);

    if (playerIdsOnPitch.length === 0) {
        onPitchListElement.innerHTML = '<li><i>Ingen spillere på banen.</i></li>';
        return;
    }

    // Sorter etter navn (eller annen logikk hvis ønskelig)
    const sortedPlayers = playerIdsOnPitch
        .map(id => getPlayerById(id))
        .filter(p => p) // Fjern evt. null verdier
        .sort((a, b) => a.name.localeCompare(b.name));

    sortedPlayers.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = player.name + (player.role ? ` (${player.role})` : '');
        listItem.setAttribute('data-player-id', player.id);
        listItem.classList.add('on-pitch-player-item'); // Egen klasse for styling/identifikasjon
        // listItem.setAttribute('draggable', false); // Unødvendig, ikke dragbart som standard
        // TODO: Legg til visuell indikator for valg (for fargeendring)?
        onPitchListElement.appendChild(listItem);
    });
     // Ingen drag listeners her
}


/**
 * Oppdaterer visningen av spillere PÅ BENKEN.
 */
function renderBench() {
    benchListElement.innerHTML = ''; // Tøm listen først

    if (playersOnBench.length === 0) {
        benchListElement.innerHTML = '<li><i>Benken er tom.</i></li>';
        return;
    }

    // Sorter etter navn
     const sortedPlayers = playersOnBench
        .map(id => getPlayerById(id))
        .filter(p => p)
        .sort((a, b) => a.name.localeCompare(b.name));

    sortedPlayers.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = player.name + (player.role ? ` (${player.role})` : '');
        listItem.setAttribute('data-player-id', player.id);
        listItem.classList.add('bench-player-item', 'draggable');
        listItem.setAttribute('draggable', true);
        benchListElement.appendChild(listItem);
    });
    addDragListenersToBenchItems(); // Legg til drag listeners
}


/**
 * Oppdaterer HTML-listen over spillere i TROPPEN (tilgjengelige).
 * Viser kun spillere som IKKE er på banen OG IKKE på benken.
 */
function renderSquadList() {
    squadListElement.innerHTML = ''; // Tøm listen først
    const availablePlayers = squad
        .filter(p => !playersOnPitch[p.id] && !playersOnBench.includes(p.id))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sorter etter navn

    if (availablePlayers.length === 0 && squad.length > 0) {
         squadListElement.innerHTML = '<li><i>Alle spillere er plassert.</i></li>';
    } else if (squad.length === 0) {
        squadListElement.innerHTML = '<li><i>Ingen spillere i troppen.</i></li>';
    } else {
        availablePlayers.forEach(player => {
            const listItem = document.createElement('li');
            listItem.textContent = player.name + (player.role ? ` (${player.role})` : '');
            listItem.setAttribute('data-player-id', player.id);
            listItem.classList.add('squad-player-item', 'draggable');
            listItem.setAttribute('draggable', true);
            squadListElement.appendChild(listItem);
        });
    }
     addDragListenersToSquadItems(); // Legg til drag listeners
}

// === 3. UI Rendering (Oppdatering av Grensesnitt) END ===


// === 4. Spillerbrikke Håndtering (på banen) START ===
// (Ingen endringer her, behold createPlayerPieceElement, getPlayerById som før)
function createPlayerPieceElement(player, xPercent, yPercent) { /* ... */ }
function getPlayerById(playerId) { /* ... */ }
// === 4. Spillerbrikke Håndtering (på banen) END ===


// === 5. Drag and Drop Logikk START ===
// (Ingen endringer her, logikken forblir den samme)
function addDragListenersToSquadItems() { /* ... */ }
function addDragListenersToBenchItems() { /* ... */ }
function handleDragStart(event) { /* ... */ }
function handleDragStartBench(event) { /* ... */ }
function handleDragStartPiece(event) { /* ... */ }
function handleDragOver(event, targetType) { /* ... */ }
function handleDragLeave(event, targetType) { /* ... */ }
function handleDropOnPitch(event) { /* ... Kall renderUI() og saveCurrentState() ... */ }
function handleDropOnBench(event) { /* ... Kall renderUI() og saveCurrentState() ... */ }
function handleDragEnd(event) { /* ... */ }
function resetDragState() { /* ... */ }
// === 5. Drag and Drop Logikk END ===


// === 6. Lokal Lagring (localStorage) START ===
// (Ingen endringer her, logikken forblir den samme)
function saveSquad() { /* ... */ }
function loadSquad() { /* ... */ }
function getCurrentStateData() { /* ... */ }
function saveCurrentState() { /* ... */ }
function applyState(stateData) { /* ... Kall renderUI() ... */ }
function loadLastState() { /* ... Kall applyState() ... */ }
function clearPitch() { /* ... */ }
function getSavedSetups() { /* ... */ }
function handleSaveSetup() { /* ... Kall populateSetupDropdown() ... */ }
function handleLoadSetup() { /* ... Kall applyState() og saveCurrentState() ... */ }
function handleDeleteSetup() { /* ... Kall populateSetupDropdown() ... */ }
function populateSetupDropdown() { /* ... */ }
// === 6. Lokal Lagring (localStorage) END ===


// === 7. Event Listeners START ===
document.addEventListener('DOMContentLoaded', () => {
    // --- Last inn data ved oppstart ---
    loadSquad();
    loadLastState(); // Denne kaller applyState som nå bør kalle renderUI()
    populateSetupDropdown();

    // --- Modal Listeners ---
    addPlayerButton.addEventListener('click', openAddPlayerModal);
    closeButton.addEventListener('click', closeAddPlayerModal);
    window.addEventListener('click', (event) => { if (event.target === addPlayerModal) closeAddPlayerModal(); });
    confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm);

    // --- Drag and Drop Listeners ---
    pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch'));
    pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch'));
    pitchElement.addEventListener('drop', handleDropOnPitch);
    benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench'));
    benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench'));
    benchElement.addEventListener('drop', handleDropOnBench);

    // --- Lagre/Laste Oppsett Listeners ---
    saveSetupButton.addEventListener('click', handleSaveSetup);
    loadSetupButton.addEventListener('click', handleLoadSetup);
    deleteSetupButton.addEventListener('click', handleDeleteSetup);

    // --- Andre Listeners ---
    // TODO: Fargevalg, tegning, ball etc.

    // Initial UI render skjer nå som del av loadLastState/applyState
});
// === 7. Event Listeners END ===


// === RESTEN AV KODEN (uendret) ===
// Funksjonene inni Seksjon 2, 4, 5, 6 beholdes slik de var i forrige svar,
// med unntak av at applyState og drop-funksjonene nå kaller renderUI()
// for å oppdatere alle tre listene.
