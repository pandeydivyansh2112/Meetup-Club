/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Crown,
  Calendar,
  Image as GalleryIcon,
  Briefcase,
  Info,
  Mail,
  UserCheck,
  Menu,
  X,
  Sparkles,
  LogOut,
  ChevronDown,
  HelpCircle,
  ShieldAlert,
  QrCode,
  MessageCircle,
} from 'lucide-react';
import { UserSession, CMSContentData } from '../types';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userSession: UserSession | null;
  cmsContent: CMSContentData;
  onOpenAuth: (defaultTab?: 'attendee' | 'admin' | 'staff') => void;
  onOpenInquiryModal: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  userSession,
  cmsContent,
  onOpenAuth,
  onOpenInquiryModal,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'events', label: 'Events' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact Us' },
  ];

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#F4F1EA]/95 border-b border-[#D8D2C5] shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          {cmsContent.logoUrl ? (
            <img
              src={cmsContent.logoUrl}
              alt="Meetup Club"
              className="max-h-11 w-auto object-contain rounded-lg border border-[#D8D2C5]"
            />
          ) : (
            <div className="relative w-11 h-11 rounded-xl bg-[#2A2A2B] p-[1.5px] shadow-sm group-hover:shadow-[0_4px_12px_rgba(240,78,54,0.3)] transition-all duration-300">
              <div className="w-full h-full bg-[#2A2A2B] rounded-[10px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#F04E36] group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          )}
          <span className="text-xl sm:text-2xl font-serif tracking-[0.12em] font-bold text-[#2A2A2B] group-hover:text-[#F04E36] transition-colors">
            Meetup Club
          </span>
        </button>

        {/* Clean Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-[#F04E36] bg-[#F04E36]/10 font-bold border border-[#F04E36]/30 shadow-xs'
                    : 'text-[#4A4A4A] hover:text-[#2A2A2B] hover:bg-[#EBE6DC]'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right CTA Area: "Make an Inquiry" + "Sign In / Portal" */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Streamlined "Make an Inquiry" Button */}
          <button
            onClick={onOpenInquiryModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#2A2A2B] bg-[#EBE6DC] border border-[#D8D2C5] hover:border-[#F04E36] hover:bg-white hover:text-[#F04E36] transition-all shadow-xs"
            title="Submit a private inquiry to Meetup Club"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#F04E36]" />
            <span>Make an Inquiry</span>
          </button>

          {/* Conditional Admin Quick Shortcut (ONLY visible when signed in as admin) */}
          {userSession?.role === 'admin' && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                currentPage === 'admin'
                  ? 'bg-[#2A2A2B] text-white border-[#2A2A2B] shadow-sm'
                  : 'text-[#2A2A2B] border-[#D8D2C5] bg-[#EBE6DC] hover:border-[#F04E36] hover:text-[#F04E36]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#F04E36]" />
              <span>Admin Suite</span>
            </button>
          )}

          {/* Conditional Staff Quick Shortcut (ONLY visible when signed in as staff) */}
          {userSession?.role === 'staff' && (
            <button
              onClick={() => handleNavClick('gate-scanner')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                currentPage === 'gate-scanner'
                  ? 'bg-[#2A2A2B] text-white border-[#2A2A2B] shadow-sm'
                  : 'text-[#2A2A2B] border-[#D8D2C5] bg-[#EBE6DC] hover:border-[#F04E36] hover:text-[#F04E36]'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-[#F04E36]" />
              <span>Gate Scanner</span>
            </button>
          )}

          {userSession ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] hover:border-[#F04E36] transition-all text-xs font-medium text-[#2A2A2B] shadow-xs"
              >
                {userSession.photoURL ? (
                  <img
                    src={userSession.photoURL}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover border border-[#D8D2C5]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#2A2A2B] flex items-center justify-center text-white font-bold text-[10px]">
                    {userSession.displayName ? userSession.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="truncate max-w-[100px] leading-tight font-semibold text-[#2A2A2B]">
                    {userSession.displayName || 'Member'}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#F04E36] font-mono font-bold">
                    {userSession.role}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#4A4A4A]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#F4F1EA] border border-[#D8D2C5] p-2 shadow-2xl z-50 backdrop-blur-xl">
                  <div className="px-3 py-2 border-b border-[#D8D2C5] text-xs">
                    <p className="text-[#4A4A4A] text-[10px] uppercase font-mono">Signed in as</p>
                    <p className="font-semibold text-[#2A2A2B] truncate">{userSession.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#EBE6DC] text-[#F04E36] border border-[#D8D2C5] uppercase">
                      {userSession.role}
                    </span>
                  </div>

                  {userSession.role === 'attendee' && (
                    <button
                      onClick={() => handleNavClick('my-tickets')}
                      className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs text-left rounded-lg text-[#2A2A2B] hover:bg-[#EBE6DC] hover:text-[#F04E36] transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-[#F04E36]" />
                      <span>My Attendee Panel (Tickets)</span>
                    </button>
                  )}

                  {userSession.role === 'admin' && (
                    <button
                      onClick={() => handleNavClick('admin')}
                      className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs text-left rounded-lg text-[#2A2A2B] hover:bg-[#EBE6DC] hover:text-[#F04E36] transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4 text-[#F04E36]" />
                      <span>Admin CMS & Analytics</span>
                    </button>
                  )}

                  {userSession.role === 'staff' && (
                    <button
                      onClick={() => handleNavClick('gate-scanner')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left rounded-lg text-[#2A2A2B] hover:bg-[#EBE6DC] hover:text-[#F04E36] transition-colors"
                    >
                      <QrCode className="w-4 h-4 text-[#F04E36]" />
                      <span>Mobile Gate Scanner</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left rounded-lg text-[#4A4A4A] hover:bg-[#EBE6DC] hover:text-[#2A2A2B] transition-colors"
                  >
                    <Crown className="w-4 h-4 text-[#F04E36]" />
                    <span>Switch Role / Sign In</span>
                  </button>

                  <div className="my-1 border-t border-[#D8D2C5]" />

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('attendee')}
              className="relative group px-5 py-2 rounded-xl font-semibold text-xs tracking-wider uppercase text-white bg-[#F04E36] hover:bg-[#d93f28] shadow-sm hover:shadow-[0_4px_16px_rgba(240,78,54,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-white" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile menu triggers */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={onOpenInquiryModal}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#2A2A2B] bg-[#EBE6DC] border border-[#D8D2C5]"
          >
            Inquire
          </button>
          {!userSession && (
            <button
              onClick={() => onOpenAuth('attendee')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase text-white bg-[#F04E36] shadow-sm"
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#2A2A2B] hover:bg-[#EBE6DC]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#D8D2C5] bg-[#F4F1EA]/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#F04E36] bg-[#F04E36]/10 font-bold border border-[#F04E36]/30'
                    : 'text-[#4A4A4A] hover:bg-[#EBE6DC] hover:text-[#2A2A2B]'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-[#D8D2C5] space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenInquiryModal();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#2A2A2B] bg-[#EBE6DC] border border-[#D8D2C5]"
            >
              <MessageCircle className="w-4 h-4 text-[#F04E36]" />
              <span>Make an Inquiry</span>
            </button>

            {userSession ? (
              <div className="pt-2 flex items-center justify-between px-2">
                <span className="text-xs text-[#4A4A4A]">{userSession.email}</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="text-xs text-rose-600 flex items-center gap-1 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('attendee');
                }}
                className="w-full mt-2 py-2.5 rounded-xl text-center font-bold text-xs uppercase tracking-wider text-white bg-[#F04E36] hover:bg-[#d93f28] shadow-md flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4 text-white" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
