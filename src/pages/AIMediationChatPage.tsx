import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FairyAvatar from '@/components/FairyAvatar';
import { Loader2, Send, ArrowLeft, User, HeartHandshake } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIMediationChatPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') as 'single' | 'dual') || 'single';
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const modeLabel = mode === 'single' ? t('aiMediation.singleLabel') : t('aiMediation.dualLabel');
  const modeIcon = mode === 'single' ? '🌸' : '🤝';
  const welcomeMsg = mode === 'single'
    ? '你好，我是蓝仙女。请放心倾诉您的困扰，我会认真倾听并给予支持。'
    : '大家好，我是蓝仙女调解助手。我会以中立温和的态度，协助你们进行沟通与理解。请依次表达您的想法。';

  useEffect(() => {
    // 添加欢迎消息
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeMsg,
          timestamp: new Date(),
        },
      ]);
    }
  }, [mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    if (!user) {
      toast.error('请先登录');
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const { data: { session } } = await import('@/db/supabase').then((m) => m.supabase.auth.getSession());
      const token = session?.access_token || '';

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai_mediation_chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: userMsg.content,
            mode,
            history,
          }),
        }
      );

      const result = await res.json();
      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: result.reply,
            timestamp: new Date(),
          },
        ]);
      } else {
        toast.error(result.error || '发送失败');
      }
    } catch (err: any) {
      toast.error('网络错误，请重试');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, messages, mode, user]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F5] flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-[#F0E0E0] px-4 py-3 flex items-center gap-3 shrink-0">
        <Link to="/ai-mediation">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-5 h-5 text-[#888]" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <FairyAvatar size="md" variant="pink" className="animate-fairy-float" />
          <div>
            <p className="text-sm font-bold text-[#2D2D2D]">蓝仙女 AI</p>
            <p className="text-xs text-[#AAA]">{modeLabel}</p>
          </div>
        </div>
      </div>

      {/* 消息区域 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'assistant' ? (
              <FairyAvatar size="sm" variant="pink" className="shrink-0 mt-1 animate-fairy-wand" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#F4A4A4]/20 flex items-center justify-center shrink-0">
                {mode === 'dual' ? (
                  <HeartHandshake className="w-4 h-4 text-[#E05050]" />
                ) : (
                  <User className="w-4 h-4 text-[#E05050]" />
                )}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#F4A4A4] text-white rounded-br-md'
                  : 'bg-white text-[#333] rounded-bl-md shadow-sm border border-[#F0E0E0]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-2">
            <FairyAvatar size="sm" variant="pink" className="shrink-0 animate-fairy-wand" />
            <div className="bg-white rounded-2xl rounded-bl-md shadow-sm border border-[#F0E0E0] px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#F4A4A4]" />
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="bg-white border-t border-[#F0E0E0] px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'single' ? '向蓝仙女倾诉您的困扰...' : '请输入您的想法...'}
            className="flex-1 bg-[#F9F5F3] border-[#E8DDD8] rounded-full px-4 h-10 text-sm focus-visible:ring-[#F4A4A4]"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            size="sm"
            className="h-10 w-10 rounded-full p-0 bg-[#F08080] hover:bg-[#E06E6E] text-white disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-[#CCC] text-center mt-2">
          AI 调解提供情感支持，不构成正式法律意见
        </p>
      </div>
    </div>
  );
}
