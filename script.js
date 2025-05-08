/* Version: #126 */
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

// NYE: Variabler for tegning
let isDrawingMode = false;
let isDrawing = false;
let drawingCtx = null;
let startX, startY, currentX, currentY;
const DRAWING_COLOR = 'yellow';
const DRAWING_LINE_WIDTH = 4;

const MAX_PLAYERS_ON_PITCH = 11;
// ... (resten av konstanter som før V#124) ...
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
let appContainer, sidebar, toggleSidebarButton, onPitchListElement, benchListElement, squadListElement, squadListContainer, onPitchCountElement, onBenchCountElement, pitchElement, pitchSurface, rotatePitchButton, addPlayerButton, playerBorderColorInput, setBorderColorButton, setColorRedButton, setColorYellowButton, setColorGreenButton, setColorDefaultButton, toggleDrawModeButton, clearDrawingsButton, setupNameInput, saveSetupButton, loadSetupSelect, loadSetupButton, deleteSetupButton, exportPngButton, pitchContainer, drawingCanvas, ballElement, navTacticsButton, navSquadButton, tacticsPageContent, squadPageContent, fullSquadListContainer, onPitchSectionElement, formationSelect, addPlayerModal, closeButton, newPlayerNameInput, newPlayerImageUpload, newPlayerImageUrlInput, newPlayerMainRoleInput, confirmAddPlayerButton, playerDetailModal, ballSettingsModal, benchElement, squadManagementSection;
// === 1. DOM Element Referanser END ===

// === 2. Modal Håndtering START ===
// ... (alle modal-funksjoner som før V#124) ...
function populateRolesCheckboxes(containerId, selectedRoles = []) { /* ... */ }
function populateStatusDropdown(selectElementId, currentStatusKey) { /* ... */ }
function openAddPlayerModal() { /* ... */ }
function closeAddPlayerModal() { /* ... */ }
function handleAddPlayerConfirm() { /* ... */ }
function openPlayerDetailModal(playerId) { /* ... */ }
function renderCommentHistory(comments, historyDivElement) { /* ... */ }
function closePlayerDetailModal() { /* ... */ }
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

// === FUNKSJON: toggleDrawMode START (NY) ===
function toggleDrawMode() {
    isDrawingMode = !isDrawingMode;
    console.log("Tegnemodus:", isDrawingMode ? "PÅ" : "AV");

    if (!drawingCanvas || !pitchSurface || !toggleDrawModeButton) {
        console.error("toggleDrawMode: Mangler nødvendige elementer (canvas, pitchSurface, knapp).");
        return;
    }

    if (isDrawingMode) {
        drawingCanvas.style.pointerEvents = 'auto'; // Gjør canvas klikkbart
        pitchSurface.style.cursor = 'crosshair';    // Endre musepeker
        toggleDrawModeButton.textContent = 'Tegn Piler (På)';
        toggleDrawModeButton.classList.add('active'); // Visuell indikasjon
        // Legg til tegnelisteners
        pitchSurface.addEventListener('mousedown', startDraw);
        pitchSurface.addEventListener('touchstart', startDraw, { passive: false }); // For touch
        pitchSurface.addEventListener('mousemove', draw);
        pitchSurface.addEventListener('touchmove', draw, { passive: false });
        pitchSurface.addEventListener('mouseup', stopDraw);
        pitchSurface.addEventListener('touchend', stopDraw);
        pitchSurface.addEventListener('mouseleave', stopDraw); // Stopp hvis musen forlater banen
    } else {
        drawingCanvas.style.pointerEvents = 'none'; // Gjør canvas ikke-klikkbart
        pitchSurface.style.cursor = 'default';      // Tilbakestill musepeker
        toggleDrawModeButton.textContent = 'Tegn Piler (Av)';
        toggleDrawModeButton.classList.remove('active');
        // Fjern tegnelisteners
        pitchSurface.removeEventListener('mousedown', startDraw);
        pitchSurface.removeEventListener('touchstart', startDraw);
        pitchSurface.removeEventListener('mousemove', draw);
        pitchSurface.removeEventListener('touchmove', draw);
        pitchSurface.removeEventListener('mouseup', stopDraw);
        pitchSurface.removeEventListener('touchend', stopDraw);
        pitchSurface.removeEventListener('mouseleave', stopDraw);
        // Sikre at isDrawing blir false hvis man slår av modus midt i tegning
        isDrawing = false; 
    }
}
// === FUNKSJON: toggleDrawMode END ===

// === FUNKSJON: startDraw START (NY) ===
function startDraw(event) {
    if (!isDrawingMode) return; // Skal ikke tegne hvis modus er av

    event.preventDefault(); // Forhindre standard touch-oppførsel (som scrolling)
    
    isDrawing = true;
    const coords = getCanvasCoordinates(event);
    startX = coords.x;
    startY = coords.y;
    console.log(`Start Draw at: ${startX}, ${startY}`);
}
// === FUNKSJON: startDraw END ===

// === FUNKSJON: draw START (NY) ===
function draw(event) {
    if (!isDrawing || !isDrawingMode) return;
    event.preventDefault();

    const coords = getCanvasCoordinates(event);
    currentX = coords.x;
    currentY = coords.y;

    // Tegn pilen mens man drar (vi implementerer selve tegningen senere)
    redrawTemporaryArrow(); 
}
// === FUNKSJON: draw END ===

// === FUNKSJON: stopDraw START (NY) ===
function stopDraw(event) {
    if (!isDrawing || !isDrawingMode) return;
    isDrawing = false;

    // Her vil vi normalt sett lagre den ferdige pilen
    // For nå, la den bare være på canvaset til den slettes
    console.log(`Stop Draw at: ${currentX}, ${currentY}. Start was: ${startX}, ${startY}`);
    // finalizeArrow(startX, startY, currentX, currentY); // Funksjon for å lagre pilen
}
// === FUNKSJON: stopDraw END ===

// === FUNKSJON: redrawTemporaryArrow START (NY - Placeholder for tegning) ===
function redrawTemporaryArrow() {
     if (!drawingCtx || !isDrawing) return;

     // Tøm canvas FØR vi tegner den nye midlertidige pilen
     // VIKTIG: Dette sletter alt, vi må håndtere lagrede piler senere
     clearDrawingCanvas(); 

     drawingCtx.beginPath();
     drawingCtx.moveTo(startX, startY);
     drawingCtx.lineTo(currentX, currentY);
     // TODO: Tegn pilspiss
     drawingCtx.strokeStyle = DRAWING_COLOR;
     drawingCtx.lineWidth = DRAWING_LINE_WIDTH;
     drawingCtx.stroke();
     drawingCtx.closePath();
}
// === FUNKSJON: redrawTemporaryArrow END ===

// === FUNKSJON: getCanvasCoordinates START (NY Hjelpefunksjon) ===
function getCanvasCoordinates(event) {
    if (!drawingCanvas) return { x: 0, y: 0 };
    const rect = drawingCanvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
        // Touch event
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        // Mouse event
        clientX = event.clientX;
        clientY = event.clientY;
    }

    // Beregn koordinater relativt til canvas, ta hensyn til skalering og padding/border
    const scaleX = drawingCanvas.width / rect.width;
    const scaleY = drawingCanvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    return { x, y };
}
// === FUNKSJON: getCanvasCoordinates END ===

// === FUNKSJON: clearDrawings START (NY) ===
function clearDrawings() {
    if (confirm("Er du sikker på at du vil slette alle tegninger?")) {
        clearDrawingCanvas();
        // TODO: Fjern lagrede piler hvis/når det implementeres
        console.log("Alle tegninger slettet.");
    }
}
// === FUNKSJON: clearDrawings END ===

// === FUNKSJON: clearDrawingCanvas START (NY Hjelpefunksjon) ===
function clearDrawingCanvas() {
    if (drawingCtx && drawingCanvas) {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    } else {
        console.error("clearDrawingCanvas: Context eller Canvas mangler.");
    }
}
// === FUNKSJON: clearDrawingCanvas END ===

// === FUNKSJON: setupDrawingCanvas START (NY) ===
function setupDrawingCanvas() {
    if (!drawingCanvas) {
        console.error("setupDrawingCanvas: Finner ikke canvas-elementet!");
        return;
    }
    
    // Sett canvas dimensjoner til å matche CSS-størrelsen for skarp tegning
    // Dette må kanskje justeres/kjøres på nytt ved resize/rotasjon senere
    drawingCanvas.width = drawingCanvas.offsetWidth;
    drawingCanvas.height = drawingCanvas.offsetHeight;

    drawingCtx = drawingCanvas.getContext('2d');

    if (!drawingCtx) {
        console.error("setupDrawingCanvas: Kunne ikke hente 2D context.");
        return;
    }
    console.log("Drawing canvas satt opp med context.");
}
// === FUNKSJON: setupDrawingCanvas END ===
// === 5. Formasjons- og Tegnehåndtering END ===

// === 6. Drag and Drop & Valg/Farge/UI Toggles START === 
// Merk: Dette er nå seksjon 6, tidligere 5
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
// === 6. Drag and Drop & Valg/Farge/UI Toggles END ===

// === 7. Lokal Lagring START === 
// Merk: Dette er nå seksjon 7, tidligere 6
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

// === 8. Event Listeners START === 
// Merk: Dette er nå seksjon 8, tidligere 7
document.addEventListener('DOMContentLoaded', () => {
    // Hent referanser
    appContainer = document.querySelector('.app-container'); sidebar = document.querySelector('.sidebar'); toggleSidebarButton = document.getElementById('toggle-sidebar-button'); onPitchListElement = document.getElementById('on-pitch-list'); benchListElement = document.getElementById('bench-list'); squadListElement = document.getElementById('squad-list'); squadListContainer = document.getElementById('squad-list-container'); onPitchCountElement = document.getElementById('on-pitch-count'); onBenchCountElement = document.getElementById('on-bench-count'); pitchElement = document.getElementById('pitch'); pitchSurface = document.getElementById('pitch-surface'); rotatePitchButton = document.getElementById('rotate-pitch-button'); addPlayerButton = document.getElementById('add-player-button'); playerBorderColorInput = document.getElementById('player-border-color'); setBorderColorButton = document.getElementById('set-border-color-button'); setColorRedButton = document.getElementById('set-color-red'); setColorYellowButton = document.getElementById('set-color-yellow'); setColorGreenButton = document.getElementById('set-color-green'); setColorDefaultButton = document.getElementById('set-color-default'); toggleDrawModeButton = document.getElementById('toggle-draw-mode-button'); clearDrawingsButton = document.getElementById('clear-drawings-button'); setupNameInput = document.getElementById('setup-name'); saveSetupButton = document.getElementById('save-setup-button'); loadSetupSelect = document.getElementById('load-setup-select'); loadSetupButton = document.getElementById('load-setup-button'); deleteSetupButton = document.getElementById('delete-setup-button'); exportPngButton = document.getElementById('export-png-button'); pitchContainer = document.getElementById('pitch-container'); drawingCanvas = document.getElementById('drawing-canvas'); ballElement = document.getElementById('ball'); navTacticsButton = document.getElementById('nav-tactics-button'); navSquadButton = document.getElementById('nav-squad-button'); tacticsPageContent = document.getElementById('tactics-page-content'); squadPageContent = document.getElementById('squad-page-content'); fullSquadListContainer = document.getElementById('full-squad-list-container'); onPitchSectionElement = document.getElementById('on-pitch-section'); formationSelect = document.getElementById('formation-select'); addPlayerModal = document.getElementById('add-player-modal'); closeButton = addPlayerModal ? addPlayerModal.querySelector('.close-button') : null; newPlayerNameInput = document.getElementById('new-player-name'); newPlayerImageUpload = document.getElementById('new-player-image-upload'); newPlayerImageUrlInput = document.getElementById('new-player-image-url'); newPlayerMainRoleInput = document.getElementById('new-player-main-role'); confirmAddPlayerButton = document.getElementById('confirm-add-player'); playerDetailModal = document.getElementById('player-detail-modal'); ballSettingsModal = document.getElementById('ball-settings-modal'); benchElement = document.getElementById('bench'); squadManagementSection = document.getElementById('squad-management'); 
    
    // Sett opp tegne-canvas FØR data lastes, men ETTER element er hentet
    setupDrawingCanvas(); 

    // Last data 
    loadSquad(); loadLastState(); populateSetupDropdown();

    // --- Listeners ---
    if (addPlayerButton) addPlayerButton.addEventListener('click', openAddPlayerModal); if (closeButton) closeButton.addEventListener('click', closeAddPlayerModal); if (confirmAddPlayerButton) confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm); const detailModalCloseBtn = playerDetailModal ? playerDetailModal.querySelector('.close-detail-button') : null; const detailModalSaveBtn = playerDetailModal ? playerDetailModal.querySelector('#save-details-button') : null; const detailModalAddCommentBtn = playerDetailModal ? playerDetailModal.querySelector('#add-comment-to-history-button') : null; if (detailModalCloseBtn) detailModalCloseBtn.addEventListener('click', closePlayerDetailModal); if (detailModalSaveBtn) detailModalSaveBtn.addEventListener('click', handleSavePlayerDetails); if (detailModalAddCommentBtn) detailModalAddCommentBtn.addEventListener('click', handleAddCommentToHistory); if (ballElement) ballElement.addEventListener('dblclick', openBallSettingsModal); if (ballSettingsModal) { const closeBallBtn = ballSettingsModal.querySelector('.close-ball-settings-button'); const saveBallBtn = ballSettingsModal.querySelector('#save-ball-settings-button'); const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider'); if (closeBallBtn) closeBallBtn.addEventListener('click', closeBallSettingsModal); if (saveBallBtn) saveBallBtn.addEventListener('click', handleSaveBallSettings); if (sizeSlider) sizeSlider.addEventListener('input', handleBallSizeChange); window.addEventListener('click', (event) => { if (event.target === ballSettingsModal) closeBallSettingsModal(); }); }
    window.addEventListener('click', (event) => { if (addPlayerModal && event.target === addPlayerModal) closeAddPlayerModal(); if (playerDetailModal && event.target === playerDetailModal) closePlayerDetailModal(); if (ballSettingsModal && event.target === ballSettingsModal) closeBallSettingsModal(); if (!event.target.closest('.player-piece') && !event.target.closest('.preset-color-button') && !event.target.closest('#player-border-color') && !event.target.closest('#set-border-color-button') && selectedPlayerIds.size > 0) { clearPlayerSelection(); } if (!event.target.closest('.formation-position-marker')) { if (selectedFormationPosition) { resetPositionFilter(); } } }); 
    if (pitchElement) { pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch')); pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch')); pitchElement.addEventListener('drop', handleDropOnPitch); } if (benchElement) { benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench')); benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench')); benchElement.addEventListener('drop', handleDropOnBench); } if (squadListContainer) { squadListContainer.addEventListener('dragover', (e) => handleDragOver(e, 'squad')); squadListContainer.addEventListener('dragleave', (e) => handleDragLeave(e, 'squad')); squadListContainer.addEventListener('drop', handleDropOnSquadList); } if (ballElement) { ballElement.addEventListener('dragstart', handleBallDragStart); ballElement.addEventListener('dragend', handleDragEnd); } if (onPitchSectionElement) { onPitchSectionElement.addEventListener('dragover', (e) => handleDragOver(e, 'onpitch-list')); onPitchSectionElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'onpitch-list')); onPitchSectionElement.addEventListener('drop', handleDropOnOnPitchList); }
    if (toggleSidebarButton) toggleSidebarButton.addEventListener('click', toggleSidebar); if (rotatePitchButton) rotatePitchButton.addEventListener('click', togglePitchRotation); if (setBorderColorButton) setBorderColorButton.addEventListener('click', handleSetSelectedPlayerBorderColor); if(setColorRedButton) setColorRedButton.addEventListener('click', () => applyBorderColorToSelection('red')); if(setColorYellowButton) setColorYellowButton.addEventListener('click', () => applyBorderColorToSelection('yellow')); if(setColorGreenButton) setColorGreenButton.addEventListener('click', () => applyBorderColorToSelection('lime')); if(setColorDefaultButton) setColorDefaultButton.addEventListener('click', () => applyBorderColorToSelection('black')); if (saveSetupButton) saveSetupButton.addEventListener('click', handleSaveSetup); if (loadSetupButton) loadSetupButton.addEventListener('click', handleLoadSetup); if (deleteSetupButton) deleteSetupButton.addEventListener('click', handleDeleteSetup);
    if (navTacticsButton) navTacticsButton.addEventListener('click', () => switchView('tactics')); if (navSquadButton) navSquadButton.addEventListener('click', () => switchView('squad'));
    if (formationSelect) { formationSelect.addEventListener('change', handleFormationChange); } else { console.error("formationSelect ikke funnet!"); }
    // NYE: Listeners for tegneknapper
    if(toggleDrawModeButton) { toggleDrawModeButton.addEventListener('click', toggleDrawMode); } else { console.error("toggleDrawModeButton ikke funnet!"); }
    if(clearDrawingsButton) { clearDrawingsButton.addEventListener('click', clearDrawings); } else { console.error("clearDrawingsButton ikke funnet!"); }
    // Resize Listener (Viktig for canvas også!)
    window.addEventListener('resize', () => {
        resizePitchElement();
        setupDrawingCanvas(); // Sett canvas-dimensjoner på nytt ved resize
    });
    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 8. Event Listeners END ===
/* Version: #126 */
