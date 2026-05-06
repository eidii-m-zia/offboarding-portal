/**
 * ============================================================
 *  Google Apps Script — Offboarding Portal
 *  Handles: file uploads to Google Drive + form data to Sheets
 * ============================================================
 *
 * HOW TO SET UP (first time):
 * 1. Open your Google Sheet.
 * 2. Click Extensions → Apps Script.
 * 3. Delete any existing code and paste ALL of this file.
 * 4. Click Save (💾).
 * 5. Click Deploy → New deployment.
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Click Deploy. Authorize all permissions (Drive + Sheets).
 * 7. Copy the Web app URL → paste into js/config.js.
 *
 * AFTER EDITING THIS FILE:
 * Always create a NEW deployment (not "manage existing").
 * Old deployments run the old code — new URL = new code.
 * ============================================================
 */

// ── Configuration ──────────────────────────────────────────

const SHEET_NAME = "Submissions";

// Best option: paste the Google Drive folder ID here to force uploads
// into one exact parent folder. Example ID:
// https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz
// Leave as "" to fall back to DRIVE_PARENT_FOLDER_NAME lookup.
const DRIVE_PARENT_FOLDER_ID = "";

// All employee Drive folders will live inside this parent folder.
// Leave as "" to save directly to My Drive root.
const DRIVE_PARENT_FOLDER_NAME = "Offboarding Uploads";

// Column headers for the Sheets tab
const HEADERS = [
  "Ref Code",
  "Submitted At",
  "Employee ID",
  "Full Name",
  "Designation",
  "Department",
  "Last Working Day",
  "Email",
  "Items Checked",
  "Items Total",
  "Checked Items List",
  "Doc Handover Method",
  "Doc Recipient",
  "Documents",
  "File Count",
  "Drive Folder Name",
  "Drive Folder Link",
  "Status"
];

// ── Drive helpers ───────────────────────────────────────────

/**
 * Returns (or creates) the parent "Offboarding Uploads" folder.
 */
function getParentFolder() {
  if (DRIVE_PARENT_FOLDER_ID) {
    return DriveApp.getFolderById(DRIVE_PARENT_FOLDER_ID);
  }

  if (!DRIVE_PARENT_FOLDER_NAME) return DriveApp.getRootFolder();

  const iter = DriveApp.getFoldersByName(DRIVE_PARENT_FOLDER_NAME);
  if (iter.hasNext()) return iter.next();
  return DriveApp.createFolder(DRIVE_PARENT_FOLDER_NAME);
}

/**
 * Returns (or creates) an employee subfolder inside the parent.
 * folderName example: "Sarah Chen (EMP-0042) — OFF-3421"
 */
function getEmployeeFolder(folderName) {
  const parent = getParentFolder();
  const iter   = parent.getFoldersByName(folderName);
  if (iter.hasNext()) return iter.next();
  return parent.createFolder(folderName);
}

// ── Request router ──────────────────────────────────────────

function doPost(e) {
  try {
    let data;
    if (e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error("No payload received");
    }

    const action = data.action || 'submitForm';

    if (action === 'uploadFile') {
      return handleFileUpload(data);
    } else {
      return handleFormSubmit(data);
    }

  } catch (err) {
    console.error("doPost error:", err);
    return respond({ success: false, error: err.message });
  }
}

// ── File upload handler ─────────────────────────────────────

/**
 * Receives a single base64-encoded file and saves it to the
 * correct employee folder in Google Drive.
 *
 * Expected payload fields:
 *   folderName  – e.g. "Sarah Chen (EMP-0042) — OFF-3421"
 *   fileName    – original file name
 *   mimeType    – MIME type string
 *   base64Data  – base64-encoded file content (no data-URI prefix)
 */
function handleFileUpload(data) {
  if (!data.folderName) throw new Error("Missing folderName");
  if (!data.fileName) throw new Error("Missing fileName");
  if (!data.base64Data) throw new Error("Missing file data");

  const folder   = getEmployeeFolder(data.folderName);
  const bytes    = Utilities.base64Decode(data.base64Data);
  const blob     = Utilities.newBlob(bytes, data.mimeType || 'application/octet-stream', data.fileName);
  const file     = folder.createFile(blob);

  // Make the file viewable by anyone with the link (optional — remove if you want private)
  // file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return respond({
    success:    true,
    fileId:     file.getId(),
    fileUrl:    file.getUrl(),
    folderUrl:  folder.getUrl(),
  });
}

// ── Form submit handler ─────────────────────────────────────

/**
 * Appends a new row to the Sheets tab with all form data,
 * including a link to the employee's Drive folder (if files
 * were uploaded).
 */
function handleFormSubmit(data) {
  const sheet = getOrCreateSheet();

  // Try to find the Drive folder so we can link to it
  let folderUrl = '';
  if (data.driveFolderName) {
    try {
      const folder = getEmployeeFolder(data.driveFolderName);
      folderUrl    = folder.getUrl();
    } catch (_) {}
  }

  const docMethodStr = data.docMethod === 1
    ? "Admin team"
    : data.docMethod === 2
      ? `Specific person: ${data.docRecipient || ''}`
      : "Not selected";

  const docsStr = (data.docs || [])
    .filter(d => d.name)
    .map(d => `${d.name} (${d.type || '?'}) — ${d.notes || ''} × ${d.copies || 1}`)
    .join(" | ");

  const submittedAt = data.submittedAt
    ? new Date(data.submittedAt).toLocaleString("en-GB")
    : new Date().toLocaleString("en-GB");

  sheet.appendRow([
    data.refCode          || "",
    submittedAt,
    data.id               || "",
    data.name             || "",
    data.desig            || "",
    data.dept             || "",
    data.lastDay          || "",
    data.email            || "",
    (data.checkedItems    || []).length,
    (data.items           || []).length,
    (data.checkedItems    || []).join(", "),
    docMethodStr,
    data.docRecipient     || "",
    docsStr,
    data.fileCount        || 0,
    data.driveFolderName  || "",
    folderUrl,
    data.status           || "submitted",
  ]);

  // Colour-code the Status cell
  const lastRow  = sheet.getLastRow();
  const statCol  = HEADERS.indexOf("Status") + 1;
  const statCell = sheet.getRange(lastRow, statCol);
  if (data.status === "submitted") {
    statCell.setBackground("#EAF5EE").setFontColor("#1D8A5A");
  } else {
    statCell.setBackground("#FDF6E3").setFontColor("#B07A10");
  }

  // Make Drive Folder Link a clickable hyperlink
  const linkCol  = HEADERS.indexOf("Drive Folder Link") + 1;
  if (folderUrl) {
    const linkCell = sheet.getRange(lastRow, linkCol);
    linkCell.setFormula(`=HYPERLINK("${folderUrl}","Open folder")`);
    linkCell.setFontColor("#2B5CE6");
  }

  return respond({ success: true, ref: data.refCode, folderUrl });
}

// ── Sheet bootstrap ─────────────────────────────────────────

function getOrCreateSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);

    const hdr = sheet.getRange(1, 1, 1, HEADERS.length);
    hdr.setBackground("#2B5CE6")
       .setFontColor("#FFFFFF")
       .setFontWeight("bold")
       .setFontSize(11);
    sheet.setFrozenRows(1);

    // Reasonable column widths
    const widths = [100,160,100,160,180,130,130,200,90,90,240,160,160,300,80,220,120,100];
    widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  }

  return sheet;
}

// ── Health check ────────────────────────────────────────────

function doGet(e) {
  const sheet = getOrCreateSheet();
  const count = Math.max(0, sheet.getLastRow() - 1);
  return respond({ status: "ok", sheet: SHEET_NAME, submissions: count, timestamp: new Date().toISOString() });
}

// ── Utility ─────────────────────────────────────────────────

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
