'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { experiencesData } from '../data';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const Experiences = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(titleRef.current, { y: 100, opacity: 0 });
      cardsRef.current.forEach(card => card && gsap.set(card, { y: 50, opacity: 0 }));

      // Animate title
      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          end: 'top 30%',
          scrub: 1,
        },
      }).to(titleRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'power2.out',
      });

      // Animate cards
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 65%',
            scrub: 0.8,
          },
        }).to(card, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          delay: index * 0.1,
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const setCardRef = (el: HTMLDivElement | null, index: number) => {
    cardsRef.current[index] = el;
  };

  return (
    <section ref={sectionRef} className="w-full min-h-screen py-20 px-6 md:px-12 lg:px-16">
      <div className="max-w-[1400px] mx-auto">
        <h2
          ref={titleRef}
          className="text-[2rem] md:text-[4rem] lg:text-[6rem] font-black tracking-tight text-black text-center mb-20"
        >
          KINH NGHIỆM
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {experiencesData.map((exp, idx) => (
            <div key={idx} ref={el => setCardRef(el, idx)} className="experience-card">
              {/* Thay div bg-grey bằng Image */}
              <div className="relative w-full pb-[100%] mb-4 overflow-hidden rounded-lg">
                <Image
                  src={exp.image}
                  alt={`${exp.company} logo`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              <h3 className="text-2xl font-medium">{exp.company}</h3>
              {exp.period && <p className="text-gray-400 text-sm">{exp.period}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experiences;
