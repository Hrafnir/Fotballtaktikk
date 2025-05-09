/* Version: #19 */
// === Eksport Funksjoner START ===

/**
 * Håndterer eksport av banen som et PNG-bilde ved hjelp av html2canvas.
 */
function handleExportPNG() {
    // pitchElement er global (config.js)
    if (!pitchElement) {
        console.error("handleExportPNG: Finner ikke pitch-elementet (#pitch).");
        alert("Kunne ikke eksportere bilde: Banen ble ikke funnet i DOM.");
        return;
    }
    if (typeof html2canvas === 'undefined') {
        console.error("handleExportPNG: html2canvas biblioteket er ikke lastet. Sjekk <script> tag i HTML.");
        alert("Kunne ikke eksportere bilde: Nødvendig bibliotek (html2canvas) mangler.");
        return;
    }

    console.log("Starter eksport til PNG...");

    // Midlertidig fjern elementer som ikke skal med på bildet, eller style dem annerledes
    const originalPitchBorder = pitchElement.style.border;
    const originalPitchBoxShadow = pitchElement.style.boxShadow;
    // const originalBallVisibility = ballElement ? ballElement.style.visibility : ''; // Eksempel

    // Sett stiler for eksport
    pitchElement.style.border = 'none'; // Fjerner kantlinje for renere bilde
    pitchElement.style.boxShadow = 'none'; // Fjerner skygge
    // if (ballElement) ballElement.style.visibility = 'hidden'; // Skjul ballen om ønskelig

    const exportOptions = {
        useCORS: true,        // For eksterne bilder hvis de er på banen (f.eks. via URL)
        allowTaint: true,     // Viktig for bilder fra andre domener hvis useCORS ikke er nok
        backgroundColor: null, // Gjennomsiktig bakgrunn for canvas, lar banens egen bakgrunn skinne gjennom
        scale: 2,             // Øk oppløsningen for bedre kvalitet
        logging: true         // Aktiver logging fra html2canvas for feilsøking
    };

    html2canvas(pitchElement, exportOptions)
        .then(canvas => {
            // Gjenopprett originale stiler
            pitchElement.style.border = originalPitchBorder;
            pitchElement.style.boxShadow = originalPitchBoxShadow;
            // if (ballElement) ballElement.style.visibility = originalBallVisibility;

            // Lag en link for nedlasting
            const link = document.createElement('a');
            link.download = 'fotballtaktiker_bane.png';
            link.href = canvas.toDataURL('image/png'); // Konverter canvas til data URL
            link.click(); // Simuler klikk for å starte nedlasting
            console.log("PNG-eksport fullført og nedlasting startet.");
        })
        .catch(error => {
            // Gjenopprett originale stiler også ved feil
            pitchElement.style.border = originalPitchBorder;
            pitchElement.style.boxShadow = originalPitchBoxShadow;
            // if (ballElement) ballElement.style.visibility = originalBallVisibility;

            console.error("Feil under PNG-eksport med html2canvas:", error);
            alert("En feil oppstod under generering av skjermbilde. Sjekk konsollen for detaljer.");
        });
}

// === Eksport Funksjoner END ===
/* Version: #19 */
