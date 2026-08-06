/* =========================================================
   CondoTech SC — scripts
   ---------------------------------------------------------
   >>> EDITE APENAS O BLOCO ABAIXO <<<
   Quando o cliente enviar o WhatsApp, troque os dois campos.
   O site atualiza todos os links e números automaticamente.
   ========================================================= */

const SITE = {
  // Número com DDI + DDD, só dígitos. Ex.: '5548999998888'
  whatsapp: '',

  // Como o número aparece na tela. Ex.: '(48) 99999-8888'
  phoneDisplay: '',

  // Telefone fixo, se houver. Deixe vazio para esconder.
  phone: '',

  // Mensagem que já vem escrita ao abrir o WhatsApp
  waMessage: 'Olá! Gostaria de informações sobre a administração do meu condomínio.'
};

/* ========================= fim da configuração ========================= */

(() => {
  'use strict';

  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Contatos: WhatsApp, telefone e números na tela
     --------------------------------------------------------- */
  const hasWhatsapp = /^\d{12,13}$/.test(SITE.whatsapp);

  $$('[data-wa]').forEach(el => {
    if (hasWhatsapp) {
      el.href = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(SITE.waMessage)}`;
      el.target = '_blank';
      el.rel = 'noopener';
    } else {
      // Sem número configurado, o botão leva ao formulário em vez de quebrar.
      el.href = '#contato';
    }
  });

  $$('[data-tel]').forEach(el => {
    const tel = SITE.phone || SITE.phoneDisplay;
    if (tel) {
      el.href = 'tel:+55' + tel.replace(/\D/g, '');
    } else {
      el.closest('li')?.remove();
    }
  });

  $$('[data-phone-display]').forEach(el => {
    if (SITE.phoneDisplay) { el.textContent = SITE.phoneDisplay; return; }
    // Sem número cadastrado: esconde o placeholder em vez de mostrar zeros.
    el.remove();
  });

  /* ---------------------------------------------------------
     2. Menu mobile
     --------------------------------------------------------- */
  const nav = $('#nav');
  const toggle = $('#navToggle');

  const closeNav = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  };

  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });

  $$('#nav a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

  /* ---------------------------------------------------------
     3. Sombra do header ao rolar
     --------------------------------------------------------- */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------------------------------------------------
     4. Carrossel do topo
     --------------------------------------------------------- */
  const hero = $('#hero');
  if (hero) {
    const slides = $$('.slide', hero);
    const dotsBox = $('.hero-dots', hero);
    const bar = $('.hero-progress span', hero);
    const DURATION = 7000;
    let index = 0, raf = null, start = 0, paused = false;

    // pontos de navegação
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Destaque ${i + 1} de ${slides.length}`);
      b.addEventListener('click', () => go(i));
      dotsBox.appendChild(b);
    });
    const dots = $$('button', dotsBox);

    // Vídeo de fundo: qualquer slide pode ter um, via data-video.
    // Só carrega em telas grandes, sem economia de dados e com animação permitida.
    const canVideo = window.innerWidth > 820 && !reduceMotion && !navigator.connection?.saveData;

    function mountVideo(slide) {
      // cria o <video> só na primeira vez que o slide aparece
      if (!canVideo || !slide.dataset.video || slide.dataset.videoReady) return;
      slide.dataset.videoReady = '1';

      const v = document.createElement('video');
      v.src = slide.dataset.video;
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('aria-hidden', 'true');

      // arquivo faltando ou formato não suportado: remove e mantém a imagem
      v.addEventListener('error', () => { v.remove(); }, { once: true });

      slide.prepend(v);
      v.play?.().catch(() => v.remove());
    }

    function syncVideos() {
      slides.forEach((s, i) => {
        const active = i === index;
        if (active) mountVideo(s);
        const v = s.querySelector('video');
        if (!v) return;
        if (active) {
          try { v.currentTime = 0; } catch (_) {}
          v.play?.().catch(() => {});
        } else {
          v.pause();
        }
      });
    }

    function paint() {
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === index)));
      syncVideos();
    }

    function go(i) {
      index = (i + slides.length) % slides.length;
      paint();
      restart();
    }

    function tick(now) {
      if (!start) start = now;
      const p = Math.min((now - start) / DURATION, 1);
      if (bar) bar.style.width = (p * 100) + '%';
      if (p === 1) { start = 0; go(index + 1); return; }
      raf = requestAnimationFrame(tick);
    }

    function restart() {
      cancelAnimationFrame(raf);
      start = 0;
      if (bar) bar.style.width = '0%';
      if (!paused && !reduceMotion && slides.length > 1) raf = requestAnimationFrame(tick);
    }

    // setas
    $$('.hero-arrow', hero).forEach(btn =>
      btn.addEventListener('click', () => go(index + (btn.dataset.dir === 'next' ? 1 : -1)))
    );

    // teclado
    hero.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft')  go(index - 1);
    });

    // pausa ao passar o mouse ou trocar de aba
    hero.addEventListener('mouseenter', () => { paused = true; cancelAnimationFrame(raf); });
    hero.addEventListener('mouseleave', () => { paused = false; restart(); });
    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      if (paused) { cancelAnimationFrame(raf); }
      else { restart(); syncVideos(); }
    });

    // arrastar no celular
    let x0 = null;
    hero.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    paint();
    restart();
  }

  /* ---------------------------------------------------------
     5. Revelação no scroll
     --------------------------------------------------------- */
  const targets = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    targets.forEach(t => io.observe(t));
  } else {
    targets.forEach(t => t.classList.add('is-in'));
  }

  /* ---------------------------------------------------------
     6. Item ativo no menu conforme a seção visível
     --------------------------------------------------------- */
  const sections = $$('main section[id]');
  const links = new Map($$('#nav ul a').map(a => [a.getAttribute('href').slice(1), a]));

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const link = links.get(entry.target.id);
        if (link && entry.isIntersecting) {
          links.forEach(l => l.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------------------------------------------------------
     7. Ano no rodapé
     --------------------------------------------------------- */
  const ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

})();
