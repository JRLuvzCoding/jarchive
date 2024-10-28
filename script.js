// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Loading Screen
    const loadingScreen = document.getElementById('loadingScreen');
    window.addEventListener('load', () => {
        loadingScreen.style.display = 'none';
    });

    // Back to Top Button
    const backToTopButton = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Audio Player Controls
    const audioPlayer = document.getElementById('audioPlayer');
    const audioSource = document.getElementById('audioSource');
    const nextTrackButton = document.getElementById('nextTrackButton');

    nextTrackButton.addEventListener('click', () => {
        changeTrack('song2.mp3');
    });

    function changeTrack(track) {
        audioSource.src = track;
        audioPlayer.load();
        audioPlayer.play();
    }
});
