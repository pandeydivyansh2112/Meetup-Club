/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Crown,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Clock3,
  XCircle,
  Download,
  Share2,
  Sparkles,
  ShieldCheck,
  User,
  Building,
  QrCode,
  Printer,
} from 'lucide-react';
import { TicketItem } from '../types';

interface TicketPassCardProps {
  ticket: TicketItem;
  onRefresh?: () => void;
}

export const TicketPassCard: React.FC<TicketPassCardProps> = ({ ticket }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Status badge logic
  const renderStatusBadge = () => {
    if (ticket.isCheckedIn) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>CHECKED IN ({ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'USED'})</span>
        </div>
      );
    }

    switch (ticket.status) {
      case 'Verified':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>VERIFIED VIP PASS</span>
          </div>
        );
      case 'Pending':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Clock3 className="w-3.5 h-3.5 text-amber-600" />
            <span>PENDING VERIFICATION</span>
          </div>
        );
      case 'Rejected':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>PAYMENT REJECTED</span>
          </div>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    try {
      const svg = cardRef.current?.querySelector('svg');
      if (!svg) return;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 48;
        canvas.height = img.height + 48;
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 24, 24);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `MeetupClub_Pass_${ticket.id}_QR.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.warn('QR download fallback to print:', e);
      window.print();
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative rounded-3xl overflow-hidden bg-[#EBE6DC] border border-[#D8D2C5] shadow-lg transition-all duration-300 hover:shadow-xl"
    >
      {/* Top Header */}
      <div className="relative p-6 sm:p-7 bg-[#F4F1EA] border-b border-[#D8D2C5]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F04E36] flex items-center justify-center shadow-sm shrink-0 mt-0.5">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[#F04E36] block font-bold">
                MEETUP CLUB • OFFICIAL DIGITAL PASS
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2A2A2B] tracking-wide mt-0.5">
                {ticket.eventTitle}
              </h3>
              {/* Event Date & Venue prominently displayed */}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-[#4A4A4A] font-medium flex-wrap">
                {ticket.eventDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#F04E36]" />
                    <span>{ticket.eventDate} {ticket.eventTime ? `• ${ticket.eventTime}` : ''}</span>
                  </span>
                )}
                {ticket.eventVenue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#F04E36]" />
                    <span className="truncate max-w-xs">{ticket.eventVenue}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
            {renderStatusBadge()}
            <span className="text-xs font-mono text-[#736B63] block mt-1">
              Ref: <strong className="text-[#2A2A2B] font-bold">{ticket.id}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Body Content */}
      <div className="p-6 sm:p-7 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left Column: Attendee & Event Metadata */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#736B63] uppercase font-mono text-[10px] block">Guest Name</span>
              <span className="text-[#2A2A2B] font-semibold text-sm flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-[#F04E36]" />
                {ticket.attendeeName} {ticket.attendeeAge ? `(${ticket.attendeeAge}y)` : ''}
              </span>
            </div>

            <div>
              <span className="text-[#736B63] uppercase font-mono text-[10px] block">Affiliation</span>
              <span className="text-[#2A2A2B] font-medium text-sm flex items-center gap-1.5 mt-0.5 truncate">
                <Building className="w-3.5 h-3.5 text-[#F04E36] shrink-0" />
                {ticket.attendeeOrg || 'Private Patron'}
              </span>
            </div>

            <div>
              <span className="text-[#736B63] uppercase font-mono text-[10px] block">Registered Email</span>
              <span className="text-[#4A4A4A] font-mono text-xs mt-0.5 truncate block">
                {ticket.attendeeEmail}
              </span>
            </div>

            <div>
              <span className="text-[#736B63] uppercase font-mono text-[10px] block">Payment UTR ID</span>
              <span className="text-[#F04E36] font-mono text-xs font-bold mt-0.5 block truncate">
                {ticket.utrNumber}
              </span>
            </div>
          </div>

          {/* Verification Notices */}
          {ticket.status === 'Pending' && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
              <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5 text-amber-600" />
                Verification In Progress (10–20 Mins):
              </span>
              <p>
                Your payment receipt and UTR reference are being matched against treasury bank statements. Turnstile gate access activates immediately upon verification.
              </p>
            </div>
          )}

          {ticket.status === 'Rejected' && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
              <span className="font-semibold text-rose-950 block mb-0.5">Verification Notice:</span>
              {ticket.adminNotes || 'Payment transaction could not be confirmed. Please reach out to our verification helpline.'}
            </div>
          )}

          {ticket.status === 'Verified' && !ticket.isCheckedIn && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pass verified and ready for gate entrance. Present this QR code directly to the gate scanner.</span>
            </div>
          )}
        </div>

        {/* Right Column: High-Res QR Code */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] shadow-sm">
          <div className="relative p-3 rounded-xl bg-white border border-[#D8D2C5] shadow-sm">
            <QRCodeSVG
              value={ticket.qrCodeData}
              size={140}
              level="H"
              includeMargin={false}
              fgColor="#2A2A2B"
              bgColor="#FFFFFF"
            />
          </div>
          <span className="text-[11px] font-mono text-[#2A2A2B] font-bold mt-2 tracking-widest uppercase">
            {ticket.id}
          </span>
          <span className="text-[10px] text-[#736B63] mt-0.5 font-mono">
            {ticket.isCheckedIn ? 'Checked-In at Gate' : 'Scannable at Turnstile'}
          </span>
        </div>
      </div>

      {/* Perforated Divider */}
      <div className="relative flex items-center justify-between px-2">
        <div className="w-5 h-5 rounded-full bg-[#F4F1EA] -ml-4 border-r border-[#D8D2C5]" />
        <div className="w-full border-t border-dashed border-[#D8D2C5]" />
        <div className="w-5 h-5 rounded-full bg-[#F4F1EA] -mr-4 border-l border-[#D8D2C5]" />
      </div>

      {/* Ticket Footer Bar with "Download Ticket / Save QR" and Print Actions */}
      <div className="p-4 sm:p-5 bg-[#F4F1EA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4A4A4A]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#F04E36]" />
          <span>Meetup Club Non-Transferable Digital Pass</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadQR}
            className="px-3.5 py-1.5 rounded-lg bg-[#F04E36] hover:bg-[#d63f28] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Download QR code image for gate access"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Ticket / Save QR</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#D8D2C5] hover:border-[#F04E36] text-[#2A2A2B] hover:text-[#F04E36] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Print or save PDF pass"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
};
