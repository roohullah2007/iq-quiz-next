// components/Navbar.js
import React, { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';
import Image from 'next/image';
import imgsrc from '../public/assets/logo.svg';

const Navbar = () => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => (prevTime + 1) % 3600); // Reset after 3600 seconds (1 hour)
    }, 1000); // Update every second

    // Clean up the interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Convert time to minutes and seconds
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 dark:bg-neutral-200 dark:border-neutral-700">
      {/* Logo */}
      <a href="#" className="text-xl px-56 font-semibold text-gray-900 dark:text-white">
        <Image alt="Logo" src={imgsrc} width={150} height={100} />
      </a>

      {/* Timer */}
      <div className="flex items-center text-gray-900 dark:text-black px-56">
        <FaClock className="text-xl mr-2" />
        <span>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </header>
  );
};

export default Navbar;
