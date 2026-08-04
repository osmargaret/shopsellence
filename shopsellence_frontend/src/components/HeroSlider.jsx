import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;
  const timeoutRef = useRef(null);

  const slidesData = [
    {
      title: (
        <>
          Elevate Your <span className="highlight">Style</span>
        </>
      ),
      description: 'Discover the latest collections at Shopsellence – where elegance meets culture.',
      btnText: 'Explore Wardrobe →',
      decorStyles: [{}, {}, {}]
    },
    {
      title: (
        <>
          New <span className="highlight">Designs</span> Dropping
        </>
      ),
      description: 'Be the first to wear our fresh new arrivals — handpicked for the modern individual.',
      btnText: 'Shop New Arrivals →',
      decorStyles: [
        { background: 'var(--rose)' },
        { background: 'var(--gold)' },
        {}
      ]
    },
    {
      title: (
        <>
          Hot <span className="highlight">Deals</span> &amp; Sales
        </>
      ),
      description: 'Limited-time offers on your favourite styles. Don\'t miss out on these exclusive prices.',
      btnText: 'Grab Deals →',
      decorStyles: [
        { background: 'var(--teal)' },
        { background: 'var(--purple-500)' },
        {}
      ]
    }
  ];

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(
      () =>
        setCurrentSlide((prevIndex) =>
          prevIndex === totalSlides - 1 ? 0 : prevIndex + 1
        ),
      5000
    );

    return () => {
      resetTimeout();
    };
  }, [currentSlide]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <section className="hero-slider" id="heroSlider">
      <div
        className="slides"
        id="slides"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slidesData.map((slide, idx) => (
          <div className="slide" key={idx}>
            <div
              className="slide-bg"
              style={{ backgroundImage: "url('/shopsellence_images/Hero_section.png')" }}
            ></div>
            <div className="decor d1" style={slide.decorStyles[0]}></div>
            <div className="decor d2" style={slide.decorStyles[1]}></div>
            <div className="decor d3" style={slide.decorStyles[2]}></div>
            <div className="slide-content">
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
              <Link to="/wardrobe" className="btn">
                {slide.btnText}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <button className="slider-arrow prev" onClick={prevSlide} aria-label="Previous slide">
        ‹
      </button>
      <button className="slider-arrow next" onClick={nextSlide} aria-label="Next slide">
        ›
      </button>

      <div className="slider-controls" id="sliderDots">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <span
            key={idx}
            className={`dot ${currentSlide === idx ? 'active' : ''}`}
            onClick={() => goToSlide(idx)}
          ></span>
        ))}
      </div>
    </section>
  );
}
