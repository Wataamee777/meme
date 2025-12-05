// script.js
const LIST_PATH = './data/list.json';

const grid = document.getElementById('grid');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalMeta = document.getElementById('modalMeta');
const closeModal = document.getElementById('closeModal');
const searchInput = document.getElementById('search');
const filterSelect = document.getElementById('filter');
const sortBtn = document.getElementById('sortBtn');

let items = [];
let sortNewest = true;

async function fetchList(){
  try{
    const res = await fetch(LIST_PATH + '?t=' + Date.now());
    items = await res.json();
    // add parsed date if filename has date-like prefix (optional)
    items = items.map((it, idx) => ({...it, _idx: idx}));
    render();
  }catch(err){
    console.error('list load error', err);
    grid.innerHTML = `<div class="muted">データ読み込み失敗。data/list.json があるか確認してね。</div>`;
  }
}

function typeOf(ext){
  if(/jpg|jpeg|png|gif|webp/.test(ext)) return 'image';
  if(/mp4|mov|webm|mkv/.test(ext)) return 'video';
  if(/mp3|wav|ogg|flac|m4a/.test(ext)) return 'audio';
  return 'other';
}

function render(){
  const q = (searchInput?.value || '').toLowerCase().trim();
  const filter = filterSelect?.value || 'all';

  let list = items.slice();

  if(filter !== 'all'){
    list = list.filter(it => typeOf(it.type) === filter);
  }

  if(q){
    list = list.filter(it => (it.title || '').toLowerCase().includes(q));
  }

  // sort: newest by index (as fallback)
  list.sort((a,b) => sortNewest ? b._idx - a._idx : a._idx - b._idx);

  grid.innerHTML = '';
  if(list.length === 0){
    grid.innerHTML = `<div class="muted" style="padding:20px;text-align:center">該当するメディアがありません</div>`;
    return;
  }

  for(const it of list){
    const card = document.createElement('div');
    card.className = 'card';

    const thumb = document.createElement('img');
    thumb.src = it.thumb;
    thumb.className = 'thumb';
    thumb.loading = 'lazy';
    thumb.alt = it.title || it.file;

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = it.title || it.file;

    const actions = document.createElement('div');
    actions.className = 'actions';

    const dl = document.createElement('a');
    dl.className = 'dl-btn';
    dl.href = it.url;
    dl.download = it.file;
    dl.textContent = 'Download';

    const badge = document.createElement('span');
    badge.className = 'type-badge';
    badge.textContent = typeOf(it.type);

    actions.appendChild(dl);

    card.appendChild(thumb);
    card.appendChild(title);
    card.appendChild(actions);
    card.appendChild(badge);

    card.addEventListener('click', (e) => {
      // if clicking download link, don't open modal
      if(e.target === dl) return;
      openModal(it);
    });

    grid.appendChild(card);
  }
}

function openModal(it){
  modalBody.innerHTML = '';
  modalMeta.innerHTML = '';

  const t = typeOf(it.type);
  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'modal-media';

  if(t === 'image'){
    const img = document.createElement('img');
    img.src = it.url;
    img.alt = it.title;
    mediaWrap.appendChild(img);
  } else if(t === 'video'){
    const video = document.createElement('video');
    video.src = it.url;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    mediaWrap.appendChild(video);
  } else if(t === 'audio'){
    const audio = document.createElement('audio');
    audio.src = it.url;
    audio.controls = true;
    audio.autoplay = true;
    mediaWrap.appendChild(audio);

    // if thumb exists, show it above audio
    const img = document.createElement('img');
    img.src = it.thumb;
    img.style.maxWidth = '320px';
    img.style.borderRadius = '8px';
    img.style.marginBottom = '12px';
    mediaWrap.appendChild(img);
  } else {
    mediaWrap.textContent = 'Unsupported media type';
  }

  modalBody.appendChild(mediaWrap);

  // meta: title, download link
  const titleEl = document.createElement('div');
  titleEl.textContent = it.title || it.file;
  titleEl.style.fontWeight = '700';
  const dlEl = document.createElement('a');
  dlEl.href = it.url;
  dlEl.download = it.file;
  dlEl.textContent = 'ダウンロード';
  dlEl.className = 'dl-btn';

  modalMeta.appendChild(titleEl);
  modalMeta.appendChild(dlEl);

  modal.classList.remove('hidden');
}

closeModal.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (e) => {
  if(e.target === modal) modal.classList.add('hidden');
});

searchInput?.addEventListener('input', () => render());
filterSelect?.addEventListener('change', () => render());
sortBtn?.addEventListener('click', () => {
  sortNewest = !sortNewest;
  sortBtn.textContent = sortNewest ? '新着順' : '古い順';
  render();
});

fetchList();
