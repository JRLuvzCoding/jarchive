# Persistent Audio Player - iframe Architecture

## Overview

The JArchive audio player now uses an **iframe-based architecture** to persist across page navigation. The player lives in a separate HTML document (`player-host.html`) loaded via iframe, allowing it to continue playing when users navigate between pages.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Parent Page (index.html, musicPage/index.html, etc.)  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Iframe (player-host.html)                      │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │  FloatingAudioPlayer                      │  │   │
│  │  │  - Audio Engine                           │  │   │
│  │  │  - UI Controls                            │  │   │
│  │  │  - State Management                       │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  │                                                  │   │
│  │  postMessage Communication                      │   │
│  └─────────────────────────────────────────────────┘   │
│         ↕ Messages (PLAY_TRACK, STATE_UPDATE, etc.)    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  JArchivePlayerBridge                           │   │
│  │  - API Layer                                    │   │
│  │  - playTrack(), play(), pause(), etc.           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Core Files

1. **`/player-host.html`** - Iframe document containing the audio player
2. **`/shared/player-iframe-bridge.js`** - Communication bridge for parent pages
3. **`/shared/audio-player-floating.js`** - The actual player logic (unchanged)
4. **`/shared/audio-player-floating.css`** - Player styles (unchanged)

## Integration Steps

### Step 1: Add Iframe Embed to Your Page

Add this code **just before the closing `</body>` tag** on every page where you want the player visible:

```html
<!-- ============================
     Persistent Audio Player Iframe
     ============================ -->
<iframe 
    id="jarchive-player-iframe"
    src="/player-host.html"
    style="
        position: fixed;
        bottom: 0;
        right: 0;
        width: 600px;
        height: 400px;
        border: none;
        background: transparent;
        pointer-events: none;
        z-index: 999999;
    "
    allow="autoplay"
    loading="eager">
</iframe>

<!-- Player Communication Bridge -->
<script src="/shared/player-iframe-bridge.js"></script>
```

### Step 2: Call playTrack() from Your Page

The bridge maintains **backwards compatibility** with existing code. If you already have `playTrack(title)` calls, they will work automatically.

**Example:**
```html
<button onclick="playTrack('Song Title Here')">Play Song</button>
```

**Or using the full API:**
```javascript
// Play a track
JArchivePlayerBridge.playTrack('Song Title Here');

// Control playback
JArchivePlayerBridge.play();
JArchivePlayerBridge.pause();
JArchivePlayerBridge.nextTrack();
JArchivePlayerBridge.prevTrack();

// Set volume (0 to 1)
JArchivePlayerBridge.setVolume(0.7);

// Listen to player events
JArchivePlayerBridge.on('STATE_UPDATE', (data) => {
    console.log('Player state:', data.state);
});

JArchivePlayerBridge.on('TRACK_LOADED', (data) => {
    console.log('Now playing:', data.track.title);
});
```

### Step 3: Remove Old Player Initialization

If your page previously initialized the player directly, **remove** this code:

```javascript
// DELETE THIS (old code):
// window.jarchivePlayer = new FloatingAudioPlayer();
// await window.jarchivePlayer.init();
```

The player is now initialized inside the iframe automatically.

## How It Works

### 1. Player Persistence

- The iframe document (`player-host.html`) **does not reload** when you navigate between pages
- The audio element and its state remain intact
- Music continues playing seamlessly across navigation

### 2. Communication Flow

**Parent → Iframe (Commands):**
```javascript
// Parent page calls:
playTrack('My Song');

// Bridge sends postMessage:
{ type: 'PLAY_TRACK', data: { title: 'My Song' } }

// Iframe receives and executes:
playerInstance.playTrackByTitle('My Song');
```

**Iframe → Parent (Events):**
```javascript
// Iframe sends state updates:
{ 
  type: 'STATE_UPDATE', 
  state: { 
    isPlaying: true, 
    currentTime: 45.2, 
    track: { title: 'My Song' } 
  } 
}

// Parent can listen:
JArchivePlayerBridge.on('STATE_UPDATE', (data) => {
    // Update UI based on state
});
```

### 3. Path Resolution

All paths are **absolute from root** using `/`:

- Iframe src: `/player-host.html`
- Scripts: `/shared/audio-player-floating.js`
- Playlist: `/shared/content.json`

This works from any subdirectory:
- `/index.html` → loads `/player-host.html` ✅
- `/musicPage/index.html` → loads `/player-host.html` ✅
- `/media/index.html` → loads `/player-host.html` ✅

## Styling & Positioning

### Iframe Positioning

The iframe uses `position: fixed` with:
- `bottom: 0; right: 0` - Bottom-right corner
- `width: 600px; height: 400px` - Enough space for player
- `pointer-events: none` - Click-through (but player itself captures clicks)
- `z-index: 999999` - Always on top

### Player Positioning (inside iframe)

The player floats within the iframe:
- Default: `bottom: 20px; right: 20px;` (inside iframe viewport)
- Draggable and resizable as before
- Position saved to localStorage

### Transparency

- Iframe has `background: transparent`
- Iframe body has `background: transparent`
- Only the player window itself has a background

## Migration Checklist

For each page that should have the persistent player:

- [ ] Add iframe embed code before `</body>`
- [ ] Add `<script src="/shared/player-iframe-bridge.js"></script>`
- [ ] Remove old player initialization code
- [ ] Verify `playTrack()` calls work correctly
- [ ] Test navigation between pages

## Pages to Update

- [ ] `/index.html` - Homepage
- [ ] `/musicPage/index.html` - Music archive
- [ ] `/media/index.html` - Media page
- [ ] `/blog/index.html` - Blog page

## Debugging

### Check if iframe loaded:
```javascript
document.getElementById('jarchive-player-iframe')
```

### Check if bridge is ready:
```javascript
JArchivePlayerBridge.isReady
```

### Send test message:
```javascript
JArchivePlayerBridge.playTrack('Test Song');
```

### View iframe console:
1. Right-click inside the player window
2. Choose "Inspect Element"
3. The DevTools will show the iframe's context
4. Check console for `[Player Host]` messages

### View parent console:
- Check for `[Player Bridge]` messages
- Verify `playTrack()` calls are sent

## Technical Notes

### Browser Support
- Modern browsers with postMessage support
- No external dependencies required
- Uses native iframe API

### Performance
- Single player instance shared across all pages
- No reinitialization overhead
- Audio stream remains connected during navigation
- State persists in iframe's localStorage

### Security
- postMessage communication uses `'*'` origin (safe for local site)
- For production, can validate `event.origin` in both directions
- Iframe sandbox attributes can be added if needed

### Limitations
- Iframe must be loaded on every page where player should appear
- If user opens multiple tabs, each has independent player iframe
- Some browsers may pause audio when tab is not visible (browser policy)

## Future Enhancements

Possible improvements:
- Minimize/expand iframe based on player state
- Sync state across browser tabs using BroadcastChannel API
- Add visual indicators on parent page (e.g., "Now Playing" banner)
- Queue management from any page
- Cross-page keyboard shortcuts

## Support

If the player doesn't appear or work:
1. Check browser console for errors
2. Verify all file paths are correct
3. Ensure `/player-host.html` loads successfully
4. Test postMessage communication manually
5. Check that Font Awesome CDN is accessible (for icons)
