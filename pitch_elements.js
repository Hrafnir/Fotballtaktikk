/* Version: #25 */
// === Spillerbrikke & Ball Håndtering START ===

function createPlayerPieceElement(player, xPercent, yPercent) {
    // console.log(`createPlayerPieceElement for ${player.id}, Name: ${player.name}, x:${xPercent}%, y:${yPercent}%`);
    const piece = document.createElement('div');
    piece.classList.add('player-piece', 'draggable');
    piece.setAttribute('data-player-id', player.id);
    piece.setAttribute('draggable', true);
    piece.style.left = `${xPercent}%`;
    piece.style.top = `${yPercent}%`;

    const imgContainer = document.createElement('div');
    imgContainer.classList.add('player-image-container');
    imgContainer.style.borderColor = player.borderColor || 'black';

    const imgDiv = document.createElement('div');
    imgDiv.classList.add('player-image');
    imgContainer.appendChild(imgDiv);
    piece.appendChild(imgContainer);

    const nameDiv = document.createElement('div');
    nameDiv.classList.add('player-name');
    nameDiv.textContent = player.nickname || player.name;
    piece.appendChild(nameDiv);

    piece.addEventListener('dragstart', handleDragStartPiece);
    piece.addEventListener('dragend', handleDragEnd);
    piece.addEventListener('dblclick', () => openPlayerDetailModal(player.id));
    piece.addEventListener('click', handlePlayerPieceClick);

    updatePlayerPieceVisuals(player.id, piece);
    return piece;
}
// Gjøres global for testing, selv om den kanskje bare kalles internt
window.createPlayerPieceElement = createPlayerPieceElement;


async function updatePlayerPieceVisuals(playerId, pieceElement = null) {
    const player = getPlayerById(playerId);
    if (!player) {
        // console.warn(`updatePlayerPieceVisuals: Fant ikke spiller ${playerId}.`); // Kan være for "noisy"
        return;
    }
    let currentPieceElement = pieceElement;
    if (!currentPieceElement) {
        currentPieceElement = playersOnPitch[playerId];
    }
    if (!currentPieceElement) {
        return;
    }

    const imgDiv = currentPieceElement.querySelector('.player-image');
    const nameDiv = currentPieceElement.querySelector('.player-name');
    const imgContainer = currentPieceElement.querySelector('.player-image-container');

    if (nameDiv) nameDiv.textContent = player.nickname || player.name;
    if (imgContainer) imgContainer.style.borderColor = player.borderColor || 'black';

    if (imgDiv) {
        imgDiv.style.backgroundImage = 'none';
        imgDiv.style.backgroundColor = '#aaa';
        try {
            if (player.imageKey) {
                const blob = await loadImageFromDB(player.imageKey);
                const objectURL = URL.createObjectURL(blob);
                imgDiv.style.backgroundImage = `url('${objectURL}')`;
                imgDiv.style.backgroundColor = 'transparent';
            } else if (player.imageUrl) {
                imgDiv.style.backgroundImage = `url('${player.imageUrl}')`;
                imgDiv.style.backgroundColor = 'transparent';
            }
        } catch (error) {
            console.warn(`Kunne ikke laste bilde for ${playerId} i updatePlayerPieceVisuals:`, error);
            imgDiv.style.backgroundColor = '#ccc';
        }
    } else {
        console.error(`updatePlayerPieceVisuals: imgDiv IKKE funnet i pieceElement for ${playerId}.`);
    }
}
window.updatePlayerPieceVisuals = updatePlayerPieceVisuals;


function updateBallPosition(xPercent, yPercent) {
    if (ballElement) {
        ballElement.style.left = `${xPercent}%`;
        ballElement.style.top = `${yPercent}%`;
        ballSettings.position.x = xPercent;
        ballSettings.position.y = yPercent;
    }
}
window.updateBallPosition = updateBallPosition;

function applyBallStyle() {
    if (!ballElement) return;
    ballElement.style.width = `${ballSettings.size}px`;
    ballElement.style.height = `${ballSettings.size}px`;
    ballElement.classList.remove('ball-style-classic', 'ball-style-color');
    ballElement.style.backgroundColor = '';
    ballElement.style.backgroundImage = '';
    ballElement.style.background = '';
    if (ballSettings.style === 'classic') {
        ballElement.classList.add('ball-style-classic');
    } else if (ballSettings.style === 'color') {
        ballElement.classList.add('ball-style-color');
        ballElement.style.backgroundColor = ballSettings.color;
    } else {
        ballElement.style.background = 'radial-gradient(circle at 30% 30%, white 90%, #e0e0e0 100%)';
    }
}
window.applyBallStyle = applyBallStyle; // Gjør denne global for sikkerhets skyld
// === Spillerbrikke & Ball Håndtering END ===


// === Formasjons- og Tegnehåndtering START ===
function handleFormationChange(event) {
    const selectedFormationName = event.target.value;
    currentFormation = FORMATIONS[selectedFormationName] || null;
    clearFormationPositions();
    resetPositionFilter();
    if (currentFormation) {
        console.log(`Formasjon valgt: ${currentFormation.name}`);
        drawFormationPositions(currentFormation);
    } else {
        console.log("Ingen formasjon valgt.");
    }
    if (typeof saveCurrentState === "function") saveCurrentState();
}
window.handleFormationChange = handleFormationChange;

function clearFormationPositions() {
    if (!pitchSurface) {
        console.error("clearFormationPositions: pitchSurface ikke funnet!");
        return;
    }
    const markers = pitchSurface.querySelectorAll('.formation-position-marker');
    markers.forEach(marker => marker.remove());
    console.log("Formasjonsmarkører fjernet.");
}
window.clearFormationPositions = clearFormationPositions;

function drawFormationPositions(formation) {
    if (!formation || !formation.positions || !pitchSurface) {
        console.error("drawFormationPositions: Mangler formasjonsdata eller pitchSurface.");
        return;
    }
    // console.log(`Tegner posisjoner for: ${formation.name}`); // Kan være "noisy"
    formation.positions.forEach(pos => {
        const marker = document.createElement('div');
        marker.classList.add('formation-position-marker', 'drop-target');
        marker.style.left = `${pos.x}%`;
        marker.style.top = `${pos.y}%`;
        marker.textContent = pos.id.toUpperCase();
        marker.title = `${pos.name} (Roller: ${pos.roles.join(', ')})`;
        marker.setAttribute('data-pos-id', pos.id);
        marker.setAttribute('data-pos-name', pos.name);
        marker.setAttribute('data-roles', JSON.stringify(pos.roles));

        marker.addEventListener('click', (e) => { e.stopPropagation(); handlePositionMarkerClick(marker, pos); });
        marker.addEventListener('dragover', (e) => handleDragOver(e, 'formation-marker'));
        marker.addEventListener('dragleave', (e) => handleDragLeave(e, 'formation-marker'));
        marker.addEventListener('drop', (e) => handleDropOnFormationMarker(e, pos));

        pitchSurface.appendChild(marker);
    });
}
window.drawFormationPositions = drawFormationPositions;

function handlePositionMarkerClick(markerElement, positionData) {
    // console.log(`Klikket på posisjon: ${positionData.name} (ID: ${positionData.id}), Roller: ${positionData.roles.join(', ')}`);
    const isAlreadySelected = markerElement.classList.contains('selected');
    clearSelectedPositionMarker();
    if (isAlreadySelected) {
        resetPositionFilter();
    } else {
        markerElement.classList.add('selected');
        selectedFormationPosition = positionData;
        if (typeof renderSquadList === "function") renderSquadList();
    }
}
// Ikke nødvendig å gjøre handlePositionMarkerClick global, kalles internt og fra event listener satt i drawFormationPositions.

function clearSelectedPositionMarker() {
    if (!pitchSurface) return;
    const selectedMarkers = pitchSurface.querySelectorAll('.formation-position-marker.selected');
    selectedMarkers.forEach(marker => marker.classList.remove('selected'));
}
// Ikke nødvendig å gjøre global.

function resetPositionFilter() {
    // console.log("Nullstiller posisjonsfilter.");
    selectedFormationPosition = null;
    clearSelectedPositionMarker();
    if (typeof renderSquadList === "function") renderSquadList();
}
window.resetPositionFilter = resetPositionFilter; // Kan være nyttig globalt

function setupDrawingCanvas() {
    if (!drawingCanvas) {
        console.error("setupDrawingCanvas: Finner ikke canvas-elementet (#drawing-canvas)!");
        return;
    }
    const pitchSurf = document.getElementById('pitch-surface');
    if (pitchSurf && (drawingCanvas.width !== pitchSurf.offsetWidth || drawingCanvas.height !== pitchSurf.offsetHeight)) {
        drawingCanvas.width = pitchSurf.offsetWidth;
        drawingCanvas.height = pitchSurf.offsetHeight;
        // console.log(`Drawing canvas size re-set to: ${drawingCanvas.width}x${drawingCanvas.height} basert på pitchSurface.`);
    } else if (!pitchSurf) {
        // console.warn("setupDrawingCanvas: pitchSurface ikke funnet for dimensjonering.");
    }

    drawingCtx = drawingCanvas.getContext('2d');
    if (!drawingCtx) {
        console.error("setupDrawingCanvas: Kunne ikke hente 2D context for tegnecanvas.");
        return;
    }
    drawingCtx.strokeStyle = currentDrawingColor;
    drawingCtx.lineWidth = DRAWING_LINE_WIDTH;
    drawingCtx.lineCap = 'round';
    drawingCtx.lineJoin = 'round';
    redrawAllDrawings();
}
window.setupDrawingCanvas = setupDrawingCanvas;

function clearDrawingCanvas() {
    if (drawingCtx && drawingCanvas) {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    } else {
        // console.warn("clearDrawingCanvas: Context eller Canvas mangler, kan ikke tømme.");
    }
}
// Ikke nødvendigvis global, kalles av redrawCanvas og clearDrawings.

function startDraw(event) {
    if (!isDrawingMode) return;
    event.preventDefault();
    isDrawing = true;
    const coords = getCanvasCoordinates(event);
    startX = coords.x;
    startY = coords.y;
    currentX = startX;
    currentY = startY;
    if (currentDrawingTool === 'freehand') {
        currentDrawingPoints = [{ x: startX, y: startY }];
    }
}
// Kalles fra event listener, ikke nødvendigvis global.

function draw(event) {
    if (!isDrawing || !isDrawingMode) return;
    event.preventDefault();
    const coords = getCanvasCoordinates(event);
    currentX = coords.x;
    currentY = coords.y;
    if (currentDrawingTool === 'freehand') {
        currentDrawingPoints.push({ x: currentX, y: currentY });
    }
    redrawCanvas();
}
// Kalles fra event listener, ikke nødvendigvis global.

function stopDraw(event) {
    if (!isDrawing || !isDrawingMode) return;
    if (event && (typeof event.clientX !== 'undefined' || (event.touches && event.touches.length > 0))) {
        const coords = getCanvasCoordinates(event);
        currentX = coords.x;
        currentY = coords.y;
    }
    isDrawing = false;
    let newDrawing = null;
    if (currentDrawingTool === 'freehand') {
        if (currentDrawingPoints.length > 1) {
            newDrawing = { type: 'freehand', color: currentDrawingColor, width: DRAWING_LINE_WIDTH, points: [...currentDrawingPoints] };
        }
        currentDrawingPoints = [];
    } else {
        if (Math.abs(startX - currentX) >= 5 || Math.abs(startY - currentY) >= 5) {
            newDrawing = { type: currentDrawingTool, color: currentDrawingColor, width: DRAWING_LINE_WIDTH, startX: startX, startY: startY, endX: currentX, endY: currentY };
        }
    }
    if (newDrawing) {
        savedDrawings.push(newDrawing);
        // Vurder lagring til kamp state her også
        if (typeof saveCurrentState === "function") { // For generell state om ikke kamp er aktiv
             // saveCurrentState(); // Dette kan lagre tegninger i "lastState"
        }
    }
    redrawCanvas();
}
// Kalles fra event listener, ikke nødvendigvis global.

function redrawCanvas() {
    if (!drawingCtx) return;
    clearDrawingCanvas();
    redrawAllDrawings();
    if (isDrawing && (currentDrawingTool !== 'freehand' || currentDrawingPoints.length > 0) ) {
        let tempData;
        if (currentDrawingTool === 'freehand') {
            tempData = { type: 'freehand', color: currentDrawingColor, width: DRAWING_LINE_WIDTH, points: currentDrawingPoints };
        } else {
            tempData = { type: currentDrawingTool, color: currentDrawingColor, width: DRAWING_LINE_WIDTH, startX: startX, startY: startY, endX: currentX, endY: currentY };
        }
        drawShape(drawingCtx, tempData);
    }
}
// Ikke nødvendigvis global.

function redrawAllDrawings() {
    if (!drawingCtx || !savedDrawings) return;
    savedDrawings.forEach(drawing => {
        drawShape(drawingCtx, drawing);
    });
}
window.redrawAllDrawings = redrawAllDrawings; // Kan være nyttig globalt

function drawShape(ctx, drawingData) {
    ctx.beginPath();
    ctx.strokeStyle = drawingData.color || currentDrawingColor;
    ctx.lineWidth = drawingData.width || DRAWING_LINE_WIDTH;
    const sx = drawingData.startX;
    const sy = drawingData.startY;
    const ex = drawingData.endX;
    const ey = drawingData.endY;
    switch (drawingData.type) {
        case 'arrow': drawArrow(ctx, sx, sy, ex, ey); break;
        case 'circle':
            const dx_c = ex - sx; const dy_c = ey - sy;
            const radius = Math.sqrt(dx_c * dx_c + dy_c * dy_c) / 2;
            const centerX = sx + dx_c / 2; const centerY = sy + dy_c / 2;
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            break;
        case 'rect': ctx.rect(sx, sy, ex - sx, ey - sy); break;
        case 'freehand':
            if (drawingData.points && drawingData.points.length > 1) {
                ctx.moveTo(drawingData.points[0].x, drawingData.points[0].y);
                for (let i = 1; i < drawingData.points.length; i++) {
                    ctx.lineTo(drawingData.points[i].x, drawingData.points[i].y);
                }
            }
            break;
        default:
            if (typeof sx === 'number' && typeof sy === 'number' && typeof ex === 'number' && typeof ey === 'number') {
                 ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
            }
            break;
    }
    ctx.stroke();
}
// Ikke nødvendigvis global.

function drawArrow(ctx, fromx, fromy, tox, toy) {
    ctx.moveTo(fromx, fromy); ctx.lineTo(tox, toy);
    const angle = Math.atan2(toy - fromy, tox - fromx);
    ctx.moveTo(tox, toy); 
    ctx.lineTo(tox - ARROWHEAD_LENGTH * Math.cos(angle - ARROWHEAD_ANGLE), toy - ARROWHEAD_LENGTH * Math.sin(angle - ARROWHEAD_ANGLE));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - ARROWHEAD_LENGTH * Math.cos(angle + ARROWHEAD_ANGLE), toy - ARROWHEAD_LENGTH * Math.sin(angle + ARROWHEAD_ANGLE));
}
// Ikke nødvendigvis global.

function getCanvasCoordinates(event) {
    if (!drawingCanvas) return { x: 0, y: 0 };
    const rect = drawingCanvas.getBoundingClientRect();
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX; clientY = event.touches[0].clientY;
    } else if (typeof event.clientX !== 'undefined') {
        clientX = event.clientX; clientY = event.clientY;
    } else {
        return { x: currentX || 0, y: currentY || 0 };
    }
    const scaleX = (rect.width > 0) ? drawingCanvas.width / rect.width : 1;
    const scaleY = (rect.height > 0) ? drawingCanvas.height / rect.height : 1;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
}
// Ikke nødvendigvis global.

// --- UI Kontroller for tegning (må være globale for event listeners) ---
function toggleDrawMode() {
    isDrawingMode = !isDrawingMode;
    if (!drawingCanvas || !pitchSurface || !toggleDrawModeButton) { console.error("toggleDrawMode: Mangler elementer."); return; }
    if (isDrawingMode) {
        drawingCanvas.style.pointerEvents = 'auto';
        pitchSurface.style.cursor = 'crosshair';
        toggleDrawModeButton.textContent = 'Modus (På)';
        toggleDrawModeButton.classList.add('active');
        // Event listeners for tegning (startDraw, draw, stopDraw) legges til i main.js
    } else {
        drawingCanvas.style.pointerEvents = 'none';
        pitchSurface.style.cursor = 'default';
        toggleDrawModeButton.textContent = 'Modus (Av)';
        toggleDrawModeButton.classList.remove('active');
        if (isDrawing) { // Avslutt pågående tegning hvis modus slås av
            isDrawing = false;
            redrawCanvas();
        }
    }
}
window.toggleDrawMode = toggleDrawMode;

function clearDrawings() {
    if (confirm("Er du sikker på at du vil slette alle tegninger?")) {
        savedDrawings = [];
        clearDrawingCanvas(); // Denne er nå lokal for filen
        redrawCanvas(); // Sørg for at tomt canvas vises
        console.log("Alle tegninger slettet.");
        if (typeof saveCurrentState === "function") { // For generell state om ikke kamp er aktiv
            // saveCurrentState(); // Dette kan lagre endringen i "lastState"
        }
        // Hvis en kamp er aktiv, må vi også oppdatere dens state.
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) {
            // saveCurrentSetupToActiveMatch(); // Denne vil ta getCurrentStateData som inkluderer tom savedDrawings
        }
    }
}
window.clearDrawings = clearDrawings;

function handleToolChange(selectedTool) {
    currentDrawingTool = selectedTool;
    console.log("Valgt tegneverktøy:", currentDrawingTool);
    if(drawToolButtons) { // drawToolButtons er global (config.js)
        drawToolButtons.forEach(button => {
            if (button.dataset.tool === selectedTool) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
}
window.handleToolChange = handleToolChange;

function handleColorChange(event) {
    currentDrawingColor = event.target.value;
    // console.log("Valgt tegnefarge:", currentDrawingColor); // Kan være "noisy"
    if (drawingCtx) {
        drawingCtx.strokeStyle = currentDrawingColor;
    }
}
window.handleColorChange = handleColorChange;

function toggleDrawingVisibility() {
    if (!drawingCanvas || !toggleVisibilityButton) return;
    isDrawingVisible = !isDrawingVisible;
    if (isDrawingVisible) {
        drawingCanvas.style.visibility = 'visible';
        toggleVisibilityButton.textContent = 'Skjul Tegn.';
    } else {
        drawingCanvas.style.visibility = 'hidden';
        toggleVisibilityButton.textContent = 'Vis Tegn.';
    }
}
window.toggleDrawingVisibility = toggleDrawingVisibility;

function undoLastDrawing() {
    if (savedDrawings.length > 0) {
        savedDrawings.pop();
        redrawCanvas();
        console.log("Siste tegning angret.");
        if (typeof saveCurrentState === "function") {
            // saveCurrentState();
        }
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) {
            // saveCurrentSetupToActiveMatch();
        }
    } else {
        console.log("Ingen tegninger å angre.");
    }
}
window.undoLastDrawing = undoLastDrawing;

// === Formasjons- og Tegnehåndtering END ===
/* Version: #25 */
