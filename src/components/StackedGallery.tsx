'use client';

import { useRef, useLayoutEffect, useEffect, useMemo, useCallback } from 'react';
import { twMerge } from 'tailwind-merge';
import Image from 'next/image';

// Tách import gsap & ScrollTrigger để giảm bundle size
// (khi người dùng truy cập, chúng mới được load)
const gsapPromise = import('gsap');
const ScrollTriggerPromise = import('gsap/dist/ScrollTrigger');

// Types for gallery items
interface GalleryItem {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  image: string;
}

// Mock data
const MOCK_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'uncaged',
    title: 'UNCAGED',
    subtitle: 'WEBFLOW DEVELOPMENT',
    year: '2024',
    image:
      'https://images.unsplash.com/photo-1576153192621-7a3be10b356e?q=80&w=1974&auto=format&fit=crop',
  },
  {
    id: 'reel',
    title: 'UNCAGED REEL',
    subtitle: 'WEBFLOW DEVELOPMENT',
    year: '2024',
    image:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'myrace',
    title: 'MY RACE REEL',
    subtitle: 'WEBFLOW DEVELOPMENT',
    year: '2024',
    image:
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2070&auto=format&fit=crop',
  },
];

// Project images for the rotating gallery
const PROJECT_IMAGES = [
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1470&auto=format&fit=crop',
];

interface StackedGalleryProps {
  items?: GalleryItem[];
  className?: string;
}

export default function StackedGallery({
  items = MOCK_GALLERY_ITEMS,
  className,
}: StackedGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const projSectionRef = useRef<HTMLElement>(null);
  const col0Ref = useRef<HTMLDivElement>(null);
  const col1Ref = useRef<HTMLDivElement>(null);
  const col2Ref = useRef<HTMLDivElement>(null);
  const col3Ref = useRef<HTMLDivElement>(null);
  const col4Ref = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLDivElement>(null);

  // Memoize column images
  const { column0Images, column1Images, column2Images, column3Images, column4Images } = useMemo(() => {
    return {
      column0Images: PROJECT_IMAGES.slice(20, 25),
      column1Images: PROJECT_IMAGES.slice(0, 5),
      column2Images: PROJECT_IMAGES.slice(5, 10),
      column3Images: PROJECT_IMAGES.slice(10, 15),
      column4Images: PROJECT_IMAGES.slice(15, 20),
    };
  }, []);

  // 1) GSAP panel scrolltrigger setup
  useLayoutEffect(() => {
    let ctx: any; // GSAP context sẽ lưu vào đây

    Promise.all([gsapPromise, ScrollTriggerPromise]).then(([gsapModule, STModule]) => {
      const gsap = gsapModule.default;
      const ScrollTrigger = STModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const panels = gsap.utils.toArray<HTMLElement>('.panel');
        panels.forEach((panel) => {
          ScrollTrigger.create({
            trigger: panel,
            start: 'top bottom-=2',
            end: () => '+=' + (window.innerHeight * 2 - 4),
          });
        });
      }, containerRef);
    });

    return () => {
      // Hủy context khi unmount
      ctx?.revert();
    };
  }, []);

  // 2) GSAP endless loop animation
  useEffect(() => {
    if (
      !col1Ref.current ||
      !col3Ref.current ||
      !projSectionRef.current
    ) {
      return;
    }

    let ctx: any;
    let resizeTimeout: any;

    // Function to handle resize
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Clean up and reinitialize animations on resize
        if (ctx) {
          ctx.revert();
          initAnimations();
        }
      }, 300); // Debounce resize events
    };

    // Function to initialize animations
    const initAnimations = () => {
      Promise.all([gsapPromise, ScrollTriggerPromise]).then(([gsapModule, STModule]) => {
        const gsap = gsapModule.default;
        const ScrollTrigger = STModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        // Force hardware acceleration for smoother animations
        gsap.set([col0Ref.current, col1Ref.current, col2Ref.current, col3Ref.current, col4Ref.current], {
          willChange: 'transform',
          force3D: true
        });

        ctx = gsap.context(() => {
          const projSection = ScrollTrigger.create({
            trigger: projSectionRef.current!,
            start: 'top bottom',
            end: 'bottom top',
            toggleActions: 'play pause resume pause',
          });

          // Check if we're on mobile (window width < 768px)
          const isMobile = window.innerWidth < 768;

          // Set initial positions based on device
          if (isMobile) {
            // For mobile - only animate columns 1 and 3
            gsap.set(col1Ref.current!, { y: '-33.333%' });
            gsap.set(col3Ref.current!, { y: '-33.333%' });
          } else {
            // For desktop - animate all columns
            gsap.set([col0Ref.current!, col1Ref.current!, col3Ref.current!], {
              y: '-33.333%',
            });
            gsap.set([col2Ref.current!, col4Ref.current!], {
              y: '0%',
            });
          }

          const sharedScrollTrigger = {
            trigger: projSectionRef.current!,
            start: 'top bottom',
            end: 'bottom top',
            toggleActions: 'play pause resume pause',
          };

          // Create a timeline for smoother animations
          const masterTL = gsap.timeline({
            scrollTrigger: sharedScrollTrigger,
            paused: false,
            repeat: -1
          });

          // Column 1 - always visible
          const tl1 = gsap.timeline({ repeat: -1 })
            .to(col1Ref.current!, {
              y: '0%',
              duration: 15,
              ease: 'none',
              onRepeat: () => {
                gsap.set(col1Ref.current!, { y: '-33.333%' });
              }
            });

          // Column 3 - always visible
          const tl3 = gsap.timeline({ repeat: -1 })
            .to(col3Ref.current!, {
              y: '0%',
              duration: 12,
              ease: 'none',
              onRepeat: () => {
                gsap.set(col3Ref.current!, { y: '-33.333%' });
              }
            });

          // Only animate these columns on desktop
          if (!isMobile && col0Ref.current && col2Ref.current && col4Ref.current) {
            // Column 0
            const tl0 = gsap.timeline({ repeat: -1 })
              .to(col0Ref.current, {
                y: '0%',
                duration: 16,
                ease: 'none',
                onRepeat: () => {
                  gsap.set(col0Ref.current!, { y: '-33.333%' });
                }
              });

            // Column 2
            const tl2 = gsap.timeline({ repeat: -1 })
              .to(col2Ref.current, {
                y: '-33.333%',
                duration: 18,
                ease: 'none',
                onRepeat: () => {
                  gsap.set(col2Ref.current!, { y: '0%' });
                }
              });

            // Column 4
            const tl4 = gsap.timeline({ repeat: -1 })
              .to(col4Ref.current, {
                y: '-33.333%',
                duration: 15,
                ease: 'none',
                onRepeat: () => {
                  gsap.set(col4Ref.current!, { y: '0%' });
                }
              });
          }
        }, containerRef);
      });
    };

    // Initialize animations
    initAnimations();

    // Add resize event listener
    window.addEventListener('resize', handleResize);

    return () => {
      // Clean up
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      ctx?.revert();
    };
  }, []);

  // Render column images (duplicated for infinite effect)
  const renderColumnImages = useCallback((images: string[]) => {
    // Triple the images for seamless infinite loop (was double)
    const allImages = [...images, ...images, ...images];
    return allImages.map((src, index) => (
      <div key={`img-${src}-${index}`} className="relative aspect-square w-full overflow-hidden p-1.5 md:p-3">
        <div className="relative w-full h-full overflow-hidden rounded-md">
          <Image
            src={src}
            alt={`Project image ${index}`}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 45vw, (max-width: 1200px) 25vw, 20vw"
            priority={index === 0}
            loading={index === 0 ? 'eager' : 'lazy'}
            quality={60}
            className="object-center"
          />
        </div>
      </div>
    ));
  }, []);

  // Mảng panel gallery
  const galleryItemPanels = useMemo(
    () =>
      items.map((item, i) => (
        <section
          key={item.id}
          className="panel w-full h-screen sticky top-0 overflow-hidden flex flex-col justify-center"
        >
          {/* Background image */}
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={item.image}
              alt={item.title}
              fill
              style={{ objectFit: 'cover' }}
              className="z-0"
              sizes="100vw"
              priority={i === 0}
              quality={60}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 z-10" />
            {/* Additional thin black layer for better text visibility */}
            <div className="absolute inset-0 bg-black/25 z-[15]" />
          </div>

          {/* Content */}
          <div className="container mx-auto px-6 md:px-12 relative z-20 text-white">
            <div className="max-w-8xl flex flex-col md:flex-row items-start md:items-center justify-start md:justify-between">
              <h2 className="text-5xl md:text-6xl lg:text-7xl">{item.title}</h2>
              <div className="text-lg py-2 md:py-0 uppercase opacity-50">{item.subtitle}</div>
              <div className="text-lg pb-2 md:pb-0 opacity-50">{item.year}</div>
              <button className="py-2 uppercase font-bold text-lg md:text-xl tracking-wider transition-colors duration-300">
                <div className="flex items-center">
                  <div className="w-8 h-[1px] bg-white mr-3"></div>
                  XEM THÊM
                  <div className="w-8 h-[1px] bg-white ml-3"></div>
                </div>
              </button>
            </div>
          </div>
        </section>
      )),
    [items]
  );

  // Chuẩn bị sẵn column content để tránh re-render
  const columnContent = useMemo(
    () => ({
      col0: renderColumnImages(column0Images),
      col1: renderColumnImages(column1Images),
      col2: renderColumnImages(column2Images),
      col3: renderColumnImages(column3Images),
      col4: renderColumnImages(column4Images),
    }),
    [
      renderColumnImages,
      column0Images,
      column1Images,
      column2Images,
      column3Images,
      column4Images,
    ]
  );

  // Handle heading hover animations
  const handleHover = async () => {
    if (!underlineRef.current) return;

    const { default: gsap } = await import('gsap');
    gsap.to(underlineRef.current, {
      width: '100%',
      duration: 1.0,
      ease: 'power2.out',
    });
  };

  const handleLeave = async () => {
    if (!underlineRef.current) return;

    const { default: gsap } = await import('gsap');
    gsap.to(underlineRef.current, {
      width: '0%',
      duration: 1.0,
      ease: 'power2.inOut',
    });
  };

  return (
    <div ref={containerRef} className={twMerge('w-full', className)}>
      {galleryItemPanels}

      {/* SEE ALL PROJECTS Panel */}
      <section
        ref={projSectionRef}
        className="panel w-full h-screen sticky top-0 overflow-hidden flex flex-col justify-center bg-black"
      >
        <div className="absolute inset-0 w-full h-full bg-black">
          {/* Container with single rotation for all columns */}
          <div className="absolute inset-0 w-[110%] md:w-[120%] h-[110%] md:h-[120%] -top-[5%] -left-[5%] md:top-[-10%] md:left-[-10%] flex justify-center items-center overflow-hidden">
            {/* Rotated container for all columns */}
            <div className="w-full md:w-[400%] h-full md:h-[400%] transform md:rotate-[15deg] rotate-[3deg] origin-center translate-x-[0%] scale-[1.6] md:scale-100">
              {/* Infinite scrolling grid with 5 columns */}
              <div className="flex h-full w-full gap-0.5 md:gap-1 ml-[0%]">
                {/* Column 0 */}
                <div className="hidden md:block flex-1 relative overflow-hidden">
                  <div 
                    ref={col0Ref} 
                    className="absolute w-full will-change-transform h-auto"
                    style={{ transform: 'translate3d(0,0,0)' }}
                  >
                    {columnContent.col0}
                  </div>
                </div>

                {/* Column 1 */}
                <div className="w-1/2 md:w-auto flex-1 relative overflow-hidden">
                  <div 
                    ref={col1Ref} 
                    className="absolute w-full will-change-transform h-auto"
                    style={{ transform: 'translate3d(0,0,0)' }}
                  >
                    {columnContent.col1}
                  </div>
                </div>

                {/* Column 2 */}
                <div className="hidden md:block flex-1 relative overflow-hidden">
                  <div 
                    ref={col2Ref} 
                    className="absolute w-full will-change-transform h-auto"
                    style={{ transform: 'translate3d(0,0,0)' }}
                  >
                    {columnContent.col2}
                  </div>
                </div>

                {/* Column 3 */}
                <div className="w-1/2 md:w-auto flex-1 relative overflow-hidden">
                  <div 
                    ref={col3Ref} 
                    className="absolute w-full will-change-transform h-auto"
                    style={{ transform: 'translate3d(0,0,0)' }}
                  >
                    {columnContent.col3}
                  </div>
                </div>

                {/* Column 4 */}
                <div className="hidden md:block flex-1 relative overflow-hidden">
                  <div 
                    ref={col4Ref} 
                    className="absolute w-full will-change-transform h-auto"
                    style={{ transform: 'translate3d(0,0,0)' }}
                  >
                    {columnContent.col4}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional thin black layer for better text visibility */}
          <div className="absolute inset-0 bg-black/25 z-[15]"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 md:px-12 relative z-20 text-white">
          <div className="max-w-8xl mx-auto text-center">
            <div className="inline-block relative">
              <h2
                className="text-3xl md:text-7xl lg:text-9xl tracking-wider cursor-pointer"
                onMouseEnter={handleHover}
                onMouseLeave={handleLeave}
              >
                XEM TẤT CẢ SẢN PHẨM
              </h2>
              {/* Animated underline element */}
              <div
                ref={underlineRef}
                className="h-1 md:h-2 w-0 bg-white absolute bottom-[-8px] left-0 right-0"
                aria-hidden="true"
              ></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
