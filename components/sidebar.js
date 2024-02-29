import React from 'react';
import Link from 'next/link';

const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-gray-800">
      <ul className="py-4">
        <li className="text-white px-4 py-2">
          <Link href="/">Home</Link>
        </li>
        <li className="text-white px-4 py-2">
          <Link href="/ai-painting">AI Painting</Link>
        </li>
        <li className="text-white px-4 py-2">
          <Link href="/services">Services</Link>
        </li>
        {/* Add more sidebar items as needed */}
      </ul>
    </div>
  );
};

export default Sidebar;