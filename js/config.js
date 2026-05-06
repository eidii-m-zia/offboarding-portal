/**
 * ============================================================
 *  CONFIGURATION — Edit this file to connect Google Sheets
 * ============================================================
 *
 * STEP 1: Create a new Google Sheet.
 * STEP 2: Open Extensions → Apps Script and paste the code
 *         from google-apps-script.js (in this repo).
 * STEP 3: Click Deploy → New deployment → Web app.
 *         - Execute as: Me
 *         - Who has access: Anyone
 * STEP 4: Copy the Web App URL and paste it below.
 * STEP 5: Save and push to GitHub. Done!
 *
 * Leave SHEETS_WEBHOOK_URL as an empty string "" to disable
 * Google Sheets integration (submissions still work locally).
 * ============================================================
 */

const CONFIG = {
  // Paste your Google Apps Script Web App URL here:
  SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbwaSC5eJPUfTyq_q54sC1uMD7XqwLA3QAU1VenBvbXn3Bwa4azOFLKyNkmvyql2ea_Adg/exec",

  // Optional: customize the portal name shown in the browser tab
  APP_NAME: "Staff Offboarding Portal",

  // Optional: maximum size per uploaded file before sending to Google Drive
  MAX_UPLOAD_SIZE_MB: 8,
};
