/**
 * Scroll Reveal Module - IntersectionObserver-based scroll animations
 * Vanilla JS, < 3KB gzipped, respects prefers-reduced-motion
 * 
 * Usage:
 *   import { initScrollReveal, observe, unobserve } from './scroll-reveal.js';
 *   initScrollReveal({ rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
 *   observe(element, 'animate-reveal-up', { delay: 200, stagger: 100 });
 */

(function (global) {
  'use strict';

  // Configuration defaults
  const DEFAULT_OPTIONS = {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1,
    delay: 0,
    once: true,
    onEnter: null,
    onExit: null,
    respectReducedMotion: true
  };

  // Module state
  let observer = null;
  let config = { ...DEFAULT_OPTIONS };
  let reducedMotion = false;
  let reducedMotionQuery = null;
  const observedElements = new WeakMap(); // element -> { animationClass, options, staggerIndex }

  /**
   * Check if user prefers reduced motion
   */
  function checkReducedMotion() {
    if (!reducedMotionQuery) {
      reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    }
    reducedMotion = reducedMotionQuery.matches;
    return reducedMotion;
  }

  function handleReducedMotionChange(e) {
    reducedMotion = e.matches;
    if (reducedMotion && observer) {
      // Immediately reveal all observed elements
      observedElements.forEach((data, element) => {
        makeVisible(element, data);
      });
    }
  }

  /**
   * Make element immediately visible (for reduced motion)
   */
  function makeVisible(element, data) {
    element.classList.add('is-visible');
    element.style.opacity = '1';
    element.style.transform = 'none';
    element.style.filter = 'none';
    element.style.clipPath = 'inset(0 0 0 0)';
    element.style.willChange = 'auto';
    
    if (data.options.onEnter) {
      data.options.onEnter(element);
    }
  }

  /**
   * Apply animation class and will-change to element
   */
  function prepareElement(element, animationClass, options) {
    // Add will-change for performance
    element.style.willChange = 'transform, opacity, filter, clip-path';
    
    // Add the animation class
    if (animationClass) {
      element.classList.add(animationClass);
    }
    
    // Handle stagger delay
    const staggerDelay = getStaggerDelay(element, options);
    const totalDelay = (options.delay || 0) + staggerDelay;
    
    if (totalDelay > 0) {
      element.style.animationDelay = `${totalDelay}ms`;
    }
  }

  /**
   * Get stagger delay from element attributes or options
   */
  function getStaggerDelay(element, options) {
    // Check data-stagger attribute (ms)
    const staggerAttr = element.getAttribute('data-stagger');
    if (staggerAttr) {
      return parseInt(staggerAttr, 10);
    }
    
    // Check data-stagger-index attribute (multiplied by base stagger)
    const staggerIndex = element.getAttribute('data-stagger-index');
    if (staggerIndex !== null) {
      const baseStagger = options.staggerBase || 100;
      return parseInt(staggerIndex, 10) * baseStagger;
    }
    
    // Use option stagger if provided
    if (options.stagger && options.staggerIndex !== undefined) {
      return options.staggerIndex * options.stagger;
    }
    
    return 0;
  }

  /**
   * Clean up element after animation
   */
  function cleanupElement(element, data) {
    // Remove will-change after animation
    setTimeout(() => {
      element.style.willChange = 'auto';
    }, (data.options.duration || config.duration || 800) + (data.options.delay || 0) + 100);
    
    // Call onEnter callback
    if (data.options.onEnter) {
      data.options.onEnter(element);
    }
  }

  /**
   * Handle intersection observer entries
   */
  function handleIntersection(entries) {
    entries.forEach(entry => {
      const element = entry.target;
      const data = observedElements.get(element);
      
      if (!data) return;
      
      if (entry.isIntersecting) {
        // Element is visible
        if (reducedMotion && config.respectReducedMotion) {
          makeVisible(element, data);
        } else {
          prepareElement(element, data.animationClass, data.options);
        }
        
        if (data.options.once) {
          unobserve(element);
        }
      } else if (!data.options.once && data.options.onExit) {
        // Element exited viewport (if not once)
        data.options.onExit(element);
        // Reset for re-trigger
        element.classList.remove('is-visible');
        if (data.animationClass) {
          element.classList.remove(data.animationClass);
          // Force reflow to restart animation
          void element.offsetWidth;
          element.classList.add(data.animationClass);
        }
      }
    });
  }

  /**
   * Initialize the IntersectionObserver
   */
  function initScrollReveal(options = {}) {
    config = { ...DEFAULT_OPTIONS, ...options };
    checkReducedMotion();
    
    // Clean up existing observer
    if (observer) {
      observer.disconnect();
    }
    
    observer = new IntersectionObserver(handleIntersection, {
      root: config.root || null,
      rootMargin: config.rootMargin,
      threshold: config.threshold
    });
    
    return {
      observe,
      unobserve,
      observeAll,
      disconnect: () => {
        observer.disconnect();
        observedElements.forEach((_, element) => {
          observedElements.delete(element);
        });
      },
      getConfig: () => ({ ...config }),
      updateConfig: (newConfig) => {
        config = { ...config, ...newConfig };
        // Recreate observer with new config
        if (observer) {
          observer.disconnect();
          observer = new IntersectionObserver(handleIntersection, {
            root: config.root || null,
            rootMargin: config.rootMargin,
            threshold: config.threshold
          });
          // Re-observe all elements
          observedElements.forEach((data, element) => {
            observer.observe(element);
          });
        }
      }
    };
  }

  /**
   * Observe an element for scroll reveal
   * @param {Element} element - DOM element to observe
   * @param {string} animationClass - CSS animation class (e.g., 'animate-reveal-up')
   * @param {Object} options - Override options for this element
   */
  function observe(element, animationClass, options = {}) {
    if (!element) {
      console.warn('scroll-reveal: observe() called with null element');
      return;
    }
    
    if (!observer) {
      initScrollReveal();
    }
    
    const elementOptions = { ...config, ...options };
    const staggerIndex = options.staggerIndex !== undefined ? options.staggerIndex : 
                         element.getAttribute('data-stagger-index') !== null ? 
                         parseInt(element.getAttribute('data-stagger-index'), 10) : undefined;
    
    if (staggerIndex !== undefined) {
      elementOptions.staggerIndex = staggerIndex;
    }
    
    // Store element data
    observedElements.set(element, {
      animationClass,
      options: elementOptions,
      staggerIndex
    });
    
    // Ensure element starts hidden (unless reduced motion)
    if (!reducedMotion || !config.respectReducedMotion) {
      element.style.opacity = '0';
    }
    
    observer.observe(element);
    
    return {
      unobserve: () => unobserve(element),
      update: (newOptions) => {
        const data = observedElements.get(element);
        if (data) {
          data.options = { ...data.options, ...newOptions };
        }
      }
    };
  }

  /**
   * Stop observing an element
   */
  function unobserve(element) {
    if (!observer) return;
    
    observer.unobserve(element);
    observedElements.delete(element);
    
    // Clean up will-change
    element.style.willChange = 'auto';
  }

  /**
   * Observe multiple elements with stagger
   * @param {Element[]|NodeList} elements - Elements to observe
   * @param {string} animationClass - CSS animation class
   * @param {Object} options - Options (staggerBase, staggerIncrement, etc.)
   */
  function observeAll(elements, animationClass, options = {}) {
    const staggerBase = options.staggerBase || 100;
    const staggerIncrement = options.staggerIncrement || staggerBase;
    let staggerIndex = options.startIndex || 0;
    
    const observers = Array.from(elements).map((el, index) => {
      const opts = { ...options };
      if (options.stagger !== false) {
        opts.staggerIndex = staggerIndex++;
        opts.stagger = staggerIncrement;
      }
      return observe(el, animationClass, opts);
    });
    
    return {
      unobserveAll: () => observers.forEach(o => o.unobserve()),
      updateAll: (newOptions) => observers.forEach(o => o.update(newOptions))
    };
  }

  /**
   * Trigger reveal immediately (bypass observer)
   */
  function revealNow(element, animationClass, options = {}) {
    if (!element) return;
    
    if (reducedMotion && config.respectReducedMotion) {
      makeVisible(element, { options: { ...config, ...options, onEnter: options.onEnter } });
      return;
    }
    
    prepareElement(element, animationClass, { ...config, ...options });
    cleanupElement(element, { options: { ...config, ...options } });
  }

  /**
   * Check if element is currently being observed
   */
  function isObserved(element) {
    return observedElements.has(element);
  }

  /**
   * Get all observed elements
   */
  function getObservedElements() {
    return Array.from(observedElements.keys());
  }

  // Export for different module systems
  const ScrollReveal = {
    init: initScrollReveal,
    observe,
    unobserve,
    observeAll,
    revealNow,
    isObserved,
    getObservedElements,
    checkReducedMotion: () => reducedMotion
  };

  // UMD/ESM/CommonJS/Global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollReveal;
  } else if (typeof define === 'function' && define.amd) {
    define([], () => ScrollReveal);
  } else {
    global.ScrollReveal = ScrollReveal;
  }

})(typeof window !== 'undefined' ? window : this);