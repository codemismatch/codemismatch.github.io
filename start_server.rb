#!/usr/bin/env ruby

require 'middleman-core'
require 'middleman-core/preview_server'

# Monkey patch the problematic signal handler
module Middleman
  module PreviewServer
    def self.register_signal_handlers(options={})
      # Only register SIGINT and SIGTERM, skip SIGQUIT which causes issues with TruffleRuby
      at_exit { stop(options) }
      Signal.trap("INT")  { stop(options) }
      Signal.trap("TERM") { stop(options) }
    rescue ArgumentError => e
      # Handle case where signal is already used by VM
      puts "Warning: Could not register all signal handlers: #{e.message}"
    end
  end
end

# Now run the server normally
exec("bundle exec middleman server --no-live-reload")