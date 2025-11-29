/* CodeMismatch Theme - Optimized JavaScript */

// State
let state = {
  currentPage: 'home',
  currentTheme: 'azure',
  brandColor: '#00608a',
  ambientColor: '#0f172a',
  messages: [{
    id: 'init',
    role: 'model',
    text: "I am The Architect. I serve as the cognitive interface for CodeMismatch. How may I assist with your enterprise strategy?"
  }]
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

/* INITIALIZATION */
document.addEventListener('DOMContentLoaded', function () {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  setTheme(state.currentTheme);
  resetColors();
  setupWaveAnimation();

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
  updateBrandColor('#00608a');
  updateAmbientColor('#0f172a');
}

/* WAVE ANIMATION */
function setupWaveAnimation() {
  const canvas = document.getElementById('wave-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    width = canvas.parentElement.offsetWidth;
    height = canvas.parentElement.offsetHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  window.addEventListener('resize', resize);
  resize();

  let time = 0;

  function render() {
    ctx.clearRect(0, 0, width, height);
    const isDark = THEMES[state.currentTheme].isDark;
    const baseOpacity = isDark ? 0.9 : 0.6;
    const yAxis = height / 2;

    const waves = [
      // Original Waves (Slow & Wide)
      { timeModifier: 1, lineWidth: 2, amplitude: 50, wavelength: 200, gradient: [`rgba(59, 130, 246, ${baseOpacity})`, `rgba(6, 182, 212, ${baseOpacity})`, `rgba(168, 85, 247, ${baseOpacity})`, `rgba(236, 72, 153, ${baseOpacity})`] },
      { timeModifier: 0.5, lineWidth: 1.5, amplitude: 140, wavelength: 300, gradient: [`rgba(30, 58, 138, ${baseOpacity * 0.8})`, `rgba(37, 99, 235, ${baseOpacity * 0.8})`, `rgba(79, 70, 229, ${baseOpacity * 0.8})`] },
      { timeModifier: 0.7, lineWidth: 1, amplitude: 90, wavelength: 240, gradient: [`rgba(88, 28, 135, ${baseOpacity * 0.7})`, `rgba(124, 58, 237, ${baseOpacity * 0.7})`, `rgba(30, 64, 175, ${baseOpacity * 0.7})`] },
      { timeModifier: 1.1, lineWidth: 0.5, amplitude: 30, wavelength: 120, gradient: [`rgba(59, 130, 246, ${baseOpacity * 0.4})`, `rgba(147, 197, 253, ${baseOpacity * 0.4})`] },

      // Symphony-Inspired Waves (Fast, High Frequency, High Amplitude)
      { timeModifier: 2, lineWidth: 1, amplitude: -50, wavelength: 15, gradient: [`rgba(59, 130, 246, ${baseOpacity})`, `rgba(6, 182, 212, ${baseOpacity})`] },
      { timeModifier: 1, lineWidth: 2, amplitude: -100, wavelength: 30, gradient: [`rgba(30, 58, 138, ${baseOpacity * 0.8})`, `rgba(37, 99, 235, ${baseOpacity * 0.8})`] },
      { timeModifier: 0.5, lineWidth: 1, amplitude: -200, wavelength: 60, gradient: [`rgba(88, 28, 135, ${baseOpacity * 0.7})`, `rgba(124, 58, 237, ${baseOpacity * 0.7})`] },
      { timeModifier: 0.25, lineWidth: 3, amplitude: -160, wavelength: 40, gradient: [`rgba(59, 130, 246, ${baseOpacity * 0.6})`, `rgba(147, 197, 253, ${baseOpacity * 0.6})`] },
      { timeModifier: 0.35, lineWidth: 2, amplitude: -240, wavelength: 70, gradient: [`rgba(168, 85, 247, ${baseOpacity * 0.5})`, `rgba(236, 72, 153, ${baseOpacity * 0.5})`] }
    ];

    waves.forEach((wave, index) => {
      ctx.beginPath();
      ctx.lineWidth = wave.lineWidth;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      wave.gradient.forEach((color, i) => gradient.addColorStop(i / (wave.gradient.length - 1), color));
      ctx.strokeStyle = gradient;

      for (let x = 0; x < width; x += 5) {
        const k = (2 * Math.PI) / wave.wavelength;
        const y = yAxis +
          Math.sin(k * x + time * wave.timeModifier) * wave.amplitude * Math.sin(time * 0.2 + index) +
          Math.cos(x * 0.01 + time) * (wave.amplitude * 0.2);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    time += 0.008;
    requestAnimationFrame(render);
  }
  render();
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
