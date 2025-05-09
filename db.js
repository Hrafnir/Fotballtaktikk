/* Version: #11 */
// === 2. IndexedDB Funksjoner START ===
function initDB() {
    return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            console.error("IndexedDB not supported by this browser.");
            reject("IndexedDB not supported");
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error(`Database error: ${event.target.errorCode}`);
            reject(`Database error: ${event.target.errorCode}`);
        };

        request.onsuccess = (event) => {
            db = event.target.result; // db er en global variabel definert i config.js
            console.log(`Database "${DB_NAME}" version ${DB_VERSION} opened successfully.`);
            db.onerror = (event) => { // Generell feilhåndterer for databasen
                console.error(`Database error (global): ${event.target.errorCode}`);
            };
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            console.log(`Upgrading database "${DB_NAME}" to version ${DB_VERSION}...`);
            const tempDb = event.target.result;
            if (!tempDb.objectStoreNames.contains(IMAGE_STORE_NAME)) {
                console.log(`Creating object store: ${IMAGE_STORE_NAME}`);
                tempDb.createObjectStore(IMAGE_STORE_NAME);
            }
            // Fremtidige oppgraderinger kan legges til her basert på DB_VERSION
        };
    });
}

function saveImageToDB(key, blob) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("Database not initialized.");
            return;
        }
        const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.put(blob, key);

        request.onsuccess = () => {
            console.log(`Image saved/updated in DB with key: ${key}`);
            resolve();
        };
        request.onerror = (event) => {
            console.error(`Error saving image with key ${key}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

function loadImageFromDB(key) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("Database not initialized.");
            return;
        }
        const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.get(key);

        request.onsuccess = (event) => {
            const blob = event.target.result;
            if (blob) {
                resolve(blob);
            } else {
                // Ikke logg feil her, det er forventet at et bilde kanskje ikke finnes
                reject(`Image not found in DB for key: ${key}`);
            }
        };
        request.onerror = (event) => {
            console.error(`Error loading image with key ${key}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

function deleteImageFromDB(key) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("Database not initialized.");
            return;
        }
        const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => {
            console.log(`Image deleted from DB with key: ${key}`);
            resolve();
        };
        request.onerror = (event) => {
            console.error(`Error deleting image with key ${key}:`, event.target.error);
            reject(event.target.error);
        };
    });
}
// === 2. IndexedDB Funksjoner END ===
/* Version: #11 */
