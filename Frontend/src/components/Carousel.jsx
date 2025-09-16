import React, { useState, useEffect, useRef } from "react";
import "../styles/CustomCarousel.css";

const slides = [
  {
    img: "/images/f2.webp",
    title: "Bienvenido a SwapWeb",
    subtitle: `SwapWeb es una aplicación web orientada exclusivamente al intercambio de productos
entre usuarios
`,
  },
  {
    img: "/images/foto4.avif",
    title: "¡Dale valor a lo que tenés!",
    subtitle:
      "Lo que para vos ya no es útil, puede ser el tesoro de otra persona. ¡Intercambiá y sorprendete!\n",
  },
  {
    img: "/images/f3.avif",
    title: "Explora productos únicos",
    subtitle: "Publica lo que ya no usas y encuentra lo que buscas",
  },
];

const CustomCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const carouselRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const touchStartXRef = useRef(null);
  const touchDeltaXRef = useRef(0);
  const pointerDownRef = useRef(false);

  const next = () => setCurrent((current + 1) % slides.length);
  const prev = () => setCurrent((current - 1 + slides.length) % slides.length);

  // Efecto flotante sutil
  useEffect(() => {
    const handleScroll = () => {
      if (carouselRef.current) {
        const rect = carouselRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Solo aplicar efecto cuando el carrusel está visible
        if (rect.top < windowHeight && rect.bottom > 0) {
          const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
          setScrollY(scrollProgress);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Autoplay cada 3 segundos (pausable)
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [paused]);

  // Pausar cuando la pestaña no está visible
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Handlers de swipe/touch y pointer para navegación sin botones
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
    setPaused(true);
  };

  const handleTouchMove = (e) => {
    if (touchStartXRef.current == null) return;
    const x = e.touches[0].clientX;
    touchDeltaXRef.current = x - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    const deltaX = touchDeltaXRef.current || 0;
    const threshold = 50; // píxeles para considerar swipe
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) next();
      else prev();
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    setPaused(false);
  };

  const handlePointerDown = (e) => {
    pointerDownRef.current = true;
    touchStartXRef.current = e.clientX;
    touchDeltaXRef.current = 0;
    setPaused(true);
  };

  const handlePointerMove = (e) => {
    if (!pointerDownRef.current || touchStartXRef.current == null) return;
    touchDeltaXRef.current = e.clientX - touchStartXRef.current;
  };

  const handlePointerUp = () => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;
    const deltaX = touchDeltaXRef.current || 0;
    const threshold = 60;
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) next(); else prev();
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    setPaused(false);
  };

  return (
    <div
      ref={carouselRef}
      className="custom-carousel-container"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="custom-carousel-slide">
        <img 
          src={slides[current].img} 
          alt={`slide-${current}`}
          style={{
            transform: `translateY(${(scrollY - 0.5) * 20}px)`,
          }}
        />
        <div className="custom-carousel-overlay">
          <div className="carousel-text-group">
            <div className="carousel-title">{slides[current].title}</div>
            <div className="carousel-subtitle">{slides[current].subtitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCarousel;
