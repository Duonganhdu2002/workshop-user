import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Workshop Tây Nguyên Food - Ẩm thực Việt Nam Healthy & Lối sống lành mạnh",
  description: "Workshop về ẩm thực Tây Nguyên Việt Nam - Khám phá healthy food và healthy lifestyle với các món ăn truyền thống lành mạnh từ vùng đất Tây Nguyên. Học nấu ăn healthy, thực phẩm organic và lối sống bền vững.",
  keywords: [
    "Tây Nguyên food",
    "ẩm thực Tây Nguyên",
    "healthy food Việt Nam",
    "healthy lifestyle",
    "workshop nấu ăn",
    "ẩm thực Việt Nam",
    "healthy food",
    "organic food",
    "lối sống lành mạnh",
    "thực phẩm lành mạnh",
    "Tây Nguyên Việt Nam",
    "cooking workshop",
    "Vietnamese cuisine",
    "healthy cooking",
    "sustainable lifestyle",
    "Eatclean workshop",
    "Eatclean",
    "Eatclean workshop",
    "Eatclean workshop Tây Nguyên",
    "Eatclean workshop Việt Nam",
    "Eatclean workshop đặc sắc vùng Tây Nguyên",
    "Eatclean workshop học nấu ăn",
    "Eatclean workshop thưởng thức món ngon",
    "Eatclean workshop trải nghiệm độc đáo",
    "healthy food workshop",
    "healthy food workshop Tây Nguyên",
    "healthy food workshop Việt Nam",
    "healthy food workshop đặc sắc vùng Tây Nguyên",
    "healthy food workshop học nấu ăn",
    "healthy food workshop thưởng thức món ngon",
    "healthy food workshop trải nghiệm độc đáo",
    "healthy food workshop học nấu ăn",
    "healthy food workshop thưởng thức món ngon",
  ],
  authors: [{ name: "Workshop Tây Nguyên Food" }],
  creator: "Workshop Tây Nguyên Food",
  publisher: "Workshop Tây Nguyên Food",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://workshop-taynguyen-food.com'),
  alternates: {
    canonical: '/',
    languages: {
      'vi-VN': '/vi',
      'en-US': '/en',
    },
  },
  openGraph: {
    title: "Workshop Tây Nguyên Food - Ẩm thực Việt Nam Healthy & Lối sống lành mạnh",
    description: "Workshop về ẩm thực Tây Nguyên Việt Nam - Khám phá healthy food và healthy lifestyle với các món ăn truyền thống lành mạnh từ vùng đất Tây Nguyên.",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://workshop-taynguyen-food.com',
    siteName: "Workshop Tây Nguyên Food",
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Workshop Tây Nguyên Food - Healthy Vietnamese Cuisine',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Workshop Tây Nguyên Food - Ẩm thực Việt Nam Healthy",
    description: "Khám phá healthy food và healthy lifestyle với ẩm thực Tây Nguyên Việt Nam",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here if needed
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
