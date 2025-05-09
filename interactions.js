/* Version: #22 */
// === Interaksjoner (Drag & Drop, Valg, Toggles, View Switching) START ===

/**
 * Fjerner alle spillerbrikker fra banen.
 * Denne funksjonen endrer IKKE playersOnPitch-arrayet direkte,
 * det må gjøres av kallende funksjon (f.eks. applyState).
 */
function clearPitch() {
    // pitchSurface er global (config.js)
    if (!pitchSurface) {
        console.warn("clearPitch: pitchSurface ikke funnet, kan ikke fjerne brikker.");
        return;
    }
    const pieces = pitchSurface.querySelectorAll('.player-piece');
    pieces.forEach(piece => piece.remove());
    console.log("Alle spillerbrikker fjernet fra banens DOM.");
}


// --- Drag and Drop Håndtering ---
function addDragListenersToSquadItems() {
    if (!squadListElement) return;
    const items = squadListElement.querySelectorAll('.squad-player-item.draggable');
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
    draggedPlayerId = event.target.getAttribute('data-player-id');
    const player = getPlayerById(draggedPlayerId);
    if (!player) {
        console.warn(`handleDragStart: Spiller med ID ${draggedPlayerId} ikke funnet.`);
        event.preventDefault();
        return;
    }
    draggedElement = event.target;
    dragSource = 'squad'; 
    
    try {
        event.dataTransfer.setData('text/plain', draggedPlayerId);
        event.dataTransfer.effectAllowed = 'move';
    } catch (e) {
        console.error("Feil ved event.dataTransfer.setData i handleDragStart:", e);
        event.preventDefault();
        return;
    }
    setTimeout(() => {
        if (draggedElement) draggedElement.classList.add('dragging');
    }, 0);
}

function handleDragStartBench(event) {
    handleDragStart(event);
    if (draggedPlayerId) {
        dragSource = 'bench';
    }
}

function handleDragStartOnPitchList(event) {
    handleDragStart(event);
    if (draggedPlayerId) {
        dragSource = 'onpitch-list';
    }
}

function handleDragStartPiece(event) {
    const pieceElement = event.target.closest('.player-piece');
    if (!pieceElement) return;
    if (!pieceElement.hasAttribute('draggable') || pieceElement.getAttribute('draggable') === 'false') {
        event.preventDefault();
        return;
    }
    draggedPlayerId = pieceElement.getAttribute('data-player-id');
    if (!getPlayerById(draggedPlayerId)) {
        console.warn(`handleDragStartPiece: Spiller med ID ${draggedPlayerId} ikke funnet.`);
        event.preventDefault();
        return;
    }
    draggedElement = pieceElement;
    dragSource = 'pitch';

    try {
        event.dataTransfer.setData('text/plain', draggedPlayerId);
        event.dataTransfer.effectAllowed = 'move';
        draggedElement.classList.add('dragging');
    } catch (e) {
        console.error("Feil ved event.dataTransfer.setData i handleDragStartPiece:", e);
        event.preventDefault();
    }
    event.stopPropagation();
}

function handleBallDragStart(event) {
    try {
        event.dataTransfer.setData('text/x-dragged-item', 'ball');
        dragSource = 'ball';
        draggedElement = event.target;
        event.dataTransfer.effectAllowed = 'move';
        event.target.classList.add('dragging');
    } catch (e) {
        console.error("Feil ved event.dataTransfer.setData i handleBallDragStart:", e);
        event.preventDefault();
    }
}

function handleDragOver(event, targetType) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    let targetElement;
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
    if (!event.relatedTarget || !targetElement.contains(event.relatedTarget)) {
        targetElement.classList.remove('drag-over');
    }
}

function handleDragEnd(event) {
    if (pitchElement) pitchElement.classList.remove('drag-over');
    if (benchElement) benchElement.classList.remove('drag-over');
    if (squadListContainer) squadListContainer.classList.remove('drag-over');
    if (onPitchSectionElement) onPitchSectionElement.classList.remove('drag-over');
    if (pitchSurface) {
        const markers = pitchSurface.querySelectorAll('.formation-position-marker.drag-over');
        markers.forEach(m => m.classList.remove('drag-over'));
    }
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }
    // resetDragState(); // Kalles vanligvis etter en vellykket drop
}

function resetDragState() {
    draggedPlayerId = null;
    draggedElement = null;
    dragSource = null;
}

function handleDropOnPitch(event) {
    event.preventDefault();
    if (pitchElement) pitchElement.classList.remove('drag-over');

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
    xPercent = Math.max(0, Math.min(100, xPercent));
    yPercent = Math.max(0, Math.min(100, yPercent));

    const draggedItemType = event.dataTransfer.getData('text/x-dragged-item');
    if (draggedItemType === 'ball') {
        if (typeof updateBallPosition === "function") updateBallPosition(xPercent, yPercent);
        if (typeof saveCurrentState === "function") saveCurrentState();
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

    const player = getPlayerById(playerId);
    if (!player) {
        console.warn(`handleDropOnPitch: Spiller med ID ${playerId} ikke funnet.`);
        resetDragState();
        return;
    }

    if ((dragSource === 'squad' || dragSource === 'bench') && Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) {
        if (!playersOnPitch[playerId]) { 
            alert(`Kan ikke legge til flere spillere på banen (maks ${MAX_PLAYERS_ON_PITCH}).`);
            resetDragState();
            return;
        }
    }
    
    player.position = { x: xPercent, y: yPercent };
    let stateChanged = false;

    if (playersOnPitch[playerId]) {
        const piece = playersOnPitch[playerId];
        piece.style.left = `${xPercent}%`;
        piece.style.top = `${yPercent}%`;
        stateChanged = true;
    } else { 
        if (typeof createPlayerPieceElement === "function") {
            const newPiece = createPlayerPieceElement(player, xPercent, yPercent);
            if (pitchSurface) pitchSurface.appendChild(newPiece);
            else console.error("handleDropOnPitch: FEIL - pitchSurface ikke funnet!");
            playersOnPitch[playerId] = newPiece;
            if (dragSource === 'bench') {
                const benchIndex = playersOnBench.indexOf(playerId);
                if (benchIndex > -1) playersOnBench.splice(benchIndex, 1);
            }
            stateChanged = true;
        } else {
            console.error("handleDropOnPitch: createPlayerPieceElement function not found.");
        }
    }

    if (stateChanged) {
        if (typeof saveCurrentState === "function") saveCurrentState();
        if (typeof renderUI === "function") renderUI();
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();
    }
    resetDragState();
}

function handleDropOnOnPitchList(event) {
    event.preventDefault();
    if (onPitchSectionElement) onPitchSectionElement.classList.remove('drag-over');
    
    let playerId = event.dataTransfer.getData('text/plain');
    if (!playerId) { resetDragState(); return; }
    const player = getPlayerById(playerId);
    if (!player) { resetDragState(); return; }

    if (playersOnPitch[playerId]) { resetDragState(); return; }

    if (Object.keys(playersOnPitch).length >= MAX_PLAYERS_ON_PITCH) {
        alert(`Maks ${MAX_PLAYERS_ON_PITCH} spillere på banen.`);
        resetDragState();
        return;
    }

    let stateChanged = false;
    if (dragSource === 'bench' || dragSource === 'squad') {
        const defaultX = player.position ? player.position.x : 50;
        const defaultY = player.position ? player.position.y : 75;
        player.position = { x: defaultX, y: defaultY };

        if (typeof createPlayerPieceElement === "function") {
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
        } else {
            console.error("handleDropOnOnPitchList: createPlayerPieceElement function not found.");
        }
    }

    if (stateChanged) {
        if (typeof saveCurrentState === "function") saveCurrentState();
        if (typeof renderUI === "function") renderUI();
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();
    }
    resetDragState();
}

function handleDropOnBench(event) {
    event.preventDefault();
    if (benchElement) benchElement.classList.remove('drag-over');
    
    let playerId = event.dataTransfer.getData('text/plain');
    if (!playerId) { resetDragState(); return; }

    let stateChanged = false;
    if (dragSource === 'pitch' || dragSource === 'onpitch-list') {
        if (!playersOnBench.includes(playerId)) {
            playersOnBench.push(playerId);
        }
        if (playersOnPitch[playerId]) {
            playersOnPitch[playerId].remove();
            delete playersOnPitch[playerId];
            stateChanged = true;
        }
    } else if (dragSource === 'squad') {
        if (!playersOnBench.includes(playerId) && !playersOnPitch[playerId]) {
            playersOnBench.push(playerId);
            stateChanged = true;
        }
    }

    if (stateChanged) {
        if (typeof saveCurrentState === "function") saveCurrentState();
        if (typeof renderUI === "function") renderUI();
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();
    }
    resetDragState();
}

function handleDropOnSquadList(event) {
    event.preventDefault();
    if (squadListContainer) squadListContainer.classList.remove('drag-over');
    
    let playerId = event.dataTransfer.getData('text/plain');
    if (!playerId) { resetDragState(); return; }

    let stateChanged = false;
    if (dragSource === 'pitch' || dragSource === 'onpitch-list') {
        if (playersOnPitch[playerId]) {
            playersOnPitch[playerId].remove();
            delete playersOnPitch[playerId];
            stateChanged = true;
        }
    } else if (dragSource === 'bench') {
        const benchIndex = playersOnBench.indexOf(playerId);
        if (benchIndex > -1) {
            playersOnBench.splice(benchIndex, 1);
            stateChanged = true;
        }
    }

    if (stateChanged) {
        if (typeof saveCurrentState === "function") saveCurrentState();
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

    if (playersOnPitch[playerId]) {
        const piece = playersOnPitch[playerId];
        piece.style.left = `${targetX}%`;
        piece.style.top = `${targetY}%`;
        stateChanged = true;
    } else {
        if (typeof createPlayerPieceElement === "function") {
            const newPiece = createPlayerPieceElement(player, targetX, targetY);
            if (pitchSurface) {
                pitchSurface.appendChild(newPiece);
                playersOnPitch[playerId] = newPiece;
                stateChanged = true;
            } else {
                console.error("handleDropOnFormationMarker: FEIL - pitchSurface ikke funnet!");
                resetDragState(); return;
            }
        } else {
             console.error("handleDropOnFormationMarker: createPlayerPieceElement function not found.");
        }
    }

    if (dragSource === 'bench') {
        const benchIndex = playersOnBench.indexOf(playerId);
        if (benchIndex > -1) {
            playersOnBench.splice(benchIndex, 1);
            stateChanged = true; 
        }
    }

    if (stateChanged) {
        if (typeof saveCurrentState === "function") saveCurrentState();
        if (typeof renderUI === "function") renderUI();
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();
    }
    resetDragState();
}

function handlePlayerPieceClick(event) {
    const pieceElement = event.currentTarget;
    const playerId = pieceElement.getAttribute('data-player-id');
    if (!playerId) return;

    if (selectedPlayerIds.has(playerId)) {
        selectedPlayerIds.delete(playerId);
        pieceElement.classList.remove('selected');
    } else {
        selectedPlayerIds.add(playerId);
        pieceElement.classList.add('selected');
    }
}

function clearPlayerSelection() {
    selectedPlayerIds.forEach(id => {
        const piece = playersOnPitch[id];
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
        if (typeof saveCurrentState === "function") saveCurrentState();
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();
    }
    clearPlayerSelection();
}

function handleSetSelectedPlayerBorderColor() {
    if (playerBorderColorInput) {
        applyBorderColorToSelection(playerBorderColorInput.value);
    } else {
        console.warn("handleSetSelectedPlayerBorderColor: playerBorderColorInput ikke funnet.");
    }
}

function toggleSidebar() {
    isSidebarHidden = !isSidebarHidden;
    if (appContainer) {
        appContainer.classList.toggle('sidebar-hidden', isSidebarHidden);
        if (toggleSidebarButton) {
            toggleSidebarButton.innerHTML = isSidebarHidden ? '<i class="fas fa-angle-double-right"></i>' : '<i class="fas fa-angle-double-left"></i>';
        }
    }
}

function togglePitchRotation() {
    if (!pitchContainer || !pitchElement) {
        console.warn("togglePitchRotation: pitchContainer eller pitchElement ikke funnet.");
        return;
    }
    isPitchRotated = !isPitchRotated;
    pitchContainer.classList.toggle('rotated', isPitchRotated);
    
    if (isPitchRotated) {
        pitchElement.style.backgroundImage = `url('pitch-background.jpg')`;
    } else {
        pitchElement.style.backgroundImage = `url('pitch-background-portrait.jpg')`;
    }

    if (typeof resizePitchElement === "function") resizePitchElement();
    if (typeof saveCurrentState === "function") saveCurrentState();
    if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) saveCurrentSetupToActiveMatch();
}

function switchView(viewName) {
    if (!appContainer || !navTacticsButton || !navSquadButton || !navMatchesButton) {
        console.error("switchView: Nødvendige DOM-elementer ikke funnet.");
        return;
    }
    appContainer.classList.remove('view-tactics', 'view-squad', 'view-matches');
    navTacticsButton.classList.remove('active');
    navSquadButton.classList.remove('active');
    navMatchesButton.classList.remove('active');

    const tacticsControls = document.getElementById('tactics-display-options');
    // Finner formasjonsvelgerens container mer robust (antar at select har en label som er søsken inni en div)
    const formationSelectElement = document.getElementById('formation-select');
    const formationSelectSection = formationSelectElement ? formationSelectElement.closest('.control-section') || formationSelectElement.parentElement : null;
    const matchPrepSection = document.getElementById('match-preparation-section');


    if (viewName === 'tactics') {
        appContainer.classList.add('view-tactics');
        navTacticsButton.classList.add('active');
        if (tacticsControls) tacticsControls.style.display = 'block';
        if (formationSelectSection) formationSelectSection.style.display = 'block';
        if (matchPrepSection) matchPrepSection.style.display = 'block';
        if (typeof resizePitchElement === "function") resizePitchElement();
    } else if (viewName === 'squad') {
        appContainer.classList.add('view-squad');
        navSquadButton.classList.add('active');
        if (typeof renderFullSquadList === "function") renderFullSquadList();
        if (tacticsControls) tacticsControls.style.display = 'none';
        if (formationSelectSection) formationSelectSection.style.display = 'none';
        if (matchPrepSection) matchPrepSection.style.display = 'none';
    } else if (viewName === 'matches') {
        appContainer.classList.add('view-matches');
        navMatchesButton.classList.add('active');
        if (typeof renderMatchList === "function") renderMatchList();
        if (tacticsControls) tacticsControls.style.display = 'none';
        if (formationSelectSection) formationSelectSection.style.display = 'none';
        if (matchPrepSection) matchPrepSection.style.display = 'none';
    } else { 
        appContainer.classList.add('view-tactics');
        navTacticsButton.classList.add('active');
        if (tacticsControls) tacticsControls.style.display = 'block';
        if (formationSelectSection) formationSelectSection.style.display = 'block';
        if (matchPrepSection) matchPrepSection.style.display = 'block';
        if (typeof resizePitchElement === "function") resizePitchElement();
        console.warn(`Ukjent viewName: ${viewName}. Viser taktikksiden.`);
    }
    console.log(`Byttet til view: ${viewName}`);
}

function toggleFullscreen() {
    if (!appContainer) return;
    const elem = document.documentElement;

    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
        if (fullscreenButton) fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        if (fullscreenButton) fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
    }
}

function applyState(stateData) {
    if (!stateData) {
        console.warn("applyState kalt med ugyldig stateData. Bruker tom state.");
        stateData = {}; // Default til tom state for å unngå feil
    }

    clearPitch(); // Denne er nå i interactions.js
    playersOnPitch = {}; 
    playersOnBench = []; 

    isPitchRotated = stateData.isPitchRotated || false;
    
    if (stateData.ballSettings) {
        ballSettings.size = stateData.ballSettings.size || 35;
        ballSettings.style = stateData.ballSettings.style || 'default';
        ballSettings.color = stateData.ballSettings.color || '#FFA500';
    }
    if (typeof applyBallStyle === "function") applyBallStyle();
    
    if (stateData.ballPosition && typeof stateData.ballPosition.x === 'number' && typeof stateData.ballPosition.y === 'number') {
        if (typeof updateBallPosition === "function") updateBallPosition(stateData.ballPosition.x, stateData.ballPosition.y);
    } else {
        if (typeof updateBallPosition === "function") updateBallPosition(50, 50);
    }

    if (pitchContainer) pitchContainer.classList.toggle('rotated', isPitchRotated);
    if (pitchElement) {
        pitchElement.style.backgroundImage = `url('${isPitchRotated ? 'pitch-background.jpg' : 'pitch-background-portrait.jpg'}')`;
    }
    if (typeof resizePitchElement === "function") resizePitchElement();


    if (stateData.playersOnPitchData) {
        for (const playerId in stateData.playersOnPitchData) {
            const player = getPlayerById(playerId);
            const positionData = stateData.playersOnPitchData[playerId];
            if (player && positionData && typeof positionData.x === 'number' && typeof positionData.y === 'number') {
                player.position = { x: positionData.x, y: positionData.y };
                player.borderColor = positionData.borderColor || 'black';
                if (typeof createPlayerPieceElement === "function") {
                    const piece = createPlayerPieceElement(player, player.position.x, player.position.y);
                    if (pitchSurface) pitchSurface.appendChild(piece);
                    else console.error("applyState: FEIL - pitchSurface ikke funnet!");
                    playersOnPitch[playerId] = piece;
                } else {
                     console.error("applyState: createPlayerPieceElement function not found.");
                }
            }
        }
    }

    if (stateData.playersOnBenchIds) {
        playersOnBench = stateData.playersOnBenchIds.filter(id => getPlayerById(id));
    }
    
    // Formasjon
    // currentFormation er global (config.js)
    // formationSelect er global (config.js)
    // FORMATIONS er global (config.js)
    if (stateData.currentFormationName && FORMATIONS[stateData.currentFormationName]) {
        currentFormation = FORMATIONS[stateData.currentFormationName];
        if(formationSelect) formationSelect.value = stateData.currentFormationName;
        if (typeof drawFormationPositions === "function") drawFormationPositions(currentFormation);
    } else if (formationSelect) { // Hvis ingen formasjon i state, nullstill
        currentFormation = null;
        formationSelect.value = ""; 
        if (typeof clearFormationPositions === "function") clearFormationPositions();
    }

    savedDrawings = stateData.savedDrawings || [];
    if (typeof redrawAllDrawings === "function") redrawAllDrawings();

    if (typeof renderUI === "function") renderUI();
    else console.error("applyState: renderUI function not found.");

    console.log("Tilstand anvendt fra applyState.");
}

function loadLastStateAndApply(forceEmptyForMatch = false) {
    if (forceEmptyForMatch && activeMatchId) { // activeMatchId er global
        const match = matches.find(m => m.id === activeMatchId); // matches er global
        if (match && !match.tacticsState) {
            console.log("loadLastStateAndApply: Tvinger tom/default state for kamp uten lagret taktikk.");
            applyState({});
            return;
        }
    }
    const stateData = loadLastState(); // Fra storage.js
    applyState(stateData);
}

function resizePitchElement() {
    if (!pitchContainer || !pitchElement) {
        console.warn("resizePitchElement: pitchContainer eller pitchElement ikke funnet!");
        return;
    }
    const containerWidth = pitchContainer.clientWidth;
    const containerHeight = pitchContainer.clientHeight;
    let targetWidth, targetHeight;

    if (isPitchRotated) { 
        const currentAR = PITCH_ASPECT_RATIO_LANDSCAPE;
        targetWidth = containerHeight * currentAR;
        targetHeight = containerHeight;
        if (targetWidth > containerWidth) {
            targetWidth = containerWidth;
            targetHeight = containerWidth / currentAR;
        }
        pitchElement.style.width = `${targetHeight}px`; 
        pitchElement.style.height = `${targetWidth}px`;
    } else { 
        const currentAR = PITCH_ASPECT_RATIO_PORTRAIT;
        targetWidth = containerHeight * currentAR;
        targetHeight = containerHeight;
        if (targetWidth > containerWidth) {
            targetWidth = containerWidth;
            targetHeight = containerWidth / currentAR;
        }
        pitchElement.style.width = `${targetWidth}px`;
        pitchElement.style.height = `${targetHeight}px`;
    }
    if (typeof setupDrawingCanvas === "function") setupDrawingCanvas();
}

// === Interaksjoner (Drag & Drop, Valg, Toggles, View Switching) END ===
/* Version: #22 */
