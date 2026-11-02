/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Calendar,
  Layers,
  FileCheck2,
  Mail,
  Trash2,
  Edit3,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  RefreshCw,
  QrCode,
  Phone,
  Image as GalleryIcon,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  Users,
  UserCheck,
  Search,
  Ticket,
  Clock,
  Home,
  Info,
  Share2,
  Sliders,
  DollarSign,
  BarChart3,
  Percent,
  Upload,
} from 'lucide-react';
import {
  EventItem,
  TicketItem,
  CMSContentData,
  GalleryItem,
  PortfolioItem,
  InquiryItem,
  GateStaffItem,
  AttendeeAccount,
} from '../types';
import {
  subscribeEvents,
  subscribeTickets,
  subscribeGallery,
  subscribePortfolio,
  subscribeInquiries,
  subscribeGateStaff,
  subscribeAttendees,
  deleteAttendeeAccount,
  createGateStaff,
  deleteGateStaff,
  createEvent,
  updateEvent,
  deleteEvent,
  verifyTicket,
  rejectTicket,
  deleteTicket,
  saveCMSContent,
  createGalleryItem,
  deleteGalleryItem,
  createPortfolioItem,
  deletePortfolioItem,
  updateInquiryStatus,
  deleteInquiry,
  seedInitialShowcaseData,
  purgeAllData,
} from '../services/dbService';

interface AdminPanelProps {
  cmsContent: CMSContentData;
  onUpdateCMS: (updated: CMSContentData) => void;
  onOpenGateScanner?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  cmsContent,
  onUpdateCMS,
  onOpenGateScanner,
}) => {
  // Primary Tabs (Including Gate Staff Management & Members Directory)
  const [activePrimaryTab, setActivePrimaryTab] = useState<
    'analytics' | 'tickets' | 'events' | 'members' | 'staff' | 'cms' | 'inquiries'
  >('analytics');

  // Members Directory state
  const [membersList, setMembersList] = useState<AttendeeAccount[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<AttendeeAccount | null>(null);

  // CMS Modular Sub-Tabs (Including NEW Website Logo Manager)
  const [cmsSubTab, setCmsSubTab] = useState<
    'logo' | 'home' | 'events' | 'portfolio' | 'gallery' | 'about' | 'contact' | 'social'
  >('logo');

  // Subscriptions data
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [gateStaffList, setGateStaffList] = useState<GateStaffItem[]>([]);

  // Gate Staff Form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffSuccessNotice, setStaffSuccessNotice] = useState('');
  const [staffErrorNotice, setStaffErrorNotice] = useState('');

  // Modals & previews
  const [receiptModalUrl, setReceiptModalUrl] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    type: 'event' | 'ticket' | 'gallery' | 'portfolio' | 'inquiry' | 'staff' | 'member';
    id: string;
    label: string;
  } | null>(null);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // Event Form Modal
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventFormData, setEventFormData] = useState<Omit<EventItem, 'id'>>({
    title: '',
    description: '',
    date: '',
    time: '08:00 PM IST',
    venue: '',
    ticketPrice: 9999,
    capacity: 100,
    registeredCount: 0,
    coverImageUrl: '',
    category: 'Gala',
  });

  // CMS Form State
  const [cmsFormData, setCmsFormData] = useState<CMSContentData>(cmsContent);
  const [cmsSaveSuccess, setCmsSaveSuccess] = useState(false);

  // Gallery item form modal
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryFormData, setGalleryFormData] = useState<Omit<GalleryItem, 'id'>>({
    title: '',
    description: '',
    imageUrl: '',
    category: 'Gala',
    eventDate: 'Nov 2026',
  });

  // Portfolio item form modal
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [portfolioFormData, setPortfolioFormData] = useState<Omit<PortfolioItem, 'id'>>({
    title: '',
    clientOrEvent: '',
    description: '',
    coverImageUrl: '',
    metrics: '',
  });

  // Seeding feedback
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState('');

  // Ticket filter
  const [ticketFilter, setTicketFilter] = useState<'All' | 'Pending' | 'Verified' | 'Rejected'>('All');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Subscribe to all collections
  useEffect(() => {
    const unsubTickets = subscribeTickets(setTickets);
    const unsubEvents = subscribeEvents(setEvents);
    const unsubGallery = subscribeGallery(setGallery);
    const unsubPortfolio = subscribePortfolio(setPortfolio);
    const unsubInquiries = subscribeInquiries(setInquiries);
    const unsubStaff = subscribeGateStaff(setGateStaffList);
    const unsubMembers = subscribeAttendees(setMembersList);

    return () => {
      unsubTickets();
      unsubEvents();
      unsubGallery();
      unsubPortfolio();
      unsubInquiries();
      unsubStaff();
      unsubMembers();
    };
  }, []);

  useEffect(() => {
    setCmsFormData(cmsContent);
  }, [cmsContent]);

  // Seed showcase handler
  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedNotice('');
    try {
      const res = await seedInitialShowcaseData();
      setSeedNotice(`Showcase seeded: ${res.events} events, ${res.gallery} gallery photos, and ${res.portfolio} portfolio items.`);
      setTimeout(() => setSeedNotice(''), 4000);
    } catch (err: any) {
      setSeedNotice('Failed to seed: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Delete execution with confirmation
  const executeDelete = async () => {
    if (!deleteConfirmItem) return;
    const { type, id } = deleteConfirmItem;
    try {
      if (type === 'event') await deleteEvent(id);
      if (type === 'ticket') await deleteTicket(id);
      if (type === 'gallery') await deleteGalleryItem(id);
      if (type === 'portfolio') await deletePortfolioItem(id);
      if (type === 'inquiry') await deleteInquiry(id);
      if (type === 'staff') await deleteGateStaff(id);
      if (type === 'member') await deleteAttendeeAccount(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirmItem(null);
    }
  };

  // Full Purge to Zero-State
  const handleExecutePurge = async () => {
    setIsPurging(true);
    try {
      await purgeAllData();
      setSeedNotice('All production database records successfully purged to clean zero-state.');
      setTimeout(() => setSeedNotice(''), 4000);
    } catch (err: any) {
      console.error('Purge error:', err);
    } finally {
      setIsPurging(false);
      setPurgeModalOpen(false);
    }
  };

  // Create New Gate Staff handler
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword.trim()) {
      setStaffErrorNotice('Please provide Officer Name, Username/Email, and Password.');
      return;
    }
    setStaffSubmitting(true);
    setStaffErrorNotice('');
    setStaffSuccessNotice('');
    try {
      await createGateStaff({
        name: newStaffName.trim(),
        email: newStaffEmail.trim(),
        password: newStaffPassword.trim(),
      });
      setStaffSuccessNotice(`Gate Staff account created for ${newStaffName}!`);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setTimeout(() => setStaffSuccessNotice(''), 4000);
    } catch (err: any) {
      console.error('Error creating gate staff:', err);
      setStaffErrorNotice(err.message || 'Failed to create Gate Staff account.');
    } finally {
      setStaffSubmitting(false);
    }
  };

  // Event submit
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.title || !eventFormData.date || !eventFormData.venue) return;
    try {
      if (editingEventId) {
        await updateEvent(editingEventId, eventFormData);
      } else {
        await createEvent(eventFormData);
      }
      setEventFormOpen(false);
      setEditingEventId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // CMS submit
  const handleSaveCMS = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      await saveCMSContent(cmsFormData);
      onUpdateCMS(cmsFormData);
      setCmsSaveSuccess(true);
      setTimeout(() => setCmsSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Logo file upload handler
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCmsFormData((prev) => ({ ...prev, logoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Gallery submit
  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryFormData.title || !galleryFormData.imageUrl) return;
    await createGalleryItem(galleryFormData);
    setGalleryModalOpen(false);
    setGalleryFormData({
      title: '',
      description: '',
      imageUrl: '',
      category: 'Gala',
      eventDate: 'Nov 2026',
    });
  };

  // Portfolio submit
  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioFormData.title || !portfolioFormData.coverImageUrl) return;
    await createPortfolioItem(portfolioFormData);
    setPortfolioModalOpen(false);
    setPortfolioFormData({
      title: '',
      clientOrEvent: '',
      description: '',
      coverImageUrl: '',
      metrics: '',
    });
  };

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  // ==========================================
  // REVENUE & ANALYTICS CALCULATIONS
  // ==========================================
  const verifiedTickets = tickets.filter((t) => t.status === 'Verified');
  const pendingTickets = tickets.filter((t) => t.status === 'Pending');
  const rejectedTickets = tickets.filter((t) => t.status === 'Rejected');

  // Total Revenue Generated (₹) from verified tickets
  const totalVerifiedRevenue = verifiedTickets.reduce(
    (sum, t) => sum + (t.amountPaid || 0),
    0
  );

  // Pending Revenue (₹) awaiting manual verification
  const totalPendingRevenue = pendingTickets.reduce(
    (sum, t) => sum + (t.amountPaid || 0),
    0
  );

  // Capacity calculations across published events
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
  const totalTicketsSold = verifiedTickets.length;
  const totalCapacityRemaining = Math.max(0, totalCapacity - (totalTicketsSold + pendingTickets.length));

  // Event-wise revenue breakdown
  const eventRevenueBreakdown = events.map((evt) => {
    const evtVerified = verifiedTickets.filter((t) => t.eventId === evt.id);
    const evtPending = pendingTickets.filter((t) => t.eventId === evt.id);
    const verifiedRev = evtVerified.reduce((sum, t) => sum + (t.amountPaid || evt.ticketPrice || 0), 0);
    const pendingRev = evtPending.reduce((sum, t) => sum + (t.amountPaid || evt.ticketPrice || 0), 0);
    const soldCount = evtVerified.length + evtPending.length;
    const capacity = evt.capacity || 100;
    const remaining = Math.max(0, capacity - soldCount);
    const occupancyPercent = capacity > 0 ? Math.min(100, Math.round((soldCount / capacity) * 100)) : 0;

    return {
      event: evt,
      verifiedCount: evtVerified.length,
      pendingCount: evtPending.length,
      verifiedRev,
      pendingRev,
      soldCount,
      remaining,
      occupancyPercent,
    };
  });

  const filteredTickets = ticketFilter === 'All'
    ? tickets
    : tickets.filter((t) => t.status === ticketFilter);

  const pendingTicketsCount = pendingTickets.length;
  const unreadInquiriesCount = inquiries.filter((i) => i.status === 'unread').length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#2A2A2B]">
      {/* Top Admin Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F04E36] to-[#F04E36] p-[1.5px] shadow-md">
            <div className="w-full h-full bg-[#F4F1EA] rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-[#F04E36]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-wide">
                Meetup Club Admin Suite
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F04E36]/20 text-[#F04E36] border border-[#D8D2C5] uppercase">
                Analytics & CMS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live revenue tracking, modular CMS editor, event publisher, and manual UPI verification queue.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {events.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#F04E36] hover:bg-[#d63f28]  shadow-md shadow-[#F04E36]/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSeeding ? 'Seeding...' : 'Seed Initial Showcase'}</span>
            </button>
          )}

          <button
            onClick={() => setPurgeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Purge all database records and restore clean production zero-state"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge to Zero-State</span>
          </button>

          {onOpenGateScanner && (
            <button
              onClick={onOpenGateScanner}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#2A2A2B] bg-white border border-[#D8D2C5] hover:border-[#F04E36] hover:text-[#F04E36] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5 text-[#F04E36]" />
              <span>Gate Scanner</span>
            </button>
          )}
        </div>
      </div>

      {seedNotice && (
        <div className="p-3.5 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] text-[#2A2A2B] text-xs flex items-center justify-between">
          <span>{seedNotice}</span>
          <button onClick={() => setSeedNotice('')} className="text-[#F04E36] font-bold ml-2">✕</button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#D8D2C5]">
        <button
          onClick={() => setActivePrimaryTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activePrimaryTab === 'analytics'
              ? 'bg-[#F04E36] hover:bg-[#d63f28] text-white font-bold shadow-md shadow-[#F04E36]/25'
              : 'text-[#736B63] hover:text-[#2A2A2B] hover:bg-[#EBE6DC]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Revenue & Analytics</span>
        </button>

        <button
          onClick={() => setActivePrimaryTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activePrimaryTab === 'tickets'
              ? 'bg-[#F04E36] hover:bg-[#d63f28] text-white font-bold shadow-md shadow-[#F04E36]/25'
              : 'text-[#736B63] hover:text-[#2A2A2B] hover:bg-[#EBE6DC]'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Ticket Verification Queue</span>
          {pendingTicketsCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activePrimaryTab === 'tickets' ? 'bg-[#F4F1EA] text-[#F04E36]' : 'bg-[#F04E36] text-white'
            }`}>
              {pendingTicketsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActivePrimaryTab('events')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activePrimaryTab === 'events'
              ? 'bg-[#F04E36] hover:bg-[#d63f28] text-white font-bold shadow-md shadow-[#F04E36]/25'
              : 'text-[#736B63] hover:text-[#2A2A2B] hover:bg-[#EBE6DC]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Event Publisher</span>
          <span className="text-[10px] font-mono opacity-80">({events.length})</span>
        </button>

        <button
          onClick={() => setActivePrimaryTab('members')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activePrimaryTab === 'members'
              ? 'bg-[#F04E36] hover:bg-[#d63f28] text-white font-bold shadow-md shadow-[#F04E36]/25'
              : 'text-[#736B63] hover:text-[#2A2A2B] hover:bg-[#EBE6DC]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Members Directory</span>
          <span className="text-[10px] font-mono opacity-80">({membersList.length})</span>
        </button>

        <button
          onClick={() => setActivePrimaryTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activePrimaryTab === 'staff'
              ? 'bg-[#F04E36] hover:bg-[#d63f28] text-white font-bold shadow-md shadow-[#F04E36]/25'
              : 'text-[#736B63] hover:text-[#2A2A2B] hover:bg-[#EBE6DC]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gate Staff Management</span>
          <span className="text-[10px] font-mono opacity-80">({gateStaffList.length})</span>
        </button>

        <button
          onClick={() => setActivePrimaryTab('cms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activePrimaryTab === 'cms'
              ? 'bg-[#F04E36] hover:bg-[#d63f28] text-white font-bold shadow-md shadow-[#F04E36]/25'
              : 'text-[#736B63] hover:text-[#2A2A2B] hover:bg-[#EBE6DC]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Modular CMS Manager</span>
        </button>

        <button
          onClick={() => setActivePrimaryTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activePrimaryTab === 'inquiries'
              ? 'bg-[#F04E36] hover:bg-[#d63f28] text-white font-bold shadow-md shadow-[#F04E36]/25'
              : 'text-[#736B63] hover:text-[#2A2A2B] hover:bg-[#EBE6DC]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Inquiries</span>
          {unreadInquiriesCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activePrimaryTab === 'inquiries' ? 'bg-[#F4F1EA] text-[#F04E36]' : 'bg-[#F04E36] text-white'
            }`}>
              {unreadInquiriesCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REVENUE & ANALYTICS DASHBOARD                                      */}
      {/* ========================================================================= */}
      {activePrimaryTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top Revenue & Volume Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue Card */}
            <div className="p-5 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-[#F04E36]">Total Revenue Generated</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2A2A2B] tracking-wide">
                ₹{totalVerifiedRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" />
                <span>Live from {verifiedTickets.length} verified ticket{verifiedTickets.length === 1 ? '' : 's'}</span>
              </div>
            </div>

            {/* Pending Verification Revenue */}
            <div className="p-5 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-[#F04E36]">Pending Approvals</span>
                <div className="w-8 h-8 rounded-lg bg-[#F04E36]/20 text-[#F04E36] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#F04E36] tracking-wide">
                ₹{totalPendingRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-[#F04E36]/80 mt-1 flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3 h-3 text-[#F04E36]" />
                <span>{pendingTickets.length} transaction{pendingTickets.length === 1 ? '' : 's'} awaiting review</span>
              </div>
            </div>

            {/* Tickets Sold vs Capacity */}
            <div className="p-5 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-[#F04E36]">Total Tickets Sold</span>
                <div className="w-8 h-8 rounded-lg bg-[#F04E36]/10 text-[#F04E36] flex items-center justify-center">
                  <Ticket className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2A2A2B] tracking-wide">
                {totalTicketsSold} <span className="text-sm font-sans text-slate-400 font-normal">/ {totalCapacity} cap</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <span>⚡ {totalCapacityRemaining} seats left across events</span>
              </div>
            </div>

            {/* Published Events & Inquiries */}
            <div className="p-5 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-[#F04E36]">Active Published Events</span>
                <div className="w-8 h-8 rounded-lg bg-[#F04E36]/20 text-[#F04E36] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2A2A2B] tracking-wide">
                {events.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <span>📬 {unreadInquiriesCount} unread attendee inquiries</span>
              </div>
            </div>
          </div>

          {/* Event-Wise Sales & Revenue Breakdown Table */}
          <div className="p-6 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#2A2A2B] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#F04E36]" />
                  <span>Event-Wise Revenue Breakdown</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Per-event sales occupancy, verified earnings, and capacity utilization.
                </p>
              </div>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#D8D2C5] rounded-xl bg-[#F4F1EA] space-y-3">
                <Calendar className="w-10 h-10 text-[#F04E36]/40 mx-auto" />
                <h3 className="text-base font-semibold text-[#2A2A2B]">No Published Events Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Create your first executive gala or click Seed Initial Showcase to populate sample events and ticket inventory.
                </p>
                <button
                  onClick={() => setActivePrimaryTab('events')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#F04E36] hover:bg-[#d63f28] shadow-md"
                >
                  Go to Event Publisher
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#D8D2C5] text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Event Title</th>
                      <th className="py-3 px-4">Date & Venue</th>
                      <th className="py-3 px-4 text-center">Occupancy</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4 text-right">Verified Revenue</th>
                      <th className="py-3 px-4 text-right">Pending Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8D2C5] bg-white/40">
                    {eventRevenueBreakdown.map((row) => (
                      <tr key={row.event.id} className="hover:bg-black/5 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-[#2A2A2B]">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#F04E36]" />
                            <span>{row.event.title}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div>{row.event.date}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{row.event.venue}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-bold text-white">
                              {row.soldCount} / {row.event.capacity}
                            </span>
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-[#F04E36] rounded-full"
                                style={{ width: `${row.occupancyPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5">{row.occupancyPercent}% filled</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[#F04E36]">
                          ₹{row.event.ticketPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                          ₹{row.verifiedRev.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[#F04E36]">
                          ₹{row.pendingRev.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TICKET VERIFICATION QUEUE                                          */}
      {/* ========================================================================= */}
      {activePrimaryTab === 'tickets' && (
        <div className="p-6 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#2A2A2B] flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#F04E36]" />
                <span>Manual UPI Ticket Verification Queue</span>
              </h2>
              <p className="text-xs text-slate-400">
                Inspect uploaded payment receipts, verify UTR banking reference, and approve tickets for gate entry.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F4F1EA] border border-[#D8D2C5] text-xs">
              {(['All', 'Pending', 'Verified', 'Rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTicketFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    ticketFilter === tab
                      ? 'bg-[#F04E36] hover:bg-[#d63f28] text-white font-bold'
                      : 'text-[#736B63] hover:text-[#2A2A2B]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#D8D2C5] rounded-xl bg-[#F4F1EA] space-y-2">
              <Ticket className="w-10 h-10 text-[#F04E36]/40 mx-auto" />
              <h3 className="text-base font-semibold text-[#2A2A2B]">No Tickets Found</h3>
              <p className="text-xs text-slate-400">
                {ticketFilter === 'All'
                  ? 'No tickets registered in system yet.'
                  : `No tickets with status "${ticketFilter}".`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D8D2C5] text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Ticket ID & Event</th>
                    <th className="py-3 px-3">Attendee</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">UTR Reference</th>
                    <th className="py-3 px-3">Receipt</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8D2C5] bg-white/40">
                  {filteredTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-black/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-[#F04E36]">{t.id}</div>
                        <div className="text-[11px] text-[#4A4A4A] truncate max-w-[160px]">{t.eventTitle}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#2A2A2B]">{t.attendeeName}</div>
                        <div className="text-[10px] text-slate-400">{t.attendeeEmail}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#F04E36]">
                        ₹{(t.amountPaid || 9999).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <button
                          onClick={() => handleCopyUtr(t.utrNumber)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-[#F4F1EA] border border-[#D8D2C5] text-slate-200 hover:border-[#F04E36]"
                          title="Click to copy UTR"
                        >
                          <span className="truncate max-w-[100px]">{t.utrNumber || 'N/A'}</span>
                          {copiedUtr === t.utrNumber ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        {t.receiptUrl ? (
                          <button
                            onClick={() => setReceiptModalUrl(t.receiptUrl)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-[#F04E36] bg-[#EBE6DC] border border-[#D8D2C5] hover:border-[#F04E36] flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            t.status === 'Verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : t.status === 'Pending'
                              ? 'bg-[#EBE6DC] text-[#F04E36] border-[#D8D2C5]'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => verifyTicket(t.id, 'Approved via Admin Panel')}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                                title="Approve & Issue QR"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => rejectTicket(t.id, 'Payment verification failed')}
                                className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() =>
                              setDeleteConfirmItem({
                                type: 'ticket',
                                id: t.id,
                                label: `Ticket ${t.id} (${t.attendeeName})`,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EVENT PUBLISHER                                                    */}
      {/* ========================================================================= */}
      {activePrimaryTab === 'events' && (
        <div className="p-6 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#2A2A2B] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#F04E36]" />
                <span>Executive Event Publisher</span>
              </h2>
              <p className="text-xs text-slate-400">
                Publish, edit, and configure VIP galas with live seat quotas and pricing.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingEventId(null);
                setEventFormData({
                  title: '',
                  description: '',
                  date: '',
                  time: '08:00 PM IST',
                  venue: '',
                  ticketPrice: 9999,
                  capacity: 100,
                  registeredCount: 0,
                  coverImageUrl: '',
                  category: 'Gala',
                });
                setEventFormOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#F04E36] hover:bg-[#d63f28]  shadow-[0_0_15px_rgba(168,85,247,0.35)] flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#D8D2C5] rounded-xl bg-[#F4F1EA] space-y-3">
              <Calendar className="w-10 h-10 text-[#F04E36]/40 mx-auto" />
              <h3 className="text-base font-semibold text-[#2A2A2B]">No Events Published</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Start by creating your first luxury gathering or click Seed Initial Showcase above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-xl overflow-hidden bg-[#F4F1EA] border border-[#D8D2C5] hover:border-[#D8D2C5] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-40 relative overflow-hidden bg-slate-900">
                      <img
                        src={evt.coverImageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'}
                        alt={evt.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#F4F1EA] text-[#F04E36] border border-[#D8D2C5]">
                        {evt.category}
                      </div>
                      <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#F4F1EA] text-white">
                        ₹{evt.ticketPrice.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-serif font-bold text-[#2A2A2B] line-clamp-1">{evt.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{evt.description}</p>

                      <div className="pt-2 text-[11px] text-[#4A4A4A] space-y-1 font-mono">
                        <div>📅 {evt.date} • {evt.time}</div>
                        <div className="truncate">📍 {evt.venue}</div>
                        <div>👥 Capacity: {evt.capacity} seats</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between border-t border-[#D8D2C5] mt-3">
                    <span className="text-[10px] font-mono text-slate-400">ID: {evt.id.slice(0, 8)}...</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingEventId(evt.id);
                          setEventFormData({
                            title: evt.title,
                            description: evt.description,
                            date: evt.date,
                            time: evt.time,
                            venue: evt.venue,
                            ticketPrice: evt.ticketPrice,
                            capacity: evt.capacity,
                            registeredCount: evt.registeredCount,
                            coverImageUrl: evt.coverImageUrl,
                            category: evt.category,
                          });
                          setEventFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#EBE6DC]"
                        title="Edit Event"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirmItem({
                            type: 'event',
                            id: evt.id,
                            label: `Event "${evt.title}"`,
                          })
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MODULAR CMS CONTENT MANAGER                                        */}
      {/* ========================================================================= */}
      {activePrimaryTab === 'cms' && (
        <div className="p-6 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#2A2A2B] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#F04E36]" />
                <span>Modular CMS Content Manager</span>
              </h2>
              <p className="text-xs text-slate-400">
                Update logo, hero headlines, portfolio case studies, gallery photos, and payment UPI settings.
              </p>
            </div>

            {cmsSaveSuccess && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 self-start sm:self-auto bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" /> Published Live to Firestore
              </span>
            )}
          </div>

          {/* 8 Modular Sub-Tabs (Includes Website Logo Manager) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#D8D2C5] text-xs">
            {[
              { id: 'logo', label: '1. Website Logo', icon: Sparkles },
              { id: 'home', label: '2. Home Section', icon: Home },
              { id: 'events', label: '3. Events Section', icon: Calendar },
              { id: 'portfolio', label: '4. Portfolio Section', icon: Briefcase },
              { id: 'gallery', label: '5. Gallery Section', icon: GalleryIcon },
              { id: 'about', label: '6. About Section', icon: Info },
              { id: 'contact', label: '7. Contact Section', icon: Mail },
              { id: 'social', label: '8. Social Media Links', icon: Share2 },
            ].map((sub) => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  onClick={() => setCmsSubTab(sub.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap font-medium transition-colors ${
                    cmsSubTab === sub.id
                      ? 'bg-[#F04E36] hover:bg-[#d63f28] text-white font-bold shadow-md shadow-[#F04E36]/25'
                      : 'text-[#736B63] hover:text-[#2A2A2B] bg-[#F4F1EA]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUB-TAB 1: WEBSITE LOGO MANAGER */}
          {cmsSubTab === 'logo' && (
            <form onSubmit={handleSaveCMS} className="p-6 rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] space-y-6">
              <div>
                <h3 className="text-base font-serif font-bold text-[#F04E36]">Website Logo Manager</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize the brand identity displayed across the top header navbar and the footer.
                </p>
              </div>

              {/* Logo Preview Box */}
              <div className="p-6 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#F04E36] block">
                    Current Active Branding Preview
                  </span>
                  <div className="h-12 flex items-center">
                    {cmsFormData.logoUrl && cmsFormData.logoUrl.trim() ? (
                      <img
                        src={cmsFormData.logoUrl.trim()}
                        alt="Brand Logo Preview"
                        className="max-h-10 max-w-[200px] object-contain rounded"
                      />
                    ) : (
                      <div className="text-xl font-serif font-bold tracking-tight text-white flex items-center gap-2">
                        <span>Meetup Club</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F04E36]/20 text-[#F04E36] border border-[#D8D2C5]">Default Text Brand</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {cmsFormData.logoUrl ? 'Custom image logo is active' : 'Stylized typography is currently active'}
                  </p>
                </div>

                {cmsFormData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setCmsFormData({ ...cmsFormData, logoUrl: '' })}
                    className="px-3.5 py-1.5 rounded-xl text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/50 self-start sm:self-auto"
                  >
                    Reset to Text Brand
                  </button>
                )}
              </div>

              {/* URL Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#2A2A2B]">
                  Logo Image URL (PNG, SVG, or WebP)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/assets/logo.png"
                  value={cmsFormData.logoUrl || ''}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, logoUrl: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
                <p className="text-[10px] text-slate-400">Direct image link hosted on CDN, Google Drive, or Imgur.</p>
              </div>

              {/* File Upload Option */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-[#2A2A2B]">
                  Or Upload Logo File from Device
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2A2A2B] bg-[#EBE6DC] border border-[#D8D2C5] hover:border-[#F04E36] cursor-pointer flex items-center gap-2 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Logo File...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">Max size 2MB (SVG or transparent PNG recommended)</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase text-white bg-[#F04E36] hover:bg-[#d63f28]  shadow-md shadow-[#F04E36]/30"
                >
                  Save Logo Settings
                </button>
              </div>
            </form>
          )}

          {/* SUB-TAB 2: HOME SECTION EDITOR */}
          {cmsSubTab === 'home' && (
            <form onSubmit={handleSaveCMS} className="p-6 rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] space-y-4">
              <h3 className="text-sm font-serif font-bold text-[#F04E36]">Home Section CMS Settings</h3>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Hero Main Headline</label>
                <input
                  type="text"
                  value={cmsFormData.bannerTitle}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, bannerTitle: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Hero Subtitle</label>
                <textarea
                  rows={2}
                  value={cmsFormData.bannerSubtitle}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, bannerSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] resize-none focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Brand Mission Text</label>
                <textarea
                  rows={3}
                  value={cmsFormData.homeMissionText || ''}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, homeMissionText: e.target.value })}
                  placeholder="Connecting world-class creators and patrons..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] resize-none focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Hero Cover Image URL</label>
                <input
                  type="url"
                  value={cmsFormData.bannerImageUrl}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, bannerImageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase text-white bg-[#F04E36] hover:bg-[#d63f28]  shadow-md shadow-[#F04E36]/30"
                >
                  Save Home Settings
                </button>
              </div>
            </form>
          )}

          {/* SUB-TAB 3: EVENTS SECTION EDITOR */}
          {cmsSubTab === 'events' && (
            <form onSubmit={handleSaveCMS} className="p-6 rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] space-y-4">
              <h3 className="text-sm font-serif font-bold text-[#F04E36]">Events Section CMS Settings</h3>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Events Page Subtitle</label>
                <textarea
                  rows={2}
                  value={cmsFormData.eventsSubtitle || ''}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, eventsSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] resize-none focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-[#F04E36]">Event Highlights & Order:</p>
                <p>Events automatically display with real-time remaining seat counters and sold-out states. To manage, create or edit specific event entries, use the <strong>Event Publisher</strong> tab.</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase text-white bg-[#F04E36] hover:bg-[#d63f28]  shadow-md shadow-[#F04E36]/30"
                >
                  Save Events Settings
                </button>
              </div>
            </form>
          )}

          {/* SUB-TAB 4: PORTFOLIO SECTION EDITOR */}
          {cmsSubTab === 'portfolio' && (
            <div className="p-6 rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#F04E36]">Portfolio & Milestone Posts</h3>
                  <p className="text-xs text-slate-400">Add, edit, or delete past event case studies and descriptions.</p>
                </div>
                <button
                  onClick={() => setPortfolioModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#F04E36] hover:bg-[#d63f28] hover:bg-[#F04E36] flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Case Study</span>
                </button>
              </div>

              {portfolio.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#D8D2C5] rounded-xl bg-[#EBE6DC]/50">
                  <p className="text-xs text-slate-400">No portfolio case studies published yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {portfolio.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="h-32 rounded-lg overflow-hidden mb-2">
                          <img src={item.coverImageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                        <p className="text-[11px] text-[#F04E36] font-mono">{item.clientOrEvent} • {item.metrics}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{item.description}</p>
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setDeleteConfirmItem({ type: 'portfolio', id: item.id, label: item.title })}
                          className="text-slate-400 hover:text-rose-600 text-xs p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 5: GALLERY SECTION EDITOR */}
          {cmsSubTab === 'gallery' && (
            <div className="p-6 rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#F04E36]">Photo Gallery Manager</h3>
                  <p className="text-xs text-slate-400">Add or delete high-resolution event moments in the public visual gallery.</p>
                </div>
                <button
                  onClick={() => setGalleryModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#F04E36] hover:bg-[#d63f28] hover:bg-[#F04E36] flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Photo</span>
                </button>
              </div>

              {gallery.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#D8D2C5] rounded-xl bg-[#EBE6DC]/50">
                  <p className="text-xs text-slate-400">No gallery photos uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                  {gallery.map((item) => (
                    <div key={item.id} className="relative group rounded-xl overflow-hidden bg-[#EBE6DC] border border-[#D8D2C5] aspect-square">
                      <img src={item.imageUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80'} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                        <span className="text-[10px] text-white font-bold">{item.title}</span>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-[#F04E36] font-mono">{item.category}</span>
                          <button
                            onClick={() => setDeleteConfirmItem({ type: 'gallery', id: item.id, label: item.title })}
                            className="p-1 rounded bg-rose-600/80 text-white hover:bg-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 6: ABOUT SECTION EDITOR */}
          {cmsSubTab === 'about' && (
            <form onSubmit={handleSaveCMS} className="p-6 rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] space-y-4">
              <h3 className="text-sm font-serif font-bold text-[#F04E36]">About Page CMS Settings</h3>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Company Overview</label>
                <textarea
                  rows={3}
                  value={cmsFormData.aboutCompanyOverview || ''}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, aboutCompanyOverview: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] resize-none focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Mission Statement</label>
                <textarea
                  rows={2}
                  value={cmsFormData.aboutMissionStatement || ''}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, aboutMissionStatement: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] resize-none focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Leadership Team Overview</label>
                <textarea
                  rows={2}
                  value={cmsFormData.aboutTeamOverview || ''}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, aboutTeamOverview: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] resize-none focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Core Values</label>
                <input
                  type="text"
                  value={cmsFormData.aboutCoreValues || ''}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, aboutCoreValues: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase text-white bg-[#F04E36] hover:bg-[#d63f28]  shadow-md shadow-[#F04E36]/30"
                >
                  Save About Settings
                </button>
              </div>
            </form>
          )}

          {/* SUB-TAB 7: CONTACT US SECTION EDITOR */}
          {cmsSubTab === 'contact' && (
            <form onSubmit={handleSaveCMS} className="p-6 rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] space-y-4">
              <h3 className="text-sm font-serif font-bold text-[#F04E36]">Contact Us CMS & Payment Credentials</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Official Support Email</label>
                  <input
                    type="email"
                    value={cmsFormData.supportEmail}
                    onChange={(e) => setCmsFormData({ ...cmsFormData, supportEmail: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Helpline Phone Number</label>
                  <input
                    type="tel"
                    value={cmsFormData.adminPhone}
                    onChange={(e) => setCmsFormData({ ...cmsFormData, adminPhone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Physical Office Address</label>
                <input
                  type="text"
                  value={cmsFormData.contactAddress || ''}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, contactAddress: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={cmsFormData.contactOperatingHours || ''}
                  onChange={(e) => setCmsFormData({ ...cmsFormData, contactOperatingHours: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] space-y-3">
                <span className="text-xs font-mono uppercase font-bold text-[#F04E36] block">
                  Payment Screen Credentials (Manual UPI)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">UPI ID (e.g. 8287342192@ptyes)</label>
                    <input
                      type="text"
                      value={cmsFormData.adminUpiId}
                      onChange={(e) => setCmsFormData({ ...cmsFormData, adminUpiId: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F4F1EA] border border-[#D8D2C5] text-[#F04E36] font-mono font-bold outline-none focus:border-[#F04E36]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">UPI QR Code URL</label>
                    <input
                      type="url"
                      value={cmsFormData.adminUpiQrUrl}
                      onChange={(e) => setCmsFormData({ ...cmsFormData, adminUpiQrUrl: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F4F1EA] border border-[#D8D2C5] text-white font-mono text-[11px] outline-none focus:border-[#F04E36]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase text-white bg-[#F04E36] hover:bg-[#d63f28]  shadow-md shadow-[#F04E36]/30"
                >
                  Save Contact & Payment Settings
                </button>
              </div>
            </form>
          )}

          {/* SUB-TAB 8: SOCIAL MEDIA & COMMUNITY LINKS MANAGER */}
          {cmsSubTab === 'social' && (
            <form onSubmit={handleSaveCMS} className="p-6 rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] space-y-4">
              <h3 className="text-sm font-serif font-bold text-[#F04E36]">Social Media & Community Direct Links</h3>
              <p className="text-xs text-slate-400">
                Configure direct profile links for instant external redirect across the top header and footer navigation.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={cmsFormData.socialLinks?.instagram || ''}
                    onChange={(e) =>
                      setCmsFormData({
                        ...cmsFormData,
                        socialLinks: { ...cmsFormData.socialLinks, instagram: e.target.value },
                      })
                    }
                    placeholder="https://instagram.com/meetupclub"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Twitter (X) URL</label>
                  <input
                    type="url"
                    value={cmsFormData.socialLinks?.twitter || ''}
                    onChange={(e) =>
                      setCmsFormData({
                        ...cmsFormData,
                        socialLinks: { ...cmsFormData.socialLinks, twitter: e.target.value },
                      })
                    }
                    placeholder="https://x.com/meetupclub"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">LinkedIn Company Page URL</label>
                  <input
                    type="url"
                    value={cmsFormData.socialLinks?.linkedin || ''}
                    onChange={(e) =>
                      setCmsFormData({
                        ...cmsFormData,
                        socialLinks: { ...cmsFormData.socialLinks, linkedin: e.target.value },
                      })
                    }
                    placeholder="https://linkedin.com/company/meetupclub"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Indeed Company Profile URL</label>
                  <input
                    type="url"
                    value={cmsFormData.socialLinks?.indeed || ''}
                    onChange={(e) =>
                      setCmsFormData({
                        ...cmsFormData,
                        socialLinks: { ...cmsFormData.socialLinks, indeed: e.target.value },
                      })
                    }
                    placeholder="https://www.indeed.com/cmp/meetupclub"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Discord VIP Server Invite URL</label>
                  <input
                    type="url"
                    value={cmsFormData.socialLinks?.discord || ''}
                    onChange={(e) =>
                      setCmsFormData({
                        ...cmsFormData,
                        socialLinks: { ...cmsFormData.socialLinks, discord: e.target.value },
                      })
                    }
                    placeholder="https://discord.gg/meetupclub"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase text-white bg-[#F04E36] hover:bg-[#d63f28]  shadow-md shadow-[#F04E36]/30"
                >
                  Save Social Links
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ATTENDEE INQUIRIES                                                  */}
      {/* ========================================================================= */}
      {activePrimaryTab === 'inquiries' && (
        <div className="p-6 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#2A2A2B] flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#F04E36]" />
                <span>Executive Inquiries & VIP Requests</span>
              </h2>
              <p className="text-xs text-slate-400">
                Inquiries submitted via the header "Make an Inquiry" modal or the Contact page.
              </p>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#D8D2C5] rounded-xl bg-[#F4F1EA] space-y-2">
              <Mail className="w-10 h-10 text-[#F04E36]/40 mx-auto" />
              <h3 className="text-base font-semibold text-[#2A2A2B]">No Inquiries Received</h3>
              <p className="text-xs text-slate-400">
                All attendee inquiries and custom private booking requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className={`p-4 rounded-xl border transition-all ${
                    inq.status === 'unread'
                      ? 'bg-[#EBE6DC] border-[#D8D2C5] shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'bg-[#F4F1EA] border-[#D8D2C5] opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#D8D2C5]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#2A2A2B] text-sm">{inq.name}</span>
                      <span className="text-xs text-slate-400">({inq.email})</span>
                      {inq.phone && <span className="text-xs text-[#F04E36] font-mono">📞 {inq.phone}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                      {inq.status === 'unread' ? (
                        <button
                          onClick={() => updateInquiryStatus(inq.id, 'read')}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F04E36] hover:bg-[#d63f28] text-white"
                        >
                          Mark Read
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">Read</span>
                      )}
                      <button
                        onClick={() =>
                          setDeleteConfirmItem({
                            type: 'inquiry',
                            id: inq.id,
                            label: `Inquiry from ${inq.name}`,
                          })
                        }
                        className="p-1 rounded text-slate-400 hover:text-rose-600"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-[#F04E36]">{inq.subject}</div>
                    <p className="text-xs text-[#4A4A4A] mt-1 whitespace-pre-wrap">{inq.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: GATE STAFF MANAGEMENT & TURNSTILE CREDENTIALS                        */}
      {/* ========================================================================= */}
      {activePrimaryTab === 'staff' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#D8D2C5]">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#2A2A2B] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F04E36]" />
                <span>Gate Staff Management & Security Turnstiles</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Create and govern field access credentials for physical event turnstiles, ticket scanners, and security officers.
              </p>
            </div>

            {onOpenGateScanner && (
              <button
                onClick={onOpenGateScanner}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2A2A2B] bg-[#F04E36] hover:bg-[#d63f28]  shadow-md shadow-[#F04E36]/25 flex items-center gap-2 self-start sm:self-auto"
              >
                <QrCode className="w-4 h-4" />
                <span>Launch Gate Scanner</span>
              </button>
            )}
          </div>


          {/* Add New Gate Staff Form Card */}
          <div className="p-6 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md shadow-xl">
            <h3 className="text-sm font-serif font-bold text-[#2A2A2B] flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-[#F04E36]" />
              <span>Add New Gate Staff Account</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Staff members can sign in using these credentials to operate the mobile QR turnstile gate scanner.
            </p>

            {staffSuccessNotice && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{staffSuccessNotice}</span>
              </div>
            )}

            {staffErrorNotice && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{staffErrorNotice}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                  Staff Member Full Name <span className="text-[#F04E36]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Officer Vikram Rao"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F4F1EA] border border-[#D8D2C5] text-white placeholder-slate-500 outline-none focus:border-[#F04E36]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                  Username or Email <span className="text-[#F04E36]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="e.g. gate.vikram@meetupclub.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F4F1EA] border border-[#D8D2C5] text-white placeholder-slate-500 font-mono outline-none focus:border-[#F04E36]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">
                  Password <span className="text-[#F04E36]">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="Staff@Pass2026"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F4F1EA] border border-[#D8D2C5] text-white placeholder-slate-500 font-mono outline-none focus:border-[#F04E36]"
                  />
                  <button
                    type="submit"
                    disabled={staffSubmitting}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#F04E36] hover:bg-[#d63f28]  shadow-md shadow-[#F04E36]/30 whitespace-nowrap transition-all"
                  >
                    {staffSubmitting ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Active Gate Staff List */}
          <div className="p-6 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8D2C5]">
              <h3 className="text-sm font-serif font-bold text-[#2A2A2B] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F04E36]" />
                <span>Authorized Turnstile Staff Roster ({gateStaffList.length})</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Real-time active turnstile officers
              </span>
            </div>

            {gateStaffList.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[#D8D2C5] rounded-xl bg-[#F4F1EA] space-y-2">
                <Users className="w-8 h-8 text-[#736B63] mx-auto" />
                <h4 className="text-xs font-semibold text-[#2A2A2B]">No Gate Officers Enrolled Yet</h4>
                <p className="text-[11px] text-[#4A4A4A] max-w-sm mx-auto">
                  Enroll gate officers using the form above to grant authorized turnstile QR scanning access.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#D8D2C5] text-slate-400 uppercase font-mono text-[10px]">
                      <th className="py-2.5 px-3">Officer Name</th>
                      <th className="py-2.5 px-3">Username / Email</th>
                      <th className="py-2.5 px-3">Password</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Created</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8D2C5] bg-white/40">
                    {gateStaffList.map((staff) => (
                      <tr key={staff.id} className="hover:bg-[#F4F1EA] transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#2A2A2B] flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#F04E36]/20 text-[#F04E36] flex items-center justify-center text-[10px] font-bold">
                              {staff.name.charAt(0)}
                            </div>
                            <span>{staff.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#F04E36] text-[11px]">
                          {staff.email}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                          {staff.password || '••••••••'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              staff.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {staff.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-400 font-mono">
                          {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() =>
                              setDeleteConfirmItem({
                                type: 'staff',
                                id: staff.id,
                                label: `Gate Staff ${staff.name} (${staff.email})`,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-rose-400 hover:text-white hover:bg-rose-600/80 transition-colors inline-flex items-center gap-1"
                            title="Delete Gate Staff"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: MEMBERS DIRECTORY (REGISTERED ATTENDEES)                             */}
      {/* ========================================================================= */}
      {activePrimaryTab === 'members' && (
        <div className="space-y-6">
          {/* Header & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#D8D2C5]">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#2A2A2B] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#F04E36]" />
                <span>Members Directory & Registered Attendees</span>
              </h2>
              <p className="text-xs text-[#736B63] mt-0.5">
                Centralized registry of all patrons registered with manual email/password accounts and booking history.
              </p>
            </div>

            {/* Instant Search Bar */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#736B63] absolute left-3.5 top-3" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] placeholder-[#736B63] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none shadow-xs"
              />
              {memberSearchQuery && (
                <button
                  onClick={() => setMemberSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-[#736B63] hover:text-[#2A2A2B] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Members Table Card */}
          <div className="p-6 rounded-2xl bg-[#EBE6DC] border border-[#D8D2C5] backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-serif font-bold text-[#2A2A2B] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F04E36]" />
                <span>Registered Patrons ({membersList.length})</span>
              </h3>
              {memberSearchQuery && (
                <span className="text-xs text-[#736B63] font-mono">
                  Matching:{' '}
                  {
                    membersList.filter((m) => {
                      const q = memberSearchQuery.toLowerCase().trim();
                      return (
                        (m.name || '').toLowerCase().includes(q) ||
                        (m.email || '').toLowerCase().includes(q) ||
                        (m.phone || '').toLowerCase().includes(q) ||
                        (m.id || '').toLowerCase().includes(q)
                      );
                    }).length
                  }{' '}
                  members
                </span>
              )}
            </div>

            {membersList.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[#D8D2C5] rounded-xl bg-[#F4F1EA] space-y-2">
                <UserCheck className="w-10 h-10 text-[#F04E36]/40 mx-auto" />
                <h4 className="text-base font-semibold text-[#2A2A2B]">No Members Registered Yet</h4>
                <p className="text-xs text-[#736B63]">
                  Attendees who create accounts via the Attendee Portal will be stored and tracked here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#D8D2C5] bg-white">
                <table className="w-full text-left text-xs text-[#2A2A2B]">
                  <thead className="bg-[#EBE6DC] text-[11px] font-mono uppercase text-[#736B63] border-b border-[#D8D2C5]">
                    <tr>
                      <th className="py-3 px-3">Member ID</th>
                      <th className="py-3 px-3">Full Name</th>
                      <th className="py-3 px-3">Email Address</th>
                      <th className="py-3 px-3">Phone Number</th>
                      <th className="py-3 px-3">Registration Date</th>
                      <th className="py-3 px-3 text-center">Total Tickets Booked</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8D2C5]">
                    {membersList
                      .filter((m) => {
                        if (!memberSearchQuery.trim()) return true;
                        const q = memberSearchQuery.toLowerCase().trim();
                        return (
                          (m.name || '').toLowerCase().includes(q) ||
                          (m.email || '').toLowerCase().includes(q) ||
                          (m.phone || '').toLowerCase().includes(q) ||
                          (m.id || '').toLowerCase().includes(q)
                        );
                      })
                      .map((member) => {
                        const memberTickets = tickets.filter(
                          (t) =>
                            (t.attendeeEmail &&
                              t.attendeeEmail.toLowerCase() === member.email.toLowerCase()) ||
                            (t.attendeeId && t.attendeeId === member.id)
                        );
                        return (
                          <tr key={member.id} className="hover:bg-[#F4F1EA] transition-colors">
                            <td className="py-3 px-3 font-mono text-[11px] text-[#736B63]">
                              <span className="bg-[#EBE6DC] px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#2A2A2B] border border-[#D8D2C5]">
                                {member.id.length > 14 ? `${member.id.slice(0, 12)}…` : member.id}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                {member.photoURL && member.photoURL.trim() ? (
                                  <img
                                    src={member.photoURL.trim()}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover border border-[#D8D2C5]"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#2A2A2B] text-white flex items-center justify-center text-[10px] font-bold">
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="font-semibold text-[#2A2A2B]">{member.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[#2A2A2B]">
                              {member.email}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[#2A2A2B]">
                              {member.phone ? (
                                <span>{member.phone}</span>
                              ) : (
                                <span className="text-[#736B63] italic">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-[11px] text-[#4A4A4A] whitespace-nowrap">
                              {member.createdAt
                                ? new Date(member.createdAt).toLocaleString('en-IN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  memberTickets.length > 0
                                    ? 'bg-[#F04E36]/15 text-[#F04E36] border border-[#F04E36]/30'
                                    : 'bg-[#EBE6DC] text-[#736B63]'
                                }`}
                              >
                                {memberTickets.length}{' '}
                                {memberTickets.length === 1 ? 'Ticket' : 'Tickets'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedMemberForDetail(member)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#2A2A2B] bg-[#EBE6DC] hover:bg-[#D8D2C5] border border-[#D8D2C5] transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="View Member Details & Ticket Purchase History"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#F04E36]" />
                                  <span>View History</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirmItem({
                                      type: 'member',
                                      id: member.id,
                                      label: `Member Account for ${member.name} (${member.email})`,
                                    })
                                  }
                                  className="p-1.5 rounded-lg text-[#736B63] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Member Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member Details & Ticket Purchase History Modal */}
      {selectedMemberForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A2A2B]/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-[#EBE6DC] border-b border-[#D8D2C5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#2A2A2B] text-white flex items-center justify-center text-sm font-bold border border-[#D8D2C5] shadow-xs">
                  {selectedMemberForDetail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#2A2A2B] flex items-center gap-2">
                    <span>{selectedMemberForDetail.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#F04E36]/15 text-[#F04E36] border border-[#F04E36]/30 uppercase">
                      Registered Attendee
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-[#736B63] font-mono mt-0.5 flex-wrap">
                    <span>{selectedMemberForDetail.email}</span>
                    {selectedMemberForDetail.phone && <span>• {selectedMemberForDetail.phone}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberForDetail(null)}
                className="p-2 rounded-lg text-[#736B63] hover:text-[#2A2A2B] hover:bg-black/5 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
              {/* Account Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-white border border-[#D8D2C5] text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#736B63] block">Member ID</span>
                  <span
                    className="font-mono font-semibold text-[#2A2A2B] truncate block"
                    title={selectedMemberForDetail.id}
                  >
                    {selectedMemberForDetail.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#736B63] block">Registered On</span>
                  <span className="font-semibold text-[#2A2A2B] block">
                    {selectedMemberForDetail.createdAt
                      ? new Date(selectedMemberForDetail.createdAt).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#736B63] block">Last Login</span>
                  <span className="font-semibold text-[#2A2A2B] block">
                    {selectedMemberForDetail.lastLoginAt
                      ? new Date(selectedMemberForDetail.lastLoginAt).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#736B63] block">Auth Type</span>
                  <span className="font-semibold text-[#2A2A2B] uppercase font-mono block">
                    Email / Password
                  </span>
                </div>
              </div>

              {/* Ticket Purchase History */}
              <div>
                <h4 className="text-sm font-serif font-bold text-[#2A2A2B] flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-[#F04E36]" />
                    <span>Ticket Purchase History</span>
                  </span>
                  <span className="text-xs font-mono text-[#736B63]">
                    {
                      tickets.filter(
                        (t) =>
                          (t.attendeeEmail &&
                            t.attendeeEmail.toLowerCase() ===
                              selectedMemberForDetail.email.toLowerCase()) ||
                          (t.attendeeId && t.attendeeId === selectedMemberForDetail.id)
                      ).length
                    }{' '}
                    Total Purchases
                  </span>
                </h4>

                {(() => {
                  const memberTickets = tickets.filter(
                    (t) =>
                      (t.attendeeEmail &&
                        t.attendeeEmail.toLowerCase() ===
                          selectedMemberForDetail.email.toLowerCase()) ||
                      (t.attendeeId && t.attendeeId === selectedMemberForDetail.id)
                  );

                  if (memberTickets.length === 0) {
                    return (
                      <div className="text-center py-10 border border-dashed border-[#D8D2C5] rounded-xl bg-white p-4 space-y-1">
                        <Ticket className="w-7 h-7 text-[#736B63]/40 mx-auto" />
                        <p className="text-xs font-medium text-[#2A2A2B]">No tickets purchased yet</p>
                        <p className="text-[11px] text-[#736B63]">
                          This member has not completed any ticket registrations.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {memberTickets.map((t) => (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-xl bg-white border border-[#D8D2C5] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-[#2A2A2B] bg-[#EBE6DC] px-2 py-0.5 rounded text-[11px] border border-[#D8D2C5]">
                                {t.id}
                              </span>
                              <span className="font-semibold text-[#2A2A2B] truncate">
                                {t.eventTitle}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                  t.status === 'Verified'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : t.status === 'Rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {t.status}
                              </span>
                              {t.isCheckedIn && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                                  Checked In
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-[#736B63] font-mono flex-wrap">
                              <span>
                                UTR: <strong className="text-[#2A2A2B]">{t.utrNumber || 'N/A'}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Paid:{' '}
                                <strong className="text-[#F04E36]">
                                  ₹{(t.amountPaid || 0).toLocaleString('en-IN')}
                                </strong>
                              </span>
                              <span>•</span>
                              <span>
                                Date:{' '}
                                {t.createdAt
                                  ? new Date(t.createdAt).toLocaleDateString('en-IN')
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {t.receiptUrl && (
                              <button
                                onClick={() => setReceiptModalUrl(t.receiptUrl)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[#EBE6DC] hover:bg-[#D8D2C5] text-[#2A2A2B] border border-[#D8D2C5] transition-colors cursor-pointer"
                              >
                                View Receipt
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#EBE6DC] border-t border-[#D8D2C5] flex items-center justify-between">
              <span className="text-[11px] text-[#736B63]">Meetup Club Member Account</span>
              <button
                onClick={() => setSelectedMemberForDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2A2A2B] text-white hover:bg-[#1A1A1B] cursor-pointer transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A2A2B]/70 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl bg-[#F4F1EA] border border-rose-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2A2A2B]">Confirm Removal</h3>
                <p className="text-xs text-[#736B63]">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-[#4A4A4A]">
              Are you sure you want to permanently delete <strong>{deleteConfirmItem.label}</strong> from database?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2A2A2B] bg-white border border-[#D8D2C5] hover:bg-[#EBE6DC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-sm"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge to Zero-State Confirmation Modal */}
      {purgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A2A2B]/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-md w-full rounded-2xl bg-[#F4F1EA] border border-rose-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2A2A2B]">Purge All Records</h3>
                <p className="text-xs text-[#736B63]">Restore clean production zero-state.</p>
              </div>
            </div>
            <p className="text-xs text-[#4A4A4A] leading-relaxed">
              Are you sure you want to completely purge all events, tickets, inquiries, gate staff, and media items from Firestore? This resets the platform to a pristine zero-state.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={isPurging}
                onClick={() => setPurgeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2A2A2B] bg-white border border-[#D8D2C5] hover:bg-[#EBE6DC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isPurging}
                onClick={handleExecutePurge}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {isPurging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isPurging ? 'Purging All...' : 'Confirm Full Purge'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      {receiptModalUrl && receiptModalUrl.trim() !== '' && (
        <div
          onClick={() => setReceiptModalUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
        >
          <div className="relative max-w-xl w-full p-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={receiptModalUrl.trim()}
              alt="Payment Receipt"
              className="w-full max-h-[85vh] object-contain rounded-2xl border border-[#D8D2C5] shadow-2xl"
            />
            <button
              onClick={() => setReceiptModalUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white text-white hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Event Publisher Modal Form */}
      {eventFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A2A2B]/70 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEvent}
            className="max-w-xl w-full rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#D8D2C5]">
              <h3 className="text-base font-serif font-bold text-[#2A2A2B]">
                {editingEventId ? 'Edit Event Details' : 'Create Executive Event'}
              </h3>
              <button type="button" onClick={() => setEventFormOpen(false)} className="text-[#736B63] hover:text-[#2A2A2B]">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                  placeholder="The Grand Imperial Charity Gala 2026"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Category *</label>
                <select
                  value={eventFormData.category}
                  onChange={(e) => setEventFormData({ ...eventFormData, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                >
                  <option value="Gala">Gala</option>
                  <option value="Networking">Networking</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Summit">Summit</option>
                  <option value="VIP Party">VIP Party</option>
                  <option value="Concert">Concert</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Ticket Price (INR) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={eventFormData.ticketPrice}
                  onChange={(e) => setEventFormData({ ...eventFormData, ticketPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] text-[#F04E36] font-mono font-bold outline-none focus:border-[#F04E36]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Date *</label>
                <input
                  type="text"
                  required
                  value={eventFormData.date}
                  onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                  placeholder="2026-11-20 or Nov 20, 2026"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Time *</label>
                <input
                  type="text"
                  required
                  value={eventFormData.time}
                  onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                  placeholder="08:00 PM IST"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Venue *</label>
                <input
                  type="text"
                  required
                  value={eventFormData.venue}
                  onChange={(e) => setEventFormData({ ...eventFormData, venue: e.target.value })}
                  placeholder="The Grand St. Regis Ballroom, Mumbai"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Total Capacity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={eventFormData.capacity}
                  onChange={(e) => setEventFormData({ ...eventFormData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={eventFormData.coverImageUrl}
                  onChange={(e) => setEventFormData({ ...eventFormData, coverImageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono text-[11px] outline-none focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] placeholder-[#736B63]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] resize-none focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D8D2C5]">
              <button
                type="button"
                onClick={() => setEventFormOpen(false)}
                className="px-4 py-2 text-xs text-[#736B63] hover:text-[#2A2A2B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#F04E36] hover:bg-[#d63f28] text-white text-xs font-bold uppercase shadow-md shadow-[#F04E36]/30"
              >
                {editingEventId ? 'Update Event' : 'Publish Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gallery Modal */}
      {galleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A2A2B]/70 backdrop-blur-sm">
          <form
            onSubmit={handleSaveGallery}
            className="max-w-md w-full rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#D8D2C5]">
              <h3 className="text-base font-serif font-bold text-[#2A2A2B]">Add Photo to Gallery</h3>
              <button type="button" onClick={() => setGalleryModalOpen(false)}>✕</button>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Title *</label>
              <input
                type="text"
                required
                value={galleryFormData.title}
                onChange={(e) => setGalleryFormData({ ...galleryFormData, title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Image URL *</label>
              <input
                type="url"
                required
                value={galleryFormData.imageUrl}
                onChange={(e) => setGalleryFormData({ ...galleryFormData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Category</label>
                <input
                  type="text"
                  value={galleryFormData.category}
                  onChange={(e) => setGalleryFormData({ ...galleryFormData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Date Tag</label>
                <input
                  type="text"
                  value={galleryFormData.eventDate}
                  onChange={(e) => setGalleryFormData({ ...galleryFormData, eventDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setGalleryModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-xl bg-[#F04E36] hover:bg-[#d63f28] text-white text-xs font-bold uppercase shadow-md">Add Photo</button>
            </div>
          </form>
        </div>
      )}

      {/* Portfolio Modal */}
      {portfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A2A2B]/70 backdrop-blur-sm">
          <form
            onSubmit={handleSavePortfolio}
            className="max-w-md w-full rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#D8D2C5]">
              <h3 className="text-base font-serif font-bold text-[#2A2A2B]">Add Portfolio Case Study</h3>
              <button type="button" onClick={() => setPortfolioModalOpen(false)}>✕</button>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Title *</label>
              <input
                type="text"
                required
                value={portfolioFormData.title}
                onChange={(e) => setPortfolioFormData({ ...portfolioFormData, title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Client or Category *</label>
              <input
                type="text"
                required
                value={portfolioFormData.clientOrEvent}
                onChange={(e) => setPortfolioFormData({ ...portfolioFormData, clientOrEvent: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Cover Image URL *</label>
              <input
                type="url"
                required
                value={portfolioFormData.coverImageUrl}
                onChange={(e) => setPortfolioFormData({ ...portfolioFormData, coverImageUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Metrics Highlight *</label>
              <input
                type="text"
                required
                value={portfolioFormData.metrics}
                onChange={(e) => setPortfolioFormData({ ...portfolioFormData, metrics: e.target.value })}
                placeholder="400 Patrons • 100% Sold Out"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] font-mono focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Description</label>
              <textarea
                rows={2}
                value={portfolioFormData.description}
                onChange={(e) => setPortfolioFormData({ ...portfolioFormData, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D2C5] text-[#2A2A2B] resize-none focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] outline-none placeholder-[#736B63]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setPortfolioModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-xl bg-[#F04E36] hover:bg-[#d63f28] text-white text-xs font-bold uppercase shadow-md">Add Case Study</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
