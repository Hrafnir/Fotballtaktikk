/* Version: #16 */
// === UI Rendering Funksjoner START ===

/**
 * Hovedfunksjon for å oppdatere de dynamiske listene i UI.
 * Kaller spesifikke render-funksjoner for hver liste.
 */
function renderUI() {
    // onPitchCountElement, onBenchCountElement er globale (config.js)
    renderOnPitchList();
    renderBench();
    renderSquadList(); // Denne vil også håndtere filtrering basert på valgt formasjonsposisjon

    if (onPitchCountElement) {
        onPitchCountElement.textContent = Object.keys(playersOnPitch).length; // playersOnPitch er global (config.js)
    }
    if (onBenchCountElement) {
        onBenchCountElement.textContent = playersOnBench.length; // playersOnBench er global (config.js)
    }
    // Merk: renderFullSquadList() og renderMatchList() kalles vanligvis når man bytter til de respektive sidene.
}

/**
 * Renderer listen over spillere på banen i sidepanelet.
 */
function renderOnPitchList() {
    // onPitchListElement er global (config.js)
    if (!onPitchListElement) {
        console.warn("renderOnPitchList: onPitchListElement ikke funnet.");
        return;
    }
    onPitchListElement.innerHTML = ''; // Tøm listen
    const playerIdsOnPitch = Object.keys(playersOnPitch); // playersOnPitch er global (config.js)

    if (playerIdsOnPitch.length === 0) {
        onPitchListElement.innerHTML = '<li><i>Ingen spillere på banen.</i></li>';
        return;
    }

    // Hent og sorter spillerobjekter
    const sortedPlayers = playerIdsOnPitch
        .map(id => getPlayerById(id)) // getPlayerById fra utils.js
        .filter(p => p) // Filtrer bort eventuelle null-verdier hvis en spiller ikke ble funnet
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    sortedPlayers.forEach(player => {
        const listItem = document.createElement('li');
        let roleText = player.mainRole ? ` (${player.mainRole})` : '';
        listItem.textContent = (player.nickname || player.name) + roleText;
        listItem.setAttribute('data-player-id', player.id);
        listItem.classList.add('on-pitch-player-item', 'draggable');
        listItem.setAttribute('draggable', true);

        // Fjern alle tidligere statusklasser før ny legges til
        Object.keys(PLAYER_STATUSES).forEach(statusKey => { // PLAYER_STATUSES fra config.js
            listItem.classList.remove(`player-status-${statusKey}`);
        });
        if (player.status) {
            listItem.classList.add(`player-status-${player.status}`);
        }

        listItem.addEventListener('dragstart', handleDragStartOnPitchList); // handleDragStartOnPitchList fra interactions.js
        listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); // openPlayerDetailModal fra modals.js
        onPitchListElement.appendChild(listItem);
    });
}

/**
 * Renderer listen over spillere på benken i sidepanelet.
 */
function renderBench() {
    // benchListElement er global (config.js)
    if (!benchListElement) {
        console.warn("renderBench: benchListElement ikke funnet.");
        return;
    }
    benchListElement.innerHTML = ''; // Tøm listen
    // playersOnBench er global (config.js)
    if (playersOnBench.length === 0) {
        benchListElement.innerHTML = '<li><i>Benken er tom.</i></li>';
        return;
    }

    const sortedPlayers = playersOnBench
        .map(id => getPlayerById(id)) // getPlayerById fra utils.js
        .filter(p => p)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    sortedPlayers.forEach(player => {
        const listItem = document.createElement('li');
        let roleText = player.mainRole ? ` (${player.mainRole})` : '';
        listItem.textContent = (player.nickname || player.name) + roleText;
        listItem.setAttribute('data-player-id', player.id);
        listItem.classList.add('bench-player-item', 'draggable');
        listItem.setAttribute('draggable', true);

        Object.keys(PLAYER_STATUSES).forEach(statusKey => {
            listItem.classList.remove(`player-status-${statusKey}`);
        });
        if (player.status) {
            listItem.classList.add(`player-status-${player.status}`);
        }
        
        // Event listeners legges til av addDragListenersToBenchItems i interactions.js
        listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); // openPlayerDetailModal fra modals.js
        benchListElement.appendChild(listItem);
    });
    addDragListenersToBenchItems(); // addDragListenersToBenchItems fra interactions.js
}

/**
 * Renderer listen over tilgjengelige spillere i troppen (ikke på bane/benk) i sidepanelet.
 * Filtrerer listen hvis en formasjonsposisjon er valgt.
 */
function renderSquadList() {
    // squadListElement, squadManagementSection er globale (config.js)
    // selectedFormationPosition er global (config.js)
    if (!squadListElement || !squadManagementSection) {
        console.warn("renderSquadList: Nødvendige DOM-elementer (squadListElement, squadManagementSection) ikke funnet.");
        return;
    }
    squadListElement.innerHTML = ''; // Tøm listen
    const titleElement = squadManagementSection.querySelector('h3');
    const defaultTitle = "Tropp (Tilgjengelige)";
    let playersToList = [];
    let currentTitle = defaultTitle;

    if (selectedFormationPosition && selectedFormationPosition.roles) {
        currentTitle = `Spillere for ${selectedFormationPosition.name || selectedFormationPosition.id.toUpperCase()}:`;
        // Filtrer spillere som ikke er på bane/benk OG har en av de påkrevde rollene
        playersToList = squad.filter(p => // squad er global (config.js)
            !playersOnPitch[p.id] && !playersOnBench.includes(p.id) &&
            p.playableRoles && p.playableRoles.some(playerRole => selectedFormationPosition.roles.includes(playerRole))
        ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
        // Vis alle spillere som ikke er på bane eller benk
        playersToList = squad.filter(p =>
            !playersOnPitch[p.id] && !playersOnBench.includes(p.id)
        ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    if (titleElement) {
        titleElement.textContent = currentTitle;
    }

    if (playersToList.length === 0) {
        if (selectedFormationPosition) {
            squadListElement.innerHTML = '<li><i>Ingen spillere med passende rolle(r).</i></li>';
        } else if (squad.length === 0) {
            squadListElement.innerHTML = '<li><i>Ingen spillere i troppen. Legg til via "Tropp"-siden.</i></li>';
        } else if (Object.keys(playersOnPitch).length + playersOnBench.length === squad.length) {
            squadListElement.innerHTML = '<li><i>Alle spillere er plassert.</i></li>';
        } else {
            squadListElement.innerHTML = '<li><i>Ingen flere tilgjengelige spillere.</i></li>';
        }
    } else {
        playersToList.forEach(player => {
            const listItem = document.createElement('li');
            let roleText = player.mainRole ? ` (${player.mainRole})` : '';
            listItem.textContent = (player.nickname || player.name) + roleText;
            listItem.setAttribute('data-player-id', player.id);
            listItem.classList.add('squad-player-item', 'draggable');
            listItem.setAttribute('draggable', true);

            Object.keys(PLAYER_STATUSES).forEach(statusKey => {
                listItem.classList.remove(`player-status-${statusKey}`);
            });
            if (player.status) {
                listItem.classList.add(`player-status-${player.status}`);
            }
            
            // Event listeners legges til av addDragListenersToSquadItems i interactions.js
            listItem.addEventListener('dblclick', () => openPlayerDetailModal(player.id)); // openPlayerDetailModal fra modals.js
            squadListElement.appendChild(listItem);
        });
    }
    addDragListenersToSquadItems(); // addDragListenersToSquadItems fra interactions.js
}

/**
 * Renderer den fullstendige tropplisten som en tabell på "Tropp"-siden.
 */
function renderFullSquadList() {
    // fullSquadListContainer er global (config.js)
    if (!fullSquadListContainer) {
        console.error("renderFullSquadList: fullSquadListContainer ikke funnet.");
        return;
    }
    fullSquadListContainer.innerHTML = ''; // Tøm container

    if (squad.length === 0) { // squad er global (config.js)
        fullSquadListContainer.innerHTML = '<p>Ingen spillere i troppen. Klikk "Legg til Spiller i Tropp" i sidepanelet for å starte, eller naviger til Taktikk-siden.</p>';
        return;
    }

    const sortedSquad = [...squad].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const table = document.createElement('table');
    // Styling settes i CSS, men basis-attributter kan settes her om nødvendig
    // table.style.width = '100%';
    // table.style.borderCollapse = 'collapse';

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const headers = ['Navn', 'Kallenavn', 'Hovedpos.', 'Roller', 'Status', 'Handlinger'];
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    sortedSquad.forEach(player => {
        const row = tbody.insertRow();

        const nameCell = row.insertCell();
        nameCell.textContent = player.name || '?';

        const nicknameCell = row.insertCell();
        nicknameCell.textContent = player.nickname || '-';

        const mainRoleCell = row.insertCell();
        mainRoleCell.textContent = player.mainRole || '-';

        const rolesCell = row.insertCell();
        const rolesString = (player.playableRoles && player.playableRoles.length > 0)
            ? player.playableRoles.map(roleKey => PLAYER_ROLES[roleKey] || roleKey).join(', ') // PLAYER_ROLES fra config.js
            : '-';
        rolesCell.textContent = rolesString;
        // rolesCell.style.fontSize = '0.85em'; // Bedre å style i CSS

        const statusCell = row.insertCell();
        statusCell.textContent = PLAYER_STATUSES[player.status] || player.status; // PLAYER_STATUSES fra config.js
        // Fargekoding kan gjøres med klasser i CSS basert på status

        const actionsCell = row.insertCell();
        // actionsCell.style.whiteSpace = 'nowrap'; // Bedre i CSS

        const editButton = document.createElement('button');
        editButton.textContent = 'Rediger';
        editButton.classList.add('action-button'); // For generell styling
        editButton.addEventListener('click', () => openPlayerDetailModal(player.id)); // openPlayerDetailModal fra modals.js
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Slett';
        deleteButton.classList.add('action-button');
        // deleteButton.style.backgroundColor = '#f44336'; // Bedre i CSS
        deleteButton.addEventListener('click', () => handleDeletePlayer(player.id, player.name)); // handleDeletePlayer fra modals.js
        actionsCell.appendChild(deleteButton);
    });
    fullSquadListContainer.appendChild(table);
}


/**
 * Renderer listen over kamper på "Kamper"-siden.
 */
function renderMatchList() {
    // matchListContainer er global (config.js)
    if (!matchListContainer) {
        console.error("renderMatchList: matchListContainer ikke funnet.");
        return;
    }
    matchListContainer.innerHTML = '';

    if (matches.length === 0) { // matches er global (config.js)
        matchListContainer.innerHTML = '<p>Ingen kamper registrert. Klikk "Legg til Ny Kamp" for å starte.</p>';
        return;
    }

    const sortedMatches = [...matches].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)); // Nyeste først

    const table = document.createElement('table');
    // table.style.width = '100%';
    // table.style.borderCollapse = 'collapse';

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const headers = ['Dato & Tid', 'Motstander', 'Arena', 'Status', 'Resultat', 'Handlinger'];
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    sortedMatches.forEach(match => {
        const row = tbody.insertRow();

        const dateCell = row.insertCell();
        try {
            dateCell.textContent = new Date(match.dateTime).toLocaleString('no-NO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            dateCell.textContent = match.dateTime; // Fallback
        }

        const opponentCell = row.insertCell();
        opponentCell.textContent = match.opponent;

        const venueCell = row.insertCell();
        venueCell.textContent = match.venue === 'H' ? 'Hjemme' : 'Borte';

        const statusCell = row.insertCell();
        statusCell.textContent = MATCH_STATUSES[match.status] || match.status; // MATCH_STATUSES fra config.js

        const resultCell = row.insertCell();
        if (match.status === 'SPILT' && match.resultHome !== null && match.resultAway !== null) {
            resultCell.textContent = `${match.resultHome} - ${match.resultAway}`;
        } else {
            resultCell.textContent = '-';
        }

        const actionsCell = row.insertCell();
        const detailsButton = document.createElement('button');
        detailsButton.textContent = 'Detaljer';
        detailsButton.classList.add('action-button');
        detailsButton.disabled = true; // Aktiveres når funksjonalitet er klar
        // detailsButton.addEventListener('click', () => openMatchDetailModal(match.id)); // For fremtiden
        actionsCell.appendChild(detailsButton);
    });
    matchListContainer.appendChild(table);
}

/**
 * Populerer dropdown-menyen for valg av aktiv kamp.
 */
function populateActiveMatchDropdown() {
    // activeMatchSelect er global (config.js)
    if (!activeMatchSelect) {
        console.warn("populateActiveMatchDropdown: activeMatchSelect ikke funnet.");
        return;
    }
    activeMatchSelect.innerHTML = '<option value="">Ingen kamp valgt</option>';

    const sortedMatches = [...matches].sort((a, b) => { // matches er global (config.js)
        if (a.status === 'PLANLAGT' && b.status !== 'PLANLAGT') return -1;
        if (a.status !== 'PLANLAGT' && b.status === 'PLANLAGT') return 1;
        return new Date(a.dateTime) - new Date(b.dateTime);
    });

    sortedMatches.forEach(match => {
        const option = document.createElement('option');
        option.value = match.id;
        let dateStr = '';
        try {
            dateStr = new Date(match.dateTime).toLocaleDateString('no-NO', { day: '2-digit', month: 'short' });
        } catch (e) { dateStr = match.dateTime.substring(0, 10); }

        option.textContent = `${dateStr}: ${match.opponent} (${match.venue === 'H' ? 'H' : 'B'}) - ${MATCH_STATUSES[match.status]}`; // MATCH_STATUSES fra config.js
        if (match.id === activeMatchId) { // activeMatchId er global (config.js)
            option.selected = true;
        }
        activeMatchSelect.appendChild(option);
    });
}

/**
 * Populerer dropdown-menyen for lagrede oppsett.
 */
function populateSetupDropdown() {
    // loadSetupSelect er global (config.js)
    if (!loadSetupSelect) {
        console.warn("populateSetupDropdown: loadSetupSelect ikke funnet.");
        return;
    }
    const savedSetups = getSavedSetups(); // Fra storage.js
    const setupNames = Object.keys(savedSetups);
    loadSetupSelect.innerHTML = '<option value="">Velg oppsett...</option>';
    setupNames.sort(); // Sorter navn alfabetisk
    setupNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        loadSetupSelect.appendChild(option);
    });
}


// --- Hjelpefunksjoner for Modaler (flyttet hit for samling av UI-relatert logikk) ---

/**
 * Populerer en container med sjekkbokser for spillerroller.
 * @param {string} containerId - ID-en til HTML-elementet som skal inneholde sjekkboksene.
 * @param {string[]} [selectedRoles=[]] - En array med nøkler for roller som skal være forhåndsvalgt.
 */
function populateRolesCheckboxes(containerId, selectedRoles = []) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`populateRolesCheckboxes: Container med ID "${containerId}" ikke funnet.`);
        return;
    }
    container.innerHTML = ''; // Tøm container
    // PLAYER_ROLES er global (config.js)
    Object.entries(PLAYER_ROLES).forEach(([key, value]) => {
        const div = document.createElement('div'); // For bedre layout om nødvendig
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${containerId}-${key}`; // Sikrer unik ID for label-forbindelse
        checkbox.value = key;
        checkbox.checked = selectedRoles.includes(key);

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = `${value} (${key})`;
        // Unngå å overskrive label-styling fra CSS
        // label.style.fontWeight = 'normal';
        // label.style.marginTop = '0';
        // label.style.marginBottom = '0';


        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
}

/**
 * Populerer en select dropdown med spillerstatuser.
 * @param {string} selectElementId - ID-en til select-elementet.
 * @param {string} currentStatusKey - Nøkkelen til statusen som skal være forhåndsvalgt.
 */
function populateStatusDropdown(selectElementId, currentStatusKey) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) {
        console.error(`populateStatusDropdown: Finner ikke selectElement med ID "${selectElementId}".`);
        return;
    }
    selectElement.innerHTML = ''; // Tøm eksisterende options
    // PLAYER_STATUSES er global (config.js)
    Object.entries(PLAYER_STATUSES).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value;
        if (key === currentStatusKey) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}

/**
 * Renderer kommentarhistorikken for en spiller i spillerdetalj-modalen.
 * @param {object[]} comments - Array med kommentarobjekter ({date: string, text: string}).
 * @param {HTMLElement} historyDivElement - Div-elementet hvor historikken skal rendres.
 */
function renderCommentHistory(comments, historyDivElement) {
    if (!historyDivElement) {
        console.warn("renderCommentHistory: historyDivElement ikke funnet.");
        return;
    }
    historyDivElement.innerHTML = ''; // Tøm
    if (!comments || comments.length === 0) {
        historyDivElement.innerHTML = '<p><i>Ingen historikk.</i></p>';
        return;
    }
    // Sorter kommentarer etter dato, nyeste først
    const sortedComments = [...comments].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedComments.forEach(comment => {
        const p = document.createElement('p');
        const dateSpan = document.createElement('span');
        dateSpan.classList.add('comment-date');
        try {
            dateSpan.textContent = new Date(comment.date).toLocaleString('no-NO', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            dateSpan.textContent = comment.date; // Fallback hvis datoformat er uventet
        }
        const textNode = document.createTextNode(" " + comment.text); // Mellomrom for separasjon

        p.appendChild(dateSpan);
        p.appendChild(textNode);
        historyDivElement.appendChild(p);
    });
}


// === UI Rendering Funksjoner END ===
/* Version: #16 */
