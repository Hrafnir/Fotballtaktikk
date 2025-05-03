// === 0. Globale Variabler og Konstanter START ===
let squad = []; // Array for å holde spillerobjekter
let playersOnPitch = {}; // Objekt for å holde styr på spillere på banen { playerId: element }
let nextPlayerId = 1; // Enkel ID-generator
let draggedPlayerId = null; // Holder IDen til spilleren som dras
let draggedElement = null; // Holder referanse til elementet som dras
// === 0. Globale Variabler og Konstanter END ===


// === 1. DOM Element Referanser START ===
const sidebar = document.querySelector('.sidebar');
const addPlayerButton = document.getElementById('add-player-button');
const squadListElement = document.getElementById('squad-list');
const benchElement = document.getElementById('bench');
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
    // Nullstill skjemafelter når modalen åpnes (valgfritt, men god praksis)
    newPlayerNameInput.value = '';
    newPlayerImageUpload.value = ''; // Nullstiller file input
    newPlayerImageUrlInput.value = '';
    newPlayerRoleInput.value = '';
    newPlayerNameInput.focus(); // Setter fokus på navnefeltet
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

    // Enkel bildehåndtering (prioriterer URL, så fil, så ingen)
    let finalImageUrl = '';
    if (imageUrl) {
        finalImageUrl = imageUrl;
    } else if (imageFile) {
        // For å vise bildet direkte fra fil, må vi bruke FileReader.
        // Dette gjør vi senere for å unngå kompleksitet nå.
        // Foreløpig bruker vi en placeholder eller ingenting.
        console.warn("Filopplasting vil ikke vise bilde direkte enda. Bruk URL for bildevisning.");
        // Vi kan lagre filen for senere bruk, men ikke vise den nå.
        // finalImageUrl = `placeholder-file:${imageFile.name}`; // Alternativt
    }

    // Opprett spillerobjekt
    const newPlayer = {
        id: `player-${nextPlayerId++}`, // Unik ID for spilleren
        name: name,
        imageUrl: finalImageUrl, // URL eller tom streng
        imageFile: imageFile || null, // Lagre filobjektet hvis det finnes
        role: role,
        onPitch: false, // Er spilleren på banen?
        position: { x: 0, y: 0 }, // Posisjon på banen (i %)
        borderColor: 'black' // Standard rammefarge
    };

    // Legg til i squad-arrayet
    squad.push(newPlayer);

    // Oppdater UI (tropplisten)
    renderSquadList();

    // Lukk modalen
    closeAddPlayerModal();

    // TODO: Legg til logikk for å lagre squad til localStorage her
    console.log("Spillertropp:", squad);
}

// === 2. Modal Håndtering END ===


// === 3. UI Rendering (Oppdatering av Grensesnitt) START ===

/**
 * Oppdaterer HTML-listen over spillere i troppen (sidebar).
 * Viser kun spillere som IKKE er på banen.
 */
function renderSquadList() {
    squadListElement.innerHTML = ''; // Tøm listen først
    const availablePlayers = squad.filter(p => !playersOnPitch[p.id]); // Filtrer ut de som er på banen

    if (availablePlayers.length === 0 && squad.length > 0) {
         squadListElement.innerHTML = '<li><i>Alle spillere er plassert.</i></li>';
    } else if (squad.length === 0) {
        squadListElement.innerHTML = '<li><i>Ingen spillere i troppen.</i></li>';
    } else {
        availablePlayers.forEach(player => {
            const listItem = document.createElement('li');
            listItem.textContent = player.name + (player.role ? ` (${player.role})` : ''); // Vis navn og evt. rolle
            listItem.setAttribute('data-player-id', player.id); // Legg til ID som data-attributt
            listItem.classList.add('squad-player-item'); // Legg til klasse for styling/identifikasjon
            listItem.setAttribute('draggable', true); // Gjør elementet dragbart

            // TODO: Legg til et lite bilde ved siden av navnet hvis imageUrl finnes

            squadListElement.appendChild(listItem);
        });
    }
     // Legg til dragstart-event listener på de nye listeelementene
     addDragListenersToSquadItems();
}

/**
 * Oppdaterer visningen av spillere på benken (foreløpig tom).
 */
function renderBench() {
    benchElement.innerHTML = '<h4>På Benken</h4>'; // Tøm og sett tittel
    // TODO: Implementer logikk for å vise spillere som er tatt av banen
}


// === 3. UI Rendering (Oppdatering av Grensesnitt) END ===


// === 4. Spillerbrikke Håndtering (på banen) START ===

/**
 * Lager et nytt DOM-element for en spillerbrikke på banen.
 * @param {object} player - Spillerobjektet.
 * @param {number} xPercent - X-posisjon i prosent av banens bredde.
 * @param {number} yPercent - Y-posisjon i prosent av banens høyde.
 * @returns {HTMLElement} Det opprettede spillerbrikke-elementet.
 */
function createPlayerPieceElement(player, xPercent, yPercent) {
    const piece = document.createElement('div');
    piece.classList.add('player-piece', 'draggable'); // Kan dras på banen også
    piece.setAttribute('data-player-id', player.id);
    piece.setAttribute('draggable', true);

    // Posisjonering (konverter prosent til pixel for inline style)
    // Vi setter posisjon via style for initial plassering. Dragging vil oppdatere dette.
    piece.style.left = `${xPercent}%`;
    piece.style.top = `${yPercent}%`;
    // Bruk transform for å sentrere brikken over punktet:
    piece.style.transform = 'translate(-50%, -50%)';


    // Bilde-div
    const imgDiv = document.createElement('div');
    imgDiv.classList.add('player-image');
    if (player.imageUrl && !player.imageUrl.startsWith('placeholder-file:')) {
        imgDiv.style.backgroundImage = `url('${player.imageUrl}')`;
    } else {
        // Placeholder hvis ingen URL (eller vi har fil som ikke kan vises direkte)
        imgDiv.style.backgroundColor = '#aaa'; // Grå placeholder
    }
    piece.appendChild(imgDiv);

    // Navn-div
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('player-name');
    nameDiv.textContent = player.name;
    piece.appendChild(nameDiv);

    // Sett rammefarge
    piece.style.borderColor = player.borderColor || 'black';

    // Legg til drag listeners for brikker på banen
    piece.addEventListener('dragstart', handleDragStartPiece);
    piece.addEventListener('dragend', handleDragEnd); // Generell ryddefunksjon

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
 * Legger til 'dragstart' event listeners på alle elementer i tropplisten.
 */
function addDragListenersToSquadItems() {
    const items = squadListElement.querySelectorAll('.squad-player-item');
    items.forEach(item => {
        item.removeEventListener('dragstart', handleDragStart); // Fjern gamle lyttere først
        item.addEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd); // Fjern gamle lyttere først
        item.addEventListener('dragend', handleDragEnd);
    });
}

/**
 * Håndterer starten av et drag-event fra TROPPlisten (sidebar).
 * @param {DragEvent} event
 */
function handleDragStart(event) {
    const playerId = event.target.getAttribute('data-player-id');
    // Sjekk om spilleren allerede er på banen (skal egentlig ikke skje pga renderSquadList)
    if (playersOnPitch[playerId]) {
        event.preventDefault(); // Ikke dra hvis allerede på banen
        console.warn(`Forsøkte å dra spiller ${playerId} fra listen, men er allerede på banen.`);
        return;
    }
    draggedPlayerId = playerId;
    draggedElement = event.target; // Elementet fra listen
    event.dataTransfer.setData('text/plain', playerId);
    event.dataTransfer.effectAllowed = 'move';
    // Gi visuell feedback (litt forsinket for å unngå flimmer)
    setTimeout(() => {
        event.target.classList.add('dragging');
    }, 0);
    console.log(`Dragging player from list: ${playerId}`);
}

/**
 * Håndterer starten av et drag-event fra en SPILLERBRIKKE på banen.
 * @param {DragEvent} event
 */
function handleDragStartPiece(event) {
    const playerId = event.target.closest('.player-piece').getAttribute('data-player-id');
    draggedPlayerId = playerId;
    draggedElement = event.target.closest('.player-piece'); // Selve brikken
    event.dataTransfer.setData('text/plain', playerId);
    event.dataTransfer.effectAllowed = 'move';
     // Gi visuell feedback (litt forsinket for å unngå flimmer)
    setTimeout(() => {
        draggedElement.classList.add('dragging');
    }, 0);
    console.log(`Dragging player piece: ${playerId}`);
    event.stopPropagation(); // Forhindre at andre drag listeners fyrer
}


/**
 * Håndterer når et dratt element er over et gyldig slippmål (banen).
 * @param {DragEvent} event
 */
function handleDragOver(event) {
    event.preventDefault(); // Nødvendig for å tillate slipp
    event.dataTransfer.dropEffect = 'move';
    pitchElement.classList.add('drag-over'); // Visuell feedback
}

/**
 * Håndterer når et dratt element forlater et gyldig slippmål.
 * @param {DragEvent} event
 */
function handleDragLeave(event) {
     pitchElement.classList.remove('drag-over'); // Fjern visuell feedback
}


/**
 * Håndterer når et element slippes på banen.
 * @param {DragEvent} event
 */
function handleDrop(event) {
    event.preventDefault(); // Forhindre standard nettleserhandling (f.eks. åpne som link)
    pitchElement.classList.remove('drag-over'); // Fjern visuell feedback
    const playerId = event.dataTransfer.getData('text/plain');
    const player = getPlayerById(playerId);

    if (!player) {
        console.error("Kunne ikke finne spillerdata for ID:", playerId);
        resetDragState();
        return;
    }

    // Beregn posisjon for slipp relativt til banen (i prosent)
    const pitchRect = pitchElement.getBoundingClientRect();
    const dropX = event.clientX - pitchRect.left;
    const dropY = event.clientY - pitchRect.top;

    // Konverter til prosent for responsivitet/skalering
    const xPercent = Math.max(0, Math.min(100, (dropX / pitchRect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (dropY / pitchRect.height) * 100));

    // Oppdater spillerobjektets posisjon
    player.position = { x: xPercent, y: yPercent };

    // Sjekk om spilleren allerede er på banen (flytter eksisterende brikke)
    if (playersOnPitch[playerId]) {
        const piece = playersOnPitch[playerId];
        piece.style.left = `${xPercent}%`;
        piece.style.top = `${yPercent}%`;
        console.log(`Moved player ${playerId} to ${xPercent.toFixed(1)}%, ${yPercent.toFixed(1)}%`);
    }
    // Hvis spilleren IKKE er på banen (kommer fra listen)
    else {
        const newPiece = createPlayerPieceElement(player, xPercent, yPercent);
        pitchElement.appendChild(newPiece);
        playersOnPitch[playerId] = newPiece; // Registrer at spilleren er på banen
        player.onPitch = true; // Oppdater spillerstatus
        console.log(`Placed player ${playerId} at ${xPercent.toFixed(1)}%, ${yPercent.toFixed(1)}%`);
        // Oppdater tropplisten for å fjerne spilleren
        renderSquadList();
    }

    resetDragState();
}

/**
 * Håndterer slutten av et drag-event (både vellykket slipp og avbrudd).
 * @param {DragEvent} event
 */
function handleDragEnd(event) {
    // Fjern 'dragging' klassen fra elementet som ble dratt, uansett hvor det kommer fra
    if (draggedElement) {
       draggedElement.classList.remove('dragging');
    }
    pitchElement.classList.remove('drag-over'); // Sikkerhetstiltak
    resetDragState();
    console.log("Drag end");
}

/**
 * Nullstiller globale drag-variabler.
 */
function resetDragState() {
    draggedPlayerId = null;
    draggedElement = null;
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
    pitchElement.addEventListener('dragover', handleDragOver);
    pitchElement.addEventListener('dragleave', handleDragLeave); // Ny lytter
    pitchElement.addEventListener('drop', handleDrop);
    // Ingen dragstart direkte på banen, men på brikkene som legges til

    // --- Andre Listeners ---
    // TODO: Legg til flere event listeners (for fargevalg, tegning, lagring etc.)


    // --- Initial rendering ---
    renderSquadList();
    renderBench(); // Vis (tom) benk

});

// === 6. Event Listeners END ===


// --- Andre seksjoner kommer her senere (Tegning, Lagring, etc.) ---
