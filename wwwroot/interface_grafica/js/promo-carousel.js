document.querySelectorAll('.promo-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.promo-carousel-track');
    const controls = [...carousel.querySelectorAll('.promo-carousel-controls button')];
    const slides = controls.map((button) => carousel.querySelector(`#${button.dataset.slide}`));

    if (!track || controls.length === 0 || slides.some((slide) => !slide)) {
        console.error('Estrutura incompleta do carrossel promocional.');
        return;
    }

    const mobileLayout = window.matchMedia('(max-width: 768px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer;

    const observeVisibleSlide = (entries) => {
        const active = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (active) {
            controls.forEach((button, index) => {
                if (slides[index] === active.target) {
                    button.setAttribute('aria-current', 'true');
                } else {
                    button.removeAttribute('aria-current');
                }
            });
        }
    };

    controls.forEach((button, index) => {
        button.addEventListener('click', () => {
            const slide = slides[index];
            const left = track.scrollLeft
                + slide.getBoundingClientRect().left
                - track.getBoundingClientRect().left;

            track.scrollTo({
                left,
                behavior: reducedMotion.matches ? 'auto' : 'smooth'
            });
        });
    });

    const updateObserver = () => {
        observer?.disconnect();

        if (!mobileLayout.matches) return;

        observer = new IntersectionObserver(observeVisibleSlide, {
            root: track,
            threshold: 0.6
        });

        slides.forEach((slide) => observer.observe(slide));
    };

    updateObserver();
    mobileLayout.addEventListener('change', updateObserver);
});
