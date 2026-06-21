import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import FairyAvatar from '@/components/FairyAvatar';
import {
  Loader2,
  Send,
  User,
  MessageCircleQuestion,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  '魔镜是什么功能？',
  '家和成长营怎么参加？',
  '家和协商室怎么使用？',
  '安心认证有什么等级？',
  '成为会员有什么权益？',
  '怎么联系邱律？',
];

const welcomeMsg = `👋 嗨，欢迎来到跨境家和 😊
我是【家和小助手】，叫我小家就好。
我在这里，帮助跨境家庭解决他们关心的事——
不管是一个小小的困惑，还是想了很久的问题。
今天是什么让您来到这里的？
💡 如果您想快速开始，这里有常用入口：
【🎯 立即体验魔镜】【✅ 申请安心认证】
【🏕️ 查看成长营】【📅 预约邱律咨询】【💎 成为会员】
或者——直接告诉我您在担心什么，我们一起想办法 😊`;

export default function AICustomerServicePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    if (!user) {
      toast.error('请先登录');
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai_customer_service`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: userMsg.content,
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
    } catch {
      toast.error('网络异常，请稍后重试');
    } finally {
      setSending(false);
    }
  }, [user, messages, sending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 顶部 */}
      <header className="bg-primary text-primary-foreground py-4 border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
            <Sparkles className="w-4 h-4" />
            跨境家和
          </Link>
          <span className="opacity-40">/</span>
          <div className="flex items-center gap-2">
            <FairyAvatar size="sm" variant="blue" className="animate-fairy-float" />
            <div>
              <h1 className="text-base font-bold">AI客服</h1>
              <p className="text-xs opacity-60">跨境家和智能助手</p>
            </div>
          </div>
        </div>
      </header>

      {/* 聊天区域 */}
      <div className="flex-1 flex flex-col container mx-auto px-4 max-w-3xl py-4">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 min-h-0 pb-4"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <FairyAvatar size="sm" variant="blue" className="shrink-0 mt-1 animate-fairy-wand" />
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}
              >
                <p className="text-pretty">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-3 justify-start">
              <FairyAvatar size="sm" variant="blue" className="shrink-0 animate-fairy-wand" />
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* 快捷问题 */}
        {messages.length <= 1 && !sending && (
          <Card className="p-4 mb-4 border-[#C59A3F]/20">
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <MessageCircleQuestion className="w-4 h-4 text-[#C59A3F]" />
              常见问题
            </div>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 text-sm rounded-full border border-border hover:border-[#C59A3F]/50 hover:bg-[#C59A3F]/5 transition-colors text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* 输入框 */}
        <div className="border-t pt-4 shrink-0">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('aiCustomerService.inputPlaceholder')}
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={sending || !input.trim()}
              className="bg-[#C59A3F] text-white hover:bg-[#C59A3F]/90 shrink-0 px-4"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI客服提供的信息仅供参考，不构成正式法律意见
          </p>
        </div>
      </div>
    </div>
  );
}
