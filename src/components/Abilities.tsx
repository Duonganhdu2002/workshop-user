'use client';

import React from 'react';
import AbilityCard from './AbilityCard';
import { abilitiesData } from '../data';

/**
 * Messages section component - "Nhắn gửi" from users about product experience
 * Responsive layout:
 * - Desktop: Heading on left, grid on right
 * - Mobile: Heading on top, stacked grid below
 */
const Abilities = () => {
  return (
    <section className="w-full px-[4%] sm:px-[5%] md:px-[6%] lg:px-[8%] py-16 sm:py-20 md:py-24 bg-white text-black bg-stripes md:bg-stripes-desktop overflow-hidden">
      {/* Desktop layout with flex, Mobile layout with block */}
      <div className="flex flex-col md:flex-row items-start">
        {/* Heading - Takes full width on mobile, fixed width on desktop */}
        <h2 className="font-bold text-4xl sm:text-7xl md:text-[6vw] lg:text-[6vw] tracking-tight md:w-[40%] mb-8 md:mb-0 md:sticky md:top-24">
          NHẮN GỬI
        </h2>
        
        {/* Card grid - Full width on mobile, right side on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full md:w-[60%] lg:pl-[10%]">
          {abilitiesData.map((ability, index) => (
            <AbilityCard
              key={index}
              title={ability.title}
              description={ability.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Abilities;
