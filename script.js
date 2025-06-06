/* Version: #8 */
// === 0. Globale Variabler og Konstanter START ===
let squad = [];
let playersOnPitch = {};
let playersOnBench = [];
let nextPlayerId = 1;
let draggedPlayerId = null;
let draggedElement = null;
let dragSource = null;
let selectedPlayerIds = new Set();
let isSidebarHidden = false;
let isPitchRotated = false;
let ballSettings = { size: 35, style: 'default', color: '#FFA500', position: { x: 50, y: 50} };
let currentFormation = null;
let selectedFormationPosition = null;
let isDrawingMode = false;
let isDrawing = false;
let drawingCtx = null;
let startX, startY, currentX, currentY;
let currentDrawingTool = 'arrow';
let currentDrawingColor = '#FFFF00';
let isDrawingVisible = true;
let savedDrawings = [];
let currentDrawingPoints = [];
let db = null;
const DB_NAME = "FotballtaktikerDB";
const DB_VERSION = 1;
const IMAGE_STORE_NAME = "playerImages";
const DRAWING_LINE_WIDTH = 4;
const ARROWHEAD_LENGTH = 15;
const ARROWHEAD_ANGLE = Math.PI / 6;
const MAX_PLAYERS_ON_PITCH = 11;
const PITCH_ASPECT_RATIO_PORTRAIT = 2 / 3;
const PITCH_ASPECT_RATIO_LANDSCAPE = 3 / 2;
const STORAGE_KEY_SQUAD = 'fotballtaktiker_squad';
const STORAGE_KEY_LAST_STATE = 'fotballtaktiker_lastState';
const STORAGE_KEY_SETUPS = 'fotballtaktiker_setups';
const PLAYER_ROLES = { K: "Keeper", HB: "Høyreback", HVB: "Høyre Vingback", VB: "Venstreback", VVB: "Venstre Vingback", MS: "Midtstopper", SW: "Libero", DM: "Defensiv Midtbane", HM: "Høyre Midtbane", HV: "Høyre Ving", VM: "Venstre Midtbane", VV: "Venstre Ving", SM: "Sentral Midtbane", OM: "Offensiv Midtbane", S: "Spiss", CF: "Midtspiss" };
const PLAYER_STATUSES = { AVAILABLE: "Kampklar", INJURED_SHORT: "Skadet (Kortvarig)", INJURED_LONG: "Skadet (Langvarig)", SUSPENDED: "Suspendert", LIGHT_TRAINING: "Lett Trening", UNAVAILABLE: "Utilgjengelig (Annet)" };
const DEFAULT_PLAYER_STATUS = 'AVAILABLE';
const FORMATIONS = {
    "4-4-2": { name: "4-4-2", positions: [ { id: 'gk', name: 'Keeper', roles: ['K'], x: 50, y: 92 }, { id: 'dr', name: 'Høyre Back', roles: ['HB', 'HVB'], x: 85, y: 75 }, { id: 'dl', name: 'Venstre Back', roles: ['VB', 'VVB'], x: 15, y: 75 }, { id: 'dcr', name: 'Midtstopper (H)', roles: ['MS'], x: 65, y: 80 }, { id: 'dcl', name: 'Midtstopper (V)', roles: ['MS'], x: 35, y: 80 }, { id: 'mr', name: 'Høyre Midtbane', roles: ['HM', 'HV'], x: 80, y: 50 }, { id: 'ml', name: 'Venstre Midtbane', roles: ['VM', 'VV'], x: 20, y: 50 }, { id: 'mcr', name: 'Sentral Midtbane (H)', roles: ['SM', 'DM', 'OM'], x: 60, y: 55 }, { id: 'mcl', name: 'Sentral Midtbane (V)', roles: ['SM', 'DM', 'OM'], x: 40, y: 55 }, { id: 'st1', name: 'Spiss 1', roles: ['S', 'CF'], x: 60, y: 25 }, { id: 'st2', name: 'Spiss 2', roles: ['S', 'CF'], x: 40, y: 25 }, ] },
    "4-3-3": { name: "4-3-3", positions: [ { id: 'gk', name: 'Keeper', roles: ['K'], x: 50, y: 92 }, { id: 'dr', name: 'Høyre Back', roles: ['HB', 'HVB'], x: 85, y: 75 }, { id: 'dl', name: 'Venstre Back', roles: ['VB', 'VVB'], x: 15, y: 75 }, { id: 'dcr', name: 'Midtstopper (H)', roles: ['MS'], x: 65, y: 80 }, { id: 'dcl', name: 'Midtstopper (V)', roles: ['MS'], x: 35, y: 80 }, { id: 'dm', name: 'Defensiv Midtbane', roles: ['DM', 'SM'], x: 50, y: 65 }, { id: 'mcr', name: 'Sentral Midtbane (H)', roles: ['SM', 'OM', 'HM'], x: 70, y: 50 }, { id: 'mcl', name: 'Sentral Midtbane (V)', roles: ['SM', 'OM', 'VM'], x: 30, y: 50 }, { id: 'fw', name: 'Høyre Ving', roles: ['HV', 'S'], x: 80, y: 25 }, { id: 'fcl', name: 'Venstre Ving', roles: ['VV', 'S'], x: 20, y: 25 }, { id: 'st', name: 'Sentral Spiss', roles: ['CF', 'S'], x: 50, y: 15 }, ] },
    "4-2-3-1": { name: "4-2-3-1", positions: [ { id: 'gk', name: 'Keeper', roles: ['K'], x: 50, y: 92 }, { id: 'dr', name: 'Høyre Back', roles: ['HB', 'HVB'], x: 85, y: 75 }, { id: 'dl', name: 'Venstre Back', roles: ['VB', 'VVB'], x: 15, y: 75 }, { id: 'dcr', name: 'Midtstopper (H)', roles: ['MS'], x: 65, y: 80 }, { id: 'dcl', name: 'Midtstopper (V)', roles: ['MS'], x: 35, y: 80 }, { id: 'dmr', name: 'Def. Midtbane (H)', roles: ['DM', 'SM'], x: 60, y: 65 }, { id: 'dml', name: 'Def. Midtbane (V)', roles: ['DM', 'SM'], x: 40, y: 65 }, { id: 'amr', name: 'Off. Midtbane (H)', roles: ['OM', 'HM', 'HV'], x: 80, y: 40 }, { id: 'aml', name: 'Off. Midtbane (V)', roles: ['OM', 'VM', 'VV'], x: 20, y: 40 }, { id: 'amc', name: 'Off. Midtbane (S)', roles: ['OM', 'SM', 'S'], x: 50, y: 35 }, { id: 'st', name: 'Spiss', roles: ['S', 'CF'], x: 50, y: 15 }, ] },
     "3-5-2": { name: "3-5-2", positions: [ { id: 'gk', name: 'Keeper', roles: ['K'], x: 50, y: 92 }, { id: 'dcr', name: 'Midtstopper (H)', roles: ['MS'], x: 70, y: 80 }, { id: 'dc', name: 'Midtstopper (S)', roles: ['MS', 'SW'], x: 50, y: 85 }, { id: 'dcl', name: 'Midtstopper (V)', roles: ['MS'], x: 30, y: 80 }, { id: 'mr', name: 'Høyre Vingback', roles: ['HM', 'HVB', 'HB'], x: 90, y: 50 }, { id: 'ml', name: 'Venstre Vingback', roles: ['VM', 'VVB', 'VB'], x: 10, y: 50 }, { id: 'mcr', name: 'Sentral Midtbane (H)', roles: ['SM', 'DM', 'OM'], x: 65, y: 55 }, { id: 'mc', name: 'Sentral Midtbane (S)', roles: ['SM', 'DM', 'OM'], x: 50, y: 60 }, { id: 'mcl', name: 'Sentral Midtbane (V)', roles: ['SM', 'DM', 'OM'], x: 35, y: 55 }, { id: 'st1', name: 'Spiss 1', roles: ['S', 'CF'], x: 60, y: 25 }, { id: 'st2', name: 'Spiss 2', roles: ['S', 'CF'], x: 40, y: 25 }, ] }
};
let matches = [];
let nextMatchId = 1;
let activeMatchId = null;
const STORAGE_KEY_MATCHES = 'fotballtaktiker_matches';
const MATCH_STATUSES = { PLANLAGT: "Planlagt", PÅGÅENDE: "Pågående", SPILT: "Spilt", UTSATT: "Utsatt" };
const DEFAULT_MATCH_STATUS = 'PLANLAGT';
// === 0. Globale Variabler og Konstanter END ===

// === 1. DOM Element Referanser START ===
let appContainer, sidebar, toggleSidebarButton, onPitchListElement, benchListElement, squadListElement, squadListContainer, onPitchCountElement, onBenchCountElement, pitchElement, pitchSurface, rotatePitchButton, addPlayerButton, playerBorderColorInput, setBorderColorButton, setColorRedButton, setColorYellowButton, setColorGreenButton, setColorDefaultButton, toggleDrawModeButton, clearDrawingsButton, setupNameInput, saveSetupButton, loadSetupSelect, loadSetupButton, deleteSetupButton, exportPngButton, pitchContainer, drawingCanvas, ballElement, navTacticsButton, navSquadButton, tacticsPageContent, squadPageContent, fullSquadListContainer, onPitchSectionElement, formationSelect, addPlayerModal, closeButton, newPlayerNameInput, newPlayerImageUpload, newPlayerImageUrlInput, newPlayerMainRoleInput, confirmAddPlayerButton, playerDetailModal, ballSettingsModal, benchElement, squadManagementSection, drawToolButtons, drawingColorInput, toggleVisibilityButton, undoDrawingButton, fullscreenButton, detailModalTabButtons, detailPlayerImageUpload;
let navMatchesButton, matchesPageContent, addNewMatchButton, matchListContainer, addMatchModal, closeAddMatchModalButton, confirmAddMatchButton, activeMatchSelect, matchPreparationSection;
// === 1. DOM Element Referanser END ===

// === 2. IndexedDB Funksjoner START ===
function initDB() { return new Promise((resolve, reject) => { if (!('indexedDB' in window)) { console.error("IndexedDB not supported by this browser."); reject("IndexedDB not supported"); return; } const request = indexedDB.open(DB_NAME, DB_VERSION); request.onerror = (event) => { console.error(`Database error: ${event.target.errorCode}`); reject(`Database error: ${event.target.errorCode}`); }; request.onsuccess = (event) => { db = event.target.result; console.log(`Database "${DB_NAME}" version ${DB_VERSION} opened successfully.`); db.onerror = (event) => { console.error(`Database error (global): ${event.target.errorCode}`); }; resolve(db); }; request.onupgradeneeded = (event) => { console.log(`Upgrading database "${DB_NAME}" to version ${DB_VERSION}...`); const tempDb = event.target.result; if (!tempDb.objectStoreNames.contains(IMAGE_STORE_NAME)) { console.log(`Creating object store: ${IMAGE_STORE_NAME}`); tempDb.createObjectStore(IMAGE_STORE_NAME); } }; }); }
function saveImageToDB(key, blob) { return new Promise((resolve, reject) => { if (!db) { reject("Database not initialized."); return; } const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite'); const store = transaction.objectStore(IMAGE_STORE_NAME); const request = store.put(blob, key); request.onsuccess = () => { console.log(`Image saved/updated in DB with key: ${key}`); resolve(); }; request.onerror = (event) => { console.error(`Error saving image with key ${key}:`, event.target.error); reject(event.target.error); }; }); }
function loadImageFromDB(key) { return new Promise((resolve, reject) => { if (!db) { reject("Database not initialized."); return; } const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly'); const store = transaction.objectStore(IMAGE_STORE_NAME); const request = store.get(key); request.onsuccess = (event) => { const blob = event.target.result; if (blob) { resolve(blob); } else { reject(`Image not found in DB for key: ${key}`); } }; request.onerror = (event) => { console.error(`Error loading image with key ${key}:`, event.target.error); reject(event.target.error); }; }); }
function deleteImageFromDB(key) { return new Promise((resolve, reject) => { if (!db) { reject("Database not initialized."); return; } const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite'); const store = transaction.objectStore(IMAGE_STORE_NAME); const request = store.delete(key); request.onsuccess = () => { console.log(`Image deleted from DB with key: ${key}`); resolve(); }; request.onerror = (event) => { console.error(`Error deleting image with key ${key}:`, event.target.error); reject(event.target.error); }; }); }
// === 2. IndexedDB Funksjoner END ===

// === 3. Modal Håndtering START ===
function openModalTab(event, tabName) { let i, tabcontent, tablinks; tabcontent = playerDetailModal.getElementsByClassName("modal-tab-content"); for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; tabcontent[i].classList.remove("active"); } tablinks = playerDetailModal.getElementsByClassName("tab-button"); for (i = 0; i < tablinks.length; i++) { tablinks[i].classList.remove("active"); } const currentTabContent = document.getElementById(tabName); if (currentTabContent) { currentTabContent.style.display = "block"; currentTabContent.classList.add("active"); } const clickedButton = event ? event.currentTarget : playerDetailModal.querySelector(`.tab-button[onclick*="'${tabName}'"]`); if(clickedButton) clickedButton.classList.add('active'); }
function populateRolesCheckboxes(containerId, selectedRoles = []) { const container = document.getElementById(containerId); if (!container) return; container.innerHTML = ''; Object.entries(PLAYER_ROLES).forEach(([key, value]) => { const div = document.createElement('div'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = `${containerId}-${key}`; checkbox.value = key; checkbox.checked = selectedRoles.includes(key); const label = document.createElement('label'); label.htmlFor = `${containerId}-${key}`; label.textContent = `${value} (${key})`; div.appendChild(checkbox); div.appendChild(label); container.appendChild(div); }); }
function populateStatusDropdown(selectElementId, currentStatusKey) { const selectElement = document.getElementById(selectElementId); if (!selectElement) { console.error(`populateStatusDropdown: Finner ikke selectElement med ID ${selectElementId}`); return; } selectElement.innerHTML = ''; Object.entries(PLAYER_STATUSES).forEach(([key, value]) => { const option = document.createElement('option'); option.value = key; option.textContent = value; if (key === currentStatusKey) { option.selected = true; } selectElement.appendChild(option); }); }
function openAddPlayerModal() { if (!addPlayerModal) { console.error('openAddPlayerModal: FEIL - addPlayerModal elementet er null!'); return; } addPlayerModal.style.display = 'block'; if (newPlayerNameInput) newPlayerNameInput.value = ''; if (newPlayerImageUpload) newPlayerImageUpload.value = ''; if (newPlayerImageUrlInput) newPlayerImageUrlInput.value = ''; if (newPlayerMainRoleInput) newPlayerMainRoleInput.value = ''; populateRolesCheckboxes('new-player-roles-checkboxes'); if (newPlayerNameInput) newPlayerNameInput.focus(); }
function closeAddPlayerModal() { if (addPlayerModal) { addPlayerModal.style.display = 'none'; } }
function handleAddPlayerConfirm() { if (!newPlayerNameInput || !newPlayerImageUrlInput || !newPlayerMainRoleInput || !newPlayerImageUpload) { console.error("handleAddPlayerConfirm: Input-elementer mangler!"); return; } const name = newPlayerNameInput.value.trim(); const imageFile = newPlayerImageUpload.files[0]; let imageUrl = newPlayerImageUrlInput.value.trim(); const mainRole = newPlayerMainRoleInput.value.trim(); if (!name) { alert('Spillernavn må fylles ut.'); return; } const selectedRoles = []; const checkboxesContainer = document.getElementById('new-player-roles-checkboxes'); if (checkboxesContainer) { const roleCheckboxes = checkboxesContainer.querySelectorAll('input[type="checkbox"]:checked'); roleCheckboxes.forEach(cb => selectedRoles.push(cb.value)); } const maxId = squad.reduce((max, p) => Math.max(max, parseInt(p.id.split('-')[1]) || 0), 0); nextPlayerId = maxId + 1; const playerId = `player-${nextPlayerId}`; const newPlayer = { id: playerId, name: name, mainRole: mainRole, playableRoles: selectedRoles, status: DEFAULT_PLAYER_STATUS, nickname: '', position: { x: 50, y: 50 }, borderColor: 'black', personalInfo: { birthday: '', phone: '', email: '' }, matchStats: { matchesPlayed: 0, goalsScored: 0 }, comments: [], imageUrl: imageUrl, imageKey: null }; const completeAddPlayer = () => { squad.push(newPlayer); saveSquad(); renderUI(); if (appContainer && appContainer.classList.contains('view-squad')) { renderFullSquadList(); } closeAddPlayerModal(); console.log("Spiller lagt til:", newPlayer); }; if (imageFile) { console.log(`Prøver å lagre bilde for ${playerId} i IndexedDB...`); newPlayer.imageKey = playerId; newPlayer.imageUrl = ''; saveImageToDB(playerId, imageFile) .then(() => { console.log(`Bilde for ${playerId} lagret i DB.`); completeAddPlayer(); }) .catch(error => { console.error(`Feil ved lagring av bilde for ${playerId}:`, error); alert("Feil ved lagring av bilde. Spiller lagt til uten bilde."); newPlayer.imageKey = null; completeAddPlayer(); }); } else { completeAddPlayer(); } }
function openPlayerDetailModal(playerId) { const player = getPlayerById(playerId); const modalElement = document.getElementById('player-detail-modal'); if (!player || !modalElement) { console.error("Kan ikke åpne detaljer for spiller:", playerId); return; } player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' }; player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 }; player.comments = player.comments || []; player.nickname = player.nickname || ''; player.imageUrl = player.imageUrl || ''; player.mainRole = player.mainRole || ''; player.playableRoles = player.playableRoles || []; player.status = player.status || DEFAULT_PLAYER_STATUS; player.imageKey = player.imageKey || null; const detailIdInput = modalElement.querySelector('#detail-player-id'); const detailTitle = modalElement.querySelector('#detail-modal-title'); const detailNameInput = modalElement.querySelector('#detail-player-name'); const detailNicknameInput = modalElement.querySelector('#detail-player-nickname'); const detailImageUrlInput = modalElement.querySelector('#detail-player-image-url'); const detailImageDisplay = modalElement.querySelector('#detail-player-image-display'); const detailMainRoleInput = modalElement.querySelector('#detail-player-main-role'); const detailPlayerStatusSelect = modalElement.querySelector('#detail-player-status'); const detailBirthdayInput = modalElement.querySelector('#detail-player-birthday'); const detailPhoneInput = modalElement.querySelector('#detail-player-phone'); const detailEmailInput = modalElement.querySelector('#detail-player-email'); const detailMatchesPlayedInput = modalElement.querySelector('#detail-matches-played'); const detailGoalsScoredInput = modalElement.querySelector('#detail-goals-scored'); const detailCommentHistory = modalElement.querySelector('#detail-comment-history'); const detailMatchComment = modalElement.querySelector('#detail-match-comment'); const detailImageUploadInput = modalElement.querySelector('#detail-player-image-upload'); if (!detailIdInput || !detailTitle || !detailNameInput || !detailNicknameInput || !detailImageUrlInput || !detailImageDisplay || !detailMainRoleInput || !detailPlayerStatusSelect || !detailBirthdayInput || !detailPhoneInput || !detailEmailInput || !detailMatchesPlayedInput || !detailGoalsScoredInput || !detailCommentHistory || !detailMatchComment || !detailImageUploadInput) { console.error("Avbryter openPlayerDetailModal pga. manglende internt element."); return; } detailIdInput.value = player.id; detailTitle.textContent = `Detaljer for ${player.name}`; detailNameInput.value = player.name || ''; detailNicknameInput.value = player.nickname; detailMainRoleInput.value = player.mainRole || ''; detailImageUrlInput.value = player.imageUrl; detailImageUploadInput.value = ''; populateStatusDropdown('detail-player-status', player.status); detailBirthdayInput.value = player.personalInfo.birthday || ''; detailPhoneInput.value = player.personalInfo.phone || ''; detailEmailInput.value = player.personalInfo.email || ''; detailMatchesPlayedInput.value = player.matchStats.matchesPlayed || 0; detailGoalsScoredInput.value = player.matchStats.goalsScored || 0; populateRolesCheckboxes('detail-player-roles-checkboxes', player.playableRoles); renderCommentHistory(player.comments, detailCommentHistory); detailMatchComment.value = ''; detailImageDisplay.style.backgroundImage = 'none'; detailImageDisplay.innerHTML = '<span>Laster bilde...</span>'; if (player.imageKey) { loadImageFromDB(player.imageKey) .then(blob => { const objectURL = URL.createObjectURL(blob); detailImageDisplay.style.backgroundImage = `url('${objectURL}')`; detailImageDisplay.innerHTML = ''; }) .catch(error => { console.warn(`Kunne ikke laste bilde fra DB for key ${player.imageKey}:`, error); if (player.imageUrl) { detailImageDisplay.style.backgroundImage = `url('${player.imageUrl}')`; detailImageDisplay.innerHTML = ''; } else { detailImageDisplay.innerHTML = '<span>Ingen bilde</span>'; } }); } else if (player.imageUrl) { detailImageDisplay.style.backgroundImage = `url('${player.imageUrl}')`; detailImageDisplay.innerHTML = ''; } else { detailImageDisplay.innerHTML = '<span>Ingen bilde</span>'; } modalElement.style.display = 'block'; const firstTabButton = modalElement.querySelector('.tab-button'); if (firstTabButton) { firstTabButton.click(); } else { openModalTab(null, 'info-tab'); } }
function renderCommentHistory(comments, historyDivElement) { if (!historyDivElement) return; historyDivElement.innerHTML = ''; if (!comments || comments.length === 0) { historyDivElement.innerHTML = '<p><i>Ingen historikk.</i></p>'; return; } const sortedComments = [...comments].sort((a, b) => new Date(b.date) - new Date(a.date)); sortedComments.forEach(comment => { const p = document.createElement('p'); const dateSpan = document.createElement('span'); dateSpan.classList.add('comment-date'); try { dateSpan.textContent = new Date(comment.date).toLocaleString('no-NO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { dateSpan.textContent = comment.date; } const textNode = document.createTextNode(comment.text); p.appendChild(dateSpan); p.appendChild(textNode); historyDivElement.appendChild(p); }); }
function closePlayerDetailModal() { const modalElement = document.getElementById('player-detail-modal'); if (modalElement) { modalElement.style.display = 'none'; } }
function handleAddCommentToHistory() { const modalElement = document.getElementById('player-detail-modal'); if (!modalElement) return; const detailIdInput = modalElement.querySelector('#detail-player-id'); const detailMatchCommentInput = modalElement.querySelector('#detail-match-comment'); const detailCommentHistoryDiv = modalElement.querySelector('#detail-comment-history'); if (!detailIdInput || !detailMatchCommentInput || !detailCommentHistoryDiv) return; const playerId = detailIdInput.value; const player = getPlayerById(playerId); const commentText = detailMatchCommentInput.value.trim(); if (!player || !commentText) { alert("Skriv kommentar."); return; } const newComment = { date: new Date().toISOString(), text: commentText }; player.comments = player.comments || []; player.comments.push(newComment); saveSquad(); renderCommentHistory(player.comments, detailCommentHistoryDiv); detailMatchCommentInput.value = ''; alert("Kommentar lagt til."); }
function handleSavePlayerDetails() { const modalElement = document.getElementById('player-detail-modal'); if (!modalElement) return; const detailIdInput = modalElement.querySelector('#detail-player-id'); const detailNameInput = modalElement.querySelector('#detail-player-name'); const detailNicknameInput = modalElement.querySelector('#detail-player-nickname'); const detailImageUrlInput = modalElement.querySelector('#detail-player-image-url'); const detailImageUploadInput = modalElement.querySelector('#detail-player-image-upload'); const detailMainRoleInput = modalElement.querySelector('#detail-player-main-role'); const detailPlayerStatusSelect = modalElement.querySelector('#detail-player-status'); const detailBirthdayInput = modalElement.querySelector('#detail-player-birthday'); const detailPhoneInput = modalElement.querySelector('#detail-player-phone'); const detailEmailInput = modalElement.querySelector('#detail-player-email'); const detailMatchesPlayedInput = modalElement.querySelector('#detail-matches-played'); const detailGoalsScoredInput = modalElement.querySelector('#detail-goals-scored'); const detailMatchCommentInput = modalElement.querySelector('#detail-match-comment'); if (!detailIdInput || !detailNameInput || !detailNicknameInput || !detailImageUrlInput || !detailImageUploadInput || !detailMainRoleInput || !detailPlayerStatusSelect || !detailBirthdayInput || !detailPhoneInput || !detailEmailInput || !detailMatchesPlayedInput || !detailGoalsScoredInput || !detailMatchCommentInput ) { console.error("handleSavePlayerDetails: Mangler elementer."); return; } const playerId = detailIdInput.value; const player = getPlayerById(playerId); if (!player) return; let dataChanged = false; let visualChanged = false; let imageUpdatePromise = Promise.resolve(); const imageFile = detailImageUploadInput.files[0]; const newImageUrl = detailImageUrlInput.value.trim(); if (player.name !== detailNameInput.value) { player.name = detailNameInput.value; dataChanged = true; visualChanged = true; } if (player.nickname !== detailNicknameInput.value) { player.nickname = detailNicknameInput.value.trim(); dataChanged = true; visualChanged = true; } if (player.mainRole !== detailMainRoleInput.value) { player.mainRole = detailMainRoleInput.value; dataChanged = true; visualChanged = true; } if (player.status !== detailPlayerStatusSelect.value) { player.status = detailPlayerStatusSelect.value; dataChanged = true; visualChanged = true; } const selectedRoles = []; const checkboxesContainer = document.getElementById('detail-player-roles-checkboxes'); if (checkboxesContainer) { const roleCheckboxes = checkboxesContainer.querySelectorAll('input[type="checkbox"]:checked'); roleCheckboxes.forEach(cb => selectedRoles.push(cb.value)); } if (JSON.stringify(player.playableRoles || []) !== JSON.stringify(selectedRoles)) { player.playableRoles = selectedRoles; dataChanged = true; visualChanged = true; } player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' }; player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 }; if (player.personalInfo.birthday !== detailBirthdayInput.value) { player.personalInfo.birthday = detailBirthdayInput.value; dataChanged = true; } if (player.personalInfo.phone !== detailPhoneInput.value) { player.personalInfo.phone = detailPhoneInput.value; dataChanged = true; } if (player.personalInfo.email !== detailEmailInput.value) { player.personalInfo.email = detailEmailInput.value; dataChanged = true; } const matchesPlayedVal = parseInt(detailMatchesPlayedInput.value) || 0; const goalsScoredVal = parseInt(detailGoalsScoredInput.value) || 0; if (player.matchStats.matchesPlayed !== matchesPlayedVal) { player.matchStats.matchesPlayed = matchesPlayedVal; dataChanged = true; } if (player.matchStats.goalsScored !== goalsScoredVal) { player.matchStats.goalsScored = goalsScoredVal; dataChanged = true; } if (imageFile) { console.log(`Ny bildefil valgt for ${playerId}, lagrer i DB...`); player.imageKey = playerId; player.imageUrl = ''; dataChanged = true; visualChanged = true; imageUpdatePromise = saveImageToDB(playerId, imageFile); } else if (player.imageUrl !== newImageUrl) { console.log(`Bilde-URL endret for ${playerId} til: ${newImageUrl}`); player.imageUrl = newImageUrl; dataChanged = true; visualChanged = true; if (player.imageKey) { console.log(` - Fjerner tidligere lagret bilde fra DB for ${playerId}`); imageUpdatePromise = deleteImageFromDB(player.imageKey).then(() => { player.imageKey = null; }); } } imageUpdatePromise.catch(error => { console.error("Feil under bildeoppdatering i DB:", error); alert("En feil oppstod under oppdatering av spillerbilde."); }) .finally(() => { const currentComment = detailMatchCommentInput.value.trim(); if (currentComment) { if (confirm("Legge til usnlagret kommentar?")) { handleAddCommentToHistory(); dataChanged = true; } } if (dataChanged) { console.log("Lagrer detaljer:", playerId, player); saveSquad(); if (visualChanged) { renderUI(); if (appContainer && appContainer.classList.contains('view-squad')) { renderFullSquadList(); } updatePlayerPieceVisuals(playerId); } alert("Detaljer lagret."); } else { console.log("Ingen endringer å lagre:", playerId); } closePlayerDetailModal(); }); }
function handleDeletePlayer(playerId, playerName) { if (!playerId) { console.error("handleDeletePlayer: playerId mangler."); return; } const player = getPlayerById(playerId); const confirmDelete = confirm(`Er du sikker på at du vil slette spilleren "${playerName || playerId}" permanent?\nSpilleren fjernes fra troppen, banen og benken.`); if (confirmDelete) { console.log(`Sletter spiller: ${playerId}`); let deleteImagePromise = Promise.resolve(); if (player && player.imageKey) { deleteImagePromise = deleteImageFromDB(player.imageKey); } deleteImagePromise.catch(error => { console.error(`Kunne ikke slette bilde fra DB for ${playerId}:`, error); }) .finally(() => { const playerIndex = squad.findIndex(p => p.id === playerId); if (playerIndex > -1) { squad.splice(playerIndex, 1); } else { console.warn(`handleDeletePlayer: Spiller ${playerId} ikke funnet i squad.`); } if (playersOnPitch[playerId]) { playersOnPitch[playerId].remove(); delete playersOnPitch[playerId]; console.log(` - Spiller ${playerId} fjernet fra banen.`); } const benchIndex = playersOnBench.indexOf(playerId); if (benchIndex > -1) { playersOnBench.splice(benchIndex, 1); console.log(` - Spiller ${playerId} fjernet fra benken.`); } saveSquad(); saveCurrentState(); renderUI(); renderFullSquadList(); alert(`Spiller "${playerName || playerId}" ble slettet.`); }); } else { console.log(`Sletting av spiller ${playerId} avbrutt.`); } }
function openBallSettingsModal() { if (!ballSettingsModal) return; const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider'); const sizeValueDisplay = ballSettingsModal.querySelector('#ball-size-value'); const customColorInput = ballSettingsModal.querySelector('#ball-custom-color'); const styleRadios = ballSettingsModal.querySelectorAll('input[name="ball-style"]'); sizeSlider.value = ballSettings.size; sizeValueDisplay.textContent = `${ballSettings.size}px`; customColorInput.value = ballSettings.color; styleRadios.forEach(radio => { radio.checked = radio.value === ballSettings.style; }); ballSettingsModal.style.display = 'block'; }
function closeBallSettingsModal() { if (ballSettingsModal) { ballSettingsModal.style.display = 'none'; } }
function handleBallSizeChange(event) { const newSize = event.target.value; const sizeValueDisplay = ballSettingsModal.querySelector('#ball-size-value'); if (sizeValueDisplay) sizeValueDisplay.textContent = `${newSize}px`; if (ballElement) { ballElement.style.width = `${newSize}px`; ballElement.style.height = `${newSize}px`; } }
function handleSaveBallSettings() { if (!ballSettingsModal) return; const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider'); const selectedStyleRadio = ballSettingsModal.querySelector('input[name="ball-style"]:checked'); const customColorInput = ballSettingsModal.querySelector('#ball-custom-color'); ballSettings.size = parseInt(sizeSlider.value, 10); ballSettings.style = selectedStyleRadio ? selectedStyleRadio.value : 'default'; ballSettings.color = customColorInput.value; applyBallStyle(); saveCurrentState(); closeBallSettingsModal(); alert("Ballinnstillinger lagret!"); }
function handleDetailImageUpload(event) { const file = event.target.files[0]; if (file) { const reader = new FileReader(); const detailImageDisplay = document.getElementById('detail-player-image-display'); reader.onload = function(e) { detailImageDisplay.style.backgroundImage = `url('${e.target.result}')`; detailImageDisplay.innerHTML = ''; const detailImageUrlInput = document.getElementById('detail-player-image-url'); if (detailImageUrlInput) detailImageUrlInput.value = ''; }; reader.readAsDataURL(file); } }
// === 3. Modal Håndtering END ===

// === Kamp Håndtering START ===
function generateMatchId() {
    const newId = `match-${nextMatchId}`;
    nextMatchId++;
    return newId;
}

function openAddMatchModal() {
    if (!addMatchModal) {
        console.error('openAddMatchModal: addMatchModal elementet er null!');
        return;
    }
    // Bruk document.getElementById direkte for å være helt sikker
    const dateInput = document.getElementById('new-match-only-date');
    const timeInput = document.getElementById('new-match-time');
    const opponentInput = document.getElementById('new-match-opponent'); // Denne ble funnet sist, så querySelector burde virke for den
    const venueInput = document.getElementById('new-match-venue'); // Samme her

    console.log("openAddMatchModal: dateInput:", dateInput); // Logging for debugging
    console.log("openAddMatchModal: timeInput:", timeInput); // Logging for debugging

    if (dateInput) dateInput.value = '';
    if (timeInput) timeInput.value = '18:00';
    if (opponentInput) opponentInput.value = '';
    if (venueInput) venueInput.value = 'H';

    addMatchModal.style.display = 'block';
    if (dateInput) dateInput.focus();
}

function closeAddMatchModal() {
    if (addMatchModal) {
        addMatchModal.style.display = 'none';
    }
}

function handleAddMatchConfirm() {
    if (!addMatchModal) {
        console.error("handleAddMatchConfirm: addMatchModal er null. Kan ikke fortsette.");
        alert("En kritisk feil oppstod. Prøv å laste siden på nytt.");
        return;
    }

    // Bruk document.getElementById direkte for å være helt sikker
    const dateInput = document.getElementById('new-match-only-date');
    const timeInput = document.getElementById('new-match-time');
    const opponentInput = document.getElementById('new-match-opponent');
    const venueInput = document.getElementById('new-match-venue');

    console.log("handleAddMatchConfirm (etter getElementById): dateInput:", dateInput);
    console.log("handleAddMatchConfirm (etter getElementById): timeInput:", timeInput);
    console.log("handleAddMatchConfirm (etter getElementById): opponentInput:", opponentInput);
    console.log("handleAddMatchConfirm (etter getElementById): venueInput:", venueInput);

    if (!dateInput || !timeInput || !opponentInput || !venueInput) {
        console.error("handleAddMatchConfirm: Ett eller flere input-elementer for kamp ble ikke funnet i dokumentet!");
        alert("En feil oppstod: Kunne ikke finne alle nødvendige felt for å legge til kamp. Sjekk ID-er i HTML og script.");
        return;
    }

    const datePart = dateInput.value;
    const timePart = timeInput.value;
    const opponent = opponentInput.value.trim();
    const venue = venueInput.value;

    if (!datePart) {
        alert('Dato for kampen må fylles ut.');
        dateInput.focus();
        return;
    }
    if (!timePart) {
        alert('Tidspunkt for kampen må fylles ut.');
        timeInput.focus();
        return;
    }
    if (!opponent) {
        alert('Motstander må fylles ut.');
        opponentInput.focus();
        return;
    }

    const combinedDateTime = `${datePart}T${timePart}:00`;
    let matchDateTime;
    try {
        const testDate = new Date(combinedDateTime);
        if (isNaN(testDate.getTime())) {
            throw new Error("Invalid date/time value from new Date()");
        }
        matchDateTime = testDate.toISOString();
    } catch (e) {
        alert("Ugyldig dato/tid format. Vennligst sjekk input.\nFormat: ÅÅÅÅ-MM-DD og TT:MM");
        console.error("Feil ved parsing av dato/tid: ", combinedDateTime, e);
        return;
    }

    const newMatch = {
        id: generateMatchId(),
        dateTime: matchDateTime,
        opponent: opponent,
        venue: venue,
        resultHome: null,
        resultAway: null,
        status: DEFAULT_MATCH_STATUS,
        tacticsState: null,
        notes: ''
    };

    matches.push(newMatch);
    saveMatches();
    renderMatchList();
    populateActiveMatchDropdown();
    closeAddMatchModal();
    console.log("Ny kamp lagt til:", newMatch);
}

function renderMatchList() {
    if (!matchListContainer) {
        console.error("renderMatchList: matchListContainer ikke funnet.");
        return;
    }
    matchListContainer.innerHTML = '';

    if (matches.length === 0) {
        matchListContainer.innerHTML = '<p>Ingen kamper registrert. Klikk "Legg til Ny Kamp" for å starte.</p>';
        return;
    }

    const sortedMatches = [...matches].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const headers = ['Dato & Tid', 'Motstander', 'Arena', 'Status', 'Resultat', 'Handlinger'];
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.borderBottom = '2px solid #ccc';
        th.style.padding = '8px';
        th.style.textAlign = 'left';
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    sortedMatches.forEach(match => {
        const row = tbody.insertRow();
        row.style.borderBottom = '1px solid #eee';

        const dateCell = row.insertCell();
        try {
            dateCell.textContent = new Date(match.dateTime).toLocaleString('no-NO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            dateCell.textContent = match.dateTime;
        }
        dateCell.style.padding = '8px';

        const opponentCell = row.insertCell();
        opponentCell.textContent = match.opponent;
        opponentCell.style.padding = '8px';

        const venueCell = row.insertCell();
        venueCell.textContent = match.venue === 'H' ? 'Hjemme' : 'Borte';
        venueCell.style.padding = '8px';

        const statusCell = row.insertCell();
        statusCell.textContent = MATCH_STATUSES[match.status] || match.status;
        statusCell.style.padding = '8px';

        const resultCell = row.insertCell();
        if (match.status === 'SPILT' && match.resultHome !== null && match.resultAway !== null) {
            resultCell.textContent = `${match.resultHome} - ${match.resultAway}`;
        } else {
            resultCell.textContent = '-';
        }
        resultCell.style.padding = '8px';

        const actionsCell = row.insertCell();
        actionsCell.style.padding = '8px';
        actionsCell.style.whiteSpace = 'nowrap';
        const placeholderButton = document.createElement('button');
        placeholderButton.textContent = 'Detaljer';
        placeholderButton.disabled = true;
        actionsCell.appendChild(placeholderButton);
    });

    matchListContainer.appendChild(table);
}

function populateActiveMatchDropdown() {
    if (!activeMatchSelect) {
        console.warn("populateActiveMatchDropdown: activeMatchSelect ikke funnet.");
        return;
    }
    activeMatchSelect.innerHTML = '<option value="">Ingen kamp valgt</option>';

    const sortedMatches = [...matches].sort((a, b) => {
        if (a.status === 'PLANLAGT' && b.status !== 'PLANLAGT') return -1;
        if (a.status !== 'PLANLAGT' && b.status === 'PLANLAGT') return 1;
        return new Date(a.dateTime) - new Date(b.dateTime);
    });

    sortedMatches.forEach(match => {
        const option = document.createElement('option');
        option.value = match.id;
        let dateStr = '';
        try {
            dateStr = new Date(match.dateTime).toLocaleDateString('no-NO', { day: '2-digit', month: 'short' });
        } catch (e) { dateStr = match.dateTime.substring(0,10); }

        option.textContent = `${dateStr}: ${match.opponent} (${match.venue === 'H' ? 'H' : 'B'}) - ${MATCH_STATUSES[match.status]}`;
        if (match.id === activeMatchId) {
            option.selected = true;
        }
        activeMatchSelect.appendChild(option);
    });
}

function handleActiveMatchChange(event) {
    activeMatchId = event.target.value;
    if (activeMatchId) {
        const selectedMatch = matches.find(m => m.id === activeMatchId);
        console.log("Aktiv kamp valgt:", selectedMatch);
    } else {
        console.log("Ingen aktiv kamp valgt. Går tilbake til generell modus.");
    }
}

function saveMatches() {
    try {
        localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
        console.log("Kamper lagret i localStorage.");
    } catch (e) {
        console.error("Feil ved lagring av kamper til localStorage:", e);
    }
}

function loadMatches() {
    const savedMatchesJson = localStorage.getItem(STORAGE_KEY_MATCHES);
    if (savedMatchesJson) {
        try {
            matches = JSON.parse(savedMatchesJson);
            if (matches.length > 0) {
                const maxIdNum = matches.reduce((max, m) => {
                    const idNum = parseInt(m.id.split('-')[1]);
                    return Math.max(max, isNaN(idNum) ? 0 : idNum);
                }, 0);
                nextMatchId = maxIdNum + 1;
            } else {
                nextMatchId = 1;
            }
            console.log("Kamper lastet fra localStorage:", matches);
            return true;
        } catch (e) {
            console.error("Feil ved parsing av kamper fra localStorage:", e);
            matches = [];
            localStorage.removeItem(STORAGE_KEY_MATCHES);
            return false;
        }
    }
    matches = [];
    nextMatchId = 1;
    return false;
}
// === Kamp Håndtering END ===

// === 4. UI Rendering START ===
function renderUI() { renderOnPitchList(); renderBench(); renderSquadList(); if(onPitchCountElement) onPitchCountElement.textContent = Object.keys(playersOnPitch).length; if(onBenchCountElement) onBenchCountElement.textContent = playersOnBench.length; }
function renderOnPitchList() { if (!onPitchListElement) return; onPitchListElement.innerHTML = ''; const playerIdsOnPitch = Object.keys(playersOnPitch); if (playerIdsOnPitch.length === 0) { onPitchListElement.innerHTML = '<li><i>Ingen spillere på banen.</i></li>'; return; } const sortedPlayers = playerIdsOnPitch.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name)); sortedPlayers.forEach(player => { const listItem = document.createElement('li'); let roleText = player.mainRole ? ` (${player.mainRole})` : ''; listItem.textContent = (player.nickname || player.name) + roleText; listItem.setAttribute('data-player-id', player.id); listItem.classList.add('on-pitch-player-item', 'draggable'); listItem.setAttribute('draggable', true); listItem.classList.remove(...Object.keys(PLAYER_STATUSES).map(s => `player-status-${s}`)); if (player.status) listItem.classList.add(`player-status-${player.status}`); listItem.addEventListener('dragstart', handleDragStartOnPitchList); listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); onPitchListElement.appendChild(listItem); }); }
function renderBench() { if (!benchListElement) return; benchListElement.innerHTML = ''; if (playersOnBench.length === 0) { benchListElement.innerHTML = '<li><i>Benken er tom.</i></li>'; return; } const sortedPlayers = playersOnBench.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name)); sortedPlayers.forEach(player => { const listItem = document.createElement('li'); let roleText = player.mainRole ? ` (${player.mainRole})` : ''; listItem.textContent = (player.nickname || player.name) + roleText; listItem.setAttribute('data-player-id', player.id); listItem.classList.add('bench-player-item', 'draggable'); listItem.setAttribute('draggable', true); listItem.classList.remove(...Object.keys(PLAYER_STATUSES).map(s => `player-status-${s}`)); if (player.status) listItem.classList.add(`player-status-${player.status}`); listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); benchListElement.appendChild(listItem); }); addDragListenersToBenchItems(); }
function renderSquadList() { if (!squadListElement || !squadManagementSection) return; squadListElement.innerHTML = ''; const titleElement = squadManagementSection.querySelector('h3'); const defaultTitle = "Tropp (Tilgjengelige)"; let playersToList = []; let currentTitle = defaultTitle; if (selectedFormationPosition && selectedFormationPosition.roles) { currentTitle = `Spillere for ${selectedFormationPosition.name || selectedFormationPosition.id.toUpperCase()}:`; playersToList = squad.filter(p => p.playableRoles && p.playableRoles.some(playerRole => selectedFormationPosition.roles.includes(playerRole))).sort((a, b) => a.name.localeCompare(b.name)); } else { playersToList = squad.filter(p => !playersOnPitch[p.id] && !playersOnBench.includes(p.id)).sort((a, b) => a.name.localeCompare(b.name)); } if (titleElement) { titleElement.textContent = currentTitle; } if (playersToList.length === 0) { if (selectedFormationPosition) { squadListElement.innerHTML = '<li><i>Ingen spillere med passende rolle(r).</i></li>'; } else if (squad.length === 0) { squadListElement.innerHTML = '<li><i>Ingen spillere i troppen.</i></li>'; } else if (Object.keys(playersOnPitch).length + playersOnBench.length === squad.length) { squadListElement.innerHTML = '<li><i>Alle spillere er plassert.</i></li>'; } else { squadListElement.innerHTML = '<li><i>Ingen tilgjengelige spillere.</i></li>'; } } else { playersToList.forEach(player => { const listItem = document.createElement('li'); let roleText = player.mainRole ? ` (${player.mainRole})` : ''; listItem.textContent = (player.nickname || player.name) + roleText; listItem.setAttribute('data-player-id', player.id); listItem.classList.add('squad-player-item', 'draggable'); listItem.setAttribute('draggable', true); listItem.classList.remove(...Object.keys(PLAYER_STATUSES).map(s => `player-status-${s}`)); if (player.status) listItem.classList.add(`player-status-${player.status}`); listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); squadListElement.appendChild(listItem); }); } addDragListenersToSquadItems(); }
function renderFullSquadList() { if (!fullSquadListContainer) { console.error("renderFullSquadList: Container ikke funnet."); return; } fullSquadListContainer.innerHTML = ''; if (squad.length === 0) { fullSquadListContainer.innerHTML = '<p>Ingen spillere i troppen.</p>'; return; } const sortedSquad = [...squad].sort((a, b) => a.name.localeCompare(b.name)); const table = document.createElement('table'); table.style.width = '100%'; table.style.borderCollapse = 'collapse'; const thead = table.createTHead(); const headerRow = thead.insertRow(); const headers = ['Navn', 'Kallenavn', 'Hovedpos.', 'Roller', 'Status', 'Handlinger']; headers.forEach(text => { const th = document.createElement('th'); th.textContent = text; th.style.borderBottom = '2px solid #ccc'; th.style.padding = '8px'; th.style.textAlign = 'left'; headerRow.appendChild(th); }); const tbody = table.createTBody(); sortedSquad.forEach(player => { const row = tbody.insertRow(); row.style.borderBottom = '1px solid #eee'; const nameCell = row.insertCell(); nameCell.textContent = player.name || '?'; nameCell.style.padding = '8px'; const nicknameCell = row.insertCell(); nicknameCell.textContent = player.nickname || '-'; nicknameCell.style.padding = '8px'; const mainRoleCell = row.insertCell(); mainRoleCell.textContent = player.mainRole || '-'; mainRoleCell.style.padding = '8px'; const rolesCell = row.insertCell(); const rolesString = (player.playableRoles && player.playableRoles.length > 0) ? player.playableRoles.map(roleKey => PLAYER_ROLES[roleKey] || roleKey).join(', ') : '-'; rolesCell.textContent = rolesString; rolesCell.style.padding = '8px'; rolesCell.style.fontSize = '0.85em'; const statusCell = row.insertCell(); statusCell.textContent = PLAYER_STATUSES[player.status] || player.status; statusCell.style.padding = '8px'; if (player.status === 'INJURED_SHORT' || player.status === 'INJURED_LONG') { statusCell.style.color = 'orange'; } else if (player.status === 'SUSPENDED' || player.status === 'UNAVAILABLE') { statusCell.style.color = 'red'; } else if (player.status === 'AVAILABLE') { statusCell.style.color = 'green'; } const actionsCell = row.insertCell(); actionsCell.style.padding = '8px'; actionsCell.style.whiteSpace = 'nowrap'; const editButton = document.createElement('button'); editButton.textContent = 'Rediger'; editButton.style.padding = '4px 8px'; editButton.style.marginRight = '5px'; editButton.classList.add('action-button'); editButton.addEventListener('click', () => openPlayerDetailModal(player.id)); actionsCell.appendChild(editButton); const deleteButton = document.createElement('button'); deleteButton.textContent = 'Slett'; deleteButton.style.padding = '4px 8px'; deleteButton.style.backgroundColor = '#f44336'; deleteButton.classList.add('action-button'); deleteButton.addEventListener('click', () => handleDeletePlayer(player.id, player.name)); actionsCell.appendChild(deleteButton); }); fullSquadListContainer.appendChild(table); }
// === 4. UI Rendering END ===

// === 5. Spillerbrikke & Ball Håndtering START ===
function createPlayerPieceElement(player, xPercent, yPercent) { console.log(`createPlayerPieceElement for ${player.id}, Name: ${player.name}, x:${xPercent}%, y:${yPercent}%`); const piece = document.createElement('div'); piece.classList.add('player-piece', 'draggable'); piece.setAttribute('data-player-id', player.id); piece.setAttribute('draggable', true); piece.style.left = `${xPercent}%`; piece.style.top = `${yPercent}%`; const imgContainer = document.createElement('div'); imgContainer.classList.add('player-image-container'); imgContainer.style.borderColor = player.borderColor || 'black'; const imgDiv = document.createElement('div'); imgDiv.classList.add('player-image'); imgContainer.appendChild(imgDiv); piece.appendChild(imgContainer); const nameDiv = document.createElement('div'); nameDiv.classList.add('player-name'); nameDiv.textContent = player.nickname || player.name; piece.appendChild(nameDiv); piece.addEventListener('dragstart', handleDragStartPiece); piece.addEventListener('dragend', handleDragEnd); piece.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); piece.addEventListener('click', handlePlayerPieceClick); console.log(`  -> Inni createPlayerPieceElement, FØR kall til updatePlayerPieceVisuals for ${player.id}. Piece:`, piece); updatePlayerPieceVisuals(player.id, piece); return piece; }
async function updatePlayerPieceVisuals(playerId, pieceElement = null) { console.log(`updatePlayerPieceVisuals kalt for: ${playerId}. pieceElement gitt:`, pieceElement ? 'Ja' : 'Nei'); const player = getPlayerById(playerId); if (!player) { console.warn(`updatePlayerPieceVisuals: Fant ikke spiller ${playerId}.`); return; } if (!pieceElement) { pieceElement = playersOnPitch[playerId]; console.log(`  -> Hentet pieceElement fra playersOnPitch for ${playerId}:`, pieceElement); } if (!pieceElement) { console.warn(`updatePlayerPieceVisuals: Fant ikke pieceElement for ${playerId} selv etter oppslag.`); return;  } const imgDiv = pieceElement.querySelector('.player-image'); const nameDiv = pieceElement.querySelector('.player-name'); const imgContainer = pieceElement.querySelector('.player-image-container'); if (nameDiv) { nameDiv.textContent = player.nickname || player.name; } if (imgContainer) { imgContainer.style.borderColor = player.borderColor || 'black'; } if (imgDiv) { console.log(`  -> updatePlayerPieceVisuals for ${playerId}: imgDiv funnet. Nåværende backgroundImage: ${imgDiv.style.backgroundImage}`); imgDiv.style.backgroundImage = 'none'; imgDiv.style.backgroundColor = '#aaa'; try { if (player.imageKey) { console.log(`  -> Forsøker å laste bilde fra DB for ${player.imageKey}`); const blob = await loadImageFromDB(player.imageKey); const objectURL = URL.createObjectURL(blob); imgDiv.style.backgroundImage = `url('${objectURL}')`; imgDiv.style.backgroundColor = 'transparent'; console.log(`  -> Bilde satt fra DB for ${player.id}: ${objectURL}`); } else if (player.imageUrl) { imgDiv.style.backgroundImage = `url('${player.imageUrl}')`; imgDiv.style.backgroundColor = 'transparent'; console.log(`  -> Bilde satt fra URL for ${player.id}: ${player.imageUrl}`); } else { console.log(`  -> Ingen bilde (verken key eller URL) for ${player.id}.`); } } catch (error) { console.warn(`  -> Kunne ikke laste bilde for ${playerId} i updatePlayerPieceVisuals:`, error); } } else { console.error(`  -> updatePlayerPieceVisuals: imgDiv IKKE funnet i pieceElement for ${playerId}!`); } }
function getPlayerById(playerId) { if (!playerId) return null; return squad.find(p => p.id === playerId) || null; }
function updateBallPosition(xPercent, yPercent) { if (ballElement) { ballElement.style.left = `${xPercent}%`; ballElement.style.top = `${yPercent}%`; ballSettings.position.x = xPercent; ballSettings.position.y = yPercent; } }
function applyBallStyle() { if (!ballElement) return; ballElement.style.width = `${ballSettings.size}px`; ballElement.style.height = `${ballSettings.size}px`; ballElement.classList.remove('ball-style-classic', 'ball-style-color'); ballElement.style.backgroundColor = ''; ballElement.style.backgroundImage = ''; ballElement.style.background = ''; if (ballSettings.style === 'classic') { ballElement.classList.add('ball-style-classic'); } else if (ballSettings.style === 'color') { ballElement.classList.add('ball-style-color'); ballElement.style.backgroundColor = ballSettings.color; } else { ballElement.style.background = 'radial-gradient(circle at 30% 30%, white 90%, #e0e0e0 100%)'; } }
// === 5. Spillerbrikke & Ball Håndtering END ===

// === 6. Formasjons- og Tegnehåndtering START ===
function handleFormationChange(event) { const selectedFormationName = event.target.value; currentFormation = FORMATIONS[selectedFormationName] || null; clearFormationPositions(); resetPositionFilter(); if (currentFormation) { console.log(`Formasjon valgt: ${currentFormation.name}`, currentFormation); drawFormationPositions(currentFormation); } else { console.log("Ingen formasjon valgt."); } }
function clearFormationPositions() { if (!pitchSurface) { console.error("clearFormationPositions: pitchSurface ikke funnet!"); return; } const markers = pitchSurface.querySelectorAll('.formation-position-marker'); markers.forEach(marker => marker.remove()); resetPositionFilter(); console.log("Formasjonsmarkører fjernet."); }
function drawFormationPositions(formation) { if (!formation || !formation.positions || !pitchSurface) { console.error("drawFormationPositions: Mangler formasjonsdata eller pitchSurface."); return; } console.log(`Tegner posisjoner for: ${formation.name}`); formation.positions.forEach(pos => { const marker = document.createElement('div'); marker.classList.add('formation-position-marker', 'drop-target'); marker.style.left = `${pos.x}%`; marker.style.top = `${pos.y}%`; marker.textContent = pos.id.toUpperCase(); marker.title = `${pos.name} (Roller: ${pos.roles.join(', ')})`; marker.setAttribute('data-pos-id', pos.id); marker.setAttribute('data-pos-name', pos.name); marker.setAttribute('data-roles', JSON.stringify(pos.roles)); marker.addEventListener('click', (e) => { e.stopPropagation(); handlePositionMarkerClick(marker, pos); }); marker.addEventListener('dragover', (e) => handleDragOver(e, 'formation-marker')); marker.addEventListener('dragleave', (e) => handleDragLeave(e, 'formation-marker')); marker.addEventListener('drop', (e) => handleDropOnFormationMarker(e, pos)); pitchSurface.appendChild(marker); }); }
function handlePositionMarkerClick(markerElement, positionData) { console.log(`Klikket på posisjon: ${positionData.name} (ID: ${positionData.id}), Roller: ${positionData.roles.join(', ')}`); const isAlreadySelected = markerElement.classList.contains('selected'); clearSelectedPositionMarker(); if (isAlreadySelected) { resetPositionFilter(); } else { markerElement.classList.add('selected'); selectedFormationPosition = positionData; renderSquadList(); } }
function clearSelectedPositionMarker() { if (!pitchSurface) return; const selectedMarkers = pitchSurface.querySelectorAll('.formation-position-marker.selected'); selectedMarkers.forEach(marker => marker.classList.remove('selected')); }
function resetPositionFilter() { console.log("Nullstiller posisjonsfilter."); selectedFormationPosition = null; clearSelectedPositionMarker(); renderSquadList(); }
function toggleDrawMode() { isDrawingMode = !isDrawingMode; console.log("Tegnemodus:", isDrawingMode ? "PÅ" : "AV"); if (!drawingCanvas || !pitchSurface || !toggleDrawModeButton) {console.error("toggleDrawMode: Mangler elementer."); return;} if (isDrawingMode) { drawingCanvas.style.pointerEvents = 'auto'; pitchSurface.style.cursor = 'crosshair'; toggleDrawModeButton.textContent = 'Modus (På)'; toggleDrawModeButton.classList.add('active'); pitchSurface.addEventListener('mousedown', startDraw); pitchSurface.addEventListener('touchstart', startDraw, { passive: false }); pitchSurface.addEventListener('mousemove', draw); pitchSurface.addEventListener('touchmove', draw, { passive: false }); pitchSurface.addEventListener('mouseup', stopDraw); pitchSurface.addEventListener('touchend', stopDraw); pitchSurface.addEventListener('mouseleave', stopDraw); } else { drawingCanvas.style.pointerEvents = 'none'; pitchSurface.style.cursor = 'default'; toggleDrawModeButton.textContent = 'Modus (Av)'; toggleDrawModeButton.classList.remove('active'); pitchSurface.removeEventListener('mousedown', startDraw); pitchSurface.removeEventListener('touchstart', startDraw); pitchSurface.removeEventListener('mousemove', draw); pitchSurface.removeEventListener('touchmove', draw); pitchSurface.removeEventListener('mouseup', stopDraw); pitchSurface.removeEventListener('touchend', stopDraw); pitchSurface.removeEventListener('mouseleave', stopDraw); if (isDrawing) { isDrawing = false; redrawCanvas(); } } }
function startDraw(event) { if (!isDrawingMode) return; event.preventDefault(); isDrawing = true; const coords = getCanvasCoordinates(event); startX = coords.x; startY = coords.y; currentX = startX; currentY = startY; if (currentDrawingTool === 'freehand') { currentDrawingPoints = [{x: startX, y: startY}]; } console.log(`Start Draw (${currentDrawingTool}) at: ${startX.toFixed(1)}, ${startY.toFixed(1)}`); }
function draw(event) { if (!isDrawing || !isDrawingMode) return; event.preventDefault(); const coords = getCanvasCoordinates(event); currentX = coords.x; currentY = coords.y; if (currentDrawingTool === 'freehand') { currentDrawingPoints.push({x: currentX, y: currentY}); } redrawCanvas(); }
function stopDraw(event) { if (!isDrawing || !isDrawingMode) return; const coords = getCanvasCoordinates(event); currentX = coords.x; currentY = coords.y; isDrawing = false; let newDrawing = null; if (currentDrawingTool === 'freehand') { if (currentDrawingPoints.length > 1) { newDrawing = { type: 'freehand', color: currentDrawingColor, width: DRAWING_LINE_WIDTH, points: [...currentDrawingPoints]}; console.log(`Stop Draw. Lagret frihåndstegning med ${currentDrawingPoints.length} punkter.`); } else { console.log("Frihåndstegning for kort, lagrer ikke."); } currentDrawingPoints = []; } else { if (Math.abs(startX - currentX) >= 5 || Math.abs(startY - currentY) >= 5) { newDrawing = { type: currentDrawingTool, color: currentDrawingColor, width: DRAWING_LINE_WIDTH, startX: startX, startY: startY, endX: currentX, endY: currentY }; console.log(`Stop Draw. Lagret ${currentDrawingTool}:`, newDrawing); } else { console.log("Tegning for kort, lagrer ikke."); } } if (newDrawing) { savedDrawings.push(newDrawing); } redrawCanvas(); }
function redrawCanvas() { if (!drawingCtx) return; clearDrawingCanvas(); redrawAllDrawings(); if (isDrawing) { let tempData; if (currentDrawingTool === 'freehand') { tempData = { type: 'freehand', color: currentDrawingColor, width: DRAWING_LINE_WIDTH, points: currentDrawingPoints }; } else { tempData = { type: currentDrawingTool, color: currentDrawingColor, width: DRAWING_LINE_WIDTH, startX: startX, startY: startY, endX: currentX, endY: currentY }; } drawShape(drawingCtx, tempData); } }
function redrawAllDrawings() { if (!drawingCtx) return; savedDrawings.forEach(drawing => { drawShape(drawingCtx, drawing); }); }
function drawShape(ctx, drawingData) { ctx.beginPath(); ctx.strokeStyle = drawingData.color || DRAWING_COLOR; ctx.lineWidth = drawingData.width || DRAWING_LINE_WIDTH; const sx = drawingData.startX; const sy = drawingData.startY; const ex = drawingData.endX; const ey = drawingData.endY; const dx = ex - sx; const dy = ey - sy; switch (drawingData.type) { case 'arrow': drawArrow(ctx, sx, sy, ex, ey); break; case 'circle': const radius = Math.sqrt(dx * dx + dy * dy); ctx.arc(sx, sy, radius, 0, 2 * Math.PI); break; case 'rect': ctx.rect(sx, sy, dx, dy); break; case 'freehand': if (drawingData.points && drawingData.points.length > 1) { ctx.moveTo(drawingData.points[0].x, drawingData.points[0].y); for (let i = 1; i < drawingData.points.length; i++) { ctx.lineTo(drawingData.points[i].x, drawingData.points[i].y); } } break; default: ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); } ctx.stroke(); }
function drawArrow(ctx, fromx, fromy, tox, toy) { ctx.moveTo(fromx, fromy); ctx.lineTo(tox, toy); const angle = Math.atan2(toy - fromy, tox - fromx); ctx.lineTo(tox - ARROWHEAD_LENGTH * Math.cos(angle - ARROWHEAD_ANGLE), toy - ARROWHEAD_LENGTH * Math.sin(angle - ARROWHEAD_ANGLE)); ctx.moveTo(tox, toy); ctx.lineTo(tox - ARROWHEAD_LENGTH * Math.cos(angle + ARROWHEAD_ANGLE), toy - ARROWHEAD_LENGTH * Math.sin(angle + ARROWHEAD_ANGLE)); }
function getCanvasCoordinates(event) { if (!drawingCanvas) return { x: 0, y: 0 }; const rect = drawingCanvas.getBoundingClientRect(); let clientX, clientY; if (event.touches && event.touches.length > 0) { clientX = event.touches[0].clientX; clientY = event.touches[0].clientY; } else { clientX = event.clientX; clientY = event.clientY; } const scaleX = (rect.width > 0) ? drawingCanvas.width / rect.width : 1; const scaleY = (rect.height > 0) ? drawingCanvas.height / rect.height : 1; const x = (clientX - rect.left) * scaleX; const y = (clientY - rect.top) * scaleY; return { x, y }; }
function clearDrawings() { if (confirm("Er du sikker på at du vil slette alle tegninger?")) { savedDrawings = []; clearDrawingCanvas(); console.log("Alle tegninger slettet."); redrawCanvas(); } }
function clearDrawingCanvas() { if (drawingCtx && drawingCanvas) { drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); } else { console.error("clearDrawingCanvas: Context eller Canvas mangler."); } }
function setupDrawingCanvas() { if (!drawingCanvas) { console.error("setupDrawingCanvas: Finner ikke canvas-elementet!"); return; } const currentWidth = drawingCanvas.offsetWidth; const currentHeight = drawingCanvas.offsetHeight; if (currentWidth > 0 && currentHeight > 0) { if (drawingCanvas.width !== currentWidth || drawingCanvas.height !== currentHeight) { drawingCanvas.width = currentWidth; drawingCanvas.height = currentHeight; console.log(`Drawing canvas size set to: ${drawingCanvas.width}x${drawingCanvas.height}`); } } else { console.warn("setupDrawingCanvas: Canvas har 0 dimensjoner, venter."); return; } drawingCtx = drawingCanvas.getContext('2d'); if (!drawingCtx) { console.error("setupDrawingCanvas: Kunne ikke hente 2D context."); return; } drawingCtx.strokeStyle = currentDrawingColor; drawingCtx.lineWidth = DRAWING_LINE_WIDTH; drawingCtx.lineCap = 'round'; drawingCtx.lineJoin = 'round'; redrawAllDrawings(); }
function handleToolChange(selectedTool) { currentDrawingTool = selectedTool; console.log("Valgt tegneverktøy:", currentDrawingTool); drawToolButtons.forEach(button => { if (button.dataset.tool === selectedTool) { button.classList.add('active'); } else { button.classList.remove('active'); } }); }
function handleColorChange(event) { currentDrawingColor = event.target.value; console.log("Valgt tegnefarge:", currentDrawingColor); if (drawingCtx) { drawingCtx.strokeStyle = currentDrawingColor; } }
function toggleDrawingVisibility() { if (!drawingCanvas || !toggleVisibilityButton) return; isDrawingVisible = !isDrawingVisible; if (isDrawingVisible) { drawingCanvas.style.visibility = 'visible'; toggleVisibilityButton.textContent = 'Skjul Tegn.'; console.log("Tegninger Vises"); } else { drawingCanvas.style.visibility = 'hidden'; toggleVisibilityButton.textContent = 'Vis Tegn.'; console.log("Tegninger Skjules"); } }
function undoLastDrawing() { if (savedDrawings.length > 0) { savedDrawings.pop(); redrawCanvas(); console.log("Siste tegning angret."); } else { console.log("Ingen tegninger å angre."); } }
// === 6. Formasjons- og Tegnehåndtering END ===

// === 7. Drag and Drop & Valg/Farge/UI Toggles START ===
function addDragListenersToSquadItems() { if (!squadListElement) return; const items = squadListElement.querySelectorAll('.squad-player-item.draggable'); items.forEach(item => { item.removeEventListener('dragstart', handleDragStart); item.addEventListener('dragstart', handleDragStart); item.removeEventListener('dragend', handleDragEnd); item.addEventListener('dragend', handleDragEnd); }); }
function addDragListenersToBenchItems() { if (!benchListElement) return; const items = benchListElement.querySelectorAll('.bench-player-item.draggable'); items.forEach(item => { item.removeEventListener('dragstart', handleDragStartBench); item.addEventListener('dragstart', handleDragStartBench); item.removeEventListener('dragend', handleDragEnd); item.addEventListener('dragend', handleDragEnd); }); }
function handleDragStart(event) { draggedPlayerId = event.target.getAttribute('data-player-id'); const player = getPlayerById(draggedPlayerId); if (!player) { event.preventDefault(); return; } draggedElement = event.target; dragSource = 'squad'; try { event.dataTransfer.setData('text/plain', draggedPlayerId); } catch (e) { event.preventDefault(); return; } event.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0); }
function handleDragStartBench(event) { draggedPlayerId = event.target.getAttribute('data-player-id'); if (!getPlayerById(draggedPlayerId)) { event.preventDefault(); return; } draggedElement = event.target; dragSource = 'bench'; event.dataTransfer.setData('text/plain', draggedPlayerId); event.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if(draggedElement) draggedElement.classList.add('dragging') }, 0); }
function handleDragStartPiece(event) { const pieceElement = event.target.closest('.player-piece'); if (!pieceElement) return; if (!pieceElement.hasAttribute('draggable') || pieceElement.getAttribute('draggable') === 'false') { event.preventDefault(); return; } draggedPlayerId = pieceElement.getAttribute('data-player-id'); if (!getPlayerById(draggedPlayerId)) { event.preventDefault(); return; } draggedElement = pieceElement; dragSource = 'pitch'; try { event.dataTransfer.setData('text/plain', draggedPlayerId); event.dataTransfer.effectAllowed = 'move'; draggedElement.classList.add('dragging'); } catch(e) { event.preventDefault(); } event.stopPropagation(); }
function handleDragStartOnPitchList(event) { const listItem = event.target; draggedPlayerId = listItem.getAttribute('data-player-id'); const player = getPlayerById(draggedPlayerId); if (!player) { console.error("handleDragStartOnPitchList: Fant ikke spiller ID:", draggedPlayerId); event.preventDefault(); return; } console.log(`handleDragStartOnPitchList: Starter drag for spiller ${draggedPlayerId} fra 'På Banen'-listen`); draggedElement = listItem; dragSource = 'onpitch-list'; try { event.dataTransfer.setData('text/plain', draggedPlayerId); event.dataTransfer.effectAllowed = 'move'; } catch (e) { console.error("handleDragStartOnPitchList: Feil ved setData:", e); event.preventDefault(); } }
function handleBallDragStart(event) { try { event.dataTransfer.setData('text/x-dragged-item', 'ball'); dragSource = 'ball'; draggedElement = event.target; event.dataTransfer.effectAllowed = 'move'; event.target.classList.add('dragging'); } catch (e) { event.preventDefault(); } }
function handleDragOver(event, targetType) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; let targetElement; if (targetType === 'pitch') targetElement = pitchElement; else if (targetType === 'bench') targetElement = benchElement; else if (targetType === 'squad') targetElement = squadListContainer; else if (targetType === 'onpitch-list') targetElement = onPitchSectionElement; else if (targetType === 'formation-marker') targetElement = event.target.closest('.formation-position-marker'); if(targetElement) targetElement.classList.add('drag-over'); }
function handleDragLeave(event, targetType) { const relatedTarget = event.relatedTarget; let targetElement; if (targetType === 'pitch') targetElement = pitchElement; else if (targetType === 'bench') targetElement = benchElement; else if (targetType === 'squad') targetElement = squadListContainer; else if (targetType === 'onpitch-list') targetElement = onPitchSectionElement; else if (targetType === 'formation-marker') targetElement = event.target.closest('.formation-position-marker'); if (!targetElement) return; if (!relatedTarget || !targetElement.contains(relatedTarget)) { targetElement.classList.remove('drag-over'); } }
function handleDropOnPitch(event) { event.preventDefault(); if (pitchElement) pitchElement.classList.remove('drag-over'); const pitchRect = pitchElement.getBoundingClientRect(); if (!pitchRect || pitchRect.width === 0 || pitchRect.height === 0) { resetDragState(); return; } const dropX_viewport = event.clientX; const dropY_viewport = event.clientY; let dropX_relative = dropX_viewport - pitchRect.left; let dropY_relative = dropY_viewport - pitchRect.top; let xPercent, yPercent; if (isPitchRotated) { xPercent = (dropY_relative / pitchRect.height) * 100; yPercent = (1 - (dropX_relative / pitchRect.width)) * 100; } else { xPercent = (dropX_relative / pitchRect.width) * 100; yPercent = (dropY_relative / pitchRect.height) * 100; } xPercent = Math.max(0, Math.min(100, xPercent)); yPercent = Math.max(0, Math.min(100, yPercent)); const draggedItemType = event.dataTransfer.getData('text/x-dragged-item'); if (draggedItemType === 'ball') { updateBallPosition(xPercent, yPercent); ballSettings.position = {x: xPercent, y: yPercent}; saveCurrentState(); resetDragState(); return; } let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { resetDragState(); return; } if (!playerId) { resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { resetDragState(); return; } if ((dragSource === 'squad' || dragSource === 'bench') && Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) { alert(`Maks ${MAX_PLAYERS_ON_PITCH} spillere på banen.`); resetDragState(); return; } player.position = { x: xPercent, y: yPercent }; let stateChanged = false; if (playersOnPitch[playerId]) { const piece = playersOnPitch[playerId]; piece.style.left = `${xPercent}%`; piece.style.top = `${yPercent}%`; stateChanged = true; } else { const newPiece = createPlayerPieceElement(player, xPercent, yPercent); if (pitchSurface) pitchSurface.appendChild(newPiece); else console.error("FEIL: pitchSurface ikke funnet!"); playersOnPitch[playerId] = newPiece; if (dragSource === 'bench') { const benchIndex = playersOnBench.indexOf(playerId); if (benchIndex > -1) playersOnBench.splice(benchIndex, 1); } stateChanged = true; } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState(); }
function handleDropOnOnPitchList(event) { event.preventDefault(); if (onPitchSectionElement) onPitchSectionElement.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; } if (!playerId) { console.warn("Drop on OnPitchList: Mottok tom playerId."); resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on OnPitchList: Fant ikke spiller ID:", playerId); resetDragState(); return; } if (playersOnPitch[playerId]) { console.log(`DropOnOnPitchList: Spiller ${playerId} er allerede på banen.`); resetDragState(); return; } if (Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) { alert(`Kan ikke legge til flere spillere på banen (maks ${MAX_PLAYERS_ON_PITCH}).`); resetDragState(); return; } let stateChanged = false; if (dragSource === 'bench' || dragSource === 'squad') { console.log(`Flytter spiller ${playerId} fra ${dragSource} til banen (via liste)`); const defaultX = 50; const defaultY = 50; player.position = { x: defaultX, y: defaultY }; const newPiece = createPlayerPieceElement(player, defaultX, defaultY); if (pitchSurface) { pitchSurface.appendChild(newPiece); playersOnPitch[playerId] = newPiece; stateChanged = true; if (dragSource === 'bench') { const benchIndex = playersOnBench.indexOf(playerId); if (benchIndex > -1) { playersOnBench.splice(benchIndex, 1); } } } else { console.error("FEIL: pitchSurface ikke funnet ved plassering fra liste!"); } } else { console.log(`DropOnOnPitchList: Ignorerer drag fra kilde: ${dragSource}`); } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState(); }
function handleDropOnBench(event) { event.preventDefault(); if (benchElement) benchElement.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; } if (!playerId) { console.warn("Drop on Bench: Mottok tom playerId."); resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on Bench: Fant ikke spiller ID:", playerId); resetDragState(); return; } let stateChanged = false; if (dragSource === 'pitch' || dragSource === 'onpitch-list') { if (!playersOnBench.includes(playerId)) { playersOnBench.push(playerId); stateChanged = true; } if (playersOnPitch[playerId]) { console.log(`Flytter spiller ${playerId} fra bane (via ${dragSource}) til benk.`); playersOnPitch[playerId].remove(); delete playersOnPitch[playerId]; stateChanged = true; } else { console.warn(`DropOnBench: Spiller ${playerId} dratt fra ${dragSource}, men ikke funnet i playersOnPitch.`); } } else if (dragSource === 'squad') { if (!playersOnBench.includes(playerId)) { console.log(`Flytter spiller ${playerId} fra tropp til benk.`); playersOnBench.push(playerId); stateChanged = true; } else { console.log(`DropOnBench: Spiller ${playerId} er allerede på benken.`); } } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState(); }
function handleDropOnSquadList(event) { event.preventDefault(); if (squadListContainer) squadListContainer.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; } if (!playerId) { console.warn("Drop on Squad List: Mottok tom playerId."); resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on Squad List: Fant ikke spiller ID:", playerId); resetDragState(); return; } let stateChanged = false; if (dragSource === 'pitch' || dragSource === 'onpitch-list') { if (playersOnPitch[playerId]) { console.log(`Flytter spiller ${playerId} fra bane (via ${dragSource}) til tilgjengelig tropp.`); playersOnPitch[playerId].remove(); delete playersOnPitch[playerId]; stateChanged = true; } else { console.warn(`DropOnSquadList: Spiller ${playerId} dratt fra ${dragSource}, men ikke funnet i playersOnPitch.`); } } else if (dragSource === 'bench') { const benchIndex = playersOnBench.indexOf(playerId); if (benchIndex > -1) { console.log(`Flytter spiller ${playerId} fra benk til tilgjengelig tropp.`); playersOnBench.splice(benchIndex, 1); stateChanged = true; } } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState(); }
function handleDropOnFormationMarker(event, positionData) { event.preventDefault(); const markerElement = event.target.closest('.formation-position-marker'); if (markerElement) markerElement.classList.remove('drag-over'); let playerId; try { playerId = event.dataTransfer.getData('text/plain'); } catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; } if (!playerId) { console.warn("Drop on FormationMarker: Mottok tom playerId."); resetDragState(); return; } const player = getPlayerById(playerId); if (!player) { console.error("Drop on FormationMarker: Fant ikke spiller ID:", playerId); resetDragState(); return; } const targetX = positionData.x; const targetY = positionData.y; console.log(`Slipper spiller ${playerId} (${dragSource}) på posisjon ${positionData.id} (${targetX}%, ${targetY}%)`); if (!playersOnPitch[playerId] && Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) { alert(`Kan ikke legge til flere spillere på banen (maks ${MAX_PLAYERS_ON_PITCH}).`); resetDragState(); return; } let stateChanged = false; player.position = { x: targetX, y: targetY }; if (playersOnPitch[playerId]) { console.log(` - Flytter eksisterende brikke for ${playerId}`); const piece = playersOnPitch[playerId]; piece.style.left = `${targetX}%`; piece.style.top = `${targetY}%`; stateChanged = true; } else { console.log(` - Oppretter ny brikke for ${playerId}`); const newPiece = createPlayerPieceElement(player, targetX, targetY); if (pitchSurface) { pitchSurface.appendChild(newPiece); playersOnPitch[playerId] = newPiece; stateChanged = true; } else { console.error("FEIL: pitchSurface ikke funnet ved slipp på markør!"); resetDragState(); return; } } if (dragSource === 'bench') { const benchIndex = playersOnBench.indexOf(playerId); if (benchIndex > -1) { console.log(` - Fjerner ${playerId} fra benken.`); playersOnBench.splice(benchIndex, 1); stateChanged = true; } } if (stateChanged) { saveCurrentState(); renderUI(); } resetDragState(); }
function handleDragEnd(event) { const draggedElementTarget = event.target; setTimeout(() => { if(pitchElement) pitchElement.classList.remove('drag-over'); if(benchElement) benchElement.classList.remove('drag-over'); if(squadListContainer) squadListContainer.classList.remove('drag-over'); if(onPitchSectionElement) onPitchSectionElement.classList.remove('drag-over'); const markers = pitchSurface?.querySelectorAll('.formation-position-marker'); markers?.forEach(m => m.classList.remove('drag-over')); if (draggedElementTarget && draggedElementTarget.classList.contains('dragging')) { draggedElementTarget.classList.remove('dragging'); } }, 0); }
function resetDragState() { draggedPlayerId = null; draggedElement = null; dragSource = null; }
function handlePlayerPieceClick(event) { const pieceElement = event.currentTarget; const playerId = pieceElement.getAttribute('data-player-id'); if (selectedPlayerIds.has(playerId)) { selectedPlayerIds.delete(playerId); pieceElement.classList.remove('selected'); } else { selectedPlayerIds.add(playerId); pieceElement.classList.add('selected'); } }
function clearPlayerSelection() { selectedPlayerIds.forEach(id => { const piece = playersOnPitch[id]; if (piece) { piece.classList.remove('selected'); } }); selectedPlayerIds.clear(); }
function applyBorderColorToSelection(color) { if (selectedPlayerIds.size === 0) { alert("Ingen spillere valgt."); return; } let stateChanged = false; selectedPlayerIds.forEach(playerId => { const player = getPlayerById(playerId); const piece = playersOnPitch[playerId]; if (player && piece) { if (player.borderColor !== color) { player.borderColor = color; const imgContainer = piece.querySelector('.player-image-container'); if (imgContainer) imgContainer.style.borderColor = color; stateChanged = true; } } }); if (stateChanged) saveCurrentState(); clearPlayerSelection(); }
function handleSetSelectedPlayerBorderColor() { applyBorderColorToSelection(playerBorderColorInput.value); }
function toggleSidebar() { isSidebarHidden = !isSidebarHidden; if (appContainer) { appContainer.classList.toggle('sidebar-hidden', isSidebarHidden); if (toggleSidebarButton) { toggleSidebarButton.innerHTML = isSidebarHidden ? '>' : '<'; } } }
function togglePitchRotation() { isPitchRotated = !isPitchRotated; if (!pitchContainer || !pitchElement) return; pitchContainer.classList.toggle('rotated', isPitchRotated); resizePitchElement(); saveCurrentState(); }
function switchView(viewName) {
    if (!appContainer || !navTacticsButton || !navSquadButton || !navMatchesButton) {
        console.error("switchView: Nødvendige navigasjonsknapper ikke funnet.");
        return;
    }
    appContainer.classList.remove('view-tactics', 'view-squad', 'view-matches');
    navTacticsButton.classList.remove('active');
    navSquadButton.classList.remove('active');
    navMatchesButton.classList.remove('active');

    if (viewName === 'tactics') {
        appContainer.classList.add('view-tactics');
        navTacticsButton.classList.add('active');
        resizePitchElement();
    } else if (viewName === 'squad') {
        appContainer.classList.add('view-squad');
        navSquadButton.classList.add('active');
        renderFullSquadList();
    } else if (viewName === 'matches') {
        appContainer.classList.add('view-matches');
        navMatchesButton.classList.add('active');
        renderMatchList();
    } else {
        console.warn(`Ukjent viewName: ${viewName}. Viser taktikksiden som default.`);
        appContainer.classList.add('view-tactics');
        navTacticsButton.classList.add('active');
        resizePitchElement();
    }
    console.log(`Byttet til view: ${viewName}`);
}
function toggleFullscreen() { const elem = appContainer; if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { console.log("Går inn i fullskjerm..."); if (elem.requestFullscreen) { elem.requestFullscreen(); } else if (elem.mozRequestFullScreen) { elem.mozRequestFullScreen(); } else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); } else if (elem.msRequestFullscreen) { elem.msRequestFullscreen(); } if (fullscreenButton) fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>'; } else { console.log("Avslutter fullskjerm..."); if (document.exitFullscreen) { document.exitFullscreen(); } else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); } else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); } else if (document.msExitFullscreen) { document.msExitFullscreen(); } if (fullscreenButton) fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>'; } }
// === 7. Drag and Drop & Valg/Farge/UI Toggles END ===

// === 8. Lokal Lagring START ===
function saveSquad() { try { const squadToSave = squad.map(player => { const { imageBlob, ...rest } = player; return rest; }); localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(squadToSave)); } catch (e) { console.error("Feil ved lagring av tropp til localStorage:", e); } }
function loadSquad() { const savedSquadJson = localStorage.getItem(STORAGE_KEY_SQUAD); if (savedSquadJson) { try { const parsedSquad = JSON.parse(savedSquadJson); squad = parsedSquad.map(player => ({ ...player, nickname: player.nickname || '', imageUrl: player.imageUrl || '', imageKey: player.imageKey || null, personalInfo: player.personalInfo || { birthday: '', phone: '', email: '' }, matchStats: player.matchStats || { matchesPlayed: 0, goalsScored: 0 }, comments: player.comments || [], borderColor: player.borderColor || 'black', position: player.position || { x: 50, y: 50 }, mainRole: player.mainRole || '', playableRoles: player.playableRoles || [], status: player.status || DEFAULT_PLAYER_STATUS })); const maxId = squad.reduce((max, p) => { const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0; return Math.max(max, !isNaN(idNum) ? idNum : 0); }, 0); nextPlayerId = maxId + 1; return true; } catch (e) { console.error("Feil ved parsing av tropp fra localStorage:", e); squad = []; localStorage.removeItem(STORAGE_KEY_SQUAD); return false; } } squad = []; return false; }
function getCurrentStateData() { const playersOnPitchData = {}; for (const playerId in playersOnPitch) { const player = getPlayerById(playerId); if (player && player.position && typeof player.position.x === 'number' && typeof player.position.y === 'number') { playersOnPitchData[playerId] = { x: player.position.x, y: player.position.y, borderColor: player.borderColor || 'black' }; } else if (player) { playersOnPitchData[playerId] = { x: 50, y: 50, borderColor: player.borderColor || 'black' }; } } return { playersOnPitchData: playersOnPitchData, playersOnBenchIds: [...playersOnBench], isPitchRotated: isPitchRotated, ballPosition: ballSettings.position, ballSettings: { size: ballSettings.size, style: ballSettings.style, color: ballSettings.color } }; }
function saveCurrentState() { try { const stateData = getCurrentStateData(); localStorage.setItem(STORAGE_KEY_LAST_STATE, JSON.stringify(stateData)); } catch (e) { console.error("Feil ved lagring av state:", e); } }
function applyState(stateData) { if (!stateData) return; clearPitch(); playersOnPitch = {}; playersOnBench = []; isPitchRotated = stateData.isPitchRotated || false; if (stateData.ballSettings) { ballSettings.size = stateData.ballSettings.size || 35; ballSettings.style = stateData.ballSettings.style || 'default'; ballSettings.color = stateData.ballSettings.color || '#FFA500'; } applyBallStyle(); if (stateData.ballPosition && typeof stateData.ballPosition.x === 'number' && typeof stateData.ballPosition.y === 'number') { ballSettings.position = stateData.ballPosition; updateBallPosition(stateData.ballPosition.x, stateData.ballPosition.y); } else { ballSettings.position = {x: 50, y: 50}; updateBallPosition(50, 50); } if (pitchContainer) { pitchContainer.classList.toggle('rotated', isPitchRotated); resizePitchElement(); } if (stateData.playersOnPitchData) { for (const playerId in stateData.playersOnPitchData) { const player = getPlayerById(playerId); const positionData = stateData.playersOnPitchData[playerId]; if (player && positionData && typeof positionData.x === 'number' && typeof positionData.y === 'number') { player.position = { x: positionData.x, y: positionData.y }; player.borderColor = positionData.borderColor || 'black'; const piece = createPlayerPieceElement(player, player.position.x, player.position.y); if(pitchSurface) pitchSurface.appendChild(piece); else console.error("FEIL: pitchSurface ikke funnet!"); playersOnPitch[playerId] = piece; } } } if (stateData.playersOnBenchIds) { playersOnBench = stateData.playersOnBenchIds.filter(id => getPlayerById(id)); } renderUI(); redrawAllDrawings(); }
function resizePitchElement() { if (!pitchContainer || !pitchElement) { console.error("resizePitchElement: pitchContainer or pitchElement not found!"); return; } const containerWidth = pitchContainer.clientWidth; const containerHeight = pitchContainer.clientHeight; let targetWidth, targetHeight; if (isPitchRotated) { const currentAR = PITCH_ASPECT_RATIO_LANDSCAPE; const heightFromWidth = containerWidth / currentAR; const widthFromHeight = containerHeight * currentAR; if (heightFromWidth <= containerHeight) { targetWidth = containerWidth; targetHeight = heightFromWidth; } else { targetWidth = widthFromHeight; targetHeight = containerHeight; } pitchElement.style.width = `${targetHeight}px`; pitchElement.style.height = `${targetWidth}px`; } else { const currentAR = PITCH_ASPECT_RATIO_PORTRAIT; const widthFromHeight = containerHeight * currentAR; const heightFromWidth = containerWidth / currentAR; if (widthFromHeight <= containerWidth) { targetWidth = widthFromHeight; targetHeight = containerHeight; } else { targetWidth = containerWidth; targetHeight = heightFromWidth; } pitchElement.style.width = `${targetWidth}px`; pitchElement.style.height = `${targetHeight}px`; } setupDrawingCanvas(); }
function loadLastState() { const savedState = localStorage.getItem(STORAGE_KEY_LAST_STATE); let stateData = {}; if (savedState) { try { stateData = JSON.parse(savedState); } catch (e) { console.error("Feil ved parsing av state:", e); } } ballSettings = { size: 35, style: 'default', color: '#FFA500', position: {x: 50, y: 50}, ...(stateData.ballSettings || {}) }; ballSettings.position = stateData.ballPosition || ballSettings.position; applyState(stateData); }
function clearPitch() { if (!pitchSurface) { console.error("clearPitch: pitchSurface ikke funnet!"); return; } const pieces = pitchSurface.querySelectorAll('.player-piece'); pieces.forEach(piece => piece.remove()); }
function getSavedSetups() { const setupsJson = localStorage.getItem(STORAGE_KEY_SETUPS); if (setupsJson) { try { return JSON.parse(setupsJson); } catch (e) { return {}; } } return {}; }
function handleSaveSetup() { if(!setupNameInput || !loadSetupSelect) return; const name = setupNameInput.value.trim(); if (!name) { alert("Skriv inn navn."); return; } const currentSetups = getSavedSetups(); const currentState = getCurrentStateData(); currentSetups[name] = currentState; try { localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(currentSetups)); alert(`Oppsett "${name}" lagret!`); populateSetupDropdown(); setupNameInput.value = ''; } catch (e) { alert("Kunne ikke lagre."); } }
function handleLoadSetup() { if(!loadSetupSelect) return; const selectedName = loadSetupSelect.value; if (!selectedName) { alert("Velg oppsett."); return; } const savedSetups = getSavedSetups(); const setupToLoad = savedSetups[selectedName]; if (setupToLoad) { applyState(setupToLoad); alert(`Oppsett "${selectedName}" lastet!`); saveCurrentState(); } else { alert(`Fant ikke "${selectedName}".`); } }
function handleDeleteSetup() { if(!loadSetupSelect) return; const selectedName = loadSetupSelect.value; if (!selectedName) { alert("Velg oppsett."); return; } const savedSetups = getSavedSetups(); if (savedSetups[selectedName]) { if (confirm(`Slette "${selectedName}"?`)) { delete savedSetups[selectedName]; try { localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(savedSetups)); alert(`Oppsett "${selectedName}" slettet.`); populateSetupDropdown(); } catch (e) { alert("Kunne ikke slette."); } } } else { alert(`Fant ikke "${selectedName}".`); } }
function populateSetupDropdown() { if (!loadSetupSelect) return; const savedSetups = getSavedSetups(); const setupNames = Object.keys(savedSetups); loadSetupSelect.innerHTML = '<option value="">Velg oppsett...</option>'; setupNames.sort(); setupNames.forEach(name => { const option = document.createElement('option'); option.value = name; option.textContent = name; loadSetupSelect.appendChild(option); }); }
// === 8. Lokal Lagring END ===

// === 9. Eksport START ===
function handleExportPNG() { if (!pitchElement) { console.error("handleExportPNG: Finner ikke pitch-elementet."); alert("Kunne ikke eksportere bilde: Banen ble ikke funnet."); return; } if (typeof html2canvas === 'undefined') { console.error("handleExportPNG: html2canvas biblioteket er ikke lastet."); alert("Kunne ikke eksportere bilde: Nødvendig bibliotek mangler."); return; } console.log("Starter eksport til PNG..."); const originalPitchBorder = pitchElement.style.border; const originalPitchBoxShadow = pitchElement.style.boxShadow; pitchElement.style.border = 'none'; pitchElement.style.boxShadow = 'none'; html2canvas(pitchElement, { useCORS: true, allowTaint: true, backgroundColor: null, scale: 2, logging: false }).then(canvas => { pitchElement.style.border = originalPitchBorder; pitchElement.style.boxShadow = originalPitchBoxShadow; const link = document.createElement('a'); link.download = 'fotballtaktiker_bane.png'; link.href = canvas.toDataURL('image/png'); link.click(); console.log("PNG-eksport fullført."); }).catch(error => { pitchElement.style.border = originalPitchBorder; pitchElement.style.boxShadow = originalPitchBoxShadow; console.error("Feil under PNG-eksport:", error); alert("En feil oppstod under generering av skjermbilde."); }); }
// === 9. Eksport END ===

// === 10. Event Listeners START ===
document.addEventListener('DOMContentLoaded', async () => {
    appContainer = document.querySelector('.app-container'); sidebar = document.querySelector('.sidebar'); toggleSidebarButton = document.getElementById('toggle-sidebar-button'); onPitchListElement = document.getElementById('on-pitch-list'); benchListElement = document.getElementById('bench-list'); squadListElement = document.getElementById('squad-list'); squadListContainer = document.getElementById('squad-list-container'); onPitchCountElement = document.getElementById('on-pitch-count'); onBenchCountElement = document.getElementById('on-bench-count'); pitchElement = document.getElementById('pitch'); pitchSurface = document.getElementById('pitch-surface'); rotatePitchButton = document.getElementById('rotate-pitch-button'); addPlayerButton = document.getElementById('add-player-button'); playerBorderColorInput = document.getElementById('player-border-color'); setBorderColorButton = document.getElementById('set-border-color-button'); setColorRedButton = document.getElementById('set-color-red'); setColorYellowButton = document.getElementById('set-color-yellow'); setColorGreenButton = document.getElementById('set-color-green'); setColorDefaultButton = document.getElementById('set-color-default'); toggleDrawModeButton = document.getElementById('toggle-draw-mode-button'); clearDrawingsButton = document.getElementById('clear-drawings-button'); setupNameInput = document.getElementById('setup-name'); saveSetupButton = document.getElementById('save-setup-button'); loadSetupSelect = document.getElementById('load-setup-select'); loadSetupButton = document.getElementById('load-setup-button'); deleteSetupButton = document.getElementById('delete-setup-button'); exportPngButton = document.getElementById('export-png-button'); pitchContainer = document.getElementById('pitch-container'); drawingCanvas = document.getElementById('drawing-canvas'); ballElement = document.getElementById('ball'); navTacticsButton = document.getElementById('nav-tactics-button'); navSquadButton = document.getElementById('nav-squad-button'); tacticsPageContent = document.getElementById('tactics-page-content'); squadPageContent = document.getElementById('squad-page-content'); fullSquadListContainer = document.getElementById('full-squad-list-container'); onPitchSectionElement = document.getElementById('on-pitch-section'); formationSelect = document.getElementById('formation-select'); addPlayerModal = document.getElementById('add-player-modal'); closeButton = addPlayerModal ? addPlayerModal.querySelector('.close-button') : null; newPlayerNameInput = document.getElementById('new-player-name'); newPlayerImageUpload = document.getElementById('new-player-image-upload'); newPlayerImageUrlInput = document.getElementById('new-player-image-url'); newPlayerMainRoleInput = document.getElementById('new-player-main-role'); confirmAddPlayerButton = document.getElementById('confirm-add-player'); playerDetailModal = document.getElementById('player-detail-modal'); ballSettingsModal = document.getElementById('ball-settings-modal'); benchElement = document.getElementById('bench'); squadManagementSection = document.getElementById('squad-management');
    drawToolButtons = document.querySelectorAll('.draw-tool-button'); drawingColorInput = document.getElementById('drawing-color'); toggleVisibilityButton = document.getElementById('toggle-visibility-button');
    undoDrawingButton = document.getElementById('undo-drawing-button');
    fullscreenButton = document.getElementById('fullscreen-button');
    detailModalTabButtons = playerDetailModal.querySelectorAll('.tab-button');
    detailPlayerImageUpload = document.getElementById('detail-player-image-upload');

    navMatchesButton = document.getElementById('nav-matches-button');
    matchesPageContent = document.getElementById('matches-page-content');
    addNewMatchButton = document.getElementById('add-new-match-button');
    matchListContainer = document.getElementById('match-list-container');
    addMatchModal = document.getElementById('add-match-modal');
    if (addMatchModal) {
        closeAddMatchModalButton = addMatchModal.querySelector('.close-add-match-modal-button');
        confirmAddMatchButton = addMatchModal.querySelector('#confirm-add-match-button');
    } else {
        console.error("DOMContentLoaded: addMatchModal ble ikke funnet!");
    }
    activeMatchSelect = document.getElementById('active-match-select');
    matchPreparationSection = document.getElementById('match-preparation-section');

    try {
        await initDB();
        console.log("Database initialisert.");
        loadSquad();
        loadMatches();
        loadLastState();
        populateSetupDropdown();
        populateActiveMatchDropdown();
        setupDrawingCanvas();
        renderMatchList();
    } catch (error) {
        console.error("Feil under initialisering:", error);
        alert("En feil oppstod under lasting av applikasjonen. Sjekk konsollen for detaljer.");
    }

    if (addPlayerButton) addPlayerButton.addEventListener('click', openAddPlayerModal); if (closeButton) closeButton.addEventListener('click', closeAddPlayerModal); if (confirmAddPlayerButton) confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm); const detailModalCloseBtn = playerDetailModal ? playerDetailModal.querySelector('.close-detail-button') : null; const detailModalSaveBtn = playerDetailModal ? playerDetailModal.querySelector('#save-details-button') : null; const detailModalAddCommentBtn = playerDetailModal ? playerDetailModal.querySelector('#add-comment-to-history-button') : null; if (detailModalCloseBtn) detailModalCloseBtn.addEventListener('click', closePlayerDetailModal); if (detailModalSaveBtn) detailModalSaveBtn.addEventListener('click', handleSavePlayerDetails); if (detailModalAddCommentBtn) detailModalAddCommentBtn.addEventListener('click', handleAddCommentToHistory); if (ballElement) ballElement.addEventListener('dblclick', openBallSettingsModal); if (ballSettingsModal) { const closeBallBtn = ballSettingsModal.querySelector('.close-ball-settings-button'); const saveBallBtn = ballSettingsModal.querySelector('#save-ball-settings-button'); const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider'); if (closeBallBtn) closeBallBtn.addEventListener('click', closeBallSettingsModal); if (saveBallBtn) saveBallBtn.addEventListener('click', handleSaveBallSettings); if (sizeSlider) sizeSlider.addEventListener('input', handleBallSizeChange); window.addEventListener('click', (event) => { if (event.target === ballSettingsModal) closeBallSettingsModal(); }); }
    window.addEventListener('click', (event) => { if (addPlayerModal && event.target === addPlayerModal) closeAddPlayerModal(); if (playerDetailModal && event.target === playerDetailModal) closePlayerDetailModal(); if (ballSettingsModal && event.target === ballSettingsModal) closeBallSettingsModal(); if (addMatchModal && event.target === addMatchModal) closeAddMatchModal(); if (!event.target.closest('.player-piece') && !event.target.closest('.preset-color-button') && !event.target.closest('#player-border-color') && !event.target.closest('#set-border-color-button') && selectedPlayerIds.size > 0) { clearPlayerSelection(); } if (!event.target.closest('.formation-position-marker')) { if (selectedFormationPosition) { resetPositionFilter(); } } });
    if (pitchElement) { pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch')); pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch')); pitchElement.addEventListener('drop', handleDropOnPitch); } if (benchElement) { benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench')); benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench')); benchElement.addEventListener('drop', handleDropOnBench); } if (squadListContainer) { squadListContainer.addEventListener('dragover', (e) => handleDragOver(e, 'squad')); squadListContainer.addEventListener('dragleave', (e) => handleDragLeave(e, 'squad')); squadListContainer.addEventListener('drop', handleDropOnSquadList); } if (ballElement) { ballElement.addEventListener('dragstart', handleBallDragStart); ballElement.addEventListener('dragend', handleDragEnd); } if (onPitchSectionElement) { onPitchSectionElement.addEventListener('dragover', (e) => handleDragOver(e, 'onpitch-list')); onPitchSectionElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'onpitch-list')); onPitchSectionElement.addEventListener('drop', handleDropOnOnPitchList); }
    if (toggleSidebarButton) toggleSidebarButton.addEventListener('click', toggleSidebar); if (rotatePitchButton) rotatePitchButton.addEventListener('click', togglePitchRotation); if (setBorderColorButton) setBorderColorButton.addEventListener('click', handleSetSelectedPlayerBorderColor); if(setColorRedButton) setColorRedButton.addEventListener('click', () => applyBorderColorToSelection('red')); if(setColorYellowButton) setColorYellowButton.addEventListener('click', () => applyBorderColorToSelection('yellow')); if(setColorGreenButton) setColorGreenButton.addEventListener('click', () => applyBorderColorToSelection('lime')); if(setColorDefaultButton) setColorDefaultButton.addEventListener('click', () => applyBorderColorToSelection('black')); if (saveSetupButton) saveSetupButton.addEventListener('click', handleSaveSetup); if (loadSetupButton) loadSetupButton.addEventListener('click', handleLoadSetup); if (deleteSetupButton) deleteSetupButton.addEventListener('click', handleDeleteSetup);
    if (navTacticsButton) navTacticsButton.addEventListener('click', () => switchView('tactics')); if (navSquadButton) navSquadButton.addEventListener('click', () => switchView('squad'));
    if (formationSelect) { formationSelect.addEventListener('change', handleFormationChange); } else { console.error("formationSelect ikke funnet!"); }
    if (drawToolButtons) { drawToolButtons.forEach(button => { button.addEventListener('click', () => handleToolChange(button.dataset.tool)); }); } else { console.error("drawToolButtons ikke funnet!"); }
    if (drawingColorInput) { drawingColorInput.addEventListener('input', handleColorChange); drawingColorInput.value = currentDrawingColor; } else { console.error("drawingColorInput ikke funnet!"); }
    if(toggleDrawModeButton) { toggleDrawModeButton.addEventListener('click', toggleDrawMode); } else { console.error("toggleDrawModeButton ikke funnet!"); }
    if(clearDrawingsButton) { clearDrawingsButton.addEventListener('click', clearDrawings); } else { console.error("clearDrawingsButton ikke funnet!"); }
    if (toggleVisibilityButton) { toggleVisibilityButton.addEventListener('click', toggleDrawingVisibility); } else { console.error("toggleVisibilityButton ikke funnet!"); }
    if (undoDrawingButton) { undoDrawingButton.addEventListener('click', undoLastDrawing); } else { console.error("undoDrawingButton ikke funnet!"); }
    if (exportPngButton) { exportPngButton.addEventListener('click', handleExportPNG); } else { console.error("exportPngButton ikke funnet!"); }
    if (fullscreenButton) { fullscreenButton.addEventListener('click', toggleFullscreen); } else { console.error("fullscreenButton ikke funnet!"); }
    if(detailPlayerImageUpload) { detailPlayerImageUpload.addEventListener('change', handleDetailImageUpload); } else { console.error("detailPlayerImageUpload ikke funnet!"); }

    if (navMatchesButton) navMatchesButton.addEventListener('click', () => switchView('matches'));
    if (addNewMatchButton) addNewMatchButton.addEventListener('click', openAddMatchModal);
    if (closeAddMatchModalButton) closeAddMatchModalButton.addEventListener('click', closeAddMatchModal);
    else if(addMatchModal) console.warn("DOMContentLoaded: closeAddMatchModalButton ikke funnet i addMatchModal.");

    if (confirmAddMatchButton) confirmAddMatchButton.addEventListener('click', handleAddMatchConfirm);
    else if(addMatchModal) console.warn("DOMContentLoaded: confirmAddMatchButton ikke funnet i addMatchModal.");

    if (activeMatchSelect) activeMatchSelect.addEventListener('change', handleActiveMatchChange);

    window.addEventListener('resize', () => { resizePitchElement(); });
    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 10. Event Listeners END ===
/* Version: #8 */
