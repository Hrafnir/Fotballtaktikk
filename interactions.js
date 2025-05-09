/* Version: #18 */
// === Interaksjoner (Drag & Drop, Valg, Toggles, View Switching) START ===

// --- Drag and Drop Håndtering ---
function addDragListenersToSquadItems() {
    // squadListElement er global (config.js)
    if (!squadListElement) return;
    const items = squadListElement.querySelectorAll('.squad-player-item.draggable');
    items.forEach(item => {
        item.removeEventListener('dragstart', handleDragStart); // Fjern for å unngå duplikater
        item.addEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd);     // Fjern for å unngå duplikater
        item.addEventListener('dragend', handleDragEnd);
    });
}

function addDragListenersToBenchItems() {
    // benchListElement er global (config.js)
    if (!benchListElement) return;
    const items = benchListElement.querySelectorAll('.bench-player-item.draggable');
    items.forEach(item => {
        item.removeEventListener('dragstart', handleDragStartBench);
        item.addEventListener('dragstart', handleDragStartBench);
        item.removeEventListener('dragend', handleDragEnd);
        item.addEventListener('dragend', handleDragEnd);
    });
}

// Generell drag start fra lister (benk, tropp)
function handleDragStart(event) {
    // draggedPlayerId, draggedElement, dragSource er globale (config.js)
    draggedPlayerId = event.target.getAttribute('data-player-id');
    const player = getPlayerById(draggedPlayerId); // Fra utils.js
    if (!player) { // Sikkerhetssjekk
        console.warn(`handleDragStart: Spiller med ID ${draggedPlayerId} ikke funnet.`);
        event.preventDefault();
        return;
    }
    draggedElement = event.target;
    dragSource = 'squad'; // Antar 'squad' hvis ikke spesifisert av en mer spesifikk handler
    
    // Sett dataTransfer
    try {
        event.dataTransfer.setData('text/plain', draggedPlayerId);
        event.dataTransfer.effectAllowed = 'move';
    } catch (e) {
        console.error("Feil ved event.dataTransfer.setData i handleDragStart:", e);
        event.preventDefault(); // Forhindre drag hvis data ikke kan settes
        return;
    }

    // Visuell feedback (forsinket for å la nettleseren fange drag-bildet først)
    setTimeout(() => {
        if (draggedElement) draggedElement.classList.add('dragging');
    }, 0);
}

function handleDragStartBench(event) {
    // dragSource settes spesifikt for benk
    handleDragStart(event); // Kall generell funksjon
    if (draggedPlayerId) { // Hvis drag ikke ble avbrutt i handleDragStart
        dragSource = 'bench';
    }
}

function handleDragStartOnPitchList(event) {
    handleDragStart(event); // Kall generell funksjon
    if (draggedPlayerId) {
        dragSource = 'onpitch-list';
    }
}

function handleDragStartPiece(event) {
    // draggedPlayerId, draggedElement, dragSource er globale (config.js)
    const pieceElement = event.target.closest('.player-piece');
    if (!pieceElement) return;

    // Sjekk om elementet faktisk er draggable (f.eks. ikke hvis tegne-modus er aktiv over det)
    if (!pieceElement.hasAttribute('draggable') || pieceElement.getAttribute('draggable') === 'false') {
        event.preventDefault();
        return;
    }
    draggedPlayerId = pieceElement.getAttribute('data-player-id');
    if (!getPlayerById(draggedPlayerId)) { // Fra utils.js
        console.warn(`handleDragStartPiece: Spiller med ID ${draggedPlayerId} ikke funnet.`);
        event.preventDefault();
        return;
    }
    draggedElement = pieceElement;
    dragSource = 'pitch';

    try {
        event.dataTransfer.setData('text/plain', draggedPlayerId);
        event.dataTransfer.effectAllowed = 'move';
        draggedElement.classList.add('dragging'); // Legg til umiddelbart for brikker
    } catch (e) {
        console.error("Feil ved event.dataTransfer.setData i handleDragStartPiece:", e);
        event.preventDefault();
    }
    event.stopPropagation(); // Forhindre at eventet bobler opp til banen
}

function handleBallDragStart(event) {
    // dragSource, draggedElement er globale (config.js)
    try {
        event.dataTransfer.setData('text/x-dragged-item', 'ball'); // Egendefinert type for ball
        dragSource = 'ball';
        draggedElement = event.target; // ballElement
        event.dataTransfer.effectAllowed = 'move';
        event.target.classList.add('dragging');
    } catch (e) {
        console.error("Feil ved event.dataTransfer.setData i handleBallDragStart:", e);
        event.preventDefault();
    }
}

function handleDragOver(event, targetType) {
    event.preventDefault(); // Nødvendig for å tillate drop
    event.dataTransfer.dropEffect = 'move';

    let targetElement;
    // pitchElement, benchElement, squadListContainer, onPitchSectionElement er globale (config.js)
    if (targetType === 'pitch') targetElement = pitchElement;
    else if (targetType === 'bench') targetElement = benchElement;
    else if (targetType === 'squad') targetElement = squadListContainer;
    else if (targetType === 'onpitch-list') targetElement = onPitchSectionElement;
    else if (targetType === 'formation-marker') targetElement = event.target.closest('.formation-position-marker');
    
    if (targetElement && !targetElement.classList.contains('drag-over')) {
        targetElement.classList.add('drag-over');
    }
}

function handleDragLeave(event, targetType) {
    let targetElement;
    if (targetType === 'pitch') targetElement = pitchElement;
    else if (targetType === 'bench') targetElement = benchElement;
    else if (targetType === 'squad') targetElement = squadListContainer;
    else if (targetType === 'onpitch-list') targetElement = onPitchSectionElement;
    else if (targetType === 'formation-marker') targetElement = event.target.closest('.formation-position-marker');

    if (!targetElement) return;

    // Fjern 'drag-over' bare hvis musen faktisk forlater elementet (og ikke bare går over et barneelement)
    if (!event.relatedTarget || !targetElement.contains(event.relatedTarget)) {
        targetElement.classList.remove('drag-over');
    }
}

function handleDragEnd(event) {
    // Fjern 'drag-over' fra alle potensielle mål
    if (pitchElement) pitchElement.classList.remove('drag-over');
    if (benchElement) benchElement.classList.remove('drag-over');
    if (squadListContainer) squadListContainer.classList.remove('drag-over');
    if (onPitchSectionElement) onPitchSectionElement.classList.remove('drag-over');
    if (pitchSurface) { // pitchSurface er global (config.js)
        const markers = pitchSurface.querySelectorAll('.formation-position-marker.drag-over');
        markers.forEach(m => m.classList.remove('drag-over'));
    }

    // Fjern 'dragging' klassen fra det dragede elementet
    if (draggedElement) { // draggedElement er global (config.js)
        draggedElement.classList.remove('dragging');
    }
    // resetDragState(); // Nullstill globale drag-variabler - kalles etter drop
}

function resetDragState() {
    draggedPlayerId = null;
    draggedElement = null;
    dragSource = null;
}


// --- Drop Håndtering ---
function handleDropOnPitch(event) {
    event.preventDefault();
    if (pitchElement) pitchElement.classList.remove('drag-over');
    // pitchElement, isPitchRotated er globale (config.js)
    // playersOnPitch, playersOnBench, MAX_PLAYERS_ON_PITCH er globale (config.js)

    const pitchRect = pitchElement.getBoundingClientRect();
    if (!pitchRect || pitchRect.width === 0 || pitchRect.height === 0) {
        console.warn("handleDropOnPitch: pitchRect er ugyldig.");
        resetDragState();
        return;
    }

    const dropX_viewport = event.clientX;
    const dropY_viewport = event.clientY;
    let dropX_relative = dropX_viewport - pitchRect.left;
    let dropY_relative = dropY_viewport - pitchRect.top;
    let xPercent, yPercent;

    if (isPitchRotated) {
        xPercent = (dropY_relative / pitchRect.height) * 100;
        yPercent = (1 - (dropX_relative / pitchRect.width)) * 100;
    } else {
        xPercent = (dropX_relative / pitchRect.width) * 100;
        yPercent = (dropY_relative / pitchRect.height) * 100;
    }
    // Begrens til innenfor banen (0-100%)
    xPercent = Math.max(0, Math.min(100, xPercent));
    yPercent = Math.max(0, Math.min(100, yPercent));

    const draggedItemType = event.dataTransfer.getData('text/x-dragged-item');
    if (draggedItemType === 'ball') {
        updateBallPosition(xPercent, yPercent); // Fra pitch_elements.js
        // ballSettings (global) oppdateres i updateBallPosition
        saveCurrentState(); // Fra storage.js
        resetDragState();
        return;
    }

    let playerId;
    try {
        playerId = event.dataTransfer.getData('text/plain');
    } catch (e) {
        console.warn("handleDropOnPitch: Kunne ikke hente playerId fra dataTransfer.", e);
        resetDragState();
        return;
    }
    if (!playerId) {
        console.warn("handleDropOnPitch: Ingen playerId mottatt.");
        resetDragState();
        return;
    }

    const player = getPlayerById(playerId); // Fra utils.js
    if (!player) {
        console.warn(`handleDropOnPitch: Spiller med ID ${playerId} ikke funnet.`);
        resetDragState();
        return;
    }

    // Sjekk maks spillere på banen hvis spilleren kommer fra tropp eller benk
    if ((dragSource === 'squad' || dragSource === 'bench') && Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) {
        if (!playersOnPitch[playerId]) { // Bare vis alert hvis spilleren ikke allerede er på banen
            alert(`Kan ikke legge til flere spillere på banen (maks ${MAX_PLAYERS_ON_PITCH}).`);
            resetDragState();
            return;
        }
    }
    
    player.position = { x: xPercent, y: yPercent };
    let stateChanged = false;

    if (playersOnPitch[playerId]) { // Spilleren er allerede på banen, flyttes
        const piece = playersOnPitch[playerId];
        piece.style.left = `${xPercent}%`;
        piece.style.top = `${yPercent}%`;
        stateChanged = true;
    } else { // Ny spiller på banen
        const newPiece = createPlayerPieceElement(player, xPercent, yPercent); // Fra pitch_elements.js
        if (pitchSurface) pitchSurface.appendChild(newPiece); // pitchSurface er global (config.js)
        else console.error("handleDropOnPitch: FEIL - pitchSurface ikke funnet!");
        
        playersOnPitch[playerId] = newPiece;
        if (dragSource === 'bench') {
            const benchIndex = playersOnBench.indexOf(playerId);
            if (benchIndex > -1) playersOnBench.splice(benchIndex, 1);
        }
        stateChanged = true;
    }

    if (stateChanged) {
        saveCurrentState(); // Fra storage.js
        if (typeof renderUI === "function") renderUI(); // Fra ui_render.js
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch(); // Fra matches.js
    }
    resetDragState();
}

function handleDropOnOnPitchList(event) {
    event.preventDefault();
    if (onPitchSectionElement) onPitchSectionElement.classList.remove('drag-over'); // onPitchSectionElement er global (config.js)
    
    let playerId = event.dataTransfer.getData('text/plain');
    if (!playerId) { resetDragState(); return; }
    const player = getPlayerById(playerId);
    if (!player) { resetDragState(); return; }

    if (playersOnPitch[playerId]) { resetDragState(); return; } // Allerede på banen

    if (Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) {
        alert(`Maks ${MAX_PLAYERS_ON_PITCH} spillere på banen.`);
        resetDragState();
        return;
    }

    let stateChanged = false;
    if (dragSource === 'bench' || dragSource === 'squad') {
        // Finn en default ledig posisjon eller senter av banen
        const defaultX = player.position ? player.position.x : 50;
        const defaultY = player.position ? player.position.y : 75; // Litt lenger ned som default
        player.position = { x: defaultX, y: defaultY };

        const newPiece = createPlayerPieceElement(player, defaultX, defaultY);
        if (pitchSurface) {
            pitchSurface.appendChild(newPiece);
            playersOnPitch[playerId] = newPiece;
            stateChanged = true;
            if (dragSource === 'bench') {
                const benchIndex = playersOnBench.indexOf(playerId);
                if (benchIndex > -1) playersOnBench.splice(benchIndex, 1);
            }
        } else {
            console.error("handleDropOnOnPitchList: FEIL - pitchSurface ikke funnet!");
        }
    }

    if (stateChanged) {
        saveCurrentState();
        if (typeof renderUI === "function") renderUI();
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();
    }
    resetDragState();
}

function handleDropOnBench(event) {
    event.preventDefault();
    if (benchElement) benchElement.classList.remove('drag-over'); // benchElement er global (config.js)
    
    let playerId = event.dataTransfer.getData('text/plain');
    if (!playerId) { resetDragState(); return; }
    // const player = getPlayerById(playerId); // Trenger ikke spillerobjektet her, kun ID
    // if (!player) { resetDragState(); return; }

    let stateChanged = false;
    if (dragSource === 'pitch' || dragSource === 'onpitch-list') { // Fra banen eller banelisten
        if (!playersOnBench.includes(playerId)) {
            playersOnBench.push(playerId);
            // stateChanged = true; // Settes nedenfor uansett om spiller fjernes fra banen
        }
        if (playersOnPitch[playerId]) {
            playersOnPitch[playerId].remove(); // Fjern DOM-element
            delete playersOnPitch[playerId];
            stateChanged = true;
        }
    } else if (dragSource === 'squad') { // Fra tropplisten til benken
        if (!playersOnBench.includes(playerId) && !playersOnPitch[playerId]) { // Ikke allerede på benk eller bane
            playersOnBench.push(playerId);
            stateChanged = true;
        }
    }

    if (stateChanged) {
        saveCurrentState();
        if (typeof renderUI === "function") renderUI();
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();
    }
    resetDragState();
}

function handleDropOnSquadList(event) {
    event.preventDefault();
    if (squadListContainer) squadListContainer.classList.remove('drag-over'); // squadListContainer er global
    
    let playerId = event.dataTransfer.getData('text/plain');
    if (!playerId) { resetDragState(); return; }

    let stateChanged = false;
    if (dragSource === 'pitch' || dragSource === 'onpitch-list') { // Fra banen eller banelisten til tropp
        if (playersOnPitch[playerId]) {
            playersOnPitch[playerId].remove();
            delete playersOnPitch[playerId];
            stateChanged = true;
        }
    } else if (dragSource === 'bench') { // Fra benken til tropp
        const benchIndex = playersOnBench.indexOf(playerId);
        if (benchIndex > -1) {
            playersOnBench.splice(benchIndex, 1);
            stateChanged = true;
        }
    }

    if (stateChanged) {
        saveCurrentState();
        if (typeof renderUI === "function") renderUI();
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();
    }
    resetDragState();
}

function handleDropOnFormationMarker(event, positionData) {
    event.preventDefault();
    const markerElement = event.target.closest('.formation-position-marker');
    if (markerElement) markerElement.classList.remove('drag-over');

    let playerId = event.dataTransfer.getData('text/plain');
    if (!playerId) { resetDragState(); return; }
    const player = getPlayerById(playerId);
    if (!player) { resetDragState(); return; }

    const targetX = positionData.x;
    const targetY = positionData.y;

    if (!playersOnPitch[playerId] && Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) {
        alert(`Kan ikke legge til flere spillere på banen (maks ${MAX_PLAYERS_ON_PITCH}).`);
        resetDragState();
        return;
    }

    let stateChanged = false;
    player.position = { x: targetX, y: targetY };

    if (playersOnPitch[playerId]) { // Flytt eksisterende brikke
        const piece = playersOnPitch[playerId];
        piece.style.left = `${targetX}%`;
        piece.style.top = `${targetY}%`;
        stateChanged = true;
    } else { // Ny brikke på banen
        const newPiece = createPlayerPieceElement(player, targetX, targetY);
        if (pitchSurface) {
            pitchSurface.appendChild(newPiece);
            playersOnPitch[playerId] = newPiece;
            stateChanged = true;
        } else {
            console.error("handleDropOnFormationMarker: FEIL - pitchSurface ikke funnet!");
            resetDragState(); return;
        }
    }

    if (dragSource === 'bench') {
        const benchIndex = playersOnBench.indexOf(playerId);
        if (benchIndex > -1) {
            playersOnBench.splice(benchIndex, 1);
            stateChanged = true; // Allerede satt hvis ny brikke, men ok for tydelighet
        }
    }
    // Hvis dragSource var 'squad', fjernes spilleren implisitt fra squadList ved neste renderUI

    if (stateChanged) {
        saveCurrentState();
        if (typeof renderUI === "function") renderUI();
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();
    }
    resetDragState();
}


// --- Spillerbrikke Valg & Farge ---
function handlePlayerPieceClick(event) {
    // selectedPlayerIds er global (config.js)
    const pieceElement = event.currentTarget; // .player-piece
    const playerId = pieceElement.getAttribute('data-player-id');
    if (!playerId) return;

    if (selectedPlayerIds.has(playerId)) {
        selectedPlayerIds.delete(playerId);
        pieceElement.classList.remove('selected');
    } else {
        selectedPlayerIds.add(playerId);
        pieceElement.classList.add('selected');
    }
    // console.log("Valgte spillere:", Array.from(selectedPlayerIds));
}

function clearPlayerSelection() {
    selectedPlayerIds.forEach(id => {
        const piece = playersOnPitch[id]; // playersOnPitch er global (config.js)
        if (piece) {
            piece.classList.remove('selected');
        }
    });
    selectedPlayerIds.clear();
}

function applyBorderColorToSelection(color) {
    if (selectedPlayerIds.size === 0) {
        alert("Ingen spillere valgt. Klikk på en eller flere spillere på banen først.");
        return;
    }
    let stateChanged = false;
    selectedPlayerIds.forEach(playerId => {
        const player = getPlayerById(playerId);
        const piece = playersOnPitch[playerId];
        if (player && piece) {
            if (player.borderColor !== color) {
                player.borderColor = color;
                const imgContainer = piece.querySelector('.player-image-container');
                if (imgContainer) imgContainer.style.borderColor = color;
                stateChanged = true;
            }
        }
    });

    if (stateChanged) {
        saveCurrentState(); // Lagre endring i borderColor for spillerne
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();

    }
    clearPlayerSelection(); // Avvelg etter at fargen er satt
}

function handleSetSelectedPlayerBorderColor() {
    // playerBorderColorInput er global (config.js)
    if (playerBorderColorInput) {
        applyBorderColorToSelection(playerBorderColorInput.value);
    } else {
        console.warn("handleSetSelectedPlayerBorderColor: playerBorderColorInput ikke funnet.");
    }
}


// --- UI Toggles & View Switching ---
function toggleSidebar() {
    // appContainer, toggleSidebarButton er globale (config.js)
    // isSidebarHidden er global (config.js)
    isSidebarHidden = !isSidebarHidden;
    if (appContainer) {
        appContainer.classList.toggle('sidebar-hidden', isSidebarHidden);
        if (toggleSidebarButton) {
            toggleSidebarButton.innerHTML = isSidebarHidden ? '<i class="fas fa-angle-double-right"></i>' : '<i class="fas fa-angle-double-left"></i>'; // Bruker ikoner
        }
        // Lagre sidebar-status? Kan gjøres i saveCurrentState hvis ønskelig
    }
}

function togglePitchRotation() {
    // pitchContainer, pitchElement, isPitchRotated er globale (config.js)
    if (!pitchContainer || !pitchElement) {
        console.warn("togglePitchRotation: pitchContainer eller pitchElement ikke funnet.");
        return;
    }
    isPitchRotated = !isPitchRotated;
    pitchContainer.classList.toggle('rotated', isPitchRotated);
    
    // Oppdater bakgrunnsbilde basert på rotasjon
    if (isPitchRotated) {
        pitchElement.style.backgroundImage = `url('pitch-background.jpg')`;
    } else {
        pitchElement.style.backgroundImage = `url('pitch-background-portrait.jpg')`;
    }

    resizePitchElement(); // Fra pitch_elements.js (eller denne filen hvis den flyttes)
    saveCurrentState();   // Fra storage.js
    if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();
}

function switchView(viewName) {
    // appContainer, navTacticsButton, navSquadButton, navMatchesButton er globale (config.js)
    if (!appContainer || !navTacticsButton || !navSquadButton || !navMatchesButton) {
        console.error("switchView: Nødvendige DOM-elementer ikke funnet.");
        return;
    }
    appContainer.classList.remove('view-tactics', 'view-squad', 'view-matches');
    navTacticsButton.classList.remove('active');
    navSquadButton.classList.remove('active');
    navMatchesButton.classList.remove('active');

    // Skjul/vis sidepanel-seksjoner basert på view
    const tacticsControls = document.getElementById('tactics-display-options');
    const formationSelectSection = document.getElementById('formation-select')?.parentElement; // Antar label er i samme div
    const matchPrepSection = document.getElementById('match-preparation-section');

    if (viewName === 'tactics') {
        appContainer.classList.add('view-tactics');
        navTacticsButton.classList.add('active');
        if (tacticsControls) tacticsControls.style.display = 'block';
        if (formationSelectSection) formationSelectSection.style.display = 'block'; // Eller den div-en som omslutter formasjonsvalg
        if (matchPrepSection) matchPrepSection.style.display = 'block'; // Vis kampforberedelser på taktikksiden
        resizePitchElement();
    } else if (viewName === 'squad') {
        appContainer.classList.add('view-squad');
        navSquadButton.classList.add('active');
        if (typeof renderFullSquadList === "function") renderFullSquadList(); // Fra ui_render.js
        if (tacticsControls) tacticsControls.style.display = 'none';
        if (formationSelectSection) formationSelectSection.style.display = 'none';
        if (matchPrepSection) matchPrepSection.style.display = 'none';
    } else if (viewName === 'matches') {
        appContainer.classList.add('view-matches');
        navMatchesButton.classList.add('active');
        if (typeof renderMatchList === "function") renderMatchList(); // Fra ui_render.js
        if (tacticsControls) tacticsControls.style.display = 'none';
        if (formationSelectSection) formationSelectSection.style.display = 'none';
        if (matchPrepSection) matchPrepSection.style.display = 'none';
    } else { // Fallback til taktikksiden
        appContainer.classList.add('view-tactics');
        navTacticsButton.classList.add('active');
        if (tacticsControls) tacticsControls.style.display = 'block';
        if (formationSelectSection) formationSelectSection.style.display = 'block';
        if (matchPrepSection) matchPrepSection.style.display = 'block';
        resizePitchElement();
        console.warn(`Ukjent viewName: ${viewName}. Viser taktikksiden.`);
    }
    console.log(`Byttet til view: ${viewName}`);
    // saveCurrentView(viewName); // Vurder å lagre aktivt view
}

function toggleFullscreen() {
    // appContainer, fullscreenButton er globale (config.js)
    if (!appContainer) return;
    const elem = document.documentElement; // For å få hele siden i fullskjerm

    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
        if (fullscreenButton) fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        if (fullscreenButton) fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
    }
}

// --- Anvende Lagret Tilstand ---
/**
 * Anvender en gitt tilstand på applikasjonen (spillerposisjoner, benk, rotasjon etc.).
 * @param {object} stateData - Objektet som inneholder tilstandsdata.
 */
function applyState(stateData) {
    if (!stateData) {
        console.warn("applyState kalt med ugyldig stateData.");
        return;
    }

    // Nullstill nåværende bane og lister
    clearPitch(); // Fra storage.js (eller flyttes til interactions.js/main.js)
    playersOnPitch = {}; // Globale (config.js)
    playersOnBench = []; // Globale (config.js)

    isPitchRotated = stateData.isPitchRotated || false; // Global (config.js)
    
    // Ballinnstillinger og posisjon
    if (stateData.ballSettings) {
        ballSettings.size = stateData.ballSettings.size || 35;
        ballSettings.style = stateData.ballSettings.style || 'default';
        ballSettings.color = stateData.ballSettings.color || '#FFA500';
    }
    applyBallStyle(); // Fra pitch_elements.js
    if (stateData.ballPosition && typeof stateData.ballPosition.x === 'number' && typeof stateData.ballPosition.y === 'number') {
        updateBallPosition(stateData.ballPosition.x, stateData.ballPosition.y); // Fra pitch_elements.js
    } else {
        updateBallPosition(50, 50); // Default ballposisjon
    }

    if (pitchContainer) pitchContainer.classList.toggle('rotated', isPitchRotated); // pitchContainer er global (config.js)
    // Oppdater bakgrunnsbilde for banen
    if (pitchElement) { // pitchElement er global (config.js)
        pitchElement.style.backgroundImage = `url('${isPitchRotated ? 'pitch-background.jpg' : 'pitch-background-portrait.jpg'}')`;
    }
    resizePitchElement(); // Fra pitch_elements.js eller denne filen. Sørger for at canvas også resizes.


    // Spillere på banen
    if (stateData.playersOnPitchData) {
        for (const playerId in stateData.playersOnPitchData) {
            const player = getPlayerById(playerId); // Fra utils.js
            const positionData = stateData.playersOnPitchData[playerId];
            if (player && positionData && typeof positionData.x === 'number' && typeof positionData.y === 'number') {
                player.position = { x: positionData.x, y: positionData.y };
                player.borderColor = positionData.borderColor || 'black'; // Hent lagret farge
                const piece = createPlayerPieceElement(player, player.position.x, player.position.y); // Fra pitch_elements.js
                if (pitchSurface) pitchSurface.appendChild(piece); // pitchSurface er global (config.js)
                else console.error("applyState: FEIL - pitchSurface ikke funnet ved plassering av brikke!");
                playersOnPitch[playerId] = piece;
            }
        }
    }

    // Spillere på benken
    if (stateData.playersOnBenchIds) {
        playersOnBench = stateData.playersOnBenchIds.filter(id => getPlayerById(id)); // Filtrer for gyldige spillere
    }
    
    // Formasjon (hvis lagret med oppsettet)
    if (stateData.currentFormationName && FORMATIONS[stateData.currentFormationName]) { // FORMATIONS fra config.js
        currentFormation = FORMATIONS[stateData.currentFormationName]; // currentFormation fra config.js
        if(formationSelect) formationSelect.value = stateData.currentFormationName; // formationSelect fra config.js
        drawFormationPositions(currentFormation); // Fra pitch_elements.js
    } else if (formationSelect) {
        currentFormation = null;
        formationSelect.value = ""; // Nullstill dropdown
        clearFormationPositions(); // Fra pitch_elements.js
    }

    // Tegninger (hvis lagret med oppsettet)
    // savedDrawings er global (config.js)
    savedDrawings = stateData.savedDrawings || []; // Hvis ikke i stateData, sett til tom array
    redrawAllDrawings(); // Fra pitch_elements.js

    // Til slutt, oppdater UI-listene
    if (typeof renderUI === "function") renderUI(); // Fra ui_render.js
    else console.error("applyState: renderUI function not found.");

    console.log("Tilstand anvendt.");
}


/**
 * Wrapper for å laste siste lagrede tilstand og anvende den.
 * @param {boolean} [forceEmptyForMatch=false] - Hvis true, og en kamp er aktiv uten egen state, ikke last generell state.
 */
function loadLastStateAndApply(forceEmptyForMatch = false) {
    // Hvis vi er i en kampmodus og skal tvinge tom for kamp, og kampen ikke har state, ikke last generell.
    if (forceEmptyForMatch && activeMatchId) {
        const match = matches.find(m => m.id === activeMatchId);
        if (match && !match.tacticsState) {
            console.log("loadLastStateAndApply: Tvinger tom/default state for kamp uten lagret taktikk.");
            applyState({}); // Anvend en tom state for å nullstille
            return;
        }
    }

    const stateData = loadLastState(); // loadLastState fra storage.js (returnerer stateData)
    applyState(stateData);
}


// --- Andre UI-interaksjoner ---
function resizePitchElement() {
    // pitchContainer, pitchElement, isPitchRotated er globale (config.js)
    if (!pitchContainer || !pitchElement) {
        console.warn("resizePitchElement: pitchContainer eller pitchElement ikke funnet!");
        return;
    }
    const containerWidth = pitchContainer.clientWidth;
    const containerHeight = pitchContainer.clientHeight;
    let targetWidth, targetHeight;

    if (isPitchRotated) { // Landskap
        const currentAR = PITCH_ASPECT_RATIO_LANDSCAPE; // Fra config.js
        // Beregn bredde basert på høyde
        targetWidth = containerHeight * currentAR;
        targetHeight = containerHeight;
        // Hvis beregnet bredde er for stor, beregn høyde basert på bredde
        if (targetWidth > containerWidth) {
            targetWidth = containerWidth;
            targetHeight = containerWidth / currentAR;
        }
        // Bytt om for CSS siden banen er rotert 90 grader
        pitchElement.style.width = `${targetHeight}px`; 
        pitchElement.style.height = `${targetWidth}px`;
    } else { // Portrett
        const currentAR = PITCH_ASPECT_RATIO_PORTRAIT; // Fra config.js
        // Beregn bredde basert på høyde
        targetWidth = containerHeight * currentAR;
        targetHeight = containerHeight;
        // Hvis beregnet bredde er for stor, beregn høyde basert på bredde
        if (targetWidth > containerWidth) {
            targetWidth = containerWidth;
            targetHeight = containerWidth / currentAR;
        }
        pitchElement.style.width = `${targetWidth}px`;
        pitchElement.style.height = `${targetHeight}px`;
    }
    // Sørg for at tegnecanvaset også oppdateres
    if (typeof setupDrawingCanvas === "function") setupDrawingCanvas(); // Fra pitch_elements.js
}


// === Interaksjoner (Drag & Drop, Valg, Toggles, View Switching) END ===
/* Version: #18 */
