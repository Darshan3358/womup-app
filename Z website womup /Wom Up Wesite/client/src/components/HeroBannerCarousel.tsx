import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Printer, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigation } from '../context/NavigationContext';

export interface HeroSlide {
  id: string;
  theme: 'dark' | 'light';
  badge: string;
  headlineLine1: string;
  headlineLine2: string;
  subtext: string;
  ctaText: string;
  secondaryCtaText?: string;
  image: string;
  categorySlug?: string;
  linkType: 'category' | 'shop' | 'printing' | 'wallet';
}

export const HERO_SLIDES: HeroSlide[] = [
  // 1. Primary 9-Minute Delivery Hero Banner
  {
    id: 'hero_delivery',
    theme: 'dark',
    badge: '⚡ 9-MIN HYPERLOCAL DELIVERY',
    headlineLine1: 'Save More.',
    headlineLine2: 'Delivered in 9 Mins.',
    subtext: 'Live dark store stock in Ahmedabad. Farm-fresh dairy, produce, snacks & daily essentials straight to your doorstep.',
    ctaText: 'Explore Catalog',
    secondaryCtaText: '10-Min Document Printing',
    image: '/banners/hero_delivery.jpg',
    linkType: 'shop',
  },
  // 2. Fresh Fruits & Vegetables Banner
  {
    id: 'hero_fresh',
    theme: 'light',
    badge: '🥦 100% FARM FRESH',
    headlineLine1: 'Farm Fresh Fruits',
    headlineLine2: '& Crispy Veggies.',
    subtext: 'Dewy apples, crisp capsicum & fresh greens sourced daily from local cold chains. Dispatched chilled in under 10 minutes.',
    ctaText: 'Shop Fresh Produce',
    image: '/banners/hero_fresh.jpg',
    categorySlug: 'vegetables',
    linkType: 'category',
  },
  // 3. Document Printing in 10 Mins (Unique Selling Point)
  {
    id: 'hero_printing',
    theme: 'dark',
    badge: '🖨️ CLOUD DOCUMENT PRINTING',
    headlineLine1: 'Need Quick Prints?',
    headlineLine2: 'Delivered in 10 Mins.',
    subtext: 'Upload PDF, DOCX or images from your phone. Laser-crisp B&W, color & spiral binding delivered confidential & fast.',
    ctaText: 'Upload Documents Now',
    image: '/banners/hero_printing.jpg',
    linkType: 'printing',
  },
  // 4. Earn Shopping Coins (Loyalty Rewards Program)
  {
    id: 'hero_coins',
    theme: 'dark',
    badge: '🪙 WORMUP REWARDS',
    headlineLine1: 'Earn Shopping Coins',
    headlineLine2: '1 Coin = ₹1 Cash.',
    subtext: 'Get 10 coins on every grocery order. Redeem for instant discounts at checkout or scan & pay at local partner stores.',
    ctaText: 'View My Coins',
    image: '/banners/hero_coins.jpg',
    linkType: 'wallet',
  },
];

export const HeroBannerCarousel: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  const totalSlides = HERO_SLIDES.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToIndex = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Auto-scroll every 5.5 seconds
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, goToNext]);

  const handleCtaClick = (slide: HeroSlide) => {
    if (slide.linkType === 'printing') {
      navigateTo('printing');
    } else if (slide.linkType === 'wallet') {
      navigateTo('account', { accountTab: 'wallet' });
    } else if (slide.linkType === 'category' && slide.categorySlug) {
      navigateTo('shop', { categorySlug: slide.categorySlug });
    } else {
      navigateTo('shop');
    }
  };

  return (
    <div
      className="hero-banner-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Viewport Container (500px+ height on desktop) */}
      <div className="hero-banner-viewport">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;

          return (
            <div
              key={slide.id}
              className={`hero-slide-item ${isActive ? 'active' : ''}`}
            >
              {/* Background Image Container with Ken-Burns Smooth Motion */}
              <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
                <motion.img
                  src={slide.image}
                  alt={`${slide.headlineLine1} ${slide.headlineLine2}`}
                  className="hero-banner-image"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  animate={{
                    scale: isActive ? 1.06 : 1,
                  }}
                  transition={{
                    duration: 5.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                />

                {/* Left Gradient Fade Overlay for Crystal Clear Typography */}
                <div className={`hero-slide-overlay ${slide.theme}`} />
              </div>

              {/* Text & Content Overlay on Left Side with Staggered Motion */}
              <div className="container hero-slide-container">
                <div className="hero-slide-content">
                  {/* Badge */}
                  <motion.div
                    className={`hero-slide-badge ${slide.theme}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 14 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                  >
                    <Sparkles size={14} />
                    <span>{slide.badge}</span>
                  </motion.div>

                  {/* Headline */}
                  <motion.h1
                    className="hero-slide-headline"
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 22 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <span className={`hero-headline-line1 ${slide.theme}`}>
                      {slide.headlineLine1}
                    </span>
                    <span className="hero-headline-line2">
                      {slide.headlineLine2}
                    </span>
                  </motion.h1>

                  {/* Subtext */}
                  <motion.p
                    className={`hero-slide-subtext ${slide.theme}`}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 18 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {slide.subtext}
                  </motion.p>

                  {/* CTA Buttons */}
                  <motion.div
                    className="hero-slide-actions"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 18 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(255, 59, 152, 0.4)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleCtaClick(slide)}
                      className="hero-slide-cta-primary"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight size={18} />
                    </motion.button>

                    {slide.secondaryCtaText && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigateTo('printing')}
                        className={`hero-slide-cta-secondary ${slide.theme}`}
                      >
                        <Printer size={17} color="#E91E63" />
                        <span>{slide.secondaryCtaText}</span>
                      </motion.button>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Prev Arrow */}
      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 1)' }}
        whileTap={{ scale: 0.95 }}
        onClick={goToPrev}
        aria-label="Previous Slide"
        className="hero-carousel-nav-btn"
        style={{ left: '24px' }}
      >
        <ChevronLeft size={24} strokeWidth={2.6} />
      </motion.button>

      {/* Desktop Next Arrow */}
      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 1)' }}
        whileTap={{ scale: 0.95 }}
        onClick={goToNext}
        aria-label="Next Slide"
        className="hero-carousel-nav-btn"
        style={{ right: '24px' }}
      >
        <ChevronRight size={24} strokeWidth={2.6} />
      </motion.button>

      {/* Carousel Dots with Brand Pink Active Pill */}
      <div className="hero-carousel-dots">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToIndex(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`hero-dot ${idx === currentIndex ? 'active' : 'inactive'}`}
          />
        ))}
      </div>
    </div>
  );
};
