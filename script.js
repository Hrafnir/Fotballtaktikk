// === 0. Globale Variabler og Konstanter START ===
// (Som før)
let squad = [];
let playersOnPitch = {};
let playersOnBench = [];
let nextPlayerId = 1;
let draggedPlayerId = null;
let draggedElement = null;
let dragSource = null;
const MAX_PLAYERS_ON_PITCH = 11;
const STORAGE_KEY_SQUAD = 'fotballtaktiker_squad';
const STORAGE_KEY_LAST_STATE = 'fotballtaktiker_lastState';
const STORAGE_KEY_SETUPS = 'fotballtaktiker_setups';
// === 0. Globale Variabler og Konstanter END ===


// === 1. DOM Element Referanser START ===
// (Som før)
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
function openAddPlayerModal() { /* ... (som før) ... */ }
function closeAddPlayerModal() { /* ... (som før) ... */ }
function handleAddPlayerConfirm() { /* ... (som før) ... */ }
// === 2. Modal Håndtering END ===


// === 3. UI Rendering START ===
// (renderUI, renderOnPitchList, renderBench, renderSquadList som før)
function renderUI() { /* ... */ }
function renderOnPitchList() { /* ... */ }
function renderBench() { /* ... */ }
function renderSquadList() { /* ... */ }
// === 3. UI Rendering END ===


// === 4. Spillerbrikke Håndtering START ===
// (createPlayerPieceElement, getPlayerById som før)
function createPlayerPieceElement(player, xPercent, yPercent) { /* ... */ }
function getPlayerById(playerId) { /* ... */ }
// === 4. Spillerbrikke Håndtering END ===


// === 5. Drag and Drop Logikk START ===
// (Alle drag/drop funksjoner som før)
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


// === 6. Lokal Lagring START ===
// (Alle lagringsfunksjoner som før)
function saveSquad() { /* ... */ }
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
// === 6. Lokal Lagring END ===


// === 7. Event Listeners START ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initialiserer app...');
    loadSquad();
    loadLastState();
    populateSetupDropdown();

    // --- Modal Listeners ---
    addPlayerButton.addEventListener('click', () => {
        console.log("ENKEL TEST: 'Legg til Spiller'-knappen ble klikket!"); // ENKEL TEST
        openAddPlayerModal();
    });
    closeButton.addEventListener('click', closeAddPlayerModal);
    window.addEventListener('click', (event) => { if (event.target === addPlayerModal) closeAddPlayerModal(); });
     if (confirmAddPlayerButton) {
         confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm);
         console.log('DOMContentLoaded: Event listener lagt til for confirmAddPlayerButton.');
    } else {
        console.error('DOMContentLoaded: Fant IKKE confirmAddPlayerButton!');
    }

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
    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 7. Event Listeners END ===

// Lim inn resten av funksjonene fra forrige script.js her (spesielt Seksjon 3, 4, 5, 6)
