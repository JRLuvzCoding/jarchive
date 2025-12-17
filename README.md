# JARCHIVE.NET - Modernized

A modernized version of jarchive.net with enhanced audio player, navigation, and UI improvements while preserving the site's cyberpunk aesthetic.

## 🎵 Features

### Audio Player
- **Modern HTML5 Audio Player**: Persistent across all pages with localStorage state management
- **Playlist Management**: Full playlist with all tracks from the music collection
- **Advanced Controls**: Play/pause, next/previous, shuffle, repeat, volume control
- **Smart Shuffle**: True shuffle with history tracking to avoid immediate repeats
- **Download Links**: Direct download links for all tracks in both player and track listings
- **Keyboard Shortcuts**: Space (play/pause), Arrow keys (previous/next), M (mute)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Navigation
- **Unified Navigation**: Shared navigation component across all pages
- **Smart Path Resolution**: Automatically adjusts paths for subdirectories
- **Active State Highlighting**: Current page is highlighted in navigation
- **Mobile-Friendly**: Hamburger menu with smooth animations
- **Accessibility**: Keyboard navigation and focus states

### Homepage Enhancements
- **Hero Section**: Modern hero with animated title and description
- **Latest Release Module**: Automatically displays the most recent track with play/download options
- **Media Gallery**: Curated selection of photos and videos from the media collection
- **Responsive Layout**: Optimized for all screen sizes

### Music Page
- **Enhanced Track Listings**: Modern table design with improved typography
- **Download Integration**: Every track has a download link
- **Improved Visual Design**: Better spacing, hover effects, and visual hierarchy
- **Cover Art Integration**: Album covers with hover effects

### Blog & Media Pages
- **Consistent Design**: Unified styling across all pages
- **Enhanced Typography**: Improved readability and visual appeal
- **Responsive Galleries**: Media items with hover overlays and descriptions

## 🛠 Technical Improvements

### Architecture
- **Shared Components**: Reusable audio player and navigation components
- **Modular CSS**: Organized stylesheets for maintainability
- **State Persistence**: Audio player state saved in localStorage
- **Cross-Page Functionality**: Player persists across page navigation

### Performance
- **Optimized Assets**: Efficient loading of audio files and images
- **Responsive Images**: Proper sizing for different screen sizes
- **Smooth Animations**: Hardware-accelerated CSS transitions
- **Accessibility**: ARIA labels, focus states, and keyboard navigation

### Browser Compatibility
- **Modern Browsers**: Full support for Chrome, Firefox, Safari, Edge
- **Mobile Support**: Responsive design for iOS and Android
- **Progressive Enhancement**: Graceful degradation for older browsers

## 📁 File Structure

```
jarchive/
├── index.html                 # Modernized homepage
├── musicPage/
│   └── index.html            # Enhanced music page
├── blog/
│   └── index.html            # Updated blog page
├── media/
│   └── index.html            # Improved media page
├── shared/
│   ├── audio-player.js       # Shared audio player component
│   ├── audio-player.css      # Audio player styles
│   ├── navigation.js         # Shared navigation component
│   └── navigation.css        # Navigation styles
├── musicPage/
│   ├── Songs/                # Audio files
│   └── songCovers/           # Album artwork
├── media/
│   ├── Photos/               # Image files
│   └── Videos/               # Video files
└── Icons/                    # Site icons
```

## 🎮 Usage

### Audio Player Controls
- **Play/Pause**: Click play button or press Space
- **Next/Previous**: Use arrow buttons or Arrow Left/Right keys
- **Shuffle**: Click shuffle button to enable/disable
- **Repeat**: Click repeat button for loop mode
- **Volume**: Use volume slider or press M to mute
- **Download**: Click download button for current track

### Navigation
- **Desktop**: Hover over navigation items
- **Mobile**: Tap hamburger menu to open/close
- **Keyboard**: Tab through navigation items
- **Escape**: Close mobile menu

## 🎨 Design Philosophy

The modernization maintains the original cyberpunk aesthetic while adding:
- **Modern Typography**: Improved font hierarchy and spacing
- **Enhanced Contrast**: Better readability and accessibility
- **Smooth Animations**: Subtle hover effects and transitions
- **Consistent Theming**: Unified color scheme and visual language
- **Responsive Design**: Optimized for all device sizes

## 🚀 Future Enhancements

Potential improvements for future updates:
- **Playlist Management**: Create and save custom playlists
- **Social Features**: Share tracks and playlists
- **Analytics**: Track listening patterns and popular content
- **Advanced Audio**: Equalizer and audio effects
- **Progressive Web App**: Offline functionality and app-like experience

## 📝 Commit Message

```
feat(site): modern audio player with shuffle + downloads, working hamburger across subdirs, refreshed homepage with latest song and media; theme cleanup and accessibility polish.
```

---

*Built with modern web technologies while preserving the unique JARCHIVE aesthetic.*
