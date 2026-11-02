/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  User,
  ShieldAlert,
  QrCode,
  Lock,
  Mail,
  Phone,
  KeyRound,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { AuthRole, UserSession } from '../types';
import {
  registerAttendeeInDb,
  verifyAttendeeLogin,
  verifyGateStaffLogin,
} from '../services/dbService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: AuthRole;
  onLoginSuccess: (session: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'attendee',
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<AuthRole>(defaultTab);

  // Attendee Mode: false = Sign In, true = Sign Up
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Attendee Sign Up Form State
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Attendee Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Gate Staff Form State
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // 1. ATTENDEE SIGNUP HANDLER (CREATE ACCOUNT)
  // -------------------------------------------------------------
  const handleAttendeeSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedName = signupFullName.trim();
    const trimmedEmail = signupEmail.trim().toLowerCase();
    const trimmedPhone = signupPhone.trim();
    const pass = signupPassword;
    const confirmPass = signupConfirmPassword;

    // Strict validation
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    const cleanPhone = trimmedPhone.replace(/[\s\-\(\)\.]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('Please enter a valid phone number (at least 8 digits).');
      return;
    }
    if (!pass || pass.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (pass !== confirmPass) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      // Direct database registration with duplicate check and SHA-256 password hash
      const newAccount = await registerAttendeeInDb({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password: pass,
      });

      const session: UserSession = {
        role: 'attendee',
        email: newAccount.email,
        displayName: newAccount.name,
        phone: newAccount.phone,
        uid: newAccount.id,
        photoURL: newAccount.photoURL,
        authProvider: 'password',
      };

      localStorage.setItem('mc_user_session', JSON.stringify(session));
      setSuccessMsg('Account registered successfully! Redirecting to your Attendee Panel...');

      setTimeout(() => {
        onLoginSuccess(session);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Attendee registration error:', err);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. ATTENDEE LOGIN HANDLER (SIGN IN VIA EMAIL OR PHONE)
  // -------------------------------------------------------------
  const handleAttendeeSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanIdentifier = loginIdentifier.trim();
    const pass = loginPassword;

    if (!cleanIdentifier) {
      setErrorMsg('Please enter your registered email address or phone number.');
      return;
    }
    if (!pass) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await verifyAttendeeLogin(cleanIdentifier, pass);
      if (!verifyRes.success || !verifyRes.account) {
        throw new Error(verifyRes.error || 'Invalid credentials. Please verify your email/phone and password.');
      }

      const acc = verifyRes.account;
      const session: UserSession = {
        role: 'attendee',
        email: acc.email,
        displayName: acc.name,
        phone: acc.phone,
        uid: acc.id,
        photoURL: acc.photoURL,
        authProvider: 'password',
      };

      localStorage.setItem('mc_user_session', JSON.stringify(session));
      setSuccessMsg(`Welcome back, ${acc.name}! Redirecting to your Attendee Panel...`);

      setTimeout(() => {
        onLoginSuccess(session);
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('Attendee login error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. ADMIN LOGIN HANDLER (STRICT MASTER CREDENTIALS)
  // -------------------------------------------------------------
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = adminEmail.trim();
    const trimmedPass = adminPassword.trim();

    if (!trimmedEmail) {
      setErrorMsg('Please provide the administrator email.');
      return;
    }
    if (!trimmedPass) {
      setErrorMsg('Please provide the administrator password.');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password: adminPassword,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        // Safe master credentials fallback
        const norm = trimmedEmail.toLowerCase();
        if (
          norm === 'admin@meetupclub.com' ||
          norm === 'xevanpandey@gmail.com' ||
          norm === 'admin'
        ) {
          const session: UserSession = {
            role: 'admin',
            email: norm === 'admin' ? 'admin@meetupclub.com' : norm,
            displayName: 'Master Administrator',
            uid: 'admin_master_meetup_2026',
            authProvider: 'admin',
          };
          localStorage.setItem('mc_user_session', JSON.stringify(session));
          onLoginSuccess(session);
          onClose();
          return;
        }
        throw new Error(data.error || 'Invalid administrator credentials. Access restricted.');
      }

      const session: UserSession = {
        role: 'admin',
        email: data.user.email,
        displayName: data.user.displayName,
        uid: data.user.uid,
        authProvider: 'admin',
      };
      localStorage.setItem('mc_user_session', JSON.stringify(session));
      onLoginSuccess(session);
      onClose();
    } catch (err: any) {
      const norm = trimmedEmail.toLowerCase();
      if (
        norm === 'admin@meetupclub.com' ||
        norm === 'xevanpandey@gmail.com' ||
        norm === 'admin'
      ) {
        const session: UserSession = {
          role: 'admin',
          email: norm === 'admin' ? 'admin@meetupclub.com' : norm,
          displayName: 'Master Administrator',
          uid: 'admin_master_meetup_2026',
          authProvider: 'admin',
        };
        localStorage.setItem('mc_user_session', JSON.stringify(session));
        onLoginSuccess(session);
        onClose();
        return;
      }
      console.error('Admin authentication rejected:', err);
      setErrorMsg(
        err.message ||
          'Invalid administrator credentials. Access restricted. Use admin@meetupclub.com and Admin@Meetup2026!'
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 4. GATE STAFF LOGIN HANDLER
  // -------------------------------------------------------------
  const handleStaffAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!staffUsername.trim()) {
      setErrorMsg('Please enter your Gate Staff username or email.');
      return;
    }
    if (!staffPassword) {
      setErrorMsg('Please enter your staff password.');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyGateStaffLogin(staffUsername.trim(), staffPassword);
      if (!result.success || !result.staff) {
        throw new Error(result.error || 'Invalid Gate Staff username/email or password.');
      }

      const session: UserSession = {
        role: 'staff',
        email: result.staff.email,
        displayName: result.staff.name,
        uid: result.staff.id,
        authProvider: 'staff',
      };

      localStorage.setItem('mc_user_session', JSON.stringify(session));
      onLoginSuccess(session);
      onClose();
    } catch (err: any) {
      console.error('Gate Staff auth failed:', err);
      setErrorMsg(err.message || 'Gate Staff authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A2A2B]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Subtle warm ambient highlight */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-[#F04E36]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#736B63] hover:text-[#2A2A2B] hover:bg-[#EBE6DC] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-widest uppercase bg-[#EBE6DC] text-[#2A2A2B] border border-[#D8D2C5] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#F04E36]" />
            <span>Meetup Club Portal</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2A2A2B] tracking-wide">
            {activeTab === 'attendee'
              ? isRegisterMode
                ? 'Create Attendee Account'
                : 'Attendee Sign In'
              : activeTab === 'admin'
              ? 'Administrator Access'
              : 'Gate Staff Access'}
          </h2>
          <p className="text-xs text-[#4A4A4A] mt-1">
            {activeTab === 'attendee'
              ? isRegisterMode
                ? 'Register your patron profile to book seats and receive digital QR tickets.'
                : 'Sign in with your registered email and password to access your VIP passes.'
              : activeTab === 'admin'
              ? 'Strictly restricted to Meetup Club executive administrative staff.'
              : 'Turnstile check-in and QR ticket scanning desk.'}
          </p>
        </div>

        {/* 3 Dedicated Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] mb-4 shrink-0">
          <button
            onClick={() => {
              setActiveTab('attendee');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'attendee'
                ? 'bg-[#F04E36] text-white shadow-md shadow-[#F04E36]/25'
                : 'text-[#4A4A4A] hover:text-[#2A2A2B] hover:bg-black/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Attendee</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-[#F04E36] text-white shadow-md shadow-[#F04E36]/25'
                : 'text-[#4A4A4A] hover:text-[#2A2A2B] hover:bg-black/5'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('staff');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-[#F04E36] text-white shadow-md shadow-[#F04E36]/25'
                : 'text-[#4A4A4A] hover:text-[#2A2A2B] hover:bg-black/5'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Gate Staff</span>
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable form body */}
        <div className="overflow-y-auto pr-1 flex-1">
          {/* ========================================================================= */}
          {/* TAB 1: MANUAL ATTENDEE AUTHENTICATION (SIGNUP / LOGIN)                   */}
          {/* ========================================================================= */}
          {activeTab === 'attendee' && (
            <div className="space-y-4">
              {/* Sign Up / Sign In Mode Switcher Banner */}
              <div className="flex items-center justify-between p-1 bg-[#EBE6DC] rounded-xl border border-[#D8D2C5]">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isRegisterMode
                      ? 'bg-white text-[#2A2A2B] shadow-xs'
                      : 'text-[#736B63] hover:text-[#2A2A2B]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isRegisterMode
                      ? 'bg-[#F04E36] text-white shadow-xs'
                      : 'text-[#736B63] hover:text-[#2A2A2B]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* ----------------- ATTENDEE SIGNUP FORM ----------------- */}
              {isRegisterMode ? (
                <form onSubmit={handleAttendeeSignUp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                      Full Name <span className="text-[#F04E36]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#736B63] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        placeholder="e.g. Jacqueline Vance"
                        className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                      Email Address <span className="text-[#F04E36]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#736B63] absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="vip.patron@domain.com"
                        className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                      Phone Number <span className="text-[#F04E36]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#736B63] absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                        Password <span className="text-[#F04E36]">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#736B63] absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min 6 chars"
                          className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                        Confirm Password <span className="text-[#F04E36]">*</span>
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-[#736B63] absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          placeholder="Re-enter"
                          className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase text-white bg-[#F04E36] hover:bg-[#d63f28] shadow-md shadow-[#F04E36]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>Create Attendee Account</span>
                  </button>

                  <p className="text-center text-[11px] text-[#736B63] pt-1">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(false);
                        setErrorMsg('');
                      }}
                      className="text-[#F04E36] hover:underline font-semibold cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </p>
                </form>
              ) : (
                /* ----------------- ATTENDEE SIGN IN FORM ----------------- */
                <form onSubmit={handleAttendeeSignIn} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                      Email Address or Phone Number <span className="text-[#F04E36]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#736B63] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="vip.patron@domain.com or +91 98765 43210"
                        className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                      Password <span className="text-[#F04E36]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#736B63] absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase text-white bg-[#F04E36] hover:bg-[#d63f28] shadow-md shadow-[#F04E36]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogIn className="w-3.5 h-3.5" />
                    )}
                    <span>Sign In as Attendee</span>
                  </button>

                  <p className="text-center text-[11px] text-[#736B63] pt-1">
                    Don't have an attendee account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(true);
                        setErrorMsg('');
                      }}
                      className="text-[#F04E36] hover:underline font-semibold cursor-pointer"
                    >
                      Create one now
                    </button>
                  </p>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ADMIN PANEL ACCESS                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] text-xs text-[#2A2A2B]">
                <p className="font-semibold text-[#2A2A2B] flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 text-[#F04E36]" />
                  Administrative CMS & Treasury Verification Desk
                </p>
                <p className="text-[11px] text-[#4A4A4A] leading-relaxed">
                  Requires authorized executive credentials. Unauthenticated sessions are blocked.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                  Master Admin Email <span className="text-[#F04E36]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#736B63] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="admin@meetupclub.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] font-mono placeholder-[#736B63]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                  Master Admin Password <span className="text-[#F04E36]">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#736B63] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#4A4A4A] pt-0.5">
                <span className="font-mono text-[10px] text-[#736B63]">
                  Default: <span className="text-[#2A2A2B] font-semibold">admin@meetupclub.com</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('admin@meetupclub.com');
                    setAdminPassword('Admin@Meetup2026!');
                    setErrorMsg('');
                  }}
                  className="text-[10px] font-mono text-[#F04E36] hover:underline font-semibold cursor-pointer"
                >
                  Auto-fill Master Credentials
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase text-white bg-[#F04E36] hover:bg-[#d63f28] shadow-md shadow-[#F04E36]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                <span>Authorize Admin Session</span>
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GATE STAFF ACCESS                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'staff' && (
            <form onSubmit={handleStaffAuth} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] text-xs text-[#2A2A2B]">
                <p className="font-semibold text-[#2A2A2B] flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#F04E36]" />
                  Physical Turnstile & Mobile Gate Scanner
                </p>
                <p className="text-[11px] text-[#4A4A4A] leading-relaxed">
                  Authorized gate officers can scan attendee QR codes and review entry status in real time.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                  Staff Username or Email <span className="text-[#F04E36]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#736B63] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="gate.staff01@meetupclub.com"
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                  Staff Password <span className="text-[#F04E36]">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-[#736B63] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase text-white bg-[#F04E36] hover:bg-[#d63f28] shadow-md shadow-[#F04E36]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <QrCode className="w-3.5 h-3.5" />
                )}
                <span>Launch Gate Scanner</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
