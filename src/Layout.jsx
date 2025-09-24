/* Adapted from Base44 export */

import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SlidersHorizontal, Bot, LineChart, Microchip } from 'lucide-react';

const navItems = [
  { name: 'Control', href: createPageUrl('Control'), icon: SlidersHorizontal },
  { name: 'Recipes', href: createPageUrl('Recipes'), icon: Bot },
  { name: 'Chart',   href: createPageUrl('Chart'),   icon: LineChart },
  { name: 'Hardware', href: '/hardware', icon: Microchip },
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

      <style>
        {`
          body { background: #595261ff !important; }
          .icon-white-outside-card svg { color: #fff !important; font-weight: bold; }
        `}
      </style>
      <div
        className="min-h-screen w-full"
        style={{ margin: '40px', background: '#595261ff', color: '#fff', fontWeight: 'bold' }}
      >
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

              <nav
                style={{
                  display: 'flex',
                  gap: 24,
                  alignItems: 'center',
                  height: 48,
                  marginLeft: 16,
                }}
              >
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 20px',
                        borderRadius: 8,
                        border: '1px solid #e0e0e0',
                        fontSize: 15,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#fff' : '#222',
                        background: isActive ? '#22c55e' : '#fff',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                        boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = '#f5f5f5';
                          e.currentTarget.style.color = '#222';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.color = '#555';
                        }
                      }}
                    >
                      {item.icon && <item.icon style={{ width: 18, height: 18, marginRight: 6, opacity: 0.8, color: isActive ? '#fff' : '#222' }} />}
                      {item.name}
                    </Link>
                  );
                })}
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

      </div>
    </>
  );
}