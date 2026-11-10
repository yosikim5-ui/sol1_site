/* GraphiSolar® 홈페이지 공통 스크립트
   - 상단 메뉴(스크롤 시 유리 배경, 모바일 메뉴)
   - 첫 화면 사진·영상 자동 감지
   - 스크롤 등장, 숫자 올라가기, 대형 이미지 패럴랙스, 큰 글자 띠
   - 사진 확대 보기(이전·다음)
   움직임 줄이기 설정을 켠 방문자에게는 움직임을 끕니다. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 상단 메뉴 ---------- */
  var header = document.querySelector('.site-header');
  function onScrollHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('nav-open'); });
    });
  }

  /* ---------- 첫 화면 사진·영상: 파일이 있으면 자동으로 보여줌 ---------- */
  /* 여기를 템플릿으로 교체할 수 있음: #hero-bg 안의 영상·사진 */
  var hero = document.querySelector('.hero');
  if (hero) {
    var hImg = hero.querySelector('.hero-media img');
    var hVid = hero.querySelector('.hero-media video');
    var markMedia = function () { hero.classList.add('hero--media'); };
    if (hImg) {
      if (hImg.complete && hImg.naturalWidth > 0) markMedia();
      hImg.addEventListener('load', markMedia);
    }
    if (hVid) {
      hVid.addEventListener('loadeddata', function () { markMedia(); hero.classList.add('hero--video'); });
      if (reduce) { hVid.removeAttribute('autoplay'); hVid.pause && hVid.pause(); }
    }
  }

  /* ---------- 스크롤 등장 ---------- */
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (el, i) {
      el.setAttribute('data-reveal', '');
      el.style.transitionDelay = (i * 0.08) + 's';
    });
  });
  var revealEls = document.querySelectorAll('[data-reveal], .reveal-img');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 숫자 올라가기 (입력된 실제 숫자만) ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var start = null, dur = 1200;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---------- 대형 이미지 패럴랙스 + 큰 글자 띠 ---------- */
  var bands = document.querySelectorAll('.band .media img');
  var rows = document.querySelectorAll('[data-marquee]');
  var ticking = false;
  function onScrollFx() {
    var vh = window.innerHeight;
    bands.forEach(function (img) {
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh; // -1 ~ 1
      img.style.transform = 'translate3d(0,' + (p * -60).toFixed(1) + 'px,0)';
    });
    rows.forEach(function (row) {
      var r = row.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var dir = row.getAttribute('data-marquee') === 'right' ? 1 : -1;
      var shift = (vh - r.top) * 0.35 * dir - (dir > 0 ? row.scrollWidth * 0.25 : 0);
      row.style.transform = 'translate3d(' + shift.toFixed(1) + 'px,0,0)';
    });
    ticking = false;
  }
  if (!reduce && (bands.length || rows.length)) {
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(onScrollFx); ticking = true; }
    }, { passive: true });
    onScrollFx();
  }

  /* ---------- 사진 확대 보기 ---------- */
  var box, boxImg, boxCount, list = [], idx = 0;
  function buildBox() {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', '사진 크게 보기');
    var arrow = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>'; };
    box.innerHTML =
      '<img alt="">' +
      '<button class="lb-close" type="button" aria-label="닫기">' + arrow('M6 6l12 12M18 6L6 18') + '</button>' +
      '<button class="lb-prev" type="button" aria-label="이전 사진">' + arrow('M15 5l-7 7 7 7') + '</button>' +
      '<button class="lb-next" type="button" aria-label="다음 사진">' + arrow('M9 5l7 7-7 7') + '</button>' +
      '<p class="lb-count"></p>';
    document.body.appendChild(box);
    boxImg = box.querySelector('img');
    boxCount = box.querySelector('.lb-count');
    box.querySelector('.lb-close').addEventListener('click', closeBox);
    box.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') closeBox();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }
  function show(i) {
    idx = (i + list.length) % list.length;
    boxImg.src = list[idx].currentSrc || list[idx].src;
    boxImg.alt = list[idx].alt;
    boxCount.textContent = (idx + 1) + ' / ' + list.length;
  }
  function closeBox() { box.classList.remove('open'); document.body.style.overflow = ''; }
  document.addEventListener('click', function (e) {
    var img = e.target.closest && e.target.closest('[data-gallery] img');
    if (!img || !img.naturalWidth) return;
    var group = img.closest('[data-gallery]').getAttribute('data-gallery');
    list = Array.prototype.filter.call(
      document.querySelectorAll('[data-gallery="' + group + '"] img'),
      function (el) { return el.naturalWidth > 0; }
    );
    if (!box) buildBox();
    show(list.indexOf(img));
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
    box.querySelector('.lb-close').focus();
  });

  /* ---------- 연도 ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
