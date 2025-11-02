#!/usr/bin/env ruby

# A script to run Middleman server while patching the signal handling issue

# First require the preview server to access the class
require 'middleman-core'
require 'middleman-core/preview_server'

# Patch the problematic method
class ::Middleman::PreviewServer
  def self.register_signal_handlers(options={})
    at_exit { stop(options) }
    
    # Register only the signals that are safe with TruffleRuby
    begin
      Signal.trap("INT")  { stop(options) }
    rescue ArgumentError => e
      puts "Warning: Could not register SIGINT handler: #{e.message}"
    end
    
    begin
      Signal.trap("TERM") { stop(options) }
    rescue ArgumentError => e
      puts "Warning: Could not register SIGTERM handler: #{e.message}"
    end
    
    # Skip SIGQUIT registration which causes the TruffleRuby issue
    puts "Skipping SIGQUIT handler registration to avoid TruffleRuby conflict"
  end
end

# Now run middleman server normally
load Gem.bin_path('middleman-cli', 'middleman')