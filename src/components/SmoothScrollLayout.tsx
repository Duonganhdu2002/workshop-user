'use client';

import { ReactNode } from 'react';
import { useEffect } from 'react';
import { ReactLenis, useLenis } from '@studio-freight/react-lenis';
import '@/styles/smooth-scroll.css';

interface SmoothScrollLayoutProps {
  children: ReactNode;
}

export default function SmoothScrollLayout({ children }: SmoothScrollLayoutProps) {
  const lenis = useLenis((instance) => {
    // You can use the lenis instance here if needed
  });

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Get the clicked element
      const target = e.target as HTMLElement;
      
      // Check if it's a link
      const link = target.closest('a');
      if (!link) return;
      
      // Check if the link has a hash (internal link)
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      
      // Prevent default behavior
      e.preventDefault();
      
      // Get the target element
      const targetElement = document.querySelector(href);
      if (!targetElement) return;
      
      // Scroll smoothly to the target
      lenis?.scrollTo(targetElement as HTMLElement, { 
        offset: -100, // Adjust offset as needed
        duration: 1.5,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential easing
      });
    };
    
    // Add click event listener to the document
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      // Remove event listener on cleanup
      document.removeEventListener('click', handleLinkClick);
    };
  }, [lenis]);

  return (
    <ReactLenis root options={{ 
      duration: 2.5, 
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential easing
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    }}>
      {children}
    </ReactLenis>
  );
} 