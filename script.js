// === 0. Globale Variabler og Konstanter START ===
let squad = []; // Array for å holde spillerobjekter
let nextPlayerId = 1; // Enkel ID-generator
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
    // Mer avansert filhåndtering (visning av forhåndsvisning, lagring) kommer senere.
    let finalImageUrl = '';
    if (imageUrl) {
        finalImageUrl = imageUrl;
    } else if (imageFile) {
        // For nå lagrer vi bare filnavnet som info, ikke selve bildet.
        // Vi må bruke FileReader for å vise/lagre selve bildet, det tar vi senere.
        finalImageUrl = `placeholder-file:${imageFile.name}`; // Kun for info
        console.warn("Filopplasting er ikke fullt implementert. Lagrer filnavn-info.");
    }

    // Opprett spillerobjekt
    const newPlayer = {
        id: `player-${nextPlayerId++}`, // Unik ID for spilleren
        name: name,
        imageUrl: finalImageUrl, // URL eller placeholder-info
        role: role,
        // Legg til flere egenskaper etter behov (posisjon, farge etc.)
    };

    // Legg til i squad-arrayet
    squad.push(newPlayer);

    // Oppdater UI (tropplisten)
    renderSquadList();

    // Lukk modalen
    closeAddPlayerModal();

    // TODO: Legg til logikk for å lagre squad til localStorage her
}

// === 2. Modal Håndtering END ===


// === 3. UI Rendering (Oppdatering av Grensesnitt) START ===

/**
 * Oppdaterer HTML-listen over spillere i troppen (sidebar).
 */
function renderSquadList() {
    squadListElement.innerHTML = ''; // Tøm listen først

    if (squad.length === 0) {
        squadListElement.innerHTML = '<li><i>Ingen spillere i troppen.</i></li>';
        return;
    }

    squad.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = player.name + (player.role ? ` (${player.role})` : ''); // Vis navn og evt. rolle
        listItem.setAttribute('data-player-id', player.id); // Legg til ID som data-attributt
        listItem.classList.add('squad-player-item'); // Legg til klasse for styling/identifikasjon
        listItem.setAttribute('draggable', true); // Gjør elementet dragbart (for senere bruk)

        // TODO: Legg til et lite bilde ved siden av navnet hvis imageUrl finnes

        squadListElement.appendChild(listItem);
    });

     // Legg til dragstart-event listener på de nye listeelementene
     addDragListenersToSquadItems();
}


// === 3. UI Rendering (Oppdatering av Grensesnitt) END ===


// === 4. Drag and Drop Logikk START ===

/**
 * Legger til 'dragstart' event listeners på alle elementer i tropplisten.
 * Denne må kalles etter at listen er rendret/oppdatert.
 */
function addDragListenersToSquadItems() {
    const items = squadListElement.querySelectorAll('.squad-player-item');
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        // Vi trenger også dragend, etc. senere
    });
}

/**
 * Håndterer starten av et drag-event fra tropplisten.
 * @param {DragEvent} event
 */
function handleDragStart(event) {
    const playerId = event.target.getAttribute('data-player-id');
    event.dataTransfer.setData('text/plain', playerId); // Send spiller-ID med drag-eventet
    event.dataTransfer.effectAllowed = 'move'; // Indiker at vi flytter elementet
    event.target.classList.add('dragging'); // Gi visuell feedback
    console.log(`Dragging player: ${playerId}`);
}

// --- Flere drag-and-drop funksjoner (handleDragOver, handleDrop, handleDragEnd) kommer her ---

// === 4. Drag and Drop Logikk END ===


// === 5. Event Listeners START ===

// Initialiser event listeners når scriptet lastes
document.addEventListener('DOMContentLoaded', () => {
    // Åpne modal når "Legg til Spiller"-knappen klikkes
    addPlayerButton.addEventListener('click', openAddPlayerModal);

    // Lukk modal når lukkeknappen (X) klikkes
    closeButton.addEventListener('click', closeAddPlayerModal);

    // Lukk modal når brukeren klikker utenfor modal-innholdet
    window.addEventListener('click', (event) => {
        if (event.target === addPlayerModal) {
            closeAddPlayerModal();
        }
    });

    // Håndter bekreftelse av ny spiller
    confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm);

    // Rendrer en tom liste i starten (eller last inn fra lagring senere)
    renderSquadList();

    // TODO: Legg til flere event listeners (for fargevalg, tegning, lagring etc.)

});

// === 5. Event Listeners END ===


// --- Andre seksjoner kommer her senere (Spillerhåndtering på banen, Tegning, Lagring etc.) ---
