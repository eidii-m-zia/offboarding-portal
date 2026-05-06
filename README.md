# Staff Offboarding Portal

A clean, multi-step offboarding form that runs entirely in the browser — no server needed. Submissions are logged to **Google Sheets** via a Google Apps Script webhook, and the site is hosted on **GitHub Pages** for free.

---

## 🚀 Quick Start

### 1. Fork / push to GitHub

1. Create a new GitHub repository (e.g. `offboarding-portal`).
2. Upload all files in this folder, keeping the directory structure intact:
   ```
   index.html
   css/style.css
   js/config.js
   js/app.js
   google-apps-script.js   ← reference only, not served
   README.md
   ```
3. Go to **Settings → Pages → Source → Deploy from branch → `main` → `/root`**.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute.

---

### 2. Connect Google Sheets

#### Step A — Create the sheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name it anything you like (e.g. "Offboarding Records").

#### Step B — Add the Apps Script
1. In your sheet, click **Extensions → Apps Script**.
2. Delete all existing code in the editor.
3. Open `google-apps-script.js` from this repo and **copy all of it**.
4. Paste it into the Apps Script editor and click **Save** (💾).

#### Step C — Deploy as a Web App
1. Click **Deploy → New deployment**.
2. Click the gear icon ⚙ next to "Type" and select **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**. Authorize the permissions when prompted.
5. Copy the **Web app URL** (it looks like `https://script.google.com/macros/s/ABC123.../exec`).

#### Step D — Add the URL to config.js
1. Open `js/config.js`.
2. Paste your URL as the value of `SHEETS_WEBHOOK_URL`:
   ```js
   const CONFIG = {
     SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/YOUR_ID/exec",
     APP_NAME: "Staff Offboarding Portal",
   };
   ```
3. Save and push/commit to GitHub.

That's it! Every form submission will now appear as a new row in your Google Sheet, colour-coded by status.

---

## 📁 File Structure

```
offboarding-portal/
├── index.html              Main app page
├── css/
│   └── style.css           All styles
├── js/
│   ├── config.js           ← Edit this: paste your Sheets URL here
│   └── app.js              All application logic + Sheets integration
├── google-apps-script.js   Paste into Google Apps Script editor
└── README.md               This file
```

---

## 🔧 Customisation

| What | Where |
|------|-------|
| Change checklist items | Edit `defaultItems` array in `js/app.js` |
| Change the portal name | Edit `APP_NAME` in `js/config.js` |
| Change colours / fonts | Edit `:root` variables in `css/style.css` |
| Add / remove form fields | Edit `index.html` + update `submitForm()` in `js/app.js` + add columns to `HEADERS` in `google-apps-script.js` |
| Rename the Google Sheet tab | Edit `SHEET_NAME` in `google-apps-script.js` and redeploy |

---

## ❓ Troubleshooting

**Submissions aren't appearing in Sheets**
- Check that `SHEETS_WEBHOOK_URL` is set correctly in `js/config.js`.
- Open the Apps Script editor → Executions to see if requests are arriving.
- Make sure you deployed as **Anyone** (not "Only myself").
- After editing the Apps Script code, always create a **new deployment** — editing the existing one doesn't update it.

**CORS errors in browser console**
- This is expected. The portal uses `no-cors` mode, which means the browser can't read the response — but the data still reaches Google Sheets. The "Saved to Sheets" message shows optimistically once the request completes without a network error.

**GitHub Pages shows a blank page**
- Make sure `index.html` is in the **root** of the repo (not inside a subfolder).
- Double-check the Pages source branch and folder in repository Settings.

---

## 📊 Google Sheet columns

| Column | Description |
|--------|-------------|
| Ref Code | Unique submission ID (e.g. OFF-3421) |
| Submitted At | Date and time of submission |
| Employee ID | e.g. EMP-0042 |
| Full Name | Employee full name |
| Designation | Job title |
| Department | Department name |
| Last Working Day | Final date of employment |
| Email | Work email address |
| Items Checked | Number of items ticked |
| Items Total | Total checklist items |
| Checked Items List | Comma-separated list of items returned |
| Doc Handover Method | Admin team / Specific person |
| Doc Recipient | Name of recipient (if applicable) |
| Documents | All documents listed with type and notes |
| File Count | Number of uploaded files |
| Status | submitted / pending |

---

*Built with plain HTML, CSS, and JavaScript — no frameworks, no build step.*
