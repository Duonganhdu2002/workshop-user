'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';

interface AbilityCardProps {
  title: string; // Message type: "đã dùng trong video" or "đã trải nghiệm chất lượng"
  description: string; // Detailed message content
}

const AbilityCard: React.FC<AbilityCardProps> = ({ title, description }) => {
  // Chứa 2 dòng marquee
  const marqueeTopRef = useRef<HTMLDivElement>(null);
  const marqueeBottomRef = useRef<HTMLDivElement>(null);
  // Chứa cả card để IntersectionObserver quan sát
  const cardRef = useRef<HTMLDivElement>(null);

  // Tạo text lặp lại để đảm bảo "đủ dài" cho hiệu ứng vô tận
  const repeatedTitle = useMemo(() => {
    // Tùy ý lặp 5-6 lần cho dài, tùy bạn
    const repeatCount = 5;
    return Array.from({ length: repeatCount }, () => title).join(' ');
  }, [title]);

  useEffect(() => {
    // Đảm bảo cả hai dòng marquee và khung cha có sẵn
    if (!marqueeTopRef.current || !marqueeBottomRef.current || !cardRef.current) return;

    // Tạo 2 animation marquee: 1 chạy trái, 1 chạy phải
    const animTop = gsap.fromTo(
      marqueeTopRef.current,
      { xPercent: 0 },       // bắt đầu ở vị trí 0%
      {
        xPercent: -50,       // chạy đến -50% (2 copy => liền mạch)
        duration: 20,        // điều chỉnh tốc độ chạy
        repeat: -1,          // lặp vô tận
        ease: 'linear',
        paused: true,        // tạm dừng, tí nữa observer sẽ play khi thấy card
      }
    );

    const animBottom = gsap.fromTo(
      marqueeBottomRef.current,
      { xPercent: -50 },     // bắt đầu ở vị trí -50%
      {
        xPercent: 0,         // chạy đến 0% 
        duration: 25,        // lâu hơn 1 chút để chậm chậm
        repeat: -1,
        ease: 'linear',
        paused: true,
      }
    );

    // IntersectionObserver: chỉ play khi card xuất hiện trong viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animTop.play();
            animBottom.play();
          } else {
            animTop.pause();
            animBottom.pause();
          }
        });
      },
      { threshold: 0.1 } // Tỉ lệ visible => 0.1
    );

    observer.observe(cardRef.current);

    // Cleanup khi unmount
    return () => {
      animTop.kill();
      animBottom.kill();
      observer.disconnect();
    };
  }, [title]);

  return (
    <div ref={cardRef} className="rounded-lg border border-gray-200 bg-white py-6 overflow-hidden">
      {/* Khối chứa 2 dòng marquee */}
      <div className="relative mb-4 overflow-hidden h-16 sm:h-20 lg:h-24">
        {/* Dòng trên - chạy qua trái */}
        <div
          ref={marqueeTopRef}
          className="absolute top-0 left-0 flex whitespace-nowrap text-xl sm:text-2xl lg:text-3xl font-extrabold text-black will-change-transform"
          aria-hidden="true"
        >
          {/* 2 đoạn y chang nhau để chạy từ 0% đến -50% mượt */}
          <span className="mr-8">{repeatedTitle}</span>
          <span>{repeatedTitle}</span>
        </div>

        {/* Dòng dưới - chạy qua phải */}
        <div
          ref={marqueeBottomRef}
          className="absolute top-8 sm:top-10 lg:top-12 left-0 flex whitespace-nowrap text-xl sm:text-2xl lg:text-3xl font-extrabold text-black will-change-transform"
          aria-hidden="true"
        >
          <span className="mr-8">{repeatedTitle}</span>
          <span>{repeatedTitle}</span>
        </div>

        {/* Ẩn title cho screen reader/SEO */}
        <h3 className="sr-only">{title}</h3>
      </div>

      {/* Nội dung mô tả */}
      <p className="px-4 text-sm sm:text-base text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default AbilityCard;
