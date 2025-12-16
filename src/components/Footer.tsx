"use client";

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import { footerData } from '../data';

/**
 * Footer component with animated heading and responsive grid layout
 */
const Footer = () => {
  const lineRef = useRef<HTMLDivElement>(null);
  const hoverLineRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasScrollTriggered, setHasScrollTriggered] = useState(false);

  // Animate line on scroll and component mount
  useEffect(() => {
    if (lineRef.current) {
      gsap.set(lineRef.current, { width: '0%' });
    }

    const triggerLine = () => {
      if (!lineRef.current || !headingRef.current) return;

      const rect = headingRef.current.getBoundingClientRect();
      const triggerPoint = window.innerHeight * 0.9;

      if (rect.top < triggerPoint) {
        gsap.to(lineRef.current, {
          width: rect.width,
          duration: 1,
          ease: 'power3.out',
        });

        setHasScrollTriggered(true);
        window.removeEventListener('scroll', triggerLine);
      }
    };

    triggerLine();
    window.addEventListener('scroll', triggerLine);

    return () => window.removeEventListener('scroll', triggerLine);
  }, []);

  const handleHover = () => {
    if (!hoverLineRef.current || !headingRef.current) return;

    const width = headingRef.current.offsetWidth;
    gsap.to(hoverLineRef.current, {
      width,
      height: 10,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const handleLeave = () => {
    if (!hoverLineRef.current) return;

    gsap.to(hoverLineRef.current, {
      width: 0,
      height: 10,
      duration: 0.5,
      ease: 'power2.inOut',
    });
  };

  return (
    <footer className="w-full bg-stripes-dark md:bg-stripes-desktop-dark text-white py-24 px-6 sm:px-12 mx-auto">
      <div ref={containerRef} className=" px-6 sm:px-12 mx-auto">
        {/* Heading */}
        <div className="lg:col-span-4">
          <h2
            ref={headingRef}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
            className="text-[12vw] sm:text-[13vw] md:text-[14vw] font-bold leading-none tracking-tight cursor-pointer inline-block"
          >
            {footerData.heading}
          </h2>
          <div
            ref={hoverLineRef}
            className="h-[2px] w-0 bg-white mt-2 transition-all"
            aria-hidden="true"
          ></div>
          <div
            ref={lineRef}
            className={`h-[2px] w-0 bg-white mt-2 transition-all ${hasScrollTriggered ? 'opacity-0' : ''}`}
            aria-hidden="true"
          ></div>

          {/* Availability */}
          <div>
            <div className="text-sm font-semibold mb-2 mt-6">Trạng thái</div>
            <div className="text-sm flex items-center gap-2">
              <span className={`text-${footerData.availability.color}-400 text-lg`}>●</span>
              <span>{footerData.availability.status}</span>
            </div>
          </div>
        </div>

        <div className=' grid grid-cols-2 gap-4 mt-12'>
          {/* Social */}
          <div>
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wide">Social</h3>
            <ul className="space-y-3 text-base text-gray-300">
              {footerData.social.map((item, index) => (
                <li key={index}>
                  <Link href={item.url} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wide">Contact</h3>
            <ul className="space-y-3 text-base text-gray-300">
              {footerData.contact.map((item, index) => (
                <li key={index}>
                  <Link href={item.url} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;