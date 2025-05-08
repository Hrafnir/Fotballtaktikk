/* Version: #123 */
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
let appContainer, sidebar, toggleSidebarButton, onPitchListElement, benchListElement, squadListElement, squadListContainer, onPitchCountElement, onBenchCountElement, pitchElement, pitchSurface, rotatePitchButton, addPlayerButton, playerBorderColorInput, setBorderColorButton, setColorRedButton, setColorYellowButton, setColorGreenButton, setColorDefaultButton, toggleDrawModeButton, clearDrawingsButton, setupNameInput, saveSetupButton, loadSetupSelect, loadSetupButton, deleteSetupButton, exportPngButton, pitchContainer, drawingCanvas, ballElement, navTacticsButton, navSquadButton, tacticsPageContent, squadPageContent, fullSquadListContainer, onPitchSectionElement, formationSelect, addPlayerModal, closeButton, newPlayerNameInput, newPlayerImageUpload, newPlayerImageUrlInput, newPlayerMainRoleInput, confirmAddPlayerButton, playerDetailModal, ballSettingsModal, benchElement, squadManagementSection; 
// === 1. DOM Element Referanser END ===

// === 2. Modal Håndtering START ===
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
function renderUI() { renderOnPitchList(); renderBench(); renderSquadList(); if(onPitchCountElement) onPitchCountElement.textContent = Object.keys(playersOnPitch).length; if(onBenchCountElement) onBenchCountElement.textContent = playersOnBench.length; }
function renderOnPitchList() { /* Inkluderer fargelegging + dblclick + draggable */ if (!onPitchListElement) return; onPitchListElement.innerHTML = ''; const playerIdsOnPitch = Object.keys(playersOnPitch); if (playerIdsOnPitch.length === 0) { onPitchListElement.innerHTML = '<li><i>Ingen spillere på banen.</i></li>'; return; } const sortedPlayers = playerIdsOnPitch.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name)); sortedPlayers.forEach(player => { const listItem = document.createElement('li'); let roleText = player.mainRole ? ` (${player.mainRole})` : ''; listItem.textContent = (player.nickname || player.name) + roleText; listItem.setAttribute('data-player-id', player.id); listItem.classList.add('on-pitch-player-item', 'draggable'); listItem.setAttribute('draggable', true); listItem.classList.remove(...Object.keys(PLAYER_STATUSES).map(s => `player-status-${s}`)); if (player.status) listItem.classList.add(`player-status-${player.status}`); listItem.addEventListener('dragstart', handleDragStartOnPitchList); listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); onPitchListElement.appendChild(listItem); }); }
function renderBench() { /* Inkluderer fargelegging + dblclick + draggable */ if (!benchListElement) return; benchListElement.innerHTML = ''; if (playersOnBench.length === 0) { benchListElement.innerHTML = '<li><i>Benken er tom.</i></li>'; return; } const sortedPlayers = playersOnBench.map(id => getPlayerById(id)).filter(p => p).sort((a, b) => a.name.localeCompare(b.name)); sortedPlayers.forEach(player => { const listItem = document.createElement('li'); let roleText = player.mainRole ? ` (${player.mainRole})` : ''; listItem.textContent = (player.nickname || player.name) + roleText; listItem.setAttribute('data-player-id', player.id); listItem.classList.add('bench-player-item', 'draggable'); listItem.setAttribute('draggable', true); listItem.classList.remove(...Object.keys(PLAYER_STATUSES).map(s => `player-status-${s}`)); if (player.status) listItem.classList.add(`player-status-${player.status}`); listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); benchListElement.appendChild(listItem); }); addDragListenersToBenchItems(); }
function renderSquadList() { /* Oppdatert for filtrering */ if (!squadListElement || !squadManagementSection) return; squadListElement.innerHTML = ''; const titleElement = squadManagementSection.querySelector('h3'); const defaultTitle = "Tropp (Tilgjengelige)"; let playersToList = []; let currentTitle = defaultTitle; if (selectedFormationPosition && selectedFormationPosition.roles) { currentTitle = `Spillere for ${selectedFormationPosition.name || selectedFormationPosition.id.toUpperCase()}:`; playersToList = squad.filter(p => p.playableRoles && p.playableRoles.some(playerRole => selectedFormationPosition.roles.includes(playerRole))).sort((a, b) => a.name.localeCompare(b.name)); } else { playersToList = squad.filter(p => !playersOnPitch[p.id] && !playersOnBench.includes(p.id)).sort((a, b) => a.name.localeCompare(b.name)); } if (titleElement) { titleElement.textContent = currentTitle; } if (playersToList.length === 0) { if (selectedFormationPosition) { squadListElement.innerHTML = '<li><i>Ingen spillere med passende rolle(r).</i></li>'; } else if (squad.length === 0) { squadListElement.innerHTML = '<li><i>Ingen spillere i troppen.</i></li>'; } else if (Object.keys(playersOnPitch).length + playersOnBench.length === squad.length) { squadListElement.innerHTML = '<li><i>Alle spillere er plassert.</i></li>'; } else { squadListElement.innerHTML = '<li><i>Ukjent tilstand.</i></li>'; } } else { playersToList.forEach(player => { const listItem = document.createElement('li'); let roleText = player.mainRole ? ` (${player.mainRole})` : ''; listItem.textContent = (player.nickname || player.name) + roleText; listItem.setAttribute('data-player-id', player.id); listItem.classList.add('squad-player-item', 'draggable'); listItem.setAttribute('draggable', true); listItem.classList.remove(...Object.keys(PLAYER_STATUSES).map(s => `player-status-${s}`)); if (player.status) listItem.classList.add(`player-status-${player.status}`); listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); squadListElement.appendChild(listItem); }); } addDragListenersToSquadItems(); }
function renderFullSquadList() { /* ... (som før V#115) ... */ if (!fullSquadListContainer) { console.error("renderFullSquadList: Container ikke funnet."); return; } fullSquadListContainer.innerHTML = ''; if (squad.length === 0) { fullSquadListContainer.innerHTML = '<p>Ingen spillere i troppen.</p>'; return; } const sortedSquad = [...squad].sort((a, b) => a.name.localeCompare(b.name)); const table = document.createElement('table'); table.style.width = '100%'; table.style.borderCollapse = 'collapse'; const thead = table.createTHead(); const headerRow = thead.insertRow(); const headers = ['Navn', 'Kallenavn', 'Hovedpos.', 'Roller', 'Status', 'Handlinger']; headers.forEach(text => { const th = document.createElement('th'); th.textContent = text; th.style.borderBottom = '2px solid #ccc'; th.style.padding = '8px'; th.style.textAlign = 'left'; headerRow.appendChild(th); }); const tbody = table.createTBody(); sortedSquad.forEach(player => { const row = tbody.insertRow(); row.style.borderBottom = '1px solid #eee'; const nameCell = row.insertCell(); nameCell.textContent = player.name || '?'; nameCell.style.padding = '8px'; const nicknameCell = row.insertCell(); nicknameCell.textContent = player.nickname || '-'; nicknameCell.style.padding = '8px'; const mainRoleCell = row.insertCell(); mainRoleCell.textContent = player.mainRole || '-'; mainRoleCell.style.padding = '8px'; const rolesCell = row.insertCell(); const rolesString = (player.playableRoles && player.playableRoles.length > 0) ? player.playableRoles.map(roleKey => PLAYER_ROLES[roleKey] || roleKey).join(', ') : '-'; rolesCell.textContent = rolesString; rolesCell.style.padding = '8px'; rolesCell.style.fontSize = '0.85em'; const statusCell = row.insertCell(); statusCell.textContent = PLAYER_STATUSES[player.status] || player.status; statusCell.style.padding = '8px'; if (player.status === 'INJURED_SHORT' || player.status === 'INJURED_LONG') { statusCell.style.color = 'orange'; } else if (player.status === 'SUSPENDED' || player.status === 'UNAVAILABLE') { statusCell.style.color = 'red'; } else if (player.status === 'AVAILABLE') { statusCell.style.color = 'green'; } const actionsCell = row.insertCell(); actionsCell.style.padding = '8px'; actionsCell.style.whiteSpace = 'nowrap'; const editButton = document.createElement('button'); editButton.textContent = 'Rediger'; editButton.style.padding = '4px 8px'; editButton.style.marginRight = '5px'; editButton.classList.add('action-button'); editButton.addEventListener('click', () => openPlayerDetailModal(player.id)); actionsCell.appendChild(editButton); const deleteButton = document.createElement('button'); deleteButton.textContent = 'Slett'; deleteButton.style.padding = '4px 8px'; deleteButton.style.backgroundColor = '#f44336'; deleteButton.classList.add('action-button'); deleteButton.addEventListener('click', () => handleDeletePlayer(player.id, player.name)); actionsCell.appendChild(deleteButton); }); fullSquadListContainer.appendChild(table); }
// === 3. UI Rendering END ===

// === 4. Spillerbrikke & Ball Håndtering START ===
function createPlayerPieceElement(player, xPercent, yPercent) { /* ... */ }
function getPlayerById(playerId) { /* ... */ }
function updateBallPosition(xPercent, yPercent) { /* ... */ }
function applyBallStyle() { /* ... */ }
// === 4. Spillerbrikke & Ball Håndtering END ===

// === 5. Drag and Drop & Valg/Farge/UI Toggles START ===
function addDragListenersToSquadItems() { /* ... */ }
function addDragListenersToBenchItems() { /* ... */ }
function handleDragStart(event) { /* ... */ }
function handleDragStartBench(event) { /* ... */ }
function handleDragStartPiece(event) { /* ... */ }
function handleDragStartOnPitchList(event) { /* ... */ }
function handleBallDragStart(event) { /* ... */ }
function handleDragOver(event, targetType) { /* Oppdatert for formation-marker */ event.preventDefault(); event.dataTransfer.dropEffect = 'move'; let targetElement; if (targetType === 'pitch') targetElement = pitchElement; else if (targetType === 'bench') targetElement = benchElement; else if (targetType === 'squad') targetElement = squadListContainer; else if (targetType === 'onpitch-list') targetElement = onPitchSectionElement; else if (targetType === 'formation-marker') targetElement = event.target.closest('.formation-position-marker'); if(targetElement) targetElement.classList.add('drag-over'); }
function handleDragLeave(event, targetType) { /* Oppdatert for formation-marker */ const relatedTarget = event.relatedTarget; let targetElement; if (targetType === 'pitch') targetElement = pitchElement; else if (targetType === 'bench') targetElement = benchElement; else if (targetType === 'squad') targetElement = squadListContainer; else if (targetType === 'onpitch-list') targetElement = onPitchSectionElement; else if (targetType === 'formation-marker') targetElement = event.target.closest('.formation-position-marker'); if (!targetElement) return; if (!relatedTarget || !targetElement.contains(relatedTarget)) { targetElement.classList.remove('drag-over'); } }
function handleDropOnPitch(event) { /* ... */ }
function handleDropOnOnPitchList(event) { /* ... */ }
function handleDropOnBench(event) { /* ... */ }
function handleDropOnSquadList(event) { /* ... */ }
// === FUNKSJON: handleDropOnFormationMarker START (NY) ===
function handleDropOnFormationMarker(event, positionData) {
    event.preventDefault();
    const markerElement = event.target.closest('.formation-position-marker');
    if (markerElement) markerElement.classList.remove('drag-over');

    let playerId;
    try { playerId = event.dataTransfer.getData('text/plain'); } 
    catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; }
    if (!playerId) { console.warn("Drop on FormationMarker: Mottok tom playerId."); resetDragState(); return; }
    
    const player = getPlayerById(playerId);
    if (!player) { console.error("Drop on FormationMarker: Fant ikke spiller ID:", playerId); resetDragState(); return; }

    const targetX = positionData.x;
    const targetY = positionData.y;

    console.log(`Slipper spiller ${playerId} (${dragSource}) på posisjon ${positionData.id} (${targetX}%, ${targetY}%)`);

    // Sjekk om banen er full KUN hvis spilleren IKKE allerede er på banen
    if (!playersOnPitch[playerId] && Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) {
        alert(`Kan ikke legge til flere spillere på banen (maks ${MAX_PLAYERS_ON_PITCH}).`);
        resetDragState();
        return;
    }

    let stateChanged = false;

    // Oppdater spillerens posisjonsdata
    player.position = { x: targetX, y: targetY };

    // Håndter flytting/plassering
    if (playersOnPitch[playerId]) {
        // Spilleren er allerede på banen, bare flytt brikken
        console.log(` - Flytter eksisterende brikke for ${playerId}`);
        const piece = playersOnPitch[playerId];
        piece.style.left = `${targetX}%`;
        piece.style.top = `${targetY}%`;
        stateChanged = true; // Posisjon endret
    } else {
        // Spilleren er ikke på banen, opprett ny brikke
        console.log(` - Oppretter ny brikke for ${playerId}`);
        const newPiece = createPlayerPieceElement(player, targetX, targetY);
        if (pitchSurface) {
            pitchSurface.appendChild(newPiece);
            playersOnPitch[playerId] = newPiece; // Legg til i objektet
            stateChanged = true;
        } else {
            console.error("FEIL: pitchSurface ikke funnet ved slipp på markør!");
            resetDragState();
            return;
        }
    }

    // Fjern spiller fra evt. kildeliste (Benk) hvis den kom derfra
    if (dragSource === 'bench') {
        const benchIndex = playersOnBench.indexOf(playerId);
        if (benchIndex > -1) {
            console.log(` - Fjerner ${playerId} fra benken.`);
            playersOnBench.splice(benchIndex, 1);
            stateChanged = true; // UI må oppdateres
        }
    }
    // Trenger ikke fjerne fra 'squad' eller 'onpitch-list' eksplisitt, renderUI håndterer det

    if (stateChanged) {
        saveCurrentState();
        renderUI(); // Oppdaterer alle lister og tellere
    }
    resetDragState();
}
// === FUNKSJON: handleDropOnFormationMarker END ===
function handleDragEnd(event) { /* ... */ }
function resetDragState() { /* ... */ }
function handlePlayerPieceClick(event) { /* ... */ }
function clearPlayerSelection() { /* ... */ }
function applyBorderColorToSelection(color) { /* ... */ }
function handleSetSelectedPlayerBorderColor() { /* ... */ }
function toggleSidebar() { /* ... */ }
function togglePitchRotation() { /* ... */ }
function switchView(viewName) { /* ... */ }
function handleFormationChange(event) { /* Oppdatert for å resette filter */ const selectedFormationName = event.target.value; currentFormation = FORMATIONS[selectedFormationName] || null; clearFormationPositions(); resetPositionFilter(); if (currentFormation) { console.log(`Formasjon valgt: ${currentFormation.name}`, currentFormation); drawFormationPositions(currentFormation); } else { console.log("Ingen formasjon valgt."); } }
function clearFormationPositions() { /* ... */ }
function drawFormationPositions(formation) { /* Oppdatert med listeners */ if (!formation || !formation.positions || !pitchSurface) { console.error("drawFormationPositions: Mangler formasjonsdata eller pitchSurface."); return; } console.log(`Tegner posisjoner for: ${formation.name}`); formation.positions.forEach(pos => { const marker = document.createElement('div'); marker.classList.add('formation-position-marker', 'drop-target'); /* Gjør til drop target */ marker.style.left = `${pos.x}%`; marker.style.top = `${pos.y}%`; marker.textContent = pos.id.toUpperCase(); marker.title = `${pos.name} (Roller: ${pos.roles.join(', ')})`; marker.setAttribute('data-pos-id', pos.id); marker.setAttribute('data-pos-name', pos.name); marker.setAttribute('data-roles', JSON.stringify(pos.roles)); marker.addEventListener('click', (e) => { e.stopPropagation(); handlePositionMarkerClick(marker, pos); }); /* Drag listeners for markøren */ marker.addEventListener('dragover', (e) => handleDragOver(e, 'formation-marker')); marker.addEventListener('dragleave', (e) => handleDragLeave(e, 'formation-marker')); marker.addEventListener('drop', (e) => handleDropOnFormationMarker(e, pos)); pitchSurface.appendChild(marker); }); }
function handlePositionMarkerClick(markerElement, positionData) { /* ... */ }
function clearSelectedPositionMarker() { /* ... */ }
function resetPositionFilter() { /* ... */ }
// === 5. Drag and Drop & Valg/Farge/UI Toggles END ===

// === 6. Lokal Lagring START ===
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
// === 6. Lokal Lagring END ===

// === 7. Event Listeners START ===
document.addEventListener('DOMContentLoaded', () => {
    // Hent referanser
    appContainer = document.querySelector('.app-container'); sidebar = document.querySelector('.sidebar'); toggleSidebarButton = document.getElementById('toggle-sidebar-button'); onPitchListElement = document.getElementById('on-pitch-list'); benchListElement = document.getElementById('bench-list'); squadListElement = document.getElementById('squad-list'); squadListContainer = document.getElementById('squad-list-container'); onPitchCountElement = document.getElementById('on-pitch-count'); onBenchCountElement = document.getElementById('on-bench-count'); pitchElement = document.getElementById('pitch'); pitchSurface = document.getElementById('pitch-surface'); rotatePitchButton = document.getElementById('rotate-pitch-button'); addPlayerButton = document.getElementById('add-player-button'); playerBorderColorInput = document.getElementById('player-border-color'); setBorderColorButton = document.getElementById('set-border-color-button'); setColorRedButton = document.getElementById('set-color-red'); setColorYellowButton = document.getElementById('set-color-yellow'); setColorGreenButton = document.getElementById('set-color-green'); setColorDefaultButton = document.getElementById('set-color-default'); toggleDrawModeButton = document.getElementById('toggle-draw-mode-button'); clearDrawingsButton = document.getElementById('clear-drawings-button'); setupNameInput = document.getElementById('setup-name'); saveSetupButton = document.getElementById('save-setup-button'); loadSetupSelect = document.getElementById('load-setup-select'); loadSetupButton = document.getElementById('load-setup-button'); deleteSetupButton = document.getElementById('delete-setup-button'); exportPngButton = document.getElementById('export-png-button'); pitchContainer = document.getElementById('pitch-container'); drawingCanvas = document.getElementById('drawing-canvas'); ballElement = document.getElementById('ball'); navTacticsButton = document.getElementById('nav-tactics-button'); navSquadButton = document.getElementById('nav-squad-button'); tacticsPageContent = document.getElementById('tactics-page-content'); squadPageContent = document.getElementById('squad-page-content'); fullSquadListContainer = document.getElementById('full-squad-list-container'); onPitchSectionElement = document.getElementById('on-pitch-section'); formationSelect = document.getElementById('formation-select'); addPlayerModal = document.getElementById('add-player-modal'); closeButton = addPlayerModal ? addPlayerModal.querySelector('.close-button') : null; newPlayerNameInput = document.getElementById('new-player-name'); newPlayerImageUpload = document.getElementById('new-player-image-upload'); newPlayerImageUrlInput = document.getElementById('new-player-image-url'); newPlayerMainRoleInput = document.getElementById('new-player-main-role'); confirmAddPlayerButton = document.getElementById('confirm-add-player'); playerDetailModal = document.getElementById('player-detail-modal'); ballSettingsModal = document.getElementById('ball-settings-modal'); benchElement = document.getElementById('bench'); 
    squadManagementSection = document.getElementById('squad-management'); 
    
    // Last data 
    loadSquad(); loadLastState(); populateSetupDropdown();

    // --- Listeners ---
    if (addPlayerButton) addPlayerButton.addEventListener('click', openAddPlayerModal); if (closeButton) closeButton.addEventListener('click', closeAddPlayerModal); if (confirmAddPlayerButton) confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm); const detailModalCloseBtn = playerDetailModal ? playerDetailModal.querySelector('.close-detail-button') : null; const detailModalSaveBtn = playerDetailModal ? playerDetailModal.querySelector('#save-details-button') : null; const detailModalAddCommentBtn = playerDetailModal ? playerDetailModal.querySelector('#add-comment-to-history-button') : null; if (detailModalCloseBtn) detailModalCloseBtn.addEventListener('click', closePlayerDetailModal); if (detailModalSaveBtn) detailModalSaveBtn.addEventListener('click', handleSavePlayerDetails); if (detailModalAddCommentBtn) detailModalAddCommentBtn.addEventListener('click', handleAddCommentToHistory); if (ballElement) ballElement.addEventListener('dblclick', openBallSettingsModal); if (ballSettingsModal) { const closeBallBtn = ballSettingsModal.querySelector('.close-ball-settings-button'); const saveBallBtn = ballSettingsModal.querySelector('#save-ball-settings-button'); const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider'); if (closeBallBtn) closeBallBtn.addEventListener('click', closeBallSettingsModal); if (saveBallBtn) saveBallBtn.addEventListener('click', handleSaveBallSettings); if (sizeSlider) sizeSlider.addEventListener('input', handleBallSizeChange); window.addEventListener('click', (event) => { if (event.target === ballSettingsModal) closeBallSettingsModal(); }); }
    window.addEventListener('click', (event) => { if (addPlayerModal && event.target === addPlayerModal) closeAddPlayerModal(); if (playerDetailModal && event.target === playerDetailModal) closePlayerDetailModal(); if (ballSettingsModal && event.target === ballSettingsModal) closeBallSettingsModal(); if (!event.target.closest('.player-piece') && !event.target.closest('.preset-color-button') && !event.target.closest('#player-border-color') && !event.target.closest('#set-border-color-button') && selectedPlayerIds.size > 0) { clearPlayerSelection(); } if (!event.target.closest('.formation-position-marker')) { if (selectedFormationPosition) { resetPositionFilter(); } } }); 
    if (pitchElement) { pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch')); pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch')); pitchElement.addEventListener('drop', handleDropOnPitch); } if (benchElement) { benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench')); benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench')); benchElement.addEventListener('drop', handleDropOnBench); } if (squadListContainer) { squadListContainer.addEventListener('dragover', (e) => handleDragOver(e, 'squad')); squadListContainer.addEventListener('dragleave', (e) => handleDragLeave(e, 'squad')); squadListContainer.addEventListener('drop', handleDropOnSquadList); } if (ballElement) { ballElement.addEventListener('dragstart', handleBallDragStart); ballElement.addEventListener('dragend', handleDragEnd); } if (onPitchSectionElement) { onPitchSectionElement.addEventListener('dragover', (e) => handleDragOver(e, 'onpitch-list')); onPitchSectionElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'onpitch-list')); onPitchSectionElement.addEventListener('drop', handleDropOnOnPitchList); }
    if (toggleSidebarButton) toggleSidebarButton.addEventListener('click', toggleSidebar); if (rotatePitchButton) rotatePitchButton.addEventListener('click', togglePitchRotation); if (setBorderColorButton) setBorderColorButton.addEventListener('click', handleSetSelectedPlayerBorderColor); if(setColorRedButton) setColorRedButton.addEventListener('click', () => applyBorderColorToSelection('red')); if(setColorYellowButton) setColorYellowButton.addEventListener('click', () => applyBorderColorToSelection('yellow')); if(setColorGreenButton) setColorGreenButton.addEventListener('click', () => applyBorderColorToSelection('lime')); if(setColorDefaultButton) setColorDefaultButton.addEventListener('click', () => applyBorderColorToSelection('black')); if (saveSetupButton) saveSetupButton.addEventListener('click', handleSaveSetup); if (loadSetupButton) loadSetupButton.addEventListener('click', handleLoadSetup); if (deleteSetupButton) deleteSetupButton.addEventListener('click', handleDeleteSetup);
    if (navTacticsButton) navTacticsButton.addEventListener('click', () => switchView('tactics')); if (navSquadButton) navSquadButton.addEventListener('click', () => switchView('squad'));
    if (formationSelect) { formationSelect.addEventListener('change', handleFormationChange); } else { console.error("formationSelect ikke funnet ved listener-oppsett!"); }
    window.addEventListener('resize', resizePitchElement);
    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 7. Event Listeners END ===
/* Version: #123 */

// Placeholder for functions to avoid syntax errors if called before defined (should not happen with current structure)
function handleDragStartOnPitchList(event) { /* Definert lenger ned */ }
function handleDropOnOnPitchList(event) { /* Definert lenger ned */ }
function handleDropOnFormationMarker(event, positionData) { /* Definert lenger ned */ }
function drawFormationPositions(formation) { /* Definert lenger ned */ }
function clearFormationPositions() { /* Definert lenger ned */ }
function handlePositionMarkerClick(markerElement, positionData) { /* Definert lenger ned */ }
function clearSelectedPositionMarker() { /* Definert lenger ned */ }
function resetPositionFilter() { /* Definert lenger ned */ }

// --- Funksjonsdefinisjoner ---
// (Inkluderer definisjonene for funksjonene over)
// ... [Resten av funksjonene som i V#118] ...
// NOTE: I den faktiske filen er alle funksjoner definert før de brukes i `DOMContentLoaded`
