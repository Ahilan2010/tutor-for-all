(function () {
    var root = document.documentElement;
    root.classList.remove('no-js');

    // Mobile navigation
    var nav = document.getElementById('mobileNav');
    var openBtn = document.querySelector('.menu-toggle');
    var closeBtn = document.querySelector('.mobile-nav-close');

    function setMenu(open) {
        if (!nav) return;
        nav.classList.toggle('open', open);
        nav.setAttribute('aria-hidden', String(!open));
        if (openBtn) openBtn.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('menu-open', open);
        if (open && closeBtn) closeBtn.focus();
        if (!open && openBtn) openBtn.focus();
    }

    if (openBtn) openBtn.addEventListener('click', function () { setMenu(true); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
    if (nav) {
        nav.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { setMenu(false); });
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav && nav.classList.contains('open')) setMenu(false);
    });


    // Language menu: close it when you click elsewhere.
    document.addEventListener('click', function (e) {
        document.querySelectorAll('details.lang-menu[open]').forEach(function (d) {
            if (!d.contains(e.target)) d.removeAttribute('open');
        });
    });

    // English page, visitor's browser prefers one of our other languages: offer it once (never redirect).
    (function () {
        var offers = {
            es: 'Ver esta página en español', fr: 'Voir cette page en français', pt: 'Ver esta página em português',
            ar: 'عرض هذه الصفحة بالعربية', hi: 'यह पेज हिन्दी में देखें', id: 'Lihat halaman ini dalam Bahasa Indonesia',
            vi: 'Xem trang này bằng tiếng Việt', sw: 'Tazama ukurasa huu kwa Kiswahili'
        };
        if ((root.getAttribute('lang') || 'en').slice(0, 2) !== 'en') return;
        var pick = '';
        (navigator.languages || [navigator.language || '']).some(function (l) {
            var c = String(l).slice(0, 2).toLowerCase();
            if (c === 'en') return true;
            if (offers[c]) { pick = c; return true; }
            return false;
        });
        if (!pick) return;
        try { if (localStorage.getItem('tfa-lang-offer')) return; } catch (e) { /* no storage */ }
        var link = document.querySelector('link[rel="alternate"][hreflang="' + pick + '"]');
        if (!link) return;
        var bar = document.createElement('div');
        bar.className = 'lang-suggest';
        bar.setAttribute('lang', pick);
        bar.dir = pick === 'ar' ? 'rtl' : 'ltr';
        var a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = offers[pick];
        var x = document.createElement('button');
        x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Close');
        x.addEventListener('click', function () {
            bar.remove();
            try { localStorage.setItem('tfa-lang-offer', '1'); } catch (e) { /* no storage */ }
        });
        bar.appendChild(a); bar.appendChild(x);
        document.body.insertBefore(bar, document.body.firstChild);
    })();

    // Gentle reveal on scroll
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('in'); });
        return;
    }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
})();
