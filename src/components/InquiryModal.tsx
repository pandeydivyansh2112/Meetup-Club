/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Send, CheckCircle2, MessageCircle, Sparkles, Phone, Mail, User } from 'lucide-react';
import { submitInquiry } from '../services/dbService';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('VIP Membership & Gala Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await submitInquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A2A2B]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-[#F04E36]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#736B63] hover:text-[#2A2A2B] hover:bg-[#EBE6DC] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-widest uppercase bg-[#EBE6DC] text-[#2A2A2B] border border-[#D8D2C5] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#F04E36]" />
            <span>Direct Concierge Desk</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2A2A2B] tracking-wide">
            Make an Inquiry
          </h2>
          <p className="text-xs text-[#4A4A4A] mt-1">
            Submit a private inquiry for event hosting, table reservations, sponsorships, or membership.
          </p>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#F04E36]/10 border-2 border-[#F04E36] flex items-center justify-center mx-auto text-[#F04E36] shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2A2A2B]">Inquiry Received</h3>
            <p className="text-xs text-[#4A4A4A] max-w-xs mx-auto">
              Thank you for contacting Meetup Club. Our executive desk will review your message and reply promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lady Jacqueline Vance"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@domain.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98200 00000"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#2A2A2B] mb-1">Message / Requirements *</label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your event or membership requirements..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] placeholder-[#736B63] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-[#F04E36] hover:bg-[#d63f28] shadow-md shadow-[#F04E36]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transmitting...' : 'Send Inquiry'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
