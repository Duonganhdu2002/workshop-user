'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ScrollHeroFollow = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const linesRef = useRef<HTMLDivElement[]>([]);

  // Thêm ref cho line
  const addToLineRefs = (el: HTMLDivElement | null) => {
    if (el && !linesRef.current.includes(el)) {
      linesRef.current.push(el);
    }
  };

  useEffect(() => {
    if (!sectionRef.current) return;

    // Dùng GSAP context để clean up dễ
    const ctx = gsap.context(() => {
      // Tạo timeline duy nhất
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: 0.8,
          // markers: true, // mở nếu muốn debug
        },
      });

      // Set trạng thái ban đầu cho tất cả text và image
      gsap.set('.text', {
        yPercent: 100,
        opacity: 0,
        willChange: 'transform',
      });
      gsap.set('.image-container', {
        yPercent: 100,
        opacity: 0,
        scale: 0.8,
        willChange: 'transform',
      });

      // Lặp qua các line, add animation nối tiếp vào masterTl
      linesRef.current.forEach((line, index) => {
        const lineTexts = line.querySelectorAll('.text');
        const lineImages = line.querySelectorAll('.image-container');

        // Giả sử mỗi line chơi 2 step animation: text -> image
        masterTl
          .to(
            lineTexts,
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.4,
              ease: 'power3.out',
              stagger: 0.05,
            },
            index * 0.3 // tạm tính offset để chồng chéo nhẹ
          )
          .to(
            lineImages,
            {
              yPercent: 0,
              opacity: 1,
              scale: 1,
              duration: 0.3,
              ease: 'power2.out',
              stagger: 0.05,
            },
            index * 0.3 + 0.1
          );
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen py-32 px-6 flex flex-col bg-stripes md:bg-stripes-desktop items-center justify-center text-center bg-white text-black overflow-hidden"
    >
      <div className="text-3xl sm:text-5xl font-semibold leading-snug space-y-12 max-w-4xl">
        {/* Line 1 */}
        <div
          ref={addToLineRefs}
          className="line flex items-center justify-center relative overflow-hidden"
        >
          <span className="text">Wydanhdu is a vietnamese</span>
          <span className="image-container inline-block rounded-full overflow-hidden align-middle w-10 h-10 ml-3 shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=60"
              alt="avatar"
              className="w-full h-full object-cover rounded-full"
              loading="lazy"
            />
          </span>
        </div>

        {/* Line 2 */}
        <div
          ref={addToLineRefs}
          className="line flex items-center justify-center relative overflow-hidden"
        >
          <span className="text">Web and mobile app developer</span>
          <span className="image-container inline-block align-middle w-8 h-8 ml-3">
            <img
              src="https://cdn-icons-png.flaticon.com/512/6295/6295417.png"
              alt="web and mobile"
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </span>
        </div>

        {/* Line 3 */}
        <div
          ref={addToLineRefs}
          className="line flex items-center justify-center relative text-gray-500 overflow-hidden"
        >
          <span className="text">who builds</span>
          <span className="image-container inline-block w-28 h-16 mx-3 rounded-md shadow-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=200&q=60"
              className="w-full h-full object-cover rounded-md"
              alt="responsive website"
              loading="lazy"
            />
          </span>
          <span className="text">products</span>
        </div>

        {/* Line 4 */}
        <div
          ref={addToLineRefs}
          className="line flex items-center justify-center relative text-gray-500 overflow-hidden"
        >
          <span className="text">that drive business</span>
          <span className="image-container inline-block w-28 h-16 mx-3 rounded-md shadow-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=200&q=60"
              className="w-full h-full object-cover rounded-md"
              alt="react and mobile technologies"
              loading="lazy"
            />
          </span>
        </div>

        {/* Line 5 */}
        <div
          ref={addToLineRefs}
          className="line flex items-center justify-center relative text-gray-500 overflow-hidden"
        >
          <span className="text">and achieve results</span>
          <span className="image-container inline-block w-28 h-16 mx-3 rounded-md shadow-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=200&q=60"
              className="w-full h-full object-cover rounded-md"
              alt="team collaboration"
              loading="lazy"
            />
          </span>
        </div>
      </div>
    </section>
  );
};

export default ScrollHeroFollow;
