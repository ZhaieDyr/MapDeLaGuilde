// Configuration et état partagé de la carte Skyrim RP.
// Les scripts sont chargés dans index.html dans un ordre précis : ne pas ajouter "type=module".

const MAIN_MAP_ID = "MAP_BORDECIEL";
const MAP_IMAGE = "https://images.uesp.net/f/fe/MER-art-Skyrim_Anthology_Map.jpg";

const PUBLISHED_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTNzRzsUlm2RM58JAXUa7B9kE5yKrkDqIpykHVKbSuAwT2AXFq7IRgMn6900KK5N4SvgrdQXZ99_jVu/pub";

// Publie l'onglet « Cartes » en CSV puis colle son URL ici.
const CARTES_CSV_URL = "";

const SHEETS = [
  { name:"Lieux", color:"#55aaff", url:PUBLISHED_BASE+"?gid=0&single=true&output=csv", kind:"place" },
  { name:"Personnes", color:"#55cc88", url:PUBLISHED_BASE+"?gid=1841502172&single=true&output=csv", kind:"person" },
  { name:"Artefacts", color:"#bb88ff", url:PUBLISHED_BASE+"?gid=1452202772&single=true&output=csv", kind:"artifact" },
  { name:"Potentiel butin", color:"#e5b44f", url:PUBLISHED_BASE+"?gid=1386882641&single=true&output=csv", kind:"loot" },
  { name:"Zones à éviter", color:"#ff6666", url:PUBLISHED_BASE+"?gid=1922621588&single=true&output=csv", kind:"danger" },
  { name:"Factions", color:"#dddddd", url:PUBLISHED_BASE+"?gid=284707486&single=true&output=csv", kind:"faction" }
];

window.$ = id => document.getElementById(id);

let map, regionalMap, imageWidth=0, imageHeight=0, regionalImageWidth=0, regionalImageHeight=0;
let selectedMarker=null, selectedPoint=null, regionalSelectedMarker=null;
let loadedSheets=[], mapDefinitions=[], peopleRows=[], selectedEntity=null, activeRegionalMap=null;
const mainLayers = new Map();
const regionalLayers = new Map();

function status(message) { $("status").textContent = message; }
function normalize(value) { return String(value ?? "").trim().toLocaleLowerCase("fr"); }

function field(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && String(row[name]).trim() !== "") return String(row[name]).trim();
  }
  const wanted = names.map(normalize);
  for (const key of Object.keys(row || {})) {
    if (wanted.includes(normalize(key)) && String(row[key] ?? "").trim() !== "") return String(row[key]).trim();
  }
  return "";
}

function splitIds(value) {
  return String(value || "").split(/[;,|]/).map(v=>v.trim()).filter(Boolean);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}

function isVisible(value) {
  const v=normalize(value);
  return !["non","no","false","0","masqué","masquee","cache","caché"].includes(v);
}

function getName(row) {
  return field(row,["Nom","Name","Personnage","Faction","Lieu"]) || "Sans nom";
}

function getId(row, fallbackPrefix="ID") {
  return field(row,["ID","Id","id","Lieu_ID","Faction_ID","Personnage_ID","Carte_ID"]) ||
    fallbackPrefix+"_"+getName(row).toUpperCase().replace(/[^A-Z0-9]+/g,"_");
}

function getMapId(row) { return field(row,["Carte_ID","Map_ID","MapID","Carte ID"]); }

function isMainMapRow(row) {
  const id=normalize(getMapId(row));
  return !id || id===normalize(MAIN_MAP_ID) || ["bordeciel","skyrim","main"].includes(id);
}

function imageUrlForMap(def) {
  const raw=field(def,["Image_URL","Image URL","URL_Image","Image","URL"]);
  if (!raw) return "";
  try { return new URL(raw, window.location.href).href; } catch { return raw; }
}
