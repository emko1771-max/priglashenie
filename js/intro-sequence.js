/**
 * Wedding Invitation Intro Sequence Orchestrator
 * Coordinates multi-step entrance animations for wedding invitations
 * Integrates with ScrollReveal module
 */

/**
 * IntroSequence - Orchestrates multi-step entrance animations
 * @param {Object} options - Global options
 * @param {boolean} options.skipOnReducedMotion - Skip animation if prefers-reduced-motion (default: true)
 * @param {boolean} options.autoStart - Auto-start sequence on init (default: true)
 * @param {Function} options.onComplete - Callback when sequence completes
 * @param {Function} options.onStepComplete - Callback when each step completes
 * @param {Function} options.onSkip - Callback when sequence is skipped (reduced motion)
 * @param {ScrollReveal} options.scrollReveal - ScrollReveal instance to exclude intro elements from
 */
function createIntroSequence(options = {}) {
  const config = {
    skipOnReducedMotion: true,
    autoStart: true,
    onComplete: null,
    onStepComplete: null,
    onSkip: null,
    scrollReveal: null,
    ...options
  };

  let steps = [];
  let currentStep = 0;
  let isPlaying = false;
  let isComplete = false;
  let reducedMotion = false;
  let reducedMotionQuery = null;
  let introElements = new Set(); // Track elements that are part of intro sequence

  /**
   * Check reduced motion preference
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
    if (reducedMotion && isPlaying && !isComplete) {
      skipSequence();
    }
  }

  /**
   * Add a step to the intro sequence
   * @param {Object} step - Step configuration
   * @param {string|Element} step.selector - CSS selector or DOM element
   * @param {string} step.animation - CSS animation class (e.g., 'animate-fade-in-up')
   * @param {number} step.delay - Delay before this step starts (ms)
   * @param {number} step.duration - Animation duration (ms) - for timing
   * @param {string} step.easing - CSS easing (optional, uses token if not provided)
   * @param {Function} step.callback - Called when step animation starts
   * @param {boolean} step.excludeFromScrollReveal - Exclude from scroll reveal (default: true)
   */
  function addStep(step) {
    const stepConfig = {
      selector: step.selector,
      animation: step.animation || 'animate-fade-in-up',
      delay: step.delay || 0,
      duration: step.duration || 500,
      easing: step.easing || 'var(--ease-gentle)',
      callback: step.callback || null,
      excludeFromScrollReveal: step.excludeFromScrollReveal !== false,
      element: null,
      started: false,
      completed: false
    };
    
    steps.push(stepConfig);
    return introSequence; // Allow chaining
  }

  /**
   * Add multiple steps at once
   */
  function addSteps(stepArray) {
    stepArray.forEach(addStep);
    return introSequence;
  }

  /**
   * Initialize elements for all steps
   */
  function initElements() {
    steps.forEach(step => {
      const element = typeof step.selector === 'string' 
        ? document.querySelector(step.selector) 
        : step.selector;
      
      if (!element) {
        console.warn(`IntroSequence: Element not found for selector "${step.selector}"`);
        return;
      }
      
      step.element = element;
      introElements.add(element);
      
      // Exclude from scroll reveal if configured
      if (step.excludeFromScrollReveal && config.scrollReveal) {
        config.scrollReveal.unobserve(element);
      }
      
      // Initially hide element (unless reduced motion)
      if (!reducedMotion || !config.skipOnReducedMotion) {
        element.style.opacity = '0';
        element.style.animation = 'none'; // Reset any existing animation
      }
    });
  }

  /**
   * Play a single step
   */
  function playStep(step) {
    return new Promise(resolve => {
      if (!step.element) {
        resolve();
        return;
      }

      step.started = true;
      
      // Apply animation
      step.element.style.animation = `${step.animation} ${step.duration}ms ${step.easing} forwards`;
      
      // Call step callback
      if (step.callback) {
        step.callback(step.element);
      }

      // Call global step complete callback
      if (config.onStepComplete) {
        config.onStepComplete(step.element, currentStep);
      }

      // Wait for animation to complete
      setTimeout(() => {
        step.completed = true;
        step.element.style.opacity = '1';
        step.element.style.animation = '';
        step.element.style.willChange = 'auto';
        resolve();
      }, step.duration);
    });
  }

  /**
   * Play the full sequence
   */
  async function play() {
    if (isPlaying || isComplete) return;
    
    checkReducedMotion();
    
    if (reducedMotion && config.skipOnReducedMotion) {
      skipSequence();
      return Promise.resolve();
    }

    isPlaying = true;
    initElements();

    // Wait for initial render
    await new Promise(r => requestAnimationFrame(r));

    for (let i = 0; i < steps.length; i++) {
      currentStep = i;
      const step = steps[i];
      
      if (!step.element) continue;

      // Wait for step delay
      if (step.delay > 0) {
        await new Promise(r => setTimeout(r, step.delay));
      }

      await playStep(step);
    }

    isPlaying = false;
    isComplete = true;

    // Re-enable scroll reveal for intro elements after sequence completes
    if (config.scrollReveal) {
      introElements.forEach(element => {
        config.scrollReveal.observe(element, 'animate-reveal-up', { once: true });
      });
    }

    if (config.onComplete) {
      config.onComplete();
    }

    return Promise.resolve();
  }

  /**
   * Skip the sequence (for reduced motion)
   */
  function skipSequence() {
    isPlaying = false;
    isComplete = true;
    
    steps.forEach(step => {
      if (step.element) {
        step.element.style.opacity = '1';
        step.element.style.transform = 'none';
        step.element.style.animation = 'none';
        step.element.style.willChange = 'auto';
        step.completed = true;
      }
    });

    // Re-enable scroll reveal
    if (config.scrollReveal) {
      introElements.forEach(element => {
        config.scrollReveal.observe(element, 'animate-reveal-up', { once: true });
      });
    }

    if (config.onSkip) {
      config.onSkip();
    }
  }

  /**
   * Restart the sequence
   */
  function restart() {
    isPlaying = false;
    isComplete = false;
    currentStep = 0;
    
    steps.forEach(step => {
      step.started = false;
      step.completed = false;
      if (step.element) {
        step.element.style.opacity = '0';
        step.element.style.animation = 'none';
        step.element.style.transform = '';
      }
    });

    return play();
  }

  /**
   * Pause the sequence (at current step)
   */
  function pause() {
    isPlaying = false;
  }

  /**
   * Get sequence state
   */
  function getState() {
    return {
      isPlaying,
      isComplete,
      currentStep,
      totalSteps: steps.length,
      steps: steps.map(s => ({
        selector: s.selector,
        started: s.started,
        completed: s.completed
      }))
    };
  }

  /**
   * Destroy the sequence
   */
  function destroy() {
    if (reducedMotionQuery) {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    }
    steps = [];
    introElements.clear();
    isPlaying = false;
    isComplete = false;
    config.scrollReveal = null;
  }

  // Create the public API
  const introSequence = {
    addStep,
    addSteps,
    play,
    restart,
    pause,
    skip: skipSequence,
    getState,
    destroy,
    config: () => ({ ...config }),
    steps: () => [...steps]
  };

  // Auto-initialize if autoStart is true
  if (config.autoStart) {
    // Wait for DOM ready if needed
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        play();
      });
    } else {
      // Defer to next tick to allow steps to be added
      setTimeout(() => play(), 0);
    }
  }

  return introSequence;
}

/**
 * Create a wedding invitation specific intro sequence
 * Pre-configured for typical wedding invitation structure
 */
function createWeddingInvitationIntro(options = {}) {
  const sequence = createIntroSequence({
    skipOnReducedMotion: true,
    autoStart: true,
    onComplete: options.onComplete,
    onStepComplete: options.onStepComplete,
    scrollReveal: options.scrollReveal
  });

  // Default wedding invitation sequence steps
  const defaultSteps = [
    { selector: '.hero-title', animation: 'animate-fade-in-up', delay: 0, duration: 600 },
    { selector: '.hero-subtitle', animation: 'animate-fade-in-up', delay: 100, duration: 600 },
    { selector: '.hero-divider', animation: 'animate-slide-up-reveal', delay: 200, duration: 800 },
    { selector: '.hero-date', animation: 'animate-fade-in-up', delay: 300, duration: 600 },
    { selector: '.hero-venue', animation: 'animate-fade-in-up', delay: 400, duration: 600 },
    { selector: '.couple-names .name-1', animation: 'animate-fade-in-up', delay: 500, duration: 600 },
    { selector: '.couple-names .conjunction', animation: 'animate-scale-in-spring', delay: 600, duration: 500 },
    { selector: '.couple-names .name-2', animation: 'animate-fade-in-up', delay: 700, duration: 600 },
    { selector: '.countdown-item:nth-child(1)', animation: 'animate-scale-in-spring', delay: 800, duration: 500 },
    { selector: '.countdown-item:nth-child(2)', animation: 'animate-scale-in-spring', delay: 850, duration: 500 },
    { selector: '.countdown-item:nth-child(3)', animation: 'animate-scale-in-spring', delay: 900, duration: 500 },
    { selector: '.countdown-item:nth-child(4)', animation: 'animate-scale-in-spring', delay: 950, duration: 500 }
  ];

  // Add default steps unless custom steps provided
  if (!options.steps || options.steps.length === 0) {
    sequence.addSteps(defaultSteps);
  } else {
    sequence.addSteps(options.steps);
  }

  return sequence;
}

/**
 * Utility: Create a promise that resolves after an element's animation ends
 */
function waitForAnimation(element, animationName) {
  return new Promise(resolve => {
    const handler = (e) => {
      if (e.animationName === animationName) {
        element.removeEventListener('animationend', handler);
        resolve();
      }
    };
    element.addEventListener('animationend', handler);
    
    // Fallback timeout
    setTimeout(() => {
      element.removeEventListener('animationend', handler);
      resolve();
    }, 5000);
  });
}

/**
 * Utility: Play a sequence of animations on multiple elements with stagger
 * @param {Element[]|NodeList} elements - Elements to animate
 * @param {string} animationClass - Animation class to apply
 * @param {Object} options - Stagger options
 * @param {number} options.stagger - Delay between each element (ms)
 * @param {number} options.startDelay - Initial delay (ms)
 * @param {Function} options.onComplete - Called when all complete
 */
function staggerAnimation(elements, animationClass, options = {}) {
  const stagger = options.stagger || 100;
  const startDelay = options.startDelay || 0;
  const onComplete = options.onComplete || null;
  
  return new Promise(resolve => {
    const elementArray = Array.from(elements);
    let completed = 0;
    
    elementArray.forEach((element, index) => {
      setTimeout(() => {
        element.style.animation = `var(--animate-${animationClass.replace('animate-', '')})`;
        
        element.addEventListener('animationend', function handler() {
          element.removeEventListener('animationend', handler);
          element.style.animation = '';
          element.style.willChange = 'auto';
          completed++;
          
          if (completed === elementArray.length && onComplete) {
            onComplete();
          }
        }, { once: true });
      }, startDelay + index * stagger);
    });
    
    // Resolve when all done
    const totalTime = startDelay + (elementArray.length - 1) * stagger + 800;
    setTimeout(resolve, totalTime);
  });
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createIntroSequence,
    createWeddingInvitationIntro,
    staggerAnimation,
    waitForAnimation
  };
} else if (typeof define === 'function' && define.amd) {
  define([], () => ({
    createIntroSequence,
    createWeddingInvitationIntro,
    staggerAnimation,
    waitForAnimation
  }));
} else {
  window.IntroSequence = {
    createIntroSequence,
    createWeddingInvitationIntro,
    staggerAnimation,
    waitForAnimation
  };
}