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
// (Samme som før)
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

function handleAddPlayerConfirm() {
    console.log('handleAddPlayerConfirm: Funksjonen startet.');
    const name = newPlayerNameInput.value.trim();
    const imageFile = newPlayerImageUpload.files[0]; // Hentes, men brukes kun for console.warn
    let imageUrl = newPlayerImageUrlInput.value.trim();
    const role = newPlayerRoleInput.value.trim();
    console.log('handleAddPlayerConfirm: Data fra modal:', { name, imageUrl, role, imageFile });

    if (!name) { console.log('handleAddPlayerConfirm: Navn mangler, avbryter.'); alert('Spillernavn må fylles ut.'); return; }

    let finalImageUrl = '';
    if (imageUrl) { finalImageUrl = imageUrl; }
    else if (imageFile) { console.warn("Filopplasting støttes ikke for lagring enda. Bruk URL."); }

    const maxId = squad.reduce((max, p) => Math.max(max, parseInt(p.id.split('-')[1])), 0);
    nextPlayerId = maxId + 1;

    // FIKS: Fjern imageFile fra objektet som skal lagres
    const newPlayer = {
        id: `player-${nextPlayerId}`,
        name: name,
        imageUrl: finalImageUrl, // Lagrer URL eller tom streng
        role: role,
        position: { x: 50, y: 50 },
        borderColor: 'black'
        // IKKE inkluder imageFile her!
    };
    console.log('handleAddPlayerConfirm: Opprettet spillerobjekt:', newPlayer);

    squad.push(newPlayer);
    console.log('handleAddPlayerConfirm: Spiller lagt til i squad array:', squad);

    saveSquad(); // Prøver å lagre
    console.log('handleAddPlayerConfirm: saveSquad() kalt.');

    renderUI();
    console.log('handleAddPlayerConfirm: renderUI() kalt.');

    closeAddPlayerModal();
    console.log('handleAddPlayerConfirm: closeAddPlayerModal() kalt, funksjonen avslutter.');
}
// === 2. Modal Håndtering END ===


// === 3. UI Rendering (Oppdatering av Grensesnitt) START ===
// (renderUI, renderOnPitchList, renderBench, renderSquadList som før)
function renderUI() { /* ... */ }
function renderOnPitchList() { /* ... */ }
function renderBench() { /* ... */ }
function renderSquadList() { /* ... */ }
// === 3. UI Rendering (Oppdatering av Grensesnitt) END ===


// === 4. Spillerbrikke Håndtering (på banen) START ===
// (createPlayerPieceElement, getPlayerById som før)
function createPlayerPieceElement(player, xPercent, yPercent) { /* ... */ }
function getPlayerById(playerId) { /* ... */ }
// === 4. Spillerbrikke Håndtering (på banen) END ===


// === 5. Drag and Drop Logikk START ===
function addDragListenersToSquadItems() {
    const items = squadListElement.querySelectorAll('.squad-player-item.draggable');
    // DEBUG: Logg antall elementer funnet
    console.log(`addDragListenersToSquadItems: Fant ${items.length} squad items for listeners.`);
    items.forEach(item => {
        const playerId = item.getAttribute('data-player-id'); // For logging
        // DEBUG: Logg for hvert element
        // console.log(`addDragListenersToSquadItems: Legger til listener for ${playerId}`);
        item.removeEventListener('dragstart', handleDragStart);
        item.addEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function addDragListenersToBenchItems() { /* ... (som før) ... */ }

function handleDragStart(event) {
    // DEBUG: Logg starten av drag
    console.log("handleDragStart: Drag startet på element:", event.target);
    draggedPlayerId = event.target.getAttribute('data-player-id');
    console.log("handleDragStart: Player ID:", draggedPlayerId);
    const player = getPlayerById(draggedPlayerId); // Hent spiller for å sjekke

    if (!player) {
        console.error("handleDragStart: Kunne ikke finne spiller for ID:", draggedPlayerId, "Avbryter drag.");
        event.preventDefault(); return;
     }
    console.log("handleDragStart: Fant spiller:", player);

    draggedElement = event.target;
    dragSource = 'squad';
    try {
        event.dataTransfer.setData('text/plain', draggedPlayerId);
        console.log("handleDragStart: dataTransfer.setData satt for", draggedPlayerId);
    } catch (e) {
        console.error("handleDragStart: Feil ved setData:", e);
        event.preventDefault(); // Avbryt hvis setData feiler
        return;
    }
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0);
}

function handleDragStartBench(event) { /* ... (som før) ... */ }
function handleDragStartPiece(event) { /* ... (som før) ... */ }
function handleDragOver(event, targetType) { /* ... (som før) ... */ }
function handleDragLeave(event, targetType) { /* ... (som før) ... */ }
function handleDropOnPitch(event) { /* ... (som før) ... */ }
function handleDropOnBench(event) { /* ... (som før) ... */ }
function handleDragEnd(event) { /* ... (som før) ... */ }
function resetDragState() { /* ... (som før) ... */ }
// === 5. Drag and Drop Logikk END ===


// === 6. Lokal Lagring (localStorage) START ===
function saveSquad() {
    console.log("saveSquad: Prøver å lagre squad:", squad); // DEBUG
    try {
        const squadJson = JSON.stringify(squad);
        // DEBUG: Sjekk om JSON er OK før lagring
        console.log("saveSquad: squad JSON:", squadJson);
        localStorage.setItem(STORAGE_KEY_SQUAD, squadJson);
        console.log("saveSquad: Lagring i localStorage ser ut til å ha gått bra."); // DEBUG
    } catch (e) {
        console.error("Feil ved lagring av tropp (JSON.stringify eller setItem):", e);
        alert("Kunne ikke lagre troppen.");
    }
}

function loadSquad() {
    const savedSquadJson = localStorage.getItem(STORAGE_KEY_SQUAD);
    console.log("loadSquad: Hentet rådata fra localStorage:", savedSquadJson); // DEBUG
    if (savedSquadJson) {
        try {
            const parsedSquad = JSON.parse(savedSquadJson);
            squad = parsedSquad; // Oppdater global variabel
            console.log("loadSquad: Parsed squad successfully:", squad); // DEBUG
            const maxId = squad.reduce((max, p) => {
                // Legg til sjekk for gyldig ID format
                const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0;
                return Math.max(max, !isNaN(idNum) ? idNum : 0);
            }, 0);
            nextPlayerId = maxId + 1;
            console.log("loadSquad: Next player ID satt til:", nextPlayerId); // DEBUG
            return true;
        } catch (e) {
            console.error("Feil ved parsing av lagret tropp:", e);
            squad = []; // Tilbakestill ved feil
            localStorage.removeItem(STORAGE_KEY_SQUAD); // Fjern ugyldig data
            return false;
        }
    }
    console.log("Ingen tropp funnet i localStorage.");
    squad = []; // Sørg for at squad er tom hvis ingenting lastes
    return false;
}

// (Resten av lagringsfunksjonene: getCurrentStateData, saveCurrentState, applyState, loadLastState, clearPitch, getSavedSetups, handleSave/Load/DeleteSetup, populateSetupDropdown forblir som før)
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
// (Samme som før, inkludert logging)
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initialiserer app...');
    loadSquad();
    loadLastState();
    populateSetupDropdown();

    addPlayerButton.addEventListener('click', openAddPlayerModal);
    closeButton.addEventListener('click', closeAddPlayerModal);
    window.addEventListener('click', (event) => { if (event.target === addPlayerModal) closeAddPlayerModal(); });
    if (confirmAddPlayerButton) { confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm); console.log('DOMContentLoaded: Event listener lagt til for confirmAddPlayerButton.'); }
    else { console.error('DOMContentLoaded: Fant IKKE confirmAddPlayerButton!'); }

    pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch'));
    pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch'));
    pitchElement.addEventListener('drop', handleDropOnPitch);
    benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench'));
    benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench'));
    benchElement.addEventListener('drop', handleDropOnBench);
    saveSetupButton.addEventListener('click', handleSaveSetup);
    loadSetupButton.addEventListener('click', handleLoadSetup);
    deleteSetupButton.addEventListener('click', handleDeleteSetup);
    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 7. Event Listeners END ===

// Lim inn resten av funksjonene fra forrige script.js her (spesielt Seksjon 3, 4, 5, 6)
