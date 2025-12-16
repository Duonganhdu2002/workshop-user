"use client";

import React from 'react';
import { motion } from 'framer-motion';

const WorksSection: React.FC = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const textVariants = {
    hidden: {
      opacity: 0,
      y: 100
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="container mx-auto px-4 py-20 h-screen flex flex-col justify-center">
      <motion.div
        className="overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1 
          className="text-[12vw] md:text-[10vw] leading-none tracking-tight"
        >
          <motion.span 
            className="block mb-8"
            variants={textVariants}
          >
            SẢN
          </motion.span>
          <motion.span 
            className="block"
            variants={textVariants}
          >
            PHẨM
          </motion.span>
        </motion.h1>
      </motion.div>
    </section>
  );
};

export default WorksSection; 