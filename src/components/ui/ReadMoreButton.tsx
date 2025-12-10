"use client";
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

interface ReadMoreButtonProps {
  text?: string;
  onClick?: () => void;
}

const ReadMoreButton: React.FC<ReadMoreButtonProps> = ({ text = "READ MORE", onClick }) => {
  const linkRef = useRef<HTMLButtonElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const link = linkRef.current;
    const color = colorRef.current;
    if (!link || !color) return;

    const hoverTL = gsap.timeline();
    hoverTL.pause();

    hoverTL.to(color, {
      width: "calc(100% + 1.3em)",
      ease: "Elastic.easeOut(0.25)",
      duration: 0.4
    });
    hoverTL.to(color, {
      width: "2em",
      left: "calc(100% - 1.45em)",
      ease: "Elastic.easeOut(0.4)",
      duration: 0.6
    });

    const handleMouseEnter = () => hoverTL.play();
    const handleMouseLeave = () => hoverTL.reverse();

    link.addEventListener("mouseenter", handleMouseEnter);
    link.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      link.removeEventListener("mouseenter", handleMouseEnter);
      link.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <button className="text-xs md:text-sm lg:text-base font-bold text-white bg-transparent border-none p-0 relative cursor-pointer" onClick={onClick} ref={linkRef}>
      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-(--color) absolute top-1/2 -translate-y-1/2 -left-1 md:-left-2" ref={colorRef}></div>
      <span className="relative text-xs">{text}</span>
      <FontAwesomeIcon icon={faArrowRight} className="relative ml-1 text-xs" />
    </button>
  );
};

export default ReadMoreButton;
