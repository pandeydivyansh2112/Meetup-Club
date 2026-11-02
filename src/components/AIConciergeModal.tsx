/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, Clock, ShieldCheck, HelpCircle } from 'lucide-react';

interface AIConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'assistant' | 'user';
  text: string;
}

export const AIConciergeModal: React.FC<AIConciergeModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Greetings. I am your Meetup Club VIP Concierge, powered by low-latency intelligence. How may I assist your event experience or ticketing verification today?',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = [
    'What is the dress code for the Gala?',
    'How does manual UPI payment verification work?',
    'Where is the St. Regis Ballroom located?',
    'How do I present my ticket at the gate?',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const newMsgs: Message[] = [...messages, { role: 'user', text: query }];
    setMessages(newMsgs);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      if (!res.ok) throw new Error('Concierge request failed');
      const data = await res.json();
      setMessages([...newMsgs, { role: 'assistant', text: data.text || 'I am at your service. Please reach out to our concierge desk.' }]);
    } catch {
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          text: 'Our private concierge line is currently attending to high call volumes. For immediate support, please contact our verification helpline at +91 8287342192.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A2A2B]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#F4F1EA] border border-[#D8D2C5] p-5 shadow-2xl flex flex-col h-[560px] overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#F04E36]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D8D2C5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F04E36] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif font-bold text-[#2A2A2B] text-base">VIP AI Concierge</h3>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#EBE6DC] text-[#2A2A2B] border border-[#D8D2C5]">
                  ⚡ 3.1 Flash-Lite
                </span>
              </div>
              <p className="text-[10px] text-[#736B63]">Instant answers for ticketing, dress code & gala protocols</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#736B63] hover:text-[#2A2A2B] hover:bg-[#EBE6DC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-[#EBE6DC] border border-[#D8D2C5] flex items-center justify-center text-[#F04E36] shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#F04E36] text-white font-medium shadow-sm'
                    : 'bg-[#EBE6DC] border border-[#D8D2C5] text-[#2A2A2B]'
                }`}
              >
                {m.text}
              </div>
              {m.role === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-[#2A2A2B] flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-[#F04E36] font-mono">
              <div className="w-6 h-6 rounded-lg bg-[#EBE6DC] border border-[#D8D2C5] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span>Formulating reply...</span>
            </div>
          )}
        </div>

        {/* Quick suggestions */}
        <div className="py-2 border-t border-[#D8D2C5]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap bg-white hover:bg-[#EBE6DC] text-[#2A2A2B] border border-[#D8D2C5] hover:border-[#F04E36] transition-colors cursor-pointer shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative pt-2 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about events, payments, dress code..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#D8D2C5] focus:border-[#F04E36] focus:ring-1 focus:ring-[#F04E36] focus:outline-none text-[#2A2A2B] text-xs placeholder-[#736B63]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-[#F04E36] hover:bg-[#d63f28] text-white shadow-md shadow-[#F04E36]/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
