(function(){
  const detailTitle = document.querySelector('#detail-title');
  const detailSubtitle = document.querySelector('#detail-subtitle');
  const detailBackLink = document.querySelector('.back-link');
  const tabs = Array.from(document.querySelectorAll('.tab-button'));
  const panels = Array.from(document.querySelectorAll('.tab-panel'));

  function clearDetailNavigationState(){
    ['selectedStudentId', 'searchResults', 'studentDetail', 'searchKeyword'].forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  function goBack(event){
    if(event) event.preventDefault();
    clearDetailNavigationState();
    window.location.href = 'index.html';
  }

  if(detailBackLink) detailBackLink.addEventListener('click', goBack);
  window.goBack = goBack;

  function activateTab(name){ tabs.forEach(b=>b.classList.toggle('active', b.dataset.tab===name)); panels.forEach(p=>p.classList.toggle('active', p.id===name)); }
  tabs.forEach(b=>b.addEventListener('click', ()=>activateTab(b.dataset.tab)));

  function renderStars(score){
    const value = Number(score);
    const filled = Math.max(0, Math.min(5, Math.floor(value)));
    const empty = 5 - filled;
    return '★'.repeat(filled) + '☆'.repeat(empty);
  }

  function escapeHtml(value){
    return String(value || '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function renderText(value){
    return escapeHtml(value).replace(/\r?\n/g, '<br>');
  }

  function parseIndonesianDate(value){
    const text = String(value || '').trim();
    if(!text) return 0;

    const nativeTime = new Date(text).getTime();
    if(!isNaN(nativeTime)) return nativeTime;

    const months = {
      januari: 0,
      februari: 1,
      maret: 2,
      april: 3,
      mei: 4,
      juni: 5,
      juli: 6,
      agustus: 7,
      september: 8,
      oktober: 9,
      november: 10,
      desember: 11
    };
    const match = text.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
    if(!match || !(match[2] in months)) return 0;
    return new Date(Number(match[3]), months[match[2]], Number(match[1])).getTime();
  }

  function normalizePhotoUrl(url){
    const value = String(url||'').trim();
    const driveFileMatch = value.match(/https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)(?:\/view)?/);
    if(driveFileMatch){
      return `https://drive.google.com/thumbnail?id=${driveFileMatch[1]}&sz=w500`;
    }
    const openIdMatch = value.match(/https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if(openIdMatch){
      return `https://drive.google.com/thumbnail?id=${openIdMatch[1]}&sz=w500`;
    }
    return value;
  }

  async function load(){
    const id = sessionStorage.getItem('selectedStudentId');
    if(!id){ document.body.innerHTML = '<div class="page"><p>Tidak ada siswa terpilih. Kembali ke <a href="result.html">halaman hasil</a>.</p></div>'; return; }
    if(detailTitle) detailTitle.textContent = 'Memuat...';
    try{
      const data = await window.getStudentDetail(id);
      console.log('[detail] data', data);
      const profil = data.profile || {};
      const monitoring = data.monitoring || [];
      const karakter = data.karakter || {};
      const evaluasi = data.evaluasi || [];
      const komunikasi = data.komunikasi || [];
      const targets = data.targets || [];
      const kesimpulan = data.kesimpulan || {};

      console.log('Selected ID:', id);
      console.log('Profile:', profil);
      console.log('Photo URL:', profil.fotoUrl);
      console.log('Monitoring:', monitoring);
      console.log('Karakter:', karakter);
      console.log('Evaluasi:', evaluasi);
      console.log('Komunikasi:', komunikasi);
      console.log('Targets:', targets);
      console.log('Kesimpulan:', kesimpulan);

      const name = profil.nama || profil.name || '';
      const nickname = profil.nama_panggilan || profil.nickname || '';
      if(detailTitle) detailTitle.textContent = `Profil ${nickname||name}`;
      if(detailSubtitle) detailSubtitle.textContent = name;

      // ==================== PANEL PROFIL ====================
      const profilPanel = document.querySelector('#profil');
      const photoSrc = normalizePhotoUrl(profil.fotoUrl||profil.foto_url||profil.foto||profil.photo||'');
      profilPanel.innerHTML = `<article class="profile-card">
        <div class="profile-photo-wrapper">
          <img class="profile-image" src="${photoSrc||'assets/default-avatar.png'}" onerror="this.onerror=null;this.src='assets/default-avatar.png'" alt="Foto ${escapeHtml(name)}">
        </div>
        <div class="profile-details">
          <h3 class="profile-name">${escapeHtml(name)}</h3>
          <div class="profile-info-grid">
            <div class="profile-info-item">
              <span class="profile-label">Nama Panggilan</span>
              <span class="profile-value">${escapeHtml(nickname)||'-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Program</span>
              <span class="profile-value">${escapeHtml(profil.program||profil.program_belajar||'')||'-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Level</span>
              <span class="profile-value">${escapeHtml(profil.level||'')||'-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Usia</span>
              <span class="profile-value">${escapeHtml(profil.usia||'')||'-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Sekolah</span>
              <span class="profile-value">${escapeHtml(profil.sekolah||'')||'-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Kelas</span>
              <span class="profile-value">${escapeHtml(profil.kelas||'')||'-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Tanggal Masuk</span>
              <span class="profile-value">${escapeHtml(profil.tanggal_masuk||'')||'-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Tutor</span>
              <span class="profile-value">${escapeHtml(profil.tutor||'')||'-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Hari Belajar</span>
              <span class="profile-value">${escapeHtml(profil.hari_belajar||'')||'-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Jam</span>
              <span class="profile-value">${escapeHtml(profil.jam||'')||'-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Karakter Anak</span>
              <span class="profile-value">${escapeHtml(profil.karakter_anak||'')||'-'}</span>
            </div>
            <div class="profile-info-item profile-full-width">
              <span class="profile-label">Catatan Awal Tutor</span>
              <span class="profile-value">${renderText(profil.catatan_awal_tutor||'')||'-'}</span>
            </div>
            <div class="profile-info-item profile-full-width">
              <span class="profile-label">Target Semester</span>
              <span class="profile-value">${renderText(profil.target_semester||'')||'-'}</span>
            </div>
          </div>
        </div>
      </article>`;

      // ==================== PANEL MONITORING ====================
      const monPanel = document.querySelector('#monitoring');
      monPanel.innerHTML = `<div class="section-card">
        <h2>Monitoring Pembelajaran</h2>
        <div class="detail-grid">
          ${monitoring.length ? monitoring.map(it => `
            <div class="list-item">
              <strong>📖 Program: ${escapeHtml(it.program||'')}</strong>
              <div><strong>Materi:</strong> ${renderText(it.materi||'')}</div>
              <div><strong>Perkembangan:</strong> ${renderStars(it.perkembangan||0)}</div>
              <div><strong>Observasi Tutor:</strong> ${renderText(it.observasi_tutor||'')}</div>
              <div><strong>Tugas Rumah:</strong> ${renderText(it.tugas_rumah||'')}</div>
            </div>
          `).join('') : '<div class="list-item">Tidak ada data monitoring.</div>'}
        </div>
      </div>`;

      // ==================== PANEL KARAKTER ====================
      const karPanel = document.querySelector('#karakter');
      const karakterList = [
        { label: 'Disiplin', value: karakter.disiplin },
        { label: 'Percaya Diri', value: karakter.percaya_diri },
        { label: 'Fokus Belajar', value: karakter.fokus_belajar },
        { label: 'Adab', value: karakter.adab },
        { label: 'Interaksi Sosial', value: karakter.interaksi_sosial }
      ];
      karPanel.innerHTML = `<div class="section-card">
        <h2>Penilaian Karakter</h2>
        <div class="list-card">
          ${karakterList.map(i => `
            <div class="list-item">
              <strong>${i.label}</strong>
              <span>${escapeHtml(i.value||'-')}</span>
            </div>
          `).join('')}
          <div class="list-item">
            <strong>Catatan Tutor</strong>
            <p>${renderText(karakter.catatan_tutor||'')}</p>
          </div>
        </div>
      </div>`;

      // ==================== PANEL EVALUASI ====================
      const evaPanel = document.querySelector('#evaluasi');
      evaPanel.innerHTML = `<div class="section-card">
        <h2>Evaluasi Pembelajaran</h2>
        <div class="list-card">
          ${evaluasi.length ? evaluasi.map(it => `
            <div class="list-item">
              <strong>📚 ${escapeHtml(it.program||'')} - ${escapeHtml(it.pelajaran||'')}</strong>
              <span>Nilai: ${escapeHtml(it.nilai||'')}</span>
            </div>
          `).join('') : '<div class="list-item">Tidak ada data evaluasi.</div>'}
        </div>
      </div>`;

      // ==================== PANEL KOMUNIKASI (BUKU) ====================
      const bukuPanel = document.querySelector('#buku');
      const sortedKomunikasi = [...komunikasi].sort((a,b)=>{
        const timeA = parseIndonesianDate(a.tanggal);
        const timeB = parseIndonesianDate(b.tanggal);
        if (timeA || timeB) return timeB - timeA;
        if (a.tanggal && b.tanggal) return String(b.tanggal).localeCompare(String(a.tanggal), undefined, { numeric: true, sensitivity: 'base' });
        return 0;
      });
      bukuPanel.innerHTML = `<div class="section-card">
        <h2>📩 Pesan Tutor</h2>
        <div class="list-card">
          ${sortedKomunikasi.length ? sortedKomunikasi.map(it => `
            <div class="list-item">
              <strong>${renderText(it.tanggal)}</strong>
              <p>${renderText(it.pesan_tutor)}</p>
            </div>
          `).join('') : '<div class="list-item">Tidak ada pesan tutor.</div>'}
        </div>
      </div>`;

      // ==================== PANEL TARGET ====================
      const tarPanel = document.querySelector('#target');
      const monthOrder = [...new Set(targets.map(it => it.bulan || 'Tidak ditentukan'))];
      const groupedTargets = monthOrder.map(month => ({
        month,
        items: targets.filter(it => (it.bulan||'Tidak ditentukan') === month)
      }));
      tarPanel.innerHTML = `<div class="section-card">
        <h2>Target</h2>
        ${groupedTargets.length ? groupedTargets.map(group => `
          <div class="list-card">
            <div class="list-item"><strong>🎯 Target Bulan ${renderText(group.month)}</strong></div>
            ${group.items.map(item => `
              <div class="list-item">${String(item.status||'').trim().toUpperCase()==='SELESAI' ? '☑' : '☐'} ${renderText(item.target)}</div>
            `).join('')}
          </div>
        `).join('') : '<div class="list-item">Tidak ada target.</div>'}
      </div>`;

      // ==================== PANEL KESIMPULAN ====================
      const kesPanel = document.querySelector('#kesimpulan');
      kesPanel.innerHTML = `<div class="section-card">
        <h2>Kesimpulan Semester</h2>
        <p>${renderText(kesimpulan.kesimpulan_semester||'')}</p>
      </div>`;

    }catch(err){ console.error('[detail] error', err); document.body.innerHTML = '<div class="page"><p>Terjadi kesalahan saat memuat detail. Periksa Console (F12) untuk detail atau kembali ke <a href="result.html">halaman hasil</a>.</p></div>'; }
  }

  // expose loadDetail globally
  window.loadDetail = load;
  load();
})();