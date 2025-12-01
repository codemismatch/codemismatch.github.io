import { GoogleGenAI } from "https://esm.sh/@google/genai";

/* --- CONFIG --- */
const API_KEY = ''; // ENTER YOUR GEMINI API KEY HERE

/* --- STATE --- */
let state = {
    currentPage: 'home',
    currentTheme: 'void',
    brandColor: '#6600ff',
    ambientColor: '#000000',
    messages: [
      {
        id: 'init',
        role: 'model',
        text: "I am The Architect. I serve as the cognitive interface for CodeMismatch. How may I assist with your enterprise strategy?"
      }
    ]
};

const THEMES = {
    void: {
        variables: {
            '--bg-base': 'rgb(var(--ambient-950))',
            '--bg-surface': 'rgb(var(--ambient-900))',
            '--bg-surface-hover': 'rgb(var(--ambient-800))',
            '--text-main': '#f8fafc',
            '--text-muted': '#94a3b8',
            '--border-color': 'rgba(255,255,255,0.1)',
            '--slider-bg': '#ffffff' // White slider for Void (Dark)
        },
        gradientClass: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ambient-900 via-ambient-950 to-black',
        isDark: true,
        brand: '#6600ff', // Void Default
        ambient: '#000000'
    },
    azure: {
        variables: {
            '--bg-base': '#f0f9ff',
            '--bg-surface': '#ffffff',
            '--bg-surface-hover': '#e0f2fe',
            '--text-main': '#0f172a',
            '--text-muted': '#64748b',
            '--border-color': '#e2e8f0',
            '--slider-bg': '#e2e8f0' // Visible gray for Azure (Light)
        },
        gradientClass: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-ambient-50 to-ambient-100',
        isDark: false,
        brand: '#3b82f6', // Azure Default
        ambient: '#f0f9ff'
    },
    paper: {
        variables: {
            '--bg-base': '#ffffff',
            '--bg-surface': '#f8fafc',
            '--bg-surface-hover': '#f1f5f9',
            '--text-main': '#1e293b',
            '--text-muted': '#64748b',
            '--border-color': '#e2e8f0',
            '--slider-bg': 'rgb(var(--skin-base))' // Default skin base for Paper (Light)
        },
        gradientClass: 'bg-slate-50',
        isDark: false,
        brand: '#c800ff', // Paper Default
        ambient: '#ffffff'
    }
};

/* --- INIT --- */
window.onload = function() {
    lucide.createIcons();
    setTheme(state.currentTheme);
    resetColors(); // Apply defaults
    setupWaveAnimation();
    navigateTo('home');
    renderChat();
    
    // Input listeners
    document.getElementById('brand-color-picker').addEventListener('input', (e) => updateBrandColor(e.target.value));
    document.getElementById('ambient-color-picker').addEventListener('input', (e) => updateAmbientColor(e.target.value));
    
    // Chat Input Listener
     document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSend();
        }
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) {
            navigateToImpl(e.state.page, false);
        }
    });
    
    // Handle initial hash from URL
    const hash = window.location.hash.slice(1);
    if (hash) {
        navigateToImpl(hash, false);
    }
};

/* --- CHAT FUNCTIONALITY --- */
function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

function appendMessage(role, text) {
    const container = document.getElementById('chat-messages');
    const isModel = role === 'model';
    
    const div = document.createElement('div');
    div.className = `flex gap-4 ${isModel ? 'flex-row' : 'flex-row-reverse'} animate-fade-in`;
    
    // Note: In a real app we would sanitize 'text' to prevent XSS
    div.innerHTML = `
        <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center border ${isModel ? 'border-brand-600 bg-brand-600/10 text-brand-600' : 'border-skin-border bg-skin-base text-skin-muted'}">
            <i data-lucide="${isModel ? 'activity' : 'user'}" class="w-4 h-4"></i>
        </div>
        <div class="max-w-[85%] font-mono text-sm p-4 border shadow-sm ${isModel ? 'border-brand-600/30 bg-skin-base text-skin-text' : 'border-skin-border bg-skin-surface-hover text-skin-text'}">
            ${text.replace(/\n/g, '<br>')}
        </div>
    `;
    container.appendChild(div);
    lucide.createIcons();
    scrollToBottom();
}

function renderChat() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    state.messages.forEach(msg => appendMessage(msg.role, msg.text));
}

window.handleChatSend = async function() {
    const inputEl = document.getElementById('chat-input');
    const text = inputEl.value.trim();
    if (!text) return;
    
    // Add User Message
    state.messages.push({ id: Date.now(), role: 'user', text });
    appendMessage('user', text);
    inputEl.value = '';
    
    // Show Loading
    document.getElementById('chat-loading').classList.remove('hidden');
    scrollToBottom();
    
    try {
        // Call Gemini
        const history = state.messages.map(m => ({ role: m.role, text: m.text }));
        const responseText = await generateOracleResponse(history, text);
        
        // Add Model Message
        state.messages.push({ id: Date.now()+1, role: 'model', text: responseText });
        appendMessage('model', responseText);
    } catch (err) {
        console.error(err);
        appendMessage('model', "Error: Signal lost. Please verify API Key.");
    } finally {
        document.getElementById('chat-loading').classList.add('hidden');
    }
}

async function generateOracleResponse(history, newMessage) {
  if (!API_KEY) {
    return "Error: Uplink severed. (API_KEY missing in source code)";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const model = 'gemini-2.5-flash';
    
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: "You are 'The Architect', the sovereign AI consultant for CodeMismatch. We combine IBM-style enterprise architecture with elite hacker aesthetics. Your tone is sophisticated, professional, concise, and slightly detached (like a supercomputer). Domains: Cognitive Enterprise Architecture, Legacy Modernization, Sovereign Cloud. Use terms like 'symphony', 'orchestration', 'latency', 'decision units'.",
      },
      history: history.slice(0, -1).map(h => ({ // Exclude the very last user message we just added
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({
      message: newMessage
    });

    return result.text || "Computing... Signal unstable.";

  } catch (error) {
    console.error("Gemini Error:", error);
    return "Critical Error: Logic gate failure. Re-initializing.";
  }
};

/* --- NAVIGATION --- */
function navigateToImpl(pageId, pushState) {
    state.currentPage = pageId;
    
    // Update URL and browser history
    if (pushState !== false) {
        window.history.pushState({ page: pageId }, '', '#' + pageId);
    }
    
    // Reset active states
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('text-brand-600', 'font-bold'));
    
    // Highlight nav
    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if(activeLink) activeLink.classList.add('text-brand-600', 'font-bold');

    // Show sections based on logic
    if (pageId === 'home') {
        document.getElementById('section-hero').classList.add('active');
        document.getElementById('section-services').classList.add('active');
        document.getElementById('section-work').classList.add('active');
    } else if (pageId === 'services') {
        document.getElementById('section-services').classList.add('active');
    } else if (pageId === 'work') {
        document.getElementById('section-work').classList.add('active');
    } else if (pageId === 'contact') {
        document.getElementById('section-contact').classList.add('active');
    } else if (pageId === 'architect') {
         document.getElementById('section-architect').classList.add('active');
         setTimeout(scrollToBottom, 100);
    } else if (pageId === 'open_source') {
         document.getElementById('placeholder-title').innerText = "Open Source Initiatives";
         document.getElementById('section-placeholder').classList.add('active');
    } else if (pageId === 'blog') {
         document.getElementById('placeholder-title').innerText = "Engineering Blog";
         document.getElementById('section-placeholder').classList.add('active');
    }
    
    window.scrollTo(0,0);
}

window.navigateTo = function(pageId) {
    navigateToImpl(pageId, true);
};

window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('mobile-menu-icon');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('flex');
    } else {
        menu.classList.add('hidden');
        menu.classList.remove('flex');
    }
};

window.toggleMobileProducts = function() {
    const list = document.getElementById('mobile-products-list');
    const icon = document.getElementById('mobile-product-icon');
    if (list.classList.contains('hidden')) {
        list.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    } else {
        list.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    }
};

/* --- THEMING --- */
window.setTheme = function(themeKey) {
    state.currentTheme = themeKey;
    const theme = THEMES[themeKey];
    const root = document.documentElement;
    
    // Set CSS Variables
    Object.entries(theme.variables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
    
    // Set Body Gradient Class
    const body = document.getElementById('app-body');
    body.className = `min-h-screen transition-colors duration-500 selection:bg-brand-500 selection:text-white ${theme.gradientClass}`;
    
    // Update State & Color Pickers
    state.brandColor = theme.brand;
    state.ambientColor = theme.ambient;
    
    const brandPicker = document.getElementById('brand-color-picker');
    const brandLabel = document.getElementById('brand-color-label');
    const ambientPicker = document.getElementById('ambient-color-picker');
    const ambientLabel = document.getElementById('ambient-color-label');
    
    if (brandPicker) brandPicker.value = theme.brand;
    if (brandLabel) brandLabel.innerText = theme.brand;
    if (ambientPicker) ambientPicker.value = theme.ambient;
    if (ambientLabel) ambientLabel.innerText = theme.ambient;
    
    // Generate and Apply Palettes
    const brandPalette = generatePalette(theme.brand, 'brand');
    Object.entries(brandPalette).forEach(([key, value]) => root.style.setProperty(key, value));
    
    const ambientPalette = generatePalette(theme.ambient, 'ambient');
    Object.entries(ambientPalette).forEach(([key, value]) => root.style.setProperty(key, value));
    
    // Update Toggle Button Styles
    ['void', 'azure', 'paper'].forEach(k => {
        const btn = document.getElementById(`btn-theme-${k}`);
        if (k === themeKey) {
            btn.className = "w-full text-left px-3 py-2 rounded font-mono text-xs transition-all flex items-center justify-between group bg-brand-600 text-white shadow-md shadow-brand-600/20";
            btn.querySelector('span:last-child').className = "text-[9px] uppercase opacity-70 text-white";
        } else {
            btn.className = "w-full text-left px-3 py-2 rounded font-mono text-xs transition-all flex items-center justify-between group hover:bg-skin-surface-hover text-skin-text";
            btn.querySelector('span:last-child').className = "text-[9px] uppercase opacity-70 text-skin-muted";
        }
    });

    // Wave control layout (must align with custom.js)
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
};



window.toggleThemePanel = function() {
    const panel = document.getElementById('theme-panel');
    panel.classList.toggle('hidden');
};

/* --- COLOR GENERATION --- */
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
    
    [0.1, 0.3, 0.5, 0.7].forEach((w, i) => {
        const levels = [700, 800, 900, 950];
        palette[`--${prefix}-${levels[i]}`] = mixWithBase(black, w);
    });
    return palette;
}

window.updateBrandColor = function(hex) {
    state.brandColor = hex;
    document.getElementById('brand-color-picker').value = hex;
    document.getElementById('brand-color-label').innerText = hex;
    const palette = generatePalette(hex, 'brand');
    Object.entries(palette).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
}

window.updateAmbientColor = function(hex) {
    state.ambientColor = hex;
    document.getElementById('ambient-color-picker').value = hex;
    document.getElementById('ambient-color-label').innerText = hex;
    const palette = generatePalette(hex, 'ambient');
    Object.entries(palette).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
}

window.resetColors = function() {
    const theme = THEMES[state.currentTheme];
    updateBrandColor(theme.brand);
    updateAmbientColor(theme.ambient);
}

/* --- WAVE ANIMATION --- */
// The canonical setupWaveAnimation (with Binary Stream support)
// now lives in custom.js and is invoked from there.
