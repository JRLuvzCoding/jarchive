class JArchiveNavigation {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.initializeNavigation();
        this.setupEventListeners();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('/blog')) return 'blog';
        if (path.includes('/musicPage')) return 'music';
        if (path.includes('/media')) return 'media';
        return 'home';
    }

    initializeNavigation() {
        // Create navigation HTML if it doesn't exist
        if (!document.getElementById('jarchive-nav')) {
            const navHTML = `
                <nav id="jarchive-nav" class="jarchive-nav">
                    <div class="menu-icon" id="menu-toggle">
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                    <ul id="nav-menu" class="nav-menu">
                        <li><a href="/" class="nav-link" data-page="home">Home</a></li>
                        <li><a href="/blog/" class="nav-link" data-page="blog">Blog</a></li>
                        <li><a href="/musicPage/" class="nav-link" data-page="music">Music</a></li>
                        <li><a href="/media/" class="nav-link" data-page="media">Media</a></li>
                    </ul>
                </nav>
            `;
            
            // Insert navigation into header
            const header = document.querySelector('header');
            if (header) {
                header.insertAdjacentHTML('beforeend', navHTML);
            }
        }
        
        this.highlightActivePage();
    }

    highlightActivePage() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === this.currentPage) {
                link.classList.add('active');
            }
        });
    }

    setupEventListeners() {
        const menuToggle = document.getElementById('menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('show-menu');
                menuToggle.classList.toggle('active');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('show-menu');
                    menuToggle.classList.remove('active');
                }
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    navMenu.classList.remove('show-menu');
                    menuToggle.classList.remove('active');
                }
            });

            // Close menu when navigating
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('show-menu');
                    menuToggle.classList.remove('active');
                });
            });
        }
    }

    // Method to update navigation for different page depths
    updatePaths(basePath = '') {
        const navLinks = document.querySelectorAll('.nav-link');
        const pathMap = {
            'home': basePath + '/',
            'blog': basePath + '/blog/',
            'music': basePath + '/musicPage/',
            'media': basePath + '/media/'
        };

        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (pathMap[page]) {
                link.href = pathMap[page];
            }
        });
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.jarchiveNav = new JArchiveNavigation();
    
    // Update paths based on current page depth
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 1) {
        const basePath = '../'.repeat(pathSegments.length - 1);
        window.jarchiveNav.updatePaths(basePath);
    }
});
