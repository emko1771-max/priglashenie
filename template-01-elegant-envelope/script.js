/**
 * Template 1: "Elegant Envelope" - Main Script
 * Orchestrates intro sequence, scroll reveals, ambient effects, RTL handling
 * Vanilla JS, no dependencies beyond shared utilities
 */

(function() {
  'use strict';

  // ==========================================================================
  // STATE & CONFIGURATION
  // ==========================================================================

  const state = {
    isRTL: document.documentElement.dir === 'rtl',
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    introComplete: false,
    scrollReveal: null,
    particleSystem: null,
    floatingElements: null,
    lightbox: null,
    rsvpForm: null
  };

  // ==========================================================================
  // DOM ELEMENT CACHING
  // ==========================================================================

  const elements = {
    envelopeScene: null,
    envelopeFlap: null,
    waxSeal: null,
    letter: null,
    letterContent: null,
    coverSection: null,
    namesSection: null,
    dateVenueSection: null,
    messageSection: null,
    gallerySection: null,
    scheduleSection: null,
    rsvpSection: null,
    galleryItems: null,
    lightbox: null,
    lightboxImage: null,
    lightboxCaption: null,
    lightboxClose: null,
    lightboxPrev: null,
    lightboxNext: null,
    sparkleContainer: null,
    rtlToggle: null,
    rsvpForm: null,
    rsvpSubmit: null
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  function init() {
    cacheElements();
    detectRTL();
    checkReducedMotion();
    initIntroSequence();
    initScrollReveal();
    initAmbientEffects();
    initGalleryLightbox();
    initScheduleAccordion();
    initRSVPForm();
    initRTLToggle();
    initSparkleBursts();
    bindGlobalEvents();

    // Mark as ready for CSS transitions
    document.documentElement.classList.add('js-ready');
  }

  function cacheElements() {
    elements.envelopeScene = document.querySelector('.envelope-scene');
    elements.envelopeFlap = document.querySelector('.envelope-flap');
    elements.waxSeal = document.querySelector('.wax-seal');
    elements.letter = document.querySelector('.letter');
    elements.letterContent = document.querySelector('.letter-content');
    elements.coverSection = document.querySelector('.cover-section');
    elements.namesSection = document.querySelector('.names-section');
    elements.dateVenueSection = document.querySelector('.date-venue-section');
    elements.messageSection = document.querySelector('.message-section');
    elements.gallerySection = document.querySelector('.gallery-section');
    elements.scheduleSection = document.querySelector('.schedule-section');
    elements.rsvpSection = document.querySelector('.rsvp-section');
    elements.galleryItems = document.querySelectorAll('.gallery-item');
    elements.lightbox = document.querySelector('.lightbox');
    elements.lightboxImage = document.querySelector('.lightbox-image');
    elements.lightboxCaption = document.querySelector('.lightbox-caption');
    elements.lightboxClose = document.querySelector('.lightbox-close');
    elements.lightboxPrev = document.querySelector('.lightbox-prev');
    elements.lightboxNext = document.querySelector('.lightbox-next');
    elements.sparkleContainer = document.querySelector('.sparkle-container');
    elements.rtlToggle = document.getElementById('rtl-toggle');
    elements.rsvpForm = document.querySelector('.rsvp-form');
    elements.rsvpSubmit = document.querySelector('.btn-primary[type="submit"]');
  }

  function detectRTL() {
    state.isRTL = document.documentElement.dir === 'rtl';
    updateRTLTransforms();
  }

  function checkReducedMotion() {
    state.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function updateRTLTransforms() {
    if (state.isRTL) {
      document.documentElement.setAttribute('dir', 'rtl');
      // Flip envelope flap transform origin
      if (elements.envelopeFlap) {
        elements.envelopeFlap.style.transformOrigin = 'top left';
      }
      // Mirror wax seal position
      if (elements.waxSeal) {
        elements.waxSeal.style.right = 'auto';
        elements.waxSeal.style.left = 'var(--space-6)';
      }
    }
  }

  // ==========================================================================
  // INTRO SEQUENCE (Envelope Opening Animation)
  // ==========================================================================

  function initIntroSequence() {
    if (state.prefersReducedMotion) {
      skipIntro();
      return;
    }

    const intro = window.IntroSequence.createIntroSequence({
      skipOnReducedMotion: true,
      autoStart: true,
      scrollReveal: state.scrollReveal,
      onComplete: onIntroComplete,
      onStepComplete: onIntroStepComplete
    });

    // Step 1: Envelope breathe (already running via CSS)
    // Step 2: Flap opens
    intro.addStep({
      selector: '.envelope-flap',
      animation: 'animate-flap-open',
      delay: 300,
      duration: 800,
      easing: 'var(--ease-spring)',
      callback: (el) => {
        el.classList.add('is-open');
        // Trigger wax seal crack
        if (elements.waxSeal) {
          elements.waxSeal.classList.add('cracking');
        }
      }
    });

    // Step 3: Letter slides out (staggered after flap)
    intro.addStep({
      selector: '.letter',
      animation: 'animate-letter-slide',
      delay: 200, // Additional delay after flap starts
      duration: 600,
      easing: 'var(--ease-spring)',
      callback: (el) => {
        el.classList.add('is-visible');
        // Stagger letter content reveal
        const children = el.querySelectorAll('.letter-content > *');
        children.forEach((child, i) => {
          child.style.animation = `var(--animate-fade-in-up) calc(var(--stagger-base) * ${i + 1}) var(--ease-gentle) forwards`;
          child.style.opacity = '0';
        });
      }
    });

    // Store reference for potential restart
    state.introSequence = intro;
  }

  function onIntroStepComplete(element, stepIndex) {
    console.log(`Intro step ${stepIndex} complete:`, element);
  }

  function onIntroComplete() {
    state.introComplete = true;
    elements.envelopeScene.classList.add('is-complete');

    // Enable scroll reveal for letter content sections
    if (state.scrollReveal) {
      const sections = elements.letterContent.querySelectorAll('.reveal');
      state.scrollReveal.observeAll(sections, 'animate-reveal-up', {
        stagger: true,
        staggerIncrement: 100
      });
    }

    // Start ambient effects after intro
    startAmbientEffects();
  }

  function skipIntro() {
    state.introComplete = true;
    elements.envelopeScene.classList.add('is-complete');
    elements.envelopeFlap.classList.add('is-open');
    elements.letter.classList.add('is-visible');
    elements.letterContent.querySelectorAll('.letter-content > *').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.animation = 'none';
    });
    elements.waxSeal.classList.add('cracking');
    startAmbientEffects();
  }

  // ==========================================================================
  // SCROLL REVEAL
  // ==========================================================================

  function initScrollReveal() {
    if (typeof window.ScrollReveal === 'undefined') {
      console.warn('ScrollReveal not loaded');
      return;
    }

    state.scrollReveal = window.ScrollReveal.init({
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.15,
      staggerBase: 100,
      respectReducedMotion: true
    });

    // Observe all sections with .reveal class
    const revealElements = document.querySelectorAll('.letter-content .reveal');
    if (revealElements.length) {
      state.scrollReveal.observeAll(revealElements, 'animate-reveal-up', {
        stagger: true,
        staggerIncrement: 100
      });
    }

    // Stagger children within stagger-children containers
    document.querySelectorAll('.stagger-children').forEach(container => {
      const children = container.children;
      const staggerBase = container.dataset.staggerBase || '100ms';
      Array.from(children).forEach((child, i) => {
        state.scrollReveal.observe(child, 'animate-reveal-up', {
          delay: parseInt(staggerBase) * (i + 1)
        });
      });
    });
  }

  // ==========================================================================
  // AMBIENT EFFECTS (Floating Petals, Paper Breath)
  // ==========================================================================

  function initAmbientEffects() {
    if (state.prefersReducedMotion) return;

    // Floating petals particle system
    const envelopeContainer = elements.envelopeScene || document.body;
    state.particleSystem = window.Ambient.createParticleSystem(envelopeContainer, {
      particleCount: 20,
      colors: [
        'var(--color-tertiary)',
        'var(--color-primary)',
        '#E8D5C4',
        '#F5E6D3'
      ],
      sizeRange: [4, 10],
      speedRange: [0.15, 0.4],
      direction: 'up',
      lifespan: 12000,
      spawnRate: 800,
      opacityRange: [0.2, 0.5],
      shape: 'custom',
      customShapes: [
        'assets/petal-01.svg',
        'assets/petal-02.svg',
        'assets/petal-03.svg',
        'assets/petal-04.svg',
        'assets/petal-05.svg'
      ],
      driftRange: state.isRTL ? [25, -25] : [-25, 25],
      gravity: 0.02,
      fadeInDuration: 800,
      fadeOutDuration: 1500,
      autoStart: false // Start after intro
    });

    // Paper breathe is handled via CSS animation on .letter-content and .envelope
  }

  function startAmbientEffects() {
    if (state.particleSystem && !state.prefersReducedMotion) {
      state.particleSystem.start();
    }
  }

  function pauseAmbientEffects() {
    if (state.particleSystem) {
      state.particleSystem.pause();
    }
  }

  function resumeAmbientEffects() {
    if (state.particleSystem && !state.prefersReducedMotion) {
      state.particleSystem.resume();
    }
  }

  // ==========================================================================
  // GALLERY LIGHTBOX
  // ==========================================================================

  function initGalleryLightbox() {
    if (!elements.lightbox) return;

    let currentIndex = 0;
    const galleryItems = Array.from(elements.galleryItems);

    function openLightbox(index) {
      currentIndex = index;
      const item = galleryItems[index];
      const img = item.querySelector('.gallery-image');
      const caption = item.querySelector('.gallery-caption');

      elements.lightboxImage.src = img.src;
      elements.lightboxImage.alt = img.alt;
      elements.lightboxCaption.textContent = caption ? caption.textContent : '';
      elements.lightbox.classList.add('is-open');
      elements.lightbox.hidden = false;
      document.body.style.overflow = 'hidden';

      // Focus trap
      elements.lightboxClose.focus();
    }

    function closeLightbox() {
      elements.lightbox.classList.remove('is-open');
      setTimeout(() => {
        elements.lightbox.hidden = true;
        document.body.style.overflow = '';
      }, 300);
    }

    function navigate(direction) {
      currentIndex = (currentIndex + direction + galleryItems.length) % galleryItems.length;
      openLightbox(currentIndex);
    }

    // Click handlers
    galleryItems.forEach((item, index) => {
      item.addEventListener('click', () => openLightbox(index));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(index);
        }
      });
    });

    elements.lightboxClose.addEventListener('click', closeLightbox);
    elements.lightboxPrev.addEventListener('click', () => navigate(-1));
    elements.lightboxNext.addEventListener('click', () => navigate(1));

    // Close on backdrop click
    elements.lightbox.addEventListener('click', (e) => {
      if (e.target === elements.lightbox || e.target === elements.lightbox.querySelector('.lightbox-backdrop')) {
        closeLightbox();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!elements.lightbox.classList.contains('is-open')) return;

      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          navigate(state.isRTL ? 1 : -1);
          break;
        case 'ArrowRight':
          navigate(state.isRTL ? -1 : 1);
          break;
        case 'Tab':
          // Focus trap handled by browser with modal dialog pattern
          break;
      }
    });

    // Touch swipe
    let touchStartX = 0;
    elements.lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    elements.lightbox.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        navigate(diff > 0 ? (state.isRTL ? -1 : 1) : (state.isRTL ? 1 : -1));
      }
    }, { passive: true });
  }

  // ==========================================================================
  // SCHEDULE ACCORDION
  // ==========================================================================

  function initScheduleAccordion() {
    const accordion = document.querySelector('.schedule-accordion');
    if (!accordion) return;

    // Allow only one open at a time on mobile
    const handleToggle = (e) => {
      const summary = e.target.closest('summary');
      if (!summary) return;

      const details = summary.parentElement;
      const isOpening = !details.open;

      if (isOpening && window.innerWidth < 768) {
        // Close other details on mobile
        accordion.querySelectorAll('details[open]').forEach(openDetails => {
          if (openDetails !== details) {
            openDetails.removeAttribute('open');
          }
        });
      }
    };

    accordion.addEventListener('toggle', handleToggle);
  }

  // ==========================================================================
  // RSVP FORM
  // ==========================================================================

  function initRSVPForm() {
    if (!elements.rsvpForm) return;

    const form = elements.rsvpForm;
    const submitBtn = elements.rsvpSubmit;

    // Validation
    const validators = {
      name: (value) => value.trim().length >= 2,
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      attendance: (value) => value !== '',
      guests: (value) => !value || /^\d+$/.test(value),
      dietary: (value) => true, // optional
      message: (value) => true  // optional
    };

    function validateField(field) {
      const validator = validators[field.name];
      if (!validator) return true;

      const isValid = validator(field.value);
      field.setAttribute('aria-invalid', !isValid);

      let errorEl = field.parentNode.querySelector('.form-error');
      if (!isValid) {
        if (!errorEl) {
          errorEl = document.createElement('p');
          errorEl.className = 'form-error';
          field.parentNode.appendChild(errorEl);
        }
        errorEl.textContent = getErrorMessage(field.name);
      } else if (errorEl) {
        errorEl.remove();
      }

      return isValid;
    }

    function getErrorMessage(fieldName) {
      const messages = {
        name: 'Please enter your name (at least 2 characters)',
        email: 'Please enter a valid email address',
        attendance: 'Please select whether you will attend',
        guests: 'Please enter a valid number of guests'
      };
      return messages[fieldName] || 'This field is required';
    }

    function checkFormValidity() {
      const requiredFields = form.querySelectorAll('[required]');
      let allValid = true;
      requiredFields.forEach(field => {
        if (!validateField(field)) allValid = false;
      });
      submitBtn.disabled = !allValid;
      return allValid;
    }

    // Real-time validation
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.hasAttribute('aria-invalid')) {
          validateField(field);
        }
        checkFormValidity();
      });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!checkFormValidity()) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<svg class="icon-spinner" viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="30 100" stroke-linecap="round"/></svg><span>Sending...</span>';

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Show success
      submitBtn.innerHTML = '<svg class="icon-checkmark" viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><polyline points="20 6 9 17 4 12"/></svg><span>Sent!</span>';
      submitBtn.style.background = 'var(--color-accent-sage)';

      setTimeout(() => {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg class="icon-send flip-horizontal-rtl" viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M22 2L11 13M22 2l-7 20-4-9-4-9-6-6z"/></svg><span>Send RSVP</span>';
        submitBtn.style.background = '';
      }, 3000);
    });

    // Initial validity check
    checkFormValidity();
  }

  // ==========================================================================
  // SPARKLE BURST (Hover/Click Effects)
  // ==========================================================================

  function initSparkleBursts() {
    if (state.prefersReducedMotion) return;

    const sparkleTargets = document.querySelectorAll(
      '.btn-primary, .gallery-item, .schedule-summary, .rsvp-form .form-input:focus'
    );

    function createSparkleBurst(x, y, count = 6) {
      for (let i = 0; i < count; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle-particle';
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        sparkle.style.setProperty('--tx', `${(Math.random() - 0.5) * 100}px`);
        sparkle.style.setProperty('--ty', `${(Math.random() - 0.5) * 100}px`);
        sparkle.style.setProperty('--rot', `${Math.random() * 360}deg`);
        sparkle.style.color = `hsl(${45 + Math.random() * 30}, 80%, ${50 + Math.random() * 20}%)`;
        elements.sparkleContainer.appendChild(sparkle);

        sparkle.addEventListener('animationend', () => {
          sparkle.remove();
        });
      }
    }

    sparkleTargets.forEach(target => {
      target.addEventListener('mouseenter', (e) => {
        if (target.matches('.btn-primary')) {
          const rect = target.getBoundingClientRect();
          createSparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 8);
        }
      });

      target.addEventListener('click', (e) => {
        if (target.matches('.gallery-item') || target.matches('.schedule-summary')) {
          const rect = target.getBoundingClientRect();
          createSparkleBurst(e.clientX, e.clientY, 6);
        }
      });
    });
  }

  // ==========================================================================
  // RTL TOGGLE (Demo Feature)
  // ==========================================================================

  function initRTLToggle() {
    if (!elements.rtlToggle) return;

    elements.rtlToggle.addEventListener('click', () => {
      const newDir = state.isRTL ? 'ltr' : 'rtl';
      document.documentElement.dir = newDir;
      document.documentElement.lang = newDir === 'rtl' ? 'ar' : 'en';
      state.isRTL = newDir === 'rtl';

      elements.rtlToggle.setAttribute('aria-pressed', state.isRTL);
      updateRTLTransforms();

      // Restart particle system with new drift direction
      if (state.particleSystem) {
        state.particleSystem.setConfig({
          driftRange: state.isRTL ? [25, -25] : [-25, 25]
        });
      }

      // Flip icons that need it
      document.querySelectorAll('.flip-horizontal-rtl').forEach(icon => {
        icon.style.transform = state.isRTL ? 'scaleX(-1)' : 'scaleX(1)';
      });

      // Recalculate lightbox positions if open
      if (elements.lightbox?.classList.contains('is-open')) {
        // Lightbox arrows swap handled by CSS
      }
    });
  }

  // ==========================================================================
  // GLOBAL EVENT BINDING
  // ==========================================================================

  function bindGlobalEvents() {
    // Reduced motion change
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      state.prefersReducedMotion = e.matches;
      if (e.matches) {
        pauseAmbientEffects();
        // Hide all particles
        document.querySelectorAll('.sparkle-particle').forEach(p => p.remove());
      } else {
        resumeAmbientEffects();
      }
    });

    // Resize handler for lightbox
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Recalculate lightbox positions
      }, 100);
    });

    // Keyboard accessibility for envelope click
    if (elements.envelopeScene) {
      elements.envelopeScene.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!state.introComplete && state.introSequence) {
            state.introSequence.play();
          }
        }
      });
    }
  }

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ==========================================================================
  // PUBLIC API (for external control if needed)
  // ==========================================================================

  window.Template01 = {
    restartIntro: () => {
      if (state.introSequence) {
        state.introComplete = false;
        elements.envelopeScene.classList.remove('is-complete');
        elements.envelopeFlap.classList.remove('is-open');
        elements.waxSeal.classList.remove('cracking');
        elements.letter.classList.remove('is-visible');
        state.introSequence.restart();
      }
    },
    toggleRTL: () => {
      if (elements.rtlToggle) elements.rtlToggle.click();
    },
    setReducedMotion: (enabled) => {
      state.prefersReducedMotion = enabled;
      if (enabled) pauseAmbientEffects();
      else resumeAmbientEffects();
    }
  };

  // ==========================================================================
  // INITIALIZE ON DOM READY
  // ==========================================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();