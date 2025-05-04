// === 0. Globale Variabler og Konstanter START ===
let squad = [];
let playersOnPitch = {}; // { playerId: element }
let playersOnBench = []; // [playerId1, playerId2]
let nextPlayerId = 1;
let draggedPlayerId = null;
let draggedElement = null;
let dragSource = null; // 'squad', 'pitch', 'bench'
let selectedPlayerIds = new Set(); // NY: For å holde styr på valgte spillere

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
const squadListContainer = document.getElementById('squad-list-container'); // For drop target
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
function openAddPlayerModal() {
    console.log('openAddPlayerModal: Funksjonen startet.');
    if (!addPlayerModal) { console.error('openAddPlayerModal: FEIL - addPlayerModal elementet er null!'); return; }
    console.log('openAddPlayerModal: Prøver å sette display til block for:', addPlayerModal);
    addPlayerModal.style.display = 'block';
    console.log('openAddPlayerModal: Display satt til block. Nåværende display stil:', window.getComputedStyle(addPlayerModal).display);
    console.log('openAddPlayerModal: Nullstiller felter...');
    if (newPlayerNameInput) newPlayerNameInput.value = ''; else console.warn("openAddPlayerModal: newPlayerNameInput ikke funnet");
    if (newPlayerImageUpload) newPlayerImageUpload.value = ''; else console.warn("openAddPlayerModal: newPlayerImageUpload ikke funnet");
    if (newPlayerImageUrlInput) newPlayerImageUrlInput.value = ''; else console.warn("openAddPlayerModal: newPlayerImageUrlInput ikke funnet");
    if (newPlayerRoleInput) newPlayerRoleInput.value = ''; else console.warn("openAddPlayerModal: newPlayerRoleInput ikke funnet");
    console.log('openAddPlayerModal: Felter nullstilt. Setter fokus...');
    if (newPlayerNameInput) newPlayerNameInput.focus();
    console.log('openAddPlayerModal: Funksjonen ferdig.');
}

function closeAddPlayerModal() {
    if (addPlayerModal) { addPlayerModal.style.display = 'none'; }
    else { console.error("closeAddPlayerModal: addPlayerModal elementet er null!"); }
}

function handleAddPlayerConfirm() {
    console.log('handleAddPlayerConfirm: Funksjonen startet.');
    const name = newPlayerNameInput.value.trim();
    const imageFile = newPlayerImageUpload.files[0];
    let imageUrl = newPlayerImageUrlInput.value.trim();
    const role = newPlayerRoleInput.value.trim();
    console.log('handleAddPlayerConfirm: Data fra modal:', { name, imageUrl, role }); // Fjernet imageFile for klarhet
    if (!name) { alert('Spillernavn må fylles ut.'); return; }

    let finalImageUrl = '';
    if (imageUrl) { finalImageUrl = imageUrl; }
    else if (imageFile) { console.warn("Filopplasting støttes ikke for lagring enda."); }

    const maxId = squad.reduce((max, p) => {
         const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0;
         return Math.max(max, !isNaN(idNum) ? idNum : 0);
     }, 0);
    nextPlayerId = maxId + 1;

    // Inkluder nye standardverdier
    const newPlayer = {
        id: `player-${nextPlayerId}`, name: name, imageUrl: finalImageUrl, role: role,
        nickname: '', // NY: Start med tomt kallenavn
        position: { x: 50, y: 50 }, borderColor: 'black',
        personalInfo: { birthday: '', phone: '', email: '' }, // NY
        matchStats: { matchesPlayed: 0, goalsScored: 0 }, // NY
        comments: [] // NY (tom array for historikk)
    };
    console.log('handleAddPlayerConfirm: Opprettet spillerobjekt:', newPlayer);
    squad.push(newPlayer); console.log('handleAddPlayerConfirm: Spiller lagt til:', squad);
    saveSquad(); console.log('handleAddPlayerConfirm: saveSquad() kalt.');
    renderUI(); console.log('handleAddPlayerConfirm: renderUI() kalt.');
    closeAddPlayerModal(); console.log('handleAddPlayerConfirm: closeAddPlayerModal() kalt.');
}

// --- Player Detail Modal ---
function openPlayerDetailModal(playerId) {
    console.log("openPlayerDetailModal for:", playerId);
    const player = getPlayerById(playerId);
    if (!player) { console.error("Kunne ikke finne spiller for detaljer:", playerId); return; }
    if (!playerDetailModal) { console.error("Player detail modal element ikke funnet!"); return; }

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

function renderCommentHistory(comments) {
    if (!detailCommentHistoryDiv) return;
    detailCommentHistoryDiv.innerHTML = '';
    if (!comments || comments.length === 0) { detailCommentHistoryDiv.innerHTML = '<p><i>Ingen historikk.</i></p>'; return; }
    const sortedComments = [...comments].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedComments.forEach(comment => {
        const p = document.createElement('p');
        const dateSpan = document.createElement('span');
        dateSpan.classList.add('comment-date');
        try { dateSpan.textContent = new Date(comment.date).toLocaleString('no-NO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
        catch (e) { dateSpan.textContent = comment.date; }
        const textNode = document.createTextNode(comment.text);
        p.appendChild(dateSpan); p.appendChild(textNode);
        detailCommentHistoryDiv.appendChild(p);
    });
}

function closePlayerDetailModal() {
    if (playerDetailModal) { playerDetailModal.style.display = 'none'; }
}

function handleAddCommentToHistory() {
    const playerId = detailPlayerIdInput.value;
    const player = getPlayerById(playerId);
    const commentText = detailMatchCommentInput.value.trim();
    if (!player) { console.error("Kan ikke legge til kommentar, spiller ikke funnet:", playerId); return; }
    if (!commentText) { alert("Skriv en kommentar før du legger til."); return; }
    const newComment = { date: new Date().toISOString(), text: commentText };
    player.comments = player.comments || [];
    player.comments.push(newComment);
    saveSquad(); renderCommentHistory(player.comments);
    detailMatchCommentInput.value = ''; alert("Kommentar lagt til.");
}

function handleSavePlayerDetails() {
    const playerId = detailPlayerIdInput.value;
    const player = getPlayerById(playerId);
    if (!player) { console.error("Kan ikke lagre detaljer:", playerId); return; }
    let dataChanged = false; let visualChanged = false;
    if (player.name !== detailPlayerNameInput.value) { player.name = detailPlayerNameInput.value; dataChanged = true; visualChanged = true; }
    if (player.nickname !== detailPlayerNicknameInput.value) { player.nickname = detailPlayerNicknameInput.value.trim(); dataChanged = true; visualChanged = true; } // Lagre kallenavn
    if (player.role !== detailPlayerRoleInput.value) { player.role = detailPlayerRoleInput.value; dataChanged = true; visualChanged = true; } // Oppdater rolle også
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
            renderUI();
            const pieceElement = playersOnPitch[playerId];
            if (pieceElement) {
                const nameDiv = pieceElement.querySelector('.player-name');
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
    nameDiv.classList.add('player-name'); nameDiv.textContent = player.nickname || player.name; piece.appendChild(nameDiv);
    piece.addEventListener('dragstart', handleDragStartPiece); piece.addEventListener('dragend', handleDragEnd);
    piece.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); piece.addEventListener('click', handlePlayerPieceClick);
    return piece;
}

function getPlayerById(playerId) { if (!playerId) return null; return squad.find(p => p.id === playerId) || null; }
// === 4. Spillerbrikke Håndtering END ===


// === 5. Drag and Drop & Valg/Farge START ===
function addDragListenersToSquadItems() {
    if (!squadListElement) return; const items = squadListElement.querySelectorAll('.squad-player-item.draggable'); console.log(`addDragListenersToSquadItems: Fant ${items.length} squad items.`); items.forEach(item => { item.removeEventListener('dragstart', handleDragStart); item.addEventListener('dragstart', handleDragStart); item.removeEventListener('dragend', handleDragEnd); item.addEventListener('dragend', handleDragEnd); });
}
function addDragListenersToBenchItems() {
     if (!benchListElement) return; const items = benchListElement.querySelectorAll('.bench-player-item.draggable'); items.forEach(item => { item.removeEventListener('dragstart', handleDragStartBench); item.addEventListener('dragstart', handleDragStartBench); item.removeEventListener('dragend', handleDragEnd); item.addEventListener('dragend', handleDragEnd); });
}
function handleDragStart(event) {
    console.log("handleDragStart: Drag startet:", event.target); draggedPlayerId = event.target.getAttribute('data-player-id'); console.log("handleDragStart: ID:", draggedPlayerId); const player = getPlayerById(draggedPlayerId); if (!player) { console.error("handleDragStart: Fant ikke spiller ID:", draggedPlayerId); event.preventDefault(); return; } console.log("handleDragStart: Fant spiller:", player); draggedElement = event.target; dragSource = 'squad'; try { event.dataTransfer.setData('text/plain', draggedPlayerId); console.log("handleDragStart: setData satt for", draggedPlayerId); } catch (e) { console.error("handleDragStart: Feil ved setData:", e); event.preventDefault(); return; } event.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0);
}
function handleDragStartBench(event) {
    draggedPlayerId = event.target.getAttribute('data-player-id'); if (!getPlayerById(draggedPlayerId)) { console.error("handleDragStartBench: Fant ikke spiller ID:", draggedPlayerId); event.preventDefault(); return; } draggedElement = event.target; dragSource = 'bench'; event.dataTransfer.setData('text/plain', draggedPlayerId); event.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0);
}
function handleDragStartPiece(event) {
    const pieceElement = event.target.closest('.player-piece'); if (!pieceElement) return; draggedPlayerId = pieceElement.getAttribute('data-player-id'); if (!getPlayerById(draggedPlayerId)) { console.error("handleDragStartPiece: Fant ikke spiller ID:", draggedPlayerId); event.preventDefault(); return; } draggedElement = pieceElement; dragSource = 'pitch'; event.dataTransfer.setData('text/plain', draggedPlayerId); event.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0); event.stopPropagation();
}
function handleDragOver(event, targetType) {
    event.preventDefault(); event.dataTransfer.dropEffect = 'move'; let targetElement; if (targetType === 'pitch') targetElement = pitchElement; else if (targetType === 'bench') targetElement = benchElement; else if (targetType === 'squad') targetElement = squadListContainer; if(targetElement) targetElement.classList.add('drag-over');
}
function handleDragLeave(event, targetType) {
     const relatedTarget = event.relatedTarget; let targetElement; if (targetType === 'pitch') targetElement = pitchElement; else if (targetType === 'bench') targetElement = benchElement; else if (targetType === 'squad') targetElement = squadListContainer; if (!targetElement) return; if (!relatedTarget || !targetElement.contains(relatedTarget)) { targetElement.classList.remove('drag-over'); }
}
function handleDropOnPitch(event) {
    event.preventDefault(); if (pitchElement) pitchElement.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; } if (!playerId) { console.warn("Drop on Pitch: Mottok tom playerId."); resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on Pitch: Fant ikke spiller ID:", playerId); resetDragState(); return; } if ( (dragSource === 'squad' || dragSource === 'bench') && Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH ) { alert(`Maks ${MAX_PLAYERS_ON_PITCH} spillere på banen.`); resetDragState(); return; } const pitchRect = pitchElement.getBoundingClientRect(); const dropX = event.clientX - pitchRect.left; const dropY = event.clientY - pitchRect.top; const xPercent = Math.max(0, Math.min(100, (dropX / pitchRect.width) * 100)); const yPercent = Math.max(0, Math.min(100, (dropY / pitchRect.height) * 100)); player.position = { x: xPercent, y: yPercent }; let stateChanged = false; if (playersOnPitch[playerId]) { const piece = playersOnPitch[playerId]; piece.style.left = `${xPercent}%`; piece.style.top = `${yPercent}%`; stateChanged = true; } else { const newPiece = createPlayerPieceElement(player, xPercent, yPercent); if (pitchElement) pitchElement.appendChild(newPiece); playersOnPitch[playerId] = newPiece; if (dragSource === 'bench') { const benchIndex = playersOnBench.indexOf(playerId); if (benchIndex > -1) { playersOnBench.splice(benchIndex, 1); } } stateChanged = true; } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState();
}
function handleDropOnBench(event) {
    event.preventDefault(); if (benchElement) benchElement.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; } if (!playerId) { console.warn("Drop on Bench: Mottok tom playerId."); resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on Bench: Fant ikke spiller ID:", playerId); resetDragState(); return; } let stateChanged = false; if (dragSource === 'pitch') { if (!playersOnBench.includes(playerId)) { playersOnBench.push(playerId); } if (playersOnPitch[playerId]) { playersOnPitch[playerId].remove(); delete playersOnPitch[playerId]; stateChanged = true; } } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState();
}
function handleDropOnSquadList(event) {
    event.preventDefault(); if (squadListContainer) squadListContainer.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; } if (!playerId) { console.warn("Drop on Squad List: Mottok tom playerId."); resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on Squad List: Fant ikke spiller ID:", playerId); resetDragState(); return; } let stateChanged = false; if (dragSource === 'pitch') { if (playersOnPitch[playerId]) { playersOnPitch[playerId].remove(); delete playersOnPitch[playerId]; console.log(`Moved player ${playerId} from pitch to squad list`); stateChanged = true; } } else if (dragSource === 'bench') { const benchIndex = playersOnBench.indexOf(playerId); if (benchIndex > -1) { playersOnBench.splice(benchIndex, 1); console.log(`Moved player ${playerId} from bench to squad list`); stateChanged = true; } } else if (dragSource === 'squad') { console.log("Ignorerer slipp fra tropp til tropp."); } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState();
}
function handleDragEnd(event) {
    setTimeout(() => { if (draggedElement && draggedElement.classList.contains('dragging')) { draggedElement.classList.remove('dragging'); } if(pitchElement) pitchElement.classList.remove('drag-over'); if(benchElement) benchElement.classList.remove('drag-over'); if(squadListContainer) squadListContainer.classList.remove('drag-over'); resetDragState(); }, 0);
}
function resetDragState() { draggedPlayerId = null; draggedElement = null; dragSource = null; }
function handlePlayerPieceClick(event) {
    const pieceElement = event.currentTarget; const playerId = pieceElement.getAttribute('data-player-id'); if (selectedPlayerIds.has(playerId)) { selectedPlayerIds.delete(playerId); pieceElement.classList.remove('selected'); } else { selectedPlayerIds.add(playerId); pieceElement.classList.add('selected'); } console.log("Valgte spillere:", selectedPlayerIds);
}
function clearPlayerSelection() { selectedPlayerIds.forEach(id => { const piece = playersOnPitch[id]; if (piece) { piece.classList.remove('selected'); } }); selectedPlayerIds.clear(); console.log("Valg nullstilt."); }
function handleSetSelectedPlayerBorderColor() {
    const color = playerBorderColorInput.value; if (selectedPlayerIds.size === 0) { alert("Ingen spillere valgt."); return; } let stateChanged = false; selectedPlayerIds.forEach(playerId => { const player = getPlayerById(playerId); const piece = playersOnPitch[playerId]; if (player && piece) { if (player.borderColor !== color) { player.borderColor = color; const imgContainer = piece.querySelector('.player-image-container'); if (imgContainer) { imgContainer.style.borderColor = color; } stateChanged = true; } } }); if (stateChanged) { console.log("Farge oppdatert til:", color); saveCurrentState(); } clearPlayerSelection();
}
// === 5. Drag and Drop & Valg/Farge END ===


// === 6. Lokal Lagring START ===
function saveSquad() { console.log("saveSquad: Prøver å lagre squad:", squad); try { const squadJson = JSON.stringify(squad); console.log("saveSquad: squad JSON:", squadJson); localStorage.setItem(STORAGE_KEY_SQUAD, squadJson); console.log("saveSquad: Lagring OK."); } catch (e) { console.error("Feil ved lagring av tropp:", e); alert("Kunne ikke lagre troppen."); } }
function loadSquad() { const savedSquadJson = localStorage.getItem(STORAGE_KEY_SQUAD); console.log("loadSquad: Hentet rådata:", savedSquadJson); if (savedSquadJson) { try { const parsedSquad = JSON.parse(savedSquadJson); squad = parsedSquad.map(player => ({ ...player, nickname: player.nickname || '', personalInfo: player.personalInfo || { birthday: '', phone: '', email: '' }, matchStats: player.matchStats || { matchesPlayed: 0, goalsScored: 0 }, comments: player.comments || [], borderColor: player.borderColor || 'black' })); console.log("loadSquad: Parsed and initialized squad:", squad); const maxId = squad.reduce((max, p) => { const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0; return Math.max(max, !isNaN(idNum) ? idNum : 0); }, 0); nextPlayerId = maxId + 1; console.log("loadSquad: Next player ID:", nextPlayerId); return true; } catch (e) { console.error("Feil ved parsing/init av lagret tropp:", e); squad = []; localStorage.removeItem(STORAGE_KEY_SQUAD); return false; } } console.log("Ingen tropp funnet."); squad = []; return false; }
function getCurrentStateData() { const playersOnPitchData = {}; for (const playerId in playersOnPitch) { const player = getPlayerById(playerId); if (player) { playersOnPitchData[playerId] = { x: player.position.x, y: player.position.y, borderColor: player.borderColor }; } } return { playersOnPitchData: playersOnPitchData, playersOnBenchIds: [...playersOnBench] }; }
function saveCurrentState() { try { const stateData = getCurrentStateData(); localStorage.setItem(STORAGE_KEY_LAST_STATE, JSON.stringify(stateData)); } catch (e) { console.error("Feil ved lagring av state:", e); } }
function applyState(stateData) { if (!stateData) return; clearPitch(); playersOnPitch = {}; playersOnBench = []; if (stateData.playersOnPitchData) { for (const playerId in stateData.playersOnPitchData) { const player = getPlayerById(playerId); const positionData = stateData.playersOnPitchData[playerId]; if (player && positionData) { player.position = { x: positionData.x, y: positionData.y }; player.borderColor = positionData.borderColor || 'black'; const piece = createPlayerPieceElement(player, player.position.x, player.position.y); if(pitchElement) pitchElement.appendChild(piece); playersOnPitch[playerId] = piece; } else { console.warn(`Kunne ikke plassere spiller ${playerId} fra state.`); } } } if (stateData.playersOnBenchIds) { playersOnBench = stateData.playersOnBenchIds.filter(id => getPlayerById(id)); } renderUI(); console.log("Tilstand anvendt."); }
function loadLastState() { const savedState = localStorage.getItem(STORAGE_KEY_LAST_STATE); if (savedState) { try { const stateData = JSON.parse(savedState); applyState(stateData); console.log("Siste tilstand lastet."); } catch (e) { console.error("Feil ved parsing av state:", e); clearPitch(); playersOnPitch = {}; playersOnBench = []; renderUI(); } } else { console.log("Ingen lagret tilstand funnet."); clearPitch(); playersOnPitch = {}; playersOnBench = []; renderUI(); } }
function clearPitch() { if (!pitchElement) return; const pieces = pitchElement.querySelectorAll('.player-piece'); pieces.forEach(piece => piece.remove()); }
function getSavedSetups() { const setupsJson = localStorage.getItem(STORAGE_KEY_SETUPS); if (setupsJson) { try { return JSON.parse(setupsJson); } catch (e) { console.error("Feil ved parsing av oppsett:", e); return {}; } } return {}; }
function handleSaveSetup() { if(!setupNameInput || !loadSetupSelect) return; const name = setupNameInput.value.trim(); if (!name) { alert("Skriv inn navn."); return; } const currentSetups = getSavedSetups(); const currentState = getCurrentStateData(); currentSetups[name] = currentState; try { localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(currentSetups)); alert(`Oppsett "${name}" lagret!`); populateSetupDropdown(); setupNameInput.value = ''; } catch (e) { console.error("Feil ved lagring av oppsett:", e); alert("Kunne ikke lagre."); } }
function handleLoadSetup() { if(!loadSetupSelect) return; const selectedName = loadSetupSelect.value; if (!selectedName) { alert("Velg oppsett."); return; } const savedSetups = getSavedSetups(); const setupToLoad = savedSetups[selectedName]; if (setupToLoad) { applyState(setupToLoad); alert(`Oppsett "${selectedName}" lastet!`); saveCurrentState(); } else { alert(`Fant ikke "${selectedName}".`); } }
function handleDeleteSetup() { if(!loadSetupSelect) return; const selectedName = loadSetupSelect.value; if (!selectedName) { alert("Velg oppsett."); return; } const savedSetups = getSavedSetups(); if (savedSetups[selectedName]) { if (confirm(`Slette "${selectedName}"?`)) { delete savedSetups[selectedName]; try { localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(savedSetups)); alert(`Oppsett "${selectedName}" slettet.`); populateSetupDropdown(); } catch (e) { console.error("Feil ved sletting:", e); alert("Kunne ikke slette."); } } } else { alert(`Fant ikke "${selectedName}".`); } }
function populateSetupDropdown() { if (!loadSetupSelect) return; const savedSetups = getSavedSetups(); const setupNames = Object.keys(savedSetups); loadSetupSelect.innerHTML = '<option value="">Velg oppsett...</option>'; setupNames.sort(); setupNames.forEach(name => { const option = document.createElement('option'); option.value = name; option.textContent = name; loadSetupSelect.appendChild(option); }); }
// === 6. Lokal Lagring END ===


// === 7. Event Listeners START ===
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
