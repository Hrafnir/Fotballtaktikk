// === 0. Globale Variabler og Konstanter START ===
// Minimalt sett for testing
// let squad = [];
// let playersOnPitch = {};
// let playersOnBench = [];
// let nextPlayerId = 1;
// let draggedPlayerId = null;
// let draggedElement = null;
// let dragSource = null;
// let selectedPlayerIds = new Set();
// const MAX_PLAYERS_ON_PITCH = 11;
// const STORAGE_KEY_SQUAD = 'fotballtaktiker_squad';
// const STORAGE_KEY_LAST_STATE = 'fotballtaktiker_lastState';
// const STORAGE_KEY_SETUPS = 'fotballtaktiker_setups';
// === 0. Globale Variabler og Konstanter END ===


// === 1. DOM Element Referanser START ===
// Kun det vi trenger for modal-testing
console.log("DEBUG: Henter DOM-referanser...");
const addPlayerButton = document.getElementById('add-player-button');
const addPlayerModal = document.getElementById('add-player-modal');
const closeButton = addPlayerModal ? addPlayerModal.querySelector('.close-button') : null;
const newPlayerNameInput = document.getElementById('new-player-name');
const newPlayerImageUpload = document.getElementById('new-player-image-upload');
const newPlayerImageUrlInput = document.getElementById('new-player-image-url');
const newPlayerRoleInput = document.getElementById('new-player-role');
const confirmAddPlayerButton = document.getElementById('confirm-add-player');
console.log("DEBUG: DOM-referanser hentet.", { addPlayerButton, addPlayerModal, confirmAddPlayerButton });
// === 1. DOM Element Referanser END ===


// === 2. Modal Håndtering START ===
function openAddPlayerModal() {
    console.log('--- DEBUG: openAddPlayerModal START ---');
    if (!addPlayerModal) { console.error('--- DEBUG: addPlayerModal element er null! ---'); return; }
    console.log('--- DEBUG: Før: addPlayerModal.style.display =', addPlayerModal.style.display);
    addPlayerModal.style.display = 'block';
    console.log('--- DEBUG: Etter: addPlayerModal.style.display =', addPlayerModal.style.display);
    // Nullstill for enkelhets skyld
    if (newPlayerNameInput) newPlayerNameInput.value = '';
    if (newPlayerImageUrlInput) newPlayerImageUrlInput.value = '';
    if (newPlayerRoleInput) newPlayerRoleInput.value = '';
    if (newPlayerNameInput) newPlayerNameInput.focus();
    console.log('--- DEBUG: openAddPlayerModal END ---');
}

function closeAddPlayerModal() {
    console.log('--- DEBUG: closeAddPlayerModal START ---');
    if (addPlayerModal) { addPlayerModal.style.display = 'none'; }
    else { console.error("--- DEBUG: closeAddPlayerModal: addPlayerModal elementet er null! ---"); }
    console.log('--- DEBUG: closeAddPlayerModal END ---');
}

function handleAddPlayerConfirm() {
    // Minimal funksjon for testing
    console.log('--- DEBUG: handleAddPlayerConfirm START ---');
    const name = newPlayerNameInput.value.trim();
    console.log('--- DEBUG: Spiller navn:', name);
    if (!name) { alert('Navn må fylles ut.'); return; }
    alert(`Spiller "${name}" lagt til (kun test)`);
    // VI GJØR INGENTING MED DATA HER NÅ
    closeAddPlayerModal();
    console.log('--- DEBUG: handleAddPlayerConfirm END ---');
}
// === 2. Modal Håndtering END ===


// === 3. UI Rendering START ===
// KOMMENTERT UT MIDLERTIDIG
// function renderUI() { /* ... */ }
// function renderOnPitchList() { /* ... */ }
// function renderBench() { /* ... */ }
// function renderSquadList() { /* ... */ }
// === 3. UI Rendering END ===


// === 4. Spillerbrikke Håndtering START ===
// KOMMENTERT UT MIDLERTIDIG
// function createPlayerPieceElement(player, xPercent, yPercent) { /* ... */ }
// function getPlayerById(playerId) { /* ... */ }
// === 4. Spillerbrikke Håndtering END ===


// === 5. Drag and Drop & Valg/Farge START ===
// KOMMENTERT UT MIDLERTIDIG
// function addDragListenersToSquadItems() { /* ... */ }
// function addDragListenersToBenchItems() { /* ... */ }
// function handleDragStart(event) { /* ... */ }
// function handleDragStartBench(event) { /* ... */ }
// function handleDragStartPiece(event) { /* ... */ }
// function handleDragOver(event, targetType) { /* ... */ }
// function handleDragLeave(event, targetType) { /* ... */ }
// function handleDropOnPitch(event) { /* ... */ }
// function handleDropOnBench(event) { /* ... */ }
// function handleDropOnSquadList(event) { /* ... */ }
// function handleDragEnd(event) { /* ... */ }
// function resetDragState() { /* ... */ }
// function handlePlayerPieceClick(event) { /* ... */ }
// function clearPlayerSelection() { /* ... */ }
// function handleSetSelectedPlayerBorderColor() { /* ... */ }
// === 5. Drag and Drop & Valg/Farge END ===


// === 6. Lokal Lagring START ===
// KOMMENTERT UT MIDLERTIDIG
// function saveSquad() { /* ... */ }
// function loadSquad() { /* ... */ }
// function getCurrentStateData() { /* ... */ }
// function saveCurrentState() { /* ... */ }
// function applyState(stateData) { /* ... */ }
// function loadLastState() { /* ... */ }
// function clearPitch() { /* ... */ }
// function getSavedSetups() { /* ... */ }
// function handleSaveSetup() { /* ... */ }
// function handleLoadSetup() { /* ... */ }
// function handleDeleteSetup() { /* ... */ }
// function populateSetupDropdown() { /* ... */ }
// === 6. Lokal Lagring END ===


// === 7. Event Listeners START ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('--- DEBUG: DOMContentLoaded START ---');

    // KOMMENTERT UT lasting av data
    // loadSquad();
    // loadLastState();
    // populateSetupDropdown();

    // --- Minimal Modal Listeners ---
    if (addPlayerButton) {
        addPlayerButton.addEventListener('click', () => {
            console.log("--- DEBUG: 'Legg til Spiller'-knapp klikket! ---");
            openAddPlayerModal();
        });
        console.log("--- DEBUG: Listener: addPlayerButton OK ---");
    } else { console.error("--- DEBUG: addPlayerButton ikke funnet! ---"); }

    if (closeButton) {
        closeButton.addEventListener('click', closeAddPlayerModal);
        console.log("--- DEBUG: Listener: closeButton OK ---");
    } else { console.error("--- DEBUG: closeButton ikke funnet! ---"); }

    if (confirmAddPlayerButton) {
         confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm); // Bruker forenklet funksjon
         console.log('--- DEBUG: Listener: confirmAddPlayerButton OK ---');
    } else { console.error('--- DEBUG: confirmAddPlayerButton ikke funnet! ---'); }

    window.addEventListener('click', (event) => {
        if (event.target === addPlayerModal) {
            console.log("--- DEBUG: Klikket utenfor addPlayerModal ---");
            closeAddPlayerModal();
        }
        // if (event.target === playerDetailModal) closePlayerDetailModal(); // Kommentert ut
        // if (!event.target.closest('.player-piece') && selectedPlayerIds.size > 0) { clearPlayerSelection(); } // Kommentert ut
    });

    // --- Andre Listeners (Kommentert ut) ---
    // pitchElement listeners...
    // benchElement listeners...
    // squadListContainer listeners...
    // setBorderColorButton listener...
    // save/load/delete setup listeners...

    console.log('--- DEBUG: DOMContentLoaded END ---');
});
// === 7. Event Listeners END ===
