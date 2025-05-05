/* Version: #69 */
// === 0. Globale Variabler og Konstanter START ===
let squad = [];
let playersOnPitch = {}; // { playerId: element }
let playersOnBench = []; // [playerId1, playerId2]
let nextPlayerId = 1;
let draggedPlayerId = null;
let draggedElement = null;
let dragSource = null; // 'squad', 'pitch', 'bench', 'ball'
let selectedPlayerIds = new Set();
let isSidebarHidden = false;
let isPitchRotated = false; // Global variabel for rotasjonsstatus

const MAX_PLAYERS_ON_PITCH = 11;
const PITCH_ASPECT_RATIO_PORTRAIT = 68 / 105;
const PITCH_ASPECT_RATIO_LANDSCAPE = 105 / 68;


const STORAGE_KEY_SQUAD = 'fotballtaktiker_squad';
const STORAGE_KEY_LAST_STATE = 'fotballtaktiker_lastState';
const STORAGE_KEY_SETUPS = 'fotballtaktiker_setups';
// === 0. Globale Variabler og Konstanter END ===


// === 1. DOM Element Referanser START ===
const appContainer = document.querySelector('.app-container');
const sidebar = document.querySelector('.sidebar');
const toggleSidebarButton = document.getElementById('toggle-sidebar-button');
const onPitchListElement = document.getElementById('on-pitch-list');
const benchListElement = document.getElementById('bench-list'); // Trengs kanskje ikke globalt nå
const squadListElement = document.getElementById('squad-list');
const squadListContainer = document.getElementById('squad-list-container');
const onPitchCountElement = document.getElementById('on-pitch-count');
const onBenchCountElement = document.getElementById('on-bench-count');
const pitchElement = document.getElementById('pitch'); // Brukes for størrelse/posisjon
const pitchSurface = document.getElementById('pitch-surface'); // Brukes for å legge til elementer
const rotatePitchButton = document.getElementById('rotate-pitch-button');
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

let addPlayerModal; let closeButton; let newPlayerNameInput; let newPlayerImageUpload; let newPlayerImageUrlInput; let newPlayerRoleInput; let confirmAddPlayerButton;
let playerDetailModal;
let benchElement;
// === 1. DOM Element Referanser END ===


// === 2. Modal Håndtering START ===
function openAddPlayerModal() { console.log('openAddPlayerModal: Funksjonen startet.'); if (!addPlayerModal) { console.error('openAddPlayerModal: FEIL - addPlayerModal elementet er null!'); return; } addPlayerModal.style.display = 'block'; console.log('openAddPlayerModal: Display satt til block.'); if (newPlayerNameInput) newPlayerNameInput.value = ''; if (newPlayerImageUpload) newPlayerImageUpload.value = ''; if (newPlayerImageUrlInput) newPlayerImageUrlInput.value = ''; if (newPlayerRoleInput) newPlayerRoleInput.value = ''; if (newPlayerNameInput) newPlayerNameInput.focus(); console.log('openAddPlayerModal: Funksjonen ferdig.'); }
function closeAddPlayerModal() { if (addPlayerModal) { addPlayerModal.style.display = 'none'; } else { console.error("closeAddPlayerModal: addPlayerModal elementet er null!"); } }
function handleAddPlayerConfirm() { console.log('handleAddPlayerConfirm: Funksjonen startet.'); if (!newPlayerNameInput || !newPlayerImageUrlInput || !newPlayerRoleInput || !newPlayerImageUpload) { console.error("handleAddPlayerConfirm: Ett eller flere input-elementer mangler!"); return; } const name = newPlayerNameInput.value.trim(); const imageFile = newPlayerImageUpload.files[0]; let imageUrl = newPlayerImageUrlInput.value.trim(); const role = newPlayerRoleInput.value.trim(); if (!name) { alert('Spillernavn må fylles ut.'); return; } let finalImageUrl = imageUrl; if (!finalImageUrl && imageFile) { console.warn("Filopplasting støttes ikke for lagring enda."); } const maxId = squad.reduce((max, p) => Math.max(max, parseInt(p.id.split('-')[1]) || 0), 0); nextPlayerId = maxId + 1; const newPlayer = { id: `player-${nextPlayerId}`, name: name, imageUrl: finalImageUrl, role: role, nickname: '', position: { x: 50, y: 50 }, borderColor: 'black', personalInfo: { birthday: '', phone: '', email: '' }, matchStats: { matchesPlayed: 0, goalsScored: 0 }, comments: [] }; squad.push(newPlayer); saveSquad(); renderUI(); closeAddPlayerModal(); console.log("Spiller lagt til:", newPlayer.id); }
function openPlayerDetailModal(playerId) { console.log("openPlayerDetailModal for:", playerId); const player = getPlayerById(playerId); const modalElement = document.getElementById('player-detail-modal'); if (!player || !modalElement) { console.error("Kan ikke åpne detaljer."); return; } const detailIdInput = modalElement.querySelector('#detail-player-id'); const detailTitle = modalElement.querySelector('#detail-modal-title'); const detailNameInput = modalElement.querySelector('#detail-player-name'); const detailNicknameInput = modalElement.querySelector('#detail-player-nickname'); const detailImageUrlInput = modalElement.querySelector('#detail-player-image-url'); const detailImageDisplay = modalElement.querySelector('#detail-player-image-display'); const detailRoleInput = modalElement.querySelector('#detail-player-role'); const detailBirthdayInput = modalElement.querySelector('#detail-player-birthday'); const detailPhoneInput = modalElement.querySelector('#detail-player-phone'); const detailEmailInput = modalElement.querySelector('#detail-player-email'); const detailMatchesPlayedInput = modalElement.querySelector('#detail-matches-played'); const detailGoalsScoredInput = modalElement.querySelector('#detail-goals-scored'); const detailCommentHistory = modalElement.querySelector('#detail-comment-history'); const detailMatchComment = modalElement.querySelector('#detail-match-comment'); if (!detailIdInput || !detailTitle || !detailNameInput || !detailNicknameInput || !detailImageUrlInput || !detailImageDisplay || !detailRoleInput || !detailBirthdayInput || !detailPhoneInput || !detailEmailInput || !detailMatchesPlayedInput || !detailGoalsScoredInput || !detailCommentHistory || !detailMatchComment) { console.error("Avbryter openPlayerDetailModal pga. manglende internt element."); return; } player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' }; player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 }; player.comments = player.comments || []; player.nickname = player.nickname || ''; player.imageUrl = player.imageUrl || ''; detailIdInput.value = player.id; detailTitle.textContent = `Detaljer for ${player.name}`; detailNameInput.value = player.name || ''; detailNicknameInput.value = player.nickname; detailRoleInput.value = player.role || ''; detailImageUrlInput.value = player.imageUrl; if (player.imageUrl) { detailImageDisplay.style.backgroundImage = `url('${player.imageUrl}')`; detailImageDisplay.innerHTML = ''; } else { detailImageDisplay.style.backgroundImage = 'none'; detailImageDisplay.innerHTML = '<span>Ingen bilde-URL</span>'; } detailBirthdayInput.value = player.personalInfo.birthday || ''; detailPhoneInput.value = player.personalInfo.phone || ''; detailEmailInput.value = player.personalInfo.email || ''; detailMatchesPlayedInput.value = player.matchStats.matchesPlayed || 0; detailGoalsScoredInput.value = player.matchStats.goalsScored || 0; renderCommentHistory(player.comments, detailCommentHistory); detailMatchComment.value = ''; modalElement.style.display = 'block'; }
function renderCommentHistory(comments, historyDivElement) { if (!historyDivElement) { console.warn("renderCommentHistory: historyDivElement mangler."); return; } historyDivElement.innerHTML = ''; if (!comments || comments.length === 0) { historyDivElement.innerHTML = '<p><i>Ingen historikk.</i></p>'; return; } const sortedComments = [...comments].sort((a, b) => new Date(b.date) - new Date(a.date)); sortedComments.forEach(comment => { const p = document.createElement('p'); const dateSpan = document.createElement('span'); dateSpan.classList.add('comment-date'); try { dateSpan.textContent = new Date(comment.date).toLocaleString('no-NO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { dateSpan.textContent = comment.date; } const textNode = document.createTextNode(comment.text); p.appendChild(dateSpan); p.appendChild(textNode); historyDivElement.appendChild(p); }); }
function closePlayerDetailModal() { const modalElement = document.getElementById('player-detail-modal'); if (modalElement) { modalElement.style.display = 'none'; } }
function handleAddCommentToHistory() { const modalElement = document.getElementById('player-detail-modal'); if (!modalElement) return; const detailIdInput = modalElement.querySelector('#detail-player-id'); const detailMatchCommentInput = modalElement.querySelector('#detail-match-comment'); const detailCommentHistoryDiv = modalElement.querySelector('#detail-comment-history'); if (!detailIdInput || !detailMatchCommentInput || !detailCommentHistoryDiv) { console.error("handleAddCommentToHistory: Mangler elementer."); return; } const playerId = detailIdInput.value; const player = getPlayerById(playerId); const commentText = detailMatchCommentInput.value.trim(); if (!player || !commentText) { alert("Skriv kommentar."); return; } const newComment = { date: new Date().toISOString(), text: commentText }; player.comments = player.comments || []; player.comments.push(newComment); saveSquad(); renderCommentHistory(player.comments, detailCommentHistoryDiv); detailMatchCommentInput.value = ''; alert("Kommentar lagt til."); }
function handleSavePlayerDetails() { const modalElement = document.getElementById('player-detail-modal'); if (!modalElement) return; const detailIdInput = modalElement.querySelector('#detail-player-id'); const detailNameInput = modalElement.querySelector('#detail-player-name'); const detailNicknameInput = modalElement.querySelector('#detail-player-nickname'); const detailImageUrlInput = modalElement.querySelector('#detail-player-image-url'); const detailRoleInput = modalElement.querySelector('#detail-player-role'); const detailBirthdayInput = modalElement.querySelector('#detail-player-birthday'); const detailPhoneInput = modalElement.querySelector('#detail-player-phone'); const detailEmailInput = modalElement.querySelector('#detail-player-email'); const detailMatchesPlayedInput = modalElement.querySelector('#detail-matches-played'); const detailGoalsScoredInput = modalElement.querySelector('#detail-goals-scored'); const detailMatchCommentInput = modalElement.querySelector('#detail-match-comment'); if (!detailIdInput || !detailNameInput || !detailNicknameInput || !detailImageUrlInput || !detailRoleInput || !detailBirthdayInput || !detailPhoneInput || !detailEmailInput || !detailMatchesPlayedInput || !detailGoalsScoredInput || !detailMatchCommentInput ) { console.error("handleSavePlayerDetails: Mangler elementer."); return; } const playerId = detailIdInput.value; const player = getPlayerById(playerId); if (!player) { return; } let dataChanged = false; let visualChanged = false; if (player.name !== detailNameInput.value) { player.name = detailNameInput.value; dataChanged = true; visualChanged = true; } if (player.nickname !== detailNicknameInput.value) { player.nickname = detailNicknameInput.value.trim(); dataChanged = true; visualChanged = true; } if (player.role !== detailRoleInput.value) { player.role = detailRoleInput.value; dataChanged = true; visualChanged = true; } const newImageUrl = detailImageUrlInput.value.trim(); if (player.imageUrl !== newImageUrl) { player.imageUrl = newImageUrl; dataChanged = true; visualChanged = true; console.log(`Image URL endret for ${playerId}`); } player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' }; player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 }; if (player.personalInfo.birthday !== detailBirthdayInput.value) { player.personalInfo.birthday = detailBirthdayInput.value; dataChanged = true; } if (player.personalInfo.phone !== detailPhoneInput.value) { player.personalInfo.phone = detailPhoneInput.value; dataChanged = true; } if (player.personalInfo.email !== detailEmailInput.value) { player.personalInfo.email = detailEmailInput.value; dataChanged = true; } const matches = parseInt(detailMatchesPlayedInput.value) || 0; const goals = parseInt(detailGoalsScoredInput.value) || 0; if (player.matchStats.matchesPlayed !== matches) { player.matchStats.matchesPlayed = matches; dataChanged = true; } if (player.matchStats.goalsScored !== goals) { player.matchStats.goalsScored = goals; dataChanged = true; } const currentComment = detailMatchCommentInput.value.trim(); if (currentComment) { if (confirm("Legge til usnlagret kommentar?")) { handleAddCommentToHistory(); dataChanged = true; } } if (dataChanged) { console.log("Lagrer detaljer:", playerId, player); saveSquad(); if (visualChanged) { renderUI(); const pieceElement = playersOnPitch[playerId]; if (pieceElement) { const nameDiv = pieceElement.querySelector('.player-name'); if (nameDiv) nameDiv.textContent = player.nickname || player.name; const imgDiv = pieceElement.querySelector('.player-image'); if (imgDiv) { if (player.imageUrl) { imgDiv.style.backgroundImage = `url('${player.imageUrl}')`; } else { imgDiv.style.backgroundImage = 'none'; imgDiv.style.backgroundColor = '#aaa'; } } } } alert("Detaljer lagret."); } else { console.log("Ingen endringer å lagre:", playerId); } closePlayerDetailModal(); }
// === 2. Modal Håndtering END ===


// === 3. UI Rendering START ===
function renderUI() { renderOnPitchList(); renderBench(); renderSquadList(); if(onPitchCountElement) onPitchCountElement.textContent = Object.keys(playersOnPitch).length; if(onBenchCountElement) onBenchCountElement.textContent = playersOnBench.length; }
function renderOnPitchList() { if (!onPitchListElement) return; onPitchListElement.innerHTML = ''; const playerIdsOnPitch = Object.keys(playersOnPitch); if (playerIdsOnPitch.length === 0) { onPitchListElement.innerHTML = '<li><i>Ingen spillere på banen.</i></li>'; return; } const sortedPlayers = playerIdsOnPitch.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name)); sortedPlayers.forEach(player => { const listItem = document.createElement('li'); listItem.textContent = (player.nickname || player.name) + (player.role ? ` (${player.role})` : ''); listItem.setAttribute('data-player-id', player.id); listItem.classList.add('on-pitch-player-item'); onPitchListElement.appendChild(listItem); }); }
function renderBench() { if (!benchListElement) return; benchListElement.innerHTML = ''; if (playersOnBench.length === 0) { benchListElement.innerHTML = '<li><i>Benken er tom.</i></li>'; return; } const sortedPlayers = playersOnBench.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name)); sortedPlayers.forEach(player => { const listItem = document.createElement('li'); listItem.textContent = (player.nickname || player.name) + (player.role ? ` (${player.role})` : ''); listItem.setAttribute('data-player-id', player.id); listItem.classList.add('bench-player-item', 'draggable'); listItem.setAttribute('draggable', true); benchListElement.appendChild(listItem); }); addDragListenersToBenchItems(); }
function renderSquadList() { if (!squadListElement) return; squadListElement.innerHTML = ''; const availablePlayers = squad.filter(p => !playersOnPitch[p.id] && !playersOnBench.includes(p.id)).sort((a, b) => a.name.localeCompare(b.name)); if (availablePlayers.length === 0 && squad.length > 0) { squadListElement.innerHTML = '<li><i>Alle spillere er plassert.</i></li>'; } else if (squad.length === 0) { squadListElement.innerHTML = '<li><i>Ingen spillere i troppen.</i></li>'; } else { availablePlayers.forEach(player => { const listItem = document.createElement('li'); listItem.textContent = (player.nickname || player.name) + (player.role ? ` (${player.role})` : ''); listItem.setAttribute('data-player-id', player.id); listItem.classList.add('squad-player-item', 'draggable'); listItem.setAttribute('draggable', true); squadListElement.appendChild(listItem); }); } addDragListenersToSquadItems(); }
// === 3. UI Rendering END ===


// === 4. Spillerbrikke & Ball Håndtering START ===
function createPlayerPieceElement(player, xPercent, yPercent) { const piece = document.createElement('div'); piece.classList.add('player-piece', 'draggable'); piece.setAttribute('data-player-id', player.id); piece.setAttribute('draggable', true); piece.style.left = `${xPercent}%`; piece.style.top = `${yPercent}%`; /* Transform settes nå kun av CSS */ const imgContainer = document.createElement('div'); imgContainer.classList.add('player-image-container'); imgContainer.style.borderColor = player.borderColor || 'black'; const imgDiv = document.createElement('div'); imgDiv.classList.add('player-image'); if (player.imageUrl && !player.imageUrl.startsWith('placeholder-file:')) imgDiv.style.backgroundImage = `url('${player.imageUrl}')`; else imgDiv.style.backgroundColor = '#aaa'; imgContainer.appendChild(imgDiv); piece.appendChild(imgContainer); const nameDiv = document.createElement('div'); nameDiv.classList.add('player-name'); nameDiv.textContent = player.nickname || player.name; piece.appendChild(nameDiv); piece.addEventListener('dragstart', handleDragStartPiece); piece.addEventListener('dragend', handleDragEnd); piece.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); piece.addEventListener('click', handlePlayerPieceClick); return piece; }
function getPlayerById(playerId) { if (!playerId) return null; return squad.find(p => p.id === playerId) || null; }
function updateBallPosition(xPercent, yPercent) { if (ballElement) { ballElement.style.left = `${xPercent}%`; ballElement.style.top = `${yPercent}%`; } }
// === 4. Spillerbrikke & Ball Håndtering END ===


// === 5. Drag and Drop & Valg/Farge/UI Toggles START ===
function addDragListenersToSquadItems() { if (!squadListElement) return; const items = squadListElement.querySelectorAll('.squad-player-item.draggable'); console.log(`addDragListenersToSquadItems: Fant ${items.length} squad items.`); items.forEach(item => { item.removeEventListener('dragstart', handleDragStart); item.addEventListener('dragstart', handleDragStart); item.removeEventListener('dragend', handleDragEnd); item.addEventListener('dragend', handleDragEnd); }); }
function addDragListenersToBenchItems() { if (!benchListElement) return; const items = benchListElement.querySelectorAll('.bench-player-item.draggable'); items.forEach(item => { item.removeEventListener('dragstart', handleDragStartBench); item.addEventListener('dragstart', handleDragStartBench); item.removeEventListener('dragend', handleDragEnd); item.addEventListener('dragend', handleDragEnd); }); }
function handleDragStart(event) { console.log("handleDragStart: Drag startet:", event.target); draggedPlayerId = event.target.getAttribute('data-player-id'); console.log("handleDragStart: ID:", draggedPlayerId); const player = getPlayerById(draggedPlayerId); if (!player) { console.error("handleDragStart: Fant ikke spiller ID:", draggedPlayerId); event.preventDefault(); return; } console.log("handleDragStart: Fant spiller:", player); draggedElement = event.target; dragSource = 'squad'; try { event.dataTransfer.setData('text/plain', draggedPlayerId); console.log("handleDragStart: setData satt for", draggedPlayerId); } catch (e) { console.error("handleDragStart: Feil ved setData:", e); event.preventDefault(); return; } event.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0); }
function handleDragStartBench(event) { draggedPlayerId = event.target.getAttribute('data-player-id'); if (!getPlayerById(draggedPlayerId)) { console.error("handleDragStartBench: Fant ikke spiller ID:", draggedPlayerId); event.preventDefault(); return; } draggedElement = event.target; dragSource = 'bench'; event.dataTransfer.setData('text/plain', draggedPlayerId); event.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0); }
function handleDragStartPiece(event) { const pieceElement = event.target.closest('.player-piece'); if (!pieceElement) { console.log("handleDragStartPiece: Avbrutt, fant ikke .player-piece"); return; } console.log("handleDragStartPiece: Starter drag for", pieceElement); if (!pieceElement.hasAttribute('draggable') || pieceElement.getAttribute('draggable') === 'false') { console.log("handleDragStartPiece: Avbrutt, element er ikke draggable:", pieceElement.getAttribute('draggable')); event.preventDefault(); return; } draggedPlayerId = pieceElement.getAttribute('data-player-id'); console.log("handleDragStartPiece: Player ID:", draggedPlayerId); if (!getPlayerById(draggedPlayerId)) { console.error("handleDragStartPiece: Fant ikke spiller ID:", draggedPlayerId); event.preventDefault(); return; } draggedElement = pieceElement; dragSource = 'pitch'; try { event.dataTransfer.setData('text/plain', draggedPlayerId); console.log("handleDragStartPiece: setData satt for", draggedPlayerId); event.dataTransfer.effectAllowed = 'move'; draggedElement.classList.add('dragging'); console.log("handleDragStartPiece: .dragging klasse lagt til"); } catch(e) { console.error("handleDragStartPiece: Feil under setData:", e); event.preventDefault(); } event.stopPropagation(); }
function handleBallDragStart(event) { console.log("handleBallDragStart: Drag startet:", event.target); try { event.dataTransfer.setData('text/x-dragged-item', 'ball'); dragSource = 'ball'; draggedElement = event.target; console.log("handleBallDragStart: setData satt for ball"); event.dataTransfer.effectAllowed = 'move'; event.target.classList.add('dragging'); } catch (e) { console.error("handleBallDragStart: Feil ved setData:", e); event.preventDefault(); } }
function handleDragOver(event, targetType) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; let targetElement; if (targetType === 'pitch') targetElement = pitchElement; else if (targetType === 'bench') targetElement = benchElement; else if (targetType === 'squad') targetElement = squadListContainer; if(targetElement) targetElement.classList.add('drag-over'); }
function handleDragLeave(event, targetType) { const relatedTarget = event.relatedTarget; let targetElement; if (targetType === 'pitch') targetElement = pitchElement; else if (targetType === 'bench') targetElement = benchElement; else if (targetType === 'squad') targetElement = squadListContainer; if (!targetElement) return; if (!relatedTarget || !targetElement.contains(relatedTarget)) { targetElement.classList.remove('drag-over'); } }
// === handleDropOnPitch (START - Fra V#62) ===
function handleDropOnPitch(event) {
    event.preventDefault();
    if (pitchElement) pitchElement.classList.remove('drag-over');

    const pitchRect = pitchElement.getBoundingClientRect();
    if (!pitchRect || pitchRect.width === 0 || pitchRect.height === 0) {
        console.error("handleDropOnPitch: Kan ikke beregne posisjon.", pitchRect);
        return;
    }

    // Få rå drop-koordinater relativt til viewport
    const dropX_viewport = event.clientX;
    const dropY_viewport = event.clientY;

    // Konverter til koordinater relativt til pitchElement's øvre venstre hjørne
    let dropX_relative = dropX_viewport - pitchRect.left;
    let dropY_relative = dropY_viewport - pitchRect.top;

    let xPercent, yPercent;

    // Korriger beregning hvis banen er rotert
    if (isPitchRotated) {
        // Når rotert 90 grader med klokken:
        // - Viewport X (dropX_relative) tilsvarer den *vertikale* aksen på den *originale* banen (fra bunn til topp).
        // - Viewport Y (dropY_relative) tilsvarer den *horisontale* aksen på den *originale* banen (fra venstre til høyre).
        // - pitchRect.width er nå den *korte* siden (original høyde).
        // - pitchRect.height er nå den *lange* siden (original bredde).

        // Beregn X-prosent (original horisontal akse) basert på dropY_relative og pitchRect.height (som er original bredde)
        xPercent = (dropY_relative / pitchRect.height) * 100;

        // Beregn Y-prosent (original vertikal akse) basert på dropX_relative og pitchRect.width (som er original høyde)
        // Siden (0,0) for den originale banen nå er øverst til høyre (etter 90 graders rotasjon), må vi invertere Y-aksen.
        yPercent = (1 - (dropX_relative / pitchRect.width)) * 100;

        console.log(`handleDropOnPitch (Rotated): drop(rel)(${dropX_relative.toFixed(1)}, ${dropY_relative.toFixed(1)}), rect(w:${pitchRect.width.toFixed(1)}, h:${pitchRect.height.toFixed(1)}), calc%(x:${xPercent.toFixed(1)}, y:${yPercent.toFixed(1)})`);

    } else {
        // Standard beregning for ikke-rotert bane
        xPercent = (dropX_relative / pitchRect.width) * 100;
        yPercent = (dropY_relative / pitchRect.height) * 100;
        console.log(`handleDropOnPitch (Normal): drop(rel)(${dropX_relative.toFixed(1)}, ${dropY_relative.toFixed(1)}), rect(w:${pitchRect.width.toFixed(1)}, h:${pitchRect.height.toFixed(1)}), calc%(x:${xPercent.toFixed(1)}, y:${yPercent.toFixed(1)})`);
    }

    // Klem prosentverdiene mellom 0 og 100
    xPercent = Math.max(0, Math.min(100, xPercent));
    yPercent = Math.max(0, Math.min(100, yPercent));


    // Håndter Ball drop
    const draggedItemType = event.dataTransfer.getData('text/x-dragged-item');
    if (draggedItemType === 'ball') {
        console.log(`handleDropOnPitch (Ball): Oppdaterer posisjon til ${xPercent.toFixed(1)}%, ${yPercent.toFixed(1)}%`);
        updateBallPosition(xPercent, yPercent);
        // Lagre ballens posisjon (hvis ønskelig, f.eks. i state)
        // saveCurrentState(); // Vurder om ballposisjon skal lagres
        return;
    }

    // Håndter Spiller drop
    let playerId;
    try {
        playerId = event.dataTransfer.getData('text/plain');
    } catch (e) {
        console.error("Feil ved henting av dataTransfer (spiller):", e);
        return;
    }
    if (!playerId) {
        console.warn("Drop on Pitch: Mottok tom playerId for spiller.");
        return;
    }

    const player = getPlayerById(playerId);
    if (!player) {
        console.error("Drop on Pitch: Fant ikke spiller ID:", playerId);
        return;
    }

    // Sjekk maks antall spillere hvis det er fra squad/bench
    if ((dragSource === 'squad' || dragSource === 'bench') && Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) {
        alert(`Maks ${MAX_PLAYERS_ON_PITCH} spillere på banen.`);
        return;
    }

    // Oppdater spillerens lagrede posisjon
    player.position = { x: xPercent, y: yPercent };
    console.log(`handleDropOnPitch (Spiller ${playerId}): Lagret posisjon:`, player.position);

    let stateChanged = false;
    // Sjekk om spilleren allerede er på banen (flyttes internt)
    if (playersOnPitch[playerId]) {
        const piece = playersOnPitch[playerId];
        console.log(`handleDropOnPitch: Flytter eksisterende brikke ${playerId} til ${xPercent.toFixed(1)}%, ${yPercent.toFixed(1)}%`);
        piece.style.left = `${xPercent}%`;
        piece.style.top = `${yPercent}%`;
        stateChanged = true;
    } else {
        // Plasser ny spiller på banen
        console.log(`handleDropOnPitch: Plasserer ny brikke ${playerId} på ${xPercent.toFixed(1)}%, ${yPercent.toFixed(1)}%`);
        const newPiece = createPlayerPieceElement(player, xPercent, yPercent);
        if (pitchSurface) pitchSurface.appendChild(newPiece);
        else console.error("FEIL: pitchSurface ikke funnet ved plassering!");
        playersOnPitch[playerId] = newPiece;

        // Fjern fra benk hvis kilden var benken
        if (dragSource === 'bench') {
            const benchIndex = playersOnBench.indexOf(playerId);
            if (benchIndex > -1) {
                playersOnBench.splice(benchIndex, 1);
            }
        }
        stateChanged = true;
    }

    if (stateChanged) {
        saveCurrentState(); // Lagre den oppdaterte spillerposisjonen
        renderUI();       // Oppdater listene i sidepanelet
    }
}
// === handleDropOnPitch (END - Fra V#62) ===
function handleDropOnBench(event) { event.preventDefault(); if (benchElement) benchElement.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); return; } if (!playerId) { console.warn("Drop on Bench: Mottok tom playerId."); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on Bench: Fant ikke spiller ID:", playerId); return; } let stateChanged = false; if (dragSource === 'pitch') { if (!playersOnBench.includes(playerId)) { playersOnBench.push(playerId); } if (playersOnPitch[playerId]) { playersOnPitch[playerId].remove(); delete playersOnPitch[playerId]; stateChanged = true; } } if (stateChanged) { saveCurrentState(); renderUI(); } }
function handleDropOnSquadList(event) { event.preventDefault(); if (squadListContainer) squadListContainer.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); return; } if (!playerId) { console.warn("Drop on Squad List: Mottok tom playerId."); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on Squad List: Fant ikke spiller ID:", playerId); return; } let stateChanged = false; if (dragSource === 'pitch') { if (playersOnPitch[playerId]) { playersOnPitch[playerId].remove(); delete playersOnPitch[playerId]; console.log(`Moved player ${playerId} from pitch to squad list`); stateChanged = true; } } else if (dragSource === 'bench') { const benchIndex = playersOnBench.indexOf(playerId); if (benchIndex > -1) { playersOnBench.splice(benchIndex, 1); console.log(`Moved player ${playerId} from bench to squad list`); stateChanged = true; } } else if (dragSource === 'squad') { console.log("Ignorerer slipp fra tropp til tropp."); } if (stateChanged) { saveCurrentState(); renderUI(); } }
function handleDragEnd(event) { console.log(`<<<<< handleDragEnd KALT for event target:`, event.target, `>>>>>`); const draggedElementTarget = event.target; setTimeout(() => { console.log(`handleDragEnd (setTimeout): Cleaning up...`); if(pitchElement) pitchElement.classList.remove('drag-over'); if(benchElement) benchElement.classList.remove('drag-over'); if(squadListContainer) squadListContainer.classList.remove('drag-over'); console.log(`handleDragEnd (setTimeout): Removed drag-over classes.`); if (draggedElementTarget && draggedElementTarget.classList.contains('dragging')) { draggedElementTarget.classList.remove('dragging'); console.log(`handleDragEnd (setTimeout): Fjernet .dragging fra event.target`); } else if (draggedElementTarget) { console.log(`handleDragEnd (setTimeout): event.target (${draggedElementTarget.tagName}${draggedElementTarget.className ? '.' + draggedElementTarget.className.replace(/ /g, '.') : ''}) hadde ikke .dragging klassen.`); } else { console.log(`handleDragEnd (setTimeout): event.target var ikke tilgjengelig?`); } resetDragState(); console.log(`handleDragEnd (setTimeout): Drag state nullstilt.`); }, 0); } // Added more detail to logging
function resetDragState() { draggedPlayerId = null; draggedElement = null; dragSource = null; }
function handlePlayerPieceClick(event) { const pieceElement = event.currentTarget; const playerId = pieceElement.getAttribute('data-player-id'); if (selectedPlayerIds.has(playerId)) { selectedPlayerIds.delete(playerId); pieceElement.classList.remove('selected'); } else { selectedPlayerIds.add(playerId); pieceElement.classList.add('selected'); } console.log("Valgte spillere:", selectedPlayerIds); }
function clearPlayerSelection() { selectedPlayerIds.forEach(id => { const piece = playersOnPitch[id]; if (piece) { piece.classList.remove('selected'); } }); selectedPlayerIds.clear(); console.log("Valg nullstilt."); }
function handleSetSelectedPlayerBorderColor() { const color = playerBorderColorInput.value; if (selectedPlayerIds.size === 0) { alert("Ingen spillere valgt."); return; } let stateChanged = false; selectedPlayerIds.forEach(playerId => { const player = getPlayerById(playerId); const piece = playersOnPitch[playerId]; if (player && piece) { if (player.borderColor !== color) { player.borderColor = color; const imgContainer = piece.querySelector('.player-image-container'); if (imgContainer) { imgContainer.style.borderColor = color; } stateChanged = true; } } }); if (stateChanged) { console.log("Farge oppdatert til:", color); saveCurrentState(); } clearPlayerSelection(); }
function toggleSidebar() { isSidebarHidden = !isSidebarHidden; if (appContainer) { appContainer.classList.toggle('sidebar-hidden', isSidebarHidden); if (toggleSidebarButton) { toggleSidebarButton.innerHTML = isSidebarHidden ? '>' : '<'; } console.log("Sidebar toggled, hidden:", isSidebarHidden); } }
// === togglePitchRotation (START - Fra V#68) ===
function togglePitchRotation() {
    isPitchRotated = !isPitchRotated; // Oppdater global status

    if (!pitchContainer || !pitchElement) {
        console.error("togglePitchRotation: pitchContainer or pitchElement not found!");
        return;
    }

    pitchContainer.classList.toggle('rotated', isPitchRotated);
    console.log("Pitch rotation toggled, rotated:", isPitchRotated);

    // Beregn og sett størrelse manuelt (kaller den nye funksjonen)
    resizePitchElement();

    // Logg dimensjoner etter en kort forsinkelse for å verifisere
    setTimeout(() => {
        if (pitchElement) {
            const width = pitchElement.offsetWidth;
            const height = pitchElement.offsetHeight;
            const actualAR = width > 0 && height > 0 ? width / height : 0;
            const expectedAR = isPitchRotated ? PITCH_ASPECT_RATIO_LANDSCAPE : PITCH_ASPECT_RATIO_PORTRAIT;

            console.log(`Pitch Dimensions AFTER JS Resize (${isPitchRotated ? 'Rotated' : 'Normal'}):`);
            console.log(`  - OffsetWidth: ${width}px`);
            console.log(`  - OffsetHeight: ${height}px`);
            console.log(`  - Actual AR (W/H): ${actualAR.toFixed(3)}`);
            console.log(`  - Expected AR: ${expectedAR.toFixed(3)}`);
            if (Math.abs(actualAR - expectedAR) > 0.01) { // Tillat litt avvik
                console.warn("  - AR MISMATCH DETECTED!");
            }
        } else {
            console.error("togglePitchRotation log: pitchElement not found!");
        }
    }, 100); // 100ms forsinkelse for layout-oppdatering

    saveCurrentState(); // Lagre den nye rotasjonsstatusen
}
// === togglePitchRotation (END - Fra V#68) ===
// === 5. Drag and Drop & Valg/Farge/UI Toggles END ===


// === 6. Lokal Lagring START ===
function saveSquad() { console.log("saveSquad: Prøver å lagre squad:", squad); try { const squadJson = JSON.stringify(squad); console.log("saveSquad: squad JSON:", squadJson); localStorage.setItem(STORAGE_KEY_SQUAD, squadJson); console.log("saveSquad: Lagring OK."); } catch (e) { console.error("Feil ved lagring av tropp:", e); alert("Kunne ikke lagre troppen."); } }
function loadSquad() { const savedSquadJson = localStorage.getItem(STORAGE_KEY_SQUAD); console.log("loadSquad: Hentet rådata:", savedSquadJson); if (savedSquadJson) { try { const parsedSquad = JSON.parse(savedSquadJson); squad = parsedSquad.map(player => ({ ...player, nickname: player.nickname || '', imageUrl: player.imageUrl || '', personalInfo: player.personalInfo || { birthday: '', phone: '', email: '' }, matchStats: player.matchStats || { matchesPlayed: 0, goalsScored: 0 }, comments: player.comments || [], borderColor: player.borderColor || 'black' // Sørg for at borderColor lastes inn
                , position: player.position || { x: 50, y: 50 } // Sørg for at posisjon lastes inn
             })); console.log("loadSquad: Parsed and initialized squad:", squad); const maxId = squad.reduce((max, p) => { const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0; return Math.max(max, !isNaN(idNum) ? idNum : 0); }, 0); nextPlayerId = maxId + 1; console.log("loadSquad: Next player ID:", nextPlayerId); return true; } catch (e) { console.error("Feil ved parsing/init av lagret tropp:", e); squad = []; localStorage.removeItem(STORAGE_KEY_SQUAD); return false; } } console.log("Ingen tropp funnet."); squad = []; return false; }
// === getCurrentStateData (START - Fra V#62) ===
function getCurrentStateData() {
    const playersOnPitchData = {};
    for (const playerId in playersOnPitch) {
        const player = getPlayerById(playerId);
        if (player && player.position && typeof player.position.x === 'number' && typeof player.position.y === 'number') { // Forbedret sjekk
            playersOnPitchData[playerId] = {
                x: player.position.x,
                y: player.position.y,
                borderColor: player.borderColor || 'black'
            };
        } else if (player) {
             console.warn(`getCurrentStateData: Spiller ${playerId} mangler gyldig posisjonsdata. Bruker default. Posisjon:`, player.position);
              playersOnPitchData[playerId] = { x: 50, y: 50, borderColor: player.borderColor || 'black' };
        }
    }
    // Vurder å lagre ballposisjon også
    // const ballPos = ballElement ? { x: parseFloat(ballElement.style.left), y: parseFloat(ballElement.style.top) } : { x: 50, y: 50 };
    return {
        playersOnPitchData: playersOnPitchData,
        playersOnBenchIds: [...playersOnBench],
        // ballPosition: ballPos // Hvis ballposisjon skal lagres
        isPitchRotated: isPitchRotated // Lagre rotasjonsstatus
    };
}
// === getCurrentStateData (END - Fra V#62) ===
function saveCurrentState() { try { const stateData = getCurrentStateData(); localStorage.setItem(STORAGE_KEY_LAST_STATE, JSON.stringify(stateData)); console.log("Lagret current state:", stateData); } catch (e) { console.error("Feil ved lagring av state:", e); } }
// === applyState (START - Fra V#68) ===
function applyState(stateData) {
    if (!stateData) return;
    clearPitch();
    playersOnPitch = {};
    playersOnBench = [];

    // Gjenopprett rotasjonsstatus FØRST
    isPitchRotated = stateData.isPitchRotated || false;
    if (pitchContainer) {
        pitchContainer.classList.toggle('rotated', isPitchRotated);
        // VIKTIG: Kall resize her også for å sette korrekt størrelse ved last
        resizePitchElement();
        console.log("applyState: Rotasjonsstatus satt til:", isPitchRotated);
    }

    // Plasser spillere
    if (stateData.playersOnPitchData) {
        for (const playerId in stateData.playersOnPitchData) {
            const player = getPlayerById(playerId);
            const positionData = stateData.playersOnPitchData[playerId];
            if (player && positionData && typeof positionData.x === 'number' && typeof positionData.y === 'number') {
                player.position = { x: positionData.x, y: positionData.y };
                player.borderColor = positionData.borderColor || 'black';
                const piece = createPlayerPieceElement(player, player.position.x, player.position.y);
                if(pitchSurface) pitchSurface.appendChild(piece);
                else console.error("FEIL: pitchSurface ikke funnet ved applyState!");
                playersOnPitch[playerId] = piece;
            } else {
                console.warn(`Kunne ikke plassere spiller ${playerId} fra state. Data:`, player, positionData);
            }
        }
    }

    // Plasser spillere på benk
    if (stateData.playersOnBenchIds) {
        playersOnBench = stateData.playersOnBenchIds.filter(id => getPlayerById(id));
    }

    // Gjenopprett ballposisjon (hvis lagret)
    // if (stateData.ballPosition && typeof stateData.ballPosition.x === 'number' && typeof stateData.ballPosition.y === 'number') {
    //     updateBallPosition(stateData.ballPosition.x, stateData.ballPosition.y);
    // } else if (ballElement) {
    //      updateBallPosition(50, 50); // Default ball pos
    // }

    renderUI();
    console.log("Tilstand anvendt.");
}
// === applyState (END - Fra V#68) ===
// === resizePitchElement (MODIFIED) START ===
function resizePitchElement() {
     if (!pitchContainer || !pitchElement) {
        console.error("resizePitchElement: pitchContainer or pitchElement not found!");
        return;
    }
    const containerWidth = pitchContainer.clientWidth;
    const containerHeight = pitchContainer.clientHeight;
    let targetWidth, targetHeight; // Beregnede *visuelle* dimensjoner

     if (isPitchRotated) { // LANDSKAP
        // Beregn dimensjoner som om banen *visuelt* skal passe inn
        const heightFromWidth = containerWidth / PITCH_ASPECT_RATIO_LANDSCAPE; // Høyde hvis bredden fyller
        const widthFromHeight = containerHeight * PITCH_ASPECT_RATIO_LANDSCAPE; // Bredde hvis høyden fyller

        if (heightFromWidth <= containerHeight) {
            // Bredden er begrensende
            targetWidth = containerWidth;
            targetHeight = heightFromWidth;
             console.log("JS Resize Calc (Landscape): Width limited");
        } else {
            // Høyden er begrensende
            targetWidth = widthFromHeight;
            targetHeight = containerHeight;
             console.log("JS Resize Calc (Landscape): Height limited");
        }
        // *** SWAP for transform: rotate(90deg) ***
        pitchElement.style.width = `${targetHeight}px`; // Sett bredde til beregnet HØYDE
        pitchElement.style.height = `${targetWidth}px`; // Sett høyde til beregnet BREDDE
        console.log(`JS Resize SET (Landscape): Style W=${targetHeight.toFixed(0)}px, H=${targetWidth.toFixed(0)}px`);

    } else { // PORTRETT
        // Beregn dimensjoner som normalt
        const widthFromHeight = containerHeight * PITCH_ASPECT_RATIO_PORTRAIT;
        const heightFromWidth = containerWidth / PITCH_ASPECT_RATIO_PORTRAIT;

        if (widthFromHeight <= containerWidth) {
            // Høyden er begrensende
            targetWidth = widthFromHeight;
            targetHeight = containerHeight;
             console.log("JS Resize Calc (Portrait): Height limited");
        } else {
            // Bredden er begrensende
            targetWidth = containerWidth;
            targetHeight = heightFromWidth;
             console.log("JS Resize Calc (Portrait): Width limited");
        }
        // Sett dimensjoner direkte
        pitchElement.style.width = `${targetWidth}px`;
        pitchElement.style.height = `${targetHeight}px`;
        console.log(`JS Resize SET (Portrait): Style W=${targetWidth.toFixed(0)}px, H=${targetHeight.toFixed(0)}px`);
    }
}
// === resizePitchElement (MODIFIED) END ===
function loadLastState() { const savedState = localStorage.getItem(STORAGE_KEY_LAST_STATE); if (savedState) { try { const stateData = JSON.parse(savedState); applyState(stateData); console.log("Siste tilstand lastet."); } catch (e) { console.error("Feil ved parsing av state:", e); clearPitch(); playersOnPitch = {}; playersOnBench = []; isPitchRotated = false; if (pitchContainer) pitchContainer.classList.remove('rotated'); resizePitchElement(); /* Sett størrelse også ved feil */ renderUI(); } } else { console.log("Ingen lagret tilstand funnet."); clearPitch(); playersOnPitch = {}; playersOnBench = []; isPitchRotated = false; // Sørg for at default er ikke-rotert
     if (pitchContainer) pitchContainer.classList.remove('rotated'); resizePitchElement(); /* Sett default størrelse */ renderUI(); } }
function clearPitch() { if (!pitchSurface) {console.error("clearPitch: pitchSurface ikke funnet!"); return;} const pieces = pitchSurface.querySelectorAll('.player-piece'); pieces.forEach(piece => piece.remove()); console.log("clearPitch: Fjernet spillerbrikker fra pitchSurface"); }
function getSavedSetups() { const setupsJson = localStorage.getItem(STORAGE_KEY_SETUPS); if (setupsJson) { try { return JSON.parse(setupsJson); } catch (e) { console.error("Feil ved parsing av oppsett:", e); return {}; } } return {}; }
function handleSaveSetup() { if(!setupNameInput || !loadSetupSelect) return; const name = setupNameInput.value.trim(); if (!name) { alert("Skriv inn navn."); return; } const currentSetups = getSavedSetups(); const currentState = getCurrentStateData(); currentSetups[name] = currentState; try { localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(currentSetups)); alert(`Oppsett "${name}" lagret!`); populateSetupDropdown(); setupNameInput.value = ''; } catch (e) { console.error("Feil ved lagring av oppsett:", e); alert("Kunne ikke lagre."); } }
function handleLoadSetup() { if(!loadSetupSelect) return; const selectedName = loadSetupSelect.value; if (!selectedName) { alert("Velg oppsett."); return; } const savedSetups = getSavedSetups(); const setupToLoad = savedSetups[selectedName]; if (setupToLoad) { applyState(setupToLoad); alert(`Oppsett "${selectedName}" lastet!`); saveCurrentState(); } else { alert(`Fant ikke "${selectedName}".`); } }
function handleDeleteSetup() { if(!loadSetupSelect) return; const selectedName = loadSetupSelect.value; if (!selectedName) { alert("Velg oppsett."); return; } const savedSetups = getSavedSetups(); if (savedSetups[selectedName]) { if (confirm(`Slette "${selectedName}"?`)) { delete savedSetups[selectedName]; try { localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(savedSetups)); alert(`Oppsett "${selectedName}" slettet.`); populateSetupDropdown(); } catch (e) { console.error("Feil ved sletting:", e); alert("Kunne ikke slette."); } } } else { alert(`Fant ikke "${selectedName}".`); } }
function populateSetupDropdown() { if (!loadSetupSelect) return; const savedSetups = getSavedSetups(); const setupNames = Object.keys(savedSetups); loadSetupSelect.innerHTML = '<option value="">Velg oppsett...</option>'; setupNames.sort(); setupNames.forEach(name => { const option = document.createElement('option'); option.value = name; option.textContent = name; loadSetupSelect.appendChild(option); }); }
// === 6. Lokal Lagring END ===


// === 7. Event Listeners START ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initialiserer app...');
    addPlayerModal = document.getElementById('add-player-modal');
    closeButton = addPlayerModal ? addPlayerModal.querySelector('.close-button') : null;
    newPlayerNameInput = document.getElementById('new-player-name');
    newPlayerImageUpload = document.getElementById('new-player-image-upload');
    newPlayerImageUrlInput = document.getElementById('new-player-image-url');
    newPlayerRoleInput = document.getElementById('new-player-role');
    confirmAddPlayerButton = document.getElementById('confirm-add-player');
    playerDetailModal = document.getElementById('player-detail-modal');
    benchElement = document.getElementById('bench');
    console.log("DOMContentLoaded: Modal og bench element references assigned/checked.");
    loadSquad(); loadLastState(); populateSetupDropdown(); // loadLastState() kaller nå resizePitchElement
    if (addPlayerButton) { addPlayerButton.addEventListener('click', openAddPlayerModal); console.log("Listener: addPlayerButton OK"); } else { console.error("addPlayerButton ikke funnet!"); }
    if (closeButton) { closeButton.addEventListener('click', closeAddPlayerModal); console.log("Listener: closeButton OK"); } else { console.error("closeButton ikke funnet!"); }
    if (confirmAddPlayerButton) { confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm); console.log('Listener: confirmAddPlayerButton OK'); } else { console.error('confirmAddPlayerButton ikke funnet!'); }
    const detailModalCloseBtn = playerDetailModal ? playerDetailModal.querySelector('.close-detail-button') : null;
    const detailModalSaveBtn = playerDetailModal ? playerDetailModal.querySelector('#save-details-button') : null;
    const detailModalAddCommentBtn = playerDetailModal ? playerDetailModal.querySelector('#add-comment-to-history-button') : null;
    if (detailModalCloseBtn) { detailModalCloseBtn.addEventListener('click', closePlayerDetailModal); console.log("Listener: closeDetailButton OK"); } else { console.error("closeDetailButton ikke funnet!"); }
    if (detailModalSaveBtn) { detailModalSaveBtn.addEventListener('click', handleSavePlayerDetails); console.log("Listener: saveDetailsButton OK"); } else { console.error("saveDetailsButton ikke funnet!"); }
    if (detailModalAddCommentBtn) { detailModalAddCommentBtn.addEventListener('click', handleAddCommentToHistory); console.log("Listener: addCommentToHistoryButton OK"); } else { console.error("addCommentToHistoryButton ikke funnet!"); }
    window.addEventListener('click', (event) => { if (addPlayerModal && event.target === addPlayerModal) closeAddPlayerModal(); if (playerDetailModal && event.target === playerDetailModal) closePlayerDetailModal(); if (!event.target.closest('.player-piece') && selectedPlayerIds.size > 0) { clearPlayerSelection(); } });
    if (pitchElement) { pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch')); pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch')); pitchElement.addEventListener('drop', handleDropOnPitch); console.log("Listeners: pitchElement OK"); } else { console.error("pitchElement ikke funnet!"); }
    if (benchElement) { benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench')); benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench')); benchElement.addEventListener('drop', handleDropOnBench); console.log("Listeners: benchElement OK"); } else { console.error("benchElement ikke funnet!"); }
    if (squadListContainer) { squadListContainer.addEventListener('dragover', (e) => handleDragOver(e, 'squad')); squadListContainer.addEventListener('dragleave', (e) => handleDragLeave(e, 'squad')); squadListContainer.addEventListener('drop', handleDropOnSquadList); console.log("Listeners: squadListContainer OK"); } else { console.error("squadListContainer ikke funnet!"); }
    if (ballElement) { ballElement.addEventListener('dragstart', handleBallDragStart); ballElement.addEventListener('dragend', handleDragEnd); console.log("Listener: ballElement OK"); } else { console.error("ballElement ikke funnet!"); }
    if (toggleSidebarButton) { toggleSidebarButton.addEventListener('click', toggleSidebar); console.log("Listener: toggleSidebarButton OK"); } else { console.error("toggleSidebarButton ikke funnet!"); }
    if (rotatePitchButton) { rotatePitchButton.addEventListener('click', togglePitchRotation); console.log("Listener: rotatePitchButton OK"); } else { console.error("rotatePitchButton ikke funnet!"); }
    if (setBorderColorButton) { setBorderColorButton.addEventListener('click', handleSetSelectedPlayerBorderColor); console.log("Listener: setBorderColorButton OK"); } else { console.error("setBorderColorButton ikke funnet!"); }
    if (saveSetupButton) { saveSetupButton.addEventListener('click', handleSaveSetup); console.log("Listener: saveSetupButton OK"); } else { console.error("saveSetupButton ikke funnet!"); }
    if (loadSetupButton) { loadSetupButton.addEventListener('click', handleLoadSetup); console.log("Listener: loadSetupButton OK"); } else { console.error("loadSetupButton ikke funnet!"); }
    if (deleteSetupButton) { deleteSetupButton.addEventListener('click', handleDeleteSetup); console.log("Listener: deleteSetupButton OK"); } else { console.error("deleteSetupButton ikke funnet!"); }

    // Legg til lytter for resize av vinduet for å justere banestørrelsen
    window.addEventListener('resize', resizePitchElement);

    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 7. Event Listeners END ===
/* Version: #69 */
