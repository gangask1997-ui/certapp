// CertApp Content Script — detects and fills form fields on government portals

const FIELD_MAP = [
  // Full name
  { keys: ['fullname','full_name','applicantname','name','candidatename','yourname'], profile: 'p_full_name' },
  // Father's name
  { keys: ['fathername','father_name','fatherguardianname','fname'], profile: 'p_father_name' },
  // Mother's name
  { keys: ['mothername','mother_name','mname'], profile: 'p_mother_name' },
  // DOB
  { keys: ['dob','dateofbirth','date_of_birth','birthdate'], profile: 'p_dob' },
  // Gender
  { keys: ['gender','sex'], profile: 'p_gender' },
  // Category
  { keys: ['category','caste','castecategory'], profile: 'p_category' },
  // Mobile
  { keys: ['mobile','mobileno','mobilenumber','phone','phoneno','contact'], profile: 'p_mobile' },
  // Email
  { keys: ['email','emailid','emailaddress'], profile: 'p_email' },
  // Aadhaar
  { keys: ['aadhaar','aadhar','aadhaarno','aadharno','uid','uidno'], profile: 'p_aadhaar' },
  // PAN
  { keys: ['pan','panno','pannumber','pancard'], profile: 'p_pan' },
  // Voter ID
  { keys: ['voterid','votercard','epicno'], profile: 'p_voter_id' },
  // Permanent address
  { keys: ['address','permanentaddress','paddress','addr'], profile: 'p_address_perm' },
  // City
  { keys: ['city','town','village'], profile: 'p_city_perm' },
  // District
  { keys: ['district','dist'], profile: 'p_dist_perm' },
  // State
  { keys: ['state','statename'], profile: 'p_state_perm' },
  // PIN
  { keys: ['pin','pincode','zipcode','postalcode'], profile: 'p_pin_perm' },
  // Nationality
  { keys: ['nationality'], profile: 'p_nationality' },
  // Religion
  { keys: ['religion'], profile: 'p_religion' },
  // Marital status
  { keys: ['maritalstatus','marital'], profile: 'p_marital' },
  // 10th
  { keys: ['10thboard','tenthboard','matricboard','sscboard'], profile: 'p_10_board' },
  { keys: ['10thyear','tenthyear','matricyear','sscy ear','passingyear10'], profile: 'p_10_year' },
  { keys: ['10thmarks','tenthmarks','matricmarks','10thpercentage','sscmarks'], profile: 'p_10_marks' },
  // 12th
  { keys: ['12thboard','twelfthboard','interboard','hseboard'], profile: 'p_12_board' },
  { keys: ['12thyear','twelfthyear','interyear','hseyear'], profile: 'p_12_year' },
  { keys: ['12thmarks','twelfthmarks','intermarks','hsemarks','12thpercentage'], profile: 'p_12_marks' },
  // Graduation
  { keys: ['graduationdegree','ugdegree','degree'], profile: 'p_grad_degree' },
  { keys: ['graduationcollege','ugcollege','college','university'], profile: 'p_grad_college' },
  { keys: ['graduationyear','ugyear','degreeyear'], profile: 'p_grad_year' },
  { keys: ['graduationmarks','ugmarks','degreemarks','graduation%'], profile: 'p_grad_marks' },
  // Bank
  { keys: ['bankname','bank'], profile: 'p_bank_name' },
  { keys: ['accountno','accountnumber','bankaccno','acno'], profile: 'p_bank_acc' },
  { keys: ['ifsc','ifsccode'], profile: 'p_bank_ifsc' },
  { keys: ['branch','branchname'], profile: 'p_bank_branch' },
];

function normalizeKey(s) {
  return s.toLowerCase().replace(/[\s_\-\[\]()#.]/g, '').replace(/no$/, 'no');
}

function getFieldKey(el) {
  const candidates = [
    el.id, el.name, el.getAttribute('placeholder'),
    el.getAttribute('data-field'), el.getAttribute('aria-label'),
    el.closest('label')?.textContent, el.previousElementSibling?.textContent,
    el.closest('td')?.previousElementSibling?.textContent,
    el.closest('tr')?.querySelector('td,th')?.textContent,
  ].filter(Boolean);
  return candidates.map(normalizeKey);
}

function findMatchingProfile(el, profile) {
  const keys = getFieldKey(el);
  for (const mapping of FIELD_MAP) {
    for (const k of keys) {
      if (mapping.keys.some(mk => k.includes(mk) || mk.includes(k))) {
        return profile[mapping.profile];
      }
    }
  }
  return null;
}

function setNativeValue(el, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  if (nativeInputValueSetter) nativeInputValueSetter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function fillForm(profile) {
  let filled = 0;
  const inputs = document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]), textarea, select');

  inputs.forEach(el => {
    const value = findMatchingProfile(el, profile);
    if (!value) return;

    if (el.tagName === 'SELECT') {
      const opts = Array.from(el.options);
      const match = opts.find(o =>
        normalizeKey(o.text).includes(normalizeKey(value)) ||
        normalizeKey(o.value).includes(normalizeKey(value))
      );
      if (match) { el.value = match.value; el.dispatchEvent(new Event('change', { bubbles: true })); filled++; }
    } else {
      if (el.value) return; // don't overwrite existing
      setNativeValue(el, value);
      el.style.background = '#0d2b0d';
      filled++;
    }
  });
  return filled;
}

function highlightFields() {
  const inputs = document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select');
  inputs.forEach(el => {
    el.style.outline = '2px solid #2ea043';
    el.style.outlineOffset = '2px';
    setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 3000);
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'fill') {
    const filled = fillForm(msg.profile);
    sendResponse({ filled });
  }
  if (msg.action === 'highlight') {
    highlightFields();
  }
  return true;
});
