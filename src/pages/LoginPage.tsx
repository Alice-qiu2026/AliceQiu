import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { t } = useTranslation();
  const { signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('login.fillRequired'));
      return;
    }
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message || t('login.loginFail'));
    } else {
      toast.success(t('login.loginSuccess'));
      navigate('/member');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl mb-2">⚖️</div>
          <CardTitle className="text-xl">{t('login.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">📧 {t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">🔒 {t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('login.loggingIn')}...</> : t('login.loginBtn')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {t('login.noAccount')}
            <Link to="/auth/register" className="text-primary hover:underline ml-1">
              {t('login.registerNow')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}