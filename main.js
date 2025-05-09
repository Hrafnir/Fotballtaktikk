/* Version: #20 */
// === Hoved Applikasjonslogikk og Initialisering (main.js) START ===

document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser DOM Element Referanser (deklarert i config.js)
    appContainer = document.querySelector('.app-container');
    sidebar = document.querySelector('.sidebar');
    toggleSidebarButton = document.getElementById('toggle-sidebar-button');
    onPitchListElement = document.getElementById('on-pitch-list');
    benchListElement = document.getElementById('bench-list');
    squadListElement = document.getElementById('squad-list');
    squadListContainer = document.getElementById('squad-list-container');
    onPitchCountElement = document.getElementById('on-pitch-count');
    onBenchCountElement = document.getElementById('on-bench-count');
    pitchElement = document.getElementById('pitch');
    pitchSurface = document.getElementById('pitch-surface');
    rotatePitchButton = document.getElementById('rotate-pitch-button');
    addPlayerButton = document.getElementById('add-player-button');
    playerBorderColorInput = document.getElementById('player-border-color');
    setBorderColorButton = document.getElementById('set-border-color-button');
    setColorRedButton = document.getElementById('set-color-red');
    setColorYellowButton = document.getElementById('set-color-yellow');
    setColorGreenButton = document.getElementById('set-color-green');
    setColorDefaultButton = document.getElementById('set-color-default');
    toggleDrawModeButton = document.getElementById('toggle-draw-mode-button');
    clearDrawingsButton = document.getElementById('clear-drawings-button');
    setupNameInput = document.getElementById('setup-name');
    saveSetupButton = document.getElementById('save-setup-button');
    loadSetupSelect = document.getElementById('load-setup-select');
    loadSetupButton = document.getElementById('load-setup-button');
    deleteSetupButton = document.getElementById('delete-setup-button');
    exportPngButton = document.getElementById('export-png-button');
    pitchContainer = document.getElementById('pitch-container');
    drawingCanvas = document.getElementById('drawing-canvas');
    ballElement = document.getElementById('ball');
    navTacticsButton = document.getElementById('nav-tactics-button');
    navSquadButton = document.getElementById('nav-squad-button');
    navMatchesButton = document.getElementById('nav-matches-button');
    tacticsPageContent = document.getElementById('tactics-page-content');
    squadPageContent = document.getElementById('squad-page-content');
    matchesPageContent = document.getElementById('matches-page-content');
    fullSquadListContainer = document.getElementById('full-squad-list-container');
    onPitchSectionElement = document.getElementById('on-pitch-section');
    formationSelect = document.getElementById('formation-select');
    
    // Modaler
    addPlayerModal = document.getElementById('add-player-modal');
    playerDetailModal = document.getElementById('player-detail-modal');
    ballSettingsModal = document.getElementById('ball-settings-modal');
    addMatchModal = document.getElementById('add-match-modal'); // Kamp-modal

    // Interne elementer i addPlayerModal
    if (addPlayerModal) {
        closeButton = addPlayerModal.querySelector('.close-button'); // Generisk lukkeknapp
        newPlayerNameInput = document.getElementById('new-player-name');
        newPlayerImageUpload = document.getElementById('new-player-image-upload');
        newPlayerImageUrlInput = document.getElementById('new-player-image-url');
        newPlayerMainRoleInput = document.getElementById('new-player-main-role');
        confirmAddPlayerButton = document.getElementById('confirm-add-player');
    } else {
        console.error("DOMContentLoaded: addPlayerModal ikke funnet!");
    }

    // Interne elementer i addMatchModal
    if (addMatchModal) {
        closeAddMatchModalButton = addMatchModal.querySelector('.close-add-match-modal-button');
        confirmAddMatchButton = addMatchModal.querySelector('#confirm-add-match-button');
        // Input-felter hentes nå direkte i matches.js funksjonene for robusthet
    } else {
        console.error("DOMContentLoaded: addMatchModal (for kamper) ikke funnet!");
    }
    
    benchElement = document.getElementById('bench');
    squadManagementSection = document.getElementById('squad-management');
    drawToolButtons = document.querySelectorAll('.draw-tool-button');
    drawingColorInput = document.getElementById('drawing-color');
    toggleVisibilityButton = document.getElementById('toggle-visibility-button');
    undoDrawingButton = document.getElementById('undo-drawing-button');
    fullscreenButton = document.getElementById('fullscreen-button');
    
    if(playerDetailModal) { // Sjekk om modalen finnes før querySelector
        detailModalTabButtons = playerDetailModal.querySelectorAll('.tab-button');
        detailPlayerImageUpload = document.getElementById('detail-player-image-upload');
    } else {
        console.error("DOMContentLoaded: playerDetailModal ikke funnet!");
    }

    // Kamp-spesifikke UI-elementer
    addNewMatchButton = document.getElementById('add-new-match-button');
    matchListContainer = document.getElementById('match-list-container');
    activeMatchSelect = document.getElementById('active-match-select');
    matchPreparationSection = document.getElementById('match-preparation-section');

    // --- Initialiser Applikasjonen ---
    try {
        await initDB(); // Fra db.js
        console.log("Database initialisert.");
        loadSquad();    // Fra storage.js
        loadMatches();  // Fra storage.js
        
        // loadLastState returnerer stateData, som så brukes av applyState
        const lastStateData = loadLastState(); // Fra storage.js
        applyState(lastStateData);             // Fra interactions.js
        
        populateSetupDropdown();        // Fra ui_render.js
        populateActiveMatchDropdown();  // Fra ui_render.js
        
        if (typeof setupDrawingCanvas === "function") setupDrawingCanvas(); // Fra pitch_elements.js
        else console.error("setupDrawingCanvas function not found during init.");

        if (typeof renderUI === "function") renderUI(); // Oppdater lister etc.
        else console.error("renderUI function not found during init.");
        
        // Sett start-view (f.eks. taktikk)
        switchView('tactics'); // Fra interactions.js. Dette vil også kalle resizePitchElement.

    } catch (error) {
        console.error("Feil under global initialisering i DOMContentLoaded:", error);
        alert("En kritisk feil oppstod under lasting av applikasjonen. Sjekk konsollen for detaljer.");
    }

    // --- Sett opp Event Listeners ---

    // Generelle UI-elementer
    if (toggleSidebarButton) toggleSidebarButton.addEventListener('click', toggleSidebar); // Fra interactions.js
    if (rotatePitchButton) rotatePitchButton.addEventListener('click', togglePitchRotation); // Fra interactions.js
    if (fullscreenButton) fullscreenButton.addEventListener('click', toggleFullscreen); // Fra interactions.js

    // Navigasjonsknapper
    if (navTacticsButton) navTacticsButton.addEventListener('click', () => switchView('tactics'));
    if (navSquadButton) navSquadButton.addEventListener('click', () => switchView('squad'));
    if (navMatchesButton) navMatchesButton.addEventListener('click', () => switchView('matches'));

    // Spillerhåndtering & Modaler
    if (addPlayerButton) addPlayerButton.addEventListener('click', openAddPlayerModal); // Fra modals.js
    if (closeButton) closeButton.addEventListener('click', closeAddPlayerModal); // Fra modals.js (for addPlayerModal)
    if (confirmAddPlayerButton) confirmAddPlayerButton.addEventListener('click', handleAddPlayerConfirm); // Fra modals.js

    if (playerDetailModal) {
        const detailModalCloseBtn = playerDetailModal.querySelector('.close-detail-button');
        const detailModalSaveBtn = playerDetailModal.querySelector('#save-details-button');
        const detailModalAddCommentBtn = playerDetailModal.querySelector('#add-comment-to-history-button');

        if (detailModalCloseBtn) detailModalCloseBtn.addEventListener('click', closePlayerDetailModal); // Fra modals.js
        if (detailModalSaveBtn) detailModalSaveBtn.addEventListener('click', handleSavePlayerDetails); // Fra modals.js
        if (detailModalAddCommentBtn) detailModalAddCommentBtn.addEventListener('click', handleAddCommentToHistory); // Fra modals.js
        if (detailPlayerImageUpload) detailPlayerImageUpload.addEventListener('change', handleDetailImageUpload); // Fra modals.js
    }

    // Ballinnstillinger Modal
    if (ballElement) ballElement.addEventListener('dblclick', openBallSettingsModal); // Fra modals.js
    if (ballSettingsModal) {
        const closeBallBtn = ballSettingsModal.querySelector('.close-ball-settings-button');
        const saveBallBtn = ballSettingsModal.querySelector('#save-ball-settings-button');
        const sizeSlider = ballSettingsModal.querySelector('#ball-size-slider');
        if (closeBallBtn) closeBallBtn.addEventListener('click', closeBallSettingsModal); // Fra modals.js
        if (saveBallBtn) saveBallBtn.addEventListener('click', handleSaveBallSettings); // Fra modals.js
        if (sizeSlider) sizeSlider.addEventListener('input', handleBallSizeChange); // Fra modals.js
    }

    // Kamphåndtering Modal & UI
    if (addNewMatchButton) addNewMatchButton.addEventListener('click', openAddMatchModal); // Fra matches.js
    if (closeAddMatchModalButton) closeAddMatchModalButton.addEventListener('click', closeAddMatchModal); // Fra matches.js
    if (confirmAddMatchButton) confirmAddMatchButton.addEventListener('click', handleAddMatchConfirm); // Fra matches.js
    if (activeMatchSelect) activeMatchSelect.addEventListener('change', handleActiveMatchChange); // Fra matches.js

    // Drag and Drop mål
    if (pitchElement) {
        pitchElement.addEventListener('dragover', (e) => handleDragOver(e, 'pitch')); // Fra interactions.js
        pitchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'pitch'));
        pitchElement.addEventListener('drop', handleDropOnPitch);
    }
    if (benchElement) {
        benchElement.addEventListener('dragover', (e) => handleDragOver(e, 'bench'));
        benchElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'bench'));
        benchElement.addEventListener('drop', handleDropOnBench);
    }
    if (squadListContainer) {
        squadListContainer.addEventListener('dragover', (e) => handleDragOver(e, 'squad'));
        squadListContainer.addEventListener('dragleave', (e) => handleDragLeave(e, 'squad'));
        squadListContainer.addEventListener('drop', handleDropOnSquadList);
    }
    if (onPitchSectionElement) {
        onPitchSectionElement.addEventListener('dragover', (e) => handleDragOver(e, 'onpitch-list'));
        onPitchSectionElement.addEventListener('dragleave', (e) => handleDragLeave(e, 'onpitch-list'));
        onPitchSectionElement.addEventListener('drop', handleDropOnOnPitchList);
    }
    if (ballElement) { // Ballen selv er draggable
        ballElement.addEventListener('dragstart', handleBallDragStart); // Fra interactions.js
        ballElement.addEventListener('dragend', handleDragEnd);         // Fra interactions.js
    }

    // Taktikk & Visningskontroller
    if (formationSelect) formationSelect.addEventListener('change', handleFormationChange); // Fra pitch_elements.js
    
    if (drawToolButtons) {
        drawToolButtons.forEach(button => {
            button.addEventListener('click', () => handleToolChange(button.dataset.tool)); // Fra pitch_elements.js
        });
    }
    if (drawingColorInput) {
        drawingColorInput.addEventListener('input', handleColorChange); // Fra pitch_elements.js
        drawingColorInput.value = currentDrawingColor; // currentDrawingColor fra config.js
    }
    if (toggleDrawModeButton) toggleDrawModeButton.addEventListener('click', toggleDrawMode); // Fra pitch_elements.js
    if (clearDrawingsButton) clearDrawingsButton.addEventListener('click', clearDrawings); // Fra pitch_elements.js
    if (toggleVisibilityButton) toggleVisibilityButton.addEventListener('click', toggleDrawingVisibility); // Fra pitch_elements.js
    if (undoDrawingButton) undoDrawingButton.addEventListener('click', undoLastDrawing); // Fra pitch_elements.js

    // Spillerbrikke fargekontroller
    if (setBorderColorButton) setBorderColorButton.addEventListener('click', handleSetSelectedPlayerBorderColor); // Fra interactions.js
    if (setColorRedButton) setColorRedButton.addEventListener('click', () => applyBorderColorToSelection('red')); // Fra interactions.js
    if (setColorYellowButton) setColorYellowButton.addEventListener('click', () => applyBorderColorToSelection('yellow'));
    if (setColorGreenButton) setColorGreenButton.addEventListener('click', () => applyBorderColorToSelection('lime'));
    if (setColorDefaultButton) setColorDefaultButton.addEventListener('click', () => applyBorderColorToSelection('black'));

    // Lagre/Laste Oppsett
    if (saveSetupButton) saveSetupButton.addEventListener('click', handleSaveSetup); // Fra storage.js
    if (loadSetupButton) loadSetupButton.addEventListener('click', handleLoadSetup); // Fra storage.js
    if (deleteSetupButton) deleteSetupButton.addEventListener('click', handleDeleteSetup); // Fra storage.js
    
    // Eksport
    if (exportPngButton) exportPngButton.addEventListener('click', handleExportPNG); // Fra export.js

    // Globale klikk-listeners (for å lukke menyer/valg)
    window.addEventListener('click', (event) => {
        if (addPlayerModal && event.target === addPlayerModal) closeAddPlayerModal();
        if (playerDetailModal && event.target === playerDetailModal) closePlayerDetailModal();
        if (ballSettingsModal && event.target === ballSettingsModal) closeBallSettingsModal();
        if (addMatchModal && event.target === addMatchModal) closeAddMatchModal(); // Fra matches.js

        // Avvelg spillere hvis man klikker utenfor
        if (!event.target.closest('.player-piece') &&
            !event.target.closest('.preset-color-button') &&
            !event.target.closest('#player-border-color') &&
            !event.target.closest('#set-border-color-button') &&
            selectedPlayerIds.size > 0) { // selectedPlayerIds fra config.js
            clearPlayerSelection(); // Fra interactions.js
        }
        // Avvelg formasjonsposisjon hvis man klikker utenfor
        if (!event.target.closest('.formation-position-marker') && selectedFormationPosition) { // selectedFormationPosition fra config.js
            resetPositionFilter(); // Fra pitch_elements.js
        }
    });

    // Resize listener
    window.addEventListener('resize', () => {
        if (typeof resizePitchElement === "function") resizePitchElement(); // Fra interactions.js
        else console.warn("resizePitchElement function not found on window resize.");
    });

    console.log('DOMContentLoaded: Initialisering og event listeners satt opp.');
});

// === Hoved Applikasjonslogikk og Initialisering (main.js) END ===
/* Version: #20 */
