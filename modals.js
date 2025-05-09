/* Version: #15 */
// === Modal Håndtering (Spiller, Ball) START ===

// --- Felles Modal Funksjonalitet ---
/**
 * Viser en spesifikk fane i en modal og skjuler de andre.
 * @param {Event|null} event - Klikk-eventet fra fane-knappen (kan være null ved programmatisk kall).
 * @param {string} tabName - ID-en til faneinnholdet som skal vises.
 * @param {HTMLElement} modalElement - Selve modal-elementet som inneholder fanene.
 */
function openModalTab(event, tabName, modalElement) {
    if (!modalElement) {
        console.error("openModalTab: modalElement er ikke gitt.");
        return;
    }
    let i, tabcontent, tablinks;
    tabcontent = modalElement.getElementsByClassName("modal-tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active");
    }
    tablinks = modalElement.getElementsByClassName("tab-button");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    const currentTabContent = modalElement.querySelector("#" + tabName); // Viktig med # for ID
    if (currentTabContent) {
        currentTabContent.style.display = "block";
        currentTabContent.classList.add("active");
    } else {
        console.warn(`openModalTab: Faneinnhold med ID "${tabName}" ikke funnet i modal:`, modalElement);
    }

    const clickedButton = event ? event.currentTarget : modalElement.querySelector(`.tab-button[onclick*="'${tabName}'"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}


// --- Spillerdetalj Modal ---
function openPlayerDetailModal(playerId) {
    const player = getPlayerById(playerId); // Fra utils.js
    // playerDetailModal er global (config.js, initialiseres i main.js)
    if (!player || !playerDetailModal) {
        console.error("Kan ikke åpne detaljer. Spiller eller modal-element ikke funnet. SpillerID:", playerId);
        return;
    }

    // Sørg for at alle nødvendige sub-objekter/arrays finnes
    player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' };
    player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 };
    player.comments = player.comments || [];
    player.nickname = player.nickname || '';
    player.imageUrl = player.imageUrl || '';
    player.mainRole = player.mainRole || '';
    player.playableRoles = player.playableRoles || [];
    player.status = player.status || DEFAULT_PLAYER_STATUS; // DEFAULT_PLAYER_STATUS fra config.js
    player.imageKey = player.imageKey || null;

    // Hent referanser til input-felter inne i modalen
    const detailIdInput = playerDetailModal.querySelector('#detail-player-id');
    const detailTitle = playerDetailModal.querySelector('#detail-modal-title');
    const detailNameInput = playerDetailModal.querySelector('#detail-player-name');
    const detailNicknameInput = playerDetailModal.querySelector('#detail-player-nickname');
    const detailImageUrlInput = playerDetailModal.querySelector('#detail-player-image-url');
    const detailImageDisplay = playerDetailModal.querySelector('#detail-player-image-display');
    const detailMainRoleInput = playerDetailModal.querySelector('#detail-player-main-role');
    const detailPlayerStatusSelect = playerDetailModal.querySelector('#detail-player-status');
    const detailBirthdayInput = playerDetailModal.querySelector('#detail-player-birthday');
    const detailPhoneInput = playerDetailModal.querySelector('#detail-player-phone');
    const detailEmailInput = playerDetailModal.querySelector('#detail-player-email');
    const detailMatchesPlayedInput = playerDetailModal.querySelector('#detail-matches-played');
    const detailGoalsScoredInput = playerDetailModal.querySelector('#detail-goals-scored');
    const detailCommentHistory = playerDetailModal.querySelector('#detail-comment-history');
    const detailMatchComment = playerDetailModal.querySelector('#detail-match-comment');
    const detailImageUploadInput = playerDetailModal.querySelector('#detail-player-image-upload'); // Sjekk at denne IDen er unik

    if (!detailIdInput || !detailTitle || !detailNameInput || !detailNicknameInput || !detailImageUrlInput ||
        !detailImageDisplay || !detailMainRoleInput || !detailPlayerStatusSelect || !detailBirthdayInput ||
        !detailPhoneInput || !detailEmailInput || !detailMatchesPlayedInput || !detailGoalsScoredInput ||
        !detailCommentHistory || !detailMatchComment || !detailImageUploadInput) {
        console.error("openPlayerDetailModal: Ett eller flere interne DOM-elementer mangler i spillerdetalj-modalen.");
        return;
    }

    detailIdInput.value = player.id;
    detailTitle.textContent = `Detaljer for ${player.name || "Ukjent Spiller"}`;
    detailNameInput.value = player.name || '';
    detailNicknameInput.value = player.nickname;
    detailMainRoleInput.value = player.mainRole || '';
    detailImageUrlInput.value = player.imageUrl;
    detailImageUploadInput.value = ''; // Nullstill filinput

    populateStatusDropdown('detail-player-status', player.status); // populateStatusDropdown fra ui_render.js
    detailBirthdayInput.value = player.personalInfo.birthday || '';
    detailPhoneInput.value = player.personalInfo.phone || '';
    detailEmailInput.value = player.personalInfo.email || '';
    detailMatchesPlayedInput.value = player.matchStats.matchesPlayed || 0;
    detailGoalsScoredInput.value = player.matchStats.goalsScored || 0;

    populateRolesCheckboxes('detail-player-roles-checkboxes', player.playableRoles); // populateRolesCheckboxes fra ui_render.js
    renderCommentHistory(player.comments, detailCommentHistory); // renderCommentHistory fra ui_render.js
    detailMatchComment.value = '';

    // Håndter bildevisning
    detailImageDisplay.style.backgroundImage = 'none';
    detailImageDisplay.innerHTML = '<span>Laster bilde...</span>';
    if (player.imageKey) {
        loadImageFromDB(player.imageKey) // loadImageFromDB fra db.js
            .then(blob => {
                const objectURL = URL.createObjectURL(blob);
                detailImageDisplay.style.backgroundImage = `url('${objectURL}')`;
                detailImageDisplay.innerHTML = '';
            })
            .catch(error => {
                console.warn(`Kunne ikke laste bilde fra DB for key ${player.imageKey}:`, error);
                if (player.imageUrl) {
                    detailImageDisplay.style.backgroundImage = `url('${player.imageUrl}')`;
                    detailImageDisplay.innerHTML = '';
                } else {
                    detailImageDisplay.innerHTML = '<span>Ingen bilde</span>';
                }
            });
    } else if (player.imageUrl) {
        detailImageDisplay.style.backgroundImage = `url('${player.imageUrl}')`;
        detailImageDisplay.innerHTML = '';
    } else {
        detailImageDisplay.innerHTML = '<span>Ingen bilde</span>';
    }

    playerDetailModal.style.display = 'block';
    // Åpne første fane som standard, eller en spesifikk fane
    const firstTabButton = playerDetailModal.querySelector('.tab-button');
    if (firstTabButton) {
        // Simuler et klikk-event for openModalTab for å sette aktiv klasse korrekt
        const mockEvent = { currentTarget: firstTabButton };
        openModalTab(mockEvent, 'info-tab', playerDetailModal);
    } else {
        // Fallback hvis ingen fane-knapper finnes (mindre sannsynlig)
        openModalTab(null, 'info-tab', playerDetailModal);
    }
}

function closePlayerDetailModal() {
    if (playerDetailModal) { // playerDetailModal er global
        playerDetailModal.style.display = 'none';
    }
}

function handleAddCommentToHistory() {
    if (!playerDetailModal) return;
    const detailIdInput = playerDetailModal.querySelector('#detail-player-id');
    const detailMatchCommentInput = playerDetailModal.querySelector('#detail-match-comment');
    const detailCommentHistoryDiv = playerDetailModal.querySelector('#detail-comment-history');

    if (!detailIdInput || !detailMatchCommentInput || !detailCommentHistoryDiv) {
        console.error("handleAddCommentToHistory: Mangler nødvendige elementer i spillerdetalj-modalen.");
        return;
    }
    const playerId = detailIdInput.value;
    const player = getPlayerById(playerId); // Fra utils.js
    const commentText = detailMatchCommentInput.value.trim();

    if (!player) {
        console.error("handleAddCommentToHistory: Fant ikke spiller med ID:", playerId);
        return;
    }
    if (!commentText) {
        alert("Vennligst skriv en kommentar før du legger til.");
        detailMatchCommentInput.focus();
        return;
    }

    const newComment = { date: new Date().toISOString(), text: commentText };
    player.comments = player.comments || [];
    player.comments.push(newComment);

    saveSquad(); // Fra storage.js
    renderCommentHistory(player.comments, detailCommentHistoryDiv); // Fra ui_render.js
    detailMatchCommentInput.value = '';
    alert("Kommentar lagt til i historikken.");
}

function handleSavePlayerDetails() {
    if (!playerDetailModal) {
        console.error("handleSavePlayerDetails: playerDetailModal er ikke definert.");
        return;
    }

    const detailIdInput = playerDetailModal.querySelector('#detail-player-id');
    const detailNameInput = playerDetailModal.querySelector('#detail-player-name');
    const detailNicknameInput = playerDetailModal.querySelector('#detail-player-nickname');
    const detailImageUrlInput = playerDetailModal.querySelector('#detail-player-image-url');
    const detailImageUploadInput = playerDetailModal.querySelector('#detail-player-image-upload');
    const detailMainRoleInput = playerDetailModal.querySelector('#detail-player-main-role');
    const detailPlayerStatusSelect = playerDetailModal.querySelector('#detail-player-status');
    const detailBirthdayInput = playerDetailModal.querySelector('#detail-player-birthday');
    const detailPhoneInput = playerDetailModal.querySelector('#detail-player-phone');
    const detailEmailInput = playerDetailModal.querySelector('#detail-player-email');
    const detailMatchesPlayedInput = playerDetailModal.querySelector('#detail-matches-played');
    const detailGoalsScoredInput = playerDetailModal.querySelector('#detail-goals-scored');
    const detailMatchCommentInput = playerDetailModal.querySelector('#detail-match-comment'); // For å sjekke om det er usnlagret tekst

    if (!detailIdInput || !detailNameInput || !detailNicknameInput || !detailImageUrlInput ||
        !detailImageUploadInput || !detailMainRoleInput || !detailPlayerStatusSelect ||
        !detailBirthdayInput || !detailPhoneInput || !detailEmailInput ||
        !detailMatchesPlayedInput || !detailGoalsScoredInput || !detailMatchCommentInput) {
        console.error("handleSavePlayerDetails: Ett eller flere DOM-elementer mangler i spillerdetalj-modalen.");
        alert("En feil oppstod under lagring. Noen felter ble ikke funnet.");
        return;
    }

    const playerId = detailIdInput.value;
    const player = getPlayerById(playerId); // Fra utils.js
    if (!player) {
        console.error(`handleSavePlayerDetails: Fant ikke spiller med ID "${playerId}".`);
        alert("Feil: Spiller ikke funnet.");
        return;
    }

    let dataChanged = false;
    let visualChanged = false; // For å vite om vi trenger å re-rendre brikker etc.
    let imageUpdatePromise = Promise.resolve();

    // Sjekk og oppdater felter
    if (player.name !== detailNameInput.value) { player.name = detailNameInput.value; dataChanged = true; visualChanged = true; }
    if (player.nickname !== detailNicknameInput.value.trim()) { player.nickname = detailNicknameInput.value.trim(); dataChanged = true; visualChanged = true; }
    if (player.mainRole !== detailMainRoleInput.value) { player.mainRole = detailMainRoleInput.value; dataChanged = true; visualChanged = true; } // Antar mainRole kan påvirke visning
    if (player.status !== detailPlayerStatusSelect.value) { player.status = detailPlayerStatusSelect.value; dataChanged = true; visualChanged = true; } // Status påvirker listevisning

    const selectedRoles = [];
    const rolesCheckboxesContainer = playerDetailModal.querySelector('#detail-player-roles-checkboxes');
    if (rolesCheckboxesContainer) {
        const roleCheckboxes = rolesCheckboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
        roleCheckboxes.forEach(cb => selectedRoles.push(cb.value));
    }
    if (JSON.stringify(player.playableRoles || []) !== JSON.stringify(selectedRoles)) { player.playableRoles = selectedRoles; dataChanged = true; visualChanged = true; } // Kan påvirke filtrering

    player.personalInfo = player.personalInfo || {}; // Sikre at objektet finnes
    if (player.personalInfo.birthday !== detailBirthdayInput.value) { player.personalInfo.birthday = detailBirthdayInput.value; dataChanged = true; }
    if (player.personalInfo.phone !== detailPhoneInput.value) { player.personalInfo.phone = detailPhoneInput.value; dataChanged = true; }
    if (player.personalInfo.email !== detailEmailInput.value) { player.personalInfo.email = detailEmailInput.value; dataChanged = true; }

    player.matchStats = player.matchStats || {}; // Sikre at objektet finnes
    const matchesPlayedVal = parseInt(detailMatchesPlayedInput.value, 10) || 0;
    const goalsScoredVal = parseInt(detailGoalsScoredInput.value, 10) || 0;
    if (player.matchStats.matchesPlayed !== matchesPlayedVal) { player.matchStats.matchesPlayed = matchesPlayedVal; dataChanged = true; }
    if (player.matchStats.goalsScored !== goalsScoredVal) { player.matchStats.goalsScored = goalsScoredVal; dataChanged = true; }

    // Håndter bildeoppdatering
    const imageFile = detailImageUploadInput.files[0];
    const newImageUrlFromInput = detailImageUrlInput.value.trim();

    if (imageFile) { // Ny fil lastet opp prioriteres
        console.log(`Ny bildefil valgt for ${playerId}, forbereder lagring i DB...`);
        player.imageKey = playerId; // Bruk spiller-ID som nøkkel for bildet
        player.imageUrl = '';     // Tømmer URL hvis fil brukes
        dataChanged = true;
        visualChanged = true;
        imageUpdatePromise = saveImageToDB(playerId, imageFile); // saveImageToDB fra db.js
    } else if (player.imageUrl !== newImageUrlFromInput || (newImageUrlFromInput === '' && player.imageKey)) {
        // URL er endret, ELLER URL er tømt og det var et bilde i DB (som nå skal fjernes)
        console.log(`Bilde-URL endret for ${playerId} til: "${newImageUrlFromInput}" (tidligere: "${player.imageUrl}", key: ${player.imageKey})`);
        player.imageUrl = newImageUrlFromInput;
        dataChanged = true;
        visualChanged = true;
        if (player.imageKey) { // Hvis det var et bilde i DB, og URL nå er endret/tømt
            console.log(`Fjerner tidligere lagret bilde fra DB for ${playerId} (key: ${player.imageKey}) pga. URL-endring/tømming.`);
            imageUpdatePromise = deleteImageFromDB(player.imageKey).then(() => { // deleteImageFromDB fra db.js
                player.imageKey = null;
            });
        }
    }

    imageUpdatePromise
        .catch(error => {
            console.error("Feil under bildeoppdatering i DB ved lagring av spillerdetaljer:", error);
            alert("En feil oppstod under oppdatering av spillerbilde. Detaljer er kanskje ikke fullstendig lagret.");
            // Vurder om dataChanged skal settes til false her for å unngå delvis lagring,
            // eller om brukeren skal informeres om at kun bildelagring feilet.
        })
        .finally(() => {
            const currentCommentText = detailMatchCommentInput.value.trim();
            if (currentCommentText) {
                if (confirm("Du har usnlagret tekst i kommentarfeltet. Vil du legge den til i historikken før du lagrer endringene?")) {
                    handleAddCommentToHistory(); // Denne kaller saveSquad() internt
                    dataChanged = true; // Sørg for at vi vet at data er endret
                }
            }

            if (dataChanged) {
                console.log("Lagrer spillerdetaljer for:", playerId, player);
                saveSquad(); // Fra storage.js
                if (visualChanged) {
                    if (typeof renderUI === "function") renderUI(); // Fra ui_render.js
                    if (appContainer && appContainer.classList.contains('view-squad') && typeof renderFullSquadList === "function") {
                        renderFullSquadList(); // Fra ui_render.js
                    }
                    if (playersOnPitch[playerId] && typeof updatePlayerPieceVisuals === "function") {
                        updatePlayerPieceVisuals(playerId); // Fra pitch_elements.js
                    }
                }
                alert("Spillerdetaljer lagret.");
            } else {
                console.log("Ingen endringer i spillerdetaljer å lagre for:", playerId);
            }
            closePlayerDetailModal();
        });
}

function handleDeletePlayer(playerId, playerName) { // playerName er kun for confirm-dialogen
    if (!playerId) {
        console.error("handleDeletePlayer: playerId mangler.");
        return;
    }
    const player = getPlayerById(playerId); // Fra utils.js
    const effectivePlayerName = playerName || (player ? player.name : playerId);

    const confirmDelete = confirm(`Er du sikker på at du vil slette spilleren "${effectivePlayerName}" permanent?\nSpilleren fjernes fra troppen, banen og benken.`);
    if (confirmDelete) {
        console.log(`Sletter spiller: ${playerId} (${effectivePlayerName})`);
        let deleteImagePromise = Promise.resolve();
        if (player && player.imageKey) {
            deleteImagePromise = deleteImageFromDB(player.imageKey); // Fra db.js
        }

        deleteImagePromise
            .catch(error => {
                console.error(`Kunne ikke slette bilde fra DB for ${playerId} under sletting av spiller:`, error);
                // Fortsett med sletting av spillerdata uansett
            })
            .finally(() => {
                const playerIndex = squad.findIndex(p => p.id === playerId); // squad er global (config.js)
                if (playerIndex > -1) {
                    squad.splice(playerIndex, 1);
                } else {
                    console.warn(`handleDeletePlayer: Spiller ${playerId} ikke funnet i squad-arrayen.`);
                }

                if (playersOnPitch[playerId]) { // playersOnPitch er global (config.js)
                    playersOnPitch[playerId].remove(); // Fjern DOM-elementet
                    delete playersOnPitch[playerId];
                    console.log(` - Spiller ${playerId} fjernet fra banen.`);
                }

                const benchIndex = playersOnBench.indexOf(playerId); // playersOnBench er global (config.js)
                if (benchIndex > -1) {
                    playersOnBench.splice(benchIndex, 1);
                    console.log(` - Spiller ${playerId} fjernet fra benken.`);
                }

                saveSquad();        // Fra storage.js
                saveCurrentState(); // Fra storage.js (oppdaterer lister over spillere på bane/benk)
                
                if (typeof renderUI === "function") renderUI(); // Fra ui_render.js
                if (appContainer && appContainer.classList.contains('view-squad') && typeof renderFullSquadList === "function") {
                     renderFullSquadList(); // Fra ui_render.js
                }
                alert(`Spiller "${effectivePlayerName}" ble slettet.`);
                closePlayerDetailModal(); // Lukk modalen hvis den var åpen for denne spilleren
            });
    } else {
        console.log(`Sletting av spiller ${playerId} (${effectivePlayerName}) avbrutt.`);
    }
}

function handleDetailImageUpload(event) {
    // detailPlayerImageUpload er global (config.js, initialiseres i main.js)
    // playerDetailModal er global (config.js, initialiseres i main.js)
    if (!detailPlayerImageUpload || !playerDetailModal) {
        console.error("handleDetailImageUpload: Nødvendige DOM elementer mangler.");
        return;
    }
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        const detailImageDisplay = playerDetailModal.querySelector('#detail-player-image-display');
        const detailImageUrlInput = playerDetailModal.querySelector('#detail-player-image-url');

        if (!detailImageDisplay || !detailImageUrlInput) {
            console.error("handleDetailImageUpload: Interne elementer i modalen mangler (#detail-player-image-display, #detail-player-image-url).");
            return;
        }

        reader.onload = function(e) {
            if (detailImageDisplay) {
                detailImageDisplay.style.backgroundImage = `url('${e.target.result}')`;
                detailImageDisplay.innerHTML = ''; // Fjern eventuell tekst som "Laster bilde..."
            }
            if (detailImageUrlInput) {
                detailImageUrlInput.value = ''; // Tøm URL-feltet siden en fil er valgt
            }
        };
        reader.readAsDataURL(file);
    }
}


// --- "Legg til Spiller" Modal ---
function openAddPlayerModal() {
    // addPlayerModal, newPlayerNameInput etc. er globale (config.js, initialiseres i main.js)
    if (!addPlayerModal) {
        console.error('openAddPlayerModal: addPlayerModal elementet er null!');
        return;
    }
    addPlayerModal.style.display = 'block';

    if (newPlayerNameInput) newPlayerNameInput.value = '';
    if (newPlayerImageUpload) newPlayerImageUpload.value = ''; // Nullstill filinput
    if (newPlayerImageUrlInput) newPlayerImageUrlInput.value = '';
    if (newPlayerMainRoleInput) newPlayerMainRoleInput.value = '';

    populateRolesCheckboxes('new-player-roles-checkboxes'); // populateRolesCheckboxes fra ui_render.js

    if (newPlayerNameInput) newPlayerNameInput.focus();
}

function closeAddPlayerModal() {
    if (addPlayerModal) { // addPlayerModal er global
        addPlayerModal.style.display = 'none';
    }
}

function handleAddPlayerConfirm() {
    // newPlayerNameInput etc. er globale (config.js, initialiseres i main.js)
    if (!newPlayerNameInput || !newPlayerImageUrlInput || !newPlayerMainRoleInput || !newPlayerImageUpload) {
        console.error("handleAddPlayerConfirm: Viktige input-elementer for 'legg til spiller' mangler (er null).");
        alert("En feil oppstod. Kan ikke legge til spiller.");
        return;
    }

    const name = newPlayerNameInput.value.trim();
    const imageFile = newPlayerImageUpload.files[0];
    let imageUrl = newPlayerImageUrlInput.value.trim();
    const mainRole = newPlayerMainRoleInput.value.trim();

    if (!name) {
        alert('Spillernavn må fylles ut.');
        newPlayerNameInput.focus();
        return;
    }

    const selectedRoles = [];
    const newPlayerRolesContainer = document.getElementById('new-player-roles-checkboxes');
    if (newPlayerRolesContainer) {
        const roleCheckboxes = newPlayerRolesContainer.querySelectorAll('input[type="checkbox"]:checked');
        roleCheckboxes.forEach(cb => selectedRoles.push(cb.value));
    }

    // Finn høyeste eksisterende numeriske ID for å unngå kollisjoner
    const maxId = squad.reduce((max, p) => { // squad er global (config.js)
        const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0;
        return Math.max(max, !isNaN(idNum) ? idNum : 0);
    }, 0);
    nextPlayerId = maxId + 1; // nextPlayerId er global (config.js)
    const playerId = `player-${nextPlayerId}`;

    const newPlayer = {
        id: playerId,
        name: name,
        mainRole: mainRole,
        playableRoles: selectedRoles,
        status: DEFAULT_PLAYER_STATUS, // DEFAULT_PLAYER_STATUS fra config.js
        nickname: '',
        position: { x: 50, y: 50 }, // Default posisjon
        borderColor: 'black',
        personalInfo: { birthday: '', phone: '', email: '' },
        matchStats: { matchesPlayed: 0, goalsScored: 0 },
        comments: [],
        imageUrl: imageUrl, // Start med URL, kan overskrives av bildeKey hvis fil lastes opp
        imageKey: null
    };

    const completePlayerAddition = () => {
        squad.push(newPlayer);
        saveSquad(); // Fra storage.js
        if (typeof renderUI === "function") renderUI(); // Fra ui_render.js
        if (appContainer && appContainer.classList.contains('view-squad') && typeof renderFullSquadList === "function") {
            renderFullSquadList(); // Fra ui_render.js
        }
        closeAddPlayerModal();
        console.log("Ny spiller lagt til:", newPlayer);
    };

    if (imageFile) {
        console.log(`Forsøker å lagre opplastet bilde for ny spiller ${playerId} i IndexedDB...`);
        newPlayer.imageKey = playerId; // Bruk spillerens ID som nøkkel for bildet
        newPlayer.imageUrl = '';     // Tøm imageUrl hvis vi bruker en fil
        saveImageToDB(playerId, imageFile) // saveImageToDB fra db.js
            .then(() => {
                console.log(`Bilde for ny spiller ${playerId} lagret i DB.`);
                completePlayerAddition();
            })
            .catch(error => {
                console.error(`Feil ved lagring av bilde for ny spiller ${playerId}:`, error);
                alert("Feil ved lagring av bilde. Spilleren ble lagt til, men uten det opplastede bildet.");
                newPlayer.imageKey = null; // Nullstill imageKey ved feil
                // Hvis URL var oppgitt, kan vi vurdere å falle tilbake til den?
                // For nå, la newPlayer.imageUrl være det den var (tom hvis bilde ble prioritert)
                completePlayerAddition();
            });
    } else {
        // Ingen fil lastet opp, bruk eventuell imageUrl
        completePlayerAddition();
    }
}


// --- Ballinnstillinger Modal ---
function openBallSettingsModal() {
    // ballSettingsModal er global (config.js, initialiseres i main.js)
    if (!ballSettingsModal) {
        console.error("openBallSettingsModal: ballSettingsModal elementet er null!");
        return;
    }

    const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider');
    const sizeValueDisplay = ballSettingsModal.querySelector('#ball-size-value');
    const customColorInput = ballSettingsModal.querySelector('#ball-custom-color');
    const styleRadios = ballSettingsModal.querySelectorAll('input[name="ball-style"]');

    if (!sizeSlider || !sizeValueDisplay || !customColorInput || !styleRadios) {
        console.error("openBallSettingsModal: Ett eller flere interne elementer mangler i ballinnstillinger-modalen.");
        return;
    }

    sizeSlider.value = ballSettings.size; // ballSettings er global (config.js)
    sizeValueDisplay.textContent = `${ballSettings.size}px`;
    customColorInput.value = ballSettings.color;
    styleRadios.forEach(radio => {
        radio.checked = radio.value === ballSettings.style;
    });

    ballSettingsModal.style.display = 'block';
}

function closeBallSettingsModal() {
    if (ballSettingsModal) { // ballSettingsModal er global
        ballSettingsModal.style.display = 'none';
    }
}

function handleBallSizeChange(event) { // event.target vil være sizeSlider
    // ballSettingsModal er global
    if (!ballSettingsModal || !ballElement) return; // ballElement er global (config.js)

    const newSize = event.target.value;
    const sizeValueDisplay = ballSettingsModal.querySelector('#ball-size-value');

    if (sizeValueDisplay) sizeValueDisplay.textContent = `${newSize}px`;
    
    // Oppdater ballens utseende direkte (midlertidig)
    ballElement.style.width = `${newSize}px`;
    ballElement.style.height = `${newSize}px`;
    // Endelig lagring skjer i handleSaveBallSettings
}

function handleSaveBallSettings() {
    if (!ballSettingsModal) return;

    const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider');
    const selectedStyleRadio = ballSettingsModal.querySelector('input[name="ball-style"]:checked');
    const customColorInput = ballSettingsModal.querySelector('#ball-custom-color');

    if (!sizeSlider || !selectedStyleRadio || !customColorInput) {
        console.error("handleSaveBallSettings: Ett eller flere interne elementer mangler i ballinnstillinger-modalen.");
        alert("Feil: Kunne ikke lagre ballinnstillinger.");
        return;
    }

    ballSettings.size = parseInt(sizeSlider.value, 10); // ballSettings er global (config.js)
    ballSettings.style = selectedStyleRadio.value;
    ballSettings.color = customColorInput.value;

    applyBallStyle(); // applyBallStyle fra pitch_elements.js
    saveCurrentState(); // Fra storage.js (lagrer ballSettings som del av siste tilstand)
    closeBallSettingsModal();
    alert("Ballinnstillinger lagret!");
}

// === Modal Håndtering (Spiller, Ball) END ===
/* Version: #15 */
