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
    // --- DEBUGGING START ---
    console.log('openAddPlayerModal: Funksjonen startet.');
    if (!addPlayerModal) {
        console.error('openAddPlayerModal: FEIL - addPlayerModal elementet er null!');
        return; // Avslutt hvis elementet ikke finnes
    }
    console.log('openAddPlayerModal: Prøver å sette display til block for:', addPlayerModal);
    // --- DEBUGGING END ---

    addPlayerModal.style.display = 'block';

    // --- DEBUGGING START ---
    console.log('openAddPlayerModal: Display satt til block. Nåværende display stil:', window.getComputedStyle(addPlayerModal).display);
    console.log('openAddPlayerModal: Nullstiller felter...');
    // --- DEBUGGING END ---

    // Nullstill felter (sjekk om disse finnes også for sikkerhets skyld)
    if (newPlayerNameInput) newPlayerNameInput.value = ''; else console.warn("openAddPlayerModal: newPlayerNameInput ikke funnet");
    if (newPlayerImageUpload) newPlayerImageUpload.value = ''; else console.warn("openAddPlayerModal: newPlayerImageUpload ikke funnet");
    if (newPlayerImageUrlInput) newPlayerImageUrlInput.value = ''; else console.warn("openAddPlayerModal: newPlayerImageUrlInput ikke funnet");
    if (newPlayerRoleInput) newPlayerRoleInput.value = ''; else console.warn("openAddPlayerModal: newPlayerRoleInput ikke funnet");

    // --- DEBUGGING START ---
    console.log('openAddPlayerModal: Felter nullstilt. Setter fokus...');
    // --- DEBUGGING END ---
    if (newPlayerNameInput) newPlayerNameInput.focus();

    // --- DEBUGGING START ---
    console.log('openAddPlayerModal: Funksjonen ferdig.');
    // --- DEBUGGING END ---
}

function closeAddPlayerModal() {
    if (addPlayerModal) {
        addPlayerModal.style.display = 'none';
    } else {
        console.error("closeAddPlayerModal: addPlayerModal elementet er null!");
    }
}

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


// === 3. UI Rendering START ===
/**
 * Hovedfunksjon for å rendre hele sidebar UI basert på gjeldende state.
 */
function renderUI() {
    renderOnPitchList();
    renderBench();
    renderSquadList();
    if(onPitchCountElement) onPitchCountElement.textContent = Object.keys(playersOnPitch).length;
    if(onBenchCountElement) onBenchCountElement.textContent = playersOnBench.length;
}

/**
 * Oppdaterer listen over spillere PÅ BANEN i sidepanelet.
 */
function renderOnPitchList() {
    if (!onPitchListElement) return; // Sjekk om elementet finnes
    onPitchListElement.innerHTML = '';
    const playerIdsOnPitch = Object.keys(playersOnPitch);

    if (playerIdsOnPitch.length === 0) {
        onPitchListElement.innerHTML = '<li><i>Ingen spillere på banen.</i></li>';
        return;
    }

    const sortedPlayers = playerIdsOnPitch
        .map(id => getPlayerById(id))
        .filter(p => p)
        .sort((a, b) => a.name.localeCompare(b.name));

    sortedPlayers.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = player.name + (player.role ? ` (${player.role})` : '');
        listItem.setAttribute('data-player-id', player.id);
        listItem.classList.add('on-pitch-player-item');
        onPitchListElement.appendChild(listItem);
    });
}

/**
 * Oppdaterer visningen av spillere PÅ BENKEN.
 */
function renderBench() {
    if (!benchListElement) return; // Sjekk om elementet finnes
    benchListElement.innerHTML = '';

    if (playersOnBench.length === 0) {
        benchListElement.innerHTML = '<li><i>Benken er tom.</i></li>';
        return;
    }

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
    addDragListenersToBenchItems();
}

/**
 * Oppdaterer HTML-listen over spillere i TROPPEN (tilgjengelige).
 */
function renderSquadList() {
    if (!squadListElement) return; // Sjekk om elementet finnes
    squadListElement.innerHTML = '';
    const availablePlayers = squad
        .filter(p => !playersOnPitch[p.id] && !playersOnBench.includes(p.id))
        .sort((a, b) => a.name.localeCompare(b.name));

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
// === 3. UI Rendering END ===


// === 4. Spillerbrikke Håndtering START ===
/**
 * Lager et nytt DOM-element for en spillerbrikke på banen.
 */
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

/**
 * Finner spillerobjektet basert på ID.
 */
function getPlayerById(playerId) {
    if (!playerId) return null;
    return squad.find(p => p.id === playerId) || null;
}
// === 4. Spillerbrikke Håndtering END ===


// === 5. Drag and Drop Logikk START ===
function addDragListenersToSquadItems() {
    if (!squadListElement) return;
    const items = squadListElement.querySelectorAll('.squad-player-item.draggable');
    console.log(`addDragListenersToSquadItems: Fant ${items.length} squad items for listeners.`); // DEBUG
    items.forEach(item => {
        item.removeEventListener('dragstart', handleDragStart);
        item.addEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function addDragListenersToBenchItems() {
     if (!benchListElement) return;
    const items = benchListElement.querySelectorAll('.bench-player-item.draggable');
    items.forEach(item => {
        item.removeEventListener('dragstart', handleDragStartBench);
        item.addEventListener('dragstart', handleDragStartBench);
        item.removeEventListener('dragend', handleDragEnd);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(event) {
    console.log("handleDragStart: Drag startet på element:", event.target); // DEBUG
    draggedPlayerId = event.target.getAttribute('data-player-id');
    console.log("handleDragStart: Player ID:", draggedPlayerId); // DEBUG
    const player = getPlayerById(draggedPlayerId);
    if (!player) { console.error("handleDragStart: Fant ikke spiller ID:", draggedPlayerId); event.preventDefault(); return; }
    console.log("handleDragStart: Fant spiller:", player); // DEBUG

    draggedElement = event.target;
    dragSource = 'squad';
    try {
        event.dataTransfer.setData('text/plain', draggedPlayerId);
        console.log("handleDragStart: dataTransfer.setData satt for", draggedPlayerId); // DEBUG
    } catch (e) { console.error("handleDragStart: Feil ved setData:", e); event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0);
}

function handleDragStartBench(event) {
    draggedPlayerId = event.target.getAttribute('data-player-id');
     if (!getPlayerById(draggedPlayerId)) { console.error("handleDragStartBench: Fant ikke spiller ID:", draggedPlayerId); event.preventDefault(); return; }
    draggedElement = event.target;
    dragSource = 'bench';
    event.dataTransfer.setData('text/plain', draggedPlayerId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0);
}

function handleDragStartPiece(event) {
    const pieceElement = event.target.closest('.player-piece');
    if (!pieceElement) return;
    draggedPlayerId = pieceElement.getAttribute('data-player-id');
     if (!getPlayerById(draggedPlayerId)) { console.error("handleDragStartPiece: Fant ikke spiller ID:", draggedPlayerId); event.preventDefault(); return; }
    draggedElement = pieceElement;
    dragSource = 'pitch';
    event.dataTransfer.setData('text/plain', draggedPlayerId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0);
    event.stopPropagation();
}

function handleDragOver(event, targetType) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const targetElement = (targetType === 'pitch') ? pitchElement : benchElement;
    if(targetElement) targetElement.classList.add('drag-over');
}

function handleDragLeave(event, targetType) {
     const relatedTarget = event.relatedTarget;
     const targetElement = (targetType === 'pitch') ? pitchElement : benchElement;
     if (!targetElement) return;
     // Forlater vi til utsiden av målet?
     if (!relatedTarget || !targetElement.contains(relatedTarget)) {
        targetElement.classList.remove('drag-over');
     }
}

function handleDropOnPitch(event) {
    event.preventDefault();
    if (pitchElement) pitchElement.classList.remove('drag-over');
    let playerId;
    try { playerId = event.dataTransfer.getData('text/plain'); }
    catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; }
    if (!playerId) { console.warn("Drop on Pitch: Mottok tom playerId."); resetDragState(); return; }
    const player = getPlayerById(playerId);
    if (!player) { console.error("Drop on Pitch: Fant ikke spiller ID:", playerId); resetDragState(); return; }

    if ( (dragSource === 'squad' || dragSource === 'bench') && Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH ) {
        alert(`Maks ${MAX_PLAYERS_ON_PITCH} spillere på banen.`); resetDragState(); return;
    }

    const pitchRect = pitchElement.getBoundingClientRect();
    const dropX = event.clientX - pitchRect.left;
    const dropY = event.clientY - pitchRect.top;
    const xPercent = Math.max(0, Math.min(100, (dropX / pitchRect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (dropY / pitchRect.height) * 100));
    player.position = { x: xPercent, y: yPercent };

    let stateChanged = false;
    if (playersOnPitch[playerId]) {
        const piece = playersOnPitch[playerId];
        piece.style.left = `${xPercent}%`; piece.style.top = `${yPercent}%`;
        stateChanged = true;
    } else {
        const newPiece = createPlayerPieceElement(player, xPercent, yPercent);
        if (pitchElement) pitchElement.appendChild(newPiece);
        playersOnPitch[playerId] = newPiece;
        if (dragSource === 'bench') {
            const benchIndex = playersOnBench.indexOf(playerId);
            if (benchIndex > -1) { playersOnBench.splice(benchIndex, 1); }
        }
        stateChanged = true;
    }

    if (stateChanged) { saveCurrentState(); renderUI(); }
    resetDragState();
}

function handleDropOnBench(event) {
    event.preventDefault();
    if (benchElement) benchElement.classList.remove('drag-over');
    let playerId;
     try { playerId = event.dataTransfer.getData('text/plain'); }
     catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; }
     if (!playerId) { console.warn("Drop on Bench: Mottok tom playerId."); resetDragState(); return; }
    const player = getPlayerById(playerId);
    if (!player) { console.error("Drop on Bench: Fant ikke spiller ID:", playerId); resetDragState(); return; }

    let stateChanged = false;
    if (dragSource === 'pitch') {
        if (!playersOnBench.includes(playerId)) { playersOnBench.push(playerId); }
        if (playersOnPitch[playerId]) {
            playersOnPitch[playerId].remove(); delete playersOnPitch[playerId];
            stateChanged = true;
        }
    }
    if (stateChanged) { saveCurrentState(); renderUI(); }
    resetDragState();
}

function handleDragEnd(event) {
    setTimeout(() => {
        if (draggedElement && draggedElement.classList.contains('dragging')) {
           draggedElement.classList.remove('dragging');
        }
        if(pitchElement) pitchElement.classList.remove('drag-over');
        if(benchElement) benchElement.classList.remove('drag-over');
        resetDragState();
    }, 0);
}

function resetDragState() {
    draggedPlayerId = null;
    draggedElement = null;
    dragSource = null;
}
// === 5. Drag and Drop Logikk END ===


// === 6. Lokal Lagring START ===
function saveSquad() {
    console.log("saveSquad: Prøver å lagre squad:", squad); // DEBUG
    try {
        const squadJson = JSON.stringify(squad);
        console.log("saveSquad: squad JSON:", squadJson); // DEBUG
        localStorage.setItem(STORAGE_KEY_SQUAD, squadJson);
        console.log("saveSquad: Lagring i localStorage ser ut til å ha gått bra."); // DEBUG
    } catch (e) { console.error("Feil ved lagring av tropp:", e); alert("Kunne ikke lagre troppen."); }
}

function loadSquad() {
    const savedSquadJson = localStorage.getItem(STORAGE_KEY_SQUAD);
    console.log("loadSquad: Hentet rådata fra localStorage:", savedSquadJson); // DEBUG
    if (savedSquadJson) {
        try {
            const parsedSquad = JSON.parse(savedSquadJson);
            squad = parsedSquad;
            console.log("loadSquad: Parsed squad successfully:", squad); // DEBUG
            const maxId = squad.reduce((max, p) => {
                const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0;
                return Math.max(max, !isNaN(idNum) ? idNum : 0);
            }, 0);
            nextPlayerId = maxId + 1;
            console.log("loadSquad: Next player ID satt til:", nextPlayerId); // DEBUG
            return true;
        } catch (e) {
            console.error("Feil ved parsing av lagret tropp:", e);
            squad = []; localStorage.removeItem(STORAGE_KEY_SQUAD); return false;
        }
    }
    console.log("Ingen tropp funnet i localStorage.");
    squad = []; return false;
}

function getCurrentStateData() {
    const playersOnPitchData = {};
    for (const playerId in playersOnPitch) {
        const player = getPlayerById(playerId);
        if (player) {
            playersOnPitchData[playerId] = { x: player.position.x, y: player.position.y, borderColor: player.borderColor };
        }
    }
    return { playersOnPitchData: playersOnPitchData, playersOnBenchIds: [...playersOnBench] };
}

function saveCurrentState() {
    try {
        const stateData = getCurrentStateData();
        localStorage.setItem(STORAGE_KEY_LAST_STATE, JSON.stringify(stateData));
    } catch (e) { console.error("Feil ved lagring av siste tilstand:", e); }
}

function applyState(stateData) {
    if (!stateData) return;
    clearPitch();
    playersOnPitch = {}; playersOnBench = [];

    if (stateData.playersOnPitchData) {
        for (const playerId in stateData.playersOnPitchData) {
            const player = getPlayerById(playerId);
            const positionData = stateData.playersOnPitchData[playerId];
            if (player && positionData) {
                 player.position = { x: positionData.x, y: positionData.y };
                 player.borderColor = positionData.borderColor || 'black';
                 const piece = createPlayerPieceElement(player, player.position.x, player.position.y);
                 if(pitchElement) pitchElement.appendChild(piece);
                 playersOnPitch[playerId] = piece;
            } else { console.warn(`Kunne ikke plassere spiller ${playerId} fra lagret state.`); }
        }
    }
    if (stateData.playersOnBenchIds) {
        playersOnBench = stateData.playersOnBenchIds.filter(id => getPlayerById(id));
    }
    renderUI(); // Viktig: Oppdater UI etter å ha anvendt state
    console.log("Tilstand anvendt.");
}

function loadLastState() {
    const savedState = localStorage.getItem(STORAGE_KEY_LAST_STATE);
    if (savedState) {
        try {
            const stateData = JSON.parse(savedState);
            applyState(stateData); console.log("Siste tilstand lastet.");
        } catch (e) { console.error("Feil ved parsing av lagret tilstand:", e); clearPitch(); playersOnPitch = {}; playersOnBench = []; renderUI(); }
    } else { console.log("Ingen lagret tilstand funnet."); clearPitch(); playersOnPitch = {}; playersOnBench = []; renderUI(); }
}

function clearPitch() {
     if (!pitchElement) return;
     const pieces = pitchElement.querySelectorAll('.player-piece');
     pieces.forEach(piece => piece.remove());
}

function getSavedSetups() {
    const setupsJson = localStorage.getItem(STORAGE_KEY_SETUPS);
    if (setupsJson) { try { return JSON.parse(setupsJson); } catch (e) { console.error("Feil ved parsing av lagrede oppsett:", e); return {}; } }
    return {};
}

function handleSaveSetup() {
    if(!setupNameInput || !loadSetupSelect) return;
    const name = setupNameInput.value.trim();
    if (!name) { alert("Vennligst skriv inn et navn for oppsettet."); return; }
    const currentSetups = getSavedSetups();
    const currentState = getCurrentStateData();
    currentSetups[name] = currentState;
    try {
        localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(currentSetups));
        alert(`Oppsett "${name}" lagret!`);
        populateSetupDropdown(); setupNameInput.value = '';
    } catch (e) { console.error("Feil ved lagring av oppsett:", e); alert("Kunne ikke lagre oppsettet."); }
}

function handleLoadSetup() {
    if(!loadSetupSelect) return;
    const selectedName = loadSetupSelect.value;
    if (!selectedName) { alert("Vennligst velg et oppsett å laste."); return; }
    const savedSetups = getSavedSetups();
    const setupToLoad = savedSetups[selectedName];
    if (setupToLoad) { applyState(setupToLoad); alert(`Oppsett "${selectedName}" lastet!`); saveCurrentState(); }
    else { alert(`Kunne ikke finne oppsettet "${selectedName}".`); }
}

function handleDeleteSetup() {
     if(!loadSetupSelect) return;
    const selectedName = loadSetupSelect.value;
    if (!selectedName) { alert("Vennligst velg et oppsett å slette."); return; }
    const savedSetups = getSavedSetups();
    if (savedSetups[selectedName]) {
        if (confirm(`Er du sikker på at du vil slette oppsettet "${selectedName}"?`)) {
            delete savedSetups[selectedName];
            try {
                localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(savedSetups));
                alert(`Oppsett "${selectedName}" slettet.`); populateSetupDropdown();
            } catch (e) { console.error("Feil ved sletting av oppsett:", e); alert("Kunne ikke slette oppsettet."); }
        }
    } else { alert(`Kunne ikke finne oppsettet "${selectedName}" for sletting.`); }
}

function populateSetupDropdown() {
    if (!loadSetupSelect) return;
    const savedSetups = getSavedSetups();
    const setupNames = Object.keys(savedSetups);
    loadSetupSelect.innerHTML = '<option value="">Velg oppsett...</option>';
    setupNames.sort();
    setupNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name; option.textContent = name;
        loadSetupSelect.appendChild(option);
    });
}
// === 6. Lokal Lagring END ===


// === 7. Event Listeners START ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initialiserer app...');
    loadSquad();
    loadLastState(); // Laster sist brukte state
    populateSetupDropdown(); // Fyller dropdown

    // --- Modal Listeners ---
    if (addPlayerButton) {
        addPlayerButton.addEventListener('click', () => {
            console.log("ENKEL TEST: 'Legg til Spiller'-knappen ble klikket!");
            openAddPlayerModal();
        });
        console.log("DOMContentLoaded: Listener lagt til på addPlayerButton.");
    } else { console.error("DOMContentLoaded: addPlayerButton ikke funnet!"); }

    if (closeButton) {
        closeButton.addEventListener('click', closeAddPlayerModal);
        console.log("DOMContentLoaded: Listener lagt til på closeButton.");
    } else { console.error("DOMContentLoaded: closeButton ikke funnet!"); }

    window.addEventListener('click', (event) => { if (event.target === addPlayerModal) closeAddPlayerModal(); });

    if (confirmAddPlayerButton) {
         confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm);
         console.log('DOMContentLoaded: Event listener lagt til for confirmAddPlayerButton.');
    } else { console.error('DOMContentLoaded: Fant IKKE confirmAddPlayerButton!'); }

    // --- Drag and Drop Listeners ---
    if (pitchElement) {
        pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch'));
        pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch'));
        pitchElement.addEventListener('drop', handleDropOnPitch);
    } else { console.error("DOMContentLoaded: pitchElement ikke funnet!"); }

    if (benchElement) {
        benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench'));
        benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench'));
        benchElement.addEventListener('drop', handleDropOnBench);
    } else { console.error("DOMContentLoaded: benchElement ikke funnet!"); }

    // --- Lagre/Laste Oppsett Listeners ---
    if (saveSetupButton) saveSetupButton.addEventListener('click', handleSaveSetup); else console.error("DOMContentLoaded: saveSetupButton ikke funnet!");
    if (loadSetupButton) loadSetupButton.addEventListener('click', handleLoadSetup); else console.error("DOMContentLoaded: loadSetupButton ikke funnet!");
    if (deleteSetupButton) deleteSetupButton.addEventListener('click', handleDeleteSetup); else console.error("DOMContentLoaded: deleteSetupButton ikke funnet!");

    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 7. Event Listeners END ===
