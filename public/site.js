/* Crown and Compass — shared site behavior.
   Loaded on every public page. Feature-detects, so it is safe everywhere.
   1) Mobile nav (hamburger + drop panel)
   2) "More" dropdown click toggle (touch + a11y; hover stays as enhancement)
   3) Newsletter / email-capture forms -> POST /api/subscribe */
(function () {
  'use strict';

  /* ---- 0) Skip-to-content link -------------------------------------- */
  var main = document.querySelector('main');
  if (main) {
    if (!main.id) main.id = 'main-content';
    var skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#' + main.id;
    skip.textContent = 'Skip to content';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  /* ---- 1) Mobile nav ------------------------------------------------ */
  var header = document.querySelector('header.site-header');
  var bar = header && header.querySelector('.bar');
  var nav = header && header.querySelector('.nav');

  if (header && bar && nav) {
    // Hamburger button
    var toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.setAttribute('type', 'button');
    toggle.setAttribute('aria-label', 'Menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    bar.appendChild(toggle);

    // Drop panel, built from the existing nav links so it always matches
    var panel = document.createElement('nav');
    panel.className = 'mobile-nav';
    panel.setAttribute('aria-label', 'Menu');
    var links = nav.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var a = document.createElement('a');
      a.href = links[i].getAttribute('href');
      a.textContent = links[i].textContent.trim();
      if (links[i].classList.contains('active')) a.className = 'active';
      panel.appendChild(a);
    }
    header.appendChild(panel);

    var closeMenu = function () {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close after tapping a destination
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });
    // Reset when returning to desktop width
    window.addEventListener('resize', function () {
      if (window.innerWidth > 940) closeMenu();
    });
  }

  /* ---- 2) "More" dropdown click toggle ------------------------------ */
  var more = header && header.querySelector('.nav-more');
  var moreBtn = more && more.querySelector('.more-btn');
  if (more && moreBtn) {
    moreBtn.setAttribute('aria-expanded', 'false');
    moreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = more.classList.toggle('open');
      moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!more.contains(e.target)) {
        more.classList.remove('open');
        moreBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- 3) Newsletter / email-capture forms -------------------------- */
  var forms = document.querySelectorAll('form.news-form, form.join-form');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"], input');
      var btn = form.querySelector('button[type="submit"], button');
      var email = (input && input.value || '').trim();

      var say = function (text, keepForm) {
        if (keepForm) {
          // transient error: show a line under the form, leave the form up
          var err = form.parentNode.querySelector('.form-err');
          if (!err) {
            err = document.createElement('p');
            err.className = 'form-done form-err';
            err.style.color = 'var(--ember)';
            form.parentNode.insertBefore(err, form.nextSibling);
          }
          err.textContent = text;
        } else {
          var done = document.createElement('p');
          done.className = 'form-done';
          done.textContent = text;
          form.parentNode.replaceChild(done, form);
        }
      };

      if (!EMAIL_RE.test(email)) {
        say('Please enter a valid email address.', true);
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending...';
      }
      fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, source: location.pathname })
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok) {
            say('You are on the list. Watch your inbox for the next note.', false);
          } else {
            say((res.d && res.d.error) || 'Something went wrong. Please try again.', true);
            if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
          }
        })
        .catch(function () {
          say('Network trouble. Please try again in a moment.', true);
          if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
        });
    });
  });
})();
