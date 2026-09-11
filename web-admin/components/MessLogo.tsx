"use client";

import { UtensilsCrossed } from "lucide-react";

interface MessLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * MessWise OS Official Mess & Dining Logo.
 * Features crossed dining utensils on a rich emerald-teal culinary gradient.
 */
export default function MessLogo({ size = "md", className = "" }: MessLogoProps) {
  const containerClasses = {
    sm: "h-8 w-8 rounded-lg shadow-xs",
    md: "h-10 w-10 rounded-xl shadow-md shadow-brand-500/20",
    lg: "h-14 w-14 rounded-2xl shadow-lg shadow-brand-500/25",
    xl: "h-20 w-20 rounded-3xl shadow-xl shadow-brand-500/30 ring-4 ring-brand-500/20",
  }[size];

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
    xl: "h-10 w-10",
  }[size];

  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 transition-transform duration-200 hover:scale-105 ${containerClasses} ${className}`}
    >
      {/* Subtle highlight ring for depth */}
      <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/25 pointer-events-none" />
      
      {/* Mess Cutlery Icon */}
      <UtensilsCrossed
        className={`${iconSizes} text-white drop-shadow-xs`}
        strokeWidth={2.5}
      />
    </div>
  );
}
