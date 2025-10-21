import Papa from "papaparse";
import * as XLSX from "xlsx";

const REQUIRED_COLUMNS = [
  "adresse",
  "lot",
  "reference",
  "avis_decontamination",
  "bureau_publicite",
  "commentaires"
];

let parsedData = [];

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const previewSection = document.getElementById("previewSection");
const errorSection = document.getElementById("errorSection");
const previewTable = document.getElementById("previewTable");
const dataStats = document.getElementById("dataStats");
const downloadJsonBtn = document.getElementById("downloadJson");
const cancelBtn = document.getElementById("cancelBtn");
const downloadTemplate = document.getElementById("downloadTemplate");
const instructionsAfter = document.getElementById("instructionsAfter");

function showError(message) {
  errorSection.textContent = `❌ ${message}`;
  errorSection.style.display = "block";
  previewSection.style.display = "none";
  instructionsAfter.style.display = "none";
}

function clearError() {
  errorSection.style.display = "none";
}

function normaliseRecord(record) {
  const normalised = {};
  const sourceEntries = Object.entries(record ?? {});

  for (const [key, value] of sourceEntries) {
    const normalisedKey = key
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (normalisedKey) {
      normalised[normalisedKey] = value ?? "";
    }
  }

  for (const column of REQUIRED_COLUMNS) {
    if (!(column in normalised)) {
      normalised[column] = "";
    }
  }

  return normalised;
}

function validateRecords(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("Le fichier ne contient aucune donnée exploitable.");
  }

  const normalisedRecords = records.map(normaliseRecord);

  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !Object.prototype.hasOwnProperty.call(normalisedRecords[0], column)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Colonnes manquantes: ${missingColumns.join(", ")}.
Assurez-vous que le fichier contient les en-têtes requis.`
    );
  }

  return normalisedRecords;
}

function displayPreview(records) {
  const headers = Object.keys(records[0]);
  const thead = previewTable.querySelector("thead");
  const tbody = previewTable.querySelector("tbody");

  thead.innerHTML = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;

  const sample = records.slice(0, 10);
  tbody.innerHTML = sample
    .map(
      (row) =>
        `<tr>${headers
          .map((h) => `<td>${row[h] ?? ""}</td>`)
          .join("")}</tr>`
    )
    .join("");

  if (records.length > 10) {
    tbody.innerHTML += `<tr><td colspan="${headers.length}" class="text-center text-muted">... et ${records.length - 10} autres enregistrements</td></tr>`;
  }

  dataStats.textContent = `✅ ${records.length} enregistrements chargés`;
  previewSection.style.display = "block";
}

async function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(result) {
        if (result.errors?.length) {
          reject(new Error(result.errors[0].message));
          return;
        }
        resolve(result.data);
      },
      error(error) {
        reject(error);
      }
    });
  });
}

async function parseExcel(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  if (!workbook.SheetNames.length) {
    throw new Error("Le fichier Excel ne contient aucune feuille.");
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rows;
}

async function handleFile(file) {
  clearError();

  if (!file) {
    showError("Aucun fichier sélectionné.");
    return;
  }

  const extension = file.name.trim().toLowerCase().split(".").pop();

  try {
    let rawRecords;

    if (extension === "csv") {
      rawRecords = await parseCsv(file);
    } else if (extension === "xlsx" || extension === "xls") {
      rawRecords = await parseExcel(file);
    } else {
      showError("Format non supporté. Utilisez un fichier CSV, XLS ou XLSX.");
      return;
    }

    const validated = validateRecords(rawRecords);
    parsedData = validated;
    displayPreview(validated);
  } catch (error) {
    console.error(error);
    showError(`Erreur de lecture du fichier: ${error.message}`);
  }
}

function downloadFile(filename, content, mimeType = "application/octet-stream") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("drag-over");
  const [file] = event.dataTransfer.files;
  if (file) {
    handleFile(file);
  }
});

fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files ?? [];
  if (file) {
    handleFile(file);
  }
});

downloadTemplate.addEventListener("click", (event) => {
  event.preventDefault();
  const template = `adresse,lot,reference,avis_decontamination,bureau_publicite,commentaires
"1185, des Foreurs","2299001","7610-08-01-17124-06","","12223243","Terrain commercial"
"1075, 3e Avenue","2297678","7610-08-01-12049-06","","","Ancien garage"
"912, 3e Avenue","2297604","","","12343867","Station-service désaffectée"
"725, 3e Avenue","2297570","7610-08-01-12059-08","","","Zone industrielle"`;

  downloadFile("template-donnees-municipales.csv", template, "text/csv");
});

downloadJsonBtn.addEventListener("click", () => {
  if (!parsedData.length) {
    showError("Aucune donnée à exporter.");
    return;
  }

  const payload = {
    data: parsedData,
    metadata: {
      source: "Registre municipal - Ville de Val-d'Or",
      total_records: parsedData.length,
      last_update: new Date().toISOString(),
      generated_by: "Interface web de chargement"
    }
  };

  // Sauvegarder dans localStorage pour utilisation immédiate
  try {
    localStorage.setItem('temp_municipal_data', JSON.stringify(payload));
    console.log('✅ Données sauvegardées dans localStorage');
  } catch (e) {
    console.warn('⚠️ Impossible de sauvegarder dans localStorage:', e);
  }

  downloadFile("municipal-data.json", JSON.stringify(payload, null, 2), "application/json");
  instructionsAfter.style.display = "block";
  
  // Afficher le bouton pour charger immédiatement
  const loadNowBtn = document.getElementById("loadNowBtn");
  if (loadNowBtn) {
    loadNowBtn.style.display = "inline-block";
  }
});

cancelBtn.addEventListener("click", () => {
  parsedData = [];
  previewSection.style.display = "none";
  instructionsAfter.style.display = "none";
  fileInput.value = "";
});
