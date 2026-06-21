import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenFound, setTokenFound] = useState(false);

  useEffect(() => {
    // Supabase password reset tokens are in the URL hash or query params
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : '');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken || searchParams.get('token')) {
      setTokenFound(true);
    }
  }, [searchParams]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('密码至少需要6个字符');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('密码重置成功！请使用新密码登录');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      toast.error(error.message || '重置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-3xl mb-2">🔑</div>
          <CardTitle>设置新密码</CardTitle>
          <CardDescription>请输入您的新密码</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label htmlFor="new-password">新密码</Label>
              <Input id="new-password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少6个字符" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirm-password">确认密码</Label>
              <Input id="confirm-password" type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码" className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '重置中...' : '确认重置'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
