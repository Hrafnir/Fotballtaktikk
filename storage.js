/* Version: #12 */
// === Lokal Lagring (localStorage) Funksjoner START ===

// --- Tropplagring ---
function saveSquad() {
    try {
        // Fjern eventuelle bilde-blobs før lagring, behold imageKey/imageUrl
        const squadToSave = squad.map(player => {
            const { imageBlob, ...rest } = player; // Antar imageBlob ikke er standard del av player-objektet
            return rest;
        });
        localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(squadToSave));
        console.log("Tropp lagret i localStorage.");
    } catch (e) {
        console.error("Feil ved lagring av tropp til localStorage:", e);
        // Vurder å gi brukeren beskjed hvis lagring feiler kritisk
    }
}

function loadSquad() {
    const savedSquadJson = localStorage.getItem(STORAGE_KEY_SQUAD);
    if (savedSquadJson) {
        try {
            const parsedSquad = JSON.parse(savedSquadJson);
            // Sørg for at alle spillere har nødvendige default-verdier hvis de mangler
            squad = parsedSquad.map(player => ({
                ...player,
                nickname: player.nickname || '',
                imageUrl: player.imageUrl || '',
                imageKey: player.imageKey || null,
                personalInfo: player.personalInfo || { birthday: '', phone: '', email: '' },
                matchStats: player.matchStats || { matchesPlayed: 0, goalsScored: 0 },
                comments: player.comments || [],
                borderColor: player.borderColor || 'black',
                position: player.position || { x: 50, y: 50 }, // Default posisjon hvis mangler
                mainRole: player.mainRole || '',
                playableRoles: player.playableRoles || [],
                status: player.status || DEFAULT_PLAYER_STATUS
            }));

            // Oppdater nextPlayerId for å unngå ID-kollisjoner
            const maxId = squad.reduce((max, p) => {
                const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0;
                return Math.max(max, !isNaN(idNum) ? idNum : 0);
            }, 0);
            nextPlayerId = maxId + 1; // nextPlayerId er global (config.js)
            console.log("Tropp lastet fra localStorage.");
            return true;
        } catch (e) {
            console.error("Feil ved parsing av tropp fra localStorage:", e);
            squad = []; // Nullstill tropp ved feil
            localStorage.removeItem(STORAGE_KEY_SQUAD); // Fjern korrupt data
            return false;
        }
    }
    squad = []; // Ingen lagret tropp, start med tom
    nextPlayerId = 1;
    console.log("Ingen tropp funnet i localStorage, starter med tom tropp.");
    return false;
}

// --- Siste Tilstand Lagring ---
function getCurrentStateData() {
    const playersOnPitchData = {};
    for (const playerId in playersOnPitch) { // playersOnPitch er global (config.js)
        const player = getPlayerById(playerId); // getPlayerById fra utils.js
        if (player && player.position && typeof player.position.x === 'number' && typeof player.position.y === 'number') {
            playersOnPitchData[playerId] = {
                x: player.position.x,
                y: player.position.y,
                borderColor: player.borderColor || 'black'
            };
        } else if (player) { // Fallback hvis posisjon mangler av en eller annen grunn
            playersOnPitchData[playerId] = { x: 50, y: 50, borderColor: player.borderColor || 'black' };
        }
    }
    return {
        playersOnPitchData: playersOnPitchData,
        playersOnBenchIds: [...playersOnBench], // playersOnBench er global (config.js)
        isPitchRotated: isPitchRotated,         // isPitchRotated er global (config.js)
        ballPosition: ballSettings.position,    // ballSettings er global (config.js)
        ballSettings: {
            size: ballSettings.size,
            style: ballSettings.style,
            color: ballSettings.color
        },
        // activeMatchId: activeMatchId, // Vurder om dette skal med her eller håndteres separat
        // currentFormationName: currentFormation ? currentFormation.name : null // Lagre navnet på valgt formasjon
        // savedDrawings: savedDrawings // Lagre tegninger hvis de ikke er kamp-spesifikke
    };
}

function saveCurrentState() {
    try {
        const stateData = getCurrentStateData();
        localStorage.setItem(STORAGE_KEY_LAST_STATE, JSON.stringify(stateData));
        // console.log("Siste tilstand lagret."); // Kan være litt "noisy"
    } catch (e) {
        console.error("Feil ved lagring av siste tilstand:", e);
    }
}

function loadLastState() {
    const savedStateJson = localStorage.getItem(STORAGE_KEY_LAST_STATE);
    let stateData = {};
    if (savedStateJson) {
        try {
            stateData = JSON.parse(savedStateJson);
            console.log("Siste tilstand lastet fra localStorage.");
        } catch (e) {
            console.error("Feil ved parsing av siste tilstand fra localStorage:", e);
            localStorage.removeItem(STORAGE_KEY_LAST_STATE); // Fjern korrupt data
        }
    } else {
        console.log("Ingen siste tilstand funnet i localStorage.");
    }

    // Anvend state (selve applyState-funksjonen vil være i en annen fil, f.eks. main.js eller interactions.js)
    // Her setter vi bare de globale variablene som kan settes direkte
    isPitchRotated = stateData.isPitchRotated || false;
    
    // Ballinnstillinger
    ballSettings.size = (stateData.ballSettings && stateData.ballSettings.size) ? stateData.ballSettings.size : 35;
    ballSettings.style = (stateData.ballSettings && stateData.ballSettings.style) ? stateData.ballSettings.style : 'default';
    ballSettings.color = (stateData.ballSettings && stateData.ballSettings.color) ? stateData.ballSettings.color : '#FFA500';
    ballSettings.position = stateData.ballPosition || { x: 50, y: 50 };

    // activeMatchId = stateData.activeMatchId || null; // Hvis vi velger å lagre det her
    // const formationNameToLoad = stateData.currentFormationName || null; // For å sette formasjon
    // savedDrawings = stateData.savedDrawings || []; // For å laste tegninger

    // Resten av applyState (spillere på bane/benk) vil trenge funksjoner fra andre moduler
    // og kalles typisk fra main.js etter at alt annet er lastet.
    // For nå returnerer vi stateData slik at main.js kan kalle en dedikert applyState funksjon.
    return stateData;
}


// --- Lagrede Oppsett ---
function getSavedSetups() {
    const setupsJson = localStorage.getItem(STORAGE_KEY_SETUPS);
    if (setupsJson) {
        try {
            return JSON.parse(setupsJson);
        } catch (e) {
            console.error("Feil ved parsing av lagrede oppsett fra localStorage:", e);
            localStorage.removeItem(STORAGE_KEY_SETUPS); // Fjern korrupt data
            return {};
        }
    }
    return {};
}

function handleSaveSetup() {
    if(!setupNameInput || !loadSetupSelect) {
        console.warn("handleSaveSetup: Nødvendige DOM-elementer (setupNameInput, loadSetupSelect) ikke funnet.");
        return;
    }
    const name = setupNameInput.value.trim();
    if (!name) {
        alert("Vennligst skriv inn et navn for oppsettet.");
        setupNameInput.focus();
        return;
    }
    const currentSetups = getSavedSetups();
    if (currentSetups[name]) {
        if (!confirm(`Et oppsett med navnet "${name}" finnes allerede. Vil du overskrive det?`)) {
            return;
        }
    }
    const currentState = getCurrentStateData(); // Bruker samme funksjon som for siste tilstand
    currentSetups[name] = currentState;
    try {
        localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(currentSetups));
        alert(`Oppsett "${name}" lagret!`);
        populateSetupDropdown(); // populateSetupDropdown fra ui_render.js
        setupNameInput.value = '';
    } catch (e) {
        alert("En feil oppstod under lagring av oppsettet.");
        console.error("Feil ved lagring av oppsett til localStorage:", e);
    }
}

function handleLoadSetup() {
    if(!loadSetupSelect) {
        console.warn("handleLoadSetup: Nødvendig DOM-element (loadSetupSelect) ikke funnet.");
        return;
    }
    const selectedName = loadSetupSelect.value;
    if (!selectedName) {
        alert("Vennligst velg et oppsett fra listen.");
        return;
    }
    const savedSetups = getSavedSetups();
    const setupToLoad = savedSetups[selectedName];

    if (setupToLoad) {
        // applyState-funksjonen vil være i en annen fil (f.eks. interactions.js eller main.js)
        // Den må kalles herfra eller returnere data som kan brukes av den.
        // For nå, la oss anta at applyState er globalt tilgjengelig.
        if (typeof applyState === "function") {
            applyState(setupToLoad); // applyState fra interactions.js eller main.js
            alert(`Oppsett "${selectedName}" lastet!`);
            saveCurrentState(); // Lagre dette som "siste tilstand" også
        } else {
            console.error("handleLoadSetup: applyState function not found.");
            alert("Feil: Kunne ikke anvende oppsettet.");
        }
    } else {
        alert(`Oppsettet "${selectedName}" ble ikke funnet.`);
    }
}

function handleDeleteSetup() {
    if(!loadSetupSelect) {
        console.warn("handleDeleteSetup: Nødvendig DOM-element (loadSetupSelect) ikke funnet.");
        return;
    }
    const selectedName = loadSetupSelect.value;
    if (!selectedName) {
        alert("Vennligst velg et oppsett fra listen for å slette.");
        return;
    }
    const savedSetups = getSavedSetups();
    if (savedSetups[selectedName]) {
        if (confirm(`Er du sikker på at du vil slette oppsettet "${selectedName}"?`)) {
            delete savedSetups[selectedName];
            try {
                localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(savedSetups));
                alert(`Oppsett "${selectedName}" slettet.`);
                populateSetupDropdown(); // populateSetupDropdown fra ui_render.js
            } catch (e) {
                alert("En feil oppstod under sletting av oppsettet.");
                console.error("Feil ved sletting av oppsett fra localStorage:", e);
            }
        }
    } else {
        alert(`Oppsettet "${selectedName}" ble ikke funnet.`);
    }
}

// --- Kamplagring ---
function saveMatches() {
    try {
        localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches)); // matches er global (config.js)
        console.log("Kamper lagret i localStorage.");
    } catch (e) {
        console.error("Feil ved lagring av kamper til localStorage:", e);
    }
}

function loadMatches() {
    const savedMatchesJson = localStorage.getItem(STORAGE_KEY_MATCHES);
    if (savedMatchesJson) {
        try {
            matches = JSON.parse(savedMatchesJson); // matches er global (config.js)
            // Oppdater nextMatchId for å unngå kollisjoner
            if (matches.length > 0) {
                const maxIdNum = matches.reduce((max, m) => {
                    const idNum = m.id && typeof m.id === 'string' ? parseInt(m.id.split('-')[1]) : 0;
                    return Math.max(max, isNaN(idNum) ? 0 : idNum);
                }, 0);
                nextMatchId = maxIdNum + 1; // nextMatchId er global (config.js)
            } else {
                nextMatchId = 1;
            }
            console.log("Kamper lastet fra localStorage:", matches.length, "kamper funnet.");
            return true;
        } catch (e) {
            console.error("Feil ved parsing av kamper fra localStorage:", e);
            matches = [];
            localStorage.removeItem(STORAGE_KEY_MATCHES); // Fjern korrupt data
            return false;
        }
    }
    matches = []; // Ingen lagrede kamper
    nextMatchId = 1;
    console.log("Ingen kamper funnet i localStorage.");
    return false;
}
// === Lokal Lagring (localStorage) Funksjoner END ===
/* Version: #12 */
