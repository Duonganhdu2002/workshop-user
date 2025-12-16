'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { projectsData } from '@/data';

gsap.registerPlugin(ScrollTrigger);

export default function ProjectPage({ params }: { params: { 'project-name': string } }) {
  const projectId = params['project-name'];
  const project = projectsData.find(p => p.id === projectId);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const leftSideRef = useRef<HTMLDivElement>(null);
  const rightSideRef = useRef<HTMLDivElement>(null);
  
  // If project not found, return 404
  if (!project || !project.detail) {
    return notFound();
  }

  useEffect(() => {
    const container = containerRef.current;
    const leftSide = leftSideRef.current;
    const rightSide = rightSideRef.current;

    if (!container || !leftSide || !rightSide) return;

    // Setup GSAP context
    const ctx = gsap.context(() => {
      // Only pin on desktop/tablet (not on mobile)
      const mediaQuery = window.matchMedia('(min-width: 1024px)');
      
      let scrollTriggerInstance: ScrollTrigger;
      
      // Function to create or kill ScrollTrigger based on screen size
      const updateScrollTrigger = () => {
        // Clean up existing ScrollTrigger if it exists
        if (scrollTriggerInstance) {
          scrollTriggerInstance.kill();
        }
        
        if (mediaQuery.matches) {
          // Desktop/tablet: Pin the left side while right side scrolls
          scrollTriggerInstance = ScrollTrigger.create({
            trigger: leftSide,
            start: 'top top',
            end: () => `+=${rightSide.offsetHeight - window.innerHeight}`,
            pin: true,
            pinSpacing: false,
          });
        }
      };
      
      // Initial setup
      updateScrollTrigger();
      
      // Add listener for screen size changes
      mediaQuery.addEventListener('change', updateScrollTrigger);
      
      return () => {
        // Clean up listener when component unmounts
        mediaQuery.removeEventListener('change', updateScrollTrigger);
        if (scrollTriggerInstance) {
          scrollTriggerInstance.kill();
        }
      };
    }, containerRef);

    return () => {
      ctx.revert(); // Clean up all animations and ScrollTriggers when component unmounts
    };
  }, [project]);

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-stripes md:bg-stripes-desktop">
      <div className="flex flex-col lg:flex-row w-full">
        {/* Left Side - Project Information (Pinned on desktop, scrolls on mobile) */}
        <div ref={leftSideRef} className="w-full h-screen lg:w-[35%] lg:h-screen flex flex-col justify-center p-6 lg:p-12 bg-stripes-dark md:bg-stripes-desktop-dark text-white">
          <div className="grid grid-cols-1 h-full" style={{ backgroundImage: 'url(/grid.svg)', backgroundSize: 'cover' }}>
            <div className="self-start mt-8 lg:mt-24">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 lg:mb-8">{project.title.toUpperCase()}</h1>
              
              <Link href={project.detail.websiteUrl || '#'} target="_blank" className="flex items-center mb-8 lg:mb-12 hover:underline">
                <span className="mr-2">VISIT WEBSITE</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              
              <div className="mb-6 lg:mb-8">
                <div className="uppercase text-gray-400">{project.category}</div>
                <div className="uppercase">{project.year}</div>
              </div>
              
              {project.detail.studio && (
                <div className="mb-8 lg:mb-16">
                  <div>In {project.detail.studio}</div>
                </div>
              )}
              
              <div className="max-w-md">
                <p className="text-base mb-6 lg:mb-8">{project.detail.description}</p>
              </div>
              
              {project.detail.tools && (
                <div className="mb-6 lg:mb-8">
                  <h3 className="text-lg lg:text-xl mb-2 lg:mb-4">TOOLS</h3>
                  <div>{project.detail.tools}</div>
                </div>
              )}
              
              {project.detail.members && (
                <div>
                  <h3 className="text-lg lg:text-xl mb-2 lg:mb-4">MEMBERS</h3>
                  {project.detail.members.map((member, index) => (
                    <div key={index}>{member}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Side - Gallery (Scrollable) */}
        <div ref={rightSideRef} className="w-full lg:w-[65%] min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-[5%] pt-10 lg:pt-[5%] rounded-2xl">
          {/* Video Section */}
          <div className="w-full">
            {project.detail.video && (
              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover"
                  src={project.detail.video}
                />
              </div>
            )}
          </div>
          
          {/* Image Gallery - 2 Column Grid */}
          <div className="w-full py-8 lg:py-[5%]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {project.detail.gallery?.map((image, index) => (
                <div key={index} className="mb-4 sm:mb-0">
                  <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl">
                    <Image
                      src={image}
                      alt={`${project.title} gallery image ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority={index < 2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Next Project Section */}
      {project.detail?.nextProject && (
        <div className="w-full h-[60vh] lg:h-[65vh] flex flex-col items-center justify-center relative overflow-hidden group">
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full">
            <Image 
              src={projectsData.find(p => p.id === project.detail?.nextProject?.id)?.image || ''}
              alt={project.detail?.nextProject?.title || 'Next project'}
              fill
              style={{ objectFit: 'cover' }}
              className="z-0 transition-transform duration-1000 ease-out group-hover:scale-110 group-hover:rotate-2"
              sizes="100vw"
              priority={false}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60 z-10 transition-opacity duration-700 group-hover:bg-black/50"></div>
          </div>
          
          {/* Content */}
          <div className="text-center relative z-20 text-white">
            <p className="text-sm uppercase mb-4 tracking-wider opacity-70 transition-transform duration-500 group-hover:translate-y-[-5px]">NEXT PROJECT</p>
            <Link href={`/project/${project.detail.nextProject.id}`} className="group">
              <h2 className="text-5xl md:text-7xl lg:text-9xl font-bold uppercase tracking-tight group-hover:text-white transition-all duration-500">
                {project.detail.nextProject.title}
              </h2>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
