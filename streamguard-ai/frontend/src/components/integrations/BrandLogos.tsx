import React from 'react';

interface BrandIconProps {
  className?: string;
  size?: number;
}

// 1. RAZORPAY LOGO
export const RazorpayLogo: React.FC<BrandIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="24" height="24" rx="5" fill="#0C2340" />
    <path
      d="M13.8 6.5L7.2 17.5H10.8L16.8 7.5L13.8 6.5Z"
      fill="#0C8CE9"
    />
    <path
      d="M10.2 6.5H14.8C16.2 6.5 17.2 7.5 17.2 9C17.2 10.4 16.1 11.4 14.8 11.5L12 11.5L10.2 6.5Z"
      fill="#3395FF"
    />
    <path
      d="M8.5 13.5L6.5 17.5H10.2L11.5 13.5H8.5Z"
      fill="#0C8CE9"
    />
  </svg>
);

// 2. CASHFREE PAYMENTS LOGO
export const CashfreeLogo: React.FC<BrandIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="24" height="24" rx="5" fill="#1C1008" />
    <path
      d="M6 12C6 8.686 8.686 6 12 6C13.8 6 15.4 6.8 16.5 8L14.2 10.3C13.6 9.5 12.8 9 12 9C10.343 9 9 10.343 9 12C9 13.657 10.343 15 12 15C12.8 15 13.6 14.5 14.2 13.7L16.5 16C15.4 17.2 13.8 18 12 18C8.686 18 6 15.314 6 12Z"
      fill="#FF5A1F"
    />
    <path
      d="M14 6H18V10L16 8L14 6Z"
      fill="#FF7A00"
    />
    <path
      d="M14 18H18V14L16 16L14 18Z"
      fill="#FFA726"
    />
  </svg>
);

// 3. SHOPIFY LOGO
export const ShopifyLogo: React.FC<BrandIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="24" height="24" rx="5" fill="#0D1F0D" />
    {/* Bag Silhouette */}
    <path
      d="M17.5 7.2C17.4 7.2 17.3 7.3 17.2 7.3L15.3 5.4C14.7 4.8 13.9 4.5 13.1 4.5H11C10.1 4.5 9.4 4.8 8.7 5.4L6.8 7.3C6.7 7.3 6.6 7.2 6.5 7.2C6 7.2 5.6 7.6 5.6 8.1L5 18C5 18.6 5.4 19 6 19H18C18.6 19 19 18.6 19 18L18.4 8.1C18.4 7.6 18 7.2 17.5 7.2Z"
      fill="#95BF47"
    />
    {/* Bag Handles */}
    <path
      d="M10 6C10 4.9 10.9 4 12 4C13.1 4 14 4.9 14 6V7H10V6Z"
      stroke="#5E8E3E"
      strokeWidth="1.2"
    />
    {/* 'S' Monogram */}
    <path
      d="M13.2 10.5C12.8 10.2 12.3 10.2 11.8 10.4C11.1 10.7 10.8 11.4 11 12C11.2 12.6 12 13 12.6 13.3C13.4 13.7 13.8 14.3 13.6 15C13.3 15.9 12.2 16.2 11.2 15.8C10.5 15.5 10.2 14.8 10.3 14.3"
      stroke="#FFFFFF"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

// 4. DELHIVERY LOGO
export const DelhiveryLogo: React.FC<BrandIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="24" height="24" rx="5" fill="#200508" />
    {/* Bold Red Hexagon / Box */}
    <path
      d="M12 4L19 8V16L12 20L5 16V8L12 4Z"
      fill="#E31837"
    />
    {/* Clean Lettermark D */}
    <path
      d="M9 8H12.2C14.3 8 15.5 9.2 15.5 12C15.5 14.8 14.3 16 12.2 16H9V8Z"
      fill="#FFFFFF"
    />
    <path
      d="M10.8 10V14H12C13.1 14 13.8 13.3 13.8 12C13.8 10.7 13.1 10 12 10H10.8Z"
      fill="#E31837"
    />
  </svg>
);

// 5. BLUEDART LOGO
export const BlueDartLogo: React.FC<BrandIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="24" height="24" rx="5" fill="#001838" />
    {/* Dynamic Aerodynamic Arrows */}
    <path
      d="M4 8L12 8L10 16L4 16L6 8Z"
      fill="#0052CC"
    />
    <path
      d="M9 8L16 8L14 16L7 16L9 8Z"
      fill="#2684FF"
    />
    <path
      d="M14 8L20 8L17 16L11 16L14 8Z"
      fill="#FFAB00"
    />
  </svg>
);
