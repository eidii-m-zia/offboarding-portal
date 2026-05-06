/**
 * ============================================================
 *  Google Apps Script — Offboarding Portal Webhook
 * ============================================================
 *
 * HOW TO SET UP:
 * 1. Open your Google Sheet.
 * 2. Click Extensions → Apps Script.
 * 3. Delete any existing code and paste ALL of this file.
 * 4. Click Save (floppy disk icon).
 * 5. Click Deploy → New deployment.
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Click Deploy. Authorize when prompted.
 * 7. Copy the "Web app URL" shown.
 * 8. Paste it into js/config.js as SHEETS_WEBHOOK_URL.
 * ============================================================
 */

const SHEET_NAME = "Submissions";
const DRIVE_FOLDER_NAME = "Offboarding Uploads";

// Optional: paste a Google Drive folder ID here to save uploads into an existing folder.
// Leave blank to let the script create/use "Offboarding Uploads" in your Drive.
const DRIVE_FOLDER_ID = "https://drive.google.com/drive/folders/1VnGWik_eYfo5-ToAfY1gpQkeCjd9pNfI";

// Column headers — must match the order in appendRow() below
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
  "File Links",
  "Status"
];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);

    // Style the header row
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#2B5CE6");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(11);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 100);  // Ref Code
    sheet.setColumnWidth(2, 160);  // Submitted At
    sheet.setColumnWidth(3, 100);  // Employee ID
    sheet.setColumnWidth(4, 160);  // Full Name
    sheet.setColumnWidth(5, 180);  // Designation
    sheet.setColumnWidth(6, 130);  // Department
    sheet.setColumnWidth(7, 130);  // Last Day
    sheet.setColumnWidth(8, 200);  // Email
    sheet.setColumnWidth(11, 250); // Checked Items
    sheet.setColumnWidth(14, 300); // Documents
    sheet.setColumnWidth(16, 350); // File Links
  }

  ensureHeaders(sheet);

  return sheet;
}

function ensureHeaders(sheet) {
  let headerRange = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length));
  let existing = headerRange.getValues()[0];
  const hasFileLinks = existing.indexOf("File Links") !== -1;
  const statusIndex = existing.indexOf("Status");

  if (!hasFileLinks && statusIndex !== -1) {
    sheet.insertColumnBefore(statusIndex + 1);
    sheet.getRange(1, statusIndex + 1).setValue("File Links");
    headerRange = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length));
    existing = headerRange.getValues()[0];
  }

  HEADERS.forEach((header, i) => {
    if (existing[i] !== header) {
      sheet.getRange(1, i + 1).setValue(header);
    }
  });

  const headerRangeFinal = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRangeFinal.setBackground("#2B5CE6");
  headerRangeFinal.setFontColor("#FFFFFF");
  headerRangeFinal.setFontWeight("bold");
  headerRangeFinal.setFontSize(11);
  sheet.setFrozenRows(1);
}

function getUploadFolder() {
  if (DRIVE_FOLDER_ID) {
    return DriveApp.getFolderById(DRIVE_FOLDER_ID);
  }

  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

function safeFileName(name) {
  return String(name || "upload")
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "upload";
}

function saveUploadedFiles(files, refCode, employeeId) {
  if (!files || !files.length) {
    return [];
  }

  const folder = getUploadFolder();
  const prefix = [refCode, employeeId].filter(Boolean).join("_");

  return files
    .filter(file => file && file.data)
    .map(file => {
      const bytes = Utilities.base64Decode(file.data);
      const fileName = `${prefix ? prefix + "_" : ""}${safeFileName(file.name)}`;
      const blob = Utilities.newBlob(bytes, file.type || "application/octet-stream", fileName);
      const driveFile = folder.createFile(blob);

      return {
        name: driveFile.getName(),
        url: driveFile.getUrl(),
        id: driveFile.getId(),
      };
    });
}

// Handle POST requests from the portal
function doPost(e) {
  try {
    let data;

    // Parse payload — sent as FormData field "payload"
    if (e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error("No payload received");
    }

    const sheet = getOrCreateSheet();

    // Format documents as readable string
    const docsStr = (data.docs || [])
      .filter(d => d.name)
      .map(d => `${d.name} (${d.type || '?'}) — ${d.notes || ''} × ${d.copies || 1}`)
      .join(" | ");

    const docMethodStr = data.docMethod === 1
      ? "Admin team"
      : data.docMethod === 2
        ? `Specific person: ${data.docRecipient || ''}`
        : "Not selected";

    const submittedAt = data.submittedAt
      ? new Date(data.submittedAt).toLocaleString("en-GB")
      : new Date().toLocaleString("en-GB");

    let fileLinksStr = "";
    try {
      const savedFiles = saveUploadedFiles(data.files || [], data.refCode || "", data.id || "");
      fileLinksStr = savedFiles.map(file => `${file.name}: ${file.url}`).join(" | ");
      if ((data.files || []).length && !savedFiles.length) {
        fileLinksStr = "UPLOAD_WARNING: files payload received but no files were created";
      }
    } catch (uploadErr) {
      fileLinksStr = `UPLOAD_ERROR: ${uploadErr.message}`;
    }

    // Append the row in the same order as HEADERS
    sheet.appendRow([
      data.refCode || "",
      submittedAt,
      data.id || "",
      data.name || "",
      data.desig || "",
      data.dept || "",
      data.lastDay || "",
      data.email || "",
      (data.checkedItems || []).length,
      (data.items || []).length,
      (data.checkedItems || []).join(", "),
      docMethodStr,
      data.docRecipient || "",
      docsStr,
      data.fileCount || 0,
      fileLinksStr,
      data.status || "submitted"
    ]);

    // Auto-color submitted vs pending
    const lastRow = sheet.getLastRow();
    const statusCol = HEADERS.indexOf("Status") + 1;
    const statusCell = sheet.getRange(lastRow, statusCol);
    if (data.status === "submitted") {
      statusCell.setBackground("#EAF5EE").setFontColor("#1D8A5A");
    } else {
      statusCell.setBackground("#FDF6E3").setFontColor("#B07A10");
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, ref: data.refCode }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error("doPost error:", err);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (health check / test)
function doGet(e) {
  const sheet = getOrCreateSheet();
  const count = Math.max(0, sheet.getLastRow() - 1); // subtract header row
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "ok",
      sheet: SHEET_NAME,
      submissions: count,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
