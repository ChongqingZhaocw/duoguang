const menuButton = document.querySelector('#menu-toggle');
const nav = document.querySelector('#primary-nav');
const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '打开导航菜单');
  nav.classList.remove('open');
};

menuButton.addEventListener('click', () => {
  const opened = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opened));
  menuButton.setAttribute('aria-label', opened ? '关闭导航菜单' : '打开导航菜单');
  nav.classList.toggle('open', opened);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});

const progressFill = document.querySelector('#scroll-progress-fill');
let scrolling = false;
function updateScrollProgress() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  progressFill.style.width = `${distance > 0 ? Math.min(100, window.scrollY / distance * 100) : 0}%`;
  scrolling = false;
}
window.addEventListener('scroll', () => {
  if (!scrolling) {
    scrolling = true;
    requestAnimationFrame(updateScrollProgress);
  }
}, { passive: true });
updateScrollProgress();
document.querySelector('#year').textContent = new Date().getFullYear();

const filters = [...document.querySelectorAll('.filter')];
const cards = [...document.querySelectorAll('.product-card')];
filters.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  filters.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  cards.forEach(card => {
    card.hidden = category !== 'all' && !card.dataset.category.split(' ').includes(category);
  });
}));

const dialog = document.querySelector('#product-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const dialogDescription = document.querySelector('#dialog-description');
document.querySelectorAll('.product-more').forEach(button => button.addEventListener('click', () => {
  dialogTitle.textContent = button.dataset.product;
  dialogDescription.textContent = button.dataset.description;
  dialog.showModal();
}));
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#dialog-done').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, .1, .4] });
  sections.forEach(section => observer.observe(section));
}

// Product families: one readable ad panel at a time, with manual rotation.
const productSlides = [...document.querySelectorAll('.ad-product[data-category]')];
const seriesTabs = [...document.querySelectorAll('.series-tab[data-category]')];
if (productSlides.length && seriesTabs.length) {
  const seriesNames = { acne: '痘肌护理', barrier: '屏障修护', hydrate: '水润保湿', mask: '面膜护理', glow: '焕颜护理' };
  let category = 'acne';
  let slideIndex = 0;
  const renderProduct = () => {
    const group = productSlides.filter(slide => slide.dataset.category === category);
    slideIndex = ((slideIndex % group.length) + group.length) % group.length;
    productSlides.forEach(slide => {
      slide.hidden = slide !== group[slideIndex];
      slide.classList.toggle('is-active', slide === group[slideIndex]);
    });
    seriesTabs.forEach(tab => {
      const active = tab.dataset.category === category;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    document.querySelector('#current-series').textContent = seriesNames[category];
    document.querySelector('#product-count').textContent = `${String(slideIndex + 1).padStart(2, '0')} / ${String(group.length).padStart(2, '0')}`;
    document.querySelectorAll('[data-product-direction]').forEach(button => { button.disabled = group.length === 1; });
  };
  const showHashProduct = () => {
    const target = productSlides.find(slide => `#${slide.id}` === window.location.hash);
    if (!target) return;
    category = target.dataset.category;
    slideIndex = productSlides.filter(slide => slide.dataset.category === category).indexOf(target);
    renderProduct();
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
  };
  seriesTabs.forEach(tab => tab.addEventListener('click', () => {
    category = tab.dataset.category;
    slideIndex = 0;
    renderProduct();
    document.querySelector('#products').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }));
  document.querySelectorAll('[data-product-direction]').forEach(button => button.addEventListener('click', () => {
    slideIndex += button.dataset.productDirection === 'next' ? 1 : -1;
    renderProduct();
  }));
  renderProduct();
  showHashProduct();
  window.addEventListener('hashchange', showHashProduct);
}

// Research photographs, including the pilot base, rotate without cropping arcs.
document.querySelectorAll('.media-carousel[data-carousel]').forEach(carousel => {
  const slides = [...carousel.querySelectorAll('.media-slide')];
  let index = 0;
  const status = carousel.querySelector('.carousel-status');
  const render = () => {
    slides.forEach((slide, position) => { slide.hidden = position !== index; });
    status.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  };
  carousel.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => {
    index = (index + (button.dataset.direction === 'next' ? 1 : -1) + slides.length) % slides.length;
    render();
  }));
  render();
});

// Product-series campaign covers rotate independently of individual product ads.
const coverSlides = [...document.querySelectorAll('.series-hero-slide')];
if (coverSlides.length) {
  let coverIndex = 0;
  const renderCover = () => {
    coverSlides.forEach((slide, index) => { slide.hidden = index !== coverIndex; });
    document.querySelector('#series-hero-status').textContent = `${String(coverIndex + 1).padStart(2, '0')} / ${String(coverSlides.length).padStart(2, '0')}`;
  };
  const showCoverHash = () => {
    const match = coverSlides.findIndex(slide => `#${slide.id}` === location.hash);
    if (match < 0) return;
    coverIndex = match;
    renderCover();
    requestAnimationFrame(() => document.querySelector('.series-hero-carousel').scrollIntoView({block:'start'}));
  };
  document.querySelectorAll('[data-series-direction]').forEach(button => button.addEventListener('click', () => {
    coverIndex = (coverIndex + (button.dataset.seriesDirection === 'next' ? 1 : -1) + coverSlides.length) % coverSlides.length;
    renderCover();
  }));
  renderCover();
  showCoverHash();
  window.addEventListener('hashchange', showCoverHash);
}