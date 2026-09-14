import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  User,
  Bot,
  ArrowRight,
  ExternalLink,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { aiApi } from '../api/client.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  serviceDetection?: any;
  contextServiceCode?: string;
  suggestedActions?: Array<{
    label: string;
    action: string;
    serviceCode?: string;
    url?: string;
    docs?: string[];
    eligibility?: string;
  }>;
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am the GovConnect Public Service AI Assistant. I can help you find government services, understand eligibility criteria, review required documents, and guide you directly through fast-track DigiLocker applications.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestedPrompts = [
    'How do I apply for a new water connection?',
    'How can I renew my driving licence and update address?',
    'What documents do I need for a scholarship?',
    'How can I verify my property patta records?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const historyPayload = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
      contextServiceCode: m.contextServiceCode,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await aiApi.assistantChat(query, historyPayload);
      if (res.success && res.data) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.data.reply,
          serviceDetection: res.data.serviceDetection,
          contextServiceCode: res.data.contextServiceCode,
          suggestedActions: res.data.suggestedActions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'I encountered an issue connecting to the service knowledge base. Please try again or browse our Service Directory.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: { label: string; action: string; serviceCode?: string; url?: string; docs?: string[]; eligibility?: string }) => {
    if (action.action === 'START_APPLICATION') {
      if (action.serviceCode === 'WTR-001') {
        navigate('/apply/water');
      } else if (action.serviceCode === 'TRN-001') {
        navigate('/apply/driving-licence');
      } else {
        navigate('/services');
      }
    } else if (action.action === 'OPEN_EXTERNAL' && action.url) {
      window.open(action.url, '_blank', 'noopener,noreferrer');
    } else if (action.action === 'VIEW_DOCS') {
      handleSendMessage('What documents do I need for this service?');
    } else if (action.action === 'VIEW_ELIGIBILITY') {
      handleSendMessage('What are the eligibility criteria for this service?');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 bg-[#F5F7FA]">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-[#EBF3FA] border border-[#B9D4EE] text-[#123B6D] text-xs font-bold px-3 py-1 rounded-full shadow-gov-sm">
          <Sparkles className="w-4 h-4 text-[#F4A340]" />
          <span>GovConnect AI Service Assistant</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#172033]">
          Conversational Government Service Guide
        </h1>
        <p className="text-xs sm:text-sm text-[#5B667A] max-w-xl mx-auto leading-relaxed">
          Ask questions in plain language. GovConnect identifies required documents, explains application steps, and launches verified workflows directly.
        </p>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[#5B667A] uppercase tracking-wider block">
          Suggested Questions:
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-xs bg-white hover:bg-[#EBF3FA] hover:text-[#123B6D] border border-[#DDE3EA] px-3.5 py-1.5 rounded-lg text-[#172033] font-medium transition-all text-left shadow-gov-sm cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <Card className="p-0 overflow-hidden shadow-gov-md flex flex-col h-[540px] border-[#DDE3EA]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#F5F7FA]/70">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-gov-sm ${
                  msg.sender === 'user'
                    ? 'bg-[#123B6D] text-white'
                    : 'bg-[#0B2A4A] text-white'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#A3E9B9]" />}
              </div>

              <div
                className={`max-w-xl rounded-2xl p-4 text-xs space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-[#123B6D] text-white rounded-tr-none'
                    : 'bg-white border border-[#DDE3EA] text-[#172033] shadow-gov-sm rounded-tl-none'
                }`}
              >
                <div className="leading-relaxed whitespace-pre-line font-sans">
                  {msg.text}
                </div>

                {/* Suggested Action Buttons */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="pt-2.5 border-t border-[#DDE3EA] flex flex-wrap gap-2">
                    {msg.suggestedActions.map((action, actIdx) => (
                      <button
                        key={actIdx}
                        type="button"
                        onClick={() => handleActionClick(action)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-gov-sm cursor-pointer ${
                          action.action === 'START_APPLICATION'
                            ? 'bg-[#123B6D] text-white hover:bg-[#0B2A4A]'
                            : action.action === 'OPEN_EXTERNAL'
                            ? 'bg-white text-[#123B6D] border-2 border-[#123B6D] hover:bg-[#EBF3FA]'
                            : 'bg-white text-[#172033] hover:bg-[#F5F7FA] border border-[#DDE3EA]'
                        }`}
                      >
                        {action.action === 'START_APPLICATION' && <ArrowRight className="w-3.5 h-3.5" />}
                        {action.action === 'OPEN_EXTERNAL' && <ExternalLink className="w-3.5 h-3.5" />}
                        {action.action === 'VIEW_DOCS' && <FileText className="w-3.5 h-3.5 text-[#123B6D]" />}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                <span
                  className={`text-[10px] block mt-1 font-mono ${
                    msg.sender === 'user' ? 'text-slate-200 text-right' : 'text-[#5B667A]'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0B2A4A] text-white flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4 text-[#A3E9B9]" />
              </div>
              <div className="bg-white border border-[#DDE3EA] rounded-2xl rounded-tl-none p-3 shadow-gov-sm flex items-center gap-2 text-xs text-[#5B667A]">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce [animation-delay:0.2s]">●</span>
                <span className="animate-bounce [animation-delay:0.4s]">●</span>
                <span className="ml-1 text-[11px] font-medium">Checking public service requirements...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-[#DDE3EA] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question (e.g. 'How do I renew my driving licence?')..."
            className="flex-1 px-4 py-2 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!inputText.trim() || isLoading}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
};
