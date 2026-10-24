
const CHAT_WORKER_URL = 'https://codemismatch-contact-form.pankajdoharey.workers.dev';
const FIRST_REPLY_CALL_INVITE = 'This may be easier to work through on a call. Would you like us to follow up? If so, share your email. If not, we can keep going here.';

/* --- STATE --- */
let state = {
    currentPage: 'home',
    currentTheme: 'void',
    brandColor: '#6600ff',
    ambientColor: '#000000',
    callOfferActive: false,
    callRequestSubmitted: false,
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
        gradientClass: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-800/30 via-ambient-900 via-ambient-950 to-brand-950/40',
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
        gradientClass: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/50 via-ambient-100 via-ambient-200 to-brand-200/60',
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
        gradientClass: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ambient-100 via-brand-100/50 via-ambient-200 to-brand-200/60',
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

function escapeMarkdownHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderInlineMarkdown(source) {
    const fragments = [];
    let text = String(source).replace(/`([^`\n]+)`/g, (_, code) => {
        const index = fragments.push(`<code class="px-1 py-0.5 bg-skin-surface-hover text-brand-600 border border-skin-border rounded">${escapeMarkdownHtml(code)}</code>`) - 1;
        return `CMINLINE${index}TOKEN`;
    });
    text = text.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/gi, (_, label, url) => {
        const index = fragments.push(`<a href="${escapeMarkdownHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-brand-600 underline decoration-brand-600/50 underline-offset-2 hover:opacity-80">${escapeMarkdownHtml(label)}</a>`) - 1;
        return `CMINLINE${index}TOKEN`;
    });

    text = escapeMarkdownHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-skin-text">$1</strong>')
        .replace(/~~(.+?)~~/g, '<del class="text-skin-muted">$1</del>')
        .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
        .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>');

    return text.replace(/CMINLINE(\d+)TOKEN/g, (_, index) => fragments[Number(index)] || '');
}

function renderMarkdownListItem(source) {
    return String(source).split('\n').map((line) => {
        const nestedItem = line.match(/^\s+[-*+]\s+(.+)$/);
        if (nestedItem) {
            return `<span class="block pl-4"><span class="text-brand-600">•</span> ${renderInlineMarkdown(nestedItem[1])}</span>`;
        }
        return renderInlineMarkdown(line);
    }).join('<br>');
}

function renderMarkdown(source) {
    const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
    const blocks = [];
    let paragraph = [];
    const flushParagraph = () => {
        if (!paragraph.length) return;
        blocks.push(`<p class="mb-3 last:mb-0 leading-relaxed">${paragraph.map(renderInlineMarkdown).join('<br>')}</p>`);
        paragraph = [];
    };

    for (let i = 0; i < lines.length;) {
        const line = lines[i];
        if (!line.trim()) {
            flushParagraph();
            i++;
            continue;
        }

        if (/^\s*```/.test(line)) {
            flushParagraph();
            const code = [];
            i++;
            while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
            if (i < lines.length) i++;
            blocks.push(`<pre class="my-3 max-w-full overflow-x-auto rounded border border-skin-border bg-skin-surface-hover p-3 text-skin-text"><code>${escapeMarkdownHtml(code.join('\n'))}</code></pre>`);
            continue;
        }

        const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
        if (heading) {
            flushParagraph();
            const level = heading[1].length;
            const size = level <= 2 ? 'text-lg' : 'text-base';
            blocks.push(`<h${level} class="mb-2 mt-4 ${size} font-semibold text-skin-text">${renderInlineMarkdown(heading[2])}</h${level}>`);
            i++;
            continue;
        }

        if (/^\s*(?:[-*_]\s*){3,}$/.test(line)) {
            flushParagraph();
            blocks.push('<hr class="my-3 border-skin-border">');
            i++;
            continue;
        }

        if (/^\s*>/.test(line)) {
            flushParagraph();
            const quote = [];
            while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ''));
            blocks.push(`<blockquote class="my-3 border-l-2 border-brand-600/50 pl-3 text-skin-muted">${renderMarkdown(quote.join('\n'))}</blockquote>`);
            continue;
        }

        const firstListItem = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.+)$/);
        if (firstListItem) {
            flushParagraph();
            const baseIndent = firstListItem[1].length;
            const ordered = /^\d/.test(firstListItem[2]);
            const items = [];
            while (i < lines.length) {
                const item = lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.+)$/);
                if (item && item[1].length === baseIndent && /^\d/.test(item[2]) === ordered) {
                    let content = item[3];
                    i++;
                        while (i < lines.length && lines[i].trim()) {
                            const nextItem = lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+/);
                            const indent = lines[i].match(/^\s*/)[0].length;
                            if (indent < baseIndent + 2 || (nextItem && nextItem[1].length <= baseIndent)) break;
                            content += `\n${lines[i]}`;
                            i++;
                    }
                    items.push(`<li class="pl-1">${renderMarkdownListItem(content)}</li>`);
                    continue;
                }
                if (!lines[i].trim()) {
                    let next = i + 1;
                    while (next < lines.length && !lines[next].trim()) next++;
                    const nextItem = lines[next]?.match(/^(\s*)([-*+]|\d+[.)])\s+(.+)$/);
                    if (nextItem && nextItem[1].length === baseIndent && /^\d/.test(nextItem[2]) === ordered) {
                        i = next;
                        continue;
                    }
                }
                break;
            }
            const tag = ordered ? 'ol' : 'ul';
            const marker = ordered ? 'list-decimal' : 'list-disc';
            blocks.push(`<${tag} class="mb-3 space-y-1 ${marker} pl-6 marker:text-brand-600">${items.join('')}</${tag}>`);
            continue;
        }

        paragraph.push(line);
        i++;
    }
    flushParagraph();
    return blocks.join('');
}

function appendMessage(role, text) {
    const container = document.getElementById('chat-messages');
    const isModel = role === 'model';
    
    const div = document.createElement('div');
    div.className = `flex gap-4 ${isModel ? 'flex-row' : 'flex-row-reverse'} animate-fade-in`;
    
    div.innerHTML = `
        <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center border ${isModel ? 'border-brand-600 bg-brand-600/10 text-brand-600' : 'border-skin-border bg-skin-base text-skin-muted'}">
            <i data-lucide="${isModel ? 'activity' : 'user'}" class="w-4 h-4"></i>
        </div>
        <div class="max-w-[85%] break-words font-mono text-sm p-4 border shadow-sm ${isModel ? 'border-brand-600/30 bg-skin-base text-skin-text' : 'border-skin-border bg-skin-surface-hover text-skin-text'}">
        </div>
    `;
    div.lastElementChild.innerHTML = renderMarkdown(text);
    container.appendChild(div);
    lucide.createIcons();
    scrollToBottom();
    return div.lastElementChild;
}

function renderChat() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    state.messages.forEach(msg => appendMessage(msg.role, msg.text));
}

let chatRequestActive = false;
window.handleChatSend = async function() {
    const inputEl = document.getElementById('chat-input');
    const text = inputEl.value.trim();
    if (!text || chatRequestActive) return;
    chatRequestActive = true;
    
    // Add User Message
    state.messages.push({ id: Date.now(), role: 'user', text });
    appendMessage('user', text);
    inputEl.value = '';
    
    // Show Loading
    const loading = document.getElementById('chat-loading');
    const status = document.getElementById('chat-status');
    loading.classList.remove('hidden');
    status.textContent = 'Waiting for the Architect…';
    scrollToBottom();
    
    let answer = '';
    let answerBubble = null;
    try {
        const declinedCall = /^\s*no\b/i.test(text) || /\b(?:no thanks|no thank you|not interested|not right now|not now|maybe later|rather keep chatting|keep chatting|continue here|don't want (?:a )?call|do not want (?:a )?call)\b/i.test(text);
        if (state.callOfferActive && declinedCall) state.callOfferActive = false;

        const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
        if (state.callOfferActive && emailMatch && !declinedCall && !state.callRequestSubmitted) {
            status.textContent = 'Sending your follow-up request…';
            const email = emailMatch[0].toLowerCase();
            const transcript = state.messages
                .map(message => `${message.role === 'model' ? 'Architect' : 'Visitor'}: ${message.text}`)
                .join('\n\n')
                .slice(-4200);
            const response = await fetch(`${CHAT_WORKER_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Architect chat follow-up',
                    email,
                    message: `The visitor agreed to a follow-up call. Please contact them to arrange a time.\nEmail: ${email}\n\nChat transcript:\n${transcript}`
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                const error = new Error(result.error || 'Unable to send the call follow-up request');
                error.callRequest = true;
                throw error;
            }
            state.callOfferActive = false;
            state.callRequestSubmitted = true;
            const confirmation = 'Thanks. I’ve shared your email and this conversation with our team so they can follow up to arrange a call.';
            state.messages.push({ id: Date.now()+1, role: 'model', text: confirmation });
            appendMessage('model', confirmation);
            return;
        }

        const isFirstReply = state.messages.filter(message => message.role === 'model').length === 1;
        const history = state.messages.map(m => ({ role: m.role, text: m.text }));
        await generateOracleResponse(history, text, {
            onConnected: () => {
                status.textContent = 'Waiting for the Architect…';
            },
            onProgress: progress => {
                if ((progress === 'model_ready' || progress === 'thinking') && !answer) {
                    status.textContent = 'Waiting for the Architect…';
                }
            },
            onToken: token => {
                if (!answerBubble) answerBubble = appendMessage('model', '');
                answer += token;
                answerBubble.innerHTML = renderMarkdown(answer);
                status.textContent = 'The Architect is responding…';
                scrollToBottom();
            }
        });
        if (!answer.trim()) answer = 'The Architect could not formulate a response. Please try again.';
        if (isFirstReply && !state.callRequestSubmitted) {
            answer += `\n\n${FIRST_REPLY_CALL_INVITE}`;
            state.callOfferActive = true;
        }
        if (!answerBubble) answerBubble = appendMessage('model', answer);
        else answerBubble.innerHTML = renderMarkdown(answer);
        state.messages.push({ id: Date.now()+1, role: 'model', text: answer });
    } catch (err) {
        console.error(err);
        const message = err.callRequest
            ? "I couldn't send the follow-up request just now. We can keep chatting here; please try sharing your email again in a moment."
            : "The Architect is temporarily unavailable. Please try again.";
        if (answerBubble) answerBubble.innerHTML = renderMarkdown(message);
        else appendMessage('model', message);
    } finally {
        loading.classList.add('hidden');
        chatRequestActive = false;
    }
}

async function generateOracleResponse(history, newMessage, callbacks) {
  const messages = history
    .slice(0, -1)
    .slice(-10)
    .map(message => ({
      role: message.role === 'model' ? 'assistant' : 'user',
      content: message.text
    }));
  messages.push({ role: 'user', content: newMessage });

  const response = await fetch(`${CHAT_WORKER_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'Architect request failed');
  }
  if (!response.body) throw new Error('Streaming is not supported by this browser');
  callbacks.onConnected();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || '';
    for (const event of events) {
      for (const line of event.split(/\r?\n/)) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        let chunk;
        try { chunk = JSON.parse(payload); } catch { continue; }
        if (chunk.error) throw new Error(chunk.error);
        if (chunk.progress) {
          callbacks.onProgress(chunk.progress);
          continue;
        }
        const content = chunk.choices?.[0]?.delta?.content;
        if (chunk.choices?.[0]?.delta?.reasoning_content) callbacks.onProgress('thinking');
        if (typeof content === 'string' && content) callbacks.onToken(content);
        else if (Array.isArray(content)) {
          for (const item of content) if (typeof item.text === 'string') callbacks.onToken(item.text);
        }
      }
    }
    if (done) break;
  }
}

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
    
    // Update body gradient class to reflect new brand color
    const body = document.getElementById('app-body');
    const theme = THEMES[state.currentTheme];
    if (body && theme) {
        body.className = `min-h-screen transition-colors duration-500 selection:bg-brand-500 selection:text-white ${theme.gradientClass}`;
    }
}

window.updateAmbientColor = function(hex) {
    state.ambientColor = hex;
    document.getElementById('ambient-color-picker').value = hex;
    document.getElementById('ambient-color-label').innerText = hex;
    const palette = generatePalette(hex, 'ambient');
    Object.entries(palette).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
    
    // Update body gradient class to reflect new ambient color
    const body = document.getElementById('app-body');
    const theme = THEMES[state.currentTheme];
    if (body && theme) {
        body.className = `min-h-screen transition-colors duration-500 selection:bg-brand-500 selection:text-white ${theme.gradientClass}`;
    }
}

window.resetColors = function() {
    const theme = THEMES[state.currentTheme];
    updateBrandColor(theme.brand);
    updateAmbientColor(theme.ambient);
}

/* --- WAVE ANIMATION --- */
// The canonical setupWaveAnimation (with Binary Stream support)
// now lives in custom.js and is invoked from there.
