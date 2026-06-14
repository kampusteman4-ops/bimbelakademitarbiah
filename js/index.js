(function(){
  const input = document.querySelector('#search-input');
  const button = document.querySelector('#search-button');
  if (!input || !button) return;

  function focusSearchInput(){
    input.focus({ preventScroll: true });
  }

  requestAnimationFrame(focusSearchInput);
  setTimeout(focusSearchInput, 0);
  window.addEventListener('pageshow', focusSearchInput);

  // expose executeSearch globally for HTML onclick handlers
  window.executeSearch = async function(){
    const kw = input.value.trim();
    if(!kw){ input.focus(); return; }
    button.disabled = true; button.textContent = 'Memuat...';
    try{
      console.log('[index] searching', kw);
      const results = await window.searchStudent(kw);
      console.log('[index] search results count', results.length, results);
      sessionStorage.setItem('searchResults', JSON.stringify(results));
      sessionStorage.setItem('searchKeyword', kw);
      window.location.href = 'result.html';
    }catch(err){
      console.error('[index] search error', err);
      const panel = document.querySelector('.search-panel');
      if(panel) panel.innerHTML = '<div class="result-empty">Terjadi kesalahan saat mencari. Periksa Console (F12) untuk detail.</div>';
    }finally{
      button.disabled = false; button.textContent = 'Cari Data';
    }
  };

  button.addEventListener('click', () => window.executeSearch());

  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') button.click(); });
})();
