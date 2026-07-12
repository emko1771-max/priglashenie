/**
 * Ambient Animation Helpers - Canvas particles & CSS floating elements
 * Vanilla JS, respects prefers-reduced-motion, < 4KB gzipped
 * 
 * Usage:
 *   import { createParticleSystem, createFloatingElements } from './ambient.js';
 *   const particles = createParticleSystem(container, { particleCount: 30, colors: ['#C9A962'] });
 *   const floating = createFloatingElements(container, '.petal', { floatDistance: 20, floatDuration: 6000 });
 *   particles.pause(); floating.resume(); particles.destroy();
 */

(function (global) {
  'use strict';

  // ==========================================================================
  // REDUCED MOTION DETECTION
  // ==========================================================================
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = reducedMotionQuery.matches;

  reducedMotionQuery.addEventListener('change', (e) => {
    prefersReducedMotion = e.matches;
    // Notify all active systems
    particleSystems.forEach(sys => sys._onReducedMotionChange());
    floatingSystems.forEach(sys => sys._onReducedMotionChange());
  });

  // ==========================================================================
  // TRACK ACTIVE SYSTEMS FOR GLOBAL REDUCED MOTION HANDLING
  // ==========================================================================
  const particleSystems = new Set();
  const floatingSystems = new Set();

  // ==========================================================================
  // UTILITIES
  // ==========================================================================
  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // ==========================================================================
  // PARTICLE SYSTEM (Canvas-based)
  // ==========================================================================
  const defaultParticleConfig = {
    particleCount: 30,
    colors: ['#C9A962', '#D4B876', '#E8D5C4', '#F5E6D3'],
    sizeRange: [2, 6],
    speedRange: [0.2, 0.8],
    direction: 'up', // 'up', 'down', 'left', 'right', 'random'
    lifespan: 8000, // ms
    spawnRate: 100, // ms between spawns
    opacityRange: [0.3, 0.8],
    shape: 'circle', // 'circle', 'square', 'heart', 'star'
    driftRange: [-30, 30], // horizontal drift in pixels
    fadeInDuration: 500,
    fadeOutDuration: 1000,
    gravity: 0, // positive = downward pull
    wind: 0 // horizontal force
  };

  function createParticleSystem(container, config = {}) {
    if (!container) {
      console.warn('createParticleSystem: container is required');
      return null;
    }

    const cfg = { ...defaultParticleConfig, ...config };
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    let animationId = null;
    let lastTime = 0;
    let spawnTimer = 0;
    let particles = [];
    let isRunning = false;
    let isPaused = false;
    let destroyed = false;

    // Add canvas to container
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    container.style.position = container.style.position === 'static' ? 'relative' : container.style.position;
    container.appendChild(canvas);

    // Resize handler
    function resize() {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(dpr, dpr);
    }

    function handleResize() {
      resize();
    }

    window.addEventListener('resize', handleResize);
    resize();

    // Particle class
    class Particle {
      constructor() {
        this.reset();
        this.age = randomRange(0, cfg.lifespan);
      }

      reset() {
        this.x = randomRange(0, width);
        this.y = height + randomRange(0, height * 0.5);
        this.size = randomRange(...cfg.sizeRange);
        this.color = randomChoice(cfg.colors);
        this.opacity = randomRange(...cfg.opacityRange);
        this.targetOpacity = this.opacity;
        this.speed = randomRange(...cfg.speedRange);
        this.drift = randomRange(...cfg.driftRange);
        this.rotation = randomRange(0, Math.PI * 2);
        this.rotationSpeed = randomRange(-0.01, 0.01);
        this.life = 0;
        this.maxLife = cfg.lifespan;
        this.fadeIn = true;
        this.fadeOut = false;
        
        // Direction-based initial positioning
        switch (cfg.direction) {
          case 'down':
            this.y = -this.size;
            break;
          case 'left':
            this.x = width + this.size;
            break;
          case 'right':
            this.x = -this.size;
            break;
          case 'random':
            this.x = randomRange(-width * 0.5, width * 1.5);
            this.y = randomRange(-height * 0.5, height * 1.5);
            break;
        }
      }

      update(deltaTime) {
        this.life += deltaTime;
        const progress = this.life / this.maxLife;

        // Fade in
        if (this.fadeIn) {
          this.opacity = Math.min(this.opacity + deltaTime / cfg.fadeInDuration, this.targetOpacity);
          if (this.opacity >= this.targetOpacity) this.fadeIn = false;
        }

        // Fade out near end of life
        if (progress > 0.8 && !this.fadeOut) {
          this.fadeOut = true;
        }
        if (this.fadeOut) {
          this.opacity = Math.max(this.opacity - deltaTime / cfg.fadeOutDuration, 0);
        }

        // Movement based on direction
        switch (cfg.direction) {
          case 'up':
            this.y -= this.speed * deltaTime * 0.06;
            this.x += this.drift * deltaTime * 0.001;
            break;
          case 'down':
            this.y += this.speed * deltaTime * 0.06;
            this.x += this.drift * deltaTime * 0.001;
            break;
          case 'left':
            this.x -= this.speed * deltaTime * 0.06;
            this.y += this.drift * deltaTime * 0.001;
            break;
          case 'right':
            this.x += this.speed * deltaTime * 0.06;
            this.y += this.drift * deltaTime * 0.001;
            break;
          case 'random':
            this.x += (this.drift + cfg.wind) * deltaTime * 0.001;
            this.y += (this.speed + cfg.gravity) * deltaTime * 0.06;
            break;
        }

        this.rotation += this.rotationSpeed * deltaTime;

        // Apply wind and gravity
        this.x += cfg.wind * deltaTime * 0.001;
        this.y += cfg.gravity * deltaTime * 0.06;

        // Check bounds and recycle
        const margin = this.size * 2;
        if (
          this.y < -margin || 
          this.y > height + margin || 
          this.x < -margin || 
          this.x > width + margin ||
          this.life >= this.maxLife
        ) {
          this.reset();
          this.life = 0;
        }
      }

      draw() {
        if (this.opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const halfSize = this.size / 2;
        
        switch (cfg.shape) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            break;
            
          case 'square':
            ctx.fillStyle = this.color;
            ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
            break;
            
          case 'heart':
            ctx.beginPath();
            const h = this.size;
            ctx.moveTo(0, h * 0.3);
            ctx.bezierCurveTo(-h * 0.5, -h * 0.2, -h, h * 0.2, 0, h);
            ctx.bezierCurveTo(h, h * 0.2, h * 0.5, -h * 0.2, 0, h * 0.3);
            ctx.fillStyle = this.color;
            ctx.fill();
            break;
            
          case 'star':
            ctx.beginPath();
            const spikes = 5;
            const outerRadius = halfSize;
            const innerRadius = halfSize * 0.5;
            for (let i = 0; i < spikes * 2; i++) {
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const angle = (Math.PI * i) / spikes - Math.PI / 2;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            break;
        }

        ctx.restore();
      }
    }

    // Initialize particles
    function initParticles() {
      particles = [];
      for (let i = 0; i < cfg.particleCount; i++) {
        const p = new Particle();
        p.life = randomRange(0, cfg.lifespan);
        particles.push(p);
      }
    }

    // Animation loop
    function animate(time) {
      if (destroyed || isPaused || prefersReducedMotion) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = time - lastTime;
      lastTime = time;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Spawn new particles
      spawnTimer += deltaTime;
      while (spawnTimer >= cfg.spawnRate && particles.length < cfg.particleCount * 1.5) {
        particles.push(new Particle());
        spawnTimer -= cfg.spawnRate;
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update(deltaTime);
        p.draw();
        
        // Remove dead particles
        if (p.life >= p.maxLife && p.opacity <= 0) {
          particles.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    // Public API
    const system = {
      start() {
        if (!isRunning && !destroyed) {
          isRunning = true;
          isPaused = false;
          lastTime = performance.now();
          initParticles();
          animationId = requestAnimationFrame(animate);
        }
        return this;
      },

      pause() {
        isPaused = true;
        return this;
      },

      resume() {
        if (isRunning && !destroyed && !prefersReducedMotion) {
          isPaused = false;
          lastTime = performance.now();
        }
        return this;
      },

      stop() {
        isRunning = false;
        isPaused = true;
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        particles = [];
        ctx.clearRect(0, 0, width, height);
        return this;
      },

      destroy() {
        this.stop();
        destroyed = true;
        window.removeEventListener('resize', handleResize);
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        particleSystems.delete(system);
        return this;
      },

      setConfig(newConfig) {
        Object.assign(cfg, newConfig);
        return this;
      },

      getConfig() {
        return { ...cfg };
      },

      getCanvas() {
        return canvas;
      },

      getContext() {
        return ctx;
      },

      getParticleCount() {
        return particles.length;
      },

      _onReducedMotionChange() {
        if (prefersReducedMotion) {
          this.pause();
        } else if (isRunning && !isPaused) {
          this.resume();
        }
      }
    };

    // Register for global reduced motion handling
    particleSystems.add(system);

    // Auto-start unless explicitly disabled
    if (cfg.autoStart !== false) {
      system.start();
    }

    return system;
  }

  // ==========================================================================
  // FLOATING ELEMENTS (CSS-based, DOM elements)
  // ==========================================================================
  const defaultFloatingConfig = {
    floatDistance: 20, // pixels
    floatDuration: 6000, // ms
    rotationRange: [-3, 3], // degrees
    opacityRange: [0.4, 0.9],
    delayRange: [0, 3000], // initial delay
    staggerDelay: 200, // between elements
    easing: 'ease-in-out',
    direction: 'both', // 'up', 'down', 'both'
    scaleRange: [0.9, 1.1],
    autoGenerate: false, // if true, creates elements from selector
    generateCount: 10,
    generateHTML: '<div class="floating-petal">✿</div>', // HTML for auto-generated elements
    generateClass: 'floating-element',
    respectReducedMotion: true
  };

  function createFloatingElements(container, selector, config = {}) {
    if (!container) {
      console.warn('createFloatingElements: container is required');
      return null;
    }

    const cfg = { ...defaultFloatingConfig, ...config };
    let elements = [];
    let animationId = null;
    let isRunning = false;
    let isPaused = false;
    let destroyed = false;
    let startTime = 0;

    // Get or create elements
    function initElements() {
      if (cfg.autoGenerate) {
        // Create elements
        elements = [];
        for (let i = 0; i < cfg.generateCount; i++) {
          const el = document.createElement('div');
          el.className = cfg.generateClass;
          el.innerHTML = cfg.generateHTML;
          el.style.position = 'absolute';
          el.style.pointerEvents = 'none';
          el.style.willChange = 'transform, opacity';
          container.appendChild(el);
          elements.push(el);
        }
      } else {
        // Select existing elements
        const nodeList = container.querySelectorAll(selector);
        elements = Array.from(nodeList);
        
        // Apply base styles
        elements.forEach(el => {
          el.style.position = el.style.position === 'static' ? 'absolute' : el.style.position;
          el.style.pointerEvents = 'none';
          el.style.willChange = 'transform, opacity';
        });
      }

      // Set initial random positions
      elements.forEach((el, index) => {
        const rect = container.getBoundingClientRect();
        const x = randomRange(0, rect.width);
        const y = randomRange(0, rect.height);
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.opacity = randomRange(...cfg.opacityRange);
        el.style.transform = 'scale(' + randomRange(...cfg.scaleRange) + ')';
        el.style.transition = 'none';
        
        // Store animation properties on element
        el._floatProps = {
          baseX: x,
          baseY: y,
          distance: cfg.floatDistance * randomRange(0.5, 1.5),
          duration: cfg.floatDuration * randomRange(0.8, 1.2),
          rotationRange: cfg.rotationRange,
          delay: cfg.delayRange[0] + index * cfg.staggerDelay + randomRange(0, cfg.delayRange[1] - cfg.delayRange[0]),
          phase: randomRange(0, Math.PI * 2),
          scaleBase: randomRange(...cfg.scaleRange)
        };
      });
    }

    function animateFloating(time) {
      if (destroyed || isPaused || prefersReducedMotion) {
        animationId = requestAnimationFrame(animateFloating);
        return;
      }

      const elapsed = time - startTime;

      elements.forEach(el => {
        const props = el._floatProps;
        if (!props) return;

        const localTime = elapsed - props.delay;
        if (localTime < 0) return;

        const phase = (localTime / props.duration) * Math.PI * 2 + props.phase;
        
        // Vertical float
        const floatY = Math.sin(phase) * props.distance;
        
        // Horizontal drift
        const driftX = Math.cos(phase * 0.7) * props.distance * 0.5;
        
        // Rotation
        const rotation = Math.sin(phase * 0.5) * randomRange(...props.rotationRange);
        
        // Scale breathe
        const scale = props.scaleBase + Math.sin(phase * 0.3) * 0.05;

        // Apply transform
        const transform = `translate(${driftX}px, ${floatY}px) rotate(${rotation}deg) scale(${scale})`;
        el.style.transform = transform;
        el.style.transition = 'none'; // We handle animation via RAF
      });

      animationId = requestAnimationFrame(animateFloating);
    }

    const system = {
      start() {
        if (!isRunning && !destroyed) {
          initElements();
          isRunning = true;
          isPaused = false;
          startTime = performance.now();
          animationId = requestAnimationFrame(animateFloating);
        }
        return this;
      },

      pause() {
        isPaused = true;
        return this;
      },

      resume() {
        if (isRunning && !destroyed && !prefersReducedMotion) {
          isPaused = false;
          startTime = performance.now() - (performance.now() - startTime); // Preserve elapsed
        }
        return this;
      },

      stop() {
        isRunning = false;
        isPaused = true;
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        // Reset elements
        elements.forEach(el => {
          el.style.transform = '';
          el.style.transition = '';
          el.style.willChange = 'auto';
        });
        return this;
      },

      destroy() {
        this.stop();
        destroyed = true;
        // Remove auto-generated elements
        if (cfg.autoGenerate) {
          elements.forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
          });
        }
        elements = [];
        floatingSystems.delete(system);
        return this;
      },

      addElement(element) {
        if (element && !elements.includes(element)) {
          element.style.position = 'absolute';
          element.style.pointerEvents = 'none';
          element.style.willChange = 'transform, opacity';
          const rect = container.getBoundingClientRect();
          element._floatProps = {
            baseX: randomRange(0, rect.width),
            baseY: randomRange(0, rect.height),
            distance: cfg.floatDistance * randomRange(0.5, 1.5),
            duration: cfg.floatDuration * randomRange(0.8, 1.2),
            rotationRange: cfg.rotationRange,
            delay: elements.length * cfg.staggerDelay,
            phase: randomRange(0, Math.PI * 2),
            scaleBase: randomRange(...cfg.scaleRange)
          };
          container.appendChild(element);
          elements.push(element);
        }
        return this;
      },

      removeElement(element) {
        const index = elements.indexOf(element);
        if (index > -1) {
          elements.splice(index, 1);
          if (element.parentNode) element.parentNode.removeChild(element);
        }
        return this;
      },

      setConfig(newConfig) {
        Object.assign(cfg, newConfig);
        return this;
      },

      getConfig() {
        return { ...cfg };
      },

      getElements() {
        return [...elements];
      },

      _onReducedMotionChange() {
        if (prefersReducedMotion) {
          this.pause();
          // Make elements static positions for reduced motion
          elements.forEach(el => {
            el.style.transform = 'none';
            el.style.opacity = '1';
          });
        } else if (isRunning && !isPaused) {
          this.resume();
        }
      }
    };

    // Register for global reduced motion handling
    floatingSystems.add(system);

    // Auto-start unless explicitly disabled
    if (cfg.autoStart !== false) {
      system.start();
    }

    return system;
  }

  // ==========================================================================
  // CONFETTI BURST (Canvas-based celebration effect)
  // ==========================================================================
  function createConfettiBurst(container, config = {}) {
    const cfg = {
      pieceCount: 50,
      colors: ['#C9A962', '#D4B876', '#E8D5C4', '#F5E6D3', '#FFFFFF', '#FFD700', '#FF6B9D', '#4EC0CA'],
      shapes: ['square', 'circle', 'triangle'],
      sizeRange: [6, 12],
      velocityRange: [5, 15],
      angleRange: [0, Math.PI * 2],
      gravity: 0.3,
      friction: 0.99,
      lifetime: 3000,
      fadeOut: true,
      zIndex: 1000,
      ...config
    };

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    let pieces = [];
    let animationId = null;
    let startTime = 0;
    let destroyed = false;

    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = cfg.zIndex;
    document.body.appendChild(canvas);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(dpr, dpr);
    }

    window.addEventListener('resize', resize);
    resize();

    class ConfettiPiece {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = randomRange(...cfg.sizeRange);
        this.color = randomChoice(cfg.colors);
        this.shape = randomChoice(cfg.shapes);
        this.rotation = randomRange(0, Math.PI * 2);
        this.rotationSpeed = randomRange(-0.1, 0.1);
        this.velocity = randomRange(...cfg.velocityRange);
        this.angle = randomRange(...cfg.angleRange);
        this.vx = Math.cos(this.angle) * this.velocity;
        this.vy = Math.sin(this.angle) * this.velocity;
        this.life = 0;
        this.maxLife = cfg.lifetime;
        this.opacity = 1;
      }

      update(deltaTime) {
        this.life += deltaTime;
        const progress = this.life / this.maxLife;

        // Physics
        this.vy += cfg.gravity * deltaTime * 0.06;
        this.vx *= cfg.friction;
        this.vy *= cfg.friction;

        this.x += this.vx * deltaTime * 0.06;
        this.y += this.vy * deltaTime * 0.06;
        this.rotation += this.rotationSpeed * deltaTime * 0.06;

        if (cfg.fadeOut) {
          this.opacity = 1 - progress;
        }

        return progress >= 1;
      }

      draw() {
        if (this.opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const half = this.size / 2;

        ctx.fillStyle = this.color;
        
        switch (this.shape) {
          case 'square':
            ctx.fillRect(-half, -half, this.size, this.size);
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, half, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'triangle':
            ctx.beginPath();
            ctx.moveTo(0, -half);
            ctx.lineTo(half, half);
            ctx.lineTo(-half, half);
            ctx.closePath();
            ctx.fill();
            break;
        }

        ctx.restore();
      }
    }

    function burst(x, y, count) {
      for (let i = 0; i < (count || cfg.pieceCount); i++) {
        pieces.push(new ConfettiPiece(x, y));
      }
    }

    function animate(time) {
      if (destroyed) return;

      if (!startTime) startTime = time;
      const deltaTime = time - startTime;
      startTime = time;

      ctx.clearRect(0, 0, width, height);

      for (let i = pieces.length - 1; i >= 0; i--) {
        const piece = pieces[i];
        const dead = piece.update(deltaTime);
        piece.draw();
        if (dead) pieces.splice(i, 1);
      }

      if (pieces.length > 0) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Auto-cleanup after burst completes
        setTimeout(() => {
          if (!destroyed) destroy();
        }, 100);
      }
    }

    function destroy() {
      destroyed = true;
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }

    // Expose public API
    return {
      burst(x, y, count) {
        if (destroyed) return this;
        if (prefersReducedMotion) return this;
        burst(x, y, count);
        if (!animationId) {
          startTime = 0;
          animationId = requestAnimationFrame(animate);
        }
        return this;
      },

      burstAtElement(element, count) {
        const rect = element.getBoundingClientRect();
        this.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, count);
        return this;
      },

      destroy() {
        destroy();
        return this;
      },

      isDestroyed() {
        return destroyed;
      }
    };
  }

  // ==========================================================================
  // SPARKLE TRAIL (Mouse/touch following sparkles)
  // ==========================================================================
  function createSparkleTrail(config = {}) {
    const cfg = {
      maxSparklies: 20,
      colors: ['#C9A962', '#FFD700', '#FFFFFF', '#FF6B9D'],
      sizeRange: [3, 8],
      lifetime: 800,
      spawnRate: 50,
      followCursor: true,
      followTouch: true,
      zIndex: 9999,
      ...config
    };

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    let sparklies = [];
    let animationId = null;
    let lastTime = 0;
    let spawnTimer = 0;
    let mouseX = -9999;
    let mouseY = -9999;
    let isActive = false;
    let destroyed = false;

    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = cfg.zIndex;
    document.body.appendChild(canvas);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(dpr, dpr);
    }

    window.addEventListener('resize', resize);
    resize();

    function onMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function onTouchMove(e) {
      if (e.touches[0]) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    }

    if (cfg.followCursor) {
      document.addEventListener('mousemove', onMouseMove, { passive: true });
    }
    if (cfg.followTouch) {
      document.addEventListener('touchmove', onTouchMove, { passive: true });
    }

    class Sparkle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = randomRange(...cfg.sizeRange);
        this.color = randomChoice(cfg.colors);
        this.rotation = randomRange(0, Math.PI * 2);
        this.rotationSpeed = randomRange(-0.2, 0.2);
        this.life = 0;
        this.maxLife = cfg.lifetime;
        this.opacity = 1;
        this.vx = randomRange(-0.5, 0.5);
        this.vy = randomRange(-1, -0.2);
      }

      update(deltaTime) {
        this.life += deltaTime;
        const progress = this.life / this.maxLife;
        
        this.x += this.vx * deltaTime * 0.06;
        this.y += this.vy * deltaTime * 0.06;
        this.rotation += this.rotationSpeed * deltaTime * 0.06;
        this.opacity = 1 - progress;
        this.size *= 0.995;

        return progress >= 1;
      }

      draw() {
        if (this.opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const half = this.size / 2;
        
        // Draw sparkle (4-point star)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI / 2) - Math.PI / 4;
          const outerX = Math.cos(angle) * this.size;
          const outerY = Math.sin(angle) * this.size;
          const innerX = Math.cos(angle + Math.PI / 4) * half;
          const innerY = Math.sin(angle + Math.PI / 4) * half;
          if (i === 0) ctx.moveTo(outerX, outerY);
          else ctx.lineTo(outerX, outerY);
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    function animate(time) {
      if (destroyed) return;

      const deltaTime = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Spawn new sparklies
      if (isActive && mouseX > 0 && mouseY > 0) {
        spawnTimer += deltaTime;
        while (spawnTimer >= cfg.spawnRate && sparklies.length < cfg.maxSparklies) {
          sparklies.push(new Sparkle(mouseX + randomRange(-10, 10), mouseY + randomRange(-10, 10)));
          spawnTimer -= cfg.spawnRate;
        }
      }

      // Update and draw
      for (let i = sparklies.length - 1; i >= 0; i--) {
        const s = sparklies[i];
        const dead = s.update(deltaTime);
        s.draw();
        if (dead) sparklies.splice(i, 1);
      }

      animationId = requestAnimationFrame(animate);
    }

    function start() {
      if (!isActive && !destroyed && !prefersReducedMotion) {
        isActive = true;
        lastTime = performance.now();
        animationId = requestAnimationFrame(animate);
      }
    }

    function stop() {
      isActive = false;
    }

    function destroy() {
      destroyed = true;
      stop();
      if (animationId) cancelAnimationFrame(animationId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }

    // Reduced motion handling
    const handleReducedMotion = (e) => {
      if (e.matches) stop();
    };
    reducedMotionQuery.addEventListener('change', handleReducedMotion);

    if (prefersReducedMotion) {
      isActive = false;
    } else {
      start();
    }

    return {
      start,
      stop,
      destroy,
      setConfig(newConfig) { Object.assign(cfg, newConfig); },
      isActive: () => isActive
    };
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================
  const Ambient = {
    createParticleSystem,
    createFloatingElements,
    createConfettiBurst,
    createSparkleTrail,
    
    // Global control
    pauseAll() {
      particleSystems.forEach(s => s.pause());
      floatingSystems.forEach(s => s.pause());
    },
    
    resumeAll() {
      particleSystems.forEach(s => s.resume());
      floatingSystems.forEach(s => s.resume());
    },
    
    stopAll() {
      particleSystems.forEach(s => s.stop());
      floatingSystems.forEach(s => s.stop());
    },
    
    destroyAll() {
      particleSystems.forEach(s => s.destroy());
      floatingSystems.forEach(s => s.destroy());
    },
    
    // Check reduced motion
    prefersReducedMotion: () => prefersReducedMotion,
    
    // Utility
    randomRange,
    randomChoice
  };

  // Export for different module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Ambient;
  } else if (typeof define === 'function' && define.amd) {
    define([], () => Ambient);
  } else {
    window.Ambient = Ambient;
  }

})(typeof window !== 'undefined' ? window : this);