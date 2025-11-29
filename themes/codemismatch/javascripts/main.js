import { GoogleGenAI } from "https://esm.sh/@google/genai";

/* --- CONFIG --- */
const API_KEY = ''; // ENTER YOUR GEMINI API KEY HERE

/* --- STATE --- */
let state = {
    currentPage: 'home',
    currentTheme: 'azure',
    brandColor: '#00608a',
    ambientColor: '#0f172a',
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
        brand: '#00608a', // Paper Default
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
function setupWaveAnimation() {
    const canvas = document.getElementById('wave-canvas');
    const ctx = canvas.getContext('2d');
    
    // Controls
    const toggle = document.getElementById('wave-toggle');
    const speedInput = document.getElementById('wave-speed');
    const freqInput = document.getElementById('wave-freq');
    const ampInput = document.getElementById('wave-amp');
    const steepnessInput = document.getElementById('wave-steepness');
    
    // Update Labels
    speedInput.addEventListener('input', (e) => document.getElementById('wave-speed-val').innerText = parseFloat(e.target.value).toFixed(3) + 'x');
    freqInput.addEventListener('input', (e) => document.getElementById('wave-freq-val').innerText = parseFloat(e.target.value).toFixed(3) + 'x');
    ampInput.addEventListener('input', (e) => document.getElementById('wave-amp-val').innerText = parseFloat(e.target.value).toFixed(3) + 'x');
    steepnessInput.addEventListener('input', (e) => document.getElementById('wave-steepness-val').innerText = parseFloat(e.target.value).toFixed(3));

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
        
        if (!toggle.checked) {
            requestAnimationFrame(render);
            return;
        }

        const isDark = THEMES[state.currentTheme].isDark;
        const baseOpacity = isDark ? 0.9 : 0.6;
        const yAxis = height / 2;
        
        // Get Control Values
        const speedMult = parseFloat(speedInput.value);
        const freqMult = parseFloat(freqInput.value);
        const ampMult = parseFloat(ampInput.value);
        const steepnessVal = parseFloat(steepnessInput.value);

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
                // Apply Frequency (wavelength)
                const effectiveWavelength = wave.wavelength / freqMult;
                const k = (2 * Math.PI) / effectiveWavelength;
                
                // Apply Amplitude with Spatial Decay (High Right -> Low Left)
                const baseAmplitude = wave.amplitude * ampMult;
                const decay = Math.pow(x / width, steepnessVal); 
                const effectiveAmplitude = baseAmplitude * decay;
                
                const y = yAxis +
                    Math.sin(k * x + time * wave.timeModifier) * effectiveAmplitude * Math.sin(time * 0.2 + index) +
                    Math.cos(x * 0.01 + time) * (effectiveAmplitude * 0.2);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        });

        // Apply Speed
        time += 0.008 * speedMult;
        requestAnimationFrame(render);
    }
    render();
}
