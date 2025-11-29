# CodeMismatch Theme

Enterprise AI consultancy theme with dynamic theming, color customization, and interactive features.

## Features

- 🎨 **3 Theme Modes**: Void (Dark), Azure (Light Gradient), Paper (Clean Light)
- 🌈 **Dynamic Color Palettes**: Real-time brand and ambient color customization
- 🌊 **Animated Canvas Background**: Smooth wave animations
- 💬 **AI Chat Interface**: "The Architect" chat UI (requires Gemini API)
- 📱 **Fully Responsive**: Mobile-first design with touch-friendly controls
- 🔗 **Browser History Support**: Back/forward navigation with URL hashes
- ⚡ **Optimized**: 377 lines of clean JavaScript, 12KB total

## Directory Structure

```
source/themes/codemismatch/
├── javascripts/
│   └── custom.js          # All theme logic (377 lines)
├── layouts/
│   └── _layout.html.erb   # Complete theme HTML
├── pages/
│   └── index.html.erb     # Entry point
└── stylesheets/
    └── style.css          # Theme styles & animations
```

## Sections

1. **Hero** - Landing with animated wave background and CTAs
2. **Services** - 4-grid capability showcase
3. **Work** - Portfolio case studies with images
4. **AI Architect** - Chat interface for Gemini integration
5. **Contact** - Contact form and company info
6. **Placeholder** - For Open Source/Blog (coming soon)

## Theme Switching

Access the theme control panel via the floating button (bottom-right):
- **Void**: Dark mode with gradient overlays
- **Azure**: Light mode with blue gradient
- **Paper**: Clean minimal light theme

## Color Customization

Use the color pickers in the theme panel to:
- Adjust **Brand Color**: Buttons, accents, links
- Adjust **Ambient Color**: Background gradients

The system generates a full 50-950 palette dynamically.

## Navigation

All navigation uses client-side routing with history support:
- URLs update with hashes: `#home`, `#services`, `#work`, etc.
- Browser back/forward buttons work correctly
- Deep linking supported

## AI Chat Integration

To enable full chat functionality:

1. Get a Gemini API key from Google AI Studio
2. Update `custom.js` line 364 in `handleChatSend()`:

```javascript
// Replace placeholder with actual API call
const API_KEY = 'your-gemini-api-key';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
const result = await model.generateContent(text);
const responseText = result.response.text();
```

3. Include Gemini SDK in the layout:
```html
<script src="https://cdn.jsdelivr.net/npm/@google/generative-ai"></script>
```

## Usage

Enable this theme in `config.rb`:

```ruby
set :active_theme, 'codemismatch'
```

Then build or serve:

```bash
bundle exec middleman build
# or
bundle exec middleman server
```

## Dependencies

- **Tailwind CSS**: Via CDN (https://cdn.tailwindcss.com)
- **Lucide Icons**: Via CDN (https://unpkg.com/lucide@latest)
- **IBM Plex Fonts**: Sans & Mono via Google Fonts

## Performance

- JavaScript: 12KB (377 lines, fully functional)
- Canvas animation: ~60fps, GPU-accelerated
- CSS: Minimal custom styles, leverages Tailwind
- No external dependencies bundled

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Credits

Design inspired by modern enterprise AI platforms.
Developed for CodeMismatch consulting brand.

---

**Version**: 1.0.0  
**Last Updated**: November 2024
