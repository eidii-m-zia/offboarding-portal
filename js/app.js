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
  { id:'EMP-0001', name:'James Okafor', desig:'Software Engineer', dept:'Engineering', lastDay:'2026-05-15', email:'j.okafor@co.com', items:['Laptop','Phone','Access card'], checkedItems:['Laptop'], docMethod:1, docRecipient:'', docs:[{name:'Project docs',type:'PDF',notes:'Google Drive',copies:'1'}], status:'pending', submittedAt: new Date(Date.now()-86400000*3).toISOString(), refCode:'OFF-3421' },
  { id:'EMP-0002', name:'Priya Nair', desig:'Marketing Manager', dept:'Marketing', lastDay:'2026-05-12', email:'p.nair@co.com', items:['Laptop','Phone','Timecard','Mouse'], checkedItems:['Laptop','Phone','Timecard','Mouse'], docMethod:2, docRecipient:'Linda Marsh', docs:[{name:'Campaign assets',type:'Folder',notes:'SharePoint',copies:'1'},{name:'Brand guidelines',type:'PDF',notes:'Printed',copies:'2'}], status:'submitted', submittedAt: new Date(Date.now()-86400000*5).toISOString(), refCode:'OFF-3398' },
  { id:'EMP-0003', name:'Tomás Rivera', desig:'Sales Executive', dept:'Sales', lastDay:'2026-05-08', email:'t.rivera@co.com', items:['Laptop','Phone','Access card'], checkedItems:[], docMethod:1, docRecipient:'', docs:[{name:'Client list',type:'Excel',notes:'Email to admin',copies:'1'}], status:'pending', submittedAt: new Date(Date.now()-86400000*1).toISOString(), refCode:'OFF-3412' },
  { id:'EMP-0004', name:'Lena Hoffmann', desig:'HR Coordinator', dept:'HR', lastDay:'2026-05-20', email:'l.hoffmann@co.com', items:['Laptop','Timecard','Access card'], checkedItems:['Access card'], docMethod:2, docRecipient:'HR Director', docs:[{name:'Employee contracts',type:'PDF',notes:'Filing cabinet B',copies:'3'}], status:'pending', submittedAt: new Date(Date.now()-86400000*2).toISOString(), refCode:'OFF-3408' },
  { id:'EMP-0005', name:'Wei Zhang', desig:'Finance Analyst', dept:'Finance', lastDay:'2026-05-18', email:'w.zhang@co.com', items:['Laptop','Phone','Mouse','Monitor'], checkedItems:['Laptop','Phone','Mouse','Monitor'], docMethod:1, docRecipient:'', docs:[{name:'Q1 reports',type:'Excel',notes:'Shared drive',copies:'1'},{name:'Audit trail',type:'PDF',notes:'Archived',copies:'1'}], status:'submitted', submittedAt: new Date(Date.now()-86400000*7).toISOString(), refCode:'OFF-3388' },
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
  const id = document.getElementById('empId').value.trim();
  const name = document.getElementById('empName').value.trim();
  const desig = document.getElementById('empDesig').value.trim();
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

function toggleCheck(i) {
  checkItems[i].checked = !checkItems[i].checked;
  renderCheckGrid();
}

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
  Array.from(files).forEach(f => {
    if (uploadedFiles.length < 10) uploadedFiles.push(f);
  });
  renderFileList();
}
function handleDrag(e, on) { e.preventDefault(); document.getElementById('uploadZone').classList.toggle('drag', on); }
function handleDrop(e) { e.preventDefault(); document.getElementById('uploadZone').classList.remove('drag'); handleFiles(e.dataTransfer.files); }
function removeFile(i) { uploadedFiles.splice(i, 1); renderFileList(); }
function renderFileList() {
  document.getElementById('fileList').innerHTML = uploadedFiles.map((f, i) => `
    <div class="file-item">
      <span>&#128196; ${f.name} <span style="color:var(--muted);font-size:11px;">(${(f.size / 1024).toFixed(1)} KB)</span></span>
      <span class="file-remove" onclick="removeFile(${i})">Remove</span>
    </div>
  `).join('');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

async function buildUploadPayload(files) {
  const maxSizeMb = (typeof CONFIG !== 'undefined' && CONFIG.MAX_UPLOAD_SIZE_MB) ? CONFIG.MAX_UPLOAD_SIZE_MB : 8;
  const maxBytes = maxSizeMb * 1024 * 1024;
  const oversized = files.find(file => file.size > maxBytes);

  if (oversized) {
    throw new Error(`${oversized.name} is larger than ${maxSizeMb} MB. Please upload a smaller file.`);
  }

  return Promise.all(files.map(async file => {
    const dataUrl = await readFileAsDataUrl(file);
    const base64 = String(dataUrl).split(',')[1] || '';
    return {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      data: base64,
    };
  }));
}

// ======================== DOC OPTION ========================
function selectDocOption(n) {
  docOptionSelected = n;
  document.getElementById('docOpt1').classList.toggle('selected', n === 1);
  document.getElementById('docOpt2').classList.toggle('selected', n === 2);
  document.getElementById('recipientField').style.display = n === 2 ? 'block' : 'none';
  if (n === 1) { document.getElementById('adminPopup').classList.add('open'); }
}
function closePopup() { document.getElementById('adminPopup').classList.remove('open'); }

// ======================== DOC ROWS ========================
function addDocRow() {
  const id = Date.now();
  docRows.push({ id, name: '', type: '', notes: '', copies: '1' });
  renderDocTable();
}
function removeDocRow(id) {
  docRows = docRows.filter(r => r.id !== id);
  renderDocTable();
}
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
  const docMethod = docOptionSelected === 1 ? 'Admin team' : docOptionSelected === 2 ? 'Specific person — ' + document.getElementById('recipientName').value : 'Not selected';
  const filledDocs = docRows.filter(r => r.name.trim());

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
      <div style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:10px;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.5px;">Items returning</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:1rem;">
        ${checkedItems.length ? checkedItems.map(it => `<span class="tag green">&#10003; ${it}</span>`).join('') : '<span class="tag gray">No items checked</span>'}
      </div>
      <div style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:8px;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.5px;">Photos uploaded</div>
      <div style="margin-bottom:1rem;font-size:13px;color:var(--text);">${uploadedFiles.length ? uploadedFiles.map(f => `<span class="tag blue">&#128196; ${f.name}</span>`).join(' ') : '<span class="tag gray">No files uploaded</span>'}</div>
      <div style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:8px;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.5px;">Document handover</div>
      <div style="margin-bottom:1rem;font-size:13px;color:var(--text);">${docMethod}</div>
      <div style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:8px;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.5px;">Documents (${filledDocs.length})</div>
      ${filledDocs.length ? `<table style="width:100%;font-size:13px;border-collapse:collapse;">${filledDocs.map(d => `<tr><td style="padding:6px 0;border-bottom:1px solid var(--border);width:40%">${d.name}</td><td style="padding:6px;color:var(--muted);width:25%">${d.type}</td><td style="padding:6px;color:var(--muted)">${d.notes}</td></tr>`).join('')}</table>` : '<span class="tag gray">No documents listed</span>'}
    </div>
  `;
}

function toggleConfirm() {
  confirmed = !confirmed;
  document.getElementById('confirmBox').classList.toggle('checked', confirmed);
  document.getElementById('submitBtn').disabled = !confirmed;
}

// ======================== GOOGLE SHEETS SUBMIT ========================
async function sendToGoogleSheets(data) {
  const url = (typeof CONFIG !== 'undefined') ? CONFIG.SHEETS_WEBHOOK_URL : '';
  if (!url) return { success: false, skipped: true };

  const statusEl = document.getElementById('sheetsStatus');
  statusEl.style.display = 'block';
  statusEl.className = 'sheets-status-saving';
  statusEl.textContent = data.files && data.files.length
    ? 'Saving record and uploading files to Google Drive...'
    : 'Saving to Google Sheets...';

  try {
    // Use no-cors mode — Apps Script returns a redirect that causes CORS issues
    // We send as form data for maximum compatibility
    const formData = new FormData();
    formData.append('payload', JSON.stringify(data));

    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      body: formData,
    });

    // With no-cors we can't read the response, so assume success if no exception
    statusEl.className = 'sheets-status-success';
    statusEl.textContent = data.files && data.files.length
      ? 'Record saved and files sent to Google Drive'
      : 'Record saved to Google Sheets';
    return { success: true };
  } catch (err) {
    statusEl.className = 'sheets-status-error';
    statusEl.textContent = 'Could not reach Google Sheets or Drive - record saved locally only.';
    console.error('Sheets error:', err);
    return { success: false, error: err.message };
  }
}

// ======================== SUBMIT ========================
async function submitForm() {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = uploadedFiles.length ? 'Uploading...' : 'Submitting...';

  const ref = 'OFF-' + Math.floor(1000 + Math.random() * 9000);
  const checkedItems = checkItems.filter(i => i.checked).map(i => i.name);
  const filledDocs = docRows.filter(r => r.name.trim());

  let filePayloads = [];
  try {
    filePayloads = await buildUploadPayload(uploadedFiles);
  } catch (err) {
    alert(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit offboarding ✓';
    return;
  }

  const sub = {
    id: document.getElementById('empId').value,
    name: document.getElementById('empName').value,
    desig: document.getElementById('empDesig').value,
    dept: document.getElementById('empDept').value || '—',
    lastDay: document.getElementById('empLastDay').value,
    email: document.getElementById('empEmail').value,
    items: checkItems.map(i => i.name),
    checkedItems,
    docMethod: docOptionSelected,
    docRecipient: document.getElementById('recipientName').value,
    docs: filledDocs,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    refCode: ref,
    fileCount: uploadedFiles.length,
    files: filePayloads,
  };

  // Send to Google Sheets (non-blocking if no URL configured)
  const sheetsResult = await sendToGoogleSheets(sub);

  delete sub.files;

  // Store locally
  submissions.unshift(sub);

  // Navigate to success page
  document.getElementById('page-' + currentPage).classList.remove('active');
  document.getElementById('page-success').classList.add('active');
  document.getElementById('refCode').textContent = 'REF: ' + ref;

  if (sheetsResult.success) {
    const el = document.getElementById('sheetsConfirm');
    if (el) { el.style.display = 'block'; }
  }

  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  renderAdminMetrics();
  renderAdminTable();
}

// ======================== ADMIN ========================
function toggleAdminMode() {
  isAdminMode = !isAdminMode;
  document.getElementById('stepNav').style.display = isAdminMode ? 'none' : '';
  document.getElementById('adminNav').style.display = isAdminMode ? 'flex' : 'none';
  document.getElementById('adminToggle').textContent = isAdminMode ? '← Back to portal' : '🔒 Admin panel';

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  if (isAdminMode) {
    document.getElementById('page-admin').classList.add('active');
    renderAdminMetrics();
    renderAdminTable();
  } else {
    currentPage = 0;
    document.getElementById('page-0').classList.add('active');
    updateStepNav();
  }
}

function showAdminPage(p) {}

function renderAdminMetrics() {
  const total = submissions.length;
  const done = submissions.filter(s => s.status === 'submitted').length;
  const pending = submissions.filter(s => s.status === 'pending').length;
  const totalItems = submissions.reduce((a, s) => (a + (s.checkedItems || []).length), 0);
  document.getElementById('adminMetrics').innerHTML = `
    <div class="admin-metric"><div class="am-label">Total employees</div><div class="am-value blue">${total}</div></div>
    <div class="admin-metric"><div class="am-label">Submitted</div><div class="am-value green">${done}</div></div>
    <div class="admin-metric"><div class="am-label">Pending</div><div class="am-value warn">${pending}</div></div>
    <div class="admin-metric"><div class="am-label">Items returned</div><div class="am-value">${totalItems}</div></div>
  `;
}

function setSort(key) {
  if (adminSortKey === key) adminSortDir *= -1;
  else { adminSortKey = key; adminSortDir = 1; }
  document.getElementById('adminSort').value = key;
  renderAdminTable();
}

function renderAdminTable() {
  const search = (document.getElementById('adminSearch').value || '').toLowerCase();
  const filter = document.getElementById('adminFilter').value;
  adminSortKey = document.getElementById('adminSort').value;

  ['id', 'name', 'dept', 'date'].forEach(k => {
    const el = document.getElementById('sarr-' + k);
    if (el) { el.textContent = adminSortKey === k ? (adminSortDir === 1 ? '▲' : '▼') : ''; el.className = 'sort-arrow' + (adminSortKey === k ? ' active' : ''); }
  });

  let list = submissions.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search) || s.id.toLowerCase().includes(search) || (s.dept || '').toLowerCase().includes(search);
    const matchFilter = filter === 'all' || s.status === filter;
    return matchSearch && matchFilter;
  });

  const keyMap = { name: 'name', id: 'id', date: 'lastDay', dept: 'dept' };
  list.sort((a, b) => {
    const av = (a[keyMap[adminSortKey]] || '').toLowerCase();
    const bv = (b[keyMap[adminSortKey]] || '').toLowerCase();
    return av < bv ? -adminSortDir : av > bv ? adminSortDir : 0;
  });

  const tbody = document.getElementById('adminTableBody');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--muted)">No records found</td></tr>`; return; }

  tbody.innerHTML = list.map(s => {
    const pct = s.items.length ? Math.round(s.checkedItems.length / s.items.length * 100) : 100;
    const statusHtml = `<span class="badge ${s.status}">${s.status === 'submitted' ? 'Submitted' : 'Pending'}</span>`;
    const docMethod = s.docMethod === 1 ? 'Admin team' : s.docMethod === 2 ? `Person: ${s.docRecipient}` : '—';
    return `<tr style="cursor:pointer" onclick="showDetail('${s.refCode}')">
      <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted)">${s.id}</td>
      <td style="font-weight:500">${s.name}<br><span style="font-size:11px;color:var(--muted)">${s.desig || ''}</span></td>
      <td>${s.dept}</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px">${s.lastDay}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:60px;height:5px;border-radius:3px;background:var(--border);overflow:hidden;"><div style="width:${pct}%;height:100%;background:${pct === 100 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)'}"></div></div>
          <span style="font-size:12px;color:var(--muted)">${s.checkedItems.length}/${s.items.length}</span>
        </div>
      </td>
      <td style="font-size:12px;color:var(--muted)">${docMethod}</td>
      <td>${statusHtml}</td>
      <td><span style="font-size:12px;color:var(--accent);cursor:pointer">View &rarr;</span></td>
    </tr>`;
  }).join('');
}

function showDetail(refCode) {
  const s = submissions.find(x => x.refCode === refCode);
  if (!s) return;
  const checkedTags = (s.items || []).map(it => `<span class="expand-tag${s.checkedItems.includes(it) ? ' checked' : ''}">${s.checkedItems.includes(it) ? '✓ ' : ''} ${it}</span>`).join('');
  const docRows2 = (s.docs || []).map(d => `<tr><td style="padding:6px 0;font-size:13px;border-bottom:1px solid var(--border)">${d.name}</td><td style="padding:6px;font-size:12px;color:var(--muted)">${d.type}</td><td style="padding:6px;font-size:12px;color:var(--muted)">${d.notes}</td><td style="font-size:12px;color:var(--muted)">${d.copies}</td></tr>`).join('');

  document.getElementById('detailBox').innerHTML = `
    <div class="detail-header">
      <h2>${s.name}</h2>
      <button class="close-btn" onclick="document.getElementById('detailModal').classList.remove('open')">Close</button>
    </div>
    <div class="detail-section">
      <h3>Personal info</h3>
      <div class="detail-field"><span class="df-label">Employee ID</span><span class="df-val">${s.id}</span></div>
      <div class="detail-field"><span class="df-label">Designation</span><span class="df-val">${s.desig}</span></div>
      <div class="detail-field"><span class="df-label">Department</span><span class="df-val">${s.dept}</span></div>
      <div class="detail-field"><span class="df-label">Last working day</span><span class="df-val">${s.lastDay}</span></div>
      <div class="detail-field"><span class="df-label">Email</span><span class="df-val">${s.email || '—'}</span></div>
      <div class="detail-field"><span class="df-label">Reference</span><span class="df-val" style="font-family:'DM Mono',monospace;color:var(--accent)">${s.refCode}</span></div>
      <div class="detail-field"><span class="df-label">Submitted</span><span class="df-val">${new Date(s.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
    </div>
    <div class="detail-section">
      <h3>Items checklist</h3>
      <div class="expand-tags">${checkedTags}</div>
    </div>
    <div class="detail-section">
      <h3>Document handover — ${s.docMethod === 1 ? 'Admin team' : s.docMethod === 2 ? 'Specific person: ' + s.docRecipient : 'Not set'}</h3>
      ${docRows2 ? `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;font-size:11px;color:var(--muted);padding:4px 0;border-bottom:1px solid var(--border)">Document</th><th style="text-align:left;font-size:11px;color:var(--muted);padding:4px 6px;border-bottom:1px solid var(--border)">Type</th><th style="text-align:left;font-size:11px;color:var(--muted);padding:4px 6px;border-bottom:1px solid var(--border)">Notes</th><th style="text-align:left;font-size:11px;color:var(--muted);padding:4px 6px;border-bottom:1px solid var(--border)">Copies</th></tr></thead><tbody>${docRows2}</tbody></table>` : '<p style="font-size:13px;color:var(--muted)">No documents listed.</p>'}
    </div>
  `;
  document.getElementById('detailModal').classList.add('open');
}

document.getElementById('detailModal').addEventListener('click', e => {
  if (e.target === document.getElementById('detailModal')) document.getElementById('detailModal').classList.remove('open');
});

init();
