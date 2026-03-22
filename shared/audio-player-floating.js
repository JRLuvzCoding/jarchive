/* ========================================
   FLOATING AUDIO PLAYER - macOS Style
   Clean class-based architecture
   ======================================== */

class FloatingAudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.volume = 0.7;
        this.isMuted = false;
        this.isMinimized = false;
        this.isCompact = false;
        
        this.state = {
            position: { x: null, y: null },
            size: { width: 420, height: null },
            volume: 0.7,
            trackIndex: 0
        };
        
        // Do NOT call init() here - it must be called externally with await
    }
    
    async init() {
        // Load playlist first (async)
        await this.loadPlaylist();
        
        // Then create UI and bind events (sync)
        this.createPlayerUI();
        this.bindElements();
        this.attachEventListeners();
        this.loadState();
        this.initializeDrag();
        this.initializeResize();
        this.setupAutoSave();
        this.startBoundsPolling();
        
        // Player stays hidden until a track is played.
        // loadState() will call show() if restoring a previous session where it was visible.
        
        console.log('[FloatingAudioPlayer] Initialized with', this.playlist.length, 'tracks');
    }
    
    // ========================================
    // PLAYLIST LOADING
    // ========================================
    
    async loadPlaylist() {
        try {
            const response = await fetch('/shared/content.json');
            const data = await response.json();
            
            if (data.music && Array.isArray(data.music)) {
                this.playlist = data.music.map(track => ({
                    title: track.title,
                    artist: track.artist || 'JARCHIVE',
                    cover: `/${track.cover}`,
                    audio: `/${track.audio}`,
                    date: track.date
                }));
                
                // Sort by date (newest first)
                this.playlist.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        } catch (error) {
            console.error('Failed to load playlist:', error);
        }
    }
    
    // ========================================
    // UI CREATION
    // ========================================
    
    createPlayerUI() {
        const playerHTML = `
            <div class="jarchive-floating-player hidden" id="floating-player">
                <!-- Minimized icon (hidden by default) -->
                <div class="minimized-icon">
                    <i class="fas fa-music"></i>
                </div>
                
                <!-- Player header (draggable) -->
                <div class="player-header">
                    <div class="traffic-lights">
                        <button class="traffic-light close-btn" title="Close" aria-label="Close player"></button>
                        <button class="traffic-light minimize-btn" title="Minimize" aria-label="Minimize player"></button>
                        <button class="traffic-light expand-btn" title="Toggle compact mode" aria-label="Toggle compact mode"></button>
                    </div>
                    <div class="player-header-title">JARCHIVE Player</div>
                    <div style="width: 80px;"></div> <!-- Spacer for centering -->
                </div>
                
                <!-- Player body -->
                <div class="player-body">
                    <!-- Track info -->
                    <div class="player-track-info">
                        <img class="player-track-cover" src="" alt="Track cover" id="floating-cover">
                        <div class="player-track-meta">
                            <div class="player-track-title" id="floating-title">No track selected</div>
                            <div class="player-track-artist" id="floating-artist">JARCHIVE</div>
                        </div>
                    </div>
                    
                    <!-- Controls -->
                    <div class="player-controls">
                        <button class="player-control-btn" id="floating-prev" title="Previous" aria-label="Previous track">
                            <i class="fas fa-backward-step"></i>
                        </button>
                        <button class="player-control-btn play-btn" id="floating-play" title="Play" aria-label="Play/Pause">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="player-control-btn" id="floating-next" title="Next" aria-label="Next track">
                            <i class="fas fa-forward-step"></i>
                        </button>
                    </div>
                    
                    <!-- Progress -->
                    <div class="player-progress">
                        <div class="player-times">
                            <span id="floating-current-time">0:00</span>
                            <span id="floating-total-time">0:00</span>
                        </div>
                        <div class="player-progress-bar" id="floating-progress-bar">
                            <div class="player-progress-fill" id="floating-progress-fill"></div>
                        </div>
                    </div>
                    
                    <!-- Volume -->
                    <div class="player-volume">
                        <div class="player-volume-icon" id="floating-volume-icon">
                            <i class="fas fa-volume-high"></i>
                        </div>
                        <div class="player-volume-slider" id="floating-volume-slider">
                            <div class="player-volume-fill" id="floating-volume-fill"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Resize handle -->
                <div class="resize-handle"></div>
            </div>
            
            <!-- Restore button (appears when minimized) -->
            <button class="jarchive-restore-button hidden" id="restore-player-btn">
                <i class="fas fa-cross"></i>
                <span>Jarchive Player</span>
            </button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', playerHTML);
    }
    
    // ========================================
    // ELEMENT BINDING
    // ========================================
    
    bindElements() {
        this.elements = {
            player: document.getElementById('floating-player'),
            header: document.querySelector('.player-header'),
            closeBtn: document.querySelector('.traffic-light.close-btn'),
            minimizeBtn: document.querySelector('.traffic-light.minimize-btn'),
            expandBtn: document.querySelector('.traffic-light.expand-btn'),
            cover: document.getElementById('floating-cover'),
            title: document.getElementById('floating-title'),
            artist: document.getElementById('floating-artist'),
            playBtn: document.getElementById('floating-play'),
            prevBtn: document.getElementById('floating-prev'),
            nextBtn: document.getElementById('floating-next'),
            progressBar: document.getElementById('floating-progress-bar'),
            progressFill: document.getElementById('floating-progress-fill'),
            currentTime: document.getElementById('floating-current-time'),
            totalTime: document.getElementById('floating-total-time'),
            volumeIcon: document.getElementById('floating-volume-icon'),
            volumeSlider: document.getElementById('floating-volume-slider'),
            volumeFill: document.getElementById('floating-volume-fill'),
            resizeHandle: document.querySelector('.resize-handle'),
            minimizedIcon: document.querySelector('.minimized-icon'),
            restoreBtn: document.getElementById('restore-player-btn')
        };
        
        // Verify all critical elements were found
        const missing = [];
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                missing.push(key);
            }
        }
        
        if (missing.length > 0) {
            console.error('[FloatingAudioPlayer] Missing elements:', missing);
            throw new Error(`Failed to bind elements: ${missing.join(', ')}`);
        }
        
        console.log('[FloatingAudioPlayer] All elements bound successfully');
    }
    
    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    attachEventListeners() {
        console.log('[FloatingAudioPlayer] Attaching event listeners...');
        
        // Traffic light controls
        this.elements.closeBtn.addEventListener('click', () => {
            console.log('[FloatingAudioPlayer] Close button clicked');
            this.pause();
            this.hide();
        });
        this.elements.minimizeBtn.addEventListener('click', () => {
            console.log('[FloatingAudioPlayer] Minimize button clicked');
            this.toggleMinimize();
        });
        this.elements.expandBtn.addEventListener('click', () => {
            console.log('[FloatingAudioPlayer] Expand button clicked');
            this.toggleCompact();
        });
        
        // Minimized icon click to restore
        this.elements.minimizedIcon.addEventListener('click', () => {
            console.log('[FloatingAudioPlayer] Minimized icon clicked');
            this.toggleMinimize();
        });
        
        // Restore button click
        this.elements.restoreBtn.addEventListener('click', () => {
            console.log('[FloatingAudioPlayer] Restore button clicked');
            this.toggleMinimize();
        });
        
        // Playback controls
        this.elements.playBtn.addEventListener('click', () => {
            console.log('[FloatingAudioPlayer] Play button clicked');
            this.togglePlay();
        });
        this.elements.prevBtn.addEventListener('click', () => {
            console.log('[FloatingAudioPlayer] Previous button clicked');
            this.previousTrack();
        });
        this.elements.nextBtn.addEventListener('click', () => {
            console.log('[FloatingAudioPlayer] Next button clicked');
            this.nextTrack();
        });
        
        // Progress bar
        this.elements.progressBar.addEventListener('click', (e) => this.seekTo(e));
        
        // Volume controls
        this.elements.volumeIcon.addEventListener('click', () => this.toggleMute());
        this.elements.volumeSlider.addEventListener('click', (e) => this.setVolume(e));
        
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());

        // Buffering: when the audio is ready to play after loading, fire any pending play
        this.audio.addEventListener('canplay', () => {
            if (this._pendingPlay) {
                this._pendingPlay = false;
                this._setLoadingState(false);
                const p = this.audio.play();
                if (p !== undefined) {
                    p.then(() => { this.isPlaying = true; })
                     .catch(err => {
                         console.error('[FloatingAudioPlayer] Deferred playback failed:', err);
                         this.isPlaying = false;
                     });
                }
            }
        });

        // Show loading spinner while the browser is buffering mid-playback
        this.audio.addEventListener('waiting', () => {
            if (this.isPlaying) this._setLoadingState(true);
        });

        // Hide spinner once playback resumes after buffering
        this.audio.addEventListener('playing', () => {
            this._setLoadingState(false);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        console.log('[FloatingAudioPlayer] Event listeners attached successfully');
    }
    
    // ========================================
    // PLAYBACK CONTROLS
    // ========================================
    
    playTrackByTitle(title) {
        console.log('[FloatingAudioPlayer] playTrackByTitle called:', title);
        console.log('[FloatingAudioPlayer] Playlist has', this.playlist.length, 'tracks');
        
        const index = this.playlist.findIndex(track => track.title === title);
        if (index !== -1) {
            console.log('[FloatingAudioPlayer] Track found at index:', index);
            this.loadTrack(index);
            this.play();
            this.show();
        } else {
            console.warn('[FloatingAudioPlayer] Track not found:', title);
            console.warn('[FloatingAudioPlayer] Available tracks:', this.playlist.map(t => t.title));
        }
    }
    
    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) {
            console.error('[FloatingAudioPlayer] Invalid track index:', index);
            return;
        }
        
        console.log('[FloatingAudioPlayer] Loading track:', this.playlist[index].title);
        this.currentTrackIndex = index;
        const track = this.playlist[index];
        
        // Stop current playback
        this.audio.pause();
        
        // Reset audio element
        this.audio.currentTime = 0;
        
        // Load new track
        this.audio.src = track.audio;
        this.audio.load(); // Explicitly load the new source
        
        // Update UI
        this.elements.cover.src = track.cover;
        this.elements.title.textContent = track.title;
        this.elements.artist.textContent = track.artist;
        
        // Reset progress
        this.elements.progressFill.style.width = '0%';
        this.elements.currentTime.textContent = '0:00';
        
        console.log('[FloatingAudioPlayer] Track loaded successfully:', track.audio);
        
        this.saveState();
    }
    
    play() {
        console.log('[FloatingAudioPlayer] play() called');
        
        if (!this.audio.src) {
            console.warn('[FloatingAudioPlayer] No audio source set');
            if (this.playlist.length > 0) {
                console.log('[FloatingAudioPlayer] Loading first track');
                this.loadTrack(0);
            } else {
                console.error('[FloatingAudioPlayer] Playlist is empty');
                return;
            }
        }

        // If the browser hasn't buffered enough data yet (common with large WAV files),
        // set a pending flag so the canplay listener will start playback when ready.
        // readyState < 3 means HAVE_FUTURE_DATA is not yet satisfied.
        if (this.audio.readyState < 3) {
            console.log('[FloatingAudioPlayer] Audio not ready yet (readyState', this.audio.readyState, ') — deferring play until canplay');
            this._pendingPlay = true;
            this._setLoadingState(true);
            return;
        }
        
        this._pendingPlay = false;
        this._setLoadingState(false);
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('[FloatingAudioPlayer] Playback started successfully');
                    this.isPlaying = true;
                })
                .catch(err => {
                    console.error('[FloatingAudioPlayer] Playback failed:', err);
                    this.isPlaying = false;
                });
        }
    }

    _setLoadingState(isLoading) {
        if (!this.elements || !this.elements.playBtn) return;
        const icon = this.elements.playBtn.querySelector('i');
        if (!icon) return;
        if (isLoading) {
            icon.className = 'fas fa-spinner fa-spin';
            this.elements.playBtn.disabled = true;
        } else {
            icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
            this.elements.playBtn.disabled = false;
        }
    }
    
    pause() {
        console.log('[FloatingAudioPlayer] pause() called');
        this._pendingPlay = false;
        this._setLoadingState(false);
        this.audio.pause();
        this.isPlaying = false;
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            if (!this.audio.src && this.playlist.length > 0) {
                this.loadTrack(0);
            }
            this.play();
        }
    }
    
    nextTrack() {
        const nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.loadTrack(nextIndex);
        if (this.isPlaying) {
            this.play();
        }
    }
    
    previousTrack() {
        const prevIndex = this.currentTrackIndex - 1 < 0 
            ? this.playlist.length - 1 
            : this.currentTrackIndex - 1;
        this.loadTrack(prevIndex);
        if (this.isPlaying) {
            this.play();
        }
    }
    
    onPlay() {
        this.isPlaying = true;
        const icon = this.elements.playBtn.querySelector('i');
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
    }
    
    onPause() {
        this.isPlaying = false;
        const icon = this.elements.playBtn.querySelector('i');
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
    }
    
    // ========================================
    // PROGRESS & VOLUME
    // ========================================
    
    updateProgress() {
        if (!this.audio.duration) return;
        
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.elements.progressFill.style.width = `${percent}%`;
        this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }
    
    updateDuration() {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            this.elements.totalTime.textContent = this.formatTime(this.audio.duration);
        }
    }
    
    seekTo(e) {
        if (!this.audio.duration || isNaN(this.audio.duration)) {
            console.warn('[FloatingAudioPlayer] Cannot seek - no duration');
            return;
        }
        
        const rect = this.elements.progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newTime = percent * this.audio.duration;
        
        console.log('[FloatingAudioPlayer] Seeking to', newTime.toFixed(2), 'seconds');
        this.audio.currentTime = newTime;
    }
    
    setVolume(e) {
        const rect = this.elements.volumeSlider.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        console.log('[FloatingAudioPlayer] Setting volume to', (percent * 100).toFixed(0), '%');
        
        this.volume = percent;
        this.audio.volume = percent;
        this.isMuted = false;
        this.updateVolumeUI();
        this.saveState();
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.volume = this.isMuted ? 0 : this.volume;
        console.log('[FloatingAudioPlayer] Mute toggled:', this.isMuted);
        this.updateVolumeUI();
    }
    
    updateVolumeUI() {
        const displayVolume = this.isMuted ? 0 : this.volume;
        this.elements.volumeFill.style.width = `${displayVolume * 100}%`;
        
        const icon = this.elements.volumeIcon.querySelector('i');
        icon.classList.remove('fa-volume-high', 'fa-volume-low', 'fa-volume-xmark');
        
        if (this.isMuted || displayVolume === 0) {
            icon.classList.add('fa-volume-xmark');
        } else if (displayVolume < 0.5) {
            icon.classList.add('fa-volume-low');
        } else {
            icon.classList.add('fa-volume-high');
        }
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // ========================================
    // WINDOW CONTROLS
    // ========================================
    
    show() {
        this.elements.player.classList.remove('hidden');
        this.broadcastBounds();
    }
    
    hide() {
        this.elements.player.classList.add('hidden');
        this.broadcastBounds();
    }
    
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.elements.player.classList.toggle('minimized');
        
        // Show/hide the restore button that lives alongside the player in the DOM
        if (this.isMinimized) {
            this.elements.restoreBtn.classList.remove('hidden');
        } else {
            this.elements.restoreBtn.classList.add('hidden');
        }
        
        this.broadcastBounds();
    }
    
    // ========================================
    // BOUNDS BROADCASTING
    // ========================================
    
    broadcastBounds() {
        if (window.parent === window) return; // Not in an iframe
        
        const hidden = this.elements.player.classList.contains('hidden');
        const minimized = this.isMinimized;
        
        let boundsPayload = null;
        
        if (!hidden && !minimized) {
            const rect = this.elements.player.getBoundingClientRect();
            // Add a generous hit buffer so edge of player is easy to grab
            const BUFFER = 8;
            boundsPayload = {
                left:   rect.left   - BUFFER,
                top:    rect.top    - BUFFER,
                right:  rect.right  + BUFFER,
                bottom: rect.bottom + BUFFER
            };
        }
        
        window.parent.postMessage({
            type: 'PLAYER_BOUNDS',
            bounds: boundsPayload
        }, '*');
    }
    
    startBoundsPolling() {
        // Poll every 100ms to keep parent in sync during drags/resizes
        setInterval(() => {
            if (window.parent !== window) {
                this.broadcastBounds();
            }
        }, 100);
    }
    
    toggleCompact() {
        this.isCompact = !this.isCompact;
        this.elements.player.classList.toggle('compact');
    }
    
    // ========================================
    // DRAG FUNCTIONALITY
    // ========================================
    
    initializeDrag() {
        console.log('[FloatingAudioPlayer] Initializing drag functionality...');
        
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        const onMouseDown = (e) => {
            // Don't drag if clicking traffic lights or other controls
            if (e.target.closest('.traffic-lights')) return;
            if (e.target.closest('button:not(.player-header)')) return;
            
            isDragging = true;
            this.elements.player.classList.add('dragging');
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = this.elements.player.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            console.log('[FloatingAudioPlayer] Drag started at', startX, startY);
            e.preventDefault();
            e.stopPropagation();
            
            // Use pointer capture if available for better tracking
            if (this.elements.header.setPointerCapture && e.pointerId !== undefined) {
                this.elements.header.setPointerCapture(e.pointerId);
            }
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            // Constrain to viewport
            const rect = this.elements.player.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            
            newX = Math.max(0, Math.min(maxX, newX));
            newY = Math.max(0, Math.min(maxY, newY));
            
            this.elements.player.style.left = `${newX}px`;
            this.elements.player.style.top = `${newY}px`;
            this.elements.player.style.right = 'auto';
            this.elements.player.style.bottom = 'auto';
            
            e.preventDefault();
        };
        
        const onMouseUp = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            this.elements.player.classList.remove('dragging');
            console.log('[FloatingAudioPlayer] Drag ended');
            this.saveState();
            this.broadcastBounds();
            
            // Release pointer capture
            if (this.elements.header.releasePointerCapture && e.pointerId !== undefined) {
                try {
                    this.elements.header.releasePointerCapture(e.pointerId);
                } catch (err) {
                    // Ignore if pointer was already released
                }
            }
        };
        
        // Attach events to header for mousedown
        this.elements.header.addEventListener('mousedown', onMouseDown);
        this.elements.header.addEventListener('pointerdown', onMouseDown);
        
        // Attach move and up to entire document to catch mouse leaving player
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('pointermove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('pointerup', onMouseUp);
        
        console.log('[FloatingAudioPlayer] Drag functionality initialized');
    }
    
    // ========================================
    // RESIZE FUNCTIONALITY
    // ========================================
    
    initializeResize() {
        console.log('[FloatingAudioPlayer] Initializing resize functionality...');
        
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        const onMouseDown = (e) => {
            isResizing = true;
            this.elements.player.classList.add('resizing');
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = this.elements.player.getBoundingClientRect();
            startWidth = rect.width;
            startHeight = rect.height;
            
            console.log('[FloatingAudioPlayer] Resize started');
            e.preventDefault();
            e.stopPropagation();
            
            // Use pointer capture
            if (this.elements.resizeHandle.setPointerCapture && e.pointerId !== undefined) {
                this.elements.resizeHandle.setPointerCapture(e.pointerId);
            }
        };
        
        const onMouseMove = (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newWidth = startWidth + deltaX;
            let newHeight = startHeight + deltaY;
            
            // Apply constraints
            newWidth = Math.max(320, Math.min(600, newWidth));
            newHeight = Math.max(180, Math.min(800, newHeight));
            
            this.elements.player.style.width = `${newWidth}px`;
            this.elements.player.style.height = `${newHeight}px`;
            
            e.preventDefault();
        };
        
        const onMouseUp = (e) => {
            if (!isResizing) return;
            
            isResizing = false;
            this.elements.player.classList.remove('resizing');
            console.log('[FloatingAudioPlayer] Resize ended');
            this.saveState();
            this.broadcastBounds();
            
            // Release pointer capture
            if (this.elements.resizeHandle.releasePointerCapture && e.pointerId !== undefined) {
                try {
                    this.elements.resizeHandle.releasePointerCapture(e.pointerId);
                } catch (err) {
                    // Ignore
                }
            }
        };
        
        // Attach events to resize handle
        this.elements.resizeHandle.addEventListener('mousedown', onMouseDown);
        this.elements.resizeHandle.addEventListener('pointerdown', onMouseDown);
        
        // Attach move and up to document
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('pointermove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('pointerup', onMouseUp);
        
        console.log('[FloatingAudioPlayer] Resize functionality initialized');
    }
    
    // ========================================
    // STATE PERSISTENCE (ENHANCED FOR CROSS-PAGE)
    // ========================================
    
    saveState() {
        const rect = this.elements.player.getBoundingClientRect();
        const isHidden = this.elements.player.classList.contains('hidden');
        
        const state = {
            version: 2,
            position: {
                x: rect.left,
                y: rect.top
            },
            size: {
                width: rect.width,
                height: rect.height
            },
            volume: this.volume,
            trackIndex: this.currentTrackIndex,
            currentTime: this.audio.currentTime || 0,
            isPlaying: !this.audio.paused,
            isMinimized: this.isMinimized,
            isCompact: this.isCompact,
            wasVisible: !isHidden,
            timestamp: Date.now()
        };
        
        sessionStorage.setItem('jarchive-player-state', JSON.stringify(state));
        localStorage.setItem('jarchive-player-prefs', JSON.stringify({
            version: 2,
            position: state.position,
            size: state.size,
            volume: state.volume
        }));
        
        console.log('[FloatingAudioPlayer] State saved:', state);
    }
    
    loadState() {
        // Try sessionStorage first (cross-page state within session)
        let saved = sessionStorage.getItem('jarchive-player-state');
        let isSessionRestore = false;
        
        if (saved) {
            isSessionRestore = true;
        } else {
            // Fall back to localStorage for preferences only
            saved = localStorage.getItem('jarchive-player-prefs');
        }
        
        if (!saved) return null;
        
        try {
            const state = JSON.parse(saved);
            
            // Discard states saved by older iframe-based architecture (no version field)
            if (!state.version || state.version < 2) {
                console.log('[FloatingAudioPlayer] Discarding stale state from older version, starting fresh');
                sessionStorage.removeItem('jarchive-player-state');
                localStorage.removeItem('jarchive-player-prefs');
                return null;
            }
            
            console.log('[FloatingAudioPlayer] Loading state:', state, 'from', isSessionRestore ? 'session' : 'prefs');
            
            // Restore position (only if within visible viewport)
            if (state.position && state.position.x !== null) {
                const x = state.position.x;
                const y = state.position.y;
                // Only restore if position is on-screen
                if (x >= 0 && x < window.innerWidth - 100 &&
                    y >= 0 && y < window.innerHeight - 100) {
                    this.elements.player.style.left = `${x}px`;
                    this.elements.player.style.top = `${y}px`;
                    this.elements.player.style.right = 'auto';
                    this.elements.player.style.bottom = 'auto';
                }
                // Otherwise keep default CSS position (bottom-right)
            }
            
            // Restore size
            if (state.size) {
                if (state.size.width) {
                    this.elements.player.style.width = `${state.size.width}px`;
                }
                if (state.size.height) {
                    this.elements.player.style.height = `${state.size.height}px`;
                }
            }
            
            // Restore volume
            if (state.volume !== undefined) {
                this.volume = state.volume;
                this.audio.volume = state.volume;
                this.updateVolumeUI();
            }
            
            // Only restore playback state if from sessionStorage (recent navigation)
            if (isSessionRestore) {
                // Restore minimized/compact states
                if (state.isMinimized) {
                    this.isMinimized = true;
                    this.elements.player.classList.add('minimized');
                    this.elements.restoreBtn.classList.remove('hidden');
                }
                if (state.isCompact) {
                    this.isCompact = true;
                    this.elements.player.classList.add('compact');
                }
                
                // Restore track and playback position
                if (state.trackIndex !== undefined && this.playlist[state.trackIndex]) {
                    this.loadTrack(state.trackIndex);
                    
                    // Restore playback position after track loads
                    if (state.currentTime > 0) {
                        this.audio.addEventListener('loadedmetadata', () => {
                            this.audio.currentTime = state.currentTime;
                            console.log('[FloatingAudioPlayer] Restored playback position:', state.currentTime);
                        }, { once: true });
                    }
                    
                    // Show player if it was visible before navigation
                    if (state.wasVisible) {
                        this.show();
                        // Note: we intentionally do NOT auto-resume playback.
                        // The user must press play — audio should never start unprompted.
                    }
                }
                
                return state;
            }
            
            return null;
        } catch (error) {
            console.error('[FloatingAudioPlayer] Failed to load player state:', error);
            return null;
        }
    }
    
    // Auto-save state when important changes happen
    setupAutoSave() {
        // Save on pause/play
        this.audio.addEventListener('play', () => this.saveState());
        this.audio.addEventListener('pause', () => this.saveState());
        
        // Save periodically during playback (every 2 seconds)
        this.audio.addEventListener('timeupdate', () => {
            if (!this.audio.paused && this.audio.currentTime > 0) {
                // Throttle saves
                if (!this._lastSaveTime || Date.now() - this._lastSaveTime > 2000) {
                    this.saveState();
                    this._lastSaveTime = Date.now();
                }
            }
        });
        
        // Save on track change
        const originalLoadTrack = this.loadTrack.bind(this);
        this.loadTrack = function(index) {
            originalLoadTrack(index);
            this.saveState();
        };
        
        // Save on window close/navigation
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
        
        // Save on visibility change (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveState();
            }
        });
    }
    
    // ========================================
    // KEYBOARD SHORTCUTS
    // ========================================
    
    handleKeyboard(e) {
        // Space: Play/Pause
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            this.togglePlay();
        }
        
        // Arrow Right: Next track
        if (e.code === 'ArrowRight' && e.shiftKey) {
            e.preventDefault();
            this.nextTrack();
        }
        
        // Arrow Left: Previous track
        if (e.code === 'ArrowLeft' && e.shiftKey) {
            e.preventDefault();
            this.previousTrack();
        }
    }
    
    // ========================================
    // PUBLIC API
    // ========================================
    
    getLatestTrack() {
        return this.playlist[0];
    }
    
    // Debug method to test player functionality
    test() {
        console.log('=== Player Test ===');
        console.log('Player visible:', !this.elements.player.classList.contains('hidden'));
        console.log('Playlist tracks:', this.playlist.length);
        console.log('Current track:', this.currentTrackIndex);
        console.log('Is playing:', this.isPlaying);
        console.log('Elements bound:', !!this.elements.playBtn);
        console.log('Play button:', this.elements.playBtn);
        console.log('Header draggable:', this.elements.header);
        
        // Test click on play button
        console.log('Attempting to click play button...');
        this.elements.playBtn.click();
        
        return 'Test complete - check console for results';
    }
}

// Export for global access
window.FloatingAudioPlayer = FloatingAudioPlayer;
