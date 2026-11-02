/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Users,
  ShieldCheck,
  Building,
  Calendar,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TicketItem, GateScanResult } from '../types';
import { findTicketByIdOrQr, checkInTicket, subscribeTickets } from '../services/dbService';

interface GateScannerProps {
  staffName?: string;
  onExit?: () => void;
}

export const GateScanner: React.FC<GateScannerProps> = ({
  staffName = 'Gate Officer',
  onExit,
}) => {
  // Input modes: 'camera' | 'upload' | 'search'
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'search'>('camera');

  // Scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Manual search input
  const [searchCode, setSearchCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Scan Result Overlay
  const [scanResult, setScanResult] = useState<GateScanResult | null>(null);

  // Live Stats from DB
  const [allTickets, setAllTickets] = useState<TicketItem[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  // Subscribe to live ticket stats
  useEffect(() => {
    const unsub = subscribeTickets((list) => {
      setAllTickets(list);
    });
    return () => unsub();
  }, []);

  // Web Audio Tone generator
  const playTone = (type: 'valid' | 'invalid' | 'warning') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'valid') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880.0, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else if (type === 'invalid') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(330, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {
      // Audio context policy fallback
    }
  };

  // Trigger haptic vibration on mobile
  const triggerHaptic = (pattern: number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration errors
      }
    }
  };

  // Start Camera QR Scanner
  const startCamera = async () => {
    setCameraError('');
    try {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch {
          // Ignore clean-up error
        }
      }

      const scanner = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = scanner;

      const qrConfig = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: 'environment' },
        qrConfig,
        (decodedText) => {
          handleQrDecoded(decodedText);
        },
        (_errorMessage) => {
          // Frame read pass
        }
      );
      setScannerActive(true);
    } catch (err: any) {
      console.warn('Camera failed:', err);
      setCameraError(
        'Unable to initialize live video stream. You may upload a QR screenshot or use manual ID search.'
      );
      setScannerActive(false);
    }
  };

  // Stop Camera Scanner
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch {
        // Ignore cleanup error
      }
      html5QrCodeRef.current = null;
    }
    setScannerActive(false);
  };

  // Handle activeMode transitions
  useEffect(() => {
    if (activeMode === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 200);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [activeMode]);

  // Unified ticket processor
  const processTicketCode = async (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) return;

    const ticket = await findTicketByIdOrQr(trimmed);

    if (!ticket) {
      playTone('invalid');
      triggerHaptic([200, 100, 200]);
      setScanResult({
        status: 'invalid',
        message: 'INVALID OR FORGED TICKET - NO RECORD FOUND',
        scannedAt: new Date().toLocaleTimeString(),
      });
      return;
    }

    if (ticket.status === 'Verified') {
      if (ticket.isCheckedIn) {
        playTone('invalid');
        triggerHaptic([300, 100, 300]);
        setScanResult({
          status: 'invalid',
          ticket,
          message: 'TICKET ALREADY SCANNED - ENTRY PREVIOUSLY GRANTED',
          scannedAt: new Date().toLocaleTimeString(),
        });
      } else {
        await checkInTicket(ticket.id, staffName);
        playTone('valid');
        triggerHaptic([100, 50, 100, 50, 150]);

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F04E36', '#2A2A2B', '#EBE6DC', '#FFFFFF'],
          });
        } catch {
          // Confetti silent fail
        }

        setScanResult({
          status: 'valid',
          ticket: { ...ticket, isCheckedIn: true },
          message: 'ACCESS GRANTED - VIP ADMITTED',
          scannedAt: new Date().toLocaleTimeString(),
        });
      }
    } else if (ticket.status === 'Pending') {
      playTone('warning');
      triggerHaptic([150, 100, 150]);
      setScanResult({
        status: 'unverified',
        ticket,
        message: 'Tickets are not verified from the admin',
        scannedAt: new Date().toLocaleTimeString(),
      });
    } else {
      playTone('invalid');
      triggerHaptic([250, 80, 250]);
      setScanResult({
        status: 'invalid',
        ticket,
        message: 'REJECTED TICKET - PAYMENT CANCELLED OR REFUNDED',
        scannedAt: new Date().toLocaleTimeString(),
      });
    }
  };

  const handleQrDecoded = (decodedText: string) => {
    if (isProcessingRef.current || scanResult !== null) return;
    isProcessingRef.current = true;
    processTicketCode(decodedText);
  };

  const handleQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('file-qr-temp');
      const decodedResult = await html5QrCode.scanFile(file, true);
      processTicketCode(decodedResult);
    } catch {
      setScanResult({
        status: 'invalid',
        message: 'INVALID OR UNREADABLE TICKET QR IMAGE',
        scannedAt: new Date().toLocaleTimeString(),
      });
    }
  };

  const handleManualSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setIsSearching(true);
    await processTicketCode(searchCode.trim());
    setIsSearching(false);
  };

  const handleScanNextGuest = () => {
    setScanResult(null);
    setSearchCode('');
    // Brief 300ms cooldown so the previous physical pass isn't instantly scanned again
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 300);
  };

  // Gate Turnstile Stats
  const checkedInCount = allTickets.filter((t) => t.isCheckedIn).length;
  const verifiedPendingCount = allTickets.filter((t) => t.status === 'Verified' && !t.isCheckedIn).length;
  const totalVerifiedCount = allTickets.filter((t) => t.status === 'Verified').length;

  return (
    <div className="relative min-h-[85vh] w-full max-w-2xl mx-auto px-3 sm:px-6 py-6 text-[#2A2A2B]">
      {/* Hidden container for temp file scanning */}
      <div id="file-qr-temp" className="hidden" />

      {/* Top Staff Navigation & Title */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D8D2C5] mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F04E36] flex items-center justify-center text-white shadow-sm">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#2A2A2B] tracking-wide">
              Turnstile Gate Scanner
            </h2>
            <p className="text-[11px] font-mono text-[#736B63]">
              Station: Main Entry VIP Gate • {staffName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-white border border-[#D8D2C5] text-[#736B63] hover:text-[#2A2A2B] cursor-pointer shadow-sm"
            title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#F04E36]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#D8D2C5] text-xs font-semibold text-[#2A2A2B] hover:text-[#F04E36] cursor-pointer shadow-sm"
            >
              Exit Scanner
            </button>
          )}
        </div>
      </div>

      {/* Live Turnstile Stats Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <div className="p-3 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] text-center shadow-sm">
          <span className="text-[10px] uppercase font-mono text-[#736B63] block">Admitted / In</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">
            {checkedInCount}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] text-center shadow-sm">
          <span className="text-[10px] uppercase font-mono text-[#736B63] block">Awaiting Entry</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-[#F04E36]">
            {verifiedPendingCount}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] text-center shadow-sm">
          <span className="text-[10px] uppercase font-mono text-[#736B63] block">Total Issued</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-[#2A2A2B]">
            {totalVerifiedCount}
          </span>
        </div>
      </div>

      {/* 3 Verification Input Modes Selector */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] mb-5">
        <button
          onClick={() => {
            setActiveMode('camera');
            setScanResult(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
            activeMode === 'camera'
              ? 'bg-[#F04E36] text-white shadow-md shadow-[#F04E36]/25'
              : 'text-[#4A4A4A] hover:text-[#2A2A2B] hover:bg-black/5'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Live Camera</span>
        </button>

        <button
          onClick={() => {
            setActiveMode('upload');
            setScanResult(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
            activeMode === 'upload'
              ? 'bg-[#F04E36] text-white shadow-md shadow-[#F04E36]/25'
              : 'text-[#4A4A4A] hover:text-[#2A2A2B] hover:bg-black/5'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>QR Upload</span>
        </button>

        <button
          onClick={() => {
            setActiveMode('search');
            setScanResult(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
            activeMode === 'search'
              ? 'bg-[#F04E36] text-white shadow-md shadow-[#F04E36]/25'
              : 'text-[#4A4A4A] hover:text-[#2A2A2B] hover:bg-black/5'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search ID</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* MODE 1: LIVE CAMERA SCANNER                                */}
      {/* ========================================================= */}
      {activeMode === 'camera' && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-[#2A2A2B] border-2 border-[#D8D2C5] min-h-[320px] sm:min-h-[380px] flex flex-col items-center justify-center">
            {/* Html5Qrcode video mount target - permanently mounted in camera mode to eliminate stream lag */}
            <div id="qr-reader" className="w-full h-full" />

            {/* Viewfinder crosshairs overlay */}
            {!scanResult && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative w-56 h-56 border-2 border-[#F04E36] rounded-2xl shadow-[0_0_20px_rgba(240,78,54,0.35)]">
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-[#F04E36]" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-[#F04E36]" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-[#F04E36]" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-[#F04E36]" />
                  <div className="w-full h-0.5 bg-[#F04E36] absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_8px_rgba(240,78,54,0.8)]" />
                </div>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-[#F4F1EA] border border-[#D8D2C5] text-[#2A2A2B] text-xs text-center shadow-lg">
                <p className="font-semibold mb-1">Camera Notice</p>
                <p className="text-[#4A4A4A]">{cameraError}</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={startCamera}
                    className="px-3 py-1 rounded bg-[#F04E36] text-white text-[11px] font-bold cursor-pointer"
                  >
                    Retry Camera
                  </button>
                  <button
                    onClick={() => setActiveMode('search')}
                    className="px-3 py-1 rounded bg-white border border-[#D8D2C5] text-[#2A2A2B] text-[11px] cursor-pointer"
                  >
                    Use Code Search
                  </button>
                </div>
              </div>
            )}
          </div>

          {!scanResult && (
            <div className="flex items-center justify-between text-xs text-[#736B63] px-1 font-mono">
              <span>Align attendee ticket QR inside the reticle.</span>
              <button
                onClick={startCamera}
                className="text-[#F04E36] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Restart Lens
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: MANUAL QR UPLOAD                                  */}
      {/* ========================================================= */}
      {activeMode === 'upload' && !scanResult && (
        <div className="p-8 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#F4F1EA] border border-[#D8D2C5] flex items-center justify-center mx-auto text-[#F04E36]">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2A2A2B]">Scan QR from Image / Screenshot</h3>
            <p className="text-xs text-[#4A4A4A] mt-1 max-w-sm mx-auto">
              If an attendee sent a screenshot of their VIP Pass via WhatsApp or photo gallery, upload it directly here.
            </p>
          </div>

          <label className="inline-block px-6 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-white bg-[#F04E36] hover:bg-[#d63f28] shadow-md shadow-[#F04E36]/30 cursor-pointer transition-all duration-200">
            <span>Select Ticket Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleQrFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 3: MANUAL CODE SEARCH                                */}
      {/* ========================================================= */}
      {activeMode === 'search' && !scanResult && (
        <form onSubmit={handleManualSearchSubmit} className="space-y-4 p-6 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] shadow-sm">
          <div>
            <h3 className="text-base font-bold text-[#2A2A2B]">Manual Ticket ID / UTR Search</h3>
            <p className="text-xs text-[#4A4A4A] mt-0.5">
              Enter the unique 6-digit Ticket ID (e.g. <code>MC-123456</code>) or banking UTR number.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#736B63] absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              placeholder="e.g. MC-89421A or 431098765432"
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] font-mono uppercase tracking-widest placeholder-[#736B63]"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !searchCode.trim()}
            className="w-full py-3 rounded-xl font-semibold text-xs tracking-wider uppercase text-white bg-[#F04E36] hover:bg-[#d63f28] shadow-md shadow-[#F04E36]/30 transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {isSearching ? 'Verifying Credentials...' : 'Search & Check In Guest'}
          </button>
        </form>
      )}

      {/* ========================================================= */}
      {/* SCANNER RESULT OVERLAYS & COLOR ALERTS                    */}
      {/* ========================================================= */}
      {scanResult && (
        <div className="mt-4 space-y-4 animate-in zoom-in-95 duration-150">
          {/* 🟢 GREEN OVERLAY: VALID TICKET */}
          {scanResult.status === 'valid' && (
            <div className="relative p-6 sm:p-8 rounded-3xl bg-[#EBE6DC] border-2 border-emerald-500 shadow-xl text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                  {scanResult.scannedAt} • Pass ID: {scanResult.ticket?.id}
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A2A2B] mt-2">
                  {scanResult.message}
                </h3>
              </div>

              {/* Attendee Details Card */}
              {scanResult.ticket && (
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 text-left space-y-2 text-xs shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-[#D8D2C5]">
                    <span className="text-[#736B63] font-mono">Attendee Name:</span>
                    <strong className="text-[#2A2A2B] text-sm font-semibold">
                      {scanResult.ticket.attendeeName}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[#D8D2C5]">
                    <span className="text-[#736B63] font-mono">Event:</span>
                    <strong className="text-[#F04E36] text-xs">
                      {scanResult.ticket.eventTitle}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[#D8D2C5]">
                    <span className="text-[#736B63] font-mono">Organization:</span>
                    <span className="text-[#2A2A2B]">
                      {scanResult.ticket.attendeeOrg}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-emerald-700 font-mono font-semibold">
                    <span>Turnstile Status:</span>
                    <span>✓ Admitted & Locked</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleScanNextGuest}
                className="w-full py-4 rounded-2xl font-bold text-sm tracking-wider uppercase text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Scan Next Ticket
              </button>
            </div>
          )}

          {/* 🔴 RED OVERLAY: INVALID OR ALREADY USED */}
          {scanResult.status === 'invalid' && (
            <div className="relative p-6 sm:p-8 rounded-3xl bg-[#EBE6DC] border-2 border-rose-500 shadow-xl text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-rose-100 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-600 shadow-md animate-pulse">
                <XCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                  Access Denied • {scanResult.scannedAt}
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2A2A2B] mt-2">
                  {scanResult.message}
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-rose-200 text-left text-xs space-y-2 shadow-sm">
                {scanResult.ticket?.isCheckedIn ? (
                  <>
                    <p className="text-rose-700 font-medium">
                      ⚠️ This ticket was already checked in at{' '}
                      <span className="font-mono text-[#2A2A2B] font-bold">
                        {scanResult.ticket.checkedInAt
                          ? new Date(scanResult.ticket.checkedInAt).toLocaleString()
                          : 'Earlier Today'}
                      </span>
                      . Re-entry with the same QR code is strictly prohibited.
                    </p>
                    <p className="text-[#4A4A4A]">
                      Original Guest: <strong className="text-[#2A2A2B]">{scanResult.ticket.attendeeName}</strong>
                    </p>
                  </>
                ) : (
                  <p className="text-[#4A4A4A]">
                    No matching active ticket found for this QR payload. The ticket may be forged or an invalid code.
                  </p>
                )}
              </div>

              <button
                onClick={handleScanNextGuest}
                className="w-full py-4 rounded-2xl font-bold text-sm tracking-wider uppercase text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.99] shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Scan Next Ticket
              </button>
            </div>
          )}

          {/* 🟡 YELLOW OVERLAY: UNVERIFIED / FLAGGED */}
          {scanResult.status === 'unverified' && (
            <div className="relative p-6 sm:p-8 rounded-3xl bg-[#EBE6DC] border-2 border-amber-500 shadow-xl text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-600 shadow-md">
                <AlertTriangle className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 font-bold">
                  Staff Verification Flag • {scanResult.scannedAt}
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2A2A2B] mt-2">
                  Tickets are not verified from the admin
                </h3>
              </div>

              {scanResult.ticket && (
                <div className="p-4 rounded-2xl bg-white border border-amber-200 text-left text-xs space-y-2 shadow-sm">
                  <p className="text-amber-800 font-medium">
                    This ticket has not yet been approved by the club administrator. Payment UTR: <code className="bg-amber-50 px-1 py-0.5 rounded border border-amber-200">{scanResult.ticket.utrNumber}</code>
                  </p>
                  <p className="text-[#4A4A4A]">
                    Guest Name: <strong className="text-[#2A2A2B]">{scanResult.ticket.attendeeName}</strong> ({scanResult.ticket.attendeePhone || 'No phone'})
                  </p>
                  <p className="text-[#736B63] text-[11px]">
                    Direct guest to the Help Desk or request Admin verification in the Admin CMS Queue.
                  </p>
                </div>
              )}

              <button
                onClick={handleScanNextGuest}
                className="w-full py-4 rounded-2xl font-bold text-sm tracking-wider uppercase text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.99] shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
              >
                Scan Next Ticket
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
