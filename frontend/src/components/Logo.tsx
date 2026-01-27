import React from "react";

export const Logo = ({
  className = "w-32 h-auto",
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 300 80"
    className={className}
    fill="none"
    aria-label="BarberSaaS Logo"
  >
    {/* ÍCONE: Nuvem estilizada com Barber Pole */}
    <path
      d="M50 20C50 14.477 45.523 10 40 10C36.5 10 33.5 11.5 31.5 14C30.5 12 28.5 11 26 11C22.686 11 20 13.686 20 17C20 17.5 20.1 18 20.2 18.5C19.5 18.2 18.8 18 18 18C14.686 18 12 20.686 12 24C12 27.314 14.686 30 18 30H50C55.523 30 60 25.523 60 20C60 19.5 59.9 19 59.8 18.5C62.2 17.5 64 15 64 12C64 7.582 60.418 4 56 4C52.5 4 49.5 6 48 9"
      fill="none"
    />

    {/* ÍCONE: O Barber Pole Moderno (Listras) */}
    <rect x="10" y="10" width="14" height="60" rx="7" fill={color} />
    <path
      d="M12 20L22 14"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 30L22 24"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 40L22 34"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 50L22 44"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 60L22 54"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* TEXTO: BarberSaaS */}
    <text
      x="40"
      y="52"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="900"
      fontSize="38"
      fill={color}
      letterSpacing="-1"
    >
      Barber<tspan fontWeight="300">SaaS</tspan>
    </text>

    {/* Ponto de conexão (Tech) */}
    <circle cx="238" cy="28" r="3" fill="#16a34a" />
  </svg>
);
