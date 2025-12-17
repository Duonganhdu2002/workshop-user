// Define types for each data category
export interface ProjectData {
  id: string;
  title: string;
  category: string;
  year: string;
  image: string;
  link: string;
  detail?: {
    description: string;
    websiteUrl: string;
    studio?: string;
    tools?: string;
    members?: string[];
    video?: string;
    gallery?: string[];
    avatar?: string;
    nextProject?: {
      id: string;
      title: string;
    };
  };
}

export interface AbilityData {
  title: string;
  description: string;
}

export interface ExperienceData {
  company: string;
  period?: string;
  image: string;
}

export interface AboutData {
  title: string;
  subtitles: {
    left: string;
    right: string;
  };
  image: string;
  description: {
    paragraphs: string[];
  }
}

// Projects data
export const projectsData: ProjectData[] = [
  {
    id: 'panels',
    title: 'Panels',
    category: 'Webflow Development',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    link: '/projects/panels',
    detail: {
      description: 'Panels APP is a wallpaper app created by the world\'s biggest tech YouTuber, Marques Brownlee. The website was accessed by thousands of people upon its launch, and it had worldwide repercussion, elevating the name of Webflow as a Website Builder.',
      websiteUrl: 'https://panels.app',
      studio: '@studiocarthagos',
      tools: 'WEBFLOW',
      members: ['@nicomenezes', '@leonardo'],
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      gallery: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      ],
      avatar: 'https://images.unsplash.com/photo-1579767684126-e3e1ce7b9ab7?auto=format&fit=crop&w=800&q=80',
      nextProject: {
        id: 'uncaged',
        title: 'UNCAGED'
      }
    }
  },
  {
    id: 'uncaged',
    title: 'Uncaged',
    category: 'Webflow Development',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    link: '/projects/uncaged',
    detail: {
      description: 'Uncaged is a showcase website for a creative studio specializing in 3D animation and motion design. The website features a unique and immersive experience that showcases the studio\'s work in a captivating way.',
      websiteUrl: 'https://uncaged.studio',
      studio: '@studiocarthagos',
      tools: 'WEBFLOW, GSAP, THREE.JS',
      members: ['@nicomenezes', '@leonardo'],
      video: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      gallery: [
        'https://images.unsplash.com/photo-1579767684126-e3e1ce7b9ab7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1579767684126-e3e1ce7b9ab7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80'
      ],
      avatar: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80',
      nextProject: {
        id: 'vertex',
        title: 'MY RACE REEL'
      }
    }
  },
  {
    id: 'vertex',
    title: 'My Race Reel',
    category: 'Webflow Development',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1551927336-09d50efd69cd?auto=format&fit=crop&w=800&q=80',
    link: '/projects/vertex',
    detail: {
      description: 'My Race Reel is a platform that allows racers to create professional highlight videos from their race footage. The website features a smooth and intuitive interface that guides users through the process of uploading, editing, and sharing their race reels.',
      websiteUrl: 'https://myracereel.com',
      studio: '@studiocarthagos',
      tools: 'WEBFLOW, GSAP, MEMBERSTACKS',
      members: ['@nicomenezes', '@leonardo'],
      video: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      gallery: [
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1579767684126-e3e1ce7b9ab7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1551927336-09d50efd69cd?auto=format&fit=crop&w=1200&q=80'
      ],
      avatar: 'https://images.unsplash.com/photo-1551927336-09d50efd69cd?auto=format&fit=crop&w=800&q=80',
      nextProject: {
        id: 'elevate',
        title: 'CADIE'
      }
    }
  },
  {
    id: 'elevate',
    title: 'Cadie',
    category: 'Webflow Development',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    link: '/projects/elevate',
    detail: {
      description: 'Cadie is a next-generation golf caddie app that provides golfers with real-time course data, shot tracking, and AI-powered insights. The website showcases the app\'s features and benefits in a visually stunning and interactive way.',
      websiteUrl: 'https://cadie.golf',
      studio: '@studiocarthagos',
      tools: 'WEBFLOW, GSAP, LOTTIE',
      members: ['@nicomenezes', '@leonardo'],
      video: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      gallery: [
        'https://images.unsplash.com/photo-1551927336-09d50efd69cd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1579767684126-e3e1ce7b9ab7?auto=format&fit=crop&w=1200&q=80'
      ],
      avatar: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      nextProject: {
        id: 'flux',
        title: 'FLUX'
      }
    }
  },
  {
    id: 'flux',
    title: 'Flux',
    category: 'Next.js Development',
    year: '2023',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    link: '/projects/flux',
    detail: {
      description: 'Flux is a cutting-edge e-commerce platform built with Next.js and a headless CMS. The website features a lightning-fast shopping experience with advanced filtering, search, and checkout functionality.',
      websiteUrl: 'https://flux.store',
      studio: '@studiocarthagos',
      tools: 'NEXT.JS, TYPESCRIPT, TAILWIND CSS',
      members: ['@nicomenezes', '@leonardo'],
      video: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      gallery: [
        'https://images.unsplash.com/photo-1579767684126-e3e1ce7b9ab7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1551927336-09d50efd69cd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      ],
      avatar: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      nextProject: {
        id: 'motion',
        title: 'MOTION'
      }
    }
  },
  {
    id: 'motion',
    title: 'Motion',
    category: 'Animation Design',
    year: '2022',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    link: '/projects/motion',
    detail: {
      description: 'Motion is a showcase of animation work created for various clients. The website features a collection of animated videos, illustrations, and interactive elements that demonstrate the power of motion in digital design.',
      websiteUrl: 'https://motion.design',
      studio: '@studiocarthagos',
      tools: 'AFTER EFFECTS, BLENDER, GSAP',
      members: ['@nicomenezes', '@leonardo'],
      video: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      gallery: [
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1551927336-09d50efd69cd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1579767684126-e3e1ce7b9ab7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      ],
      avatar: 'https://images.unsplash.com/photo-1551927336-09d50efd69cd?auto=format&fit=crop&w=800&q=80',
      nextProject: {
        id: 'panels',
        title: 'PANELS'
      }
    }
  }
];

// Abilities data - Messages from users
export const abilitiesData: AbilityData[] = [
  {
    title: 'Đã dùng trong video',
    description:
      'Sản phẩm này đã được sử dụng trong các video của mình. Chất lượng khó tính đến từ cái nết của mình.',
  },
  {
    title: 'Đã trải nghiệm chất lượng',
    description:
      'Mình đã trải nghiệm đủ lâu để đảm bảo chất lượng. Các sản phẩm không xuất hiện trên video thì nó xuất hiện trong cuộc đời của mình.',
  },
  {
    title: 'Đã dùng trong video',
    description:
    'Sản phẩm này đã được sử dụng trong các video của mình. Chất lượng khó tính đến từ cái nết của mình.',
  },
  {
    title: 'Đã trải nghiệm chất lượng',
    description:
    'Mình đã trải nghiệm đủ lâu để đảm bảo chất lượng. Các sản phẩm không xuất hiện trên video thì nó xuất hiện trong cuộc đời của mình.',
  },
];

// Experiences data
export const experiencesData: ExperienceData[] = [
  {
    company: 'Gia sư',
    image: '/jobs/giasu.png',
  },
  {
    company: 'Bếp nhật',
    image: '/jobs/bepnhat.png',
  },
  {
    company: 'Bếp tây',
    image: '/jobs/beptay.png',
  },
  {
    company: 'Nhân viên bất động sản',
    image: '/jobs/nhanvien.png',
  },
  {
    company: 'Fullstack developer',
    image: '/jobs/fullstack.png',
  },
  {
    company: 'Mobile app developer',
    image: '/jobs/mobile.png',
  },
];

// About data
export const aboutData: AboutData = {
  title: 'VỀ TUI',
  subtitles: {
    left: 'CODING',
    right: 'CONTENT CREATOR'
  },
  image: '/images/avt.jpg',
  description: {
    paragraphs: [
      "Mình là Wyd Anh Du, 2002 và đang là sinh viên năm cuối Học viện Hàng Không Việt Nam.",
      "Giọng mình hơi yếu đuối nhưng mình thì không!"
    ]
  }
};

// Navigation data
export const navigationData = {
  links: [
    { path: '/', label: 'TRANG CHỦ' },
    { path: '/works', label: 'SẢN PHẨM' },
    { path: '/about', label: 'VỀ TUI' }
  ],
  contact: {
    name: 'WYDANHDU',
    role: 'Content Creator & Coder',
    email: 'wydanhdu@gmail.com',
    availability: {
      status: 'Sắp diễn ra',
      color: 'green'
    }
  }
};

// Footer data
export const footerData = {
  heading: "LET'S CHAT",
  availability: {
    status: 'Sắp diễn ra',
    color: 'green'
  },
  social: [
    { label: 'Facebook', url: 'https://www.facebook.com/info.taynguyenfood?locale=vi_VN' },
  ],
  contact: [
    { label: 'E-mail', url: 'mailto:pmkt.taynguyenfood@gmail.com' },
  ],
};

// TikTok Products Data
import { TikTokProduct, TikTokCategory } from '@/types';

export const tiktokProductsData: TikTokCategory[] = [
  {
    id: 'fashion',
    name: 'THỜI TRANG',
    description: 'Xu hướng thời trang hot nhất từ TikTok',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
    products: [
      {
        id: 'fashion-1',
        name: 'Áo hoodie oversize unisex',
        price: 299000,
        originalPrice: 399000,
        image: 'https://images.unsplash.com/photo-1556821840-3a9b22ad2e8b?auto=format&fit=crop&w=400&q=80',
        rating: 4.8,
        reviews: 1205,
        affiliate_link: 'https://shopee.vn/product/123',
        description: 'Áo hoodie oversize phong cách Hàn Quốc, chất liệu cotton mềm mại',
        tags: ['trending', 'unisex', 'korean-style']
      },
      {
        id: 'fashion-2',
        name: 'Quần jeans baggy vintage',
        price: 450000,
        originalPrice: 599000,
        image: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=400&q=80',
        rating: 4.7,
        reviews: 892,
        affiliate_link: 'https://shopee.vn/product/124',
        description: 'Quần jeans baggy phong cách vintage, form rộng thoải mái',
        tags: ['vintage', 'baggy', 'denim']
      },
      {
        id: 'fashion-3',
        name: 'Túi tote canvas minimalist',
        price: 199000,
        originalPrice: 299000,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80',
        rating: 4.9,
        reviews: 2341,
        affiliate_link: 'https://shopee.vn/product/125',
        description: 'Túi tote canvas phong cách tối giản, bền đẹp và thân thiện môi trường',
        tags: ['eco-friendly', 'minimalist', 'canvas']
      },
      {
        id: 'fashion-4',
        name: 'Giày sneaker chunky',
        price: 850000,
        originalPrice: 1200000,
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80',
        rating: 4.6,
        reviews: 756,
        affiliate_link: 'https://shopee.vn/product/126',
        description: 'Giày sneaker chunky đế cao, phong cách streetwear năng động',
        tags: ['chunky', 'streetwear', 'platform']
      }
    ]
  },
  {
    id: 'beauty',
    name: 'LÀM ĐẸP',
    description: 'Sản phẩm làm đẹp viral trên TikTok',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
    products: [
      {
        id: 'beauty-1',
        name: 'Serum Vitamin C 20%',
        price: 89000,
        originalPrice: 159000,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
        rating: 4.9,
        reviews: 3420,
        affiliate_link: 'https://shopee.vn/product/201',
        description: 'Serum Vitamin C 20% giúp làm sáng da và chống lão hóa hiệu quả',
        tags: ['vitamin-c', 'anti-aging', 'brightening']
      },
      {
        id: 'beauty-2',
        name: 'Cushion Che Khuyết Điểm',
        price: 259000,
        originalPrice: 399000,
        image: 'https://images.unsplash.com/photo-1631214540423-3b99703d26cb?auto=format&fit=crop&w=400&q=80',
        rating: 4.8,
        reviews: 1876,
        affiliate_link: 'https://shopee.vn/product/202',
        description: 'Cushion che khuyết điểm hoàn hảo, lâu trôi và tự nhiên',
        tags: ['cushion', 'coverage', 'long-lasting']
      },
      {
        id: 'beauty-3',
        name: 'Mặt nạ collagen cấp ẩm',
        price: 35000,
        originalPrice: 59000,
        image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=400&q=80',
        rating: 4.7,
        reviews: 5432,
        affiliate_link: 'https://shopee.vn/product/203',
        description: 'Mặt nạ collagen cấp ẩm sâu, giúp da mềm mại và căng bóng',
        tags: ['collagen', 'hydrating', 'sheet-mask']
      },
      {
        id: 'beauty-4',
        name: 'Son kem lì velvet',
        price: 79000,
        originalPrice: 129000,
        image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80',
        rating: 4.8,
        reviews: 2187,
        affiliate_link: 'https://shopee.vn/product/204',
        description: 'Son kem lì velvet mịn màng, lâu trôi và không khô môi',
        tags: ['lipstick', 'matte', 'velvet']
      }
    ]
  },
  {
    id: 'tech',
    name: 'CÔNG NGHỆ',
    description: 'Gadgets và phụ kiện tech thông minh',
    image: 'https://images.unsplash.com/photo-1518893063132-36e46dbe2428?auto=format&fit=crop&w=800&q=80',
    products: [
      {
        id: 'tech-1',
        name: 'Tai nghe không dây TWS',
        price: 299000,
        originalPrice: 499000,
        image: 'https://images.unsplash.com/photo-1590658165737-15a047b04973?auto=format&fit=crop&w=400&q=80',
        rating: 4.6,
        reviews: 3241,
        affiliate_link: 'https://shopee.vn/product/301',
        description: 'Tai nghe không dây TWS chất lượng cao, pin 30h và chống nước IPX7',
        tags: ['wireless', 'waterproof', 'long-battery']
      },
      {
        id: 'tech-2',
        name: 'Giá đỡ điện thoại đa năng',
        price: 99000,
        originalPrice: 179000,
        image: 'https://images.unsplash.com/photo-1573236979618-2437b9d2daa6?auto=format&fit=crop&w=400&q=80',
        rating: 4.9,
        reviews: 1567,
        affiliate_link: 'https://shopee.vn/product/302',
        description: 'Giá đỡ điện thoại xoay 360°, tương thích mọi thiết bị',
        tags: ['phone-stand', '360-rotation', 'universal']
      },
      {
        id: 'tech-3',
        name: 'Đèn LED ring cho livestream',
        price: 189000,
        originalPrice: 299000,
        image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=400&q=80',
        rating: 4.7,
        reviews: 982,
        affiliate_link: 'https://shopee.vn/product/303',
        description: 'Đèn LED ring 3 chế độ ánh sáng, hoàn hảo cho livestream và chụp ảnh',
        tags: ['ring-light', 'livestream', '3-modes']
      },
      {
        id: 'tech-4',
        name: 'Sạc dự phòng MagSafe 10000mAh',
        price: 459000,
        originalPrice: 699000,
        image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=400&q=80',
        rating: 4.8,
        reviews: 2156,
        affiliate_link: 'https://shopee.vn/product/304',
        description: 'Sạc dự phòng MagSafe 10000mAh, sạc nhanh không dây 15W',
        tags: ['magsafe', 'wireless-charging', '10000mah']
      }
    ]
  },
  {
    id: 'home',
    name: 'NHÀ CỬA',
    description: 'Đồ dùng gia đình thông minh và tiện lợi',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    products: [
      {
        id: 'home-1',
        name: 'Máy khuếch tán tinh dầu',
        price: 299000,
        originalPrice: 459000,
        image: 'https://images.unsplash.com/photo-1544337151-6e4e999de2a4?auto=format&fit=crop&w=400&q=80',
        rating: 4.8,
        reviews: 1834,
        affiliate_link: 'https://shopee.vn/product/401',
        description: 'Máy khuếch tán tinh dầu ultrasonic với đèn LED đổi màu',
        tags: ['aromatherapy', 'ultrasonic', 'led-light']
      },
      {
        id: 'home-2',
        name: 'Hộp đựng thực phẩm thông minh',
        price: 149000,
        originalPrice: 249000,
        image: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=400&q=80',
        rating: 4.9,
        reviews: 2765,
        affiliate_link: 'https://shopee.vn/product/402',
        description: 'Hộp đựng thực phẩm hút chân không, bảo quản thức ăn tươi lâu hơn',
        tags: ['vacuum-seal', 'food-storage', 'smart']
      },
      {
        id: 'home-3',
        name: 'Đèn ngủ cảm biến chuyển động',
        price: 89000,
        originalPrice: 159000,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        rating: 4.7,
        reviews: 1243,
        affiliate_link: 'https://shopee.vn/product/403',
        description: 'Đèn ngủ cảm biến chuyển động, tự động bật/tắt thông minh',
        tags: ['motion-sensor', 'night-light', 'auto-on-off']
      },
      {
        id: 'home-4',
        name: 'Khay đá tròn silicone',
        price: 45000,
        originalPrice: 79000,
        image: 'https://images.unsplash.com/photo-1575052814074-885fe73b1ae5?auto=format&fit=crop&w=400&q=80',
        rating: 4.6,
        reviews: 3421,
        affiliate_link: 'https://shopee.vn/product/404',
        description: 'Khay đá tròn silicone làm đá viên hoàn hảo cho cocktail',
        tags: ['silicone', 'ice-sphere', 'cocktail']
      }
    ]
  }
]; 