/* Version: #13 */
// === Hjelpefunksjoner (Utils) START ===

/**
 * Finner en spiller i den globale 'squad'-arrayen basert på ID.
 * @param {string} playerId - ID-en til spilleren som skal finnes.
 * @returns {object|null} Spillerobjektet hvis funnet, ellers null.
 */
function getPlayerById(playerId) {
    if (!squad || !playerId) { // squad er global (config.js)
        // console.warn("getPlayerById: 'squad' eller 'playerId' er ikke definert.");
        return null;
    }
    return squad.find(p => p.id === playerId) || null;
}

/**
 * Genererer en unik ID for en ny kamp.
 * Bruker den globale variabelen 'nextMatchId' (fra config.js).
 * @returns {string} En unik kamp-ID (f.eks. "match-1", "match-2").
 */
function generateMatchId() {
    // nextMatchId er en global variabel definert i config.js
    const newId = `match-${nextMatchId}`;
    nextMatchId++;
    return newId;
}

// Flere hjelpefunksjoner kan legges til her etter behov.

// === Hjelpefunksjoner (Utils) END ===
/* Version: #13 */
