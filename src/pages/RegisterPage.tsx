import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  // 从 URL 参数读取邀请码
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setInviteCode(ref.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      toast.error(t('register.fillAll'));
      return;
    }
    if (!agreed) {
      toast.error(t('register.agreeRequired'));
      return;
    }
    setLoading(true);
    const { error } = await signUpWithEmail(email, password, name, phone, inviteCode);
    setLoading(false);
    if (error) {
      toast.error(error.message || t('register.registerFail'));
    } else {
      toast.success(t('register.registerSuccess'));
      navigate('/member');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl mb-2">🌸</div>
          <CardTitle className="text-xl">{t('register.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">👤 {t('register.name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('register.namePlaceholder')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">📧 {t('register.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('register.emailPlaceholder')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">📞 {t('register.phone')} *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('register.phonePlaceholder')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">🔒 {t('register.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('register.passwordPlaceholder')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="inviteCode">🎁 {t('register.inviteCode')}</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder={t('register.inviteCodePlaceholder')}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('register.inviteTip')}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="agree" className="text-sm text-muted-foreground leading-relaxed">
                {t('register.agree')}
                <span className="text-primary cursor-pointer hover:underline">{t('register.userAgreement')}</span>
                和
                <span className="text-primary cursor-pointer hover:underline">{t('register.privacyPolicy')}</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('register.registering')}...</> : t('register.registerBtn')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {t('register.hasAccount')}
            <Link to="/auth/login" className="text-primary hover:underline ml-1">
              {t('register.loginNow')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}