// Filename: projects.modal.js

(function () {
  const modalEl = document.getElementById('projectsModal');
  if (!modalEl) return;

  const pmTitle = document.getElementById('pmTitle');
  const pmChips = document.getElementById('pmChips');
  const pmGrid = document.getElementById('pmGrid');
  const pmSearch = document.getElementById('pmSearch');
  const pmEmpty = document.getElementById('pmEmpty');
  const pmCount = document.getElementById('pmCount');
  const pmActions = document.getElementById('pmActions');
  const pmOpenFolder = document.getElementById('pmOpenFolder');

  const bsModal = new bootstrap.Modal(modalEl, { backdrop: true, focus: true });

  const state = { key: null, cat: 'All', q: '' };
  const projectCache = {}; 

  // Updated All Folder IDs to match the main app
  const SHORT_FORM_FOLDER_ID = '1VJwTL0gX1G9V3TLiYWeq8w7NPLgVgk-O';
  const LONG_FORM_FOLDER_ID = '16bIMGsWTvAzhZ8N5JXczJx6WAAky5Nu3';
  const GRAPHIC_DESIGN_FOLDER_ID = '1bbLJtDv6jUpr_zYZG6JoOniDPYJIz0H6'; 
  const UGC_FB_ADS_FOLDER_ID = '1y3QcWjAXFllKIXia50PcZk-q_BBvdhJX';
  const DEFAULT_VIDEO_FOLDER_ID = '1w-Wmo4a5DCPigBNBWmhoBQ1ErB0k4eBz'; // Fallback
  
  const FOLDER_ID_MAP = {
    'video-editing': SHORT_FORM_FOLDER_ID, // Opens short form edits
    'graphic-design': GRAPHIC_DESIGN_FOLDER_ID,
    'facebook-ads': UGC_FB_ADS_FOLDER_ID,
    'ugc': UGC_FB_ADS_FOLDER_ID,
    'web-development': DEFAULT_VIDEO_FOLDER_ID,
    'game-development': DEFAULT_VIDEO_FOLDER_ID,
  };

  function getProjectsApiCandidates() {
    const candidates = ['/api/getProjects'];
    if (!window.location.origin.includes('localhost:3000')) {
      candidates.push('http://localhost:3000/api/getProjects');
    }
    return Array.from(new Set(candidates));
  }

  async function fetchProjectsPayload(folderId) {
    const endpoints = getProjectsApiCandidates();
    let lastError = null;

    for (let i = 0; i < endpoints.length; i += 1) {
      const endpoint = endpoints[i];
      try {
        const response = await fetch(`${endpoint}?folderId=${encodeURIComponent(folderId)}`);
        const raw = await response.text();
        let payload = null;
        try {
          payload = raw ? JSON.parse(raw) : {};
        } catch (e) {
          payload = null;
        }

        if (!response.ok) {
          const msg = payload && payload.error ? payload.error : `HTTP ${response.status}`;
          throw new Error(msg);
        }

        return payload || {};
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Projects API unavailable');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const m = location.hash.match(/^#projects\/([^?]+)(?:\?cat=([^&]+))?/);
    if (m) {
      openProjectsModal(decodeURIComponent(m[1]), m[2] ? decodeURIComponent(m[2]) : 'All');
    }
  });

  function getData() {
    return projectCache[state.key] || { title: 'Loading...', categories: [], items: [] };
  }

  function setTitleAndFolder() {
    const data = getData();
    pmTitle.textContent = data.title || 'Projects';
    if (data.driveFolder) {
      pmActions.classList.remove('d-none');
      pmOpenFolder.href = data.driveFolder;
    } else {
      pmActions.classList.add('d-none');
      pmOpenFolder.removeAttribute('href');
    }
  }

  function buildChips() {
    const data = getData();
    const items = data.items || [];
    
    // Automatically extract categories from the data, just like the main page!
    let cats = data.categories || [];
    if (!cats.length) {
      const uniqueCats = [...new Set(items.map(it => it.cat).filter(Boolean))];
      if (uniqueCats.length > 0) {
        cats = ['All', ...uniqueCats];
      }
    }

    pmChips.innerHTML = '';
    cats.forEach(cat => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip btn btn-sm' + (cat === state.cat ? ' active' : '');
      b.textContent = cat;
      b.dataset.cat = cat;
      pmChips.appendChild(b);
    });
  }

  function filteredItems() {
    const { items = [] } = getData();
    const q = state.q.trim().toLowerCase();
    return items.filter(it => {
      // Filtering strictly based on folder property
      const inCat = (state.cat === 'All') || (it.cat === state.cat);
      const inQ = !q || (it.title && it.title.toLowerCase().includes(q));
      return inCat && inQ;
    });
  }

  function renderGrid() {
    const list = filteredItems();
    pmGrid.innerHTML = '';
    if (!list.length) {
      pmEmpty.classList.remove('d-none');
      pmCount.textContent = '0 items';
      return;
    }
    pmEmpty.classList.add('d-none');
    pmCount.textContent = `${list.length} item${list.length > 1 ? 's' : ''}`;

    // Use Padding-Bottom Trick for perfect heights
    let padRatio = '56.25%'; // 16:9 Default
    if (['shortform', 'ugcfbads', 'video-editing', 'facebook-ads', 'ugc'].includes(state.key)) {
      padRatio = '177.77%'; // Shorts, UGC, FB (9:16)
    } else if (['longform'].includes(state.key)) {
      padRatio = '56.25%'; // Long form (16:9)
    } else if (['graphicdesigns', 'graphic-design'].includes(state.key)) {
      padRatio = '125%'; // Graphic Design / IG Posts (4:5)
    }

    list.forEach(it => {
      const col = document.createElement('div');
      col.className = 'col';
      col.innerHTML = `
        <a href="${it.drive}" target="_blank" rel="noopener" class="card-link h-100">
          <article class="card bg-transparent border-0 h-100">
            <div class="pm-thumb-wrap" style="padding-bottom: ${padRatio};">
              <img loading="lazy" src="${it.thumb}" alt="${it.title}" class="w-100 h-100 object-fit-cover"
                   onerror="this.onerror=null;this.src='assets/thumbs/fallback.webp';">
            </div>
            <div class="card-body px-3">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="m-0 text-white pm-title">${it.title || ''}</h6>
                <span class="badge pm-badge">${it.cat || ''}</span>
              </div>
            </div>
          </article>
        </a>`;
      pmGrid.appendChild(col);
    });
  }

  function updateHash() {
    const base = `#projects/${encodeURIComponent(state.key || '')}`;
    const q = (state.cat && state.cat !== 'All') ? `?cat=${encodeURIComponent(state.cat)}` : '';
    history.replaceState(null, '', base + q);
  }

  // ---------- OPEN & LOAD ----------
  async function openProjects(key, catOpt) {
    state.key = key;
    state.cat = catOpt || 'All';
    state.q = '';
    pmSearch.value = '';

    pmTitle.textContent = 'Loading...';
    pmGrid.innerHTML = '';
    pmChips.innerHTML = '';
    bsModal.show();

    if (!projectCache[key]) {
      try {
        const folderId = FOLDER_ID_MAP[key];
        if (!folderId) throw new Error(`No folder ID mapped for project key: ${key}`);
        
        projectCache[key] = await fetchProjectsPayload(folderId);
      } catch (error) {
        console.error('Failed to fetch project data:', error);
        pmTitle.textContent = 'Error loading projects';
        pmEmpty.classList.remove('d-none');
        pmEmpty.textContent = 'Could not load project data. Please try again later.';
        return;
      }
    }

    setTitleAndFolder();
    buildChips();
    renderGrid();
    updateHash();
  }

  // ---------- EVENTS ----------
  pmChips.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state.cat = b.dataset.cat;
    pmChips.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === b));
    renderGrid();
    updateHash();
  });

  pmSearch.addEventListener('input', (e) => {
    state.q = e.target.value || '';
    renderGrid();
  });

  window.openProjectsModal = openProjects;
})();