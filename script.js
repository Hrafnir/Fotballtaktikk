// === 0. Globale Variabler og Konstanter START ===
let squad = [];
let playersOnPitch = {};
let playersOnBench = [];
let nextPlayerId = 1;
let draggedPlayerId = null;
let draggedElement = null;
let dragSource = null;
let selectedPlayerIds = new Set(); // NY: For å holde styr på valgte spillere

const MAX_PLAYERS_ON_PITCH = 11;
const STORAGE_KEY_SQUAD = 'fotballtaktiker_squad';
const STORAGE_KEY_LAST_STATE = 'fotballtaktiker_lastState';
const STORAGE_KEY_SETUPS = 'fotballtaktiker_setups';
// === 0. Globale Variabler og Konstanter END ===


// === 1. DOM Element Referanser START ===
// ... (Eksisterende referanser) ...
const squadListContainer = document.getElementById('squad-list-container');
// NYE Referanser for Detail Modal
const playerDetailModal = document.getElementById('player-detail-modal');
const closeDetailButton = playerDetailModal ? playerDetailModal.querySelector('.close-detail-button') : null;
const detailModalTitle = document.getElementById('detail-modal-title');
const detailPlayerIdInput = document.getElementById('detail-player-id');
const detailPlayerNameInput = document.getElementById('detail-player-name');
const detailPlayerRoleInput = document.getElementById('detail-player-role');
const detailPlayerBirthdayInput = document.getElementById('detail-player-birthday');
const detailPlayerPhoneInput = document.getElementById('detail-player-phone');
const detailPlayerEmailInput = document.getElementById('detail-player-email');
const detailMatchCommentInput = document.getElementById('detail-match-comment');
const addCommentToHistoryButton = document.getElementById('add-comment-to-history-button');
const detailCommentHistoryDiv = document.getElementById('detail-comment-history');
const detailMatchesPlayedInput = document.getElementById('detail-matches-played');
const detailGoalsScoredInput = document.getElementById('detail-goals-scored');
const saveDetailsButton = document.getElementById('save-details-button');
// ... (Resten som før) ...
// === 1. DOM Element Referanser END ===


// === 2. Modal Håndtering START ===
// --- Player Add Modal (som før) ---
function openAddPlayerModal() { /* ... */ }
function closeAddPlayerModal() { /* ... */ }
function handleAddPlayerConfirm() {
    console.log('handleAddPlayerConfirm: Funksjonen startet.');
    const name = newPlayerNameInput.value.trim();
    const imageFile = newPlayerImageUpload.files[0];
    let imageUrl = newPlayerImageUrlInput.value.trim();
    const role = newPlayerRoleInput.value.trim();
    console.log('handleAddPlayerConfirm: Data fra modal:', { name, imageUrl, role }); // Fjernet imageFile herfra for klarhet
    if (!name) { alert('Spillernavn må fylles ut.'); return; }

    let finalImageUrl = '';
    if (imageUrl) { finalImageUrl = imageUrl; }
    else if (imageFile) { console.warn("Filopplasting støttes ikke for lagring enda."); }

    const maxId = squad.reduce((max, p) => {
         const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0;
         return Math.max(max, !isNaN(idNum) ? idNum : 0);
     }, 0);
    nextPlayerId = maxId + 1;

    // Inkluder nye standardverdier
    const newPlayer = {
        id: `player-${nextPlayerId}`, name: name, imageUrl: finalImageUrl, role: role,
        position: { x: 50, y: 50 }, borderColor: 'black',
        personalInfo: { birthday: '', phone: '', email: '' }, // NY
        matchStats: { matchesPlayed: 0, goalsScored: 0 }, // NY
        comments: [] // NY (tom array for historikk)
    };
    console.log('handleAddPlayerConfirm: Opprettet spillerobjekt:', newPlayer);
    squad.push(newPlayer); console.log('handleAddPlayerConfirm: Spiller lagt til:', squad);
    saveSquad(); console.log('handleAddPlayerConfirm: saveSquad() kalt.');
    renderUI(); console.log('handleAddPlayerConfirm: renderUI() kalt.');
    closeAddPlayerModal(); console.log('handleAddPlayerConfirm: closeAddPlayerModal() kalt.');
}

// --- Player Detail Modal (NY) ---
/**
 * Åpner detaljmodalen for en gitt spiller.
 * @param {string} playerId
 */
function openPlayerDetailModal(playerId) {
    console.log("openPlayerDetailModal for:", playerId);
    const player = getPlayerById(playerId);
    if (!player) {
        console.error("Kunne ikke finne spiller for detaljer:", playerId);
        return;
    }
    if (!playerDetailModal) { console.error("Player detail modal element ikke funnet!"); return; }

    // Fyll ut skjemaet
    detailPlayerIdInput.value = player.id;
    detailModalTitle.textContent = `Detaljer for ${player.name}`;
    detailPlayerNameInput.value = player.name || '';
    detailPlayerRoleInput.value = player.role || '';

    // Sørg for at disse objektene finnes (for eldre data)
    player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' };
    player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 };
    player.comments = player.comments || [];

    detailPlayerBirthdayInput.value = player.personalInfo.birthday || '';
    detailPlayerPhoneInput.value = player.personalInfo.phone || '';
    detailPlayerEmailInput.value = player.personalInfo.email || '';

    detailMatchesPlayedInput.value = player.matchStats.matchesPlayed || 0;
    detailGoalsScoredInput.value = player.matchStats.goalsScored || 0;

    // Fyll ut kommentarhistorikk
    renderCommentHistory(player.comments);

    // Tøm nåværende kamp-kommentar felt
    detailMatchCommentInput.value = '';

    playerDetailModal.style.display = 'block';
}

/**
 * Rendrer kommentarhistorikken i modalen.
 * @param {Array<object>} comments - Array med kommentarobjekter.
 */
function renderCommentHistory(comments) {
    if (!detailCommentHistoryDiv) return;
    detailCommentHistoryDiv.innerHTML = ''; // Tøm
    if (!comments || comments.length === 0) {
        detailCommentHistoryDiv.innerHTML = '<p><i>Ingen historikk.</i></p>';
        return;
    }

    // Sorter nyeste først (eller eldste, etter preferanse)
    const sortedComments = [...comments].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedComments.forEach(comment => {
        const p = document.createElement('p');
        const dateSpan = document.createElement('span');
        dateSpan.classList.add('comment-date');
        // Formater dato pent
        try {
            dateSpan.textContent = new Date(comment.date).toLocaleString('no-NO', {
                 year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
        } catch (e) {
            dateSpan.textContent = comment.date; // Fallback
        }
        const textNode = document.createTextNode(comment.text);
        p.appendChild(dateSpan);
        p.appendChild(textNode);
        detailCommentHistoryDiv.appendChild(p);
    });
}


/**
 * Lukker spillerdetalj-modalen.
 */
function closePlayerDetailModal() {
    if (playerDetailModal) {
        playerDetailModal.style.display = 'none';
    }
}

/**
 * Legger til nåværende kampkommentar i historikken for spilleren.
 */
function handleAddCommentToHistory() {
    const playerId = detailPlayerIdInput.value;
    const player = getPlayerById(playerId);
    const commentText = detailMatchCommentInput.value.trim();

    if (!player) { console.error("Kan ikke legge til kommentar, spiller ikke funnet:", playerId); return; }
    if (!commentText) { alert("Skriv en kommentar før du legger til i historikken."); return; }

    const newComment = {
        date: new Date().toISOString(), // Lagre som ISO string for enkel sortering/parsing
        text: commentText
    };

    player.comments = player.comments || []; // Sørg for at arrayet finnes
    player.comments.push(newComment);

    saveSquad(); // Lagre den oppdaterte spillerdataen
    renderCommentHistory(player.comments); // Oppdater visningen i modalen
    detailMatchCommentInput.value = ''; // Tøm feltet
    alert("Kommentar lagt til i historikken.");
}

/**
 * Lagrer alle endringer gjort i spillerdetalj-modalen.
 */
function handleSavePlayerDetails() {
    const playerId = detailPlayerIdInput.value;
    const player = getPlayerById(playerId);
    if (!player) { console.error("Kan ikke lagre detaljer, spiller ikke funnet:", playerId); return; }

    let dataChanged = false;
    let visualChanged = false; // For å vite om vi må oppdatere brikke/liste

    // Sammenlign og oppdater vanlige felt
    if (player.name !== detailPlayerNameInput.value) { player.name = detailPlayerNameInput.value; dataChanged = true; visualChanged = true; }
    if (player.role !== detailPlayerRoleInput.value) { player.role = detailPlayerRoleInput.value; dataChanged = true; visualChanged = true; }

    // Sørg for at sub-objekter finnes
    player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' };
    player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 };

    // Sammenlign og oppdater personlig info
    if (player.personalInfo.birthday !== detailPlayerBirthdayInput.value) { player.personalInfo.birthday = detailPlayerBirthdayInput.value; dataChanged = true; }
    if (player.personalInfo.phone !== detailPlayerPhoneInput.value) { player.personalInfo.phone = detailPlayerPhoneInput.value; dataChanged = true; }
    if (player.personalInfo.email !== detailPlayerEmailInput.value) { player.personalInfo.email = detailPlayerEmailInput.value; dataChanged = true; }

    // Sammenlign og oppdater statistikk (konverter til tall)
    const matches = parseInt(detailMatchesPlayedInput.value) || 0;
    const goals = parseInt(detailGoalsScoredInput.value) || 0;
    if (player.matchStats.matchesPlayed !== matches) { player.matchStats.matchesPlayed = matches; dataChanged = true; }
    if (player.matchStats.goalsScored !== goals) { player.matchStats.goalsScored = goals; dataChanged = true; }

    // Legg til eventuell usn lagret kampkommentar FØR vi lukker
    const currentComment = detailMatchCommentInput.value.trim();
    if (currentComment) {
        if (confirm("Du har usnlagret tekst i kamp-kommentarfeltet. Vil du legge den til i historikken før du lagrer?")) {
            handleAddCommentToHistory(); // Denne kaller saveSquad()
            dataChanged = true; // Sett denne uansett siden comment-arrayet ble endret
        }
    }

    if (dataChanged) {
        console.log("Lagrer spillerdetaljer for:", playerId, player);
        saveSquad(); // Lagre troppen med oppdaterte data
        if (visualChanged) {
            renderUI(); // Oppdater lister i sidebar
            // Oppdater brikken på banen (hvis den er der)
            const pieceElement = playersOnPitch[playerId];
            if (pieceElement) {
                const nameDiv = pieceElement.querySelector('.player-name');
                if (nameDiv) nameDiv.textContent = player.name;
                // Rolle vises ikke på brikken, men kan legges til hvis ønskelig
            }
        }
        alert("Spillerdetaljer lagret.");
    } else {
        console.log("Ingen endringer å lagre for:", playerId);
    }

    closePlayerDetailModal();
}
// === 2. Modal Håndtering END ===


// === 3. UI Rendering START ===
// (Funksjonene renderUI, renderOnPitchList, renderBench, renderSquadList som før)
function renderUI() { /* ... */ }
function renderOnPitchList() { /* ... */ }
function renderBench() { /* ... */ }
function renderSquadList() { /* ... */ }
// === 3. UI Rendering END ===


// === 4. Spillerbrikke Håndtering START ===
/**
 * Lager et nytt DOM-element for en spillerbrikke på banen.
 */
function createPlayerPieceElement(player, xPercent, yPercent) {
    const piece = document.createElement('div');
    piece.classList.add('player-piece', 'draggable');
    piece.setAttribute('data-player-id', player.id);
    piece.setAttribute('draggable', true);
    piece.style.left = `${xPercent}%`; piece.style.top = `${yPercent}%`;
    piece.style.transform = 'translate(-50%, -50%)';

    const imgContainer = document.createElement('div');
    imgContainer.classList.add('player-image-container');
    imgContainer.style.borderColor = player.borderColor || 'black'; // Bruk lagret farge

    const imgDiv = document.createElement('div');
    imgDiv.classList.add('player-image');
    if (player.imageUrl && !player.imageUrl.startsWith('placeholder-file:')) imgDiv.style.backgroundImage = `url('${player.imageUrl}')`;
    else imgDiv.style.backgroundColor = '#aaa';
    imgContainer.appendChild(imgDiv); piece.appendChild(imgContainer);

    const nameDiv = document.createElement('div');
    nameDiv.classList.add('player-name'); nameDiv.textContent = player.name;
    piece.appendChild(nameDiv);

    // --- NYE EVENT LISTENERS ---
    piece.addEventListener('dragstart', handleDragStartPiece);
    piece.addEventListener('dragend', handleDragEnd);
    // Dobbeltklikk for detaljer
    piece.addEventListener('dblclick', () => openPlayerDetailModal(player.id));
    // Enkeltklikk for valg/avvalg (for fargesetting)
    piece.addEventListener('click', handlePlayerPieceClick);
    // --- SLUTT NYE ---

    return piece;
}

function getPlayerById(playerId) { /* ... (som før) ... */ }
// === 4. Spillerbrikke Håndtering END ===


// === 5. Drag and Drop & Valg/Farge START === // (Utvidet seksjon)
// --- Drag/Drop (som før, men pass på renderUI/saveCurrentState kalles) ---
function addDragListenersToSquadItems() { /* ... */ }
function addDragListenersToBenchItems() { /* ... */ }
function handleDragStart(event) { /* ... */ }
function handleDragStartBench(event) { /* ... */ }
function handleDragStartPiece(event) { /* ... */ }
function handleDragOver(event, targetType) { /* ... */ }
function handleDragLeave(event, targetType) { /* ... */ }
function handleDropOnPitch(event) { /* ... */ }
function handleDropOnBench(event) { /* ... */ }
function handleDropOnSquadList(event) { /* ... */ }
function handleDragEnd(event) { /* ... */ }
function resetDragState() { /* ... */ }

// --- Spiller Valg (NY) ---
/**
 * Håndterer klikk på en spillerbrikke for å velge/avvelge den.
 * @param {MouseEvent} event
 */
function handlePlayerPieceClick(event) {
    const pieceElement = event.currentTarget; // Elementet listeneren er festet til
    const playerId = pieceElement.getAttribute('data-player-id');

    if (selectedPlayerIds.has(playerId)) {
        selectedPlayerIds.delete(playerId);
        pieceElement.classList.remove('selected');
    } else {
        selectedPlayerIds.add(playerId);
        pieceElement.classList.add('selected');
    }
    console.log("Valgte spillere:", selectedPlayerIds);
}

/**
 * Fjerner 'selected'-klassen fra alle brikker og tømmer settet.
 */
function clearPlayerSelection() {
    selectedPlayerIds.forEach(id => {
        const piece = playersOnPitch[id];
        if (piece) {
            piece.classList.remove('selected');
        }
    });
    selectedPlayerIds.clear();
    console.log("Valg nullstilt.");
}

// --- Fargesetting (NY/Oppdatert) ---
/**
 * Setter border-fargen for alle valgte spillere.
 */
function handleSetSelectedPlayerBorderColor() {
    const color = playerBorderColorInput.value;
    if (selectedPlayerIds.size === 0) {
        alert("Ingen spillere valgt. Klikk på spillerbrikker på banen for å velge.");
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
                if (imgContainer) {
                    imgContainer.style.borderColor = color;
                }
                stateChanged = true; // Data som påvirker visualisering er endret
            }
        }
    });

    if (stateChanged) {
        console.log("Farge oppdatert for valgte spillere til:", color);
        saveCurrentState(); // Lagre tilstanden siden borderColor er en del av den
    }

    // Nullstill valg etter fargesetting
    clearPlayerSelection();
}
// === 5. Drag and Drop & Valg/Farge END ===


// === 6. Lokal Lagring START ===
// (loadSquad må håndtere nye felt)
function saveSquad() { /* ... (som før) ... */ }

function loadSquad() {
    const savedSquadJson = localStorage.getItem(STORAGE_KEY_SQUAD);
    console.log("loadSquad: Hentet rådata fra localStorage:", savedSquadJson);
    if (savedSquadJson) {
        try {
            const parsedSquad = JSON.parse(savedSquadJson);
            // Gå gjennom og sikre at alle spillere har de nye feltene
            squad = parsedSquad.map(player => ({
                ...player, // Behold eksisterende data
                personalInfo: player.personalInfo || { birthday: '', phone: '', email: '' },
                matchStats: player.matchStats || { matchesPlayed: 0, goalsScored: 0 },
                comments: player.comments || [],
                borderColor: player.borderColor || 'black' // Sørg for default farge
            }));
            console.log("loadSquad: Parsed and initialized squad:", squad);
            const maxId = squad.reduce((max, p) => {
                 const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0;
                 return Math.max(max, !isNaN(idNum) ? idNum : 0);
             }, 0);
            nextPlayerId = maxId + 1;
            console.log("loadSquad: Next player ID satt til:", nextPlayerId);
            return true;
        } catch (e) { console.error("Feil ved parsing/initialisering av lagret tropp:", e); squad = []; localStorage.removeItem(STORAGE_KEY_SQUAD); return false; }
    }
    console.log("Ingen tropp funnet i localStorage.");
    squad = []; return false;
}

// (Resten av lagringsfunksjoner som før)
function getCurrentStateData() { /* ... (Sørg for at borderColor lagres) ... */ }
function saveCurrentState() { /* ... */ }
function applyState(stateData) { /* ... (Sørg for at borderColor lastes) ... */ }
function loadLastState() { /* ... */ }
function clearPitch() { /* ... */ }
function getSavedSetups() { /* ... */ }
function handleSaveSetup() { /* ... */ }
function handleLoadSetup() { /* ... */ }
function handleDeleteSetup() { /* ... */ }
function populateSetupDropdown() { /* ... */ }
// === 6. Lokal Lagring END ===


// === 7. Event Listeners START ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initialiserer app...');
    loadSquad(); loadLastState(); populateSetupDropdown();

    // --- Modal Listeners ---
    if (addPlayerButton) addPlayerButton.addEventListener('click', openAddPlayerModal); else console.error("addPlayerButton ikke funnet!");
    if (closeButton) closeButton.addEventListener('click', closeAddPlayerModal); else console.error("closeButton ikke funnet!");
    if (confirmAddPlayerButton) confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm); else console.error("confirmAddPlayerButton ikke funnet!");
    // NYE Listeners for Detail Modal
    if (closeDetailButton) closeDetailButton.addEventListener('click', closePlayerDetailModal); else console.error("closeDetailButton ikke funnet!");
    if (saveDetailsButton) saveDetailsButton.addEventListener('click', handleSavePlayerDetails); else console.error("saveDetailsButton ikke funnet!");
    if (addCommentToHistoryButton) addCommentToHistoryButton.addEventListener('click', handleAddCommentToHistory); else console.error("addCommentToHistoryButton ikke funnet!");

    window.addEventListener('click', (event) => {
        if (event.target === addPlayerModal) closeAddPlayerModal();
        if (event.target === playerDetailModal) closePlayerDetailModal(); // Lukk også detail modal ved klikk utenfor
        // Hvis vi klikker utenfor en spillerbrikke, nullstill valg
        if (!event.target.closest('.player-piece') && selectedPlayerIds.size > 0) {
             clearPlayerSelection();
        }
    });

    // --- Drag and Drop Listeners ---
    if (pitchElement) { /* ... pitch listeners ... */ } else { console.error("pitchElement ikke funnet!"); }
    if (benchElement) { /* ... bench listeners ... */ } else { console.error("benchElement ikke funnet!"); }
    if (squadListContainer) { /* ... squad list listeners ... */ } else { console.error("squadListContainer ikke funnet!"); }

    // --- Fargesetting Listener ---
    if (setBorderColorButton) setBorderColorButton.addEventListener('click', handleSetSelectedPlayerBorderColor); else console.error("setBorderColorButton ikke funnet!");

    // --- Lagre/Laste Oppsett Listeners ---
    if (saveSetupButton) saveSetupButton.addEventListener('click', handleSaveSetup); else console.error("saveSetupButton ikke funnet!");
    if (loadSetupButton) loadSetupButton.addEventListener('click', handleLoadSetup); else console.error("loadSetupButton ikke funnet!");
    if (deleteSetupButton) deleteSetupButton.addEventListener('click', handleDeleteSetup); else console.error("deleteSetupButton ikke funnet!");

    console.log('DOMContentLoaded: Initialisering ferdig.');
});
// === 7. Event Listeners END ===
