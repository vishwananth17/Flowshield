import React from 'react';

interface BrandIconProps {
  className?: string;
  size?: number;
}

// 1. RAZORPAY LOGO (Clean Vector Glyph)
export const RazorpayLogo: React.FC<BrandIconProps> = ({ className = '', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M18.5 5.5L7.5 24H12.8L20.8 7.5L18.5 5.5Z"
      fill="#0C8CE9"
    />
    <path
      d="M12.5 5.5H20C22.2 5.5 24 7.3 24 9.5C24 11.6 22.3 13.4 20.2 13.5L15.5 13.5L12.5 5.5Z"
      fill="#3395FF"
    />
    <path
      d="M10.2 17.5L6.5 24H12.2L14.2 17.5H10.2Z"
      fill="#0C8CE9"
    />
  </svg>
);

// 2. CASHFREE PAYMENTS LOGO (Clean Double Chevron Symbol)
export const CashfreeLogo: React.FC<BrandIconProps> = ({ className = '', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M8 16C8 11.58 11.58 8 16 8C18.4 8 20.5 9.1 22 10.7L18.8 13.8C18.1 12.8 17.1 12.2 16 12.2C13.9 12.2 12.2 13.9 12.2 16C12.2 18.1 13.9 19.8 16 19.8C17.1 19.8 18.1 19.2 18.8 18.2L22 21.3C20.5 22.9 18.4 24 16 24C11.58 24 8 20.42 8 16Z"
      fill="#FF5A1F"
    />
    <path
      d="M19 8H24V13L21.5 10.5L19 8Z"
      fill="#FF7A00"
    />
    <path
      d="M19 24H24V19L21.5 21.5L19 24Z"
      fill="#FFA726"
    />
  </svg>
);

// 3. SHOPIFY LOGO (Crisp Bag with 'S' Monogram)
export const ShopifyLogo: React.FC<BrandIconProps> = ({ className = '', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Bag Handles */}
    <path
      d="M13 8C13 6.3 14.3 5 16 5C17.7 5 19 6.3 19 8V9.5H13V8Z"
      stroke="#5E8E3E"
      strokeWidth="1.8"
    />
    {/* Bag Body */}
    <path
      d="M23.5 10C23.3 10 23.2 10.1 23.1 10.1L20.6 7.6C19.8 6.8 18.7 6.4 17.6 6.4H14.8C13.7 6.4 12.6 6.8 11.8 7.6L9.3 10.1C9.2 10.1 9.1 10 9 10C8.3 10 7.8 10.5 7.7 11.2L7 24C7 24.8 7.6 25.5 8.4 25.5H24C24.8 25.5 25.4 24.8 25.4 24L24.8 11.2C24.7 10.5 24.2 10 23.5 10Z"
      fill="#95BF47"
    />
    {/* 'S' Monogram */}
    <path
      d="M17.5 14C17 13.5 16.3 13.5 15.6 13.8C14.7 14.2 14.3 15.1 14.6 15.9C14.9 16.7 16 17.2 16.8 17.6C17.9 18.1 18.4 18.9 18.1 19.8C17.7 21 16.3 21.4 15 20.9C14.1 20.5 13.7 19.6 13.8 18.9"
      stroke="#FFFFFF"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

// 4. DELHIVERY LOGO (Signature Red Hexagon with 'D')
export const DelhiveryLogo: React.FC<BrandIconProps> = ({ className = '', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Bold Red Hexagon */}
    <path
      d="M16 4L26 9.5V22.5L16 28L6 22.5V9.5L16 4Z"
      fill="#E31837"
    />
    {/* Lettermark D */}
    <path
      d="M12 10H16.5C19.2 10 21 11.8 21 16C21 20.2 19.2 22 16.5 22H12V10Z"
      fill="#FFFFFF"
    />
    <path
      d="M14.5 13V19H16.5C17.9 19 18.8 18 18.8 16C18.8 14 17.9 13 16.5 13H14.5Z"
      fill="#E31837"
    />
  </svg>
);

// 5. BLUEDART LOGO (Dynamic Aerodynamic Express Arrows)
export const BlueDartLogo: React.FC<BrandIconProps> = ({ className = '', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 10L14 10L11 22L4 22L6 10Z" fill="#0052CC" />
    <path d="M11 10L20 10L17 22L9 22L11 10Z" fill="#2684FF" />
    <path d="M17 10L26 10L22 22L15 22L17 10Z" fill="#FFAB00" />
  </svg>
);

// 6. PHONEPE LOGO (Iconic Purple Circle with Devanagari Pe Glyph)
export const PhonePeLogo: React.FC<BrandIconProps> = ({ className = '', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="32" height="32" rx="8" fill="#5F259F" />
    <path
      d="M17.5 7H13.2C12.5 7 12 7.5 12 8.2V24.5C12 25 12.4 25.5 13 25.5H15.5C16 25.5 16.5 25 16.5 24.5V19.5H18C21.2 19.5 23.5 17.2 23.5 14C23.5 10.2 21 7 17.5 7ZM17.8 15.2H16.5V11.2H17.8C19 11.2 20 12 20 13.2C20 14.4 19 15.2 17.8 15.2Z"
      fill="#FFFFFF"
    />
  </svg>
);

// 7. SHIPROCKET LOGO (Modern Purple-Cyan Delivery Box)
export const ShiprocketLogo: React.FC<BrandIconProps> = ({ className = '', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="32" height="32" rx="8" fill="#0B132B" />
    <path
      d="M16 6L25 11.2V20.8L16 26L7 20.8V11.2L16 6Z"
      stroke="#7B2CBF"
      strokeWidth="2"
      fill="#1C1035"
    />
    <path
      d="M16 6V16M16 16L25 11.2M16 16L7 11.2"
      stroke="#9D4EDD"
      strokeWidth="1.8"
    />
    <circle cx="16" cy="16" r="2.5" fill="#00F0FF" />
  </svg>
);

