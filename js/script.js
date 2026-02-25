(function () {
  'use strict';

  var DURATION = 1500;
  var EASING = function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; };

  function animateValue(el) {
    var target = parseInt(el.dataset.target, 10);
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / DURATION, 1);
      var eased = EASING(progress);
      var current = Math.round(start + (target - start) * eased);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target + suffix;
    }

    requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll('.count[data-target]');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.dataset.animated === 'true') return;
        el.dataset.animated = 'true';
        animateValue(el);
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });

    counters.forEach(function (el) { return observer.observe(el); });
  }

  function initNav() {
    var menuToggle = document.querySelector('.menu-toggle');
    var navLinks = document.querySelector('.nav-links');
    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener('click', function () {
      var open = !navLinks.classList.contains('is-open');
      navLinks.classList.toggle('is-open', open);
      menuToggle.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    document.querySelectorAll('.nav-links a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('[name="name"]') || {}).value || '';
      var email = (form.querySelector('[name="email"]') || {}).value || '';
      var message = (form.querySelector('[name="message"]') || {}).value || '';
      var subject = 'Contact UNDEEFINED — ' + (name || 'Sans nom');
      var body = (message || '') + '\n\n— ' + (name || '') + '\n' + (email || '');
      var mailto = 'mailto:cyrilcartoux13@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      window.location.href = mailto;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCounters();
    initNav();
    initContactForm();
  });
})();
