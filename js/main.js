// Form handling
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            try {
                // Here you would typically send the data to your backend
                // For now, we'll just log it and show a success message
                console.log('Form submitted:', data);
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = 'Message envoyé avec succès ! Je vous répondrai dans les plus brefs délais.';
                successMessage.setAttribute('role', 'alert');
                contactForm.reset();
                contactForm.appendChild(successMessage);
                
                // Remove success message after 5 seconds
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('Une erreur est survenue. Veuillez réessayer plus tard.');
            }
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Intersection Observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('fade-in');
        observer.observe(section);
    });
    
    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
});

// Carousel functionality
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.projects-carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const prevButton = carousel.querySelector('.carousel-prev');
    const nextButton = carousel.querySelector('.carousel-next');
    const dotsContainer = carousel.querySelector('.carousel-dots');

    let currentIndex = 0;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;

    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('carousel-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.querySelectorAll('.carousel-dot'));

    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = index;
        currentTranslate = index * -100;
        prevTranslate = currentTranslate;
        setSliderPosition();
        updateDots();
    }

    function setSliderPosition() {
        track.style.transform = `translateX(${currentTranslate}%)`;
    }

    // Touch events
    track.addEventListener('touchstart', touchStart);
    track.addEventListener('touchmove', touchMove);
    track.addEventListener('touchend', touchEnd);

    function touchStart(event) {
        startPos = event.touches[0].clientX;
        isDragging = true;
        track.style.transition = 'none';
    }

    function touchMove(event) {
        if (!isDragging) return;
        const currentPosition = event.touches[0].clientX;
        const diff = currentPosition - startPos;
        const slideWidth = track.offsetWidth;
        currentTranslate = prevTranslate + (diff / slideWidth * 100);
        
        // Limit the drag
        if (currentTranslate > 0) currentTranslate = 0;
        if (currentTranslate < -((slides.length - 1) * 100)) {
            currentTranslate = -((slides.length - 1) * 100);
        }
        
        setSliderPosition();
    }

    function touchEnd() {
        isDragging = false;
        track.style.transition = 'transform 0.5s ease-in-out';
        
        const movedBy = currentTranslate - prevTranslate;
        
        // Determine direction to slide
        if (Math.abs(movedBy) > 20) {
            if (movedBy < 0 && currentIndex < slides.length - 1) {
                currentIndex++;
            } else if (movedBy > 0 && currentIndex > 0) {
                currentIndex--;
            }
        }
        
        goToSlide(currentIndex);
    }

    // Button controls
    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            goToSlide(currentIndex - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentIndex < slides.length - 1) {
            goToSlide(currentIndex + 1);
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            goToSlide(currentIndex - 1);
        } else if (e.key === 'ArrowRight' && currentIndex < slides.length - 1) {
            goToSlide(currentIndex + 1);
        }
    });
}); 