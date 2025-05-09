/* Version: #10 */
// === 0. Globale Variabler og Konstanter START ===
let squad = [];
let playersOnPitch = {};
let playersOnBench = [];
let nextPlayerId = 1;
let draggedPlayerId = null;
let draggedElement = null;
let dragSource = null;
let selectedPlayerIds = new Set();
let isSidebarHidden = false;
let isPitchRotated = false;
let ballSettings = { size: 35, style: 'default', color: '#FFA500', position: { x: 50, y: 50} };
let currentFormation = null;
let selectedFormationPosition = null;
let isDrawingMode = false;
let isDrawing = false;
let drawingCtx = null;
let startX, startY, currentX, currentY;
let currentDrawingTool = 'arrow';
let currentDrawingColor = '#FFFF00';
let isDrawingVisible = true;
let savedDrawings = [];
let currentDrawingPoints = [];
let db = null; // For IndexedDB

// Konstanter
const DB_NAME = "FotballtaktikerDB";
const DB_VERSION = 1;
const IMAGE_STORE_NAME = "playerImages";
const DRAWING_LINE_WIDTH = 4;
const ARROWHEAD_LENGTH = 15;
const ARROWHEAD_ANGLE = Math.PI / 6;
const MAX_PLAYERS_ON_PITCH = 11;
const PITCH_ASPECT_RATIO_PORTRAIT = 2 / 3;
const PITCH_ASPECT_RATIO_LANDSCAPE = 3 / 2;

// Storage Keys
const STORAGE_KEY_SQUAD = 'fotballtaktiker_squad';
const STORAGE_KEY_LAST_STATE = 'fotballtaktiker_lastState';
const STORAGE_KEY_SETUPS = 'fotballtaktiker_setups';
const STORAGE_KEY_MATCHES = 'fotballtaktiker_matches'; // NY

// Spillerdata
const PLAYER_ROLES = { K: "Keeper", HB: "Høyreback", HVB: "Høyre Vingback", VB: "Venstreback", VVB: "Venstre Vingback", MS: "Midtstopper", SW: "Libero", DM: "Defensiv Midtbane", HM: "Høyre Midtbane", HV: "Høyre Ving", VM: "Venstre Midtbane", VV: "Venstre Ving", SM: "Sentral Midtbane", OM: "Offensiv Midtbane", S: "Spiss", CF: "Midtspiss" };
const PLAYER_STATUSES = { AVAILABLE: "Kampklar", INJURED_SHORT: "Skadet (Kortvarig)", INJURED_LONG: "Skadet (Langvarig)", SUSPENDED: "Suspendert", LIGHT_TRAINING: "Lett Trening", UNAVAILABLE: "Utilgjengelig (Annet)" };
const DEFAULT_PLAYER_STATUS = 'AVAILABLE';

// Formasjoner
const FORMATIONS = {
    "4-4-2": { name: "4-4-2", positions: [ { id: 'gk', name: 'Keeper', roles: ['K'], x: 50, y: 92 }, { id: 'dr', name: 'Høyre Back', roles: ['HB', 'HVB'], x: 85, y: 75 }, { id: 'dl', name: 'Venstre Back', roles: ['VB', 'VVB'], x: 15, y: 75 }, { id: 'dcr', name: 'Midtstopper (H)', roles: ['MS'], x: 65, y: 80 }, { id: 'dcl', name: 'Midtstopper (V)', roles: ['MS'], x: 35, y: 80 }, { id: 'mr', name: 'Høyre Midtbane', roles: ['HM', 'HV'], x: 80, y: 50 }, { id: 'ml', name: 'Venstre Midtbane', roles: ['VM', 'VV'], x: 20, y: 50 }, { id: 'mcr', name: 'Sentral Midtbane (H)', roles: ['SM', 'DM', 'OM'], x: 60, y: 55 }, { id: 'mcl', name: 'Sentral Midtbane (V)', roles: ['SM', 'DM', 'OM'], x: 40, y: 55 }, { id: 'st1', name: 'Spiss 1', roles: ['S', 'CF'], x: 60, y: 25 }, { id: 'st2', name: 'Spiss 2', roles: ['S', 'CF'], x: 40, y: 25 }, ] },
    "4-3-3": { name: "4-3-3", positions: [ { id: 'gk', name: 'Keeper', roles: ['K'], x: 50, y: 92 }, { id: 'dr', name: 'Høyre Back', roles: ['HB', 'HVB'], x: 85, y: 75 }, { id: 'dl', name: 'Venstre Back', roles: ['VB', 'VVB'], x: 15, y: 75 }, { id: 'dcr', name: 'Midtstopper (H)', roles: ['MS'], x: 65, y: 80 }, { id: 'dcl', name: 'Midtstopper (V)', roles: ['MS'], x: 35, y: 80 }, { id: 'dm', name: 'Defensiv Midtbane', roles: ['DM', 'SM'], x: 50, y: 65 }, { id: 'mcr', name: 'Sentral Midtbane (H)', roles: ['SM', 'OM', 'HM'], x: 70, y: 50 }, { id: 'mcl', name: 'Sentral Midtbane (V)', roles: ['SM', 'OM', 'VM'], x: 30, y: 50 }, { id: 'fw', name: 'Høyre Ving', roles: ['HV', 'S'], x: 80, y: 25 }, { id: 'fcl', name: 'Venstre Ving', roles: ['VV', 'S'], x: 20, y: 25 }, { id: 'st', name: 'Sentral Spiss', roles: ['CF', 'S'], x: 50, y: 15 }, ] },
    "4-2-3-1": { name: "4-2-3-1", positions: [ { id: 'gk', name: 'Keeper', roles: ['K'], x: 50, y: 92 }, { id: 'dr', name: 'Høyre Back', roles: ['HB', 'HVB'], x: 85, y: 75 }, { id: 'dl', name: 'Venstre Back', roles: ['VB', 'VVB'], x: 15, y: 75 }, { id: 'dcr', name: 'Midtstopper (H)', roles: ['MS'], x: 65, y: 80 }, { id: 'dcl', name: 'Midtstopper (V)', roles: ['MS'], x: 35, y: 80 }, { id: 'dmr', name: 'Def. Midtbane (H)', roles: ['DM', 'SM'], x: 60, y: 65 }, { id: 'dml', name: 'Def. Midtbane (V)', roles: ['DM', 'SM'], x: 40, y: 65 }, { id: 'amr', name: 'Off. Midtbane (H)', roles: ['OM', 'HM', 'HV'], x: 80, y: 40 }, { id: 'aml', name: 'Off. Midtbane (V)', roles: ['OM', 'VM', 'VV'], x: 20, y: 40 }, { id: 'amc', name: 'Off. Midtbane (S)', roles: ['OM', 'SM', 'S'], x: 50, y: 35 }, { id: 'st', name: 'Spiss', roles: ['S', 'CF'], x: 50, y: 15 }, ] },
    "3-5-2": { name: "3-5-2", positions: [ { id: 'gk', name: 'Keeper', roles: ['K'], x: 50, y: 92 }, { id: 'dcr', name: 'Midtstopper (H)', roles: ['MS'], x: 70, y: 80 }, { id: 'dc', name: 'Midtstopper (S)', roles: ['MS', 'SW'], x: 50, y: 85 }, { id: 'dcl', name: 'Midtstopper (V)', roles: ['MS'], x: 30, y: 80 }, { id: 'mr', name: 'Høyre Vingback', roles: ['HM', 'HVB', 'HB'], x: 90, y: 50 }, { id: 'ml', name: 'Venstre Vingback', roles: ['VM', 'VVB', 'VB'], x: 10, y: 50 }, { id: 'mcr', name: 'Sentral Midtbane (H)', roles: ['SM', 'DM', 'OM'], x: 65, y: 55 }, { id: 'mc', name: 'Sentral Midtbane (S)', roles: ['SM', 'DM', 'OM'], x: 50, y: 60 }, { id: 'mcl', name: 'Sentral Midtbane (V)', roles: ['SM', 'DM', 'OM'], x: 35, y: 55 }, { id: 'st1', name: 'Spiss 1', roles: ['S', 'CF'], x: 60, y: 25 }, { id: 'st2', name: 'Spiss 2', roles: ['S', 'CF'], x: 40, y: 25 }, ] }
};

// Kampdata
let matches = []; // Vil inneholde match-objekter
let nextMatchId = 1;
let activeMatchId = null;
const MATCH_STATUSES = { PLANLAGT: "Planlagt", PÅGÅENDE: "Pågående", SPILT: "Spilt", UTSATT: "Utsatt" };
const DEFAULT_MATCH_STATUS = 'PLANLAGT';
// === 0. Globale Variabler og Konstanter END ===


// === 1. DOM Element Referanser (Deklarasjoner) START ===
// Disse vil bli initialisert i main.js / DOMContentLoaded
let appContainer, sidebar, toggleSidebarButton, onPitchListElement, benchListElement, squadListElement, squadListContainer, onPitchCountElement, onBenchCountElement, pitchElement, pitchSurface, rotatePitchButton, addPlayerButton, playerBorderColorInput, setBorderColorButton, setColorRedButton, setColorYellowButton, setColorGreenButton, setColorDefaultButton, toggleDrawModeButton, clearDrawingsButton, setupNameInput, saveSetupButton, loadSetupSelect, loadSetupButton, deleteSetupButton, exportPngButton, pitchContainer, drawingCanvas, ballElement, navTacticsButton, navSquadButton, navMatchesButton, tacticsPageContent, squadPageContent, matchesPageContent, fullSquadListContainer, onPitchSectionElement, formationSelect, addPlayerModal, closeButton, newPlayerNameInput, newPlayerImageUpload, newPlayerImageUrlInput, newPlayerMainRoleInput, confirmAddPlayerButton, playerDetailModal, ballSettingsModal, benchElement, squadManagementSection, drawToolButtons, drawingColorInput, toggleVisibilityButton, undoDrawingButton, fullscreenButton, detailModalTabButtons, detailPlayerImageUpload;

// For kamp-modal (knapper initialiseres i main.js, resten inni funksjoner)
let addNewMatchButton, matchListContainer, addMatchModal, closeAddMatchModalButton, confirmAddMatchButton, activeMatchSelect, matchPreparationSection;
// === 1. DOM Element Referanser (Deklarasjoner) END ===
/* Version: #10 */
