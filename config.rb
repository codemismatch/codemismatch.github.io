# Activate and configure extensions
# https://middlemanapp.com/advanced/configuration/#configuring-extensions

activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

# Layouts
# https://middlemanapp.com/basics/layouts/

# Per-page layout changes
page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false

# With alternative layout
# page '/path/to/file.html', layout: 'other_layout'

# Proxy pages
# https://middlemanapp.com/advanced/dynamic-pages/

# proxy(
#   '/this-page-has-no-template.html',
#   '/template-file.html',
#   locals: {
#     which_fake_page: 'Rendering a fake page with a local variable'
#   },
# )

# Helpers
# Methods defined in the helpers block are available in templates
# https://middlemanapp.com/basics/helper-methods/

# helpers do
#   def some_helper
#     'Helping'
#   end
# end

# Build-specific configuration
# https://middlemanapp.com/advanced/configuration/#environment-specific-settings

set :haml, { :format => :html5 }

# Theme Configuration
# Set the active theme here: 'symphony', 'draftr', 'congen', or 'codemismatch'
# Change this value to switch themes
set :active_theme, 'codemismatch'

# Available themes
set :themes, {
  'symphony' => {
    name: 'Symphony',
    description: 'Original full-page scrolling theme with animated waves',
    stylesheets: ['animate.min', 'bootstrap.min', 'javascript.fullPage', 'themes/symphony/stylesheets/style'],
    javascripts: ['javascript.fullPage.min', 'sine-waves.min', 'themes/symphony/javascripts/custom'],
    fonts: ['https://fonts.googleapis.com/css?family=Poiret+One|Raleway']
  },
  'draftr' => {
    name: 'Draftr',
    description: 'Modern glassmorphism design inspired by Draftr template',
    stylesheets: ['themes/draftr/stylesheets/style'],
    javascripts: ['themes/draftr/javascripts/custom'],
    fonts: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Display:wght@600;700;900&display=swap']
  },
  'congen' => {
    name: 'Congen',
    description: 'Clean modern design inspired by Contentin.io',
    stylesheets: ['themes/congen/stylesheets/style'],
    javascripts: ['themes/congen/javascripts/custom'],
    fonts: []
  },
  'codemismatch' => {
    name: 'CodeMismatch',
    description: 'Modern enterprise AI consultancy theme with dynamic theming and AI chat',
    stylesheets: ['https://cdn.tailwindcss.com', 'themes/codemismatch/stylesheets/style'],
    javascripts: ['https://unpkg.com/lucide@latest/dist/umd/lucide.min.js', 'themes/codemismatch/javascripts/custom'],
    fonts: ['https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap']
  }
}

# Helper methods for themes (available in templates)
helpers do
  def theme_path(path)
    "themes/#{config[:active_theme]}/#{path}"
  end

  def current_theme
    config[:themes][config[:active_theme]]
  end
end

configure :build do
  activate :minify_css
  activate :minify_javascript
  activate :minify_html
end
