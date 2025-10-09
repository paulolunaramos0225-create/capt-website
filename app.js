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

/* =========
   Animate-on-view logic:
   - Enables IntersectionObserver ONLY on ≥992px
   - On <992px: disables the observer, forces elements to "shown" state and removes transitions so nothing animates.
========= */
(function () {
  var mqLG = window.matchMedia('(min-width: 992px)');
  var io = null;

  var animated = Array.prototype.slice.call(document.querySelectorAll('.animate'));

  function enableIO() {
    if (io) return;
    // Remove any inline transition disabling from mobile state
    animated.forEach(function (el) {
      el.classList.remove('show');      // let IO drive it
      el.style.transition = '';         // restore CSS-defined transitions
    });

    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        } else {
          entry.target.classList.remove('show');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    animated.forEach(function (el) { io.observe(el); });
  }

  function disableIO() {
    if (io) { io.disconnect(); io = null; }
    // Force everything visible immediately and kill transitions so it doesn't animate-in
    animated.forEach(function (el) {
      el.classList.add('show');
      el.style.transition = 'none';   // prevents any fade/slide on mobile
    });
  }

  function apply(e) {
    if (e.matches) {     // ≥992px
      enableIO();
    } else {             // <992px
      disableIO();
    }
  }

  if (mqLG.addEventListener) mqLG.addEventListener('change', apply);
  else mqLG.addListener(apply);
  apply(mqLG);
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

// TEAM — Toggle between Co-Founders and Core Team with animations
(function () {
  // --- Data for the teams ---
  const coFounders = [
    { name: 'Mark De Leon', imgSrc: 'assets/DELEON.png' },
    { name: 'Paulo Ramos', imgSrc: 'assets/RAMOS.png' },
    { name: 'Christian Diaz', imgSrc: 'assets/DIAZ.png' },
    { name: 'Jeric Lauresta', imgSrc: 'assets/LAURESTA.png' },
    { name: 'Ivan Tuazon', imgSrc: 'assets/TUAZON.png' },
  ];

  // *** THIS SECTION HAS BEEN UPDATED WITH UNIQUE DATA ***
  const coreTeam = [
    { name: 'Rainiel Paz', imgSrc: 'assets/PAZ.png' },
    { name: 'Mark Quicay', imgSrc: 'assets/QUICAY.png' },
    { name: 'Namiel Paz', imgSrc: 'assets/PAZM.png' },
    { name: 'Priya Patel', imgSrc: 'assets/PATEL.png' },
    { name: 'Kenji Tanaka', imgSrc: 'assets/TANAKA.png' },
  ];
  // --- End of Data ---

  const toggleContainer = document.getElementById('teamToggle');
  if (!toggleContainer) {
    console.error('Team toggle container not found!');
    return;
  }
  
  const desktopMembers = document.querySelectorAll('.team-rail .member');
  const mobileMembers = document.querySelectorAll('#teamCarousel .carousel-item');
  const allTeamMembers = [...desktopMembers, ...mobileMembers];

  function updateTeamView(teamData) {
    // Update desktop view
    desktopMembers.forEach((member, index) => {
      const data = teamData[index] || { name: 'Member', imgSrc: 'assets/phd.jpg' };
      const img = member.querySelector('.member-photo');
      const nameMeta = member.querySelector('.member-meta .name');
      const nameSpotlight = member.querySelector('.spot-name');
      const figure = member.querySelector('.member-card');
      if (img) img.src = data.imgSrc;
      if (nameMeta) nameMeta.textContent = data.name;
      if (nameSpotlight) nameSpotlight.textContent = data.name;
      if (figure) figure.setAttribute('aria-label', data.name);
    });

    // Update mobile view
    mobileMembers.forEach((member, index) => {
      const data = teamData[index] || { name: 'Member', imgSrc: 'assets/phd.jpg' };
      const img = member.querySelector('.media-34-img');
      const nameMeta = member.querySelector('.media-34-meta .name');
      if (img) img.src = data.imgSrc;
      if (nameMeta) nameMeta.textContent = data.name;
    });
  }

  toggleContainer.addEventListener('click', function(e) {
    if (!e.target.matches('.btn-toggle') || e.target.classList.contains('active')) return;

    // 1. Update button state and trigger slider
    toggleContainer.querySelector('.active').classList.remove('active');
    e.target.classList.add('active');
    const teamToShow = e.target.dataset.team;
    if (teamToShow === 'coreteam') {
      toggleContainer.classList.add('core-active');
    } else {
      toggleContainer.classList.remove('core-active');
    }

    // 2. Animate out current members
    allTeamMembers.forEach(member => {
        member.classList.add('animate-out');
        member.classList.remove('animate-in'); // clean up previous animation
    });

    // 3. Wait for 'out' animation, then swap content and animate 'in'
    setTimeout(() => {
      const teamData = teamToShow === 'coreteam' ? coreTeam : coFounders;
      updateTeamView(teamData);

      allTeamMembers.forEach(member => {
        member.classList.remove('animate-out');
        member.classList.add('animate-in');
      });

      // 4. Clean up 'in' class after animations finish
      // Longest delay (0.4s) + transition duration (0.5s)
      setTimeout(() => {
        allTeamMembers.forEach(member => member.classList.remove('animate-in'));
      }, 900);

    }, 400); // This should match the transition duration in the CSS
  });
})();

// ===== Logo Intro: mount/teardown (hardened) =====
(function () {
  // TEMP: don't skip on deep links while debugging; comment back in later
  // if (location.hash && location.hash.startsWith('#projects')) return;

  if (window.__captIntroInit) return; // avoid double-run
  window.__captIntroInit = true;

  const html  = document.documentElement;
  const body  = document.body;
  const intro = document.getElementById('siteIntro');
  const page  = document.getElementById('page');
  if (!intro || !page) return;

  // Lock + blur page
  html.classList.add('intro-active');
  body.classList.add('intro-active');

  const logo = intro.querySelector('.intro__logo');
  const FALLBACK_REMOVE_MS = 3000;

  function clearPageBlur() {
    // Remove classes and any inline filter, no matter what
    html.classList.remove('intro-active');
    body.classList.remove('intro-active');
    page.style.filter = 'none';
  }

  function teardown() {
    if (!intro || intro.classList.contains('intro--hide')) return;
    intro.classList.add('intro--hide');
    clearPageBlur();
    setTimeout(() => {
      try { intro.remove(); } catch (e) {}
      page.style.filter = 'none'; // double-ensure
    }, 460);
  }

  // Prefer animationend, but always have a fallback timer
  if (logo) logo.addEventListener('animationend', teardown, { once: true });
  setTimeout(teardown, FALLBACK_REMOVE_MS);

  // Final safety: once the page finishes loading, ensure we’re clean
  window.addEventListener('load', () => {
    if (!html.classList.contains('intro-active')) {
      page.style.filter = 'none';
    }
  });
})();


/* ===== Prevent Projects modal from reopening on reload + clear hash on close ===== */
(function () {
  const pm = document.getElementById('projectsModal');

  // 1) If this is a RELOAD and the hash is a deep link like #projects/..., remove the deep part
  //    so it won't autoload the modal again.
  try {
    const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    const isReload = nav ? nav.type === 'reload'
                         : (performance.navigation && performance.navigation.type === 1); // legacy fallback

    if (isReload && location.hash && /^#projects\/.+/i.test(location.hash)) {
      // keep plain #projects (so page anchors still work) or remove hash entirely if you prefer
      history.replaceState(null, '', location.pathname + location.search + '#projects');
    }
  } catch (e) {
    // no-op
  }

  // 2) When the modal fully hides, clear any deep-link hash so future reloads don't reopen it
  if (pm) {
    pm.addEventListener('hidden.bs.modal', function () {
      const newUrl = location.pathname + location.search ; // or '' to remove all hash
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

  // !!! IMPORTANT: URL has been updated with your provided link.
  const googleWebAppUrl = 'https://script.google.com/macros/s/AKfycbw0nioKyunPSigdktzvOxzPpAKxYAm7o5ZHbUxudMWgadUooAfuQIkYGFHxr0VS7GpE4g/exec';

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    
    // Also send data to Google Sheets
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
    
    // Continue with Formspree submission for email notification
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
          // After hiding modal, clear the status message and redirect
          setTimeout(() => {
            formStatus.innerHTML = "";
            formStatus.classList.remove('text-success');
            window.location.href = 'index.html#home';
          }, 500);
        }, 2000); // Wait 2 seconds to show success message
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


