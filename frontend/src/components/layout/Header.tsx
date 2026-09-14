import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layers,
  Bell,
  User as UserIcon,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { notificationApi } from '../../api/client.js';
import { Notification } from '../../types/index.js';
import { Button } from '../ui/Button.js';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [lang, setLang] = useState<'EN' | 'TA'>('EN');

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      notificationApi
        .list()
        .then((res) => {
          if (res.success && res.data) setNotifications(res.data);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const isLinkActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const getDashboardPath = () => {
    if (role === 'CENTRAL_ADMIN') return '/admin';
    if (role === 'OFFICER') return '/officer';
    return '/citizen';
  };

  const getDashboardLabel = () => {
    if (role === 'CENTRAL_ADMIN') return 'Admin Portal';
    if (role === 'OFFICER') return 'Officer Portal';
    return 'Citizen Portal';
  };

  const getDisplayName = () => {
    if (user?.fullName) {
      // Return first name or up to 14 chars
      return user.fullName.split(' ')[0] || user.fullName;
    }
    return 'CITIZEN';
  };

  const getUserInitial = () => {
    if (user?.fullName) {
      return user.fullName.trim().charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#DDE3EA] shadow-sm">
      {/* 1. Top Government Trust & Encryption Bar */}
      <div className="bg-[#0B2A4A] text-white text-xs px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-[#123B6D]/50">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium tracking-wide text-white">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A3E9B9]" />
            GOVCONNECT
          </span>
          <span className="hidden sm:inline text-slate-400 font-light">|</span>
          <span className="hidden sm:inline text-slate-300 text-[11px] font-normal tracking-tight">
            Unified Government Service Interoperability & Consent Gateway
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-300">
            <Lock className="w-3 h-3 text-[#F4A340]" />
            256-Bit Encrypted
          </span>
          {/* Language Switch */}
          <button
            type="button"
            onClick={() => setLang(lang === 'EN' ? 'TA' : 'EN')}
            className="text-[11px] text-slate-200 hover:text-[#F4A340] font-medium transition-colors cursor-pointer"
            aria-label="Switch Language"
          >
            {lang === 'EN' ? 'தமிழ் (TA)' : 'English (EN)'}
          </button>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[74px]">
          {/* LEFT: Clean Brand Identity */}
          <Link to="/" className="flex items-center gap-3.5 group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#123B6D] text-white flex items-center justify-center shadow-sm group-hover:bg-[#0B2A4A] transition-colors flex-shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[22px] font-bold tracking-tight text-[#123B6D] leading-none group-hover:text-[#0B2A4A] transition-colors">
                GOVCONNECT
              </span>
              <span className="text-[11.5px] sm:text-[12px] text-[#5B667A] font-normal leading-tight mt-1 whitespace-nowrap hidden sm:block">
                Unified Government Service Interoperability Platform
              </span>
            </div>
          </Link>

          {/* CENTER: Clean, Balanced Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 h-full">
            <Link
              to="/services"
              className={`inline-flex items-center text-[14px] font-medium transition-colors whitespace-nowrap h-full border-b-2 px-1 ${
                isLinkActive('/services')
                  ? 'text-[#123B6D] font-semibold border-[#123B6D]'
                  : 'text-[#5B667A] hover:text-[#123B6D] border-transparent'
              }`}
            >
              Services
            </Link>
            <Link
              to="/about"
              className={`inline-flex items-center text-[14px] font-medium transition-colors whitespace-nowrap h-full border-b-2 px-1 ${
                isLinkActive('/about')
                  ? 'text-[#123B6D] font-semibold border-[#123B6D]'
                  : 'text-[#5B667A] hover:text-[#123B6D] border-transparent'
              }`}
            >
              About
            </Link>
            <Link
              to="/how-it-works"
              className={`inline-flex items-center text-[14px] font-medium transition-colors whitespace-nowrap h-full border-b-2 px-1 ${
                isLinkActive('/how-it-works')
                  ? 'text-[#123B6D] font-semibold border-[#123B6D]'
                  : 'text-[#5B667A] hover:text-[#123B6D] border-transparent'
              }`}
            >
              How It Works
            </Link>
            <Link
              to="/security"
              className={`inline-flex items-center text-[14px] font-medium transition-colors whitespace-nowrap h-full border-b-2 px-1 ${
                isLinkActive('/security')
                  ? 'text-[#123B6D] font-semibold border-[#123B6D]'
                  : 'text-[#5B667A] hover:text-[#123B6D] border-transparent'
              }`}
            >
              Security
            </Link>
            <Link
              to="/assistant"
              className={`inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors whitespace-nowrap h-full border-b-2 px-1 ${
                isLinkActive('/assistant')
                  ? 'text-[#123B6D] font-semibold border-[#123B6D]'
                  : 'text-[#5B667A] hover:text-[#123B6D] border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F4A340]" />
              AI Assistant
            </Link>

            {/* Authenticated Links (Dashboard & Consents) */}
            {isAuthenticated && (
              <>
                <Link
                  to={getDashboardPath()}
                  className={`inline-flex items-center text-[14px] font-medium transition-colors whitespace-nowrap h-full border-b-2 px-1 ${
                    isLinkActive(getDashboardPath())
                      ? 'text-[#123B6D] font-semibold border-[#123B6D]'
                      : 'text-[#5B667A] hover:text-[#123B6D] border-transparent'
                  }`}
                >
                  Dashboard
                </Link>

                {role === 'CITIZEN' && (
                  <Link
                    to="/consents"
                    className={`inline-flex items-center text-[14px] font-medium transition-colors whitespace-nowrap h-full border-b-2 px-1 ${
                      isLinkActive('/consents')
                        ? 'text-[#123B6D] font-semibold border-[#123B6D]'
                        : 'text-[#5B667A] hover:text-[#123B6D] border-transparent'
                    }`}
                  >
                    Consents
                  </Link>
                )}

                {role === 'CENTRAL_ADMIN' && (
                  <Link
                    to="/admin/connectors"
                    className={`inline-flex items-center text-[14px] font-medium transition-colors whitespace-nowrap h-full border-b-2 px-1 ${
                      isLinkActive('/admin/connectors')
                        ? 'text-[#123B6D] font-semibold border-[#123B6D]'
                        : 'text-[#5B667A] hover:text-[#123B6D] border-transparent'
                    }`}
                  >
                    Connectors
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* RIGHT: Notifications & Compact User Profile / Auth Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="p-2 rounded-lg text-[#5B667A] hover:text-[#123B6D] hover:bg-[#F5F7FA] relative transition-colors cursor-pointer"
                    aria-label="View notifications"
                    aria-expanded={showNotifMenu}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-[#C0392B] text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#DDE3EA] py-3 z-50 animate-fadeIn">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-[#DDE3EA]">
                        <span className="font-bold text-xs text-[#172033]">
                          Notifications ({unreadCount} unread)
                        </span>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-xs text-[#123B6D] hover:underline font-semibold cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-[#DDE3EA]/60">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-[#5B667A]">No notifications yet</div>
                        ) : (
                          notifications.slice(0, 8).map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 text-xs hover:bg-[#F5F7FA] transition-colors ${
                                !notif.isRead ? 'bg-[#EBF3FA]/50 font-medium' : ''
                              }`}
                            >
                              <p className="font-bold text-[#172033]">{notif.title}</p>
                              <p className="text-[#5B667A] text-[11px] mt-0.5 leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-[#5B667A]/70 mt-1 block font-mono">
                                {new Date(notif.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact User Profile Button */}
                <div className="relative" ref={userRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-[#DDE3EA] hover:border-[#B9D4EE] hover:bg-[#F5F7FA] transition-all cursor-pointer"
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#EBF3FA] text-[#123B6D] font-bold text-xs flex items-center justify-center border border-[#B9D4EE]">
                      {getUserInitial()}
                    </div>
                    <span className="text-xs font-semibold text-[#172033] tracking-wide uppercase max-w-[110px] truncate hidden sm:inline">
                      {getDisplayName()}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#5B667A]" />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#DDE3EA] py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-2.5 border-b border-[#DDE3EA]">
                        <p className="text-xs font-bold text-[#172033]">{user?.fullName}</p>
                        <p className="text-[11px] text-[#5B667A] truncate">{user?.email}</p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE] px-2 py-0.5 rounded">
                            {user?.role === 'CENTRAL_ADMIN'
                              ? 'Central Admin'
                              : user?.role === 'OFFICER'
                              ? `Officer (${user?.department?.code || 'Dept'})`
                              : 'Citizen Account'}
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to={getDashboardPath()}
                          onClick={() => setShowUserMenu(false)}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-[#172033] hover:bg-[#EBF3FA] flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-[#123B6D]" />
                            {getDashboardLabel()}
                          </span>
                          <ExternalLink className="w-3 h-3 text-[#5B667A]" />
                        </Link>
                        {role === 'CITIZEN' && (
                          <Link
                            to="/consents"
                            onClick={() => setShowUserMenu(false)}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-[#172033] hover:bg-[#EBF3FA] flex items-center gap-2 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#123B6D]" />
                            Manage Consents
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-[#DDE3EA] pt-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                            navigate('/login');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-[#C0392B] hover:bg-[#FDEDEC] flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-[#C0392B]" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Unauthenticated: Visible Sign In & Register Buttons */
              <div className="flex items-center gap-2.5">
                <Link to="/login">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="border border-[#123B6D] text-[#123B6D] hover:bg-[#EBF3FA] font-semibold h-9 px-4 text-xs"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-[#123B6D] hover:bg-[#0B2A4A] text-white shadow-sm font-semibold h-9 px-4 text-xs"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden rounded-lg text-[#5B667A] hover:bg-[#F5F7FA] hover:text-[#172033] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#172033]" /> : <Menu className="w-5 h-5 text-[#172033]" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile & Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DDE3EA] bg-white px-4 py-4 space-y-2 shadow-lg animate-fadeIn">
          <nav className="space-y-1">
            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors ${
                isLinkActive('/services') ? 'bg-[#EBF3FA] text-[#123B6D]' : 'text-[#172033] hover:bg-slate-50'
              }`}
            >
              Services
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors ${
                isLinkActive('/about') ? 'bg-[#EBF3FA] text-[#123B6D]' : 'text-[#172033] hover:bg-slate-50'
              }`}
            >
              About
            </Link>
            <Link
              to="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors ${
                isLinkActive('/how-it-works') ? 'bg-[#EBF3FA] text-[#123B6D]' : 'text-[#172033] hover:bg-slate-50'
              }`}
            >
              How It Works
            </Link>
            <Link
              to="/security"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors ${
                isLinkActive('/security') ? 'bg-[#EBF3FA] text-[#123B6D]' : 'text-[#172033] hover:bg-slate-50'
              }`}
            >
              Security
            </Link>
            <Link
              to="/assistant"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors ${
                isLinkActive('/assistant') ? 'bg-[#EBF3FA] text-[#123B6D]' : 'text-[#172033] hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F4A340]" />
              AI Assistant
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors ${
                    isLinkActive(getDashboardPath())
                      ? 'bg-[#EBF3FA] text-[#123B6D]'
                      : 'text-[#172033] hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </Link>

                {role === 'CITIZEN' && (
                  <Link
                    to="/consents"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors ${
                      isLinkActive('/consents') ? 'bg-[#EBF3FA] text-[#123B6D]' : 'text-[#172033] hover:bg-slate-50'
                    }`}
                  >
                    Consents
                  </Link>
                )}

                {role === 'CENTRAL_ADMIN' && (
                  <Link
                    to="/admin/connectors"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors ${
                      isLinkActive('/admin/connectors')
                        ? 'bg-[#EBF3FA] text-[#123B6D]'
                        : 'text-[#172033] hover:bg-slate-50'
                    }`}
                  >
                    Connectors
                  </Link>
                )}
              </>
            )}
          </nav>

          {isAuthenticated ? (
            <div className="pt-3 border-t border-[#DDE3EA] space-y-2">
              <div className="px-3 py-2 bg-[#F5F7FA] rounded-lg">
                <p className="text-xs font-bold text-[#172033]">{user?.fullName}</p>
                <p className="text-[11px] text-[#5B667A]">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full text-center text-xs font-semibold text-[#C0392B] py-2.5 bg-[#FDEDEC] rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-[#DDE3EA] grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="primary" size="sm" className="w-full text-xs">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
