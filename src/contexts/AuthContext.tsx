import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/types';
import { toast } from 'sonner';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
  return data;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, phone?: string, inviteCode?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const profileData = await getProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          getProfile(session.user.id).then(setProfile);
        }
      })
      .catch((error) => {
        toast.error(`获取用户信息失败: ${error.message}`);
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, phone?: string, inviteCode?: string) => {
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone: phone || '', invite_code: inviteCode || '' },
        },
      });
      if (error) throw error;

      // 注册成功后处理邀请码
      if (signUpData.user && inviteCode) {
        try {
          // 查找邀请人
          const { data: inviter } = await supabase
            .from('profiles')
            .select('id')
            .eq('invite_code', inviteCode.toUpperCase())
            .single();

          if (inviter) {
            // 生成自己的邀请码
            const myCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            // 更新自己的 profile
            await supabase.from('profiles').update({
              invite_code: myCode,
              invited_by: inviter.id,
            }).eq('id', signUpData.user.id);

            // 创建邀请记录
            await supabase.from('invitations').insert({
              inviter_id: inviter.id,
              invitee_id: signUpData.user.id,
              invite_code: inviteCode.toUpperCase(),
              reward_triggered: false,
            });
          }
        } catch (e) {
          console.error('处理邀请码失败:', e);
        }
      } else if (signUpData.user) {
        // 没有邀请码也生成自己的邀请码
        const myCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase.from('profiles').update({
          invite_code: myCode,
        }).eq('id', signUpData.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithEmail, signUpWithEmail, signOut, refreshProfile, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
