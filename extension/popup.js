const FIELD_LABELS = {
  p_full_name: 'Full Name', p_father_name: "Father's Name", p_mother_name: "Mother's Name",
  p_dob: 'Date of Birth', p_gender: 'Gender', p_category: 'Category',
  p_religion: 'Religion', p_nationality: 'Nationality', p_marital: 'Marital Status',
  p_mobile: 'Mobile', p_email: 'Email', p_address_perm: 'Permanent Address',
  p_city_perm: 'City', p_dist_perm: 'District', p_state_perm: 'State', p_pin_perm: 'PIN Code',
  p_aadhaar: 'Aadhaar', p_pan: 'PAN', p_voter_id: 'Voter ID',
  p_10_board: '10th Board', p_10_year: '10th Year', p_10_marks: '10th %',
  p_12_board: '12th Board', p_12_year: '12th Year', p_12_marks: '12th %',
  p_grad_degree: 'Graduation', p_grad_college: 'College', p_grad_year: 'Grad Year', p_grad_marks: 'Grad %',
  p_bank_name: 'Bank Name', p_bank_acc: 'Account No.', p_bank_ifsc: 'IFSC',
};

let profile = null;

async function loadProfile() {
  return new Promise(resolve => {
    chrome.storage.local.get('certapp_profile', r => resolve(r.certapp_profile || null));
  });
}

async function init() {
  profile = await loadProfile();
  const statusBox = document.getElementById('status-box');
  const mainActions = document.getElementById('main-actions');

  if (!profile) {
    statusBox.className = 'status warn';
    statusBox.textContent = 'No profile loaded. Import your profile from CertApp.';
    return;
  }

  const filled = Object.entries(profile).filter(([, v]) => v && String(v).trim());
  statusBox.className = 'status ok';
  statusBox.textContent = `✓ Profile loaded — ${filled.length} fields ready`;
  document.getElementById('field-count').textContent = `${filled.length} fields will be used for autofill`;
  mainActions.style.display = 'block';

  const preview = document.getElementById('profile-preview');
  preview.innerHTML = filled.slice(0, 12).map(([k, v]) =>
    `<div class="pfield"><span class="pfield-label">${FIELD_LABELS[k] || k}</span><span class="pfield-value" title="${esc(v)}">${esc(v)}</span></div>`
  ).join('') + (filled.length > 12 ? `<div style="text-align:center;color:#8b949e;font-size:0.7rem;padding:4px">+${filled.length - 12} more fields</div>` : '');
}

function esc(s) { return String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function toggleImport() {
  const el = document.getElementById('import-area');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function importFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => processImport(e.target.result);
  reader.readAsText(file);
}

function importPasted() {
  const text = document.getElementById('json-paste').value.trim();
  if (!text) return alert('Paste your JSON first.');
  processImport(text);
}

function processImport(text) {
  try {
    const data = JSON.parse(text);
    if (data.app !== 'certapp' || !data.profile) return alert('Invalid CertApp file.');
    chrome.storage.local.set({ certapp_profile: data.profile }, () => {
      alert('Profile imported successfully!');
      init();
      document.getElementById('import-area').style.display = 'none';
    });
  } catch(e) {
    alert('Invalid file format: ' + e.message);
  }
}

function clearProfile() {
  if (!confirm('Clear saved profile from extension?')) return;
  chrome.storage.local.remove('certapp_profile', () => {
    profile = null;
    document.getElementById('main-actions').style.display = 'none';
    const statusBox = document.getElementById('status-box');
    statusBox.className = 'status warn';
    statusBox.textContent = 'Profile cleared. Import again from CertApp.';
  });
}

async function fillPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'fill', profile }, response => {
    const btn = document.getElementById('btn-fill');
    if (chrome.runtime.lastError || !response) {
      btn.textContent = '⚠ Could not reach page. Try refreshing.';
      return;
    }
    btn.textContent = `✓ Filled ${response.filled} field(s)`;
    btn.style.background = '#238636';
    setTimeout(() => { btn.textContent = '⚡ Auto Fill This Page'; btn.style.background = ''; }, 3000);
  });
}

async function highlightFields() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'highlight' });
}

init();
