// Filename: projects.modal.js
// This is the UPDATED version of your frontend script.
// Note the change in the `openProjects` function.

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
  const projectCache = {}; // Cache to store fetched project data

  // This map connects your project card keys to Google Drive Folder IDs
  // Replace these with your actual Folder IDs from Part 1
  const FOLDER_ID_MAP = {
    'video-editing': '1w-Wmo4a5DCPigBNBWmhoBQ1ErB0k4eBz',
    'graphic-design': '1bbLJtDv6jUpr_zYZG6JoOniDPYJIz0H6',
    'facebook-ads': '1wjqWh4Dh1rD4mtH2ezxQghY8q4Tfizv1',
    'ugc': '1QPpWxe-FROPGMdUwMdpcBCxVwiGfLegv',
    'web-development': '1UVKbv_6SSz9y1sMvlrBEamdFpCxJaiSG',
    'game-development': '18KRD7DBYe_v7h-e4YAYt5dars5Fn_FSW',
  };

  // Support deep-linking on initial load (no changes needed here)
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
    const { categories = [] } = getData();
    pmChips.innerHTML = '';
    categories.forEach(cat => {
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

    list.forEach(it => {
      const col = document.createElement('div');
      col.className = 'col';
      col.innerHTML = `
        <a href="${it.drive}" target="_blank" rel="noopener" class="card-link">
          <article class="card bg-transparent border-0 h-100">
            <div class="ratio ratio-16x9 rounded overflow-hidden">
              <img loading="lazy" src="${it.thumb}" alt="${it.title}" class="w-100 h-100 object-fit-cover"
                   onerror="this.onerror=null;this.src='assets/thumbs/fallback.webp';">
            </div>
            <div class="card-body px-3" ">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="m-0 text-white pm-title">${it.title || ''}</h6>
                <span class="badge">${it.cat || ''}</span>
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

  // ---------- OPEN & LOAD (THIS IS THE MODIFIED PART) ----------
  async function openProjects(key, catOpt) {
    state.key = key;
    state.cat = catOpt || 'All';
    state.q = '';
    pmSearch.value = '';

    pmTitle.textContent = 'Loading...';
    pmGrid.innerHTML = '';
    pmChips.innerHTML = '';
    bsModal.show();

    // Check cache first. If data isn't there, fetch it from our new API endpoint.
    if (!projectCache[key]) {
      try {
        const folderId = FOLDER_ID_MAP[key];
        if (!folderId) throw new Error(`No folder ID mapped for project key: ${key}`);
        
        // *** CHANGE IS HERE ***
        // Instead of fetching a local JSON file, we fetch from our serverless function.
        const response = await fetch(`/api/getProjects?folderId=${folderId}`);
        // *** END OF CHANGE ***

        if (!response.ok) {
          throw new Error(`Could not load data for ${key}.`);
        }
        projectCache[key] = await response.json();
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

  // ---------- EVENTS (NO CHANGES) ----------
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
