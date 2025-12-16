"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

type Product = Database['public']['Tables']['products']['Row'] & {
  categories?: {
    id: string;
    name: string;
  } | null;
};

const Projects: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching products:', error);
        } else {
          setProducts(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (loading || products.length === 0) return;

    const elements = containerRef.current?.querySelectorAll('.project-content');
    if (elements) {
      elements.forEach((el, index) => {
        const imageOverlay = el.querySelector('.image-overlay');
        const titleElement = el.querySelector('.project-title');
        const infoElement = el.querySelector('.project-info');

        // Set initial states
        gsap.set(imageOverlay, { 
          scaleY: 1
        });
        gsap.set(titleElement, {
          y: 30,
          opacity: 0
        });
        gsap.set(infoElement, {
          y: 20,
          opacity: 0
        });

        // Create ScrollTrigger for more control
        const scrollTrigger = ScrollTrigger.create({
          trigger: el,
          start: 'top 95%', // Begin when the top of element is 10% into viewport
          end: 'top 5%',   // End when the top of element is 90% through viewport
          scrub: 0.5,
          onEnter: () => {
            // When scrolling DOWN into view (10% visible)
            // Reveal image from bottom to top
            gsap.to(imageOverlay, {
              scaleY: 0,
              transformOrigin: 'center bottom',
              duration: 0.7,
              ease: 'power2.inOut',
            });
            
            // Animate in text elements with slight delay
            gsap.to(titleElement, {
              y: 0,
              opacity: 1,
              duration: 0.7,
              delay: 0.2,
              ease: 'power2.out'
            });
            
            gsap.to(infoElement, {
              y: 0,
              opacity: 1,
              duration: 0.7,
              delay: 0.3,
              ease: 'power2.out'
            });
          },
          onLeave: () => {
            // When scrolling DOWN out of view (90% through)
            // Hide image from top to bottom
            gsap.to(imageOverlay, {
              scaleY: 1,
              transformOrigin: 'center top',
              duration: 0.7,
              ease: 'power2.inOut',
            });
            
            // Animate out text elements
            gsap.to(titleElement, {
              y: -30,
              opacity: 0,
              duration: 0.5,
              ease: 'power2.in'
            });
            
            gsap.to(infoElement, {
              y: -20,
              opacity: 0,
              duration: 0.5,
              ease: 'power2.in'
            });
          },
          onEnterBack: () => {
            // When scrolling UP into view
            // Reveal image from top to bottom
            gsap.to(imageOverlay, {
              scaleY: 0,
              transformOrigin: 'center top',
              duration: 0.7,
              ease: 'power2.inOut',
            });
            
            // Animate in text elements from above - sync with image reveal
            gsap.to(titleElement, {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power2.out'
            });
            
            gsap.to(infoElement, {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power2.out'
            });
          },
          onLeaveBack: () => {
            // When scrolling UP out of view
            // Hide image from bottom to top
            gsap.to(imageOverlay, {
              scaleY: 1,
              transformOrigin: 'center bottom',
              duration: 0.7,
              ease: 'power2.inOut',
            });
            
            // Animate out text elements
            gsap.to(titleElement, {
              y: 30,
              opacity: 0,
              duration: 0.5,
              ease: 'power2.in'
            });
            
            gsap.to(infoElement, {
              y: 20,
              opacity: 0,
              duration: 0.5,
              ease: 'power2.in'
            });
          }
        });

        return () => {
          scrollTrigger.kill();
        };
      });
    }
  }, [loading, products]);

  if (loading) {
    return (
      <section className="w-full min-h-screen flex items-center justify-center">
        <div className="text-xl">Đang tải sản phẩm...</div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="w-full min-h-screen flex items-center justify-center">
        <div className="text-xl">Không có sản phẩm nào</div>
      </section>
    );
  }

  return (
    <section className="w-full" ref={containerRef}>
      <div>
        {products.map((product, index) => (
          <ProductItem 
            key={product.id} 
            product={product} 
            index={index} 
            isOdd={index % 2 !== 0} 
          />
        ))}
      </div>
    </section>
  );
};

interface ProductItemProps {
  product: Product;
  index: number;
  isOdd: boolean;
}

const ProductItem: React.FC<ProductItemProps> = ({ product, index, isOdd }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div
      className="project-item min-h-[80vh] md:min-h-screen w-full flex items-center justify-center py-12 px-4 lg:px-12"
    >
      <div className={`project-content w-full max-w-7xl mx-auto flex flex-col ${isOdd ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 lg:gap-12`}>
        <div className="w-full md:w-1/2 relative overflow-hidden group">
          <a href={product.product_link} target="_blank" rel="noopener noreferrer" className="block">
            <div className="transform transition-transform duration-700 group-hover:scale-105 image-container cursor-pointer">
              <div className="aspect-[4/3] w-full relative">
                <img 
                  src={product.image_url} 
                  alt={product.name || `Sản phẩm ${product.id}`}
                  className="w-full h-full object-cover"
                />
                <div className="image-overlay absolute top-0 left-0 w-full h-full bg-background z-10"></div>
              </div>
            </div>
          </a>
        </div>
        
        <div className="w-full md:w-1/2 px-4 lg:px-8 mt-6 md:mt-0">
          <a href={product.product_link} target="_blank" rel="noopener noreferrer">
            <div className={`text-center md:text-left ${isOdd ? 'md:text-right' : ''} cursor-pointer group`}>
              <h3 className="project-title text-4xl sm:text-5xl lg:text-7xl font-medium mb-4 transition-colors duration-300">
                {product.name || 'Sản phẩm không có tên'}
              </h3>
              <div className="project-info flex flex-col text-gray-500 text-base sm:text-lg">
                <p className="text-2xl font-semibold text-black mb-2">{formatPrice(product.price)}</p>
                <p>{product.categories?.name || 'Chưa phân loại'}</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Projects; 