// === 0. Globale Variabler og Konstanter START ===
// (Som før)
// ...
// === 0. Globale Variabler og Konstanter END ===


// === 1. DOM Element Referanser START ===
// ... (Eksisterende referanser) ...
const squadListContainer = document.getElementById('squad-list-container'); // NY REFERANSE
// ... (Resten som før) ...
// === 1. DOM Element Referanser END ===


// === 2. Modal Håndtering START ===
// (Som før)
// ...
// === 2. Modal Håndtering END ===


// === 3. UI Rendering START ===
// (Som før)
// ...
// === 3. UI Rendering END ===


// === 4. Spillerbrikke Håndtering START ===
// (Som før)
// ...
// === 4. Spillerbrikke Håndtering END ===


// === 5. Drag and Drop Logikk START ===
// ... (Eksisterende drag start/over/leave/end/reset funksjoner) ...

function handleDropOnPitch(event) { /* ... (Som før) ... */ }
function handleDropOnBench(event) { /* ... (Som før) ... */ }

/**
 * Håndterer når et element slippes på TROPP-listen (sidebar).
 * @param {DragEvent} event
 */
function handleDropOnSquadList(event) {
    event.preventDefault();
    if (squadListContainer) squadListContainer.classList.remove('drag-over');
    let playerId;
    try { playerId = event.dataTransfer.getData('text/plain'); }
    catch (e) { console.error("Feil ved henting av dataTransfer:", e); resetDragState(); return; }
    if (!playerId) { console.warn("Drop on Squad List: Mottok tom playerId."); resetDragState(); return; }

    const player = getPlayerById(playerId);
    if (!player) { console.error("Drop on Squad List: Fant ikke spiller ID:", playerId); resetDragState(); return; }

    let stateChanged = false;

    // Håndter kun slipp fra BANEN eller BENKEN
    if (dragSource === 'pitch') {
        // Fjern fra banen
        if (playersOnPitch[playerId]) {
            playersOnPitch[playerId].remove();
            delete playersOnPitch[playerId];
            console.log(`Moved player ${playerId} from pitch to squad list`);
            stateChanged = true;
        }
    } else if (dragSource === 'bench') {
        // Fjern fra benken
        const benchIndex = playersOnBench.indexOf(playerId);
        if (benchIndex > -1) {
            playersOnBench.splice(benchIndex, 1);
            console.log(`Moved player ${playerId} from bench to squad list`);
            stateChanged = true;
        }
    } else if (dragSource === 'squad') {
        console.log("Ignorerer slipp fra tropp til tropp.");
        // Gjør ingenting
    }

    // Hvis tilstanden endret seg (spiller fjernet fra bane/benk)
    if (stateChanged) {
        saveCurrentState(); // Lagre den nye tilstanden (uten spilleren på bane/benk)
        renderUI(); // Oppdater alle lister
    }
    resetDragState();
}

// ... (Eksisterende drag end/reset funksjoner) ...
// === 5. Drag and Drop Logikk END ===


// === 6. Lokal Lagring START ===
// (Som før)
// ...
// === 6. Lokal Lagring END ===


// === 7. Event Listeners START ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initialiserer app...');
    loadSquad();
    loadLastState();
    populateSetupDropdown();

    // --- Modal Listeners ---
    // ... (Som før) ...

    // --- Drag and Drop Listeners ---
    if (pitchElement) { /* ... pitch listeners ... */ } else { console.error("DOMContentLoaded: pitchElement ikke funnet!"); }
    if (benchElement) { /* ... bench listeners ... */ } else { console.error("DOMContentLoaded: benchElement ikke funnet!"); }

    // NYE LISTENERS FOR TROPP-LISTE CONTAINER
    if (squadListContainer) {
        squadListContainer.addEventListener('dragover', (e) => handleDragOver(e, 'squad')); // Bruk 'squad' som type for evt. spesifikk styling
        squadListContainer.addEventListener('dragleave', (e) => handleDragLeave(e, 'squad'));
        squadListContainer.addEventListener('drop', handleDropOnSquadList); // Kall ny drop-funksjon
        console.log("DOMContentLoaded: Listeners lagt til på squadListContainer.");
    } else { console.error("DOMContentLoaded: squadListContainer ikke funnet!"); }

    // --- Lagre/Laste Oppsett Listeners ---
    // ... (Som før) ...

    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 7. Event Listeners END ===
