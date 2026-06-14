// Helpers to call Google Sheets API and parse values
const SHEETS_BASE = `https://sheets.googleapis.com/v4/spreadsheets/${window.SPREADSHEET_ID}/values`;

async function fetchSheetRange(range) {
  const url = `${SHEETS_BASE}/${encodeURIComponent(range)}?key=${window.API_KEY}`;
  console.log('[fetchSheetRange] Request URL:', url);
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    console.error('[fetchSheetRange] Fetch failed:', url, err);
    throw err;
  }
  console.log('[fetchSheetRange] Response status:', res.status);
  let text;
  try {
    text = await res.clone().text();
    console.log('[fetchSheetRange] Response body (snippet):', text.slice(0,2000));
  } catch (err) {
    console.error('[fetchSheetRange] Failed reading response text:', err);
  }
  if (!res.ok) {
    const err = new Error('Network response not ok: ' + res.status);
    err.responseBody = text;
    throw err;
  }
  let json;
  try {
    json = await res.json();
  } catch (err) {
    console.error('[fetchSheetRange] JSON parse error for URL:', url, err);
    console.error('[fetchSheetRange] Raw response body:', text);
    throw err;
  }
  return json;
}

// Get list of available sheet names from the spreadsheet metadata
async function getAvailableSheets(){
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${window.SPREADSHEET_ID}?fields=sheets.properties.title&key=${window.API_KEY}`;
  try{
    const res = await fetch(url);
    const json = await res.json();
    const titles = (json.sheets||[]).map(s=>s.properties && s.properties.title).filter(Boolean);
    console.log('[getAvailableSheets] available sheets:', titles);
    return titles;
  }catch(err){
    console.error('[getAvailableSheets] failed to fetch sheet metadata', err);
    return [];
  }
}

window.getAvailableSheets = getAvailableSheets;

function valuesToObjects(values) {
  if (!values || !values.length) return [];
  const headers = values[0].map(h => String(h).trim());
  const rows = values.slice(1);
  return rows.map(r => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = r[i] !== undefined ? r[i] : '';
    }
    return obj;
  });
}

function findKey(obj, keys) {
  function norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''); }
  const objKeys = Object.keys(obj||{});
  for (const k of objKeys) {
    for (const target of keys) {
      if (norm(k) === norm(target)) return k;
    }
  }
  return null;
}

async function getSheetData(sheetName, rangeSuffix='A:Z') {
  const range = `${sheetName}!${rangeSuffix}`;
  const json = await fetchSheetRange(range);
  const values = json.values || [];
  return valuesToObjects(values);
}

// searchStudent: load SISWA sheet and filter by id or name
async function searchStudent(keyword) {
  console.log('[searchStudent] keyword:', keyword);
  const list = await getSheetData('SISWA','A:Q');
  const lower = String(keyword || '').toLowerCase();
  if (!lower) return [];
  // find header keys for id and name
  const sample = list[0] || {};
  const idKey = findKey(sample, ['id','id_siswa','nis','nisn']);
  const nameKey = findKey(sample, ['nama','name','nama_lengkap','full name']);
  console.log('[searchStudent] detected keys', {idKey,nameKey});
  return list.filter(item => {
    const idVal = idKey ? String(item[idKey]||'').toLowerCase() : '';
    const nameVal = nameKey ? String(item[nameKey]||'').toLowerCase() : '';
    return idVal.includes(lower) || nameVal.includes(lower);
  }).map(item => ({
    id: idKey ? item[idKey] : '',
    nama: nameKey ? item[nameKey] : (item['nama']||item['name']||''),
  }));
}

// getStudentDetail: fetch multiple sheets and assemble
async function getStudentDetail(studentId) {
  console.log('[getStudentDetail] id:', studentId);
  const available = await getAvailableSheets();
  const has = name => Array.isArray(available) && available.includes(name);

  const siswaP = getSheetData('SISWA','A:Q')
    .catch(e=>{console.error('SISWA fetch failed',e); return []});
  const monitoringP = has('MONITORING') ? getSheetData('MONITORING','A:F')
    .catch(e=>{console.error('MONITORING fetch failed',e); return []}) : Promise.resolve([]);
  const karakterP = has('KARAKTER') ? getSheetData('KARAKTER','A:G')
    .catch(e=>{console.error('KARAKTER fetch failed',e); return []}) : Promise.resolve([]);
  const evaluasiP = has('EVALUASI') ? getSheetData('EVALUASI','A:E')
    .catch(e=>{console.error('EVALUASI fetch failed',e); return []}) : Promise.resolve([]);
  const komunikasiP = has('KOMUNIKASI') ? getSheetData('KOMUNIKASI','A:C')
    .catch(e=>{console.error('KOMUNIKASI fetch failed',e); return []}) : Promise.resolve([]);
  const targetP = has('TARGET') ? getSheetData('TARGET','A:D')
    .catch(e=>{console.error('TARGET fetch failed',e); return []}) : Promise.resolve([]);
  const kesimpulanP = has('KESIMPULAN') ? getSheetData('KESIMPULAN','A:B')
    .catch(e=>{console.error('KESIMPULAN fetch failed',e); return []}) : Promise.resolve([]);

  const [siswa, monitoring, karakter, evaluasi, komunikasi, target, kesimpulan] = 
    await Promise.all([siswaP, monitoringP, karakterP, evaluasiP, komunikasiP, targetP, kesimpulanP]);

  const sample = siswa[0] || {};
  const idKey = findKey(sample, ['id_siswa','id','ID_SISWA','nis','nisn']);
  const student = siswa.find(s => String(s[idKey]||'') === String(studentId)) || {};

  console.log('[getStudentDetail] Selected ID:', studentId);
  console.log('[getStudentDetail] Student row (raw):', student);

  function getField(obj, candidates){
    for(const c of candidates){
      if(c in obj && obj[c] !== undefined && obj[c] !== '') return obj[c];
      const found = Object.keys(obj||{}).find(k=>
        k.toLowerCase().replace(/[^a-z0-9]/g,'') === String(c||'').toLowerCase().replace(/[^a-z0-9]/g,'')
      );
      if(found) return obj[found];
    }
    return '';
  }

  const profile = {
    id: getField(student, ['ID_SISWA','id_siswa','id','ID']),
    nama: getField(student, ['NAMA_LENGKAP','nama_lengkap','NAMA','nama','name']),
    nama_panggilan: getField(student, ['NAMA_PANGGILAN','nama_panggilan','nama panggilan','nickname']),
    program: getField(student, ['PROGRAM','program']),
    level: getField(student, ['LEVEL','level']),
    usia: getField(student, ['USIA','usia','age']),
    sekolah: getField(student, ['SEKOLAH','sekolah','school']),
    kelas: getField(student, ['KELAS','kelas','class']),
    tanggal_masuk: getField(student, ['TANGGAL_MASUK','tanggal_masuk','tanggal masuk']),
    program_belajar: getField(student, ['PROGRAM_BELAJAR','program_belajar','program belajar','program']),
    tutor: getField(student, ['TUTOR','tutor']),
    hari_belajar: getField(student, ['HARI_BELAJAR','hari_belajar','hari belajar']),
    jam: getField(student, ['JAM','jam','waktu']),
    karakter_anak: getField(student, ['KARAKTER_ANAK','karakter_anak','karakter anak']),
    catatan_awal_tutor: getField(student, ['CATATAN_AWAL_TUTOR','catatan_awal_tutor','catatan awal tutor']),
    target_semester: getField(student, ['TARGET_SEMESTER','target_semester','target semester']),
    fotoUrl: getField(student, ['FOTO_URL','foto_url','FOTO','foto','photo'])
  };
  console.log('[getStudentDetail] Profile:', profile);

  function filterById(list){
    if(!list || !list.length) return [];
    const idKey = findKey(list[0], ['ID_SISWA','id_siswa','id','ID']);
    if(!idKey) return [];
    return list.filter(r => String(r[idKey]||'') === String(studentId));
  }

  const monitoringRows = filterById(monitoring).map(r => ({
    id: getField(r, ['ID_SISWA','id_siswa','id','ID']),
    program: getField(r, ['PROGRAM','program']),
    materi: getField(r, ['MATERI','materi','subject']),
    perkembangan: getField(r, ['PERKEMBANGAN','perkembangan','development']),
    observasi_tutor: getField(r, ['OBSERVASI_TUTOR','observasi_tutor','observasi tutor','observasi']),
    tugas_rumah: getField(r, ['TUGAS_RUMAH','tugas_rumah','tugas rumah','tugas','homework','pr'])
  }));
  console.log('[getStudentDetail] Monitoring:', monitoringRows);

  const karakterRow = filterById(karakter)[0] || {};
  const karakterObj = {
    disiplin: getField(karakterRow, ['DISIPLIN','disiplin']),
    percaya_diri: getField(karakterRow, ['PERCAYA_DIRI','percaya_diri','percaya diri']),
    fokus_belajar: getField(karakterRow, ['FOKUS_BELAJAR','fokus_belajar','fokus belajar','fokus']),
    adab: getField(karakterRow, ['ADAB','adab']),
    interaksi_sosial: getField(karakterRow, ['INTERAKSI_SOSIAL','interaksi_sosial','interaksi sosial','sosial']),
    catatan_tutor: getField(karakterRow, ['CATATAN_TUTOR','catatan_tutor','catatan tutor','catatan'])
  };
  console.log('[getStudentDetail] Karakter:', karakterObj);

  const evaluasiRow = filterById(evaluasi)[0] || {};
  const evaluasiObj = {
    membaca: getField(evaluasiRow, ['MEMBACA','membaca']),
    menulis: getField(evaluasiRow, ['MENULIS','menulis']),
    berbicara: getField(evaluasiRow, ['BERBICARA','berbicara']),
    pemecahan_masalah: getField(evaluasiRow, ['PEMECAHAN_MASALAH','pemecahan_masalah'])
  };
  console.log('[getStudentDetail] Evaluasi:', evaluasiObj);

  const komunikasiRows = filterById(komunikasi).map(r => ({
    tanggal: getField(r, ['TANGGAL','tanggal','date']),
    pesan_tutor: getField(r, ['PESAN_TUTOR','pesan_tutor','pesan tutor','pesan'])
  }));
  console.log('[getStudentDetail] Komunikasi:', komunikasiRows);

  const targetRows = filterById(target).map(r => ({
    bulan: getField(r, ['BULAN','bulan','Periode','periode']),
    target: getField(r, ['TARGET','target']),
    status: String(getField(r, ['STATUS','status'])||'').trim().toUpperCase()
  }));
  console.log('[getStudentDetail] Target:', targetRows);

  const kesimpulanRow = filterById(kesimpulan)[0] || {};
  const kesimpulanObj = {
    kesimpulan_semester: getField(kesimpulanRow, ['KESIMPULAN_SEMESTER','kesimpulan_semester','kesimpulan semester','kesimpulan'])
  };
  console.log('[getStudentDetail] Kesimpulan:', kesimpulanObj);

  return {
    profile,
    monitoring: monitoringRows,
    karakter: karakterObj,
    evaluasi: evaluasiObj,
    komunikasi: komunikasiRows,
    targets: targetRows,
    kesimpulan: kesimpulanObj
  };
}

// Expose functions
window.getSheetData = getSheetData;
window.searchStudent = searchStudent;
window.getStudentDetail = getStudentDetail;