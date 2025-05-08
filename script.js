/* Version: #115 */
// === 0. Globale Variabler og Konstanter START ===
let squad = [];
let playersOnPitch = {}; // { playerId: element }
let playersOnBench = []; // [playerId1, playerId2]
let nextPlayerId = 1;
let draggedPlayerId = null;
let draggedElement = null;
let dragSource = null; // 'squad', 'pitch', 'bench', 'ball', 'onpitch-list'
let selectedPlayerIds = new Set();
let isSidebarHidden = false;
let isPitchRotated = false; 

let ballSettings = {
    size: 35, style: 'default', color: '#FFA500', position: { x: 50, y: 50}
};

const MAX_PLAYERS_ON_PITCH = 11;
const PITCH_ASPECT_RATIO_PORTRAIT = 2 / 3;
const PITCH_ASPECT_RATIO_LANDSCAPE = 3 / 2;

const STORAGE_KEY_SQUAD = 'fotballtaktiker_squad';
const STORAGE_KEY_LAST_STATE = 'fotballtaktiker_lastState';
const STORAGE_KEY_SETUPS = 'fotballtaktiker_setups';

const PLAYER_ROLES = { K: "Keeper", HB: "Høyreback", HVB: "Høyre Vingback", VB: "Venstreback", VVB: "Venstre Vingback", MS: "Midtstopper", SW: "Libero", DM: "Defensiv Midtbane", HM: "Høyre Midtbane", HV: "Høyre Ving", VM: "Venstre Midtbane", VV: "Venstre Ving", SM: "Sentral Midtbane", OM: "Offensiv Midtbane", S: "Spiss", CF: "Midtspiss" };
const PLAYER_STATUSES = { AVAILABLE: "Kampklar", INJURED_SHORT: "Skadet (Kortvarig)", INJURED_LONG: "Skadet (Langvarig)", SUSPENDED: "Suspendert", LIGHT_TRAINING: "Lett Trening", UNAVAILABLE: "Utilgjengelig (Annet)" };
const DEFAULT_PLAYER_STATUS = 'AVAILABLE';
// === 0. Globale Variabler og Konstanter END ===


// === 1. DOM Element Referanser START ===
const appContainer = document.querySelector('.app-container');
const sidebar = document.querySelector('.sidebar');
const toggleSidebarButton = document.getElementById('toggle-sidebar-button');
const onPitchListElement = document.getElementById('on-pitch-list');
const benchListElement = document.getElementById('bench-list');
const squadListElement = document.getElementById('squad-list');
const squadListContainer = document.getElementById('squad-list-container');
const onPitchCountElement = document.getElementById('on-pitch-count');
const onBenchCountElement = document.getElementById('on-bench-count');
const pitchElement = document.getElementById('pitch');
const pitchSurface = document.getElementById('pitch-surface');
const rotatePitchButton = document.getElementById('rotate-pitch-button');
const addPlayerButton = document.getElementById('add-player-button');
const playerBorderColorInput = document.getElementById('player-border-color');
const setBorderColorButton = document.getElementById('set-border-color-button');
const setColorRedButton = document.getElementById('set-color-red');
const setColorYellowButton = document.getElementById('set-color-yellow');
const setColorGreenButton = document.getElementById('set-color-green');
const setColorDefaultButton = document.getElementById('set-color-default');
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
const navTacticsButton = document.getElementById('nav-tactics-button');
const navSquadButton = document.getElementById('nav-squad-button');
const tacticsPageContent = document.getElementById('tactics-page-content');
const squadPageContent = document.getElementById('squad-page-content');
const fullSquadListContainer = document.getElementById('full-squad-list-container');
const onPitchSectionElement = document.getElementById('on-pitch-section');

let addPlayerModal; let closeButton; let newPlayerNameInput; let newPlayerImageUpload; let newPlayerImageUrlInput; let newPlayerMainRoleInput; let confirmAddPlayerButton;
let playerDetailModal;
let ballSettingsModal;
let benchElement; 
// === 1. DOM Element Referanser END ===


// === 2. Modal Håndtering START ===
// === FUNKSJON: populateRolesCheckboxes START ===
function populateRolesCheckboxes(containerId, selectedRoles = []) { const container = document.getElementById(containerId); if (!container) return; container.innerHTML = ''; Object.entries(PLAYER_ROLES).forEach(([key, value]) => { const div = document.createElement('div'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = `${containerId}-${key}`; checkbox.value = key; checkbox.checked = selectedRoles.includes(key); const label = document.createElement('label'); label.htmlFor = `${containerId}-${key}`; label.textContent = `${value} (${key})`; div.appendChild(checkbox); div.appendChild(label); container.appendChild(div); }); }
// === FUNKSJON: populateRolesCheckboxes END ===
// === FUNKSJON: populateStatusDropdown START ===
function populateStatusDropdown(selectElementId, currentStatusKey) { const selectElement = document.getElementById(selectElementId); if (!selectElement) { console.error(`populateStatusDropdown: Finner ikke selectElement med ID ${selectElementId}`); return; } selectElement.innerHTML = ''; Object.entries(PLAYER_STATUSES).forEach(([key, value]) => { const option = document.createElement('option'); option.value = key; option.textContent = value; if (key === currentStatusKey) { option.selected = true; } selectElement.appendChild(option); }); }
// === FUNKSJON: populateStatusDropdown END ===
// === FUNKSJON: openAddPlayerModal START ===
function openAddPlayerModal() { if (!addPlayerModal) { console.error('openAddPlayerModal: FEIL - addPlayerModal elementet er null!'); return; } addPlayerModal.style.display = 'block'; if (newPlayerNameInput) newPlayerNameInput.value = ''; if (newPlayerImageUpload) newPlayerImageUpload.value = ''; if (newPlayerImageUrlInput) newPlayerImageUrlInput.value = ''; if (newPlayerMainRoleInput) newPlayerMainRoleInput.value = ''; populateRolesCheckboxes('new-player-roles-checkboxes'); if (newPlayerNameInput) newPlayerNameInput.focus(); }
// === FUNKSJON: openAddPlayerModal END ===
// === FUNKSJON: closeAddPlayerModal START ===
function closeAddPlayerModal() { if (addPlayerModal) { addPlayerModal.style.display = 'none'; } }
// === FUNKSJON: closeAddPlayerModal END ===
// === FUNKSJON: handleAddPlayerConfirm START ===
function handleAddPlayerConfirm() { if (!newPlayerNameInput || !newPlayerImageUrlInput || !newPlayerMainRoleInput || !newPlayerImageUpload) { console.error("handleAddPlayerConfirm: Ett eller flere input-elementer mangler!"); return; } const name = newPlayerNameInput.value.trim(); const imageFile = newPlayerImageUpload.files[0]; let imageUrl = newPlayerImageUrlInput.value.trim(); const mainRole = newPlayerMainRoleInput.value.trim(); if (!name) { alert('Spillernavn må fylles ut.'); return; } let finalImageUrl = imageUrl; if (!finalImageUrl && imageFile) { console.warn("Filopplasting støttes ikke for lagring enda."); } const selectedRoles = []; const checkboxesContainer = document.getElementById('new-player-roles-checkboxes'); if (checkboxesContainer) { const roleCheckboxes = checkboxesContainer.querySelectorAll('input[type="checkbox"]:checked'); roleCheckboxes.forEach(cb => selectedRoles.push(cb.value)); } const maxId = squad.reduce((max, p) => Math.max(max, parseInt(p.id.split('-')[1]) || 0), 0); nextPlayerId = maxId + 1; const newPlayer = { id: `player-${nextPlayerId}`, name: name, imageUrl: finalImageUrl, mainRole: mainRole, playableRoles: selectedRoles, status: DEFAULT_PLAYER_STATUS, nickname: '', position: { x: 50, y: 50 }, borderColor: 'black', personalInfo: { birthday: '', phone: '', email: '' }, matchStats: { matchesPlayed: 0, goalsScored: 0 }, comments: [] }; squad.push(newPlayer); saveSquad(); renderUI(); if (appContainer && appContainer.classList.contains('view-squad')) { renderFullSquadList(); } closeAddPlayerModal(); }
// === FUNKSJON: handleAddPlayerConfirm END ===
// === FUNKSJON: openPlayerDetailModal START ===
function openPlayerDetailModal(playerId) { const player = getPlayerById(playerId); const modalElement = document.getElementById('player-detail-modal'); if (!player || !modalElement) { console.error("Kan ikke åpne detaljer for spiller:", playerId); return; } player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' }; player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 }; player.comments = player.comments || []; player.nickname = player.nickname || ''; player.imageUrl = player.imageUrl || ''; player.mainRole = player.mainRole || ''; player.playableRoles = player.playableRoles || []; player.status = player.status || DEFAULT_PLAYER_STATUS; const detailIdInput = modalElement.querySelector('#detail-player-id'); const detailTitle = modalElement.querySelector('#detail-modal-title'); const detailNameInput = modalElement.querySelector('#detail-player-name'); const detailNicknameInput = modalElement.querySelector('#detail-player-nickname'); const detailImageUrlInput = modalElement.querySelector('#detail-player-image-url'); const detailImageDisplay = modalElement.querySelector('#detail-player-image-display'); const detailMainRoleInput = modalElement.querySelector('#detail-player-main-role'); const detailPlayerStatusSelect = modalElement.querySelector('#detail-player-status'); const detailBirthdayInput = modalElement.querySelector('#detail-player-birthday'); const detailPhoneInput = modalElement.querySelector('#detail-player-phone'); const detailEmailInput = modalElement.querySelector('#detail-player-email'); const detailMatchesPlayedInput = modalElement.querySelector('#detail-matches-played'); const detailGoalsScoredInput = modalElement.querySelector('#detail-goals-scored'); const detailCommentHistory = modalElement.querySelector('#detail-comment-history'); const detailMatchComment = modalElement.querySelector('#detail-match-comment'); if (!detailIdInput || !detailTitle || !detailNameInput || !detailNicknameInput || !detailImageUrlInput || !detailImageDisplay || !detailMainRoleInput || !detailPlayerStatusSelect || !detailBirthdayInput || !detailPhoneInput || !detailEmailInput || !detailMatchesPlayedInput || !detailGoalsScoredInput || !detailCommentHistory || !detailMatchComment) { console.error("Avbryter openPlayerDetailModal pga. manglende internt element."); return; } detailIdInput.value = player.id; detailTitle.textContent = `Detaljer for ${player.name}`; detailNameInput.value = player.name || ''; detailNicknameInput.value = player.nickname; detailMainRoleInput.value = player.mainRole || ''; detailImageUrlInput.value = player.imageUrl; if (player.imageUrl) { detailImageDisplay.style.backgroundImage = `url('${player.imageUrl}')`; detailImageDisplay.innerHTML = ''; } else { detailImageDisplay.style.backgroundImage = 'none'; detailImageDisplay.innerHTML = '<span>Ingen bilde-URL</span>'; } populateStatusDropdown('detail-player-status', player.status); detailBirthdayInput.value = player.personalInfo.birthday || ''; detailPhoneInput.value = player.personalInfo.phone || ''; detailEmailInput.value = player.personalInfo.email || ''; detailMatchesPlayedInput.value = player.matchStats.matchesPlayed || 0; detailGoalsScoredInput.value = player.matchStats.goalsScored || 0; populateRolesCheckboxes('detail-player-roles-checkboxes', player.playableRoles); renderCommentHistory(player.comments, detailCommentHistory); detailMatchComment.value = ''; modalElement.style.display = 'block'; }
// === FUNKSJON: openPlayerDetailModal END ===
// === FUNKSJON: renderCommentHistory START ===
function renderCommentHistory(comments, historyDivElement) { if (!historyDivElement) return; historyDivElement.innerHTML = ''; if (!comments || comments.length === 0) { historyDivElement.innerHTML = '<p><i>Ingen historikk.</i></p>'; return; } const sortedComments = [...comments].sort((a, b) => new Date(b.date) - new Date(a.date)); sortedComments.forEach(comment => { const p = document.createElement('p'); const dateSpan = document.createElement('span'); dateSpan.classList.add('comment-date'); try { dateSpan.textContent = new Date(comment.date).toLocaleString('no-NO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { dateSpan.textContent = comment.date; } const textNode = document.createTextNode(comment.text); p.appendChild(dateSpan); p.appendChild(textNode); historyDivElement.appendChild(p); }); }
// === FUNKSJON: renderCommentHistory END ===
// === FUNKSJON: closePlayerDetailModal START ===
function closePlayerDetailModal() { const modalElement = document.getElementById('player-detail-modal'); if (modalElement) { modalElement.style.display = 'none'; } }
// === FUNKSJON: closePlayerDetailModal END ===
// === FUNKSJON: handleAddCommentToHistory START ===
function handleAddCommentToHistory() { const modalElement = document.getElementById('player-detail-modal'); if (!modalElement) return; const detailIdInput = modalElement.querySelector('#detail-player-id'); const detailMatchCommentInput = modalElement.querySelector('#detail-match-comment'); const detailCommentHistoryDiv = modalElement.querySelector('#detail-comment-history'); if (!detailIdInput || !detailMatchCommentInput || !detailCommentHistoryDiv) return; const playerId = detailIdInput.value; const player = getPlayerById(playerId); const commentText = detailMatchCommentInput.value.trim(); if (!player || !commentText) { alert("Skriv kommentar."); return; } const newComment = { date: new Date().toISOString(), text: commentText }; player.comments = player.comments || []; player.comments.push(newComment); saveSquad(); renderCommentHistory(player.comments, detailCommentHistoryDiv); detailMatchCommentInput.value = ''; alert("Kommentar lagt til."); }
// === FUNKSJON: handleAddCommentToHistory END ===
// === FUNKSJON: handleSavePlayerDetails START ===
function handleSavePlayerDetails() { const modalElement = document.getElementById('player-detail-modal'); if (!modalElement) return; const detailIdInput = modalElement.querySelector('#detail-player-id'); const detailNameInput = modalElement.querySelector('#detail-player-name'); const detailNicknameInput = modalElement.querySelector('#detail-player-nickname'); const detailImageUrlInput = modalElement.querySelector('#detail-player-image-url'); const detailMainRoleInput = modalElement.querySelector('#detail-player-main-role'); const detailPlayerStatusSelect = modalElement.querySelector('#detail-player-status'); const detailBirthdayInput = modalElement.querySelector('#detail-player-birthday'); const detailPhoneInput = modalElement.querySelector('#detail-player-phone'); const detailEmailInput = modalElement.querySelector('#detail-player-email'); const detailMatchesPlayedInput = modalElement.querySelector('#detail-matches-played'); const detailGoalsScoredInput = modalElement.querySelector('#detail-goals-scored'); const detailMatchCommentInput = modalElement.querySelector('#detail-match-comment'); if (!detailIdInput || !detailNameInput || !detailNicknameInput || !detailImageUrlInput || !detailMainRoleInput || !detailPlayerStatusSelect || !detailBirthdayInput || !detailPhoneInput || !detailEmailInput || !detailMatchesPlayedInput || !detailGoalsScoredInput || !detailMatchCommentInput ) { console.error("handleSavePlayerDetails: Mangler elementer."); return; } const playerId = detailIdInput.value; const player = getPlayerById(playerId); if (!player) return; let dataChanged = false; let visualChanged = false; if (player.name !== detailNameInput.value) { player.name = detailNameInput.value; dataChanged = true; visualChanged = true; } if (player.nickname !== detailNicknameInput.value) { player.nickname = detailNicknameInput.value.trim(); dataChanged = true; visualChanged = true; } if (player.mainRole !== detailMainRoleInput.value) { player.mainRole = detailMainRoleInput.value; dataChanged = true; visualChanged = true; } const newImageUrl = detailImageUrlInput.value.trim(); if (player.imageUrl !== newImageUrl) { player.imageUrl = newImageUrl; dataChanged = true; visualChanged = true; } const newStatus = detailPlayerStatusSelect.value; if (player.status !== newStatus) { player.status = newStatus; dataChanged = true; visualChanged = true; } const selectedRoles = []; const checkboxesContainer = document.getElementById('detail-player-roles-checkboxes'); if (checkboxesContainer) { const roleCheckboxes = checkboxesContainer.querySelectorAll('input[type="checkbox"]:checked'); roleCheckboxes.forEach(cb => selectedRoles.push(cb.value)); } if (JSON.stringify(player.playableRoles || []) !== JSON.stringify(selectedRoles)) { player.playableRoles = selectedRoles; dataChanged = true; visualChanged = true; } player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' }; player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 }; if (player.personalInfo.birthday !== detailBirthdayInput.value) { player.personalInfo.birthday = detailBirthdayInput.value; dataChanged = true; } if (player.personalInfo.phone !== detailPhoneInput.value) { player.personalInfo.phone = detailPhoneInput.value; dataChanged = true; } if (player.personalInfo.email !== detailEmailInput.value) { player.personalInfo.email = detailEmailInput.value; dataChanged = true; } const matches = parseInt(detailMatchesPlayedInput.value) || 0; const goals = parseInt(detailGoalsScoredInput.value) || 0; if (player.matchStats.matchesPlayed !== matches) { player.matchStats.matchesPlayed = matches; dataChanged = true; } if (player.matchStats.goalsScored !== goals) { player.matchStats.goalsScored = goals; dataChanged = true; } const currentComment = detailMatchCommentInput.value.trim(); if (currentComment) { if (confirm("Legge til usnlagret kommentar?")) { handleAddCommentToHistory(); dataChanged = true; } } if (dataChanged) { saveSquad(); if (visualChanged) { renderUI(); if (appContainer && appContainer.classList.contains('view-squad')) { renderFullSquadList(); } const pieceElement = playersOnPitch[playerId]; if (pieceElement) { const nameDiv = pieceElement.querySelector('.player-name'); if (nameDiv) nameDiv.textContent = player.nickname || player.name; const imgDiv = pieceElement.querySelector('.player-image'); if (imgDiv) { if (player.imageUrl && typeof player.imageUrl === 'string' && player.imageUrl.trim() !== '' && !player.imageUrl.startsWith('placeholder-file:')) { imgDiv.style.backgroundImage = `url('${player.imageUrl}')`; imgDiv.style.backgroundColor = 'transparent'; } else { imgDiv.style.backgroundImage = 'none'; imgDiv.style.backgroundColor = '#aaa'; } } } } alert("Detaljer lagret."); } closePlayerDetailModal(); }
// === FUNKSJON: handleSavePlayerDetails END ===
// === FUNKSJON: handleDeletePlayer START ===
function handleDeletePlayer(playerId, playerName) { // NY funksjon fra V#114
    if (!playerId) { console.error("handleDeletePlayer: playerId mangler."); return; }
    const confirmDelete = confirm(`Er du sikker på at du vil slette spilleren "${playerName || playerId}" permanent?\nSpilleren fjernes fra troppen, banen og benken.`);
    if (confirmDelete) {
        console.log(`Sletter spiller: ${playerId}`);
        const playerIndex = squad.findIndex(p => p.id === playerId);
        if (playerIndex > -1) { squad.splice(playerIndex, 1); } 
        else { console.warn(`handleDeletePlayer: Spiller ${playerId} ikke funnet i squad.`); }
        if (playersOnPitch[playerId]) { playersOnPitch[playerId].remove(); delete playersOnPitch[playerId]; console.log(` - Spiller ${playerId} fjernet fra banen.`); }
        const benchIndex = playersOnBench.indexOf(playerId);
        if (benchIndex > -1) { playersOnBench.splice(benchIndex, 1); console.log(` - Spiller ${playerId} fjernet fra benken.`); }
        saveSquad(); saveCurrentState(); 
        renderUI(); renderFullSquadList(); 
        alert(`Spiller "${playerName || playerId}" ble slettet.`);
    } else { console.log(`Sletting av spiller ${playerId} avbrutt.`); }
}
// === FUNKSJON: handleDeletePlayer END ===
// === FUNKSJON: openBallSettingsModal START ===
function openBallSettingsModal() { if (!ballSettingsModal) return; const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider'); const sizeValueDisplay = ballSettingsModal.querySelector('#ball-size-value'); const customColorInput = ballSettingsModal.querySelector('#ball-custom-color'); const styleRadios = ballSettingsModal.querySelectorAll('input[name="ball-style"]'); sizeSlider.value = ballSettings.size; sizeValueDisplay.textContent = `${ballSettings.size}px`; customColorInput.value = ballSettings.color; styleRadios.forEach(radio => { radio.checked = radio.value === ballSettings.style; }); ballSettingsModal.style.display = 'block'; }
// === FUNKSJON: openBallSettingsModal END ===
// === FUNKSJON: closeBallSettingsModal START ===
function closeBallSettingsModal() { if (ballSettingsModal) { ballSettingsModal.style.display = 'none'; } }
// === FUNKSJON: closeBallSettingsModal END ===
// === FUNKSJON: handleBallSizeChange START ===
function handleBallSizeChange(event) { const newSize = event.target.value; const sizeValueDisplay = ballSettingsModal.querySelector('#ball-size-value'); if (sizeValueDisplay) sizeValueDisplay.textContent = `${newSize}px`; if (ballElement) { ballElement.style.width = `${newSize}px`; ballElement.style.height = `${newSize}px`; } }
// === FUNKSJON: handleBallSizeChange END ===
// === FUNKSJON: handleSaveBallSettings START ===
function handleSaveBallSettings() { if (!ballSettingsModal) return; const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider'); const selectedStyleRadio = ballSettingsModal.querySelector('input[name="ball-style"]:checked'); const customColorInput = ballSettingsModal.querySelector('#ball-custom-color'); ballSettings.size = parseInt(sizeSlider.value, 10); ballSettings.style = selectedStyleRadio ? selectedStyleRadio.value : 'default'; ballSettings.color = customColorInput.value; applyBallStyle(); saveCurrentState(); closeBallSettingsModal(); alert("Ballinnstillinger lagret!"); }
// === FUNKSJON: handleSaveBallSettings END ===
// === 2. Modal Håndtering END ===


// === 3. UI Rendering START ===
// === FUNKSJON: renderUI START ===
function renderUI() { renderOnPitchList(); renderBench(); renderSquadList(); if(onPitchCountElement) onPitchCountElement.textContent = Object.keys(playersOnPitch).length; if(onBenchCountElement) onBenchCountElement.textContent = playersOnBench.length; }
// === FUNKSJON: renderUI END ===
// === FUNKSJON: renderOnPitchList START ===
function renderOnPitchList() { if (!onPitchListElement) return; onPitchListElement.innerHTML = ''; const playerIdsOnPitch = Object.keys(playersOnPitch); if (playerIdsOnPitch.length === 0) { onPitchListElement.innerHTML = '<li><i>Ingen spillere på banen.</i></li>'; return; } const sortedPlayers = playerIdsOnPitch.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name)); sortedPlayers.forEach(player => { const listItem = document.createElement('li'); let roleText = player.mainRole ? ` (${player.mainRole})` : ''; listItem.textContent = (player.nickname || player.name) + roleText; listItem.setAttribute('data-player-id', player.id); listItem.classList.add('on-pitch-player-item', 'draggable'); listItem.setAttribute('draggable', true); listItem.addEventListener('dragstart', handleDragStartOnPitchList); listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); onPitchListElement.appendChild(listItem); }); }
// === FUNKSJON: renderOnPitchList END ===
// === FUNKSJON: renderBench START ===
function renderBench() { if (!benchListElement) return; benchListElement.innerHTML = ''; if (playersOnBench.length === 0) { benchListElement.innerHTML = '<li><i>Benken er tom.</i></li>'; return; } const sortedPlayers = playersOnBench.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name)); sortedPlayers.forEach(player => { const listItem = document.createElement('li'); let roleText = player.mainRole ? ` (${player.mainRole})` : ''; listItem.textContent = (player.nickname || player.name) + roleText; listItem.setAttribute('data-player-id', player.id); listItem.classList.add('bench-player-item', 'draggable'); listItem.setAttribute('draggable', true); listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); benchListElement.appendChild(listItem); }); addDragListenersToBenchItems(); }
// === FUNKSJON: renderBench END ===
// === FUNKSJON: renderSquadList START ===
function renderSquadList() { if (!squadListElement) return; squadListElement.innerHTML = ''; const availablePlayers = squad.filter(p => !playersOnPitch[p.id] && !playersOnBench.includes(p.id)).sort((a, b) => a.name.localeCompare(b.name)); if (availablePlayers.length === 0 && squad.length > 0) { squadListElement.innerHTML = '<li><i>Alle spillere er plassert.</i></li>'; } else if (squad.length === 0) { squadListElement.innerHTML = '<li><i>Ingen spillere i troppen.</i></li>'; } else { availablePlayers.forEach(player => { const listItem = document.createElement('li'); let roleText = player.mainRole ? ` (${player.mainRole})` : ''; listItem.textContent = (player.nickname || player.name) + roleText; listItem.setAttribute('data-player-id', player.id); listItem.classList.add('squad-player-item', 'draggable'); listItem.setAttribute('draggable', true); listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); squadListElement.appendChild(listItem); }); } addDragListenersToSquadItems(); }
// === FUNKSJON: renderSquadList END ===
// === FUNKSJON: renderFullSquadList START ===
function renderFullSquadList() { // Fra V#114
    if (!fullSquadListContainer) { console.error("renderFullSquadList: FEIL - Container #full-squad-list-container ikke funnet."); return; }
    fullSquadListContainer.innerHTML = ''; 
    if (squad.length === 0) { fullSquadListContainer.innerHTML = '<p>Ingen spillere i troppen enda. Legg til spillere via sidepanelet.</p>'; return; }
    const sortedSquad = [...squad].sort((a, b) => a.name.localeCompare(b.name));
    const table = document.createElement('table'); table.style.width = '100%'; table.style.borderCollapse = 'collapse';
    const thead = table.createTHead(); const headerRow = thead.insertRow(); 
    const headers = ['Navn', 'Kallenavn', 'Hovedpos.', 'Roller', 'Status', 'Handlinger']; 
    headers.forEach(text => { const th = document.createElement('th'); th.textContent = text; th.style.borderBottom = '2px solid #ccc'; th.style.padding = '8px'; th.style.textAlign = 'left'; headerRow.appendChild(th); });
    const tbody = table.createTBody();
    sortedSquad.forEach(player => {
        const row = tbody.insertRow(); row.style.borderBottom = '1px solid #eee';
        const nameCell = row.insertCell(); nameCell.textContent = player.name || 'Ukjent Navn'; nameCell.style.padding = '8px';
        const nicknameCell = row.insertCell(); nicknameCell.textContent = player.nickname || '-'; nicknameCell.style.padding = '8px';
        const mainRoleCell = row.insertCell(); mainRoleCell.textContent = player.mainRole || '-'; mainRoleCell.style.padding = '8px';
        const rolesCell = row.insertCell(); const rolesString = (player.playableRoles && player.playableRoles.length > 0) ? player.playableRoles.map(roleKey => PLAYER_ROLES[roleKey] || roleKey).join(', ') : '-'; rolesCell.textContent = rolesString; rolesCell.style.padding = '8px'; rolesCell.style.fontSize = '0.85em'; 
        const statusCell = row.insertCell(); statusCell.textContent = PLAYER_STATUSES[player.status] || player.status; statusCell.style.padding = '8px'; if (player.status === 'INJURED_SHORT' || player.status === 'INJURED_LONG') { statusCell.style.color = 'orange'; } else if (player.status === 'SUSPENDED' || player.status === 'UNAVAILABLE') { statusCell.style.color = 'red'; } else if (player.status === 'AVAILABLE') { statusCell.style.color = 'green'; }
        const actionsCell = row.insertCell(); actionsCell.style.padding = '8px'; actionsCell.style.whiteSpace = 'nowrap'; 
        const editButton = document.createElement('button'); editButton.textContent = 'Rediger'; editButton.style.padding = '4px 8px'; editButton.style.marginRight = '5px'; editButton.classList.add('action-button'); editButton.addEventListener('click', () => openPlayerDetailModal(player.id)); actionsCell.appendChild(editButton);
        const deleteButton = document.createElement('button'); deleteButton.textContent = 'Slett'; deleteButton.style.padding = '4px 8px'; deleteButton.style.backgroundColor = '#f44336'; deleteButton.classList.add('action-button'); deleteButton.addEventListener('click', () => handleDeletePlayer(player.id, player.name)); actionsCell.appendChild(deleteButton);
    });
    fullSquadListContainer.appendChild(table);
}
// === FUNKSJON: renderFullSquadList END ===
// === 3. UI Rendering END ===


// === 4. Spillerbrikke & Ball Håndtering START ===
// === FUNKSJON: createPlayerPieceElement START ===
function createPlayerPieceElement(player, xPercent, yPercent) { const piece = document.createElement('div'); piece.classList.add('player-piece', 'draggable'); piece.setAttribute('data-player-id', player.id); piece.setAttribute('draggable', true); piece.style.left = `${xPercent}%`; piece.style.top = `${yPercent}%`; const imgContainer = document.createElement('div'); imgContainer.classList.add('player-image-container'); imgContainer.style.borderColor = player.borderColor || 'black'; const imgDiv = document.createElement('div'); imgDiv.classList.add('player-image'); if (player.imageUrl && typeof player.imageUrl === 'string' && player.imageUrl.trim() !== '' && !player.imageUrl.startsWith('placeholder-file:')) { imgDiv.style.backgroundImage = `url('${player.imageUrl}')`; imgDiv.style.backgroundColor = 'transparent'; } else { imgDiv.style.backgroundImage = 'none'; imgDiv.style.backgroundColor = '#aaa'; } imgContainer.appendChild(imgDiv); piece.appendChild(imgContainer); const nameDiv = document.createElement('div'); nameDiv.classList.add('player-name'); nameDiv.textContent = player.nickname || player.name; piece.appendChild(nameDiv); piece.addEventListener('dragstart', handleDragStartPiece); piece.addEventListener('dragend', handleDragEnd); piece.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); piece.addEventListener('click', handlePlayerPieceClick); return piece; }
// === FUNKSJON: createPlayerPieceElement END ===
// === FUNKSJON: getPlayerById START ===
function getPlayerById(playerId) { if (!playerId) return null; return squad.find(p => p.id === playerId) || null; }
// === FUNKSJON: getPlayerById END ===
// === FUNKSJON: updateBallPosition START ===
function updateBallPosition(xPercent, yPercent) { if (ballElement) { ballElement.style.left = `${xPercent}%`; ballElement.style.top = `${yPercent}%`; ballSettings.position.x = xPercent; ballSettings.position.y = yPercent; } }
// === FUNKSJON: updateBallPosition END ===
// === FUNKSJON: applyBallStyle START ===
function applyBallStyle() { if (!ballElement) return; ballElement.style.width = `${ballSettings.size}px`; ballElement.style.height = `${ballSettings.size}px`; ballElement.classList.remove('ball-style-classic', 'ball-style-color'); ballElement.style.backgroundColor = ''; ballElement.style.backgroundImage = ''; ballElement.style.background = ''; if (ballSettings.style === 'classic') { ballElement.classList.add('ball-style-classic'); } else if (ballSettings.style === 'color') { ballElement.classList.add('ball-style-color'); ballElement.style.backgroundColor = ballSettings.color; } else { ballElement.style.background = 'radial-gradient(circle at 30% 30%, white 90%, #e0e0e0 100%)'; } }
// === FUNKSJON: applyBallStyle END ===
// === 4. Spillerbrikke & Ball Håndtering END ===


// === 5. Drag and Drop & Valg/Farge/UI Toggles START ===
// === FUNKSJON: addDragListenersToSquadItems START ===
function addDragListenersToSquadItems() { if (!squadListElement) return; const items = squadListElement.querySelectorAll('.squad-player-item.draggable'); items.forEach(item => { item.removeEventListener('dragstart', handleDragStart); item.addEventListener('dragstart', handleDragStart); item.removeEventListener('dragend', handleDragEnd); item.addEventListener('dragend', handleDragEnd); }); }
// === FUNKSJON: addDragListenersToSquadItems END ===
// === FUNKSJON: addDragListenersToBenchItems START ===
function addDragListenersToBenchItems() { if (!benchListElement) return; const items = benchListElement.querySelectorAll('.bench-player-item.draggable'); items.forEach(item => { item.removeEventListener('dragstart', handleDragStartBench); item.addEventListener('dragstart', handleDragStartBench); item.removeEventListener('dragend', handleDragEnd); item.addEventListener('dragend', handleDragEnd); }); }
// === FUNKSJON: addDragListenersToBenchItems END ===
// === FUNKSJON: handleDragStart START ===
function handleDragStart(event) { draggedPlayerId = event.target.getAttribute('data-player-id'); const player = getPlayerById(draggedPlayerId); if (!player) { event.preventDefault(); return; } draggedElement = event.target; dragSource = 'squad'; try { event.dataTransfer.setData('text/plain', draggedPlayerId); } catch (e) { event.preventDefault(); return; } event.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0); }
// === FUNKSJON: handleDragStart END ===
// === FUNKSJON: handleDragStartBench START ===
function handleDragStartBench(event) { draggedPlayerId = event.target.getAttribute('data-player-id'); if (!getPlayerById(draggedPlayerId)) { event.preventDefault(); return; } draggedElement = event.target; dragSource = 'bench'; event.dataTransfer.setData('text/plain', draggedPlayerId); event.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0); }
// === FUNKSJON: handleDragStartBench END ===
// === FUNKSJON: handleDragStartPiece START ===
function handleDragStartPiece(event) { const pieceElement = event.target.closest('.player-piece'); if (!pieceElement) return; if (!pieceElement.hasAttribute('draggable') || pieceElement.getAttribute('draggable') === 'false') { event.preventDefault(); return; } draggedPlayerId = pieceElement.getAttribute('data-player-id'); if (!getPlayerById(draggedPlayerId)) { event.preventDefault(); return; } draggedElement = pieceElement; dragSource = 'pitch'; try { event.dataTransfer.setData('text/plain', draggedPlayerId); event.dataTransfer.effectAllowed = 'move'; draggedElement.classList.add('dragging'); } catch(e) { event.preventDefault(); } event.stopPropagation(); }
// === FUNKSJON: handleDragStartPiece END ===
// === FUNKSJON: handleDragStartOnPitchList START ===
function handleDragStartOnPitchList(event) { const listItem = event.target; draggedPlayerId = listItem.getAttribute('data-player-id'); const player = getPlayerById(draggedPlayerId); if (!player) { console.error("handleDragStartOnPitchList: Fant ikke spiller ID:", draggedPlayerId); event.preventDefault(); return; } console.log(`handleDragStartOnPitchList: Starter drag for spiller ${draggedPlayerId} fra 'På Banen'-listen`); draggedElement = listItem; dragSource = 'onpitch-list'; try { event.dataTransfer.setData('text/plain', draggedPlayerId); event.dataTransfer.effectAllowed = 'move'; } catch (e) { console.error("handleDragStartOnPitchList: Feil ved setData:", e); event.preventDefault(); } }
// === FUNKSJON: handleDragStartOnPitchList END ===
// === FUNKSJON: handleBallDragStart START ===
function handleBallDragStart(event) { try { event.dataTransfer.setData('text/x-dragged-item', 'ball'); dragSource = 'ball'; draggedElement = event.target; event.dataTransfer.effectAllowed = 'move'; event.target.classList.add('dragging'); } catch (e) { event.preventDefault(); } }
// === FUNKSJON: handleBallDragStart END ===
// === FUNKSJON: handleDragOver START ===
function handleDragOver(event, targetType) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; let targetElement; if (targetType === 'pitch') targetElement = pitchElement; else if (targetType === 'bench') targetElement = benchElement; else if (targetType === 'squad') targetElement = squadListContainer; else if (targetType === 'onpitch-list') targetElement = onPitchSectionElement; if(targetElement) targetElement.classList.add('drag-over'); }
// === FUNKSJON: handleDragOver END ===
// === FUNKSJON: handleDragLeave START ===
function handleDragLeave(event, targetType) { const relatedTarget = event.relatedTarget; let targetElement; if (targetType === 'pitch') targetElement = pitchElement; else if (targetType === 'bench') targetElement = benchElement; else if (targetType === 'squad') targetElement = squadListContainer; else if (targetType === 'onpitch-list') targetElement = onPitchSectionElement; if (!targetElement) return; if (!relatedTarget || !targetElement.contains(relatedTarget)) { targetElement.classList.remove('drag-over'); } }
// === FUNKSJON: handleDragLeave END ===
// === FUNKSJON: handleDropOnPitch START ===
function handleDropOnPitch(event) { event.preventDefault(); if (pitchElement) pitchElement.classList.remove('drag-over'); const pitchRect = pitchElement.getBoundingClientRect(); if (!pitchRect || pitchRect.width === 0 || pitchRect.height === 0) { resetDragState(); return; } const dropX_viewport = event.clientX; const dropY_viewport = event.clientY; let dropX_relative = dropX_viewport - pitchRect.left; let dropY_relative = dropY_viewport - pitchRect.top; let xPercent, yPercent; if (isPitchRotated) { xPercent = (dropY_relative / pitchRect.height) * 100; yPercent = (1 - (dropX_relative / pitchRect.width)) * 100; } else { xPercent = (dropX_relative / pitchRect.width) * 100; yPercent = (dropY_relative / pitchRect.height) * 100; } xPercent = Math.max(0, Math.min(100, xPercent)); yPercent = Math.max(0, Math.min(100, yPercent)); const draggedItemType = event.dataTransfer.getData('text/x-dragged-item'); if (draggedItemType === 'ball') { updateBallPosition(xPercent, yPercent); ballSettings.position = {x: xPercent, y: yPercent}; saveCurrentState(); resetDragState(); return; } let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { resetDragState(); return; } if (!playerId) { resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { resetDragState(); return; } if ((dragSource === 'squad' || dragSource === 'bench') && Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) { alert(`Maks ${MAX_PLAYERS_ON_PITCH} spillere på banen.`); resetDragState(); return; } player.position = { x: xPercent, y: yPercent }; let stateChanged = false; if (playersOnPitch[playerId]) { const piece = playersOnPitch[playerId]; piece.style.left = `${xPercent}%`; piece.style.top = `${yPercent}%`; stateChanged = true; } else { const newPiece = createPlayerPieceElement(player, xPercent, yPercent); if (pitchSurface) pitchSurface.appendChild(newPiece); else console.error("FEIL: pitchSurface ikke funnet!"); playersOnPitch[playerId] = newPiece; if (dragSource === 'bench') { const benchIndex = playersOnBench.indexOf(playerId); if (benchIndex > -1) playersOnBench.splice(benchIndex, 1); } stateChanged = true; } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState(); }
// === FUNKSJON: handleDropOnPitch END ===
// === FUNKSJON: handleDropOnOnPitchList START ===
function handleDropOnOnPitchList(event) { event.preventDefault(); if (onPitchSectionElement) onPitchSectionElement.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; } if (!playerId) { console.warn("Drop on OnPitchList: Mottok tom playerId."); resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on OnPitchList: Fant ikke spiller ID:", playerId); resetDragState(); return; } if (playersOnPitch[playerId]) { console.log(`DropOnOnPitchList: Spiller ${playerId} er allerede på banen.`); resetDragState(); return; } if (Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) { alert(`Kan ikke legge til flere spillere på banen (maks ${MAX_PLAYERS_ON_PITCH}).`); resetDragState(); return; } let stateChanged = false; if (dragSource === 'bench' || dragSource === 'squad') { console.log(`Flytter spiller ${playerId} fra ${dragSource} til banen (via liste)`); const defaultX = 50; const defaultY = 50; player.position = { x: defaultX, y: defaultY }; const newPiece = createPlayerPieceElement(player, defaultX, defaultY); if (pitchSurface) { pitchSurface.appendChild(newPiece); playersOnPitch[playerId] = newPiece; stateChanged = true; if (dragSource === 'bench') { const benchIndex = playersOnBench.indexOf(playerId); if (benchIndex > -1) { playersOnBench.splice(benchIndex, 1); } } } else { console.error("FEIL: pitchSurface ikke funnet ved plassering fra liste!"); } } else { console.log(`DropOnOnPitchList: Ignorerer drag fra kilde: ${dragSource}`); } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState(); }
// === FUNKSJON: handleDropOnOnPitchList END ===
// === FUNKSJON: handleDropOnBench START ===
function handleDropOnBench(event) { event.preventDefault(); if (benchElement) benchElement.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; } if (!playerId) { console.warn("Drop on Bench: Mottok tom playerId."); resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on Bench: Fant ikke spiller ID:", playerId); resetDragState(); return; } let stateChanged = false; if (dragSource === 'pitch' || dragSource === 'onpitch-list') { if (!playersOnBench.includes(playerId)) { playersOnBench.push(playerId); } if (playersOnPitch[playerId]) { console.log(`Flytter spiller ${playerId} fra bane (via ${dragSource}) til benk.`); playersOnPitch[playerId].remove(); delete playersOnPitch[playerId]; stateChanged = true; } else { console.warn(`DropOnBench: Spiller ${playerId} dratt fra ${dragSource}, men ikke funnet i playersOnPitch.`); } } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState(); }
// === FUNKSJON: handleDropOnBench END ===
// === FUNKSJON: handleDropOnSquadList START ===
function handleDropOnSquadList(event) { event.preventDefault(); if (squadListContainer) squadListContainer.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; } if (!playerId) { console.warn("Drop on Squad List: Mottok tom playerId."); resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on Squad List: Fant ikke spiller ID:", playerId); resetDragState(); return; } let stateChanged = false; if (dragSource === 'pitch' || dragSource === 'onpitch-list') { if (playersOnPitch[playerId]) { console.log(`Flytter spiller ${playerId} fra bane (via ${dragSource}) til tilgjengelig tropp.`); playersOnPitch[playerId].remove(); delete playersOnPitch[playerId]; stateChanged = true; } else { console.warn(`DropOnSquadList: Spiller ${playerId} dratt fra ${dragSource}, men ikke funnet i playersOnPitch.`); } } else if (dragSource === 'bench') { const benchIndex = playersOnBench.indexOf(playerId); if (benchIndex > -1) { console.log(`Flytter spiller ${playerId} fra benk til tilgjengelig tropp.`); playersOnBench.splice(benchIndex, 1); stateChanged = true; } } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState(); }
// === FUNKSJON: handleDropOnSquadList END ===
// === FUNKSJON: handleDragEnd START ===
function handleDragEnd(event) { const draggedElementTarget = event.target; setTimeout(() => { if(pitchElement) pitchElement.classList.remove('drag-over'); if(benchElement) benchElement.classList.remove('drag-over'); if(squadListContainer) squadListContainer.classList.remove('drag-over'); if(onPitchSectionElement) onPitchSectionElement.classList.remove('drag-over'); if (draggedElementTarget && draggedElementTarget.classList.contains('dragging')) { draggedElementTarget.classList.remove('dragging'); } }, 0); }
// === FUNKSJON: handleDragEnd END ===
// === FUNKSJON: resetDragState START ===
function resetDragState() { draggedPlayerId = null; draggedElement = null; dragSource = null; console.log("Drag state nullstilt."); }
// === FUNKSJON: resetDragState END ===
// === FUNKSJON: handlePlayerPieceClick START ===
function handlePlayerPieceClick(event) { const pieceElement = event.currentTarget; const playerId = pieceElement.getAttribute('data-player-id'); if (selectedPlayerIds.has(playerId)) { selectedPlayerIds.delete(playerId); pieceElement.classList.remove('selected'); } else { selectedPlayerIds.add(playerId); pieceElement.classList.add('selected'); } }
// === FUNKSJON: handlePlayerPieceClick END ===
// === FUNKSJON: clearPlayerSelection START ===
function clearPlayerSelection() { selectedPlayerIds.forEach(id => { const piece = playersOnPitch[id]; if (piece) { piece.classList.remove('selected'); } }); selectedPlayerIds.clear(); }
// === FUNKSJON: clearPlayerSelection END ===
// === FUNKSJON: applyBorderColorToSelection START ===
function applyBorderColorToSelection(color) { if (selectedPlayerIds.size === 0) { alert("Ingen spillere valgt."); return; } let stateChanged = false; selectedPlayerIds.forEach(playerId => { const player = getPlayerById(playerId); const piece = playersOnPitch[playerId]; if (player && piece) { if (player.borderColor !== color) { player.borderColor = color; const imgContainer = piece.querySelector('.player-image-container'); if (imgContainer) imgContainer.style.borderColor = color; stateChanged = true; } } }); if (stateChanged) saveCurrentState(); clearPlayerSelection(); }
// === FUNKSJON: applyBorderColorToSelection END ===
// === FUNKSJON: handleSetSelectedPlayerBorderColor START ===
function handleSetSelectedPlayerBorderColor() { applyBorderColorToSelection(playerBorderColorInput.value); }
// === FUNKSJON: handleSetSelectedPlayerBorderColor END ===
// === FUNKSJON: toggleSidebar START ===
function toggleSidebar() { isSidebarHidden = !isSidebarHidden; if (appContainer) { appContainer.classList.toggle('sidebar-hidden', isSidebarHidden); if (toggleSidebarButton) { toggleSidebarButton.innerHTML = isSidebarHidden ? '>' : '<'; } } }
// === FUNKSJON: toggleSidebar END ===
// === FUNKSJON: togglePitchRotation START ===
function togglePitchRotation() { isPitchRotated = !isPitchRotated; if (!pitchContainer || !pitchElement) return; pitchContainer.classList.toggle('rotated', isPitchRotated); resizePitchElement(); saveCurrentState(); }
// === FUNKSJON: togglePitchRotation END ===
// === FUNKSJON: switchView START ===
function switchView(viewName) { if (!appContainer || !navTacticsButton || !navSquadButton) { console.error("switchView: Nødvendige elementer ikke funnet."); return; } appContainer.classList.remove('view-tactics', 'view-squad'); if (viewName === 'tactics') { appContainer.classList.add('view-tactics'); navTacticsButton.classList.add('active'); navSquadButton.classList.remove('active'); resizePitchElement(); } else if (viewName === 'squad') { appContainer.classList.add('view-squad'); navSquadButton.classList.add('active'); navTacticsButton.classList.remove('active'); renderFullSquadList(); } else { console.warn(`Ukjent viewName: ${viewName}. Viser taktikksiden.`); appContainer.classList.add('view-tactics'); navTacticsButton.classList.add('active'); navSquadButton.classList.remove('active'); resizePitchElement(); } console.log(`Byttet til view: ${viewName}`); }
// === FUNKSJON: switchView END ===
// === 5. Drag and Drop & Valg/Farge/UI Toggles END ===


// === 6. Lokal Lagring START ===
// === FUNKSJON: saveSquad START ===
function saveSquad() { try { localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(squad)); } catch (e) { console.error("Feil ved lagring av tropp:", e); } }
// === FUNKSJON: saveSquad END ===
// === FUNKSJON: loadSquad START ===
function loadSquad() { const savedSquadJson = localStorage.getItem(STORAGE_KEY_SQUAD); if (savedSquadJson) { try { const parsedSquad = JSON.parse(savedSquadJson); squad = parsedSquad.map(player => ({ ...player, nickname: player.nickname || '', imageUrl: player.imageUrl || '', personalInfo: player.personalInfo || { birthday: '', phone: '', email: '' }, matchStats: player.matchStats || { matchesPlayed: 0, goalsScored: 0 }, comments: player.comments || [], borderColor: player.borderColor || 'black', position: player.position || { x: 50, y: 50 }, mainRole: player.mainRole || '', playableRoles: player.playableRoles || [], status: player.status || DEFAULT_PLAYER_STATUS })); const maxId = squad.reduce((max, p) => { const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0; return Math.max(max, !isNaN(idNum) ? idNum : 0); }, 0); nextPlayerId = maxId + 1; return true; } catch (e) { console.error("Feil ved parsing av tropp:", e); squad = []; localStorage.removeItem(STORAGE_KEY_SQUAD); return false; } } squad = []; return false; }
// === FUNKSJON: loadSquad END ===
// === FUNKSJON: getCurrentStateData START ===
function getCurrentStateData() { const playersOnPitchData = {}; for (const playerId in playersOnPitch) { const player = getPlayerById(playerId); if (player && player.position && typeof player.position.x === 'number' && typeof player.position.y === 'number') { playersOnPitchData[playerId] = { x: player.position.x, y: player.position.y, borderColor: player.borderColor || 'black' }; } else if (player) { playersOnPitchData[playerId] = { x: 50, y: 50, borderColor: player.borderColor || 'black' }; } } return { playersOnPitchData: playersOnPitchData, playersOnBenchIds: [...playersOnBench], isPitchRotated: isPitchRotated, ballPosition: ballSettings.position, ballSettings: { size: ballSettings.size, style: ballSettings.style, color: ballSettings.color } }; }
// === FUNKSJON: getCurrentStateData END ===
// === FUNKSJON: saveCurrentState START ===
function saveCurrentState() { try { const stateData = getCurrentStateData(); localStorage.setItem(STORAGE_KEY_LAST_STATE, JSON.stringify(stateData)); } catch (e) { console.error("Feil ved lagring av state:", e); } }
// === FUNKSJON: saveCurrentState END ===
// === FUNKSJON: applyState START ===
function applyState(stateData) { if (!stateData) return; clearPitch(); playersOnPitch = {}; playersOnBench = []; isPitchRotated = stateData.isPitchRotated || false; if (stateData.ballSettings) { ballSettings.size = stateData.ballSettings.size || 35; ballSettings.style = stateData.ballSettings.style || 'default'; ballSettings.color = stateData.ballSettings.color || '#FFA500'; } applyBallStyle(); if (stateData.ballPosition && typeof stateData.ballPosition.x === 'number' && typeof stateData.ballPosition.y === 'number') { ballSettings.position = stateData.ballPosition; updateBallPosition(stateData.ballPosition.x, stateData.ballPosition.y); } else { ballSettings.position = {x: 50, y: 50}; updateBallPosition(50, 50); } if (pitchContainer) { pitchContainer.classList.toggle('rotated', isPitchRotated); resizePitchElement(); } if (stateData.playersOnPitchData) { for (const playerId in stateData.playersOnPitchData) { const player = getPlayerById(playerId); const positionData = stateData.playersOnPitchData[playerId]; if (player && positionData && typeof positionData.x === 'number' && typeof positionData.y === 'number') { player.position = { x: positionData.x, y: positionData.y }; player.borderColor = positionData.borderColor || 'black'; const piece = createPlayerPieceElement(player, player.position.x, player.position.y); if(pitchSurface) pitchSurface.appendChild(piece); else console.error("FEIL: pitchSurface ikke funnet!"); playersOnPitch[playerId] = piece; } } } if (stateData.playersOnBenchIds) { playersOnBench = stateData.playersOnBenchIds.filter(id => getPlayerById(id)); } renderUI(); }
// === FUNKSJON: applyState END ===
// === FUNKSJON: resizePitchElement START ===
function resizePitchElement() { if (!pitchContainer || !pitchElement) return; const containerWidth = pitchContainer.clientWidth; const containerHeight = pitchContainer.clientHeight; let targetWidth, targetHeight; if (isPitchRotated) { const currentAR = PITCH_ASPECT_RATIO_LANDSCAPE; const heightFromWidth = containerWidth / currentAR; const widthFromHeight = containerHeight * currentAR; if (heightFromWidth <= containerHeight) { targetWidth = containerWidth; targetHeight = heightFromWidth; } else { targetWidth = widthFromHeight; targetHeight = containerHeight; } pitchElement.style.width = `${targetHeight}px`; pitchElement.style.height = `${targetWidth}px`; } else { const currentAR = PITCH_ASPECT_RATIO_PORTRAIT; const widthFromHeight = containerHeight * currentAR; const heightFromWidth = containerWidth / currentAR; if (widthFromHeight <= containerWidth) { targetWidth = widthFromHeight; targetHeight = containerHeight; } else { targetWidth = containerWidth; targetHeight = heightFromWidth; } pitchElement.style.width = `${targetWidth}px`; pitchElement.style.height = `${targetHeight}px`; } }
// === FUNKSJON: resizePitchElement END ===
// === FUNKSJON: loadLastState START ===
function loadLastState() { const savedState = localStorage.getItem(STORAGE_KEY_LAST_STATE); let stateData = {}; if (savedState) { try { stateData = JSON.parse(savedState); } catch (e) { console.error("Feil ved parsing av state:", e); } } ballSettings = { size: 35, style: 'default', color: '#FFA500', position: {x: 50, y: 50}, ...(stateData.ballSettings || {}) }; ballSettings.position = stateData.ballPosition || ballSettings.position; applyState(stateData); }
// === FUNKSJON: loadLastState END ===
// === FUNKSJON: clearPitch START ===
function clearPitch() { if (!pitchSurface) return; const pieces = pitchSurface.querySelectorAll('.player-piece'); pieces.forEach(piece => piece.remove()); }
// === FUNKSJON: clearPitch END ===
// === FUNKSJON: getSavedSetups START ===
function getSavedSetups() { const setupsJson = localStorage.getItem(STORAGE_KEY_SETUPS); if (setupsJson) { try { return JSON.parse(setupsJson); } catch (e) { return {}; } } return {}; }
// === FUNKSJON: getSavedSetups END ===
// === FUNKSJON: handleSaveSetup START ===
function handleSaveSetup() { if(!setupNameInput || !loadSetupSelect) return; const name = setupNameInput.value.trim(); if (!name) { alert("Skriv inn navn."); return; } const currentSetups = getSavedSetups(); const currentState = getCurrentStateData(); currentSetups[name] = currentState; try { localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(currentSetups)); alert(`Oppsett "${name}" lagret!`); populateSetupDropdown(); setupNameInput.value = ''; } catch (e) { alert("Kunne ikke lagre."); } }
// === FUNKSJON: handleSaveSetup END ===
// === FUNKSJON: handleLoadSetup START ===
function handleLoadSetup() { if(!loadSetupSelect) return; const selectedName = loadSetupSelect.value; if (!selectedName) { alert("Velg oppsett."); return; } const savedSetups = getSavedSetups(); const setupToLoad = savedSetups[selectedName]; if (setupToLoad) { applyState(setupToLoad); alert(`Oppsett "${selectedName}" lastet!`); saveCurrentState(); } else { alert(`Fant ikke "${selectedName}".`); } }
// === FUNKSJON: handleLoadSetup END ===
// === FUNKSJON: handleDeleteSetup START ===
function handleDeleteSetup() { if(!loadSetupSelect) return; const selectedName = loadSetupSelect.value; if (!selectedName) { alert("Velg oppsett."); return; } const savedSetups = getSavedSetups(); if (savedSetups[selectedName]) { if (confirm(`Slette "${selectedName}"?`)) { delete savedSetups[selectedName]; try { localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(savedSetups)); alert(`Oppsett "${selectedName}" slettet.`); populateSetupDropdown(); } catch (e) { alert("Kunne ikke slette."); } } } else { alert(`Fant ikke "${selectedName}".`); } }
// === FUNKSJON: handleDeleteSetup END ===
// === FUNKSJON: populateSetupDropdown START ===
function populateSetupDropdown() { if (!loadSetupSelect) return; const savedSetups = getSavedSetups(); const setupNames = Object.keys(savedSetups); loadSetupSelect.innerHTML = '<option value="">Velg oppsett...</option>'; setupNames.sort(); setupNames.forEach(name => { const option = document.createElement('option'); option.value = name; option.textContent = name; loadSetupSelect.appendChild(option); }); }
// === FUNKSJON: populateSetupDropdown END ===
// === 6. Lokal Lagring END ===


// === 7. Event Listeners START ===
document.addEventListener('DOMContentLoaded', () => {
    // Hent referanser
    addPlayerModal = document.getElementById('add-player-modal'); closeButton = addPlayerModal ? addPlayerModal.querySelector('.close-button') : null; newPlayerNameInput = document.getElementById('new-player-name'); newPlayerImageUpload = document.getElementById('new-player-image-upload'); newPlayerImageUrlInput = document.getElementById('new-player-image-url'); newPlayerMainRoleInput = document.getElementById('new-player-main-role'); confirmAddPlayerButton = document.getElementById('confirm-add-player'); playerDetailModal = document.getElementById('player-detail-modal'); ballSettingsModal = document.getElementById('ball-settings-modal'); benchElement = document.getElementById('bench'); 
    // Last data
    loadSquad(); loadLastState(); populateSetupDropdown();
    // --- Modal Listeners ---
    if (addPlayerButton) addPlayerButton.addEventListener('click', openAddPlayerModal); if (closeButton) closeButton.addEventListener('click', closeAddPlayerModal); if (confirmAddPlayerButton) confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm); const detailModalCloseBtn = playerDetailModal ? playerDetailModal.querySelector('.close-detail-button') : null; const detailModalSaveBtn = playerDetailModal ? playerDetailModal.querySelector('#save-details-button') : null; const detailModalAddCommentBtn = playerDetailModal ? playerDetailModal.querySelector('#add-comment-to-history-button') : null; if (detailModalCloseBtn) detailModalCloseBtn.addEventListener('click', closePlayerDetailModal); if (detailModalSaveBtn) detailModalSaveBtn.addEventListener('click', handleSavePlayerDetails); if (detailModalAddCommentBtn) detailModalAddCommentBtn.addEventListener('click', handleAddCommentToHistory); if (ballElement) ballElement.addEventListener('dblclick', openBallSettingsModal); if (ballSettingsModal) { const closeBallBtn = ballSettingsModal.querySelector('.close-ball-settings-button'); const saveBallBtn = ballSettingsModal.querySelector('#save-ball-settings-button'); const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider'); if (closeBallBtn) closeBallBtn.addEventListener('click', closeBallSettingsModal); if (saveBallBtn) saveBallBtn.addEventListener('click', handleSaveBallSettings); if (sizeSlider) sizeSlider.addEventListener('input', handleBallSizeChange); window.addEventListener('click', (event) => { if (event.target === ballSettingsModal) closeBallSettingsModal(); }); }
    // --- Andre Globale Listeners ---
    window.addEventListener('click', (event) => { if (addPlayerModal && event.target === addPlayerModal) closeAddPlayerModal(); if (playerDetailModal && event.target === playerDetailModal) closePlayerDetailModal(); if (ballSettingsModal && event.target === ballSettingsModal) closeBallSettingsModal(); if (!event.target.closest('.player-piece') && !event.target.closest('.preset-color-button') && !event.target.closest('#player-border-color') && !event.target.closest('#set-border-color-button') && selectedPlayerIds.size > 0) { clearPlayerSelection(); } });
    // --- Drag & Drop Listeners ---
    if (pitchElement) { pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch')); pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch')); pitchElement.addEventListener('drop', handleDropOnPitch); } if (benchElement) { benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench')); benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench')); benchElement.addEventListener('drop', handleDropOnBench); } if (squadListContainer) { squadListContainer.addEventListener('dragover', (e) => handleDragOver(e, 'squad')); squadListContainer.addEventListener('dragleave', (e) => handleDragLeave(e, 'squad')); squadListContainer.addEventListener('drop', handleDropOnSquadList); } if (ballElement) { ballElement.addEventListener('dragstart', handleBallDragStart); ballElement.addEventListener('dragend', handleDragEnd); } if (onPitchSectionElement) { onPitchSectionElement.addEventListener('dragover', (e) => handleDragOver(e, 'onpitch-list')); onPitchSectionElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'onpitch-list')); onPitchSectionElement.addEventListener('drop', handleDropOnOnPitchList); console.log("Listeners: onPitchSectionElement OK"); } else { console.error("onPitchSectionElement ikke funnet!"); }
    // --- Knapp Listeners (Sidepanel etc.) ---
    if (toggleSidebarButton) toggleSidebarButton.addEventListener('click', toggleSidebar); if (rotatePitchButton) rotatePitchButton.addEventListener('click', togglePitchRotation); if (setBorderColorButton) setBorderColorButton.addEventListener('click', handleSetSelectedPlayerBorderColor); if(setColorRedButton) setColorRedButton.addEventListener('click', () => applyBorderColorToSelection('red')); if(setColorYellowButton) setColorYellowButton.addEventListener('click', () => applyBorderColorToSelection('yellow')); if(setColorGreenButton) setColorGreenButton.addEventListener('click', () => applyBorderColorToSelection('lime')); if(setColorDefaultButton) setColorDefaultButton.addEventListener('click', () => applyBorderColorToSelection('black')); if (saveSetupButton) saveSetupButton.addEventListener('click', handleSaveSetup); if (loadSetupButton) loadSetupButton.addEventListener('click', handleLoadSetup); if (deleteSetupButton) deleteSetupButton.addEventListener('click', handleDeleteSetup);
    // --- Navigasjonsknapp Listeners ---
    if (navTacticsButton) navTacticsButton.addEventListener('click', () => switchView('tactics')); if (navSquadButton) navSquadButton.addEventListener('click', () => switchView('squad'));
    // Resize Listener
    window.addEventListener('resize', resizePitchElement);
    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 7. Event Listeners END ===
/* Version: #115 */
