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
