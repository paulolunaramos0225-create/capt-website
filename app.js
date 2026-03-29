// Reads the CSS var and sets the wobble strength on the SVG filter.
(function () {
  var doc = document.documentElement;
  var scale = getComputedStyle(doc).getPropertyValue('--lg-distortion-scale').trim() || '70';
  var fe = document.querySelector('filter#glass-distortion feDisplacementMap');
  if (fe) fe.setAttribute('scale', scale);
})();

(function () {
  // “Lower than lg” in Bootstrap = below 992px
  var mq = window.matchMedia('(max-width: 991.98px)');

  function apply(e) {
    document.querySelectorAll('[data-lgdown-class]').forEach(function (el) {
      var classes = (el.dataset.lgdownClass || '').split(/\s+/).filter(Boolean);
      classes.forEach(function (c) { el.classList.toggle(c, e.matches); });
    });
  }

  if (mq.addEventListener) mq.addEventListener('change', apply);
  else mq.addListener(apply);
  apply(mq);
})();

// TEAM — prevent iOS double-tap zoom from hijacking arrow taps
(function () {
  var el = document.getElementById('teamCarousel');
  if (!el) return;
  el.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });
  var lastTouch = 0;
  el.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTouch <= 350) { e.preventDefault(); }
    lastTouch = now;
  }, { passive: false });
})();

// TEAM — Toggle between Co-Founders, Core Team, and Creative Collective with animations
(function () {
  // --- Data for the teams ---
  const coFounders = [
    { name: 'Paulo Ramos', role: 'COO & Co-Founder', imgSrc: 'assets/RAMOS.png' },
    { name: 'Christian Diaz', role: 'CEO & Co-Founder', imgSrc: 'assets/DIAZ.png' },
    { name: 'Mark De Leon', role: 'CMO & Co-Founder', imgSrc: 'assets/DELEON.png' },
  ];

  const coreTeam = [
    { name: 'Rainiel Paz', role: 'Core Team', imgSrc: 'assets/PAZ.png' },
    { name: 'Renzel Kian Sta. Ana', role: 'Core Team', imgSrc: 'assets/Renzel.png.png' },
    { name: 'Namiel Paz', role: 'Core Team', imgSrc: 'assets/PAZM.png' },
    { name: 'Marc Cahayon', role: 'Core Team', imgSrc: 'assets/marc.png' },
    { name: 'Tristan Kent Moreno', role: 'Core Team', imgSrc: 'assets/Tan.png.png' },
  ];

  const creativeCollective = [
    { name: 'Mark Nikko Lonzaga', role: 'Creative Collective', imgSrc: 'assets/MNikko.png.png' },
    { name: 'Charles Adrian Vitto', role: 'Creative Collective', imgSrc: 'assets/Charles.png.png' },
    { name: 'Jeremy Roger Maguigad', role: 'Creative Collective', imgSrc: 'assets/Jeremy.png.png' },
    { name: 'Max Nazzle Von Fabella', role: 'Creative Collective', imgSrc: 'assets/Nazzle.png.png' },
    { name: 'Aaron Luis Boaquiña', role: 'Creative Collective', imgSrc: 'assets/Aaron.png.png' },
  ];
  // --- End of Data ---

  const toggleContainer = document.getElementById('teamToggle');
  if (!toggleContainer) {
    console.error('Team toggle container not found!');
    return;
  }
  
  const desktopMembers = document.querySelectorAll('.team-rail .member');
  const mobileMembers = document.querySelectorAll('#teamCarousel .carousel-inner > div');
  const allTeamMembers = [...desktopMembers, ...mobileMembers];
  const teamCarouselEl = document.getElementById('teamCarousel');
  const teamCarousel = teamCarouselEl && window.bootstrap ? bootstrap.Carousel.getOrCreateInstance(teamCarouselEl) : null;

  function syncTeamSize(count) {
    desktopMembers.forEach((member, index) => {
      member.classList.toggle('is-hidden', index >= count);
    });

    mobileMembers.forEach((member, index) => {
      const isVisible = index < count;
      member.classList.toggle('is-hidden', !isVisible);
      member.classList.toggle('carousel-item', isVisible);
      member.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
      if (!isVisible) member.classList.remove('active');
    });

    const activeItem = teamCarouselEl ? teamCarouselEl.querySelector('.carousel-item.active') : null;
    if (!activeItem) {
      const firstVisible = Array.from(mobileMembers).find((item) => item.classList.contains('carousel-item'));
      if (firstVisible) firstVisible.classList.add('active');
    }
    if (teamCarousel) teamCarousel.to(0);
  }

  function updateTeamView(teamData) {
    // Update desktop view
    desktopMembers.forEach((member, index) => {
      const data = teamData[index] || { name: 'Member', role: '', imgSrc: 'assets/phd.jpg' };
      const img = member.querySelector('.member-photo');
      const nameMeta = member.querySelector('.member-meta .name');
      const roleMeta = member.querySelector('.member-meta .role');
      const nameSpotlight = member.querySelector('.spot-name');
      const roleSpotlight = member.querySelector('.spot-role');
      const figure = member.querySelector('.member-card');
      if (img) img.src = data.imgSrc;
      if (nameMeta) nameMeta.textContent = data.name;
      if (roleMeta) roleMeta.textContent = data.role || '';
      if (nameSpotlight) nameSpotlight.textContent = data.name;
      if (roleSpotlight) roleSpotlight.textContent = data.role || '';
      if (figure) figure.setAttribute('aria-label', data.name);
    });

    // Update mobile view
    mobileMembers.forEach((member, index) => {
      const data = teamData[index] || { name: 'Member', role: '', imgSrc: 'assets/phd.jpg' };
      const img = member.querySelector('.media-34-img');
      const nameMeta = member.querySelector('.media-34-meta .name');
      const roleMeta = member.querySelector('.media-34-meta .role');
      if (img) img.src = data.imgSrc;
      if (nameMeta) nameMeta.textContent = data.name;
      if (roleMeta) roleMeta.textContent = data.role || '';
    });
  }

  toggleContainer.addEventListener('click', function(e) {
    if (!e.target.matches('.btn-toggle') || e.target.classList.contains('active')) return;

    // 1. Update button state and trigger slider
    toggleContainer.querySelector('.active').classList.remove('active');
    e.target.classList.add('active');
    const teamToShow = e.target.dataset.team;
    toggleContainer.classList.remove('core-active', 'creative-active');
    if (teamToShow === 'coreteam') toggleContainer.classList.add('core-active');
    if (teamToShow === 'creative') toggleContainer.classList.add('creative-active');

    // Animate out current members
    allTeamMembers.forEach(member => {
      member.classList.add('animate-out');
      member.classList.remove('animate-in');
    });

    setTimeout(() => {
      const teamData =
        teamToShow === 'coreteam'
          ? coreTeam
          : teamToShow === 'creative'
            ? creativeCollective
            : coFounders;
      updateTeamView(teamData);
      syncTeamSize(teamData.length);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          allTeamMembers.forEach(member => {
            member.classList.remove('animate-out');
            member.classList.add('animate-in');
          });

          setTimeout(() => {
            allTeamMembers.forEach(member => member.classList.remove('animate-in'));
          }, 900);
        });
      });
    }, 400);
  });

  // Keep initial co-founder state at 3 cards.
  updateTeamView(coFounders);
  syncTeamSize(coFounders.length);
})();

// PROJECTS — Team-style category toggle + 3-row project wall (Google Drive API-backed)
(function () {
  const toggle = document.getElementById('projectsToggle');
  const wall = document.getElementById('projectsWall');
  const subTabsContainer = document.getElementById('projectsSubTabs'); 
  if (!toggle || !wall) return;

  // DYNAMIC STATE
  let currentActiveSubTab = 'All';
  let currentItems = []; // Stored items retrieved from API
  let currentTabs = [];  // Automatically populated based on folders!

  // Automatically build the HTML for sub-tabs based on the currentTabs array
  function buildSubTabs() {
    if (!subTabsContainer) return;
    
    // If there are no sub-folders (or only 1), hide the tabs completely
    if (currentTabs.length <= 1) {
      subTabsContainer.classList.add('d-none');
      return;
    }
    
    subTabsContainer.innerHTML = '';
    currentTabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = `btn-subtab ${tab === currentActiveSubTab ? 'active' : ''}`;
      btn.textContent = tab;
      btn.dataset.subtab = tab;
      subTabsContainer.appendChild(btn);
    });
    subTabsContainer.classList.remove('d-none');
  }

  // Handle clicking on sub-tabs
  if (subTabsContainer) {
    subTabsContainer.addEventListener('click', (e) => {
      if (e.target.matches('.btn-subtab')) {
        const clickedTab = e.target.dataset.subtab;
        if (clickedTab === currentActiveSubTab) return;
        
        currentActiveSubTab = clickedTab;
        
        // Update Active styling
        subTabsContainer.querySelectorAll('.btn-subtab').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const key = getActiveProjectKey();
        applySubTabFilterAndRender(key);
      }
    });
  }

  // Filter items directly by folder name (item.cat)
  function applySubTabFilterAndRender(projectKey) {
    let filtered = currentItems;
    if (currentActiveSubTab !== 'All') {
      filtered = currentItems.filter(item => item.cat === currentActiveSubTab);
    }
    
    if (filtered.length === 0 && currentItems.length > 0) {
        renderDriveStatus(projectKey, `No projects found in folder "${currentActiveSubTab}".`);
    } else {
        renderItems(projectKey, filtered);
    }
  }

  function makeItems(prefix, thumbs, count, driveUrl) {
    const items = [];
    for (let i = 1; i <= count; i += 1) {
      items.push({
        title: `${prefix} ${String(i).padStart(2, '0')}`,
        thumb: thumbs[(i - 1) % thumbs.length],
        drive: driveUrl || '',
        cat: ''
      });
    }
    return items;
  }

  // Live folder mapping (ALL IDs UPDATED)
  const SHORT_FORM_FOLDER_ID = '1VJwTL0gX1G9V3TLiYWeq8w7NPLgVgk-O';
  const LONG_FORM_FOLDER_ID = '16bIMGsWTvAzhZ8N5JXczJx6WAAky5Nu3';
  const GRAPHIC_DESIGN_FOLDER_ID = '1bbLJtDv6jUpr_zYZG6JoOniDPYJIz0H6'; 
  const UGC_FB_ADS_FOLDER_ID = '1y3QcWjAXFllKIXia50PcZk-q_BBvdhJX';
  const DEFAULT_VIDEO_FOLDER_ID = '1w-Wmo4a5DCPigBNBWmhoBQ1ErB0k4eBz'; // Fallback for unmatched

  const DRIVE_FOLDER_MAP = {
    shortform: [SHORT_FORM_FOLDER_ID],
    longform: [LONG_FORM_FOLDER_ID],
    ugcfbads: [UGC_FB_ADS_FOLDER_ID],
    graphicdesigns: [GRAPHIC_DESIGN_FOLDER_ID],
  };

  const FALLBACK_DRIVE_MAP = {
    shortform: `https://drive.google.com/drive/folders/${SHORT_FORM_FOLDER_ID}`,
    longform: `https://drive.google.com/drive/folders/${LONG_FORM_FOLDER_ID}`,
    ugcfbads: `https://drive.google.com/drive/folders/${UGC_FB_ADS_FOLDER_ID}`,
    graphicdesigns: `https://drive.google.com/drive/folders/${GRAPHIC_DESIGN_FOLDER_ID}`,
  };

  const fallbackSets = {
    shortform: makeItems(
      'Short Form Cut',
      ['assets/video-edit.webp', 'assets/fb-adsf.webp', 'assets/ugc-adsf.webp'],
      21,
      FALLBACK_DRIVE_MAP.shortform
    ),
    longform: makeItems(
      'Long Form Episode',
      ['assets/video-edit.webp', 'assets/game-d.webp', 'assets/webdev.webp'],
      18,
      FALLBACK_DRIVE_MAP.longform
    ),
    ugcfbads: [
      ...makeItems('UGC Ad Creative', ['assets/ugc-adsf.webp', 'assets/fb-adsf.webp'], 9, FALLBACK_DRIVE_MAP.ugcfbads),
      ...makeItems('FB Ads Creative', ['assets/fb-adsf.webp', 'assets/ugc-adsf.webp'], 9, FALLBACK_DRIVE_MAP.ugcfbads),
    ],
    graphicdesigns: makeItems(
      'Graphic Design Set',
      ['assets/grapicd.webp', 'assets/GRAPHICS.png', 'assets/VIDEO EDITS.png'],
      18,
      FALLBACK_DRIVE_MAP.graphicdesigns
    ),
  };

  const cache = {};
  const folderCache = {};
  let hasPrefetched = false;

  function isRealFolderId(folderId) {
    return !!folderId && !/^YOUR_/i.test(folderId);
  }

  function hasDriveSource(projectKey) {
    return ((DRIVE_FOLDER_MAP[projectKey] || []).filter(isRealFolderId).length > 0);
  }

  function setIndicator(projectKey) {
    toggle.classList.remove('is-long', 'is-ugc', 'is-graphic');
    if (projectKey === 'longform') toggle.classList.add('is-long');
    if (projectKey === 'ugcfbads') toggle.classList.add('is-ugc');
    if (projectKey === 'graphicdesigns') toggle.classList.add('is-graphic');
  }

  function getProjectsApiCandidates() {
    const candidates = ['/api/getProjects'];
    if (!window.location.origin.includes('localhost:3000')) {
      candidates.push('http://localhost:3000/api/getProjects');
    }
    return Array.from(new Set(candidates));
  }

  async function requestProjects(endpoint, folderId) {
    const res = await fetch(`${endpoint}?folderId=${encodeURIComponent(folderId)}`);
    const payloadText = await res.text();
    let payload = null;
    try {
      payload = payloadText ? JSON.parse(payloadText) : {};
    } catch (e) {
      payload = null;
    }
    if (!res.ok) {
      const apiMsg = payload && payload.error ? payload.error : `HTTP ${res.status}`;
      throw new Error(apiMsg);
    }
    return payload || {};
  }

  async function fetchFolder(folderId) {
    if (folderCache[folderId]) return folderCache[folderId];

    const endpoints = getProjectsApiCandidates();
    let lastError = null;

    for (let i = 0; i < endpoints.length; i += 1) {
      const endpoint = endpoints[i];
      try {
        const data = await requestProjects(endpoint, folderId);
        folderCache[folderId] = data;
        return data;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Drive API endpoint unreachable');
  }

  async function loadFromDrive(projectKey) {
    const folderIds = (DRIVE_FOLDER_MAP[projectKey] || []).filter(isRealFolderId);
    if (!folderIds.length) return null;
    if (cache[projectKey]) return cache[projectKey];

    const datasets = await Promise.all(folderIds.map(fetchFolder));
    const items = datasets.flatMap((data) =>
      (data.items || []).map((it) => ({
        title: it.title || 'Untitled',
        thumb: it.thumb || 'assets/temp-hero-placeholder.svg',
        drive: it.drive || '',
        cat: it.cat || '',
      }))
    );

    const deduped = [];
    const seen = new Set();
    items.forEach((item) => {
      const key = item.drive || `${item.title}|${item.thumb}`;
      if (seen.has(key)) return;
      seen.add(key);
      deduped.push(item);
    });

    cache[projectKey] = deduped;
    return deduped;
  }

  function filterDriveItems(projectKey, items) {
    // Return everything inside the active drive folder mapped for this key
    return items;
  }

  function getItemTag(item) {
    // Automatically uses the Google Drive folder name for the badge
    if (item.cat && item.cat !== 'All') return item.cat;
    return '';
  }

  function renderItems(projectKey, items) {
    wall.innerHTML = '';
    items.forEach((item) => {
      const tile = document.createElement('a');
      tile.href = item.drive || '#';
      tile.className = 'project-tile';
      tile.setAttribute('role', 'listitem');
      if (item.drive) {
        tile.target = '_blank';
        tile.rel = 'noopener';
      } else {
        tile.addEventListener('click', (e) => e.preventDefault());
      }
      
      const tag = getItemTag(item);
      const badgeHTML = tag ? `<span class="project-tile-badge">${tag}</span>` : '';

      tile.innerHTML = `
        <div class="project-thumb-wrap">
          <img src="${item.thumb}" alt="${item.title}" loading="lazy">
          ${badgeHTML}
        </div>
        <span class="project-tile-label">${item.title}</span>
      `;
      wall.appendChild(tile);
    });
  }

  function renderDriveStatus(projectKey, message) {
    wall.dataset.project = projectKey;
    wall.innerHTML = '';
    const tile = document.createElement('a');
    const driveUrl = FALLBACK_DRIVE_MAP[projectKey] || '#';
    tile.href = driveUrl;
    tile.className = 'project-tile project-tile-status';
    tile.setAttribute('role', 'listitem');
    if (driveUrl !== '#') {
      tile.target = '_blank';
      tile.rel = 'noopener';
    } else {
      tile.addEventListener('click', (e) => e.preventDefault());
    }
    tile.innerHTML = `
      <div class="project-tile-status-inner">
        <strong>${message}</strong>
        <span>Open Google Drive folder</span>
      </div>
    `;
    wall.appendChild(tile);
  }

  async function render(projectKey) {
    wall.dataset.project = projectKey;
    setIndicator(projectKey);
    const driveMapped = hasDriveSource(projectKey);

    try {
      wall.classList.add('is-loading');
      const driveItems = await loadFromDrive(projectKey);
      
      if (driveItems && driveItems.length) {
        currentItems = filterDriveItems(projectKey, driveItems);
        
        // --- DYNAMICALLY EXTRACT FOLDERS FOR TABS ---
        const uniqueCats = [...new Set(currentItems.map(it => it.cat).filter(Boolean))];
        if (uniqueCats.length > 0) {
          currentTabs = ['All', ...uniqueCats];
        } else {
          currentTabs = [];
        }
      } else if (driveMapped) {
        currentItems = [];
        currentTabs = [];
      } else {
        currentItems = fallbackSets[projectKey] || fallbackSets.shortform;
        currentTabs = [];
      }
      
      buildSubTabs();
      
      if (currentItems.length || !driveMapped) {
         applySubTabFilterAndRender(projectKey);
      } else if (driveMapped) {
         renderDriveStatus(projectKey, 'No preview thumbnails found in this Drive folder yet.');
      }

    } catch (err) {
      console.error('Drive preview load error:', err);
      if (driveMapped) {
        renderDriveStatus(projectKey, 'Unable to load Drive previews right now.');
      } else {
        currentItems = fallbackSets[projectKey] || fallbackSets.shortform;
        currentTabs = [];
        buildSubTabs();
        applySubTabFilterAndRender(projectKey);
      }
    } finally {
      wall.classList.remove('is-loading');
    }
  }

  function getActiveProjectKey() {
    const active = toggle.querySelector('.btn-project.active');
    return active ? (active.dataset.project || 'shortform') : 'shortform';
  }

  function ensurePrefetch(activeKey) {
    if (hasPrefetched) return;
    hasPrefetched = true;
    const keysToPrefetch = Object.keys(DRIVE_FOLDER_MAP).filter((key) => key !== activeKey);
    Promise.allSettled(
      keysToPrefetch.map((key) => loadFromDrive(key))
    );
  }

  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-project');
    if (!btn || btn.classList.contains('active')) return;

    toggle.querySelectorAll('.btn-project').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const key = btn.dataset.project || 'shortform';
    
    currentActiveSubTab = 'All'; // Reset sub-tab
    if (subTabsContainer) subTabsContainer.classList.add('d-none'); // Hide while loading
    
    ensurePrefetch(key);
    render(key);
  });

  // Initial state: render immediately.
  setIndicator('shortform');
  wall.dataset.project = 'shortform';
  currentActiveSubTab = 'All';
  renderDriveStatus('shortform', 'Loading Google Drive previews...');
  render('shortform');
  ensurePrefetch('shortform');

  const projectsSection = document.getElementById('projects');
  const servicesSection = document.getElementById('services');
  if (projectsSection && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          ensurePrefetch(getActiveProjectKey());
          io.disconnect();
        }
      });
    }, { threshold: 0.2 });
    io.observe(projectsSection);
  }

  if (servicesSection && 'IntersectionObserver' in window) {
    const ioServices = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          ensurePrefetch(getActiveProjectKey());
          ioServices.disconnect();
        }
      });
    }, { threshold: 0.45 });
    ioServices.observe(servicesSection);
  }

  document.querySelectorAll('a[href="#projects"], a[href="#services"]').forEach((link) => {
    link.addEventListener('click', () => {
      setTimeout(() => ensurePrefetch(getActiveProjectKey()), 80);
    });
  });

})();

// FAQs — category accordion + single-question open per category
(function () {
  const faqList = document.querySelector('#faqs .faqs-list');
  if (!faqList) return;

  faqList.addEventListener('toggle', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLDetailsElement)) return;

    if (target.classList.contains('faq-group')) {
      if (target.open) {
        faqList.querySelectorAll('details.faq-group').forEach((group) => {
          if (group !== target) {
            group.open = false;
            group.querySelectorAll('details.faq-item[open]').forEach((item) => {
              item.open = false;
            });
          }
        });
      } else {
        target.querySelectorAll('details.faq-item[open]').forEach((item) => {
          item.open = false;
        });
      }
      return;
    }

    if (target.classList.contains('faq-item')) {
      if (!target.open) return;
      const group = target.closest('.faq-group');
      if (!group) return;
      group.querySelectorAll('details.faq-item[open]').forEach((item) => {
        if (item !== target) item.open = false;
      });
    }
  }, true);
})();

// Services — click card to open contact modal with preselected service
(function () {
  const cards = document.querySelectorAll('.service-card[data-service]');
  if (!cards.length) return;

  const modalEl = document.getElementById('contactModal');
  const serviceSelect = document.getElementById('service');
  if (!modalEl || !serviceSelect || !window.bootstrap) return;

  const openModalWithService = (service) => {
    serviceSelect.value = service;
    serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
    const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
    instance.show();
  };

  cards.forEach((card) => {
    card.addEventListener('click', () => openModalWithService(card.dataset.service));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModalWithService(card.dataset.service);
      }
    });
  });
})();

/* ===== Prevent Projects modal from reopening on reload + clear hash on close ===== */
(function () {
  const pm = document.getElementById('projectsModal');

  try {
    const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    const isReload = nav ? nav.type === 'reload'
                         : (performance.navigation && performance.navigation.type === 1);

    if (isReload && location.hash && /^#projects\/.+/i.test(location.hash)) {
      history.replaceState(null, '', location.pathname + location.search + '#projects');
    }
  } catch (e) {}

  if (pm) {
    pm.addEventListener('hidden.bs.modal', function () {
      const newUrl = location.pathname + location.search ; 
      try { history.replaceState(null, '', newUrl); } catch (e) {}
    });
  }
})();

/* ===== UPDATED: Contact Form AJAX Submission Handler ===== */
(function() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const formStatus = document.getElementById('contactFormStatus');
  const modalEl = document.getElementById('contactModal');
  const contactModal = bootstrap.Modal.getInstance(modalEl);

  const googleWebAppUrl = 'https://script.google.com/macros/s/AKfycbw0nioKyunPSigdktzvOxzPpAKxYAm7o5ZHbUxudMWgadUooAfuQIkYGFHxr0VS7GpE4g/exec';

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    
    if (googleWebAppUrl && googleWebAppUrl !== 'PASTE_YOUR_WEB_APP_URL_HERE') {
        const plainFormData = Object.fromEntries(data.entries());
        const formDataJsonString = JSON.stringify(plainFormData);

        fetch(googleWebAppUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: formDataJsonString,
        })
        .then(res => res.json())
        .then(data => console.log("Google Sheets Response:", data))
        .catch(err => console.error("Error sending to Google Sheets:", err));
    }
    
    fetch(event.target.action, {
      method: form.method,
      body: data,
      headers: {
          'Accept': 'application/json'
      }
    }).then(response => {
      if (response.ok) {
        formStatus.innerHTML = "Thank you! Your message has been sent.";
        formStatus.classList.add('text-success');
        form.reset();
        setTimeout(() => {
          if (contactModal) {
            contactModal.hide();
          }
          setTimeout(() => {
            formStatus.innerHTML = "";
            formStatus.classList.remove('text-success');
            window.location.href = 'index.html#home';
          }, 500);
        }, 2000); 
      } else {
        response.json().then(data => {
          if (Object.hasOwn(data, 'errors')) {
            formStatus.innerHTML = data["errors"].map(error => error["message"]).join(", ");
          } else {
            formStatus.innerHTML = "Oops! There was a problem submitting your form.";
          }
          formStatus.classList.add('text-danger');
        })
      }
    }).catch(error => {
      formStatus.innerHTML = "Oops! There was a problem submitting your form.";
      formStatus.classList.add('text-danger');
    });
  }
  
  form.addEventListener("submit", handleSubmit);
})();
