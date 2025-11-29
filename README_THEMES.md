# Theme System

This website supports multiple themes that can be easily switched.

## Available Themes

### 1. Symphony (Original Theme)
- **Description**: Original full-page scrolling theme with animated waves
- **Features**: 
  - Full-page scrolling with fullPage.js
  - Animated sine waves background
  - Bootstrap-based layout
  - Custom fonts (Poiret One, Raleway)

### 2. Draftr (Modern Theme)
- **Description**: Modern glassmorphism design inspired by Draftr template
- **Features**:
  - Modern single-page layout
  - Glassmorphism effects
  - Smooth scrolling navigation
  - Inter font family
  - Background image support

## How to Switch Themes

1. Open `config/themes.rb`
2. Change the `active_theme` value:
   ```ruby
   set :active_theme, 'symphony'  # or 'draftr'
   ```
3. Restart the Middleman server

## Theme Structure

Each theme is organized in its own directory under `source/themes/`:

```
source/themes/
├── symphony/
│   ├── layouts/
│   │   ├── _nav.html.haml
│   │   └── _footer.html.haml
│   ├── pages/
│   │   ├── _home.html.haml
│   │   ├── _slide1.html.haml
│   │   ├── _slide2.html.haml
│   │   ├── _slide3.html.haml
│   │   ├── _reason.html.haml
│   │   └── _contact.html.haml
│   ├── stylesheets/
│   │   └── style.css
│   └── javascripts/
│       └── custom.js
└── draftr/
    ├── layouts/
    │   ├── _nav.html.haml
    │   └── _footer.html.haml
    ├── pages/
    │   ├── _home.html.haml
    │   ├── _services.html.haml
    │   ├── _tech.html.haml
    │   ├── _reason.html.haml
    │   └── _contact.html.haml
    ├── stylesheets/
    │   └── style.css
    └── javascripts/
        └── custom.js
```

## Adding a New Theme

1. Create a new directory under `source/themes/` (e.g., `source/themes/mytheme/`)
2. Create subdirectories: `layouts/`, `pages/`, `stylesheets/`, `javascripts/`
3. Add your theme configuration to `config/themes.rb`:
   ```ruby
   'mytheme' => {
     name: 'My Theme',
     description: 'Description of my theme',
     stylesheets: ['themes/mytheme/stylesheets/style'],
     javascripts: ['themes/mytheme/javascripts/custom'],
     fonts: ['https://fonts.googleapis.com/css?family=MyFont']
   }
   ```
4. Update `source/index.html.erb` to include your theme's page structure
5. Set `active_theme` to your new theme name

## Shared Resources

- Images: `source/images/` (shared across all themes)
- Fonts: `source/fonts/` (shared across all themes)
- Main layout: `source/layouts/layout.erb` (dynamically loads theme assets)
