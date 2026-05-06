// ======================== STATE ========================
let currentPage = 0;
let isAdminMode = false;
let confirmed = false;
let docOptionSelected = 0;
let uploadedFiles = [];
let adminSortKey = 'name';
let adminSortDir = 1;

const defaultItems = ['Laptop','Phone','Mouse','Timecard','Access card','Headset','Monitor','Others'];
let checkItems = defaultItems.map(name => ({ name, checked: false }));

let docRows = [];
let submissions = [
  { id:'EMP-0001', name:'James Okafor', desig:'Software Engineer', dept:'Engineering', lastDay:'2026-05-15', email:'j.okafor@co.com', items:['Laptop','Phone','Access card'], checkedItems:['Laptop'], docMethod:1, docRecipient:'', docs:[{name:'Project docs',type:'PDF',notes:'Google Drive',copies:'1'}], status:'pending', submittedAt: new Date(Date.now()-86400000*3).toISOString(), refCode:'OFF-3421', driveFolder:'', driveFolderName:'', fileCount:0 },
  { id:'EMP-0002', name:'Priya Nair', desig:'Marketing Manager', dept:'Marketing', lastDay:'2026-05-12', email:'p.nair@co.com', items:['Laptop','Phone','Timecard','Mouse'], checkedItems:['Laptop','Phone','Timecard','Mouse'], docMethod:2, docRecipient:'Linda Marsh', docs:[{name:'Campaign assets',type:'Folder',notes:'SharePoint',copies:'1'},{name:'Brand guidelines',type:'PDF',notes:'Printed',copies:'2'}], status:'submitted', submittedAt: new Date(Date.now()-86400000*5).toISOString(), refCode:'OFF-3398', driveFolder:'', driveFolderName:'', fileCount:0 },
  { id:'EMP-0003', name:'Tomás Rivera', desig:'Sales Executive', dept:'Sales', lastDay:'2026-05-08', email:'t.rivera@co.com', items:['Laptop','Phone','Access card'], checkedItems:[], docMethod:1, docRecipient:'', docs:[{name:'Client list',type:'Excel',notes:'Email to admin',copies:'1'}], status:'pending', submittedAt: new Date(Date.now()-86400000*1).toISOString(), refCode:'OFF-3412', driveFolder:'', driveFolderName:'', fileCount:0 },
  { id:'EMP-0004', name:'Lena Hoffmann', desig:'HR Coordinator', dept:'HR', lastDay:'2026-05-20', email:'l.hoffmann@co.com', items:['Laptop','Timecard','Access card'], checkedItems:['Access card'], docMethod:2, docRecipient:'HR Director', docs:[{name:'Employee contracts',type:'PDF',notes:'Filing cabinet B',copies:'3'}], status:'pending', submittedAt: new Date(Date.now()-86400000*2).toISOString(), refCode:'OFF-3408', driveFolder:'', driveFolderName:'', fileCount:0 },
  { id:'EMP-0005', name:'Wei Zhang', desig:'Finance Analyst', dept:'Finance', lastDay:'2026-05-18', email:'w.zhang@co.com', items:['Laptop','Phone','Mouse','Monitor'], checkedItems:['Laptop','Phone','Mouse','Monitor'], docMethod:1, docRecipient:'', docs:[{name:'Q1 reports',type:'Excel',notes:'Shared drive',copies:'1'},{name:'Audit trail',type:'PDF',notes:'Archived',copies:'1'}], status:'submitted', submittedAt: new Date(Date.now()-86400000*7).toISOString(), refCode:'OFF-3388', driveFolder:'', driveFolderName:'', fileCount:0 },
];

// ======================== INIT ========================
function init() {
  if (typeof CONFIG !== 'undefined' && CONFIG.APP_NAME) {
    document.title = CONFIG.APP_NAME;
  }
  renderCheckGrid();
  addDocRow();
  addDocRow();
  renderAdminMetrics();
  renderAdminTable();
}

// ======================== PAGE NAV ========================
function goToPage(n) {
  if (n === 1 && !validatePage0()) return;
  if (n === 2 && !validatePage1()) return;
  if (n === 3 && !validatePage2()) return;

  document.getElementById('page-' + currentPage).classList.remove('active');
  currentPage = n;
  document.getElementById('page-' + currentPage).classList.add('active');
  updateStepNav();
  if (n === 3) buildReview();
  window.scrollTo(0, 0);
}

function updateStepNav() {
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i === currentPage) el.classList.add('active');
    else if (i < currentPage) el.classList.add('done');
  });
}

function validatePage0() {
  const id   = document.getElementById('empId').value.trim();
  const name = document.getElementById('empName').value.trim();
  const desig= document.getElementById('empDesig').value.trim();
  const last = document.getElementById('empLastDay').value;
  if (!id || !name || !desig || !last) {
    alert('Please fill in all required fields (Employee ID, Name, Designation, Last working date).');
    return false;
  }
  return true;
}
function validatePage1() { return true; }
function validatePage2() {
  if (docOptionSelected === 2 && !document.getElementById('recipientName').value.trim()) {
    alert('Please enter the recipient name for document handover.');
    return false;
  }
  return true;
}

// ======================== CHECK GRID ========================
function renderCheckGrid() {
  const grid = document.getElementById('checkGrid');
  grid.innerHTML = checkItems.map((item, i) => `
    <div class="check-item${item.checked ? ' checked' : ''}" onclick="toggleCheck(${i})">
      <div class="check-box">
        <svg viewBox="0 0 12 12" fill="none"><polyline points="1.5,6 5,9.5 10.5,2.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span class="check-label">${item.name}</span>
    </div>
  `).join('');
}
function toggleCheck(i) { checkItems[i].checked = !checkItems[i].checked; renderCheckGrid(); }
function addCustomItem() {
  const inp = document.getElementById('newItemInput');
  const val = inp.value.trim();
  if (!val) return;
  checkItems.push({ name: val, checked: true });
  inp.value = '';
  renderCheckGrid();
}

// ======================== FILES ========================
function handleFiles(files) {
  Array.from(files).forEach(f => { if (uploadedFiles.length < 10) uploadedFiles.push(f); });
  renderFileList();
}
function handleDrag(e, on) { e.preventDefault(); document.getElementById('uploadZone').classList.toggle('drag', on); }
function handleDrop(e) { e.preventDefault(); document.getElementById('uploadZone').classList.remove('drag'); handleFiles(e.dataTransfer.files); }
function removeFile(i) { uploadedFiles.splice(i, 1); renderFileList(); }
function renderFileList() {
  document.getElementById('fileList').innerHTML = uploadedFiles.map((f, i) => `
    <div class="file-item">
      <span>&#128196; ${f.name} <span style="color:var(--muted);font-size:11px;">(${(f.size/1024).toFixed(1)} KB)</span></span>
      <span class="file-remove" onclick="removeFile(${i})">Remove</span>
    </div>
  `).join('');
}

// ======================== DOC OPTION ========================
function selectDocOption(n) {
  docOptionSelected = n;
  document.getElementById('docOpt1').classList.toggle('selected', n === 1);
  document.getElementById('docOpt2').classList.toggle('selected', n === 2);
  document.getElementById('recipientField').style.display = n === 2 ? 'block' : 'none';
  if (n === 1) document.getElementById('adminPopup').classList.add('open');
}
function closePopup() { document.getElementById('adminPopup').classList.remove('open'); }

// ======================== DOC ROWS ========================
function addDocRow() {
  docRows.push({ id: Date.now(), name: '', type: '', notes: '', copies: '1' });
  renderDocTable();
}
function removeDocRow(id) { docRows = docRows.filter(r => r.id !== id); renderDocTable(); }
function renderDocTable() {
  document.getElementById('docTableBody').innerHTML = docRows.map((r, i) => `
    <tr>
      <td><input type="text" value="${r.name}" placeholder="e.g. Project handover" onchange="docRows[${i}].name=this.value"></td>
      <td><input type="text" value="${r.type}" placeholder="e.g. PDF, Folder" onchange="docRows[${i}].type=this.value"></td>
      <td><input type="text" value="${r.notes}" placeholder="Location / notes" onchange="docRows[${i}].notes=this.value"></td>
      <td><input type="text" value="${r.copies}" placeholder="1" onchange="docRows[${i}].copies=this.value" style="width:50px;"></td>
      <td><span style="color:var(--danger);cursor:pointer;font-size:18px;" onclick="removeDocRow(${r.id})">&#215;</span></td>
    </tr>
  `).join('');
}

// ======================== REVIEW ========================
function buildReview() {
  const checkedItems = checkItems.filter(i => i.checked).map(i => i.name);
  const docMethod    = docOptionSelected === 1 ? 'Admin team' : docOptionSelected === 2 ? 'Specific person — ' + document.getElementById('recipientName').value : 'Not selected';
  const filledDocs   = docRows.filter(r => r.name.trim());

  document.getElementById('reviewContent').innerHTML = `
    <div class="card-title">Summary</div>
    <div class="review-section">
      <div class="review-row"><span class="rl">Employee ID</span><span class="rv">${document.getElementById('empId').value}</span></div>
      <div class="review-row"><span class="rl">Full name</span><span class="rv">${document.getElementById('empName').value}</span></div>
      <div class="review-row"><span class="rl">Designation</span><span class="rv">${document.getElementById('empDesig').value}</span></div>
      <div class="review-row"><span class="rl">Department</span><span class="rv">${document.getElementById('empDept').value || '—'}</span></div>
      <div class="review-row"><span class="rl">Last working day</span><span class="rv">${document.getElementById('empLastDay').value}</span></div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:0.5rem;">
      <div class="review-sub-label">Items returning</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:1rem;">
        ${checkedItems.length ? checkedItems.map(it => `<span class="tag green">&#10003; ${it}</span>`).join('') : '<span class="tag gray">No items checked</span>'}
      </div>
      <div class="review-sub-label">Photos / files to upload</div>
      <div style="margin-bottom:1rem;font-size:13px;">
        ${uploadedFiles.length ? uploadedFiles.map(f => `<span class="tag blue">&#128196; ${f.name}</span>`).join(' ') : '<span class="tag gray">No files selected</span>'}
      </div>
      <div class="review-sub-label">Document handover</div>
      <div style="margin-bottom:1rem;font-size:13px;">${docMethod}</div>
      <div class="review-sub-label">Documents (${filledDocs.length})</div>
      ${filledDocs.length ? `<table style="width:100%;font-size:13px;border-collapse:collapse;">${filledDocs.map(d => `<tr><td style="padding:6px 0;border-bottom:1px solid var(--border);width:40%">${d.name}</td><td style="padding:6px;color:var(--muted);width:25%">${d.type}</td><td style="padding:6px;color:var(--muted)">${d.notes}</td></tr>`).join('')}</table>` : '<span class="tag gray">No documents listed</span>'}
    </div>
  `;
}

function toggleConfirm() {
  confirmed = !confirmed;
  document.getElementById('confirmBox').classList.toggle('checked', confirmed);
  document.getElementById('submitBtn').disabled = !confirmed;
}

// ======================== SPINNER HELPERS ========================
function showSpinner(msg) {
  document.getElementById('spinnerOverlay').style.display = 'flex';
  document.getElementById('spinnerMsg').textContent = msg || 'Please wait…';
}
function updateSpinner(msg) {
  document.getElementById('spinnerMsg').textContent = msg || '';
}
function hideSpinner() {
  document.getElementById('spinnerOverlay').style.display = 'none';
}

// ======================== FILE → BASE64 (chunked-safe) ========================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ======================== UPLOAD FILES TO DRIVE ========================
// Files up to ~20 MB are sent as base64 one at a time.
// Apps Script accepts them and saves each into a named Drive folder.
async function uploadFilesToDrive(employeeName, empId, refCode) {
  const url = (typeof CONFIG !== 'undefined') ? CONFIG.SHEETS_WEBHOOK_URL : '';
  if (!url || uploadedFiles.length === 0) return { success: true, skipped: true, folderName: '' };

  const folderName = `${employeeName} (${empId}) — ${refCode}`;
  let allOk = true;

  for (let i = 0; i < uploadedFiles.length; i++) {
    const file = uploadedFiles[i];
    updateSpinner(`Uploading file ${i + 1} of ${uploadedFiles.length}: ${file.name}`);

    try {
      const base64 = await fileToBase64(file);
      const payload = {
        action:    'uploadFile',
        folderName,
        refCode,
        fileName:  file.name,
        mimeType:  file.type || 'application/octet-stream',
        base64Data: base64,
      };
      const fd = new FormData();
      fd.append('payload', JSON.stringify(payload));
      // no-cors: browser blocks reading the response but the request reaches Apps Script fine
      await fetch(url, { method: 'POST', mode: 'no-cors', body: fd });
    } catch (err) {
      console.error('Upload error:', file.name, err);
      allOk = false;
    }
  }

  return { success: allOk, folderName };
}

// ======================== SEND FORM TO SHEETS ========================
async function sendToGoogleSheets(data) {
  const url = (typeof CONFIG !== 'undefined') ? CONFIG.SHEETS_WEBHOOK_URL : '';
  if (!url) return { success: false, skipped: true };
  try {
    const fd = new FormData();
    fd.append('payload', JSON.stringify({ action: 'submitForm', ...data }));
    await fetch(url, { method: 'POST', mode: 'no-cors', body: fd });
    return { success: true };
  } catch (err) {
    console.error('Sheets error:', err);
    return { success: false };
  }
}

// ======================== SUBMIT ========================
async function submitForm() {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;

  const ref     = 'OFF-' + Math.floor(1000 + Math.random() * 9000);
  const empName = document.getElementById('empName').value;
  const empId   = document.getElementById('empId').value;

  // ── Step 1: Upload files to Google Drive ──
  let driveFolderName = '';
  if (uploadedFiles.length > 0) {
    showSpinner(`Uploading file 1 of ${uploadedFiles.length}…`);
    const driveResult = await uploadFilesToDrive(empName, empId, ref);
    driveFolderName = driveResult.folderName || '';
  }

  // ── Step 2: Submit form data to Sheets ──
  updateSpinner('Saving record to Google Sheets…');
  showSpinner('Saving record to Google Sheets…');

  const sub = {
    id:             empId,
    name:           empName,
    desig:          document.getElementById('empDesig').value,
    dept:           document.getElementById('empDept').value || '—',
    lastDay:        document.getElementById('empLastDay').value,
    email:          document.getElementById('empEmail').value,
    items:          checkItems.map(i => i.name),
    checkedItems:   checkItems.filter(i => i.checked).map(i => i.name),
    docMethod:      docOptionSelected,
    docRecipient:   document.getElementById('recipientName').value,
    docs:           docRows.filter(r => r.name.trim()),
    status:         'submitted',
    submittedAt:    new Date().toISOString(),
    refCode:        ref,
    fileCount:      uploadedFiles.length,
    driveFolderName,
    driveFolder:    '',
  };

  const sheetsResult = await sendToGoogleSheets(sub);
  submissions.unshift(sub);
  hideSpinner();

  // ── Step 3: Success page ──
  document.getElementById('page-' + currentPage).classList.remove('active');
  document.getElementById('page-success').classList.add('active');
  document.getElementById('refCode').textContent = 'REF: ' + ref;

  if (driveFolderName) {
    const el = document.getElementById('driveFolderInfo');
    if (el) { el.style.display = 'block'; el.innerHTML = `&#128193; Files saved to Drive folder: <strong>${driveFolderName}</strong>`; }
  }
  if (sheetsResult.success) {
    const el = document.getElementById('sheetsConfirm');
    if (el) el.style.display = 'block';
  }

  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  renderAdminMetrics();
  renderAdminTable();
}

// ======================== ADMIN ========================
function toggleAdminMode() {
  isAdminMode = !isAdminMode;
  document.getElementById('stepNav').style.display   = isAdminMode ? 'none' : '';
  document.getElementById('adminNav').style.display  = isAdminMode ? 'flex' : 'none';
  document.getElementById('adminToggle').textContent = isAdminMode ? '← Back to portal' : '🔒 Admin panel';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  if (isAdminMode) {
    document.getElementById('page-admin').classList.add('active');
    renderAdminMetrics(); renderAdminTable();
  } else {
    currentPage = 0;
    document.getElementById('page-0').classList.add('active');
    updateStepNav();
  }
}

function renderAdminMetrics() {
  const total      = submissions.length;
  const done       = submissions.filter(s => s.status === 'submitted').length;
  const pending    = submissions.filter(s => s.status === 'pending').length;
  const totalItems = submissions.reduce((a, s) => a + (s.checkedItems||[]).length, 0);
  document.getElementById('adminMetrics').innerHTML = `
    <div class="admin-metric"><div class="am-label">Total employees</div><div class="am-value blue">${total}</div></div>
    <div class="admin-metric"><div class="am-label">Submitted</div><div class="am-value green">${done}</div></div>
    <div class="admin-metric"><div class="am-label">Pending</div><div class="am-value warn">${pending}</div></div>
    <div class="admin-metric"><div class="am-label">Items returned</div><div class="am-value">${totalItems}</div></div>
  `;
}

function setSort(key) {
  if (adminSortKey === key) adminSortDir *= -1; else { adminSortKey = key; adminSortDir = 1; }
  document.getElementById('adminSort').value = key;
  renderAdminTable();
}

function renderAdminTable() {
  const search  = (document.getElementById('adminSearch').value || '').toLowerCase();
  const filter  = document.getElementById('adminFilter').value;
  adminSortKey  = document.getElementById('adminSort').value;

  ['id','name','dept','date'].forEach(k => {
    const el = document.getElementById('sarr-' + k);
    if (el) { el.textContent = adminSortKey === k ? (adminSortDir === 1 ? '▲' : '▼') : ''; el.className = 'sort-arrow' + (adminSortKey === k ? ' active' : ''); }
  });

  let list = submissions.filter(s => {
    const ms = !search || s.name.toLowerCase().includes(search) || s.id.toLowerCase().includes(search) || (s.dept||'').toLowerCase().includes(search);
    return ms && (filter === 'all' || s.status === filter);
  });

  const km = { name:'name', id:'id', date:'lastDay', dept:'dept' };
  list.sort((a, b) => { const av=(a[km[adminSortKey]]||'').toLowerCase(), bv=(b[km[adminSortKey]]||'').toLowerCase(); return av<bv?-adminSortDir:av>bv?adminSortDir:0; });

  const tbody = document.getElementById('adminTableBody');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--muted)">No records found</td></tr>`; return; }

  tbody.innerHTML = list.map(s => {
    const pct   = s.items.length ? Math.round(s.checkedItems.length/s.items.length*100) : 100;
    const badge = `<span class="badge ${s.status}">${s.status==='submitted'?'Submitted':'Pending'}</span>`;
    const doc   = s.docMethod===1?'Admin team':s.docMethod===2?`Person: ${s.docRecipient}`:'—';
    const drive = s.driveFolderName
      ? `<span title="${s.driveFolderName}" style="font-size:11px;color:var(--accent);">&#128193; ${s.fileCount||0} file(s)</span>`
      : `<span style="font-size:11px;color:var(--muted);">—</span>`;
    return `<tr style="cursor:pointer" onclick="showDetail('${s.refCode}')">
      <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted)">${s.id}</td>
      <td style="font-weight:500">${s.name}<br><span style="font-size:11px;color:var(--muted)">${s.desig||''}</span></td>
      <td>${s.dept}</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px">${s.lastDay}</td>
      <td><div style="display:flex;align-items:center;gap:8px;"><div style="width:60px;height:5px;border-radius:3px;background:var(--border);overflow:hidden;"><div style="width:${pct}%;height:100%;background:${pct===100?'var(--success)':pct>=50?'var(--warning)':'var(--danger)'}"></div></div><span style="font-size:12px;color:var(--muted)">${s.checkedItems.length}/${s.items.length}</span></div></td>
      <td>${drive}</td>
      <td style="font-size:12px;color:var(--muted)">${doc}</td>
      <td>${badge}</td>
      <td><span style="font-size:12px;color:var(--accent)">View &rarr;</span></td>
    </tr>`;
  }).join('');
}

function showDetail(refCode) {
  const s = submissions.find(x => x.refCode === refCode);
  if (!s) return;
  const tags    = (s.items||[]).map(it => `<span class="expand-tag${s.checkedItems.includes(it)?' checked':''}">${s.checkedItems.includes(it)?'✓ ':''} ${it}</span>`).join('');
  const docHtml = (s.docs||[]).map(d => `<tr><td style="padding:6px 0;font-size:13px;border-bottom:1px solid var(--border)">${d.name}</td><td style="padding:6px;font-size:12px;color:var(--muted)">${d.type}</td><td style="padding:6px;font-size:12px;color:var(--muted)">${d.notes}</td><td style="font-size:12px;color:var(--muted)">${d.copies}</td></tr>`).join('');
  const driveSec = s.driveFolderName ? `
    <div class="detail-section">
      <h3>Google Drive uploads</h3>
      <div class="detail-field"><span class="df-label">Folder name</span><span class="df-val">&#128193; ${s.driveFolderName}</span></div>
      <div class="detail-field"><span class="df-label">Files</span><span class="df-val">${s.fileCount||0} file(s) uploaded</span></div>
      ${s.driveFolder?`<div class="detail-field"><span class="df-label">Drive link</span><span class="df-val"><a href="${s.driveFolder}" target="_blank" style="color:var(--accent)">Open folder ↗</a></span></div>`:''}
    </div>` : '';

  document.getElementById('detailBox').innerHTML = `
    <div class="detail-header"><h2>${s.name}</h2><button class="close-btn" onclick="document.getElementById('detailModal').classList.remove('open')">Close</button></div>
    <div class="detail-section">
      <h3>Personal info</h3>
      <div class="detail-field"><span class="df-label">Employee ID</span><span class="df-val">${s.id}</span></div>
      <div class="detail-field"><span class="df-label">Designation</span><span class="df-val">${s.desig}</span></div>
      <div class="detail-field"><span class="df-label">Department</span><span class="df-val">${s.dept}</span></div>
      <div class="detail-field"><span class="df-label">Last working day</span><span class="df-val">${s.lastDay}</span></div>
      <div class="detail-field"><span class="df-label">Email</span><span class="df-val">${s.email||'—'}</span></div>
      <div class="detail-field"><span class="df-label">Reference</span><span class="df-val" style="font-family:'DM Mono',monospace;color:var(--accent)">${s.refCode}</span></div>
      <div class="detail-field"><span class="df-label">Submitted</span><span class="df-val">${new Date(s.submittedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span></div>
    </div>
    <div class="detail-section"><h3>Items checklist</h3><div class="expand-tags">${tags}</div></div>
    ${driveSec}
    <div class="detail-section">
      <h3>Document handover — ${s.docMethod===1?'Admin team':s.docMethod===2?'Specific person: '+s.docRecipient:'Not set'}</h3>
      ${docHtml?`<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;font-size:11px;color:var(--muted);padding:4px 0;border-bottom:1px solid var(--border)">Document</th><th style="text-align:left;font-size:11px;color:var(--muted);padding:4px 6px;border-bottom:1px solid var(--border)">Type</th><th style="text-align:left;font-size:11px;color:var(--muted);padding:4px 6px;border-bottom:1px solid var(--border)">Notes</th><th style="text-align:left;font-size:11px;color:var(--muted);padding:4px 6px;border-bottom:1px solid var(--border)">Copies</th></tr></thead><tbody>${docHtml}</tbody></table>`:'<p style="font-size:13px;color:var(--muted)">No documents listed.</p>'}
    </div>
  `;
  document.getElementById('detailModal').classList.add('open');
}

document.getElementById('detailModal').addEventListener('click', e => {
  if (e.target === document.getElementById('detailModal')) document.getElementById('detailModal').classList.remove('open');
});

init();