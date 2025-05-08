/* Version: #153 */
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
// === 0. Globale Variabler og Konstanter END ===

// === 1. DOM Element Referanser START ===
let appContainer, sidebar, toggleSidebarButton, onPitchListElement, benchListElement, squadListElement, squadListContainer, onPitchCountElement, onBenchCountElement, pitchElement, pitchSurface, rotatePitchButton, addPlayerButton, playerBorderColorInput, setBorderColorButton, setColorRedButton, setColorYellowButton, setColorGreenButton, setColorDefaultButton, toggleDrawModeButton, clearDrawingsButton, setupNameInput, saveSetupButton, loadSetupSelect, loadSetupButton, deleteSetupButton, exportPngButton, pitchContainer, drawingCanvas, ballElement, navTacticsButton, navSquadButton, tacticsPageContent, squadPageContent, fullSquadListContainer, onPitchSectionElement, formationSelect, addPlayerModal, closeButton, newPlayerNameInput, newPlayerImageUpload, newPlayerImageUrlInput, newPlayerMainRoleInput, confirmAddPlayerButton, playerDetailModal, ballSettingsModal, benchElement, squadManagementSection, drawToolButtons, drawingColorInput, toggleVisibilityButton, undoDrawingButton, fullscreenButton, detailModalTabButtons; // Lagt til detailModalTabButtons
// === 1. DOM Element Referanser END ===

// === 2. Modal Håndtering START ===
function openModalTab(event, tabName) { let i, tabcontent, tablinks; tabcontent = playerDetailModal.getElementsByClassName("modal-tab-content"); for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; tabcontent[i].classList.remove("active"); } tablinks = playerDetailModal.getElementsByClassName("tab-button"); for (i = 0; i < tablinks.length; i++) { tablinks[i].classList.remove("active"); } const currentTabContent = document.getElementById(tabName); if (currentTabContent) { currentTabContent.style.display = "block"; currentTabContent.classList.add("active"); } if (event && event.currentTarget) { event.currentTarget.classList.add("active"); } else { const defaultButton = playerDetailModal.querySelector(`.tab-button[onclick*="'${tabName}'"]`); if(defaultButton) defaultButton.classList.add('active'); } }
function populateRolesCheckboxes(containerId, selectedRoles = []) { /* ... */ }
function populateStatusDropdown(selectElementId, currentStatusKey) { /* ... */ }
function openAddPlayerModal() { /* ... */ }
function closeAddPlayerModal() { /* ... */ }
function handleAddPlayerConfirm() { /* ... */ }
function openPlayerDetailModal(playerId) { const player = getPlayerById(playerId); const modalElement = document.getElementById('player-detail-modal'); if (!player || !modalElement) { console.error("Kan ikke åpne detaljer for spiller:", playerId); return; } player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' }; player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 }; player.comments = player.comments || []; player.nickname = player.nickname || ''; player.imageUrl = player.imageUrl || ''; player.mainRole = player.mainRole || ''; player.playableRoles = player.playableRoles || []; player.status = player.status || DEFAULT_PLAYER_STATUS; const detailIdInput = modalElement.querySelector('#detail-player-id'); const detailTitle = modalElement.querySelector('#detail-modal-title'); const detailNameInput = modalElement.querySelector('#detail-player-name'); const detailNicknameInput = modalElement.querySelector('#detail-player-nickname'); const detailImageUrlInput = modalElement.querySelector('#detail-player-image-url'); const detailImageDisplay = modalElement.querySelector('#detail-player-image-display'); const detailMainRoleInput = modalElement.querySelector('#detail-player-main-role'); const detailPlayerStatusSelect = modalElement.querySelector('#detail-player-status'); const detailBirthdayInput = modalElement.querySelector('#detail-player-birthday'); const detailPhoneInput = modalElement.querySelector('#detail-player-phone'); const detailEmailInput = modalElement.querySelector('#detail-player-email'); const detailMatchesPlayedInput = modalElement.querySelector('#detail-matches-played'); const detailGoalsScoredInput = modalElement.querySelector('#detail-goals-scored'); const detailCommentHistory = modalElement.querySelector('#detail-comment-history'); const detailMatchComment = modalElement.querySelector('#detail-match-comment'); if (!detailIdInput || !detailTitle || !detailNameInput || !detailNicknameInput || !detailImageUrlInput || !detailImageDisplay || !detailMainRoleInput || !detailPlayerStatusSelect || !detailBirthdayInput || !detailPhoneInput || !detailEmailInput || !detailMatchesPlayedInput || !detailGoalsScoredInput || !detailCommentHistory || !detailMatchComment) { console.error("Avbryter openPlayerDetailModal pga. manglende internt element."); return; } detailIdInput.value = player.id; detailTitle.textContent = `Detaljer for ${player.name}`; detailNameInput.value = player.name || ''; detailNicknameInput.value = player.nickname; detailMainRoleInput.value = player.mainRole || ''; detailImageUrlInput.value = player.imageUrl; if (player.imageUrl) { detailImageDisplay.style.backgroundImage = `url('${player.imageUrl}')`; detailImageDisplay.innerHTML = ''; } else { detailImageDisplay.style.backgroundImage = 'none'; detailImageDisplay.innerHTML = '<span>Ingen bilde-URL</span>'; } populateStatusDropdown('detail-player-status', player.status); detailBirthdayInput.value = player.personalInfo.birthday || ''; detailPhoneInput.value = player.personalInfo.phone || ''; detailEmailInput.value = player.personalInfo.email || ''; detailMatchesPlayedInput.value = player.matchStats.matchesPlayed || 0; detailGoalsScoredInput.value = player.matchStats.goalsScored || 0; populateRolesCheckboxes('detail-player-roles-checkboxes', player.playableRoles); renderCommentHistory(player.comments, detailCommentHistory); detailMatchComment.value = ''; modalElement.style.display = 'block'; const firstTabButton = modalElement.querySelector('.tab-button'); if (firstTabButton) { firstTabButton.click(); } else { openModalTab(null, 'info-tab'); } }
function renderCommentHistory(comments, historyDivElement) { /* ... */ }
function closePlayerDetailModal() { const modalElement = document.getElementById('player-detail-modal'); if (modalElement) { modalElement.style.display = 'none'; } }
function handleAddCommentToHistory() { /* ... */ }
function handleSavePlayerDetails() { /* ... */ }
function handleDeletePlayer(playerId, playerName) { /* ... */ }
function openBallSettingsModal() { /* ... */ }
function closeBallSettingsModal() { /* ... */ }
function handleBallSizeChange(event) { /* ... */ }
function handleSaveBallSettings() { /* ... */ }
// === 2. Modal Håndtering END ===

// === 3. UI Rendering START ===
function renderUI() { /* ... */ }
function renderOnPitchList() { /* ... */ }
function renderBench() { /* ... */ }
function renderSquadList() { /* ... */ }
function renderFullSquadList() { /* ... */ }
// === 3. UI Rendering END ===

// === 4. Spillerbrikke & Ball Håndtering START ===
function createPlayerPieceElement(player, xPercent, yPercent) { /* ... */ }
function getPlayerById(playerId) { /* ... */ }
function updateBallPosition(xPercent, yPercent) { /* ... */ }
function applyBallStyle() { /* ... */ }
// === 4. Spillerbrikke & Ball Håndtering END ===

// === 5. Formasjons- og Tegnehåndtering START ===
function handleFormationChange(event) { /* ... */ }
function clearFormationPositions() { /* ... */ }
function drawFormationPositions(formation) { /* ... */ }
function handlePositionMarkerClick(markerElement, positionData) { /* ... */ }
function clearSelectedPositionMarker() { /* ... */ }
function resetPositionFilter() { /* ... */ }
function toggleDrawMode() { /* ... */ }
function startDraw(event) { /* ... */ }
function draw(event) { /* ... */ }
function stopDraw(event) { /* ... */ }
function redrawCanvas() { /* ... */ }
function redrawAllDrawings() { /* ... */ }
function drawShape(ctx, drawingData) { /* ... */ }
function drawArrow(ctx, fromx, fromy, tox, toy) { /* ... */ }
function getCanvasCoordinates(event) { /* ... */ }
function clearDrawings() { /* ... */ }
function clearDrawingCanvas() { /* ... */ }
function setupDrawingCanvas() { /* ... */ }
function handleToolChange(selectedTool) { /* ... */ }
function handleColorChange(event) { /* ... */ }
function toggleDrawingVisibility() { /* ... */ }
function undoLastDrawing() { /* ... */ }
// === 5. Formasjons- og Tegnehåndtering END ===

// === 6. Drag and Drop & Valg/Farge/UI Toggles START === 
function addDragListenersToSquadItems() { /* ... */ }
function addDragListenersToBenchItems() { /* ... */ }
function handleDragStart(event) { /* ... */ }
function handleDragStartBench(event) { /* ... */ }
function handleDragStartPiece(event) { /* ... */ }
function handleDragStartOnPitchList(event) { /* ... */ }
function handleBallDragStart(event) { /* ... */ }
function handleDragOver(event, targetType) { /* ... */ }
function handleDragLeave(event, targetType) { /* ... */ }
function handleDropOnPitch(event) { /* ... */ }
function handleDropOnOnPitchList(event) { /* ... */ }
function handleDropOnBench(event) { /* ... */ }
function handleDropOnSquadList(event) { /* ... */ }
function handleDropOnFormationMarker(event, positionData) { /* ... */ }
function handleDragEnd(event) { /* ... */ }
function resetDragState() { /* ... */ }
function handlePlayerPieceClick(event) { /* ... */ }
function clearPlayerSelection() { /* ... */ }
function applyBorderColorToSelection(color) { /* ... */ }
function handleSetSelectedPlayerBorderColor() { /* ... */ }
function toggleSidebar() { /* ... */ }
function togglePitchRotation() { /* ... */ }
function switchView(viewName) { /* ... */ }
function toggleFullscreen() { /* ... */ }
// === 6. Drag and Drop & Valg/Farge/UI Toggles END ===

// === 7. Lokal Lagring START === 
function saveSquad() { /* ... */ }
function loadSquad() { /* ... */ }
function getCurrentStateData() { /* ... */ }
function saveCurrentState() { /* ... */ }
function applyState(stateData) { /* ... */ }
function resizePitchElement() { /* ... */ }
function loadLastState() { /* ... */ }
function clearPitch() { /* ... */ }
function getSavedSetups() { /* ... */ }
function handleSaveSetup() { /* ... */ }
function handleLoadSetup() { /* ... */ }
function handleDeleteSetup() { /* ... */ }
function populateSetupDropdown() { /* ... */ }
// === 7. Lokal Lagring END ===

// === 8. Eksport START ===
function handleExportPNG() { if (!pitchElement) { console.error("handleExportPNG: Finner ikke pitch-elementet."); alert("Kunne ikke eksportere bilde: Banen ble ikke funnet."); return; } if (typeof html2canvas === 'undefined') { console.error("handleExportPNG: html2canvas biblioteket er ikke lastet."); alert("Kunne ikke eksportere bilde: Nødvendig bibliotek mangler."); return; } console.log("Starter eksport til PNG..."); const originalPitchBorder = pitchElement.style.border; const originalPitchBoxShadow = pitchElement.style.boxShadow; pitchElement.style.border = 'none'; pitchElement.style.boxShadow = 'none'; html2canvas(pitchElement, { useCORS: true, allowTaint: true, backgroundColor: null, scale: 2, logging: false }).then(canvas => { pitchElement.style.border = originalPitchBorder; pitchElement.style.boxShadow = originalPitchBoxShadow; const link = document.createElement('a'); link.download = 'fotballtaktiker_bane.png'; link.href = canvas.toDataURL('image/png'); link.click(); console.log("PNG-eksport fullført."); }).catch(error => { pitchElement.style.border = originalPitchBorder; pitchElement.style.boxShadow = originalPitchBoxShadow; console.error("Feil under PNG-eksport:", error); alert("En feil oppstod under generering av skjermbilde."); }); }
// === 8. Eksport END ===

// === 9. Event Listeners START === 
document.addEventListener('DOMContentLoaded', () => {
    // Hent referanser
    appContainer = document.querySelector('.app-container'); sidebar = document.querySelector('.sidebar'); toggleSidebarButton = document.getElementById('toggle-sidebar-button'); onPitchListElement = document.getElementById('on-pitch-list'); benchListElement = document.getElementById('bench-list'); squadListElement = document.getElementById('squad-list'); squadListContainer = document.getElementById('squad-list-container'); onPitchCountElement = document.getElementById('on-pitch-count'); onBenchCountElement = document.getElementById('on-bench-count'); pitchElement = document.getElementById('pitch'); pitchSurface = document.getElementById('pitch-surface'); rotatePitchButton = document.getElementById('rotate-pitch-button'); addPlayerButton = document.getElementById('add-player-button'); playerBorderColorInput = document.getElementById('player-border-color'); setBorderColorButton = document.getElementById('set-border-color-button'); setColorRedButton = document.getElementById('set-color-red'); setColorYellowButton = document.getElementById('set-color-yellow'); setColorGreenButton = document.getElementById('set-color-green'); setColorDefaultButton = document.getElementById('set-color-default'); toggleDrawModeButton = document.getElementById('toggle-draw-mode-button'); clearDrawingsButton = document.getElementById('clear-drawings-button'); setupNameInput = document.getElementById('setup-name'); saveSetupButton = document.getElementById('save-setup-button'); loadSetupSelect = document.getElementById('load-setup-select'); loadSetupButton = document.getElementById('load-setup-button'); deleteSetupButton = document.getElementById('delete-setup-button'); exportPngButton = document.getElementById('export-png-button'); pitchContainer = document.getElementById('pitch-container'); drawingCanvas = document.getElementById('drawing-canvas'); ballElement = document.getElementById('ball'); navTacticsButton = document.getElementById('nav-tactics-button'); navSquadButton = document.getElementById('nav-squad-button'); tacticsPageContent = document.getElementById('tactics-page-content'); squadPageContent = document.getElementById('squad-page-content'); fullSquadListContainer = document.getElementById('full-squad-list-container'); onPitchSectionElement = document.getElementById('on-pitch-section'); formationSelect = document.getElementById('formation-select'); addPlayerModal = document.getElementById('add-player-modal'); closeButton = addPlayerModal ? addPlayerModal.querySelector('.close-button') : null; newPlayerNameInput = document.getElementById('new-player-name'); newPlayerImageUpload = document.getElementById('new-player-image-upload'); newPlayerImageUrlInput = document.getElementById('new-player-image-url'); newPlayerMainRoleInput = document.getElementById('new-player-main-role'); confirmAddPlayerButton = document.getElementById('confirm-add-player'); playerDetailModal = document.getElementById('player-detail-modal'); ballSettingsModal = document.getElementById('ball-settings-modal'); benchElement = document.getElementById('bench'); squadManagementSection = document.getElementById('squad-management'); 
    drawToolButtons = document.querySelectorAll('.draw-tool-button'); drawingColorInput = document.getElementById('drawing-color'); toggleVisibilityButton = document.getElementById('toggle-visibility-button');
    undoDrawingButton = document.getElementById('undo-drawing-button'); 
    fullscreenButton = document.getElementById('fullscreen-button'); 
    detailModalTabButtons = playerDetailModal.querySelectorAll('.tab-button'); // Hent fane-knapper

    setupDrawingCanvas(); 
    loadSquad(); loadLastState(); populateSetupDropdown();

    // --- Listeners ---
    if (addPlayerButton) addPlayerButton.addEventListener('click', openAddPlayerModal); if (closeButton) closeButton.addEventListener('click', closeAddPlayerModal); if (confirmAddPlayerButton) confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm); const detailModalCloseBtn = playerDetailModal ? playerDetailModal.querySelector('.close-detail-button') : null; const detailModalSaveBtn = playerDetailModal ? playerDetailModal.querySelector('#save-details-button') : null; const detailModalAddCommentBtn = playerDetailModal ? playerDetailModal.querySelector('#add-comment-to-history-button') : null; if (detailModalCloseBtn) detailModalCloseBtn.addEventListener('click', closePlayerDetailModal); if (detailModalSaveBtn) detailModalSaveBtn.addEventListener('click', handleSavePlayerDetails); if (detailModalAddCommentBtn) detailModalAddCommentBtn.addEventListener('click', handleAddCommentToHistory); if (ballElement) ballElement.addEventListener('dblclick', openBallSettingsModal); if (ballSettingsModal) { const closeBallBtn = ballSettingsModal.querySelector('.close-ball-settings-button'); const saveBallBtn = ballSettingsModal.querySelector('#save-ball-settings-button'); const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider'); if (closeBallBtn) closeBallBtn.addEventListener('click', closeBallSettingsModal); if (saveBallBtn) saveBallBtn.addEventListener('click', handleSaveBallSettings); if (sizeSlider) sizeSlider.addEventListener('input', handleBallSizeChange); window.addEventListener('click', (event) => { if (event.target === ballSettingsModal) closeBallSettingsModal(); }); }
    window.addEventListener('click', (event) => { if (addPlayerModal && event.target === addPlayerModal) closeAddPlayerModal(); if (playerDetailModal && event.target === playerDetailModal) closePlayerDetailModal(); if (ballSettingsModal && event.target === ballSettingsModal) closeBallSettingsModal(); if (!event.target.closest('.player-piece') && !event.target.closest('.preset-color-button') && !event.target.closest('#player-border-color') && !event.target.closest('#set-border-color-button') && selectedPlayerIds.size > 0) { clearPlayerSelection(); } if (!event.target.closest('.formation-position-marker')) { if (selectedFormationPosition) { resetPositionFilter(); } } }); 
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
    // NYTT: Legg til listeners for fane-knapper i modalen (hvis de eksisterer)
    if (detailModalTabButtons) {
        detailModalTabButtons.forEach(button => {
            // Trenger ikke legge til listener her siden vi bruker onclick i HTML
            // Hvis vi IKKE brukte onclick, ville vi gjort:
            // button.addEventListener('click', (e) => {
            //     const tabName = button.getAttribute('data-tab'); // Antatt at vi legger til data-tab="info-tab" osv.
            //     if(tabName) openModalTab(e, tabName);
            // });
        });
    } else {
        console.warn("Ingen fane-knapper funnet i detaljmodalen for å legge til listeners.");
    }

    window.addEventListener('resize', () => { resizePitchElement(); });
    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 9. Event Listeners END ===
/* Version: #153 */
