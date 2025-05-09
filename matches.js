/* Version: #14 */
// === Kamp Håndtering (Matches Logic) START ===

/**
 * Åpner modalen for å legge til en ny kamp.
 * Setter default verdier for input-feltene.
 */
function openAddMatchModal() {
    // addMatchModal er en global variabel (definert i config.js, initialisert i main.js)
    if (!addMatchModal) {
        console.error('openAddMatchModal: addMatchModal elementet er null!');
        alert("Feil: Kan ikke åpne modal for å legge til kamp.");
        return;
    }

    // Hent input-felt direkte via document.getElementById for robusthet
    const dateInput = document.getElementById('new-match-only-date');
    const timeInput = document.getElementById('new-match-time');
    const opponentInput = document.getElementById('new-match-opponent');
    const venueInput = document.getElementById('new-match-venue');

    // console.log("openAddMatchModal - refs:", {dateInput, timeInput, opponentInput, venueInput}); // For debugging

    if (dateInput) dateInput.value = ''; // Nullstill dato
    if (timeInput) timeInput.value = '18:00'; // Default tid
    if (opponentInput) opponentInput.value = ''; // Nullstill motstander
    if (venueInput) venueInput.value = 'H'; // Default til Hjemme

    addMatchModal.style.display = 'block';
    if (dateInput) {
        dateInput.focus();
    } else {
        console.warn("openAddMatchModal: Kunne ikke fokusere på dato-input (ikke funnet).")
    }
}

/**
 * Lukker modalen for å legge til en ny kamp.
 */
function closeAddMatchModal() {
    // addMatchModal er en global variabel
    if (addMatchModal) {
        addMatchModal.style.display = 'none';
    }
}

/**
 * Håndterer bekreftelsen fra "Legg til kamp"-modalen.
 * Validerer input, oppretter et nytt kampobjekt, lagrer det,
 * og oppdaterer UI.
 */
function handleAddMatchConfirm() {
    // addMatchModal er en global variabel
    if (!addMatchModal) {
        console.error("handleAddMatchConfirm: addMatchModal er null. Kan ikke fortsette.");
        alert("En kritisk feil oppstod (modal ikke funnet). Prøv å laste siden på nytt.");
        return;
    }

    const dateInput = document.getElementById('new-match-only-date');
    const timeInput = document.getElementById('new-match-time');
    const opponentInput = document.getElementById('new-match-opponent');
    const venueInput = document.getElementById('new-match-venue');

    // console.log("handleAddMatchConfirm - refs:", {dateInput, timeInput, opponentInput, venueInput}); // For debugging


    if (!dateInput || !timeInput || !opponentInput || !venueInput) {
        console.error("handleAddMatchConfirm: Ett eller flere input-elementer for kamp ble ikke funnet i dokumentet!");
        alert("En feil oppstod: Kunne ikke finne alle nødvendige felt for å legge til kamp. Sjekk ID-er i HTML og script.");
        return;
    }

    const datePart = dateInput.value;
    const timePart = timeInput.value;
    const opponent = opponentInput.value.trim();
    const venue = venueInput.value;

    if (!datePart) {
        alert('Dato for kampen må fylles ut.');
        dateInput.focus();
        return;
    }
    if (!timePart) {
        alert('Tidspunkt for kampen må fylles ut.');
        timeInput.focus();
        return;
    }
    if (!opponent) {
        alert('Motstander må fylles ut.');
        opponentInput.focus();
        return;
    }

    // Kombiner dato og tid til en ISO 8601-kompatibel streng
    const combinedDateTime = `${datePart}T${timePart}:00`; // Legger til sekunder for bedre kompatibilitet
    let matchDateTime;
    try {
        const testDate = new Date(combinedDateTime);
        if (isNaN(testDate.getTime())) { // Sjekker om datoobjektet er gyldig
            throw new Error("Invalid date/time value resulted in NaN from new Date()");
        }
        matchDateTime = testDate.toISOString();
    } catch (e) {
        alert("Ugyldig dato/tid format. Vennligst sjekk input.\nForventet format: ÅÅÅÅ-MM-DD og TT:MM");
        console.error("Feil ved parsing av dato/tid:", combinedDateTime, e);
        return;
    }

    const newMatch = {
        id: generateMatchId(), // generateMatchId() fra utils.js
        dateTime: matchDateTime, // Lagres som ISO-streng
        opponent: opponent,
        venue: venue, // 'H' eller 'B'
        resultHome: null,
        resultAway: null,
        status: DEFAULT_MATCH_STATUS, // DEFAULT_MATCH_STATUS fra config.js
        tacticsState: null, // For lagring av baneoppsett etc. for denne kampen
        notes: '' // Generelle kampnotater
    };

    matches.push(newMatch); // matches er global (config.js)
    saveMatches();          // saveMatches() fra storage.js
    
    if (typeof renderMatchList === "function") renderMatchList(); // renderMatchList() fra ui_render.js
    if (typeof populateActiveMatchDropdown === "function") populateActiveMatchDropdown(); // populateActiveMatchDropdown() fra ui_render.js
    
    closeAddMatchModal();
    console.log("Ny kamp lagt til:", newMatch);
}


/**
 * Håndterer endring i valg av aktiv kamp fra dropdown-menyen.
 * @param {Event} event - Change-eventet fra select-elementet.
 */
function handleActiveMatchChange(event) {
    activeMatchId = event.target.value; // activeMatchId er global (config.js)

    if (activeMatchId) {
        const selectedMatch = matches.find(m => m.id === activeMatchId); // matches er global (config.js)
        console.log("Aktiv kamp valgt:", selectedMatch ? selectedMatch : "Fant ikke kamp med ID: " + activeMatchId);
        // Her vil logikk for å laste kamp-spesifikt oppsett komme senere.
        // For nå, kan vi f.eks. nullstille banen eller laste en standardtilstand.
        // loadLastState(); // Eller en ny funksjon: loadMatchState(activeMatchId);
        if (typeof loadMatchStateAndApply === "function") {
            loadMatchStateAndApply(activeMatchId);
        } else {
            console.warn("handleActiveMatchChange: loadMatchStateAndApply function not defined yet. Loading default state.");
            if(typeof loadLastStateAndApply === "function") loadLastStateAndApply(); // Fallback til generell tilstand
        }

    } else {
        console.log("Ingen aktiv kamp valgt. Går tilbake til generell modus.");
        // Last generelt/siste oppsett
        if(typeof loadLastStateAndApply === "function") loadLastStateAndApply();
    }
    // Det er viktig å vurdere om `saveCurrentState()` skal kalles her,
    // eller om endring av aktiv kamp bare skal laste, ikke lagre umiddelbart.
    // Trolig best å la endringer på banen trigge lagring for den aktive kampen.
}

// Funksjon for å laste kamp-state (placeholder for nå, utvides senere)
function loadMatchStateAndApply(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (match && match.tacticsState) {
        console.log(`Laster taktikk-tilstand for kamp: ${match.opponent}`);
        if (typeof applyState === "function") {
            applyState(match.tacticsState); // applyState fra interactions.js/main.js
        } else {
            console.error("loadMatchStateAndApply: applyState function not found.");
        }
    } else if (match) {
        console.log(`Ingen lagret taktikk-tilstand for kamp: ${match.opponent}. Vurder å starte med blankt eller siste generelle tilstand.`);
        // Kanskje nullstille banen eller bruke generisk state?
        // clearPitchAndState(); // En ny funksjon for å rydde banen helt
        if(typeof loadLastStateAndApply === "function") loadLastStateAndApply(true); // true for å indikere at det er for en ny/tom kamp
    }
}

// Funksjon for å lagre nåværende baneoppsett til den aktive kampen
// Denne vil kalles når brukeren gjør endringer på taktikktavlen MENS en kamp er aktiv.
function saveCurrentSetupToActiveMatch() {
    if (!activeMatchId) return; // Ingen aktiv kamp å lagre til

    const matchIndex = matches.findIndex(m => m.id === activeMatchId);
    if (matchIndex > -1) {
        matches[matchIndex].tacticsState = getCurrentStateData(); // getCurrentStateData fra storage.js
        saveMatches(); // Lagre hele matches-arrayet med den oppdaterte kampen
        console.log(`Oppsett lagret for aktiv kamp: ${matches[matchIndex].opponent}`);
    } else {
        console.warn("saveCurrentSetupToActiveMatch: Fant ikke aktiv kamp for lagring.");
    }
}

// === Kamp Håndtering (Matches Logic) END ===
/* Version: #14 */
