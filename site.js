/* Independent, manually controlled photo galleries for the public website. */
document.querySelectorAll('[data-gallery]').forEach((gallery) => {
  const slides = [...gallery.querySelectorAll('.gallery-slide')];
  const selectors = [...gallery.querySelectorAll('[data-slide]')];
  const count = gallery.querySelector('.gallery-count');
  const stage = gallery.querySelector('.gallery-stage');
  let current = 0;

  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    selectors.forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.slide) === current));
    });
    count.textContent = `${current + 1} / ${slides.length} photos`;
  }

  gallery.querySelector('[data-previous]').addEventListener('click', () => showSlide(current - 1));
  gallery.querySelector('[data-next]').addEventListener('click', () => showSlide(current + 1));
  selectors.forEach((button) => {
    button.addEventListener('click', () => showSlide(Number(button.dataset.slide)));
  });
  gallery.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showSlide(current + (event.key === 'ArrowRight' ? 1 : -1));
  });

  let touchStart = null;
  stage.addEventListener('touchstart', (event) => {
    touchStart = event.touches.length === 1
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
      : null;
  }, { passive: true });
  stage.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) showSlide(current + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });

  gallery.querySelectorAll('[data-gallery-controls]').forEach((control) => { control.hidden = false; });
  showSlide(0);
});

// Desktop motion is optional; mobile reviews use native touch scrolling.
const reviews = document.querySelector('[data-reviews]');
if (reviews) {
  const viewport = reviews.querySelector('.testimonial-carousel-wrap');
  const cards = [...reviews.querySelectorAll('.testimonial-card:not([aria-hidden="true"])')];
  const pause = reviews.querySelector('[data-review-pause]');
  const controls = reviews.querySelector('[data-review-controls]');
  const previous = reviews.querySelector('[data-review-previous]');
  const next = reviews.querySelector('[data-review-next]');
  const position = reviews.querySelector('[data-review-position]');
  const mobile = window.matchMedia('(max-width: 700px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;

  function updatePosition() {
    if (!mobile.matches) return;
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    current = Math.max(0, Math.min(cards.length - 1, Math.round(viewport.scrollLeft / step)));
    previous.disabled = current === 0;
    next.disabled = current === cards.length - 1;
    const label = `${current + 1} / ${cards.length}`;
    if (position.textContent !== label) position.textContent = label;
  }

  function showReview(index) {
    const target = Math.max(0, Math.min(cards.length - 1, index));
    viewport.scrollTo({
      left: cards[target].offsetLeft - cards[0].offsetLeft,
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  }

  function syncReviewMode() {
    pause.hidden = mobile.matches || reducedMotion.matches;
    controls.hidden = !mobile.matches;
    viewport.scrollLeft = 0;
    updatePosition();
  }

  pause.addEventListener('click', () => {
    const paused = reviews.classList.toggle('reviews-paused');
    pause.textContent = paused ? 'Play reviews' : 'Pause reviews';
  });
  previous.addEventListener('click', () => showReview(current - 1));
  next.addEventListener('click', () => showReview(current + 1));
  viewport.addEventListener('scroll', updatePosition, { passive: true });
  viewport.addEventListener('keydown', (event) => {
    if (!mobile.matches || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') showReview(0);
    else if (event.key === 'End') showReview(cards.length - 1);
    else showReview(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  mobile.addEventListener('change', syncReviewMode);
  reducedMotion.addEventListener('change', syncReviewMode);
  new ResizeObserver(updatePosition).observe(viewport);
  reviews.classList.add('reviews-ready');
  syncReviewMode();
}

const menu = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (menu && navLinks) {
  const closeMenu = () => {
    navLinks.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  };
  menu.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  navLinks.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMenu();
      menu.focus();
    }
  });
}

const fadeElements = document.querySelectorAll('.fade-in-up');
if ('IntersectionObserver' in window) {
  const fadeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });
  fadeElements.forEach((element) => fadeObserver.observe(element));
} else {
  fadeElements.forEach((element) => element.classList.add('visible'));
}
