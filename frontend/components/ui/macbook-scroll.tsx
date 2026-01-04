"use client";
import React from "react";
import { motion } from "motion/react";

export const DeviceMockup = ({
  ipadSrc,
  iphoneSrc,
  title,
}: {
  ipadSrc?: string;
  iphoneSrc?: string;
  title?: string | React.ReactNode;
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8 md:mb-12 text-center text-2xl md:text-4xl lg:text-5xl font-bold max-w-3xl"
      >
        {title || (
          <span>
            Shop from the comfort of your home.
          </span>
        )}
      </motion.h2>
      
      {/* Devices Container */}
      <div className="relative flex items-end justify-center gap-4 md:gap-8 w-full max-w-5xl">
        {/* iPad Frame */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-[55%] md:w-[60%] max-w-2xl"
        >
          {/* iPad Body */}
          <div className="relative bg-[#1a1a1a] rounded-[1rem] md:rounded-[1.5rem] lg:rounded-[2rem] p-2 md:p-3 shadow-2xl">
            {/* Front Camera */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 md:w-2.5 md:h-2.5 bg-[#0a0a0a] rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-[#1a3a5a] rounded-full"></div>
            </div>
            
            {/* Screen content */}
            <div className="relative bg-[#000] rounded-lg md:rounded-xl overflow-hidden aspect-[4/3]">
              <img
                src={ipadSrc as string}
                alt="GoShop on iPad"
                className="w-full h-full object-contain object-center bg-white"
              />
            </div>
          </div>
        </motion.div>

        {/* iPhone 17 Frame */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative w-[25%] md:w-[22%] max-w-[180px] -ml-8 md:-ml-16 z-10"
        >
          {/* iPhone Body */}
          <div className="relative bg-[#1a1a1a] rounded-[1.2rem] md:rounded-[2rem] lg:rounded-[2.5rem] p-1.5 md:p-2 shadow-2xl">
            {/* Dynamic Island */}
            <div className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 w-[30%] h-2 md:h-3 bg-[#000] rounded-full z-10"></div>
            
            {/* Screen content */}
            <div className="relative bg-[#000] rounded-[0.8rem] md:rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden aspect-[9/19.5]">
              <img
                src={iphoneSrc as string}
                alt="GoShop on iPhone"
                className="w-full h-full object-cover object-top"
              />
            </div>
            
            {/* Side Button (Power) */}
            <div className="absolute right-[-2px] top-[25%] w-[3px] h-8 md:h-12 bg-[#2a2a2a] rounded-l-sm"></div>
            
            {/* Volume Buttons */}
            <div className="absolute left-[-2px] top-[20%] w-[3px] h-4 md:h-6 bg-[#2a2a2a] rounded-r-sm"></div>
            <div className="absolute left-[-2px] top-[30%] w-[3px] h-6 md:h-10 bg-[#2a2a2a] rounded-r-sm"></div>
            <div className="absolute left-[-2px] top-[42%] w-[3px] h-6 md:h-10 bg-[#2a2a2a] rounded-r-sm"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Keep MacbookScroll export for backwards compatibility
export const MacbookScroll = DeviceMockup;
