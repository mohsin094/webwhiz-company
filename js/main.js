(function ($) {
    "use strict";
    
    // Dropdown on mouse hover
    $(document).ready(function () {
        function toggleNavbarMethod() {
            if ($(window).width() > 992) {
                $('.navbar .dropdown').on('mouseover', function () {
                    $('.dropdown-toggle', this).trigger('click');
                }).on('mouseout', function () {
                    $('.dropdown-toggle', this).trigger('click').blur();
                });
            } else {
                $('.navbar .dropdown').off('mouseover').off('mouseout');
            }
        }
        toggleNavbarMethod();
        $(window).resize(toggleNavbarMethod);
    });
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 10,
        time: 2000
    });


    // Team carousel
    $(".team-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: true,
        dots: true,
        loop: true,
        margin: 30,
        responsive: {
            0:{
                items:1
            },
            576:{
                items:1
            },
            768:{
                items:2
            },
            992:{
                items:3
            }
        }
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        dots: true,
        loop: true,
        margin: 30,
        responsive: {
            0:{
                items:1
            },
            576:{
                items:1
            },
            768:{
                items:1
            }
        }
    });

    // Modern touches: glass navbar + scroll reveals
    (function () {
        var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function setScrolled() {
            if (window.scrollY > 8) {
                document.body.classList.add('is-scrolled');
            } else {
                document.body.classList.remove('is-scrolled');
            }
        }
        setScrolled();
        window.addEventListener('scroll', setScrolled, { passive: true });

        // Cursor spotlight + micro-interactions
        (function () {
            if (reducedMotion) return;
            var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
            if (!finePointer) return;

            var rafPending = false;
            var lastX = window.innerWidth * 0.5;
            var lastY = window.innerHeight * 0.25;

            function applyCursorVars() {
                rafPending = false;
                document.documentElement.style.setProperty('--wwt-cx', lastX + 'px');
                document.documentElement.style.setProperty('--wwt-cy', lastY + 'px');
            }

            window.addEventListener('pointermove', function (e) {
                lastX = e.clientX;
                lastY = e.clientY;
                if (!rafPending) {
                    rafPending = true;
                    window.requestAnimationFrame(applyCursorVars);
                }
            }, { passive: true });

            // Magnetic buttons (subtle)
            var magnetic = document.querySelectorAll('.btn');
            magnetic.forEach(function (btn) {
                btn.classList.add('wwt-magnetic');
                btn.addEventListener('mousemove', function (e) {
                    var r = btn.getBoundingClientRect();
                    var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
                    var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
                    btn.style.transform = 'translate3d(' + (dx * 6).toFixed(2) + 'px,' + (dy * 6).toFixed(2) + 'px,0)';
                });
                btn.addEventListener('mouseleave', function () {
                    btn.style.transform = '';
                });
            });

            // Tilt cards (auto-apply to common card-like blocks)
            var tiltTargets = document.querySelectorAll('.team-item, .testimonial-item, .border, .contact-form, .carousel-caption .p-5, .d-flex.align-items-center.border');
            tiltTargets.forEach(function (el) {
                // avoid tilting very large wrappers
                if (el.classList.contains('container') || el.classList.contains('container-fluid')) return;
                // Prevent blur artifacts on testimonial carousel hover
                if (el.closest && el.closest('.testimonial-carousel')) return;
                el.classList.add('wwt-tilt');

                el.addEventListener('pointermove', function (e) {
                    var r = el.getBoundingClientRect();
                    var px = (e.clientX - r.left) / r.width;   // 0..1
                    var py = (e.clientY - r.top) / r.height;  // 0..1
                    var rx = (py - 0.5) * -8; // tilt up/down
                    var ry = (px - 0.5) * 10; // tilt left/right
                    el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-1px)';
                    el.style.setProperty('--wwt-mx', (px * 100).toFixed(2) + '%');
                    el.style.setProperty('--wwt-my', (py * 100).toFixed(2) + '%');
                    el.classList.add('is-tilting');
                });

                el.addEventListener('mouseleave', function () {
                    el.style.transform = '';
                    el.classList.remove('is-tilting');
                });
            });
        })();

        // Auto-mark main sections for reveal if not manually annotated
        var autoSections = document.querySelectorAll('.container-fluid');
        autoSections.forEach(function (el) {
            if (el.classList.contains('nav-bar')) return;
            if (el.querySelector && el.querySelector('#header-carousel')) return;
            if (el.hasAttribute && el.hasAttribute('data-animate')) return;
            el.classList.add('wwt-reveal');
        });

        // Add stagger to common rows/grids for more charming scroll motion
        var autoStaggers = document.querySelectorAll('.container-fluid .row');
        autoStaggers.forEach(function (row) {
            if (row.closest && row.closest('#header-carousel')) return;
            if (row.classList.contains('wwt-stagger')) return;
            row.classList.add('wwt-stagger');

            var kids = Array.prototype.slice.call(row.children || []);
            kids.forEach(function (kid, idx) {
                kid.style.setProperty('--wwt-delay', (idx * 80) + 'ms');
            });
        });

        var nodes = document.querySelectorAll('[data-animate], .wwt-reveal, .wwt-stagger');
        if (!nodes.length) return;

        if (reducedMotion || !('IntersectionObserver' in window)) {
            nodes.forEach(function (el) { el.classList.add('in-view'); });
            return;
        }

        // Re-trigger animations on every scroll (enter/leave)
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                } else {
                    entry.target.classList.remove('in-view');
                }
            });
        }, { root: null, rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

        nodes.forEach(function (el) { io.observe(el); });
    })();
    
})(jQuery);

