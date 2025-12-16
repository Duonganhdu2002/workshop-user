'use client';

import React, { useLayoutEffect, useRef } from 'react';


import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import Abilities from '@/components/Abilities';
import ScrollHeroFollow from '@/components/ScrollHeroFollow';
import SmoothScrollLayout from '@/components/SmoothScrollLayout';
import StackedGallery from '@/components/StackedGallery'; 
import TikTokProducts from '@/components/TikTokProducts';
import Booking from '@/components/Booking';

// Đăng ký ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const scrollFollowRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let pinTrigger: ScrollTrigger | null = null;
    let transitionTl: gsap.core.Timeline | null = null;

    if (scrollFollowRef.current && transitionRef.current) {
      // Pin ScrollHeroFollow trong khi StackedGallery scroll qua
      pinTrigger = ScrollTrigger.create({
        trigger: scrollFollowRef.current,
        start: 'bottom bottom',
        end: '+=100%',
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
      });

      // Tạo timeline cho hiệu ứng "gấp" (folding effect)
      transitionTl = gsap.timeline({
        scrollTrigger: {
          trigger: transitionRef.current,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      });

      // Animation folding effect
      transitionTl.fromTo(
        transitionRef.current,
        {
          y: 0,
          scale: 1,
          borderTopLeftRadius: '0px',
          borderTopRightRadius: '0px',
        },
        {
          y: 0,
          scale: 1,
          borderTopLeftRadius: '40px',
          borderTopRightRadius: '40px',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.1)',
          ease: 'power2.inOut',
        }
      );
    }

    // Cleanup
    return () => {
      if (pinTrigger) {
        pinTrigger.kill();
      }
      if (transitionTl) {
        transitionTl.kill();
      }
    };
  }, []);

  return (
    <SmoothScrollLayout>
      <main className="bg-stripes md:bg-stripes-desktop min-h-screen text-foreground bg-background">
        <Header />
        <Hero />

        {/* ScrollHeroFollow có hiệu ứng pin */}
        {/* <div ref={scrollFollowRef} className="relative z-10">
          <ScrollHeroFollow />
        </div> */}

        {/* <TikTokProducts /> */}

        <Booking />

        {/* Element chuyển tiếp/folding */}
        <div ref={transitionRef} className="bg-white relative z-20">
          {/* <StackedGallery /> */}
          {/* <Abilities /> */}
          <Footer />
        </div>
      </main>
    </SmoothScrollLayout>
  );
}
