// === 0. Globale Variabler og Konstanter START ===
let squad = [];
let playersOnPitch = {};
let playersOnBench = [];
let nextPlayerId = 1;
let draggedPlayerId = null;
let draggedElement = null;
let dragSource = null;
let selectedPlayerIds = new Set();

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
const squadListContainer = document.getElementById('squad-list-container');
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
// Add Player Modal
const addPlayerModal = document.getElementById('add-player-modal');
const closeButton = addPlayerModal ? addPlayerModal.querySelector('.close-button') : null;
const newPlayerNameInput = document.getElementById('new-player-name');
const newPlayerImageUpload = document.getElementById('new-player-image-upload');
const newPlayerImageUrlInput = document.getElementById('new-player-image-url');
const newPlayerRoleInput = document.getElementById('new-player-role');
const confirmAddPlayerButton = document.getElementById('confirm-add-player');
// Player Detail Modal
const playerDetailModal = document.getElementById('player-detail-modal');
const closeDetailButton = playerDetailModal ? playerDetailModal.querySelector('.close-detail-button') : null;
const detailModalTitle = document.getElementById('detail-modal-title');
const detailPlayerIdInput = document.getElementById('detail-player-id');
const detailPlayerNameInput = document.getElementById('detail-player-name');
const detailPlayerNicknameInput = document.getElementById('detail-player-nickname'); // NY REFERANSE
const detailPlayerRoleInput = document.getElementById('detail-player-role');
const detailPlayerBirthdayInput = document.getElementById('detail-player-birthday');
const detailPlayerPhoneInput = document.getElementById('detail-player-phone');
const detailPlayerEmailInput = document.getElementById('detail-player-email');
const detailMatchCommentInput = document.getElementById('detail-match-comment');
const addCommentToHistoryButton = document.getElementById('add-comment-to-history-button');
const detailCommentHistoryDiv = document.getElementById('detail-comment-history');
const detailMatchesPlayedInput = document.getElementById('detail-matches-played');
const detailGoalsScoredInput = document.getElementById('detail-goals-scored');
const saveDetailsButton = document.getElementById('save-details-button');
// === 1. DOM Element Referanser END ===


// === 2. Modal Håndtering START ===
// --- Player Add Modal ---
function openAddPlayerModal() { /* ... (som før) ... */ }
function closeAddPlayerModal() { /* ... (som før) ... */ }
function handleAddPlayerConfirm() {
    // ... (hent name, imageUrl, role som før) ...
    const name = newPlayerNameInput.value.trim();
    let imageUrl = newPlayerImageUrlInput.value.trim(); // La denne være let hvis du vil modifisere den
    const role = newPlayerRoleInput.value.trim();
    const imageFile = newPlayerImageUpload.files[0]; // For warn
    if (!name) { alert('Spillernavn må fylles ut.'); return; }
    let finalImageUrl = imageUrl;
    if (!finalImageUrl && imageFile) { console.warn("Filopplasting støttes ikke for lagring enda."); }

    const maxId = squad.reduce((max, p) => Math.max(max, parseInt(p.id.split('-')[1]) || 0), 0);
    nextPlayerId = maxId + 1;

    const newPlayer = {
        id: `player-${nextPlayerId}`, name: name, imageUrl: finalImageUrl, role: role,
        nickname: '', // NY: Start med tomt kallenavn
        position: { x: 50, y: 50 }, borderColor: 'black',
        personalInfo: { birthday: '', phone: '', email: '' },
        matchStats: { matchesPlayed: 0, goalsScored: 0 }, comments: []
    };
    squad.push(newPlayer); saveSquad(); renderUI(); closeAddPlayerModal();
    console.log("Spiller lagt til:", newPlayer.id);
}

// --- Player Detail Modal ---
function openPlayerDetailModal(playerId) {
    console.log("openPlayerDetailModal for:", playerId);
    const player = getPlayerById(playerId);
    if (!player || !playerDetailModal) return;

    // Sørg for at felter finnes (for eldre data/robusthet)
    player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' };
    player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 };
    player.comments = player.comments || [];
    player.nickname = player.nickname || ''; // Sørg for at nickname finnes

    // Fyll ut skjemaet
    detailPlayerIdInput.value = player.id;
    detailModalTitle.textContent = `Detaljer for ${player.name}`;
    detailPlayerNameInput.value = player.name || '';
    detailPlayerNicknameInput.value = player.nickname; // Fyll inn kallenavn
    detailPlayerRoleInput.value = player.role || '';
    detailPlayerBirthdayInput.value = player.personalInfo.birthday || '';
    detailPlayerPhoneInput.value = player.personalInfo.phone || '';
    detailPlayerEmailInput.value = player.personalInfo.email || '';
    detailMatchesPlayedInput.value = player.matchStats.matchesPlayed || 0;
    detailGoalsScoredInput.value = player.matchStats.goalsScored || 0;
    renderCommentHistory(player.comments);
    detailMatchCommentInput.value = '';
    playerDetailModal.style.display = 'block';
}

function renderCommentHistory(comments) { /* ... (som før) ... */ }
function closePlayerDetailModal() { /* ... (som før) ... */ }
function handleAddCommentToHistory() { /* ... (som før) ... */ }

function handleSavePlayerDetails() {
    const playerId = detailPlayerIdInput.value;
    const player = getPlayerById(playerId);
    if (!player) { console.error("Kan ikke lagre detaljer:", playerId); return; }

    let dataChanged = false; let visualChanged = false;

    // Sammenlign og oppdater vanlige felt
    if (player.name !== detailPlayerNameInput.value) { player.name = detailPlayerNameInput.value; dataChanged = true; visualChanged = true; }
    if (player.nickname !== detailPlayerNicknameInput.value) { player.nickname = detailPlayerNicknameInput.value.trim(); dataChanged = true; visualChanged = true; } // Lagre kallenavn
    if (player.role !== detailPlayerRoleInput.value) { player.role = detailPlayerRoleInput.value; dataChanged = true; visualChanged = true; } // Oppdater rolle også

    // ... (Oppdater personalInfo og matchStats som før) ...
    player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' };
    player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 };
    if (player.personalInfo.birthday !== detailPlayerBirthdayInput.value) { player.personalInfo.birthday = detailPlayerBirthdayInput.value; dataChanged = true; }
    if (player.personalInfo.phone !== detailPlayerPhoneInput.value) { player.personalInfo.phone = detailPlayerPhoneInput.value; dataChanged = true; }
    if (player.personalInfo.email !== detailPlayerEmailInput.value) { player.personalInfo.email = detailPlayerEmailInput.value; dataChanged = true; }
    const matches = parseInt(detailMatchesPlayedInput.value) || 0;
    const goals = parseInt(detailGoalsScoredInput.value) || 0;
    if (player.matchStats.matchesPlayed !== matches) { player.matchStats.matchesPlayed = matches; dataChanged = true; }
    if (player.matchStats.goalsScored !== goals) { player.matchStats.goalsScored = goals; dataChanged = true; }


    const currentComment = detailMatchCommentInput.value.trim();
    if (currentComment) {
        if (confirm("Legge til usnlagret kommentar i historikken?")) { handleAddCommentToHistory(); dataChanged = true; }
    }

    if (dataChanged) {
        console.log("Lagrer spillerdetaljer for:", playerId, player);
        saveSquad();
        if (visualChanged) {
            renderUI(); // Oppdater lister (som nå viser kallenavn/navn)
            const pieceElement = playersOnPitch[playerId];
            if (pieceElement) {
                const nameDiv = pieceElement.querySelector('.player-name');
                // Oppdater brikkens navn til kallenavn eller navn
                if (nameDiv) nameDiv.textContent = player.nickname || player.name;
            }
        }
        alert("Spillerdetaljer lagret.");
    } else { console.log("Ingen endringer å lagre for:", playerId); }
    closePlayerDetailModal();
}
// === 2. Modal Håndtering END ===


// === 3. UI Rendering START ===
function renderUI() {
    renderOnPitchList(); renderBench(); renderSquadList();
    if(onPitchCountElement) onPitchCountElement.textContent = Object.keys(playersOnPitch).length;
    if(onBenchCountElement) onBenchCountElement.textContent = playersOnBench.length;
}

function renderOnPitchList() {
    if (!onPitchListElement) return; onPitchListElement.innerHTML = '';
    const playerIdsOnPitch = Object.keys(playersOnPitch);
    if (playerIdsOnPitch.length === 0) { onPitchListElement.innerHTML = '<li><i>Ingen spillere på banen.</i></li>'; return; }
    const sortedPlayers = playerIdsOnPitch.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name));
    sortedPlayers.forEach(player => {
        const listItem = document.createElement('li');
        // VIS KALLENAVN ELLER NAVN I LISTEN
        listItem.textContent = (player.nickname || player.name) + (player.role ? ` (${player.role})` : '');
        listItem.setAttribute('data-player-id', player.id); listItem.classList.add('on-pitch-player-item');
        onPitchListElement.appendChild(listItem);
    });
}

function renderBench() {
    if (!benchListElement) return; benchListElement.innerHTML = '';
    if (playersOnBench.length === 0) { benchListElement.innerHTML = '<li><i>Benken er tom.</i></li>'; return; }
    const sortedPlayers = playersOnBench.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name));
    sortedPlayers.forEach(player => {
        const listItem = document.createElement('li');
        // VIS KALLENAVN ELLER NAVN I LISTEN
        listItem.textContent = (player.nickname || player.name) + (player.role ? ` (${player.role})` : '');
        listItem.setAttribute('data-player-id', player.id); listItem.classList.add('bench-player-item', 'draggable'); listItem.setAttribute('draggable', true);
        benchListElement.appendChild(listItem);
    });
    addDragListenersToBenchItems();
}

function renderSquadList() {
    if (!squadListElement) return; squadListElement.innerHTML = '';
    const availablePlayers = squad.filter(p => !playersOnPitch[p.id] && !playersOnBench.includes(p.id)).sort((a, b) => a.name.localeCompare(b.name));
    if (availablePlayers.length === 0 && squad.length > 0) { squadListElement.innerHTML = '<li><i>Alle spillere er plassert.</i></li>'; }
    else if (squad.length === 0) { squadListElement.innerHTML = '<li><i>Ingen spillere i troppen.</i></li>'; }
    else {
        availablePlayers.forEach(player => {
            const listItem = document.createElement('li');
            // VIS KALLENAVN ELLER NAVN I LISTEN
            listItem.textContent = (player.nickname || player.name) + (player.role ? ` (${player.role})` : '');
            listItem.setAttribute('data-player-id', player.id); listItem.classList.add('squad-player-item', 'draggable'); listItem.setAttribute('draggable', true);
            squadListElement.appendChild(listItem);
        });
    }
     addDragListenersToSquadItems();
}
// === 3. UI Rendering END ===


// === 4. Spillerbrikke Håndtering START ===
function createPlayerPieceElement(player, xPercent, yPercent) {
    const piece = document.createElement('div');
    piece.classList.add('player-piece', 'draggable'); piece.setAttribute('data-player-id', player.id); piece.setAttribute('draggable', true);
    piece.style.left = `${xPercent}%`; piece.style.top = `${yPercent}%`; piece.style.transform = 'translate(-50%, -50%)';
    const imgContainer = document.createElement('div');
    imgContainer.classList.add('player-image-container'); imgContainer.style.borderColor = player.borderColor || 'black';
    const imgDiv = document.createElement('div');
    imgDiv.classList.add('player-image');
    if (player.imageUrl && !player.imageUrl.startsWith('placeholder-file:')) imgDiv.style.backgroundImage = `url('${player.imageUrl}')`; else imgDiv.style.backgroundColor = '#aaa';
    imgContainer.appendChild(imgDiv); piece.appendChild(imgContainer);
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('player-name');
    // VIS KALLENAVN ELLER NAVN PÅ BRIKKEN
    nameDiv.textContent = player.nickname || player.name;
    piece.appendChild(nameDiv);
    piece.addEventListener('dragstart', handleDragStartPiece); piece.addEventListener('dragend', handleDragEnd);
    piece.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); piece.addEventListener('click', handlePlayerPieceClick);
    return piece;
}

function getPlayerById(playerId) { if (!playerId) return null; return squad.find(p => p.id === playerId) || null; }
// === 4. Spillerbrikke Håndtering END ===


// === 5. Drag and Drop & Valg/Farge START ===
// (Alle eksisterende funksjoner beholdes som de var i forrige KORREKTE svar)
function addDragListenersToSquadItems() { /* ... */ }
function addDragListenersToBenchItems() { /* ... */ }
function handleDragStart(event) { /* ... */ }
function handleDragStartBench(event) { /* ... */ }
function handleDragStartPiece(event) { /* ... */ }
function handleDragOver(event, targetType) { /* ... */ }
function handleDragLeave(event, targetType) { /* ... */ }
function handleDropOnPitch(event) { /* ... */ }
function handleDropOnBench(event) { /* ... */ }
function handleDropOnSquadList(event) { /* ... */ }
function handleDragEnd(event) { /* ... */ }
function resetDragState() { /* ... */ }
function handlePlayerPieceClick(event) { /* ... */ }
function clearPlayerSelection() { /* ... */ }
function handleSetSelectedPlayerBorderColor() { /* ... */ }
// === 5. Drag and Drop & Valg/Farge END ===


// === 6. Lokal Lagring START ===
function saveSquad() { /* ... (som før) ... */ }
function loadSquad() {
    const savedSquadJson = localStorage.getItem(STORAGE_KEY_SQUAD); console.log("loadSquad: Hentet rådata:", savedSquadJson);
    if (savedSquadJson) {
        try { const parsedSquad = JSON.parse(savedSquadJson);
            squad = parsedSquad.map(player => ({
                ...player,
                nickname: player.nickname || '', // Initialiser kallenavn
                personalInfo: player.personalInfo || { birthday: '', phone: '', email: '' },
                matchStats: player.matchStats || { matchesPlayed: 0, goalsScored: 0 },
                comments: player.comments || [],
                borderColor: player.borderColor || 'black'
            }));
            console.log("loadSquad: Parsed and initialized squad:", squad);
            const maxId = squad.reduce((max, p) => { const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0; return Math.max(max, !isNaN(idNum) ? idNum : 0); }, 0);
            nextPlayerId = maxId + 1; console.log("loadSquad: Next player ID:", nextPlayerId); return true;
        } catch (e) { console.error("Feil ved parsing/init av lagret tropp:", e); squad = []; localStorage.removeItem(STORAGE_KEY_SQUAD); return false; }
    }
    console.log("Ingen tropp funnet."); squad = []; return false;
}
// (Resten av lagringsfunksjoner som før)
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
// (Som i forrige KORREKTE svar, med alle listeners)
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initialiserer app...');
    loadSquad(); loadLastState(); populateSetupDropdown();
    if (addPlayerButton) { addPlayerButton.addEventListener('click', () => { console.log("TEST: 'Legg til Spiller' klikket!"); openAddPlayerModal(); }); console.log("Listener: addPlayerButton OK"); } else { console.error("addPlayerButton ikke funnet!"); }
    if (closeButton) { closeButton.addEventListener('click', closeAddPlayerModal); console.log("Listener: closeButton OK"); } else { console.error("closeButton ikke funnet!"); }
    if (confirmAddPlayerButton) { confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm); console.log('Listener: confirmAddPlayerButton OK'); } else { console.error('confirmAddPlayerButton ikke funnet!'); }
    if (closeDetailButton) { closeDetailButton.addEventListener('click', closePlayerDetailModal); console.log("Listener: closeDetailButton OK"); } else { console.error("closeDetailButton ikke funnet!"); }
    if (saveDetailsButton) { saveDetailsButton.addEventListener('click', handleSavePlayerDetails); console.log("Listener: saveDetailsButton OK"); } else { console.error("saveDetailsButton ikke funnet!"); }
    if (addCommentToHistoryButton) { addCommentToHistoryButton.addEventListener('click', handleAddCommentToHistory); console.log("Listener: addCommentToHistoryButton OK"); } else { console.error("addCommentToHistoryButton ikke funnet!"); }
    window.addEventListener('click', (event) => { if (event.target === addPlayerModal) closeAddPlayerModal(); if (event.target === playerDetailModal) closePlayerDetailModal(); if (!event.target.closest('.player-piece') && selectedPlayerIds.size > 0) { clearPlayerSelection(); } });
    if (pitchElement) { pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch')); pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch')); pitchElement.addEventListener('drop', handleDropOnPitch); console.log("Listeners: pitchElement OK"); } else { console.error("pitchElement ikke funnet!"); }
    if (benchElement) { benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench')); benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench')); benchElement.addEventListener('drop', handleDropOnBench); console.log("Listeners: benchElement OK"); } else { console.error("benchElement ikke funnet!"); }
    if (squadListContainer) { squadListContainer.addEventListener('dragover', (e) => handleDragOver(e, 'squad')); squadListContainer.addEventListener('dragleave', (e) => handleDragLeave(e, 'squad')); squadListContainer.addEventListener('drop', handleDropOnSquadList); console.log("Listeners: squadListContainer OK"); } else { console.error("squadListContainer ikke funnet!"); }
    if (setBorderColorButton) { setBorderColorButton.addEventListener('click', handleSetSelectedPlayerBorderColor); console.log("Listener: setBorderColorButton OK"); } else { console.error("setBorderColorButton ikke funnet!"); }
    if (saveSetupButton) { saveSetupButton.addEventListener('click', handleSaveSetup); console.log("Listener: saveSetupButton OK"); } else { console.error("saveSetupButton ikke funnet!"); }
    if (loadSetupButton) { loadSetupButton.addEventListener('click', handleLoadSetup); console.log("Listener: loadSetupButton OK"); } else { console.error("loadSetupButton ikke funnet!"); }
    if (deleteSetupButton) { deleteSetupButton.addEventListener('click', handleDeleteSetup); console.log("Listener: deleteSetupButton OK"); } else { console.error("deleteSetupButton ikke funnet!"); }
    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 7. Event Listeners END ===
