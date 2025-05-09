/* Version: #24 */
// === Modal Håndtering (Spiller, Ball) START ===

// --- Felles Modal Funksjonalitet ---
/**
 * Viser en spesifikk fane i en modal og skjuler de andre.
 * @param {Event|null} event - Klikk-eventet fra fane-knappen.
 * @param {string} tabName - ID-en til faneinnholdet som skal vises.
 * @param {string} modalId - ID-en til selve modal-elementet som inneholder fanene.
 */
function openModalTab(event, tabName, modalId) {
    const modalElement = document.getElementById(modalId); // Hent modal-elementet basert på ID

    if (!modalElement) {
        console.error(`openModalTab: modalElement med ID "${modalId}" ikke funnet.`);
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

    const currentTabContent = modalElement.querySelector("#" + tabName);
    if (currentTabContent) {
        currentTabContent.style.display = "block";
        currentTabContent.classList.add("active");
    } else {
        console.warn(`openModalTab: Faneinnhold med ID "${tabName}" ikke funnet i modal:`, modalElement);
    }

    // event.currentTarget vil være knappen som ble klikket
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        // Fallback hvis kalt programmatisk uten et event (f.eks. ved første åpning av modal)
        const fallbackButton = modalElement.querySelector(`.tab-button[onclick*="'${tabName}'"]`);
        if (fallbackButton) {
            fallbackButton.classList.add('active');
        }
    }
}


// --- Spillerdetalj Modal ---
function openPlayerDetailModal(playerId) {
    const player = getPlayerById(playerId);
    if (!player || !playerDetailModal) {
        console.error("Kan ikke åpne detaljer. Spiller eller modal-element ikke funnet. SpillerID:", playerId);
        return;
    }

    player.personalInfo = player.personalInfo || { birthday: '', phone: '', email: '' };
    player.matchStats = player.matchStats || { matchesPlayed: 0, goalsScored: 0 };
    player.comments = player.comments || [];
    player.nickname = player.nickname || '';
    player.imageUrl = player.imageUrl || '';
    player.mainRole = player.mainRole || '';
    player.playableRoles = player.playableRoles || [];
    player.status = player.status || DEFAULT_PLAYER_STATUS;
    player.imageKey = player.imageKey || null;

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
    const detailImageUploadInput = playerDetailModal.querySelector('#detail-player-image-upload');

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
    detailImageUploadInput.value = '';

    populateStatusDropdown('detail-player-status', player.status);
    detailBirthdayInput.value = player.personalInfo.birthday || '';
    detailPhoneInput.value = player.personalInfo.phone || '';
    detailEmailInput.value = player.personalInfo.email || '';
    detailMatchesPlayedInput.value = player.matchStats.matchesPlayed || 0;
    detailGoalsScoredInput.value = player.matchStats.goalsScored || 0;

    populateRolesCheckboxes('detail-player-roles-checkboxes', player.playableRoles);
    renderCommentHistory(player.comments, detailCommentHistory);
    detailMatchComment.value = '';

    detailImageDisplay.style.backgroundImage = 'none';
    detailImageDisplay.innerHTML = '<span>Laster bilde...</span>';
    if (player.imageKey) {
        loadImageFromDB(player.imageKey)
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
    const firstTabButton = playerDetailModal.querySelector('.tab-button');
    if (firstTabButton) {
        // Kaller openModalTab med den første fanens data og modalens ID
        const firstTabName = firstTabButton.getAttribute('onclick').match(/'([^']+)'/)[1]; // Henter tabName fra onclick
        openModalTab({currentTarget: firstTabButton}, firstTabName, 'player-detail-modal');
    }
}

function closePlayerDetailModal() {
    if (playerDetailModal) {
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
    const player = getPlayerById(playerId);
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

    saveSquad();
    renderCommentHistory(player.comments, detailCommentHistoryDiv);
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
    const detailMatchCommentInput = playerDetailModal.querySelector('#detail-match-comment');

    if (!detailIdInput || !detailNameInput || !detailNicknameInput || !detailImageUrlInput ||
        !detailImageUploadInput || !detailMainRoleInput || !detailPlayerStatusSelect ||
        !detailBirthdayInput || !detailPhoneInput || !detailEmailInput ||
        !detailMatchesPlayedInput || !detailGoalsScoredInput || !detailMatchCommentInput) {
        console.error("handleSavePlayerDetails: Ett eller flere DOM-elementer mangler i spillerdetalj-modalen.");
        alert("En feil oppstod under lagring. Noen felter ble ikke funnet.");
        return;
    }

    const playerId = detailIdInput.value;
    const player = getPlayerById(playerId);
    if (!player) {
        console.error(`handleSavePlayerDetails: Fant ikke spiller med ID "${playerId}".`);
        alert("Feil: Spiller ikke funnet.");
        return;
    }

    let dataChanged = false;
    let visualChanged = false;
    let imageUpdatePromise = Promise.resolve();

    if (player.name !== detailNameInput.value) { player.name = detailNameInput.value; dataChanged = true; visualChanged = true; }
    if (player.nickname !== detailNicknameInput.value.trim()) { player.nickname = detailNicknameInput.value.trim(); dataChanged = true; visualChanged = true; }
    if (player.mainRole !== detailMainRoleInput.value) { player.mainRole = detailMainRoleInput.value; dataChanged = true; visualChanged = true; }
    if (player.status !== detailPlayerStatusSelect.value) { player.status = detailPlayerStatusSelect.value; dataChanged = true; visualChanged = true; }

    const selectedRoles = [];
    const rolesCheckboxesContainer = playerDetailModal.querySelector('#detail-player-roles-checkboxes');
    if (rolesCheckboxesContainer) {
        const roleCheckboxes = rolesCheckboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
        roleCheckboxes.forEach(cb => selectedRoles.push(cb.value));
    }
    if (JSON.stringify(player.playableRoles || []) !== JSON.stringify(selectedRoles)) { player.playableRoles = selectedRoles; dataChanged = true; visualChanged = true; }

    player.personalInfo = player.personalInfo || {};
    if (player.personalInfo.birthday !== detailBirthdayInput.value) { player.personalInfo.birthday = detailBirthdayInput.value; dataChanged = true; }
    if (player.personalInfo.phone !== detailPhoneInput.value) { player.personalInfo.phone = detailPhoneInput.value; dataChanged = true; }
    if (player.personalInfo.email !== detailEmailInput.value) { player.personalInfo.email = detailEmailInput.value; dataChanged = true; }

    player.matchStats = player.matchStats || {};
    const matchesPlayedVal = parseInt(detailMatchesPlayedInput.value, 10) || 0;
    const goalsScoredVal = parseInt(detailGoalsScoredInput.value, 10) || 0;
    if (player.matchStats.matchesPlayed !== matchesPlayedVal) { player.matchStats.matchesPlayed = matchesPlayedVal; dataChanged = true; }
    if (player.matchStats.goalsScored !== goalsScoredVal) { player.matchStats.goalsScored = goalsScoredVal; dataChanged = true; }

    const imageFile = detailImageUploadInput.files[0];
    const newImageUrlFromInput = detailImageUrlInput.value.trim();

    if (imageFile) {
        player.imageKey = playerId;
        player.imageUrl = '';
        dataChanged = true;
        visualChanged = true;
        imageUpdatePromise = saveImageToDB(playerId, imageFile);
    } else if (player.imageUrl !== newImageUrlFromInput || (newImageUrlFromInput === '' && player.imageKey)) {
        player.imageUrl = newImageUrlFromInput;
        dataChanged = true;
        visualChanged = true;
        if (player.imageKey) {
            imageUpdatePromise = deleteImageFromDB(player.imageKey).then(() => {
                player.imageKey = null;
            });
        }
    }

    imageUpdatePromise
        .catch(error => {
            console.error("Feil under bildeoppdatering i DB ved lagring av spillerdetaljer:", error);
            alert("En feil oppstod under oppdatering av spillerbilde.");
        })
        .finally(() => {
            const currentCommentText = detailMatchCommentInput.value.trim();
            if (currentCommentText) {
                if (confirm("Du har usnlagret tekst i kommentarfeltet. Vil du legge den til i historikken før du lagrer endringene?")) {
                    handleAddCommentToHistory();
                    dataChanged = true;
                }
            }

            if (dataChanged) {
                saveSquad();
                if (visualChanged) {
                    if (typeof renderUI === "function") renderUI();
                    if (appContainer && appContainer.classList.contains('view-squad') && typeof renderFullSquadList === "function") {
                        renderFullSquadList();
                    }
                    if (playersOnPitch[playerId] && typeof updatePlayerPieceVisuals === "function") {
                        updatePlayerPieceVisuals(playerId);
                    }
                }
                alert("Spillerdetaljer lagret.");
            } else {
                console.log("Ingen endringer i spillerdetaljer å lagre for:", playerId);
            }
            closePlayerDetailModal();
        });
}

function handleDeletePlayer(playerId, playerName) {
    if (!playerId) {
        console.error("handleDeletePlayer: playerId mangler.");
        return;
    }
    const player = getPlayerById(playerId);
    const effectivePlayerName = playerName || (player ? player.name : playerId);

    const confirmDelete = confirm(`Er du sikker på at du vil slette spilleren "${effectivePlayerName}" permanent?\nSpilleren fjernes fra troppen, banen og benken.`);
    if (confirmDelete) {
        let deleteImagePromise = Promise.resolve();
        if (player && player.imageKey) {
            deleteImagePromise = deleteImageFromDB(player.imageKey);
        }

        deleteImagePromise
            .catch(error => {
                console.error(`Kunne ikke slette bilde fra DB for ${playerId} under sletting av spiller:`, error);
            })
            .finally(() => {
                const playerIndex = squad.findIndex(p => p.id === playerId);
                if (playerIndex > -1) {
                    squad.splice(playerIndex, 1);
                }

                if (playersOnPitch[playerId]) {
                    playersOnPitch[playerId].remove();
                    delete playersOnPitch[playerId];
                }

                const benchIndex = playersOnBench.indexOf(playerId);
                if (benchIndex > -1) {
                    playersOnBench.splice(benchIndex, 1);
                }

                saveSquad();
                saveCurrentState();
                
                if (typeof renderUI === "function") renderUI();
                if (appContainer && appContainer.classList.contains('view-squad') && typeof renderFullSquadList === "function") {
                     renderFullSquadList();
                }
                alert(`Spiller "${effectivePlayerName}" ble slettet.`);
                closePlayerDetailModal();
            });
    } else {
        console.log(`Sletting av spiller ${playerId} (${effectivePlayerName}) avbrutt.`);
    }
}

function handleDetailImageUpload(event) {
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
            console.error("handleDetailImageUpload: Interne elementer i modalen mangler.");
            return;
        }

        reader.onload = function(e) {
            if (detailImageDisplay) {
                detailImageDisplay.style.backgroundImage = `url('${e.target.result}')`;
                detailImageDisplay.innerHTML = '';
            }
            if (detailImageUrlInput) {
                detailImageUrlInput.value = '';
            }
        };
        reader.readAsDataURL(file);
    }
}

function openAddPlayerModal() {
    if (!addPlayerModal) {
        console.error('openAddPlayerModal: addPlayerModal elementet er null!');
        return;
    }
    addPlayerModal.style.display = 'block';

    if (newPlayerNameInput) newPlayerNameInput.value = '';
    if (newPlayerImageUpload) newPlayerImageUpload.value = '';
    if (newPlayerImageUrlInput) newPlayerImageUrlInput.value = '';
    if (newPlayerMainRoleInput) newPlayerMainRoleInput.value = '';

    populateRolesCheckboxes('new-player-roles-checkboxes');

    if (newPlayerNameInput) newPlayerNameInput.focus();
}

function closeAddPlayerModal() {
    if (addPlayerModal) {
        addPlayerModal.style.display = 'none';
    }
}

function handleAddPlayerConfirm() {
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

    const maxId = squad.reduce((max, p) => {
        const idNum = p.id && typeof p.id === 'string' ? parseInt(p.id.split('-')[1]) : 0;
        return Math.max(max, !isNaN(idNum) ? idNum : 0);
    }, 0);
    nextPlayerId = maxId + 1;
    const playerId = `player-${nextPlayerId}`;

    const newPlayer = {
        id: playerId, name: name, mainRole: mainRole, playableRoles: selectedRoles,
        status: DEFAULT_PLAYER_STATUS, nickname: '', position: { x: 50, y: 50 },
        borderColor: 'black', personalInfo: { birthday: '', phone: '', email: '' },
        matchStats: { matchesPlayed: 0, goalsScored: 0 }, comments: [],
        imageUrl: imageUrl, imageKey: null
    };

    const completePlayerAddition = () => {
        squad.push(newPlayer);
        saveSquad();
        if (typeof renderUI === "function") renderUI();
        if (appContainer && appContainer.classList.contains('view-squad') && typeof renderFullSquadList === "function") {
            renderFullSquadList();
        }
        closeAddPlayerModal();
        console.log("Ny spiller lagt til:", newPlayer);
    };

    if (imageFile) {
        newPlayer.imageKey = playerId;
        newPlayer.imageUrl = '';
        saveImageToDB(playerId, imageFile)
            .then(() => {
                console.log(`Bilde for ny spiller ${playerId} lagret i DB.`);
                completePlayerAddition();
            })
            .catch(error => {
                console.error(`Feil ved lagring av bilde for ny spiller ${playerId}:`, error);
                alert("Feil ved lagring av bilde. Spilleren ble lagt til, men uten det opplastede bildet.");
                newPlayer.imageKey = null;
                completePlayerAddition();
            });
    } else {
        completePlayerAddition();
    }
}

function openBallSettingsModal() {
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

    sizeSlider.value = ballSettings.size;
    sizeValueDisplay.textContent = `${ballSettings.size}px`;
    customColorInput.value = ballSettings.color;
    styleRadios.forEach(radio => {
        radio.checked = radio.value === ballSettings.style;
    });

    ballSettingsModal.style.display = 'block';
}

function closeBallSettingsModal() {
    if (ballSettingsModal) {
        ballSettingsModal.style.display = 'none';
    }
}

function handleBallSizeChange(event) {
    if (!ballSettingsModal || !ballElement) return;
    const newSize = event.target.value;
    const sizeValueDisplay = ballSettingsModal.querySelector('#ball-size-value');
    if (sizeValueDisplay) sizeValueDisplay.textContent = `${newSize}px`;
    ballElement.style.width = `${newSize}px`;
    ballElement.style.height = `${newSize}px`;
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

    ballSettings.size = parseInt(sizeSlider.value, 10);
    ballSettings.style = selectedStyleRadio.value;
    ballSettings.color = customColorInput.value;

    if (typeof applyBallStyle === "function") applyBallStyle();
    if (typeof saveCurrentState === "function") saveCurrentState();
    closeBallSettingsModal();
    alert("Ballinnstillinger lagret!");
}

// === Modal Håndtering (Spiller, Ball) END ===
/* Version: #24 */
