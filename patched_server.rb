#!/usr/bin/env ruby

# Patch for Middleman's signal handling issue with TruffleRuby
require 'middleman-core'
require 'middleman-core/preview_server'
require 'middleman-cli'

class Middleman::PreviewServer
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
    # Signal.trap("QUIT") { puts "Quitting..."; stop(options) }
  end
end

Middleman::Cli.start(ARGV)