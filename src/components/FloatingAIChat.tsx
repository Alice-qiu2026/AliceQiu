import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // DialogContent/Header/Title/Description/Footer retained for chat sheet
import FairyAvatar from '@/components/FairyAvatar';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Send,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function FloatingAIChat() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const currentLang = i18n.language;
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const assistantName = currentLang === 'zh' ? '家和小助手' : 'Blue Fairy';

  const quickQuestions = currentLang === 'zh'
    ? [
        '魔镜是什么功能？',
        '家和成长营怎么参加？',
        '家和协商室怎么使用？',
        '安心认证有什么等级？',
        '成为会员有什么权益？',
        '怎么联系邱律？',
      ]
    : [
        'What is Magic Mirror?',
        'How do I join Growth Camp?',
        'How does JiaHe Mediation Room work?',
        'What are Peace of Mind Certification levels?',
        'What are the membership benefits?',
        'How do I contact Attorney Alice Qiu?',
      ];

  const welcomeMsg = currentLang === 'zh'
    ? `嗨，欢迎来到跨境家和 😊
我是【家和小助手】，叫我小家就好。
我在这里，帮助跨境家庭解决他们关心的事——
不管是一个小小的困惑，还是想了很久的问题。
今天是什么让您来到这里的？
💡 如果您想快速开始，这里有常用入口：
【🎯 立即体验魔镜】【✅ 申请安心认证】
【🏕️ 查看成长营】【📅 预约邱律咨询】【💎 成为会员】
或者——直接告诉我您在担心什么，我们一起想办法 😊`
    : `Hi, I'm Blue Fairy, your CrossBorder JiaHe assistant. How can I help you today?

💡 Quick start:
【🎯 Try Magic Mirror】【✅ Peace of Mind Certification】
【🏕️ Growth Camp】【📅 Book a Consultation】【💎 Join Us】

Or just tell me what's on your mind — we're here to help! 😊`;

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeMsg,
        timestamp: new Date(),
      },
    ]);
  }, [currentLang, welcomeMsg]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

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

  const handleOpen = () => {
    setOpen(true);
  };

  const placeholderText = currentLang === 'zh' ? '输入您的问题...' : 'Type your question...';
  const loginPrompt = currentLang === 'zh' ? '登录后即可与Blue Fairy对话' : 'Log in to chat with Blue Fairy';
  const loginLink = currentLang === 'zh' ? '点击登录 →' : 'Log in →';

  return (
    <>
      {/* 右下角浮动按钮 */}
      {!open && (
        <button
          onClick={handleOpen}
          title={assistantName}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 rounded-full shadow-2xl hover:shadow-primary/30 hover:scale-110 transition-all duration-300 p-0 border-0 bg-transparent"
        >
          <img
            src="https://miaoda-conversation-file.cdn.bcebos.com/user-buketv2zz56o/app-cc2fqeuowe81/20260616/image_1781610597159.png"
            alt={assistantName}
            className="w-16 h-16 rounded-full object-cover"
          />
        </button>
      )}

      {/* 关闭按钮（打开状态时） */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* 聊天窗口 — 右下角固定 */}
      {open && (
        <Card className="fixed bottom-16 right-4 md:bottom-20 md:right-6 z-50 w-[90vw] max-w-[380px] h-[500px] flex flex-col shadow-2xl border-border overflow-hidden">
          {/* 头部 */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shrink-0">
            <FairyAvatar size="lg" variant="blue" className="animate-fairy-float" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold">{assistantName}</h3>
              <p className="text-xs opacity-70">
                {currentLang === 'zh' ? '跨境家和智能助手' : 'CrossBorder JiaHe Assistant'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-primary-foreground/20 rounded-full transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 消息区域 */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-background"
          >
            {/* 快捷问题 */}
            {messages.length === 1 && messages[0].id === 'welcome' && (
              <div className="flex flex-wrap gap-2 mb-2">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border border-border"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <FairyAvatar size="sm" variant="blue" className="shrink-0 mt-1" />
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  <p className="text-pretty whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex gap-2 justify-start">
                <FairyAvatar size="sm" variant="blue" className="shrink-0" />
                <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <div className="p-3 border-t border-border shrink-0 bg-background">
            {!user ? (
              <div className="text-center py-1">
                <p className="text-xs text-muted-foreground mb-2">{loginPrompt}</p>
                <Link to="/auth/login" className="text-xs text-primary hover:underline font-medium">
                  {loginLink}
                </Link>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                  disabled={sending}
                  className="flex-1 text-sm h-9"
                />
                <Button
                  size="sm"
                  onClick={() => sendMessage(input)}
                  disabled={sending || !input.trim()}
                  className="h-9 px-3 shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
