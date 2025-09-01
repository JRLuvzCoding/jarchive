class JArchiveAudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isShuffled = false;
        this.shuffleHistory = [];
        this.isRepeating = false;
        this.isPlaying = false;
        this.volume = 0.5;
        
        this.initializePlayer();
        this.loadPlaylist();
        this.setupEventListeners();
        this.loadState();
    }

    initializePlayer() {
        // Create player HTML if it doesn't exist
        if (!document.getElementById('jarchive-player')) {
            const playerHTML = `
                <div id="jarchive-player" class="jarchive-player">
                    <div class="player-main">
                        <div class="player-info">
                            <img id="player-cover" class="player-cover" src="" alt="Album Cover">
                            <div class="track-info">
                                <div id="player-title" class="track-title">No track selected</div>
                                <div id="player-artist" class="track-artist">JARCHIVE</div>
                            </div>
                        </div>
                        
                        <div class="player-controls">
                            <button id="shuffle-btn" class="control-btn" title="Shuffle">
                                <i class="fas fa-random"></i>
                            </button>
                            <button id="prev-btn" class="control-btn" title="Previous">
                                <i class="fas fa-step-backward"></i>
                            </button>
                            <button id="play-btn" class="control-btn play-btn" title="Play">
                                <i class="fas fa-play"></i>
                            </button>
                            <button id="next-btn" class="control-btn" title="Next">
                                <i class="fas fa-step-forward"></i>
                            </button>
                            <button id="repeat-btn" class="control-btn" title="Repeat">
                                <i class="fas fa-redo"></i>
                            </button>
                        </div>
                        
                        <div class="player-progress">
                            <div class="time-display">
                                <span id="current-time">0:00</span>
                                <span id="total-time">0:00</span>
                            </div>
                            <div class="progress-container">
                                <input type="range" id="progress-bar" class="progress-bar" min="0" max="100" value="0">
                                <div id="progress-fill" class="progress-fill"></div>
                            </div>
                        </div>
                        
                        <div class="player-volume">
                            <button id="mute-btn" class="control-btn" title="Mute">
                                <i class="fas fa-volume-up"></i>
                            </button>
                            <input type="range" id="volume-bar" class="volume-bar" min="0" max="1" step="0.01" value="0.5">
                        </div>
                        
                        <div class="player-actions">
                            <button id="download-btn" class="control-btn download-btn" title="Download">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', playerHTML);
        }
        
        // Get DOM elements
        this.elements = {
            player: document.getElementById('jarchive-player'),
            cover: document.getElementById('player-cover'),
            title: document.getElementById('player-title'),
            artist: document.getElementById('player-artist'),
            playBtn: document.getElementById('play-btn'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            shuffleBtn: document.getElementById('shuffle-btn'),
            repeatBtn: document.getElementById('repeat-btn'),
            muteBtn: document.getElementById('mute-btn'),
            downloadBtn: document.getElementById('download-btn'),
            progressBar: document.getElementById('progress-bar'),
            progressFill: document.getElementById('progress-fill'),
            volumeBar: document.getElementById('volume-bar'),
            currentTime: document.getElementById('current-time'),
            totalTime: document.getElementById('total-time')
        };
    }

    loadPlaylist() {
        // Define the playlist with all available tracks
        this.playlist = [
            {
                title: "WARINTHEATMOSPHERE",
                artist: "JR & FIREWOLF",
                src: "/musicPage/Songs/WARINTHEATMOSPHERE.wav",
                cover: "/musicPage/songCovers/WarIntheAtmosphere.png",
                download: "/musicPage/Songs/WARINTHEATMOSPHERE.wav",
                length: "3:01",
                date: "2025-05-28"
            },
            {
                title: "11:59",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/lorde master.wav",
                cover: "/musicPage/songCovers/LordeCum.png",
                download: "/musicPage/Songs/lorde master.wav",
                length: "4:01",
                date: "2025-05-03"
            },
            {
                title: "Mix 3",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/RECORDED MIX.mp3",
                cover: "/musicPage/songCovers/Mix3.png",
                download: "/musicPage/Songs/RECORDED MIX.mp3",
                length: "43:52",
                date: "2025-05-03"
            },
            {
                title: "The Second Mix Of The Century",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/THE MIX.mp3",
                cover: "/musicPage/songCovers/mix2.jpg",
                download: "/musicPage/Songs/THE MIX.mp3",
                length: "14:44",
                date: "2025-04-25"
            },
            {
                title: "g66_Track",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/g66_Track.wav",
                cover: "/musicPage/songCovers/G6.jpeg",
                download: "/musicPage/Songs/g66_Track.wav",
                length: "2:57",
                date: "2025-04-18"
            },
            {
                title: "SuperTaq ft. andre y kess",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/SuperTaq ft. andre y kess.wav",
                cover: "/musicPage/songCovers/superTaq.jpg",
                download: "/musicPage/Songs/SuperTaq ft. andre y kess.wav",
                length: "1:30",
                date: "2025-04-11"
            },
            {
                title: "Flames & Fire /With Kevy/",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/Flames Fire2.wav",
                cover: "/musicPage/songCovers/flamezfire.png",
                download: "/musicPage/Songs/Flames Fire2.wav",
                length: "2:13",
                date: "2025-04-04"
            },
            {
                title: "Mix1",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/mix of the century.mp3",
                cover: "/musicPage/songCovers/Dubstep.png",
                download: "/musicPage/Songs/mix of the century.mp3",
                length: "15:38",
                date: "2025-03-28"
            },
            {
                title: "The Demo I been Poppin Since!",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/theDemoIBeenPoppinSince.wav",
                cover: "/musicPage/songCovers/theDemoIBeenPoppingSince.jpg",
                download: "/musicPage/Songs/theDemoIBeenPoppinSince.wav",
                length: "2:18",
                date: "2025-03-20"
            },
            {
                title: "Bash_50",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/Bash_55_mp3.mp3",
                cover: "/musicPage/songCovers/AI Kins.jpg",
                download: "/musicPage/Songs/Bash_55_mp3.mp3",
                length: "5:27",
                date: "2025-03-20"
            },
            {
                title: "Happening",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/SONDER THINGS KEEP HAPPENING.wav",
                cover: "/musicPage/songCovers/regular-show-dark-space-t9uyayx1rb89f2o8.png",
                download: "/musicPage/Songs/SONDER THINGS KEEP HAPPENING.wav",
                length: "3:36",
                date: "2025-03-14"
            },
            {
                title: "SomethingsKnocking",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/somethingsKnocking.mp3",
                cover: "/musicPage/songCovers/Something's Knocking.jpg",
                download: "/musicPage/Songs/somethingsKnocking.mp3",
                length: "2:14",
                date: "2024-11-17"
            },
            {
                title: "IMissJackson",
                artist: "JARCHIVE",
                src: "/musicPage/Songs/IMissJackson.mp3",
                cover: "/musicPage/songCovers/IMissJackson.jpg",
                download: "/musicPage/Songs/IMissJackson.mp3",
                length: "3:50",
                date: "2024-10-10"
            }
        ];
    }

    setupEventListeners() {
        // Audio events
        this.audio.addEventListener('loadedmetadata', () => {
            this.elements.totalTime.textContent = this.formatTime(this.audio.duration);
        });

        this.audio.addEventListener('timeupdate', () => {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.elements.progressBar.value = progress;
            this.elements.progressFill.style.width = progress + '%';
            this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
        });

        this.audio.addEventListener('ended', () => {
            this.nextTrack();
        });

        // Control buttons
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.prevBtn.addEventListener('click', () => this.previousTrack());
        this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
        this.elements.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.elements.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        this.elements.muteBtn.addEventListener('click', () => this.toggleMute());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadCurrentTrack());

        // Progress bar
        this.elements.progressBar.addEventListener('input', (e) => {
            const time = (e.target.value / 100) * this.audio.duration;
            this.audio.currentTime = time;
        });

        // Volume bar
        this.elements.volumeBar.addEventListener('input', (e) => {
            this.volume = e.target.value;
            this.audio.volume = this.volume;
            this.updateVolumeIcon();
            this.saveState();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousTrack();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextTrack();
                    break;
                case 'KeyM':
                    e.preventDefault();
                    this.toggleMute();
                    break;
            }
        });
    }

    playTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentTrackIndex = index;
        const track = this.playlist[index];
        
        this.audio.src = track.src;
        this.audio.volume = this.volume;
        
        this.elements.title.textContent = track.title;
        this.elements.artist.textContent = track.artist;
        this.elements.cover.src = track.cover;
        this.elements.cover.alt = `${track.title} cover`;
        
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.showPlayer();
        }).catch(err => {
            console.error('Error playing track:', err);
        });
        
        this.saveState();
    }

    togglePlay() {
        if (this.playlist.length === 0) return;
        
        if (this.audio.src === '') {
            this.playTrack(0);
        } else if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play();
            this.isPlaying = true;
        }
        
        this.updatePlayButton();
    }

    previousTrack() {
        if (this.playlist.length === 0) return;
        
        let newIndex;
        if (this.isShuffled) {
            // In shuffle mode, go to previous track in shuffle history
            if (this.shuffleHistory.length > 1) {
                this.shuffleHistory.pop(); // Remove current track
                newIndex = this.shuffleHistory[this.shuffleHistory.length - 1];
            } else {
                newIndex = this.currentTrackIndex - 1;
                if (newIndex < 0) newIndex = this.playlist.length - 1;
            }
        } else {
            newIndex = this.currentTrackIndex - 1;
            if (newIndex < 0) newIndex = this.playlist.length - 1;
        }
        
        this.playTrack(newIndex);
    }

    nextTrack() {
        if (this.playlist.length === 0) return;
        
        let newIndex;
        if (this.isShuffled) {
            // Generate next shuffled track
            newIndex = this.getNextShuffledIndex();
        } else {
            newIndex = this.currentTrackIndex + 1;
            if (newIndex >= this.playlist.length) {
                if (this.isRepeating) {
                    newIndex = 0;
                } else {
                    return; // Stop at end
                }
            }
        }
        
        this.playTrack(newIndex);
    }

    getNextShuffledIndex() {
        if (this.playlist.length <= 1) return 0;
        
        let availableTracks = [];
        for (let i = 0; i < this.playlist.length; i++) {
            if (i !== this.currentTrackIndex) {
                availableTracks.push(i);
            }
        }
        
        // Remove recently played tracks from available options
        const recentCount = Math.min(3, this.playlist.length - 1);
        for (let i = this.shuffleHistory.length - 1; i >= 0 && recentCount > 0; i--) {
            const index = availableTracks.indexOf(this.shuffleHistory[i]);
            if (index > -1) {
                availableTracks.splice(index, 1);
                recentCount--;
            }
        }
        
        const randomIndex = Math.floor(Math.random() * availableTracks.length);
        const selectedIndex = availableTracks[randomIndex];
        
        this.shuffleHistory.push(selectedIndex);
        if (this.shuffleHistory.length > 10) {
            this.shuffleHistory.shift();
        }
        
        return selectedIndex;
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.elements.shuffleBtn.classList.toggle('active', this.isShuffled);
        
        if (this.isShuffled) {
            this.shuffleHistory = [this.currentTrackIndex];
        }
        
        this.saveState();
    }

    toggleRepeat() {
        this.isRepeating = !this.isRepeating;
        this.elements.repeatBtn.classList.toggle('active', this.isRepeating);
        this.saveState();
    }

    toggleMute() {
        this.audio.muted = !this.audio.muted;
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const icon = this.elements.muteBtn.querySelector('i');
        if (this.audio.muted || this.volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (this.volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    updatePlayButton() {
        const icon = this.elements.playBtn.querySelector('i');
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
            this.elements.playBtn.title = 'Pause';
        } else {
            icon.className = 'fas fa-play';
            this.elements.playBtn.title = 'Play';
        }
    }

    showPlayer() {
        this.elements.player.style.display = 'block';
    }

    hidePlayer() {
        this.elements.player.style.display = 'none';
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    downloadCurrentTrack() {
        if (this.playlist.length === 0 || this.currentTrackIndex < 0) return;
        
        const track = this.playlist[this.currentTrackIndex];
        const link = document.createElement('a');
        link.href = track.download;
        link.download = `${track.title} - ${track.artist}.${track.download.split('.').pop()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Play specific track by title
    playTrackByTitle(title) {
        const index = this.playlist.findIndex(track => 
            track.title.toLowerCase() === title.toLowerCase()
        );
        if (index !== -1) {
            this.playTrack(index);
        }
    }

    // Get latest track
    getLatestTrack() {
        if (this.playlist.length === 0) return null;
        
        // Sort by date and return the most recent
        const sorted = [...this.playlist].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        return sorted[0];
    }

    // Save/load state for persistence
    saveState() {
        const state = {
            currentTrackIndex: this.currentTrackIndex,
            volume: this.volume,
            isShuffled: this.isShuffled,
            isRepeating: this.isRepeating,
            shuffleHistory: this.shuffleHistory,
            currentTime: this.audio.currentTime
        };
        localStorage.setItem('jarchive-player-state', JSON.stringify(state));
    }

    loadState() {
        const saved = localStorage.getItem('jarchive-player-state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.volume = state.volume || 0.5;
                this.isShuffled = state.isShuffled || false;
                this.isRepeating = state.isRepeating || false;
                this.shuffleHistory = state.shuffleHistory || [];
                
                this.elements.volumeBar.value = this.volume;
                this.elements.shuffleBtn.classList.toggle('active', this.isShuffled);
                this.elements.repeatBtn.classList.toggle('active', this.isRepeating);
                this.updateVolumeIcon();
                
                // Restore track if it was playing
                if (state.currentTrackIndex !== undefined && state.currentTrackIndex >= 0) {
                    this.playTrack(state.currentTrackIndex);
                    if (state.currentTime) {
                        this.audio.currentTime = state.currentTime;
                    }
                }
            } catch (e) {
                console.error('Error loading player state:', e);
            }
        }
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.jarchivePlayer = new JArchiveAudioPlayer();
});
