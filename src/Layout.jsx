/* Adapted from Base44 export */

import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SlidersHorizontal, Bot, LineChart } from 'lucide-react';

const navItems = [
  { name: 'Control', href: createPageUrl('Control'), icon: SlidersHorizontal },
  { name: 'Recipes', href: createPageUrl('Recipes'), icon: Bot },
  { name: 'Chart',   href: createPageUrl('Chart'),   icon: LineChart },
];

export default function Layout() {
  const location = useLocation();

  return (
    <>
      <style>{`
        @keyframes rotate-hue {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>

      <div className="min-h-screen w-full bg-white text-gray-900">
        <header className="bg-white/90 backdrop-blur-sm border-b-2 border-gray-300 sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <div className="flex items-center">
                <div
                  className="h-9 w-9 rounded-full mr-3"
                  style={{
                    background:
                      'conic-gradient(from 180deg at 50% 50%, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)',
                    animation: 'rotate-hue 4s linear infinite',
                  }}
                />
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Color Reactor
                </h1>
              </div>

              <nav className="hidden md:flex md:space-x-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'bg-gray-200 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
                <Link to="/hardware" className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-200">
                  Hardware
                </Link>
              </nav>

              <div className="md:hidden">{/* Mobile menu placeholder */}</div>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
            {/* Render current route here */}
            <Outlet />
          </div>
        </main>

        <footer className="md:hidden sticky bottom-0 bg-white border-t-2 border-gray-300">
          <nav className="flex justify-around p-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full ${
                  location.pathname === item.href
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-700'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
            <Link to="/hardware" className="rounded-lg px-3 py-2 text-sm font-medium">
              Hardware
            </Link>
          </nav>
        </footer>
      </div>
    </>
  );
}