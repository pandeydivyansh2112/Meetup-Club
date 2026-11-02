/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { TicketItem, UserSession } from '../types';
import { subscribeTickets } from '../services/dbService';
import { TicketPassCard } from './TicketPassCard';

interface AttendeeDashboardProps {
  userSession: UserSession | null;
  onNavigateToEvents: () => void;
  onOpenAuth: () => void;
}

export const AttendeeDashboard: React.FC<AttendeeDashboardProps> = ({
  userSession,
  onNavigateToEvents,
  onOpenAuth,
}) => {
  const [allTickets, setAllTickets] = useState<TicketItem[]>([]);
  const [searchEmail, setSearchEmail] = useState(userSession?.email || '');
  const [searchTicketId, setSearchTicketId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Verified' | 'Pending' | 'Rejected'>('All');

  useEffect(() => {
    const unsub = subscribeTickets((list) => {
      setAllTickets(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (userSession?.email) {
      setSearchEmail(userSession.email);
    }
  }, [userSession]);

  // Filter tickets matching user email, phone, UID, or explicit search
  const myTickets = allTickets.filter((t) => {
    // 1. Explicit Ticket ID or UTR search takes priority
    if (searchTicketId.trim()) {
      const q = searchTicketId.trim().toLowerCase();
      return t.id.toLowerCase().includes(q) || t.utrNumber.toLowerCase().includes(q);
    }

    // 2. Logged-in session matching
    if (userSession) {
      const sessionEmail = (userSession.email || '').toLowerCase().trim();
      const ticketEmail = (t.attendeeEmail || '').toLowerCase().trim();
      const sessionPhone = (userSession.phone || '').replace(/[\s\-\(\)\.]/g, '');
      const ticketPhone = (t.attendeePhone || '').replace(/[\s\-\(\)\.]/g, '');

      const isMatch =
        (sessionEmail && ticketEmail === sessionEmail) ||
        (userSession.uid && t.attendeeId === userSession.uid) ||
        (sessionPhone && ticketPhone && sessionPhone === ticketPhone);

      if (!isMatch && searchEmail.trim()) {
        return ticketEmail === searchEmail.trim().toLowerCase();
      }
      return isMatch;
    }

    // 3. Guest lookup by email
    if (searchEmail.trim()) {
      return (t.attendeeEmail || '').toLowerCase().trim() === searchEmail.trim().toLowerCase();
    }

    return false;
  }).filter((t) => {
    if (statusFilter === 'All') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#2A2A2B]">
      {/* Header Profile Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#EBE6DC] border border-[#D8D2C5] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F04E36] flex items-center justify-center text-white shadow-md shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-wide text-[#2A2A2B]">
                {userSession ? `Welcome, ${userSession.displayName || 'Patron'}` : 'My Attendee Panel'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F4F1EA] text-[#F04E36] border border-[#D8D2C5] uppercase">
                {userSession ? 'Registered Member' : 'Guest Vault'}
              </span>
            </div>
            <p className="text-xs text-[#4A4A4A] mt-1">
              {userSession
                ? `Account: ${userSession.email} ${userSession.phone ? `• ${userSession.phone}` : ''} • Access your verified QR tickets and track manual UPI approvals.`
                : 'Sign in to access your persistent digital tickets or lookup your reservation by email.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {!userSession ? (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#F04E36] hover:bg-[#d63f28] shadow-md shadow-[#F04E36]/30 transition-all cursor-pointer"
            >
              Sign In to Your Account
            </button>
          ) : (
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#F4F1EA] border border-[#D8D2C5] text-[#2A2A2B]">
              Active Patron Session
            </span>
          )}

          <button
            onClick={onNavigateToEvents}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2A2A2B] bg-white border border-[#D8D2C5] hover:border-[#F04E36] hover:text-[#F04E36] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Browse More Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ticket Lookup Search & Status Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto scrollbar-none">
          {(['All', 'Verified', 'Pending', 'Rejected'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer text-xs ${
                statusFilter === filter
                  ? 'bg-[#F04E36] text-white shadow-xs'
                  : 'bg-white text-[#4A4A4A] border border-[#D8D2C5] hover:text-[#2A2A2B]'
              }`}
            >
              {filter === 'All' ? 'All Passes' : filter}
            </button>
          ))}
        </div>

        {/* Search Inputs */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          {!userSession && (
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Registered email..."
              className="px-3 py-1.5 rounded-lg bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] text-xs w-full sm:w-56 placeholder-[#736B63]"
            />
          )}
          <input
            type="text"
            value={searchTicketId}
            onChange={(e) => setSearchTicketId(e.target.value)}
            placeholder="Search Ticket ID or UTR..."
            className="px-3 py-1.5 rounded-lg bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] text-xs w-full sm:w-52 font-mono placeholder-[#736B63]"
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-[#2A2A2B] flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#F04E36]" />
            <span>My Event Passes ({myTickets.length})</span>
          </h2>
          <span className="text-xs text-[#736B63] font-mono">
            Auto-refreshes in real time via Firestore
          </span>
        </div>

        {myTickets.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-[#EBE6DC] border border-[#D8D2C5] shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F4F1EA] border border-[#D8D2C5] flex items-center justify-center mx-auto text-[#736B63]">
              <Ticket className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2A2A2B]">No Tickets Found</h3>
              <p className="text-xs text-[#4A4A4A] mt-1 max-w-md mx-auto">
                No active or pending ticket registrations match this email or search ID. If you just submitted a ticket, enter your registration email above or explore our calendar.
              </p>
            </div>
            <button
              onClick={onNavigateToEvents}
              className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#F04E36] hover:bg-[#d63f28] shadow-md shadow-[#F04E36]/30 transition-all cursor-pointer"
            >
              Explore Upcoming Galas
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {myTickets.map((ticket) => (
              <TicketPassCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
