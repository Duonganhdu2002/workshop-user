import React, { useRef, useEffect } from 'react';

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import GSAP to reduce bundle size
    import('gsap').then((gsapModule) => {
      const gsap = gsapModule.default;
      
      // Select all text elements that need to be animated
      const textElements = containerRef.current?.querySelectorAll('.animate-text');
      
      if (!textElements) return;
      
      // Set initial states - position text below its final position
      gsap.set(textElements, {
        yPercent: 100, // Start below the container
        opacity: 0,
        willChange: 'transform, opacity',
      });
      
      // Create timeline for staggered animation
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      
      // Add animations with staggered timing
      tl.to(textElements, {
        yPercent: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.2,
      });
    });
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <section className="w-full min-h-screen bg-stripes md:bg-stripes-desktop text-black px-6 pt-20 pb-10 relative overflow-hidden flex flex-col justify-center items-center">
      <div ref={containerRef} className="max-w-6xl w-full mx-auto flex flex-col items-center justify-center">
        {/* Title container */}
        <div className="overflow-hidden">
          <h1 className="text-[14vw] font-semibold md:font-normal leading-none text-center md:text-[12vw] animate-text">
            WORKSHOP
          </h1>
        </div>
        
        {/* Subtitle container */}
        <div className="overflow-hidden mt-2 mb-4">
          <p className="text-center text-gray-400 text-sm tracking-widest animate-text">
            Tây Nguyên Food - Việt Nam
          </p>
        </div>
        
        {/* Name container */}
        <div className="overflow-hidden">
          <h2 className="text-[14vw] font-semibold md:font-normal leading-none text-center md:text-[12vw] animate-text">
            TÊN WORKSHOP
          </h2>
        </div>
        
        {/* Availability container */}
        <div className="mt-16 text-xs text-gray-500 space-y-1 text-center md:absolute md:left-6 md:bottom-6 md:text-left">
          <div className="overflow-hidden">
            <div className="font-semibold text-black animate-text">Trạng thái</div>
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 justify-center md:justify-start animate-text">
              <span className="text-green-400 text-base">●</span>
              <span className="text-gray-400">Sắp diễn ra</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
