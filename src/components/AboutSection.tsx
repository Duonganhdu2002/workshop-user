'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { aboutData } from '../data';

gsap.registerPlugin(ScrollTrigger);

const AboutSection = () => {
  /* ---------------- refs ---------------- */
  const sectionRef = useRef<HTMLElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const descRef    = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  /* ------------ reveal on load ------------ */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ onComplete: () => setReady(true) })
        .from('[data-reveal]', {
          y: 100,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power3.out',
        });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* ------------- scroll effects ------------- */
  useEffect(() => {
    if (!ready) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.matchMedia({
        /* ---- DESKTOP: giữ nguyên flow cũ ---- */
        '(min-width: 768px)': () => {
          gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: '+=100%',
              scrub: 0.1,
              pin: true,
              pinSpacing: false,
            },
          }).fromTo(
            [imgWrapRef.current, descRef.current],
            { width: '80%' },
            { width: '40%', ease: 'none', duration: 1 },
          );
        },

        /* ---- MOBILE: 3:4 ➜ 1:1 bằng scaleY ---- */
        '(max-width: 767px)': () => {
          /* đặt transform gốc ở top để co “từ trên xuống” */
          gsap.set(imgWrapRef.current, {
            transformOrigin: 'top center',
            scaleY: 1.333,          // ≈ 4/3
          });

          gsap.to(imgWrapRef.current, {
            scaleY: 1,              // 1 : 1
            ease: 'none',
            scrollTrigger: {
              trigger: imgWrapRef.current,
              start: 'top 85%',
              end: 'top 45%',
              scrub: 0.8,
            },
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [ready]);

  /* ---------------- JSX ---------------- */
  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center min-h-[50vh] md:min-h-[230vh] bg-transparent"
      data-theme="light"
    >
      {/* Title */}
      <div className="mx-auto mt-20 text-center z-10">
        <h1 data-reveal className="text-6xl md:text-[12rem] leading-none">
          {aboutData.title}
        </h1>
        <div
          data-reveal
          className="flex justify-between text-gray-400 uppercase text-sm md:text-lg mt-2"
        >
          <span>{aboutData.subtitles.left}</span>
          <span>{aboutData.subtitles.right}</span>
        </div>
      </div>

      {/* Image wrapper – class y hệt bản desktop gốc */}
      <div
        ref={imgWrapRef}
        data-reveal
        className="relative w-4/5 mt-12 overflow-hidden flex justify-center z-10"
      >
        <Image
          src={aboutData.image}
          alt="Portrait"
          width={1200}
          height={1000}
          priority
          className="object-cover rounded-md w-full h-auto"
        />
      </div>

      {/* Description */}
      <div
        ref={descRef}
        data-reveal
        className="text-left text-sm md:text-base text-neutral-700 mt-24 w-4/5 leading-relaxed z-10"
      >
        {aboutData.description.paragraphs.map((p, i) => (
          <p key={i} className="mb-6 last:mb-0">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
};

export default AboutSection;
