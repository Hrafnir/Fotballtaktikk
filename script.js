// === 0. Globale Variabler og Konstanter START ===
let squad = []; // Array for å holde ALLE spillerobjekter
let playersOnPitch = {}; // Objekt for å holde styr på spillere PÅ BANEN { playerId: element }
let playersOnBench = []; // Array for å holde IDene til spillere PÅ BENKEN [playerId1, playerId2]
let nextPlayerId = 1; // Enkel ID-generator
let draggedPlayerId = null; // Holder IDen til spilleren som dras
let draggedElement = null; // Holder referanse til elementet som dras
let dragSource = null; // Hvor kommer drag fra? 'squad', 'pitch', 'bench'

const MAX_PLAYERS_ON_PITCH = 11;
// === 0. Globale Variabler og Konstanter END ===


// === 1. DOM Element Referanser START ===
const sidebar = document.querySelector('.sidebar');
const addPlayerButton = document.getElementById('add-player-button');
const squadListElement = document.getElementById('squad-list');
const benchElement = document.getElementById('bench'); // Selve benk-diven
const benchListElement = document.getElementById('bench-list'); // UL-listen inni benken
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
const pitchElement = document.getElementById('pitch');
const drawingCanvas = document.getElementById('drawing-canvas');
const ballElement = document.getElementById('ball');

// Modal elementer
const addPlayerModal = document.getElementById('add-player-modal');
const closeButton = addPlayerModal.querySelector('.close-button');
const newPlayerNameInput = document.getElementById('new-player-name');
const newPlayerImageUpload = document.getElementById('new-player-image-upload');
const newPlayerImageUrlInput = document.getElementById('new-player-image-url');
const newPlayerRoleInput = document.getElementById('new-player-role');
const confirmAddPlayerButton = document.getElementById('confirm-add-player');

// === 1. DOM Element Referanser END ===


// === 2. Modal Håndtering START ===

/**
 * Åpner "Legg til Spiller"-modalen.
 */
function openAddPlayerModal() {
    addPlayerModal.style.display = 'block';
    newPlayerNameInput.value = '';
    newPlayerImageUpload.value = '';
    newPlayerImageUrlInput.value = '';
    newPlayerRoleInput.value = '';
    newPlayerNameInput.focus();
}

/**
 * Lukker "Legg til Spiller"-modalen.
 */
function closeAddPlayerModal() {
    addPlayerModal.style.display = 'none';
}

/**
 * Håndterer klikk på "Legg til"-knappen i modalen.
 * Oppretter spillerobjekt, legger til i squad-array, og oppdaterer UI.
 */
function handleAddPlayerConfirm() {
    const name = newPlayerNameInput.value.trim();
    const imageFile = newPlayerImageUpload.files[0];
    let imageUrl = newPlayerImageUrlInput.value.trim();
    const role = newPlayerRoleInput.value.trim();

    if (!name) {
        alert('Spillernavn må fylles ut.');
        return;
    }

    let finalImageUrl = '';
    if (imageUrl) {
        finalImageUrl = imageUrl;
    } else if (imageFile) {
        console.warn("Filopplasting vil ikke vise bilde direkte enda. Bruk URL for bildevisning.");
    }

    const newPlayer = {
        id: `player-${nextPlayerId++}`,
        name: name,
        imageUrl: finalImageUrl,
        imageFile: imageFile || null,
        role: role,
        // Fjernet onPitch herfra, status bestemmes av playersOnPitch/playersOnBench
        position: { x: 50, y: 50 }, // Standard startposisjon (midten)
        borderColor: 'black'
    };

    squad.push(newPlayer);

    // Oppdater UI (både troppliste og benk)
    renderUI(); // Felles render-funksjon

    closeAddPlayerModal();

    // TODO: Lagre squad til localStorage
    console.log("Spillertropp:", squad);
}

// === 2. Modal Håndtering END ===


// === 3. UI Rendering (Oppdatering av Grensesnitt) START ===

/**
 * Hovedfunksjon for å rendre hele UI basert på gjeldende state.
 */
function renderUI() {
    renderSquadList();
    renderBench();
    // Evt. rendre banen på nytt hvis nødvendig (f.eks. farger)
}


/**
 * Oppdaterer HTML-listen over spillere i troppen (sidebar).
 * Viser kun spillere som IKKE er på banen OG IKKE på benken.
 */
function renderSquadList() {
    squadListElement.innerHTML = ''; // Tøm listen først
    const availablePlayers = squad.filter(p => !playersOnPitch[p.id] && !playersOnBench.includes(p.id));

    if (availablePlayers.length === 0 && squad.length > 0) {
         squadListElement.innerHTML = '<li><i>Alle spillere er plassert (bane/benk).</i></li>';
    } else if (squad.length === 0) {
        squadListElement.innerHTML = '<li><i>Ingen spillere i troppen.</i></li>';
    } else {
        availablePlayers.forEach(player => {
            const listItem = document.createElement('li');
            listItem.textContent = player.name + (player.role ? ` (${player.role})` : '');
            listItem.setAttribute('data-player-id', player.id);
            listItem.classList.add('squad-player-item', 'draggable'); // Legg til draggable klasse
            listItem.setAttribute('draggable', true);
            squadListElement.appendChild(listItem);
        });
    }
     // Legg til dragstart-event listener på de nye listeelementene
     addDragListenersToSquadItems();
}

/**
 * Oppdaterer visningen av spillere på benken.
 */
function renderBench() {
    benchListElement.innerHTML = ''; // Tøm listen først

    if (playersOnBench.length === 0) {
        benchListElement.innerHTML = '<li><i>Benken er tom.</i></li>';
        return;
    }

    playersOnBench.forEach(playerId => {
        const player = getPlayerById(playerId);
        if (player) {
            const listItem = document.createElement('li');
            listItem.textContent = player.name + (player.role ? ` (${player.role})` : '');
            listItem.setAttribute('data-player-id', player.id);
            listItem.classList.add('bench-player-item', 'draggable'); // Legg til draggable klasse
            listItem.setAttribute('draggable', true);
            benchListElement.appendChild(listItem);
        } else {
             console.warn(`Fant ikke spiller med ID ${playerId} for benken.`);
        }
    });

    // Legg til drag listeners på benk-items
    addDragListenersToBenchItems();
}


// === 3. UI Rendering (Oppdatering av Grensesnitt) END ===


// === 4. Spillerbrikke Håndtering (på banen) START ===

/**
 * Lager et nytt DOM-element for en spillerbrikke på banen (rund stil).
 * @param {object} player - Spillerobjektet.
 * @param {number} xPercent - X-posisjon i prosent.
 * @param {number} yPercent - Y-posisjon i prosent.
 * @returns {HTMLElement} Det opprettede spillerbrikke-elementet.
 */
function createPlayerPieceElement(player, xPercent, yPercent) {
    const piece = document.createElement('div');
    piece.classList.add('player-piece', 'draggable');
    piece.setAttribute('data-player-id', player.id);
    piece.setAttribute('draggable', true);

    piece.style.left = `${xPercent}%`;
    piece.style.top = `${yPercent}%`;
    piece.style.transform = 'translate(-50%, -50%)'; // Sentrer brikken

    // Container for rundhet og ramme
    const imgContainer = document.createElement('div');
    imgContainer.classList.add('player-image-container');
    imgContainer.style.borderColor = player.borderColor || 'black'; // Sett rammefarge her

    // Bilde-div inni containeren
    const imgDiv = document.createElement('div');
    imgDiv.classList.add('player-image');
    if (player.imageUrl && !player.imageUrl.startsWith('placeholder-file:')) {
        imgDiv.style.backgroundImage = `url('${player.imageUrl}')`;
    } else {
        imgDiv.style.backgroundColor = '#aaa'; // Grå placeholder
    }
    imgContainer.appendChild(imgDiv); // Legg bilde inni container
    piece.appendChild(imgContainer); // Legg container til brikken

    // Navn-div under containeren
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('player-name');
    nameDiv.textContent = player.name;
    piece.appendChild(nameDiv);

    // Legg til drag listeners for brikker på banen
    piece.addEventListener('dragstart', handleDragStartPiece);
    piece.addEventListener('dragend', handleDragEnd);

    return piece;
}

/**
 * Finner spillerobjektet basert på ID.
 * @param {string} playerId
 * @returns {object | null} Spillerobjektet eller null hvis ikke funnet.
 */
function getPlayerById(playerId) {
    return squad.find(p => p.id === playerId) || null;
}

// === 4. Spillerbrikke Håndtering (på banen) END ===


// === 5. Drag and Drop Logikk START ===

/**
 * Legger til drag listeners på elementer i TROPPlisten.
 */
function addDragListenersToSquadItems() {
    const items = squadListElement.querySelectorAll('.squad-player-item');
    items.forEach(item => {
        item.removeEventListener('dragstart', handleDragStart);
        item.addEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd);
        item.addEventListener('dragend', handleDragEnd);
    });
}

/**
 * Legger til drag listeners på elementer i BENKlisten.
 */
function addDragListenersToBenchItems() {
    const items = benchListElement.querySelectorAll('.bench-player-item');
    items.forEach(item => {
        item.removeEventListener('dragstart', handleDragStartBench); // Bruk egen handler
        item.addEventListener('dragstart', handleDragStartBench);
        item.removeEventListener('dragend', handleDragEnd);
        item.addEventListener('dragend', handleDragEnd);
    });
}

/**
 * Håndterer starten av et drag-event fra TROPPlisten (sidebar).
 * @param {DragEvent} event
 */
function handleDragStart(event) {
    draggedPlayerId = event.target.getAttribute('data-player-id');
    // Sjekk om spilleren finnes (sanity check)
     if (!getPlayerById(draggedPlayerId)) return;

    draggedElement = event.target;
    dragSource = 'squad'; // Sett kilden
    event.dataTransfer.setData('text/plain', playerId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => event.target.classList.add('dragging'), 0);
    console.log(`Dragging player from SQUAD: ${draggedPlayerId}`);
}

/**
 * Håndterer starten av et drag-event fra BENKlisten (sidebar).
 * @param {DragEvent} event
 */
function handleDragStartBench(event) {
    draggedPlayerId = event.target.getAttribute('data-player-id');
     if (!getPlayerById(draggedPlayerId)) return;

    draggedElement = event.target;
    dragSource = 'bench'; // Sett kilden
    const playerId = draggedPlayerId; // For closure in setData
    event.dataTransfer.setData('text/plain', playerId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => event.target.classList.add('dragging'), 0);
    console.log(`Dragging player from BENCH: ${draggedPlayerId}`);
}


/**
 * Håndterer starten av et drag-event fra en SPILLERBRIKKE på banen.
 * @param {DragEvent} event
 */
function handleDragStartPiece(event) {
    // Finn nærmeste .player-piece container
    const pieceElement = event.target.closest('.player-piece');
    if (!pieceElement) return; // Avbryt hvis vi ikke fant brikken

    draggedPlayerId = pieceElement.getAttribute('data-player-id');
     if (!getPlayerById(draggedPlayerId)) return;

    draggedElement = pieceElement;
    dragSource = 'pitch'; // Sett kilden
    const playerId = draggedPlayerId; // For closure in setData
    event.dataTransfer.setData('text/plain', playerId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => pieceElement.classList.add('dragging'), 0);
    console.log(`Dragging player from PITCH: ${draggedPlayerId}`);
    event.stopPropagation();
}


/**
 * Håndterer når et dratt element er over et gyldig slippmål.
 * @param {DragEvent} event
 * @param {string} targetType - 'pitch' eller 'bench'
 */
function handleDragOver(event, targetType) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (targetType === 'pitch') {
        pitchElement.classList.add('drag-over');
    } else if (targetType === 'bench') {
        benchElement.classList.add('drag-over');
    }
}

/**
 * Håndterer når et dratt element forlater et gyldig slippmål.
 * @param {Event} event - Merk: Kan være MouseEvent eller DragEvent
 * @param {string} targetType - 'pitch' eller 'bench'
 */
function handleDragLeave(event, targetType) {
     // Sjekk om musen fortsatt er over elementet (kan fyre unødvendig)
     const relatedTarget = event.relatedTarget;
     const targetElement = (targetType === 'pitch') ? pitchElement : benchElement;

     // Sjekk om vi forlater til et barneelement innenfor målet
     if (relatedTarget && targetElement.contains(relatedTarget)) {
         return;
     }

    if (targetType === 'pitch') {
        pitchElement.classList.remove('drag-over');
    } else if (targetType === 'bench') {
        benchElement.classList.remove('drag-over');
    }
}


/**
 * Håndterer når et element slippes på BANEN.
 * @param {DragEvent} event
 */
function handleDropOnPitch(event) {
    event.preventDefault();
    pitchElement.classList.remove('drag-over');
    const playerId = event.dataTransfer.getData('text/plain');
    const player = getPlayerById(playerId);

    if (!player) {
        console.error("Drop on Pitch: Kunne ikke finne spillerdata for ID:", playerId);
        resetDragState();
        return;
    }

    // --- 11-spiller sjekk ---
    // Sjekk KUN hvis spilleren kommer fra squad eller benk (ikke hvis den flyttes internt på banen)
    if (dragSource === 'squad' || dragSource === 'bench') {
        const currentPlayersOnPitchCount = Object.keys(playersOnPitch).length;
        if (currentPlayersOnPitchCount >= MAX_PLAYERS_ON_PITCH) {
            alert(`Kan ikke ha mer enn ${MAX_PLAYERS_ON_PITCH} spillere på banen. Flytt en spiller til benken først.`);
            resetDragState();
            return;
        }
    }

    // Beregn posisjon
    const pitchRect = pitchElement.getBoundingClientRect();
    const dropX = event.clientX - pitchRect.left;
    const dropY = event.clientY - pitchRect.top;
    const xPercent = Math.max(0, Math.min(100, (dropX / pitchRect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (dropY / pitchRect.height) * 100));

    // Oppdater spillerobjektets posisjon
    player.position = { x: xPercent, y: yPercent };

    // --- Håndter flytt/plassering ---
    if (playersOnPitch[playerId]) { // Spiller flyttes innenfor banen
        const piece = playersOnPitch[playerId];
        piece.style.left = `${xPercent}%`;
        piece.style.top = `${yPercent}%`;
        console.log(`Moved player ${playerId} on pitch`);
    } else { // Spiller kommer fra squad eller benk
        const newPiece = createPlayerPieceElement(player, xPercent, yPercent);
        pitchElement.appendChild(newPiece);
        playersOnPitch[playerId] = newPiece; // Registrer på banen

        // Hvis spilleren kom fra benken, fjern fra benk-listen
        if (dragSource === 'bench') {
            const benchIndex = playersOnBench.indexOf(playerId);
            if (benchIndex > -1) {
                playersOnBench.splice(benchIndex, 1);
            }
        }
        console.log(`Placed player ${playerId} from ${dragSource}`);
    }

    // Oppdater listene i sidepanelet
    renderUI();
    resetDragState();
}

/**
 * Håndterer når et element slippes på BENKEN.
 * @param {DragEvent} event
 */
function handleDropOnBench(event) {
    event.preventDefault();
    benchElement.classList.remove('drag-over');
    const playerId = event.dataTransfer.getData('text/plain');
    const player = getPlayerById(playerId);

    if (!player) {
        console.error("Drop on Bench: Kunne ikke finne spillerdata for ID:", playerId);
        resetDragState();
        return;
    }

    // --- Håndter kun slipp fra banen ---
    if (dragSource === 'pitch') {
        // Sjekk om spilleren allerede er på benken (bør ikke skje, men greit å sjekke)
        if (!playersOnBench.includes(playerId)) {
            playersOnBench.push(playerId); // Legg til på benken
        }

        // Fjern fra banen (både element og data)
        if (playersOnPitch[playerId]) {
            playersOnPitch[playerId].remove(); // Fjern DOM-elementet
            delete playersOnPitch[playerId]; // Fjern fra pitch-data
            console.log(`Moved player ${playerId} from pitch to bench`);
        }

        // Oppdater listene
        renderUI();

    } else if (dragSource === 'squad') {
        console.log("Ignorerer slipp fra tropp til benk (må via banen).");
        // Gjør ingenting, spiller må på banen først.
    } else if (dragSource === 'bench') {
        console.log("Ignorerer slipp fra benk til benk.");
        // Gjør ingenting, ingen reordering implementert ennå.
    }

    resetDragState();
}


/**
 * Håndterer slutten av et drag-event. Rydd opp.
 * @param {DragEvent} event
 */
function handleDragEnd(event) {
    if (draggedElement) {
       draggedElement.classList.remove('dragging');
    }
    // Fjern all drag-over highlighting
    pitchElement.classList.remove('drag-over');
    benchElement.classList.remove('drag-over');

    // Nullstill globale drag-variabler uansett utfall
    resetDragState();
    // console.log("Drag end"); // Kan fjernes, blir mye støy
}

/**
 * Nullstiller globale drag-variabler.
 */
function resetDragState() {
    draggedPlayerId = null;
    draggedElement = null;
    dragSource = null;
}


// === 5. Drag and Drop Logikk END ===


// === 6. Event Listeners START ===

// Initialiser event listeners når scriptet lastes
document.addEventListener('DOMContentLoaded', () => {
    // --- Modal Listeners ---
    addPlayerButton.addEventListener('click', openAddPlayerModal);
    closeButton.addEventListener('click', closeAddPlayerModal);
    window.addEventListener('click', (event) => {
        if (event.target === addPlayerModal) {
            closeAddPlayerModal();
        }
    });
    confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm);

    // --- Drag and Drop Listeners for Banen ---
    pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch'));
    pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch'));
    pitchElement.addEventListener('drop', handleDropOnPitch);

    // --- Drag and Drop Listeners for Benken ---
    benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench'));
    benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench'));
    benchElement.addEventListener('drop', handleDropOnBench);

    // --- Andre Listeners ---
    // TODO: Legg til for fargevalg, tegning, lagring etc.


    // --- Initial rendering ---
    renderUI(); // Kall felles render-funksjon

});

// === 6. Event Listeners END ===


// --- Andre seksjoner kommer her senere (Tegning, Lagring, Ball-drag etc.) ---
