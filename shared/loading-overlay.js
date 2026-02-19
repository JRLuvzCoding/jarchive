/* ========================================
   GLOBAL LOADING OVERLAY LOGIC
   Handles showing/hiding loading overlay
   ======================================== */

(function() {
    'use strict';

    let overlayStartTime = null;
    const MIN_DISPLAY_TIME = 1000; // Minimum 1 second display
    const TRANSITION_DURATION = 800; // Match CSS transition

    // Create loading overlay element
    function createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-text">
                Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </div>
        `;
        document.body.insertBefore(overlay, document.body.firstChild);
        overlayStartTime = Date.now();
        return overlay;
    }

    // Hide the loading overlay with minimum display time
    function hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay || overlay.classList.contains('hidden')) {
            return;
        }

        const elapsedTime = Date.now() - (overlayStartTime || 0);
        const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);

        // Wait for minimum display time before hiding
        setTimeout(() => {
            if (overlay && overlay.parentNode) {
                overlay.classList.add('hidden');
                // Remove from DOM after transition completes
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, TRANSITION_DURATION + 100);
            }
        }, remainingTime);
    }

    // Show the loading overlay (for navigation)
    function showLoadingOverlay() {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = createLoadingOverlay();
        } else {
            overlay.classList.remove('hidden');
            overlayStartTime = Date.now();
        }
    }

    // Initialize on DOM ready
    function init() {
        // Create overlay immediately
        createLoadingOverlay();

        // Hide overlay once page is fully loaded
        // Always use window.load event to ensure consistent timing
        window.addEventListener('load', hideLoadingOverlay);
        
        // Fallback: hide after max time if load event doesn't fire
        setTimeout(() => {
            hideLoadingOverlay();
        }, 5000);

        // Intercept internal link clicks and show loading overlay
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Check if it's an internal link (relative path or same domain)
            const isInternal = href.startsWith('/') || 
                               href.startsWith('./') || 
                               href.startsWith('../') ||
                               (!href.startsWith('http') && !href.startsWith('#'));

            // Don't show overlay for hash links (same page navigation)
            const isHashLink = href.startsWith('#');

            // Show overlay for internal navigation only
            if (isInternal && !isHashLink && link.target !== '_blank') {
                showLoadingOverlay();
            }
        }, true);

        // Handle browser back/forward buttons
        window.addEventListener('pageshow', function(event) {
            // If page is loaded from cache (back/forward navigation)
            if (event.persisted) {
                hideLoadingOverlay();
            }
        });
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose globally for potential manual control
    window.loadingOverlay = {
        show: showLoadingOverlay,
        hide: hideLoadingOverlay
    };
})();
