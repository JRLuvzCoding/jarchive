// ============================
// JArchive Player Iframe Bridge
// ============================
// Communication layer between parent pages and the iframe-hosted audio player
// Usage: Add <script src="/shared/player-iframe-bridge.js"></script> to any page

(function() {
    'use strict';
    
    // ============================
    // Configuration
    // ============================
    
    const PLAYER_IFRAME_ID = 'jarchive-player-iframe';
    const PLAYER_HOST_PATH = '/player-host.html';
    
    // ============================
    // Global Player Bridge Object
    // ============================
    
    window.JArchivePlayerBridge = {
        iframe: null,
        isReady: false,
        readyCallbacks: [],
        messageHandlers: {},
        playerBounds: null, // Updated by player via PLAYER_BOUNDS postMessage
        
        // Initialize the iframe (called automatically on page load)
        init() {
            // Check if iframe already exists
            this.iframe = document.getElementById(PLAYER_IFRAME_ID);
            
            if (!this.iframe) {
                console.error('[Player Bridge] Iframe not found. Make sure to add the iframe embed code to your page.');
                return;
            }
            
            // Set up message listener
            window.addEventListener('message', (event) => this.handleMessage(event));
            
            // CORE FIX: Track mouse position and toggle iframe pointer-events dynamically.
            // When cursor is over the player area -> iframe is interactive.
            // When cursor is elsewhere -> iframe is click-through (pointer-events: none).
            window.addEventListener('mousemove', (e) => {
                if (!this.iframe) return;
                const b = this.playerBounds;
                if (b && e.clientX >= b.left && e.clientX <= b.right &&
                            e.clientY >= b.top  && e.clientY <= b.bottom) {
                    if (this.iframe.style.pointerEvents !== 'auto') {
                        this.iframe.style.pointerEvents = 'auto';
                    }
                } else {
                    if (this.iframe.style.pointerEvents !== 'none') {
                        this.iframe.style.pointerEvents = 'none';
                    }
                }
            });
            
            // Set up restore button click handler
            const restoreBtn = document.getElementById('restore-player-btn');
            if (restoreBtn) {
                restoreBtn.addEventListener('click', () => {
                    this.sendCommand('RESTORE');
                });
            }
            
            // Wait for iframe to load
            this.iframe.addEventListener('load', () => {
                console.log('[Player Bridge] Iframe loaded, waiting for player ready signal...');
            });
            
            console.log('[Player Bridge] Initialized');
        },
        
        // ============================
        // Message Handling (from iframe)
        // ============================
        
        handleMessage(event) {
            // Validate that message is from our iframe
            if (event.source !== this.iframe?.contentWindow) {
                return;
            }
            
            const { type } = event.data;
            
            // Handle ready signal
            if (type === 'PLAYER_READY') {
                this.isReady = true;
                console.log('[Player Bridge] Player is ready!');
                
                // Execute any queued callbacks
                this.readyCallbacks.forEach(cb => cb());
                this.readyCallbacks = [];
            }
            
            // Handle minimize state updates
            if (type === 'MINIMIZE_STATE') {
                this.updateRestoreButton(event.data.isMinimized);
            }
            
            // Handle player position/size updates — drives pointer-events toggling
            if (type === 'PLAYER_BOUNDS') {
                this.playerBounds = event.data.bounds; // null when hidden/minimized
            }
            
            // Call registered handlers
            if (this.messageHandlers[type]) {
                this.messageHandlers[type].forEach(handler => handler(event.data));
            }
            
            // Log state updates (optional, for debugging)
            if (type === 'STATE_UPDATE') {
                // console.log('[Player Bridge] State:', event.data.state);
            }
        },
        
        // ============================
        // Restore Button Management
        // ============================
        
        updateRestoreButton(isMinimized) {
            const restoreBtn = document.getElementById('restore-player-btn');
            if (restoreBtn) {
                if (isMinimized) {
                    restoreBtn.classList.remove('hidden');
                } else {
                    restoreBtn.classList.add('hidden');
                }
            }
        },
        
        // ============================
        // Send Commands to Iframe
        // ============================
        
        sendCommand(type, data = {}) {
            if (!this.iframe) {
                console.error('[Player Bridge] Iframe not initialized');
                return;
            }
            
            this.iframe.contentWindow.postMessage({ type, data }, '*');
        },
        
        // Wait for player to be ready, then execute callback
        onReady(callback) {
            if (this.isReady) {
                callback();
            } else {
                this.readyCallbacks.push(callback);
            }
        },
        
        // Register handler for specific message types
        on(type, handler) {
            if (!this.messageHandlers[type]) {
                this.messageHandlers[type] = [];
            }
            this.messageHandlers[type].push(handler);
        },
        
        // Remove handler
        off(type, handler) {
            if (this.messageHandlers[type]) {
                this.messageHandlers[type] = this.messageHandlers[type].filter(h => h !== handler);
            }
        },
        
        // ============================
        // Public API Methods
        // ============================
        
        // Play a specific track by title
        playTrack(title) {
            this.onReady(() => {
                this.sendCommand('PLAY_TRACK', { title });
                console.log('[Player Bridge] Playing track:', title);
            });
        },
        
        // Play/pause controls
        play() {
            this.sendCommand('PLAY');
        },
        
        pause() {
            this.sendCommand('PAUSE');
        },
        
        togglePlay() {
            this.sendCommand('TOGGLE_PLAY');
        },
        
        // Track navigation
        nextTrack() {
            this.sendCommand('NEXT_TRACK');
        },
        
        prevTrack() {
            this.sendCommand('PREV_TRACK');
        },
        
        // Volume control (0-1)
        setVolume(volume) {
            this.sendCommand('SET_VOLUME', { volume });
        },
        
        // Request current state
        getState() {
            this.sendCommand('GET_STATE');
        }
    };
    
    // ============================
    // Auto-initialize when DOM is ready
    // ============================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.JArchivePlayerBridge.init();
        });
    } else {
        window.JArchivePlayerBridge.init();
    }
    
    // ============================
    // Backwards Compatibility
    // ============================
    
    // Maintain compatibility with existing playTrack() calls
    window.playTrack = function(title) {
        window.JArchivePlayerBridge.playTrack(title);
    };
    
    console.log('[Player Bridge] Script loaded');
})();
