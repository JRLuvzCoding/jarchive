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
        
        this.init();
    }
    
    init() {
        this.loadPlaylist();
        this.createPlayerUI();
        this.bindElements();
        this.attachEventListeners();
        this.loadState();
        this.initializeDrag();
        this.initializeResize();
    }
    
    // ========================================
    // PLAYLIST LOADING
    // ========================================
    
    async loadPlaylist() {
        try {
            const response = await fetch('../shared/content.json');
            const data = await response.json();
            
            if (data.music && Array.isArray(data.music)) {
                this.playlist = data.music.map(track => ({
                    title: track.title,
                    artist: track.artist || 'JARCHIVE',
                    cover: `../${track.cover}`,
                    audio: `../${track.audio}`,
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
            <div class="jarchive-floating-player" id="floating-player">
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
                            <i class="fas fa-step-backward"></i>
                        </button>
                        <button class="player-control-btn play-btn" id="floating-play" title="Play" aria-label="Play/Pause">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="player-control-btn" id="floating-next" title="Next" aria-label="Next track">
                            <i class="fas fa-step-forward"></i>
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
                            <i class="fas fa-volume-up"></i>
                        </div>
                        <div class="player-volume-slider" id="floating-volume-slider">
                            <div class="player-volume-fill" id="floating-volume-fill"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Resize handle -->
                <div class="resize-handle"></div>
            </div>
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
            minimizedIcon: document.querySelector('.minimized-icon')
        };
    }
    
    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    attachEventListeners() {
        // Traffic light controls
        this.elements.closeBtn.addEventListener('click', () => this.hide());
        this.elements.minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        this.elements.expandBtn.addEventListener('click', () => this.toggleCompact());
        
        // Minimized icon click to restore
        this.elements.minimizedIcon.addEventListener('click', () => this.toggleMinimize());
        
        // Playback controls
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.prevBtn.addEventListener('click', () => this.previousTrack());
        this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
        
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
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    // ========================================
    // PLAYBACK CONTROLS
    // ========================================
    
    playTrackByTitle(title) {
        const index = this.playlist.findIndex(track => track.title === title);
        if (index !== -1) {
            this.loadTrack(index);
            this.play();
            this.show();
        }
    }
    
    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentTrackIndex = index;
        const track = this.playlist[index];
        
        this.audio.src = track.audio;
        this.elements.cover.src = track.cover;
        this.elements.title.textContent = track.title;
        this.elements.artist.textContent = track.artist;
        
        this.saveState();
    }
    
    play() {
        this.audio.play().catch(err => console.error('Playback failed:', err));
        this.isPlaying = true;
    }
    
    pause() {
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
        this.elements.totalTime.textContent = this.formatTime(this.audio.duration);
    }
    
    seekTo(e) {
        const rect = this.elements.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.audio.duration;
    }
    
    setVolume(e) {
        const rect = this.elements.volumeSlider.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.volume = percent;
        this.audio.volume = percent;
        this.isMuted = false;
        this.updateVolumeUI();
        this.saveState();
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.volume = this.isMuted ? 0 : this.volume;
        this.updateVolumeUI();
    }
    
    updateVolumeUI() {
        const displayVolume = this.isMuted ? 0 : this.volume;
        this.elements.volumeFill.style.width = `${displayVolume * 100}%`;
        
        const icon = this.elements.volumeIcon.querySelector('i');
        icon.classList.remove('fa-volume-up', 'fa-volume-down', 'fa-volume-mute');
        
        if (this.isMuted || displayVolume === 0) {
            icon.classList.add('fa-volume-mute');
        } else if (displayVolume < 0.5) {
            icon.classList.add('fa-volume-down');
        } else {
            icon.classList.add('fa-volume-up');
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
    }
    
    hide() {
        this.elements.player.classList.add('hidden');
    }
    
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.elements.player.classList.toggle('minimized');
    }
    
    toggleCompact() {
        this.isCompact = !this.isCompact;
        this.elements.player.classList.toggle('compact');
    }
    
    // ========================================
    // DRAG FUNCTIONALITY
    // ========================================
    
    initializeDrag() {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        this.elements.header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.traffic-lights')) return;
            
            isDragging = true;
            this.elements.player.classList.add('dragging');
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = this.elements.player.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            // Constrain to viewport
            const rect = this.elements.player.getBoundingClientRect();
            newX = Math.max(0, Math.min(window.innerWidth - rect.width, newX));
            newY = Math.max(0, Math.min(window.innerHeight - rect.height, newY));
            
            this.elements.player.style.left = `${newX}px`;
            this.elements.player.style.top = `${newY}px`;
            this.elements.player.style.right = 'auto';
            this.elements.player.style.bottom = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.elements.player.classList.remove('dragging');
                this.saveState();
            }
        });
    }
    
    // ========================================
    // RESIZE FUNCTIONALITY
    // ========================================
    
    initializeResize() {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        this.elements.resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            this.elements.player.classList.add('resizing');
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = this.elements.player.getBoundingClientRect();
            startWidth = rect.width;
            startHeight = rect.height;
            
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
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
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                this.elements.player.classList.remove('resizing');
                this.saveState();
            }
        });
    }
    
    // ========================================
    // STATE PERSISTENCE
    // ========================================
    
    saveState() {
        const rect = this.elements.player.getBoundingClientRect();
        const state = {
            position: {
                x: rect.left,
                y: rect.top
            },
            size: {
                width: rect.width,
                height: rect.height
            },
            volume: this.volume,
            trackIndex: this.currentTrackIndex
        };
        
        localStorage.setItem('jarchive-player-state', JSON.stringify(state));
    }
    
    loadState() {
        const saved = localStorage.getItem('jarchive-player-state');
        if (!saved) return;
        
        try {
            const state = JSON.parse(saved);
            
            // Restore position
            if (state.position.x !== null) {
                this.elements.player.style.left = `${state.position.x}px`;
                this.elements.player.style.top = `${state.position.y}px`;
                this.elements.player.style.right = 'auto';
                this.elements.player.style.bottom = 'auto';
            }
            
            // Restore size
            if (state.size.width) {
                this.elements.player.style.width = `${state.size.width}px`;
            }
            if (state.size.height) {
                this.elements.player.style.height = `${state.size.height}px`;
            }
            
            // Restore volume
            if (state.volume !== undefined) {
                this.volume = state.volume;
                this.audio.volume = state.volume;
                this.updateVolumeUI();
            }
            
            // Restore track (don't autoplay)
            if (state.trackIndex !== undefined && this.playlist[state.trackIndex]) {
                this.loadTrack(state.trackIndex);
            }
        } catch (error) {
            console.error('Failed to load player state:', error);
        }
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
}

// ========================================
// INITIALIZE ON DOM READY
// ========================================

let jarchivePlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    jarchivePlayer = new FloatingAudioPlayer();
    window.jarchivePlayer = jarchivePlayer;
});

// Export for global access
window.FloatingAudioPlayer = FloatingAudioPlayer;
