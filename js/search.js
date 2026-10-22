
/*
 * Gestion de la carte principale et des cartes régionales.
 * Les scripts config.js, data.js, markers.js et download.js
 * doivent être chargés avant ce fichier.
 */

function getImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };

    image.onerror = () => {
      reject(new Error("Impossible de charger l'image : " + url));
    };

    image.src = url;
  });
}

// Initialise la carte principale de Bordeciel.
async function initMainMap() {
  if (map) return;

  map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -5,
    maxZoom: 2,
    zoomControl: true
  });

  try {
    const dimensions = await getImageDimensions(MAP_IMAGE);
    imageWidth = dimensions.width;
    imageHeight = dimensions.height;

    const bounds = [
      [0, 0],
      [imageHeight, imageWidth]
    ];

    L.imageOverlay(MAP_IMAGE, bounds).addTo(map);
    map.fitBounds(bounds);
    map.setMaxBounds(bounds);

    await loadAllData();
  } catch (error) {
    console.error("Erreur d'initialisation de la carte :", error);
    status("Erreur de chargement de la carte principale.\n" + error.message);
  }
}

// Ferme la superposition régionale.
function closeRegionalMap() {
  const overlay = $("regionalOverlay");

  if (overlay) {
    overlay.classList.remove("open");
  }

  if (regionalMap) {
    regionalMap.remove();
    regionalMap = null;
  }

  activeRegionalMap = null;
  regionalLayers.clear();
}

// Ouvre une carte régionale à partir de son Carte_ID.
async function openRegionalMapById(id) {
  const definition = mapDefinitions.find(def => {
    const definitionId = field(def, ["Carte_ID", "ID", "Id"]);
    return normalize(definitionId) === normalize(id);
  });

  if (!definition) {
    status("Carte régionale introuvable : " + id);
    return;
  }

  const imageUrl = imageUrlForMap(definition);

  if (!imageUrl) {
    status("Aucune URL d'image définie pour cette carte régionale.");
    return;
  }

  closeRegionalMap();

  try {
    const dimensions = await getImageDimensions(imageUrl);
    regionalImageWidth = dimensions.width;
    regionalImageHeight = dimensions.height;

    const mapId = field(definition, ["Carte_ID", "ID", "Id"]);
    activeRegionalMap = mapId;

    $("regionalTitle").textContent =
      field(definition, ["Nom", "Name"]) || mapId;

    $("regionalCoords").textContent =
      regionalImageWidth + " × " + regionalImageHeight + " px";

    $("regionalOverlay").classList.add("open");

    regionalMap = L.map("regionalMap", {
      crs: L.CRS.Simple,
      minZoom: -5,
      maxZoom: 2,
      zoomControl: true
    });

    const bounds = [
      [0, 0],
      [regionalImageHeight, regionalImageWidth]
    ];

    L.imageOverlay(imageUrl, bounds).addTo(regionalMap);
    regionalMap.fitBounds(bounds);
    regionalMap.setMaxBounds(bounds);

    for (const result of loadedSheets) {
      const group = L.layerGroup();
      let count = 0;

      for (const row of result.rows) {
        const marker = createMarker(
          row,
          result.sheet,
          group,
          regionalImageWidth,
          regionalImageHeight,
          mapId
        );

        if (marker) count++;
      }

      regionalLayers.set(result.sheet.name, group);

      if (count > 0) {
        group.addTo(regionalMap);
      }
    }

    requestAnimationFrame(() => {
      if (regionalMap) regionalMap.invalidateSize();
    });

  } catch (error) {
    console.error("Erreur de chargement de la carte régionale :", error);
    closeRegionalMap();
    status("Impossible de charger la carte régionale.\n" + error.message);
  }
}
