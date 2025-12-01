/* CodeMismatch Theme - Optimized JavaScript */

// Wave defaults
const WAVE_DEFAULTS = {
  speed: 0.896,
  freq: 0.198,
  amp: 1.356,
  steepness: 1.4
};

const WAVE_LIMITS = {
  speed: { min: 0, max: 5 },
  freq: { min: 0.1, max: 3 },
  amp: { min: 0, max: 3 },
  steepness: { min: 0.1, max: 10 }
};

const CODE_BINARY = ['0', '1'];
const CODE_HEX = ['0x0F', '0x4F', '0xA1', '0x7E', '0x3C'];
const CODE_GRADIENT = {
  // Blue → cyan → indigo → purple → pink (pre‑knob version)
  light: ['#3b82f6', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899'],
  dark: ['#93c5fd', '#67e8f9', '#a5b4fc', '#c4b5fd', '#f9a8d4']
};

// State
let state = {
  currentPage: 'home',
  currentTheme: 'void',
  brandColor: '#6600ff',
  ambientColor: '#000000',
  messages: [{
    id: 'init',
    role: 'model',
    text: "I am The Architect. I serve as the cognitive interface for CodeMismatch. How may I assist with your enterprise strategy?"
  }],
  wave: {
    params: { ...WAVE_DEFAULTS },
    renderMode: 'code' // 'code' | 'lines'
  }
};

// Theme Definitions
const THEMES = {
  void: {
    variables: {
      '--bg-base': '#020408',
      '--bg-surface': '#0f1419',
      '--bg-surface-hover': '#1a202c',
      '--text-main': '#f8fafc',
      '--text-muted': '#9ca3af',
      '--border-color': '#1a202c',
      '--card-border': '#1a202c'
    },
    isDark: true
  },
  azure: {
    variables: {
      '--bg-base': '#f8fafc',
      '--bg-surface': '#ffffff',
      '--bg-surface-hover': '#f1f5f9',
      '--text-main': '#0f172a',
      '--text-muted': '#64748b',
      '--border-color': '#e2e8f0',
      '--card-border': '#e2e8f0'
    },
    isDark: false
  },
  paper: {
    variables: {
      '--bg-base': '#fafafa',
      '--bg-surface': '#ffffff',
      '--bg-surface-hover': '#f1f5f9',
      '--text-main': '#0f172a',
      '--text-muted': '#64748b',
      '--border-color': '#cbd5e1',
      '--card-border': '#e2e8f0'
    },
    isDark: false
  }
};

// Wave init guard
let waveInitialized = false;

/* INITIALIZATION */
document.addEventListener('DOMContentLoaded', function () {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  if (window.setTheme) {
    window.setTheme(state.currentTheme);
  } else {
    setTheme(state.currentTheme);
  }
  resetColors();

  // Handle initial page from URL hash
  const hash = window.location.hash.slice(1) || 'home';
  navigateTo(hash, false);

  renderChat();

  // Event listeners
  const brandPicker = document.getElementById('brand-color-picker');
  const ambientPicker = document.getElementById('ambient-color-picker');
  const chatInput = document.getElementById('chat-input');

  if (brandPicker) brandPicker.addEventListener('input', (e) => updateBrandColor(e.target.value));
  if (ambientPicker) ambientPicker.addEventListener('input', (e) => updateAmbientColor(e.target.value));
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatSend();
      }
    });
  }

  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
      navigateTo(e.state.page, false);
    }
  });
});

/* NAVIGATION with History Support */
function navigateTo(pageId, pushState = true) {
  state.currentPage = pageId;

  // Update URL and browser history
  if (pushState) {
    window.history.pushState({ page: pageId }, '', `#${pageId}`);
  }

  // Reset active states
  document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.remove('text-brand-600', 'font-bold');
  });

  // Highlight nav
  const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (activeLink) activeLink.classList.add('text-brand-600', 'font-bold');

  // Show sections
  const sectionMap = {
    'home': ['section-hero', 'section-services', 'section-work'],
    'services': ['section-services'],
    'work': ['section-work'],
    'contact': ['section-contact'],
    'architect': ['section-architect'],
    'open_source': ['section-placeholder'],
    'blog': ['section-placeholder']
  };

  const sections = sectionMap[pageId] || [];
  sections.forEach(id => document.getElementById(id)?.classList.add('active'));

  // Update placeholder title
  if (pageId === 'open_source') {
    const title = document.getElementById('placeholder-title');
    if (title) title.innerText = "Open Source Initiatives";
  } else if (pageId === 'blog') {
    const title = document.getElementById('placeholder-title');
    if (title) title.innerText = "Engineering Blog";
  }

  // Special handling for architect page
  if (pageId === 'architect') {
    setTimeout(() => {
      const container = document.getElementById('chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }

  if (pageId === 'home') {
    setupWaveAnimation();
  }

  window.scrollTo(0, 0);
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('hidden');
}

function toggleMobileProducts() {
  const list = document.getElementById('mobile-products-list');
  const icon = document.getElementById('mobile-product-icon');
  if (list) {
    list.classList.toggle('hidden');
    if (icon) icon.style.transform = list.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
  }
}

/* THEMING */
function setTheme(themeKey) {
  state.currentTheme = themeKey;
  const theme = THEMES[themeKey];
  const root = document.documentElement;

  // Apply CSS variables
  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Update theme buttons
  ['void', 'azure', 'paper'].forEach(k => {
    const btn = document.getElementById(`btn-theme-${k}`);
    if (btn) {
      if (k === themeKey) {
        btn.className = "w-full text-left px-3 py-2 rounded font-mono text-xs bg-brand-600 text-white";
      } else {
        btn.className = "w-full text-left px-3 py-2 rounded font-mono text-xs hover:bg-skin-surface-hover text-skin-text";
      }
    }
  });

  // Toggle slider layout based on theme
  const horizontalControls = document.getElementById('wave-controls-horizontal');
  const verticalControls = document.getElementById('wave-controls-vertical');
  const knobControls = document.getElementById('wave-controls-knob');

  if (themeKey === 'paper') {
    // Paper: vertical faders
    if (horizontalControls) horizontalControls.classList.add('hidden');
    if (verticalControls) verticalControls.classList.remove('hidden');
    if (knobControls) knobControls.classList.add('hidden');
  } else if (themeKey === 'void') {
    // Void: rotary knobs
    if (horizontalControls) horizontalControls.classList.add('hidden');
    if (verticalControls) verticalControls.classList.add('hidden');
    if (knobControls) knobControls.classList.remove('hidden');
  } else {
    // Azure: horizontal sliders
    if (horizontalControls) horizontalControls.classList.remove('hidden');
    if (verticalControls) verticalControls.classList.add('hidden');
    if (knobControls) knobControls.classList.add('hidden');
  }
}

function toggleThemePanel() {
  const panel = document.getElementById('theme-panel');
  if (panel) panel.classList.toggle('hidden');
}

/* COLOR GENERATION */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function mixColors(c1, c2, weight) {
  return {
    r: Math.round(c1.r * (1 - weight) + c2.r * weight),
    g: Math.round(c1.g * (1 - weight) + c2.g * weight),
    b: Math.round(c1.b * (1 - weight) + c2.b * weight)
  };
}

function toRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function generatePalette(baseHex, prefix) {
  const base = hexToRgb(baseHex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  const mixWithBase = (color, weight) => {
    const mixed = mixColors(color, base, weight);
    return `${mixed.r} ${mixed.g} ${mixed.b}`;
  };

  const palette = {};
  [0.05, 0.1, 0.25, 0.45, 0.70, 0.85].forEach((w, i) => {
    const levels = [50, 100, 200, 300, 400, 500];
    palette[`--${prefix}-${levels[i]}`] = mixWithBase(white, w);
  });
  palette[`--${prefix}-600`] = `${base.r} ${base.g} ${base.b}`;
  [0.2, 0.35, 0.55, 0.75].forEach((w, i) => {
    const levels = [700, 800, 900, 950];
    palette[`--${prefix}-${levels[i]}`] = mixWithBase(black, w);
  });
  return palette;
}

function updateBrandColor(hex) {
  state.brandColor = hex;
  const picker = document.getElementById('brand-color-picker');
  const label = document.getElementById('brand-color-label');
  if (picker) picker.value = hex;
  if (label) label.innerText = hex;
  const palette = generatePalette(hex, 'brand');
  Object.entries(palette).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
}

function updateAmbientColor(hex) {
  state.ambientColor = hex;
  const picker = document.getElementById('ambient-color-picker');
  const label = document.getElementById('ambient-color-label');
  if (picker) picker.value = hex;
  if (label) label.innerText = hex;
  const palette = generatePalette(hex, 'ambient');
  Object.entries(palette).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
}

function resetColors() {
  // Mirror theme defaults from main.js
  if (state.currentTheme === 'paper') {
    updateBrandColor('#c800ff');
    updateAmbientColor('#ffffff');
  } else if (state.currentTheme === 'void') {
    updateBrandColor('#6600ff');
    updateAmbientColor('#000000');
  } else {
    // Azure
    updateBrandColor('#3b82f6');
    updateAmbientColor('#f0f9ff');
  }
}

/* WAVE ANIMATION */
function clampWaveParam(key, value) {
  const limits = WAVE_LIMITS[key];
  if (!limits) return value;
  const numeric = parseFloat(value);
  if (Number.isNaN(numeric)) return limits.min;
  return Math.min(limits.max, Math.max(limits.min, numeric));
}

function setupWaveAnimation() {
  if (waveInitialized) return;
  waveInitialized = true;

  const canvas = document.getElementById('wave-canvas');
  if (!canvas) {
    console.error("Wave canvas not found!");
    return;
  }

  const ctx = canvas.getContext('2d');
  let width, height;

  // Wave state
  const baseParams = state.wave.params;

  function resize() {
    if (!canvas.parentElement) return;
    const newWidth = canvas.parentElement.offsetWidth;
    const newHeight = canvas.parentElement.offsetHeight;
    if (!newWidth || !newHeight) return;
    width = newWidth;
    height = newHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  window.addEventListener('resize', resize);
  resize();

  // Controls + labels (initialized lazily after first frame)
  let sliderBindings;

  const updateKnobVisual = (key) => {
    const meta = sliderBindings?.[key];
    if (!meta || !meta.knob) return;
    const svg = document.querySelector(`svg[data-knob="${key}"]`);
    if (!svg) return;
    const arcSvg = svg.querySelector('.knob-arc');
    const handle = svg.querySelector('.knob-handle');
    if (!arcSvg) return;

    const limits = WAVE_LIMITS[key];
    const value = baseParams[key];
    const norm = limits ? (value - limits.min) / (limits.max - limits.min) : 0;
    const clamped = Math.min(1, Math.max(0, norm));

    const radius = 15;
    const centerX = 18;
    const centerY = 18;
    const startDeg = 120;   // approx 7 o'clock
    const endDeg = 410;     // approx 5 o'clock (120 + 290° sweep)

    if (clamped <= 0) {
      arcSvg.setAttribute('d', '');
    } else {
      const currentDeg = startDeg + (endDeg - startDeg) * clamped;
      const startRad = (startDeg * Math.PI) / 180;
      const currentRad = (currentDeg * Math.PI) / 180;

      const x0 = centerX + radius * Math.cos(startRad);
      const y0 = centerY + radius * Math.sin(startRad);
      const x1 = centerX + radius * Math.cos(currentRad);
      const y1 = centerY + radius * Math.sin(currentRad);

      const sweep = 1; // clockwise
      const arcDeg = currentDeg - startDeg;
      const largeArcFlag = arcDeg > 180 ? 1 : 0;

      const d = `M ${x0} ${y0} A ${radius} ${radius} 0 ${largeArcFlag} ${sweep} ${x1} ${y1}`;
      arcSvg.setAttribute('d', d);
    }

    if (handle) {
      const startAngle = (startDeg * Math.PI) / 180;
      const endAngle = (endDeg * Math.PI) / 180;
      const angle = startAngle + (endAngle - startAngle) * clamped;
      const handleRadius = radius;
      const cx = centerX + handleRadius * Math.cos(angle);
      const cy = centerY + handleRadius * Math.sin(angle);
      handle.setAttribute('cx', cx.toString());
      handle.setAttribute('cy', cy.toString());
    }
  };

  const syncParamUI = (key) => {
    const meta = sliderBindings?.[key];
    if (!meta) return;
    const value = baseParams[key];
    if (meta.horizontal) meta.horizontal.value = value;
    if (meta.vertical) meta.vertical.value = value;
    if (meta.labelH) meta.labelH.innerText = meta.formatH ? meta.formatH(value) : value.toFixed(3);
    if (meta.labelV) meta.labelV.innerText = meta.formatV ? meta.formatV(value) : value.toFixed(3);
    if (meta.knob) meta.knob.value = value;
    if (meta.labelK) meta.labelK.innerText = meta.formatK ? meta.formatK(value) : value.toFixed(3);
    updateKnobVisual(key);
  };

  const setParam = (key, value) => {
    baseParams[key] = clampWaveParam(key, value);
    syncParamUI(key);
  };

  const setupWaveControls = () => {
    sliderBindings = {
      speed: {
        horizontal: document.getElementById('wave-speed'),
        vertical: document.getElementById('wave-speed-v'),
        knob: document.getElementById('wave-speed-knob'),
        labelH: document.getElementById('wave-speed-val'),
        labelV: document.getElementById('wave-speed-val-v'),
        labelK: document.getElementById('wave-speed-val-knob'),
        formatH: (v) => `${v.toFixed(3)}x`,
        formatV: (v) => v.toFixed(3),
        formatK: (v) => `${v.toFixed(3)}x`
      },
      freq: {
        horizontal: document.getElementById('wave-freq'),
        vertical: document.getElementById('wave-freq-v'),
        knob: document.getElementById('wave-freq-knob'),
        labelH: document.getElementById('wave-freq-val'),
        labelV: document.getElementById('wave-freq-val-v'),
        labelK: document.getElementById('wave-freq-val-knob'),
        formatH: (v) => `${v.toFixed(3)}x`,
        formatV: (v) => v.toFixed(3),
        formatK: (v) => `${v.toFixed(3)}x`
      },
      amp: {
        horizontal: document.getElementById('wave-amp'),
        vertical: document.getElementById('wave-amp-v'),
        knob: document.getElementById('wave-amp-knob'),
        labelH: document.getElementById('wave-amp-val'),
        labelV: document.getElementById('wave-amp-val-v'),
        labelK: document.getElementById('wave-amp-val-knob'),
        formatH: (v) => `${v.toFixed(3)}x`,
        formatV: (v) => v.toFixed(3),
        formatK: (v) => `${v.toFixed(3)}x`
      },
      steepness: {
        horizontal: document.getElementById('wave-steepness'),
        vertical: document.getElementById('wave-steepness-v'),
        knob: document.getElementById('wave-steepness-knob'),
        labelH: document.getElementById('wave-steepness-val'),
        labelV: document.getElementById('wave-steepness-val-v'),
        labelK: document.getElementById('wave-steepness-val-knob'),
        formatH: (v) => v.toFixed(3),
        formatV: (v) => v.toFixed(2),
        formatK: (v) => v.toFixed(2)
      }
    };

    // Controls Listeners
    Object.entries(sliderBindings).forEach(([key, meta]) => {
      if (meta.horizontal) meta.horizontal.addEventListener('input', (e) => setParam(key, e.target.value));
      if (meta.vertical) meta.vertical.addEventListener('input', (e) => setParam(key, e.target.value));
      if (meta.knob) meta.knob.addEventListener('input', (e) => setParam(key, e.target.value));
    });

    // Rotary Knob Interaction (circular drag)
    Object.entries(sliderBindings).forEach(([key, meta]) => {
      if (!meta.knob) return;
      const svg = document.querySelector(`svg[data-knob="${key}"]`);
      if (!svg) return;

      const limits = WAVE_LIMITS[key];
      const startDeg = 120;  // Start angle (7 o'clock)
      const endDeg = 410;     // End angle (120 + 290° sweep)
      const angleRange = endDeg - startDeg;
      const centerX = 18;     // SVG center X
      const centerY = 18;     // SVG center Y
      const radius = 15;      // Knob radius

      let isDragging = false;
      let lastAngle = null;

      const angleToValue = (angleDeg, prevAngle = null) => {
        if (prevAngle !== null) {
          const wrapThreshold = 180;
          let angleDiff = angleDeg - prevAngle;
          if (angleDiff > 180) angleDiff -= 360;
          if (angleDiff < -180) angleDiff += 360;
          if (Math.abs(angleDiff) > wrapThreshold) {
            angleDeg += angleDiff > 0 ? -360 : 360;
          }
        }

        let normalized = (angleDeg - startDeg) / angleRange;
        normalized = Math.max(0, Math.min(1, normalized));
        return limits.min + normalized * (limits.max - limits.min);
      };

      const valueToAngle = (value) => {
        const normalized = (value - limits.min) / (limits.max - limits.min);
        return startDeg + normalized * angleRange;
      };

      const getAngleFromEvent = (e) => {
        const rect = svg.getBoundingClientRect();
        const svgSize = rect.width;
        const scale = svgSize / 36;
        const mouseX = (e.clientX - rect.left) / scale;
        const mouseY = (e.clientY - rect.top) / scale;
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        if (angle >= 0 && angle < startDeg) {
          const currentValue = parseFloat(meta.knob.value);
          const normalized = (currentValue - limits.min) / (limits.max - limits.min);
          if (lastAngle !== null && lastAngle >= 360) {
            angle += 360;
          } else if (normalized > 0.4) {
            angle += 360;
          }
        }

        return angle;
      };

      const handleMouseDown = (e) => {
        isDragging = true;
        e.preventDefault();
        svg.style.cursor = 'grabbing';
        const currentValue = parseFloat(meta.knob.value);
        lastAngle = valueToAngle(currentValue);
        const angle = getAngleFromEvent(e);
        lastAngle = angle;
        const newValue = angleToValue(angle);
        setParam(key, newValue);
      };

      const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const angle = getAngleFromEvent(e);
        const newValue = angleToValue(angle, lastAngle);
        lastAngle = angle;
        setParam(key, newValue);
      };

      const handleMouseUp = (e) => {
        if (isDragging) {
          isDragging = false;
          lastAngle = null;
          svg.style.cursor = 'grab';
          e.preventDefault();
        }
      };

      meta.knob.style.pointerEvents = 'none';
      meta.knob.style.cursor = 'default';
      svg.style.cursor = 'grab';

      svg.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      const handleTouchStart = (e) => {
        isDragging = true;
        e.preventDefault();
        const touch = e.touches[0];
        const angle = getAngleFromEvent({ clientX: touch.clientX, clientY: touch.clientY });
        lastAngle = angle;
        const newValue = angleToValue(angle);
        setParam(key, newValue);
      };

      const handleTouchMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        const angle = getAngleFromEvent({ clientX: touch.clientX, clientY: touch.clientY });
        const newValue = angleToValue(angle, lastAngle);
        lastAngle = angle;
        setParam(key, newValue);
      };

      const handleTouchEnd = (e) => {
        if (isDragging) {
          isDragging = false;
          lastAngle = null;
          e.preventDefault();
        }
      };

      svg.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    });

    // Initialize labels from existing slider defaults
    Object.entries(sliderBindings).forEach(([key, meta]) => {
      const initialValue = meta.horizontal?.value ?? meta.vertical?.value ?? baseParams[key];
      setParam(key, initialValue);
    });
  };

  const toggle = document.getElementById('wave-toggle');
  const codeToggle = document.getElementById('wave-code-toggle');

  if (codeToggle) {
    state.wave.renderMode = codeToggle.checked ? 'code' : 'lines';
    codeToggle.addEventListener('change', () => {
      state.wave.renderMode = codeToggle.checked ? 'code' : 'lines';
    });
  }
  let time = 0;

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Check toggle
    if (toggle && !toggle.checked) {
      requestAnimationFrame(render);
      return;
    }

    const isDark = THEMES[state.currentTheme].isDark;
    const baseOpacity = isDark ? 0.9 : 0.6;
    const yAxis = height / 2;

    ctx.font = '700 11px "IBM Plex Mono", monospace';
    ctx.textBaseline = 'middle';

    const codePalette = isDark ? CODE_GRADIENT.light : CODE_GRADIENT.dark;
    const renderMode = state.wave.renderMode || 'code';

    const waves = [
      // Original Waves (Slow & Wide)
      { timeModifier: 1, lineWidth: 2, amplitude: 50, wavelength: 200, gradient: [`rgba(59, 130, 246, ${baseOpacity})`, `rgba(6, 182, 212, ${baseOpacity})`, `rgba(168, 85, 247, ${baseOpacity})`, `rgba(236, 72, 153, ${baseOpacity})`] },
      { timeModifier: 0.5, lineWidth: 1.5, amplitude: 140, wavelength: 300, gradient: [`rgba(30, 58, 138, ${baseOpacity * 0.8})`, `rgba(37, 99, 235, ${baseOpacity * 0.8})`, `rgba(79, 70, 229, ${baseOpacity * 0.8})`] },
      { timeModifier: 0.7, lineWidth: 1, amplitude: 90, wavelength: 240, gradient: [`rgba(88, 28, 135, ${baseOpacity * 0.7})`, `rgba(124, 58, 237, ${baseOpacity * 0.7})`, `rgba(30, 64, 175, ${baseOpacity * 0.7})`] },
      { timeModifier: 1.1, lineWidth: 0.5, amplitude: 30, wavelength: 120, gradient: [`rgba(59, 130, 246, ${baseOpacity * 0.4})`, `rgba(147, 197, 253, ${baseOpacity * 0.4})`] },

      // Symphony-Inspired Waves
      { timeModifier: 2, lineWidth: 1, amplitude: -50, wavelength: 15, gradient: [`rgba(59, 130, 246, ${baseOpacity})`, `rgba(6, 182, 212, ${baseOpacity})`] },
      { timeModifier: 1, lineWidth: 2, amplitude: -100, wavelength: 30, gradient: [`rgba(30, 58, 138, ${baseOpacity * 0.8})`, `rgba(37, 99, 235, ${baseOpacity * 0.8})`] },
      { timeModifier: 0.5, lineWidth: 1, amplitude: -200, wavelength: 60, gradient: [`rgba(88, 28, 135, ${baseOpacity * 0.7})`, `rgba(124, 58, 237, ${baseOpacity * 0.7})`] },
      { timeModifier: 0.25, lineWidth: 3, amplitude: -160, wavelength: 40, gradient: [`rgba(59, 130, 246, ${baseOpacity * 0.6})`, `rgba(147, 197, 253, ${baseOpacity * 0.6})`] },
      { timeModifier: 0.35, lineWidth: 2, amplitude: -240, wavelength: 70, gradient: [`rgba(168, 85, 247, ${baseOpacity * 0.5})`, `rgba(236, 72, 153, ${baseOpacity * 0.5})`] }
    ];

    waves.forEach((wave, index) => {
      // Apply Combined Parameters
      const effectiveAmp = wave.amplitude * baseParams.amp;
      const effectiveWavelength = wave.wavelength / baseParams.freq;
      const k = (2 * Math.PI) / effectiveWavelength;

      if (renderMode === 'lines') {
        ctx.beginPath();
        ctx.lineWidth = wave.lineWidth;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        wave.gradient.forEach((color, i) => gradient.addColorStop(i / (wave.gradient.length - 1), color));
        ctx.strokeStyle = gradient;

        for (let x = 0; x < width; x += 5) {
          const position = width > 0 ? x / width : 0;
          const decay = Math.pow(position, baseParams.steepness);
          const localAmp = effectiveAmp * decay;

          const y = yAxis +
            Math.sin(k * x + time * wave.timeModifier) * localAmp * Math.sin(time * 0.2 + index) +
            Math.cos(x * 0.01 + time) * (localAmp * 0.2);

          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        const step = 8;
        const streamSpeed = 90; // pixels per unit time

        for (let x = 0; x < width + step; x += step) {
          let phaseX = x - streamSpeed * time * (index % 2 === 0 ? 1 : -1);
          // wrap so glyphs continuously flow
          phaseX %= (width + step);
          if (phaseX < -step) phaseX += (width + step);

          const clampedX = Math.max(0, Math.min(width, phaseX));
          const position = width > 0 ? clampedX / width : 0;
          const decay = Math.pow(position, baseParams.steepness);
          const localAmp = effectiveAmp * decay;

          const y = yAxis +
            Math.sin(k * phaseX + time * wave.timeModifier) * localAmp * Math.sin(time * 0.2 + index) +
            Math.cos(phaseX * 0.01 + time) * (localAmp * 0.2);

          const flicker = 0.5 + 0.5 * Math.sin(time * 2 + x * 0.08 + index);
          const codeAlpha = Math.min(1, Math.max(0.4, baseOpacity * (0.6 + 0.4 * flicker)));
          const palettePos = Math.min(1, Math.max(0, position));
          const baseIndex = Math.floor(palettePos * (codePalette.length - 1));
          const colorIndex = (baseIndex + index) % codePalette.length;
          const baseHex = codePalette[colorIndex];
          ctx.fillStyle = toRgba(baseHex, codeAlpha);

          const sequenceIndex = Math.floor(x / step) + index * 3;
          // Mostly binary with slightly more frequent hex "spice"
          let token;
          if (sequenceIndex % 12 < 3) {
            // 3 out of every 12 positions are hex (~25%)
            const hexIndex = sequenceIndex % CODE_HEX.length;
            token = CODE_HEX[hexIndex];
          } else {
            const binIndex = sequenceIndex % CODE_BINARY.length;
            token = CODE_BINARY[binIndex];
          }

          ctx.fillText(token, phaseX, y);
        }
      }
    });

    time += 0.008 * baseParams.speed;
    requestAnimationFrame(render);
  }
  render();

  const scheduleControlsInit = () => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        setupWaveControls();
      }, { timeout: 500 });
    } else {
      setTimeout(setupWaveControls, 0);
    }
  };

  scheduleControlsInit();
}

/* CHAT */
function appendMessage(role, text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const isModel = role === 'model';
  const div = document.createElement('div');
  div.className = `flex gap-4 ${isModel ? 'flex-row' : 'flex-row-reverse'} animate-fade-in`;

  const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

  div.innerHTML = `
    <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center border ${isModel ? 'border-brand-600 bg-brand-600/10 text-brand-600' : 'border-skin-border bg-skin-base text-skin-muted'}">
      <i data-lucide="${isModel ? 'activity' : 'user'}" class="w-4 h-4"></i>
    </div>
    <div class="max-w-[85%] font-mono text-sm p-4 border shadow-sm ${isModel ? 'border-brand-600/30 bg-skin-base text-skin-text' : 'border-skin-border bg-skin-surface-hover text-skin-text'}">
      ${sanitizedText}
    </div>
  `;
  container.appendChild(div);

  if (typeof lucide !== 'undefined') lucide.createIcons();
  container.scrollTop = container.scrollHeight;
}

function renderChat() {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  container.innerHTML = '';
  state.messages.forEach(msg => appendMessage(msg.role, msg.text));
}

async function handleChatSend() {
  const inputEl = document.getElementById('chat-input');
  if (!inputEl) return;

  const text = inputEl.value.trim();
  if (!text) return;

  state.messages.push({ id: Date.now(), role: 'user', text });
  appendMessage('user', text);
  inputEl.value = '';

  const loading = document.getElementById('chat-loading');
  if (loading) loading.classList.remove('hidden');

  try {
    const responseText = "The Architect is currently offline. API integration required.";
    state.messages.push({ id: Date.now() + 1, role: 'model', text: responseText });
    appendMessage('model', responseText);
  } catch (err) {
    console.error(err);
    appendMessage('model', "Error: Signal lost.");
  } finally {
    if (loading) loading.classList.add('hidden');
  }
}

/* AI WAVE MODIFIER */
function parseWavePrompt(text) {
  const prompt = text.toLowerCase();
  const parsedParams = { ...state.wave.params };
  let matched = false;

  const applyPreset = (keywords, params) => {
    if (keywords.some((word) => prompt.includes(word))) {
      Object.entries(params).forEach(([key, value]) => {
        parsedParams[key] = clampWaveParam(key, value);
      });
      matched = true;
    }
  };

  applyPreset(['storm', 'thunder', 'chaos', 'angry', 'wild'], { speed: 2.4, freq: 1.5, amp: 2.1, steepness: 4.2 });
  applyPreset(['calm', 'gentle', 'serene', 'smooth', 'quiet'], { speed: 0.35, freq: 0.35, amp: 0.6, steepness: 0.9 });
  applyPreset(['fast', 'rapid', 'hurry', 'speed'], { speed: 1.8 });
  applyPreset(['slow', 'relax', 'drift', 'lag'], { speed: 0.45 });
  applyPreset(['choppy', 'tight', 'busy', 'jitter'], { freq: 1.6, steepness: 3.5 });
  applyPreset(['long', 'rolling', 'wide', 'swell'], { freq: 0.3 });
  applyPreset(['high', 'tall', 'big', 'huge'], { amp: 2.0 });
  applyPreset(['low', 'flat', 'shallow', 'small'], { amp: 0.7 });
  applyPreset(['sharp', 'spiky', 'pointy'], { steepness: 4.5 });
  applyPreset(['round', 'soft', 'smooth'], { steepness: 0.8 });

  return { params: parsedParams, matched };
}

function updateWaveControlsFromParams(params) {
  const controlMap = {
    speed: ['wave-speed', 'wave-speed-v'],
    freq: ['wave-freq', 'wave-freq-v'],
    amp: ['wave-amp', 'wave-amp-v'],
    steepness: ['wave-steepness', 'wave-steepness-v']
  };

  Object.entries(controlMap).forEach(([key, ids]) => {
    if (typeof params[key] === 'undefined') return;
    const value = clampWaveParam(key, params[key]);
    const target = ids.map(id => document.getElementById(id)).find(Boolean);
    if (target) {
      target.value = value;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

function applyWavePrompt() {
  const promptEl = document.getElementById('wave-prompt');
  if (!promptEl) return;

  const prompt = promptEl.value.trim();
  if (!prompt) return;

  console.log("AI Wave Prompt:", prompt);

  const { params, matched } = parseWavePrompt(prompt);

  if (matched) {
    updateWaveControlsFromParams(params);
  }

  // Feedback
  const btn = document.querySelector('button[onclick="applyWavePrompt()"]');
  if (btn) {
    const originalText = btn.innerText;
    btn.innerText = matched ? "Parameters Optimized" : "No Keywords Detected";
    btn.classList.toggle('bg-green-600', matched);
    btn.classList.toggle('bg-yellow-600', !matched);
    setTimeout(() => {
      btn.innerText = originalText;
      btn.classList.remove('bg-green-600', 'bg-yellow-600');
    }, 2000);
  }
}

// Global API
window.navigateTo = navigateTo;
window.toggleMobileMenu = toggleMobileMenu;
window.toggleMobileProducts = toggleMobileProducts;
window.setTheme = setTheme;
window.toggleThemePanel = toggleThemePanel;
window.updateBrandColor = updateBrandColor;
window.updateAmbientColor = updateAmbientColor;
window.resetColors = resetColors;
window.handleChatSend = handleChatSend;
window.applyWavePrompt = applyWavePrompt;
