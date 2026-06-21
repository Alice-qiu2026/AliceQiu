-- 用户角色枚举
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'premium');

-- 用户资料表
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  full_name text,
  role user_role NOT NULL DEFAULT 'user',
  free_reports_remaining int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 魔镜报告表
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  subject_info jsonb,
  risk_level text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'updating')),
  report_data jsonb,
  report_number text UNIQUE,
  version int NOT NULL DEFAULT 1,
  parent_report_id uuid REFERENCES public.reports(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 咨询表单表
CREATE TABLE public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  interests text[] NOT NULL DEFAULT '{}',
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- 自动同步用户到profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'::public.user_role
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- get_user_role辅助函数
CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

-- Profiles RLS策略
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM get_user_role(auth.uid()));

-- Reports RLS策略
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON reports
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to reports" ON reports
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Consultations RLS策略
CREATE POLICY "Anyone can submit consultations" ON consultations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Users can view their own consultations" ON consultations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to consultations" ON consultations
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- 公开视图
CREATE VIEW public_profiles AS
  SELECT id, role, full_name FROM profiles;

-- 报告编号生成函数
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  seq_num int;
  today_str text;
BEGIN
  today_str := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(split_part(report_number, '-', 3) AS int)), 0) + 1
  INTO seq_num
  FROM reports
  WHERE report_number LIKE '魔镜-' || today_str || '-%';
  RETURN '魔镜-' || today_str || '-' || lpad(seq_num::text, 4, '0');
END;
$$;