(function(){
  const container = document.querySelector('#results');
  const searchInput = document.querySelector('#result-search');
  const backButton = document.querySelector('#result-search-button');
  if(!container) return;

  const raw = sessionStorage.getItem('searchResults');
  const kw = sessionStorage.getItem('searchKeyword') || '';
  if(searchInput) searchInput.value = kw;

  function render(results){
    if(!results || !results.length){ container.innerHTML = '<div class="result-empty">Tidak ada data siswa dengan kata kunci ini.</div>'; return; }
    container.innerHTML = results.map(s=>`<article class="result-card"><div class="result-info"><strong>${s.nama||s.name||''}</strong><span class="result-id">ID : ${s.id||''}</span></div><button class="button secondary" data-id="${s.id}">Lihat</button></article>`).join('');
    container.querySelectorAll('button[data-id]').forEach(b=>b.addEventListener('click', ()=>{ sessionStorage.setItem('selectedStudentId', b.dataset.id); window.location.href='detail.html'; }));
  }

  if(raw){ try{ const parsed=JSON.parse(raw); render(parsed); }catch(e){ console.error('[result] parse error', e); container.innerHTML = '<div class="result-empty">Data hasil pencarian rusak. Periksa Console (F12) untuk detail.</div>'; } }
  else if(kw){ container.innerHTML = '<div class="result-empty">Memuat data...</div>'; window.searchStudent(kw).then(res=>render(res)).catch(err=>{ console.error('[result] search error', err); container.innerHTML = '<div class="result-empty">Terjadi kesalahan saat memuat hasil. Periksa Console (F12) untuk detail.</div>'; }); }
  else{ container.innerHTML = '<div class="result-empty">Tidak ada hasil. Kembali ke halaman pencarian untuk memulai.</div>'; }

  // enable user to type a new keyword and perform a fresh search
  function performSearch(term){
    const k = String(term||'').trim();
    if(!k){ if(searchInput) searchInput.focus(); return; }
    container.innerHTML = '<div class="result-empty">Memuat data...</div>';
    // always fetch fresh data (do not rely on cached results)
    window.searchStudent(k).then(res=>{
      try{ sessionStorage.setItem('searchResults', JSON.stringify(res)); sessionStorage.setItem('searchKeyword', k); }catch(e){}
      render(res);
    }).catch(err=>{ console.error('[result] search error', err); container.innerHTML = '<div class="result-empty">Terjadi kesalahan saat memuat hasil. Periksa Console (F12) untuk detail.</div>'; });
  }

  if(searchInput){
    // allow typing
    searchInput.removeAttribute('readonly');
    searchInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') performSearch(searchInput.value); });
  }

  if(backButton) backButton.addEventListener('click', ()=>{ performSearch(searchInput ? searchInput.value : kw); });
})();
