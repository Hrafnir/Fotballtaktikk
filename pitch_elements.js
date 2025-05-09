/* Version: #17 */
// === Spillerbrikke & Ball Håndtering START ===

/**
 * Oppretter et nytt DOM-element for en spillerbrikke.
 * @param {object} player - Spillerobjektet.
 * @param {number} xPercent - X-posisjon i prosent.
 * @param {number} yPercent - Y-posisjon i prosent.
 * @returns {HTMLElement} Det opprettede spillerbrikke-elementet.
 */
function createPlayerPieceElement(player, xPercent, yPercent) {
    // console.log(`createPlayerPieceElement for ${player.id}, Name: ${player.name}, x:${xPercent}%, y:${yPercent}%`); // Kan være "noisy"
    const piece = document.createElement('div');
    piece.classList.add('player-piece', 'draggable');
    piece.setAttribute('data-player-id', player.id);
    piece.setAttribute('draggable', true);
    piece.style.left = `${xPercent}%`;
    piece.style.top = `${yPercent}%`;

    const imgContainer = document.createElement('div');
    imgContainer.classList.add('player-image-container');
    imgContainer.style.borderColor = player.borderColor || 'black'; // Default til svart hvis ikke satt

    const imgDiv = document.createElement('div');
    imgDiv.classList.add('player-image');
    imgContainer.appendChild(imgDiv);
    piece.appendChild(imgContainer);

    const nameDiv = document.createElement('div');
    nameDiv.classList.add('player-name');
    nameDiv.textContent = player.nickname || player.name; // Bruk kallenavn hvis det finnes
    piece.appendChild(nameDiv);

    // Legg til event listeners
    piece.addEventListener('dragstart', handleDragStartPiece);     // handleDragStartPiece fra interactions.js
    piece.addEventListener('dragend', handleDragEnd);           // handleDragEnd fra interactions.js
    piece.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); // openPlayerDetailModal fra modals.js
    piece.addEventListener('click', handlePlayerPieceClick);    // handlePlayerPieceClick fra interactions.js

    // Oppdater visuelt (bilde etc.)
    updatePlayerPieceVisuals(player.id, piece); // Denne er nå i samme fil, men kan skilles ut senere

    return piece;
}

/**
 * Oppdaterer det visuelle utseendet til en spillerbrikke (bilde, navn, ramme).
 * @param {string} playerId - ID-en til spilleren.
 * @param {HTMLElement} [pieceElement=null] - Selve DOM-elementet for brikken. Hvis null, hentes det fra playersOnPitch.
 */
async function updatePlayerPieceVisuals(playerId, pieceElement = null) {
    const player = getPlayerById(playerId); // Fra utils.js
    if (!player) {
        console.warn(`updatePlayerPieceVisuals: Fant ikke spiller ${playerId}.`);
        return;
    }

    let currentPieceElement = pieceElement;
    if (!currentPieceElement) {
        currentPieceElement = playersOnPitch[playerId]; // playersOnPitch er global (config.js)
    }

    if (!currentPieceElement) {
        // Ikke logg feil her, kan være at spilleren ikke er på banen (f.eks. kun i listen)
        // console.warn(`updatePlayerPieceVisuals: Fant ikke pieceElement for ${playerId}.`);
        return;
    }

    const imgDiv = currentPieceElement.querySelector('.player-image');
    const nameDiv = currentPieceElement.querySelector('.player-name');
    const imgContainer = currentPieceElement.querySelector('.player-image-container');

    if (nameDiv) {
        nameDiv.textContent = player.nickname || player.name;
    }
    if (imgContainer) {
        imgContainer.style.borderColor = player.borderColor || 'black';
    }

    if (imgDiv) {
        imgDiv.style.backgroundImage = 'none'; // Nullstill først
        imgDiv.style.backgroundColor = '#aaa'; // Midlertidig bakgrunn

        try {
            if (player.imageKey) {
                const blob = await loadImageFromDB(player.imageKey); // loadImageFromDB fra db.js
                const objectURL = URL.createObjectURL(blob);
                imgDiv.style.backgroundImage = `url('${objectURL}')`;
                imgDiv.style.backgroundColor = 'transparent';
            } else if (player.imageUrl) {
                imgDiv.style.backgroundImage = `url('${player.imageUrl}')`;
                imgDiv.style.backgroundColor = 'transparent';
            } else {
                // Ingen bilde satt, beholder grå bakgrunn eller setter default ikon
                // console.log(`Ingen bilde (key eller URL) for ${player.id} i updatePlayerPieceVisuals.`);
            }
        } catch (error) {
            console.warn(`Kunne ikke laste bilde for ${playerId} i updatePlayerPieceVisuals:`, error);
            // Fallback hvis bilde ikke kan lastes
            imgDiv.style.backgroundColor = '#ccc'; // Indikerer problem med bilde
        }
    } else {
        console.error(`updatePlayerPieceVisuals: imgDiv IKKE funnet i pieceElement for ${playerId}.`);
    }
}


/**
 * Oppdaterer posisjonen til ball-elementet på banen.
 * @param {number} xPercent - Ny X-posisjon i prosent.
 * @param {number} yPercent - Ny Y-posisjon i prosent.
 */
function updateBallPosition(xPercent, yPercent) {
    // ballElement og ballSettings er globale (config.js)
    if (ballElement) {
        ballElement.style.left = `${xPercent}%`;
        ballElement.style.top = `${yPercent}%`;
        ballSettings.position.x = xPercent;
        ballSettings.position.y = yPercent;
    }
}

/**
 * Anvender stil (størrelse, farge, utseende) på ball-elementet
 * basert på globale ballSettings.
 */
function applyBallStyle() {
    // ballElement og ballSettings er globale (config.js)
    if (!ballElement) return;

    ballElement.style.width = `${ballSettings.size}px`;
    ballElement.style.height = `${ballSettings.size}px`;

    // Fjern tidligere stilklasser
    ballElement.classList.remove('ball-style-classic', 'ball-style-color');
    // Nullstill inline stiler som kan overstyre klasser
    ballElement.style.backgroundColor = '';
    ballElement.style.backgroundImage = ''; // Viktig hvis classic bruker gradients
    ballElement.style.background = '';    // Generell background reset

    if (ballSettings.style === 'classic') {
        ballElement.classList.add('ball-style-classic');
    } else if (ballSettings.style === 'color') {
        ballElement.classList.add('ball-style-color'); // Kan være tom, men greit for konsistens
        ballElement.style.backgroundColor = ballSettings.color;
    } else { // 'default' style
        // Sørg for at default-stilen (radial gradient) blir satt hvis ingen annen klasse er aktiv
        ballElement.style.background = 'radial-gradient(circle at 30% 30%, white 90%, #e0e0e0 100%)';
    }
}
// === Spillerbrikke & Ball Håndtering END ===


// === Formasjons- og Tegnehåndtering START ===

/**
 * Håndterer endring i valg av formasjon fra dropdown.
 * @param {Event} event - Change-eventet fra select-elementet.
 */
function handleFormationChange(event) {
    const selectedFormationName = event.target.value;
    currentFormation = FORMATIONS[selectedFormationName] || null; // FORMATIONS, currentFormation er globale (config.js)
    
    clearFormationPositions();
    resetPositionFilter(); // resetPositionFilter er i denne filen

    if (currentFormation) {
        console.log(`Formasjon valgt: ${currentFormation.name}`);
        drawFormationPositions(currentFormation);
    } else {
        console.log("Ingen formasjon valgt.");
    }
    saveCurrentState(); // Lagre endring av formasjon (eller mangel på sådan)
}

/**
 * Fjerner alle eksisterende formasjonsmarkører fra banen.
 */
function clearFormationPositions() {
    // pitchSurface er global (config.js)
    if (!pitchSurface) {
        console.error("clearFormationPositions: pitchSurface ikke funnet!");
        return;
    }
    const markers = pitchSurface.querySelectorAll('.formation-position-marker');
    markers.forEach(marker => marker.remove());
    // resetPositionFilter(); // Kalles allerede i handleFormationChange
    console.log("Formasjonsmarkører fjernet.");
}

/**
 * Tegner formasjonsmarkører på banen for den gitte formasjonen.
 * @param {object} formation - Formasjonsobjektet som inneholder posisjoner.
 */
function drawFormationPositions(formation) {
    // pitchSurface er global (config.js)
    if (!formation || !formation.positions || !pitchSurface) {
        console.error("drawFormationPositions: Mangler formasjonsdata eller pitchSurface.");
        return;
    }
    console.log(`Tegner posisjoner for: ${formation.name}`);
    formation.positions.forEach(pos => {
        const marker = document.createElement('div');
        marker.classList.add('formation-position-marker', 'drop-target'); // drop-target for dra-og-slipp
        marker.style.left = `${pos.x}%`;
        marker.style.top = `${pos.y}%`;
        marker.textContent = pos.id.toUpperCase();
        marker.title = `${pos.name} (Roller: ${pos.roles.join(', ')})`;
        marker.setAttribute('data-pos-id', pos.id);
        marker.setAttribute('data-pos-name', pos.name);
        marker.setAttribute('data-roles', JSON.stringify(pos.roles)); // Lagre roller for filtrering

        marker.addEventListener('click', (e) => { e.stopPropagation(); handlePositionMarkerClick(marker, pos); });
        // Drag-event listeners for markøren (fra interactions.js)
        marker.addEventListener('dragover', (e) => handleDragOver(e, 'formation-marker'));
        marker.addEventListener('dragleave', (e) => handleDragLeave(e, 'formation-marker'));
        marker.addEventListener('drop', (e) => handleDropOnFormationMarker(e, pos));

        pitchSurface.appendChild(marker);
    });
}

/**
 * Håndterer klikk på en formasjonsmarkør.
 * Velger/avvelger markøren og filtrerer spillerlisten.
 * @param {HTMLElement} markerElement - DOM-elementet for den klikkede markøren.
 * @param {object} positionData - Dataobjektet for den valgte posisjonen.
 */
function handlePositionMarkerClick(markerElement, positionData) {
    // selectedFormationPosition er global (config.js)
    console.log(`Klikket på posisjon: ${positionData.name} (ID: ${positionData.id}), Roller: ${positionData.roles.join(', ')}`);
    const isAlreadySelected = markerElement.classList.contains('selected');
    
    clearSelectedPositionMarker(); // Fjern 'selected' fra alle andre markører

    if (isAlreadySelected) {
        // Hvis man klikker på en allerede valgt markør, nullstill filteret
        resetPositionFilter();
    } else {
        markerElement.classList.add('selected');
        selectedFormationPosition = positionData;
        renderSquadList(); // renderSquadList fra ui_render.js (for å filtrere)
    }
}

/**
 * Fjerner 'selected'-klassen fra alle formasjonsmarkører.
 */
function clearSelectedPositionMarker() {
    if (!pitchSurface) return; // pitchSurface er global (config.js)
    const selectedMarkers = pitchSurface.querySelectorAll('.formation-position-marker.selected');
    selectedMarkers.forEach(marker => marker.classList.remove('selected'));
}

/**
 * Nullstiller filteret for formasjonsposisjoner og oppdaterer spillerlisten.
 */
function resetPositionFilter() {
    console.log("Nullstiller posisjonsfilter.");
    selectedFormationPosition = null; // selectedFormationPosition er global (config.js)
    clearSelectedPositionMarker();
    if (typeof renderSquadList === "function") renderSquadList(); // renderSquadList fra ui_render.js
}


// --- Tegnefunksjonalitet ---
/**
 * Setter opp canvas for tegning med riktig størrelse og context.
 */
function setupDrawingCanvas() {
    // drawingCanvas, drawingCtx, currentDrawingColor er globale (config.js)
    if (!drawingCanvas) {
        console.error("setupDrawingCanvas: Finner ikke canvas-elementet (#drawing-canvas)!");
        return;
    }
    // Sørg for at canvas matcher forelderens (pitchSurface) dimensjoner
    // Dette bør gjøres når pitch-størrelsen endres (resizePitchElement)
    const pitchSurf = document.getElementById('pitch-surface'); // Eller bruk global pitchSurface hvis den alltid er satt
    if (pitchSurf && (drawingCanvas.width !== pitchSurf.offsetWidth || drawingCanvas.height !== pitchSurf.offsetHeight)) {
        drawingCanvas.width = pitchSurf.offsetWidth;
        drawingCanvas.height = pitchSurf.offsetHeight;
        console.log(`Drawing canvas size re-set to: ${drawingCanvas.width}x${drawingCanvas.height} basert på pitchSurface.`);
    } else if (!pitchSurf) {
        console.warn("setupDrawingCanvas: pitchSurface ikke funnet for dimensjonering.");
    }


    drawingCtx = drawingCanvas.getContext('2d');
    if (!drawingCtx) {
        console.error("setupDrawingCanvas: Kunne ikke hente 2D context for tegnecanvas.");
        return;
    }
    drawingCtx.strokeStyle = currentDrawingColor;
    drawingCtx.lineWidth = DRAWING_LINE_WIDTH; // DRAWING_LINE_WIDTH fra config.js
    drawingCtx.lineCap = 'round';
    drawingCtx.lineJoin = 'round';
    
    redrawAllDrawings(); // Tegn lagrede tegninger på nytt hvis canvas ble resatt
}

/**
 * Tømmer tegnecanvaset.
 */
function clearDrawingCanvas() {
    if (drawingCtx && drawingCanvas) {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    } else {
        console.warn("clearDrawingCanvas: Context eller Canvas mangler, kan ikke tømme.");
    }
}

/**
 * Starter en tegneoperasjon (ved mousedown/touchstart).
 * @param {MouseEvent|TouchEvent} event - Event-objektet.
 */
function startDraw(event) {
    // isDrawingMode, isDrawing, currentDrawingTool, currentDrawingPoints, startX, startY, currentX, currentY er globale (config.js)
    if (!isDrawingMode) return;
    event.preventDefault(); // Forhindre standardhandlinger som tekstvalg eller scrolling på touch
    isDrawing = true;
    const coords = getCanvasCoordinates(event); // getCanvasCoordinates er i denne filen
    startX = coords.x;
    startY = coords.y;
    currentX = startX; // Initialiser currentX/Y
    currentY = startY;

    if (currentDrawingTool === 'freehand') {
        currentDrawingPoints = [{ x: startX, y: startY }];
    }
    // console.log(`Start Draw (${currentDrawingTool}) at: ${startX.toFixed(1)}, ${startY.toFixed(1)}`);
}

/**
 * Utfører tegning under bevegelse (mousemove/touchmove).
 * @param {MouseEvent|TouchEvent} event - Event-objektet.
 */
function draw(event) {
    if (!isDrawing || !isDrawingMode) return;
    event.preventDefault();
    const coords = getCanvasCoordinates(event);
    currentX = coords.x;
    currentY = coords.y;

    if (currentDrawingTool === 'freehand') {
        currentDrawingPoints.push({ x: currentX, y: currentY });
    }
    redrawCanvas(); // Tegn midlertidig form
}

/**
 * Stopper en tegneoperasjon (ved mouseup/touchend/mouseleave).
 * Lagrer den fullførte tegningen.
 * @param {MouseEvent|TouchEvent} event - Event-objektet (kan være undefined ved mouseleave).
 */
function stopDraw(event) {
    if (!isDrawing || !isDrawingMode) return;
    // isDrawing, currentDrawingTool, startX, startY, currentX, currentY, currentDrawingPoints,
    // savedDrawings, currentDrawingColor, DRAWING_LINE_WIDTH er globale (config.js)

    // For mouseleave kan event være undefined, eller ikke ha clientX/Y.
    // I så fall bruker vi siste kjente currentX/Y.
    if (event && (typeof event.clientX !== 'undefined' || (event.touches && event.touches.length > 0))) {
        const coords = getCanvasCoordinates(event);
        currentX = coords.x;
        currentY = coords.y;
    }
    
    isDrawing = false;
    let newDrawing = null;

    if (currentDrawingTool === 'freehand') {
        if (currentDrawingPoints.length > 1) { // Trenger minst to punkter for en linje
            newDrawing = { type: 'freehand', color: currentDrawingColor, width: DRAWING_LINE_WIDTH, points: [...currentDrawingPoints] };
        }
        currentDrawingPoints = []; // Nullstill for neste frihåndstegning
    } else {
        // For piler, sirkler, rektangler, sjekk om det er en signifikant tegning
        if (Math.abs(startX - currentX) >= 5 || Math.abs(startY - currentY) >= 5) {
            newDrawing = { type: currentDrawingTool, color: currentDrawingColor, width: DRAWING_LINE_WIDTH, startX: startX, startY: startY, endX: currentX, endY: currentY };
        }
    }

    if (newDrawing) {
        savedDrawings.push(newDrawing);
        // console.log(`Lagret tegning:`, newDrawing);
        if (typeof saveCurrentSetupToActiveMatch === "function" && activeMatchId) {
             // TODO: Må utvides til å lagre tegninger som del av kampens state.
             // Foreløpig lagres tegninger globalt. Vurder om saveCurrentSetupToActiveMatch
             // skal ta getCurrentStateData() som inkluderer savedDrawings hvis de skal være kamp-spesifikke.
        } else if (typeof saveCurrentState === "function") {
            // saveCurrentState(); // Hvis tegninger er del av generell state.
        }
    }
    redrawCanvas(); // Tegn alle lagrede + den siste (som nå er lagret)
}


/**
 * Tømmer og tegner om hele canvaset med alle lagrede tegninger
 * og eventuell pågående tegning.
 */
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

/**
 * Går gjennom alle lagrede tegninger og tegner dem på canvaset.
 */
function redrawAllDrawings() {
    // drawingCtx, savedDrawings er globale (config.js)
    if (!drawingCtx || !savedDrawings) return;
    savedDrawings.forEach(drawing => {
        drawShape(drawingCtx, drawing);
    });
}

/**
 * Hjelpefunksjon for å tegne en spesifikk form (linje, pil, sirkel, rektangel, frihånd).
 * @param {CanvasRenderingContext2D} ctx - Canvasets 2D rendering context.
 * @param {object} drawingData - Objekt som beskriver tegningen.
 */
function drawShape(ctx, drawingData) {
    ctx.beginPath();
    ctx.strokeStyle = drawingData.color || currentDrawingColor; // Fallback til global farge
    ctx.lineWidth = drawingData.width || DRAWING_LINE_WIDTH; // Fallback til global tykkelse

    const sx = drawingData.startX;
    const sy = drawingData.startY;
    const ex = drawingData.endX;
    const ey = drawingData.endY;

    switch (drawingData.type) {
        case 'arrow':
            drawArrow(ctx, sx, sy, ex, ey); // drawArrow er i denne filen
            break;
        case 'circle':
            const dx_c = ex - sx;
            const dy_c = ey - sy;
            const radius = Math.sqrt(dx_c * dx_c + dy_c * dy_c) / 2; // Radius er halve diagonalen
            const centerX = sx + dx_c / 2;
            const centerY = sy + dy_c / 2;
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            break;
        case 'rect':
            ctx.rect(sx, sy, ex - sx, ey - sy);
            break;
        case 'freehand':
            if (drawingData.points && drawingData.points.length > 1) {
                ctx.moveTo(drawingData.points[0].x, drawingData.points[0].y);
                for (let i = 1; i < drawingData.points.length; i++) {
                    ctx.lineTo(drawingData.points[i].x, drawingData.points[i].y);
                }
            }
            break;
        default: // Anta linje hvis type er ukjent eller mangler
            if (typeof sx === 'number' && typeof sy === 'number' && typeof ex === 'number' && typeof ey === 'number') {
                 ctx.moveTo(sx, sy);
                 ctx.lineTo(ex, ey);
            } else {
                console.warn("drawShape: Ugyldige koordinater for default tegning (linje).", drawingData);
            }
            break;
    }
    ctx.stroke();
}

/**
 * Hjelpefunksjon for å tegne en pil med pilspiss.
 * @param {CanvasRenderingContext2D} ctx - Canvasets 2D rendering context.
 * @param {number} fromx - Start X-koordinat.
 * @param {number} fromy - Start Y-koordinat.
 * @param {number} tox - Slutt X-koordinat.
 * @param {number} toy - Slutt Y-koordinat.
 */
function drawArrow(ctx, fromx, fromy, tox, toy) {
    // ARROWHEAD_LENGTH, ARROWHEAD_ANGLE er globale (config.js)
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);

    const angle = Math.atan2(toy - fromy, tox - fromx);
    // Venstre del av pilspissen
    ctx.moveTo(tox, toy); // Gå tilbake til spissen før du tegner neste del av hodet
    ctx.lineTo(tox - ARROWHEAD_LENGTH * Math.cos(angle - ARROWHEAD_ANGLE), toy - ARROWHEAD_LENGTH * Math.sin(angle - ARROWHEAD_ANGLE));
    // Høyre del av pilspissen
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - ARROWHEAD_LENGTH * Math.cos(angle + ARROWHEAD_ANGLE), toy - ARROWHEAD_LENGTH * Math.sin(angle + ARROWHEAD_ANGLE));
}


/**
 * Konverterer klientkoordinater (fra mus/touch) til canvas-koordinater.
 * @param {MouseEvent|TouchEvent} event - Event-objektet.
 * @returns {object} Objekt med x og y koordinater relative til canvaset.
 */
function getCanvasCoordinates(event) {
    // drawingCanvas er global (config.js)
    if (!drawingCanvas) return { x: 0, y: 0 };
    const rect = drawingCanvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else if (typeof event.clientX !== 'undefined') {
        clientX = event.clientX;
        clientY = event.clientY;
    } else {
        // Fallback eller feilhåndtering hvis ingen koordinater finnes
        // Dette kan skje f.eks. ved 'mouseleave' hvis eventet ikke har koordinater.
        // Returner siste kjente koordinater eller et default.
        console.warn("getCanvasCoordinates: Kunne ikke hente clientX/clientY fra event.", event);
        return { x: currentX || 0, y: currentY || 0 }; // Bruk globale currentX/Y som fallback
    }

    // Beregn skaleringsfaktorer i tilfelle canvas er skalert via CSS
    // Dette er viktig hvis canvas.width/height ikke matcher getBoundingClientRect().width/height
    const scaleX = (rect.width > 0) ? drawingCanvas.width / rect.width : 1;
    const scaleY = (rect.height > 0) ? drawingCanvas.height / rect.height : 1;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
}
// === Formasjons- og Tegnehåndtering END ===
/* Version: #17 */
