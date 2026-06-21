
-- 1. 创建缺失的 report_number_counters 表
CREATE TABLE IF NOT EXISTS public.report_number_counters (
  date_str   text PRIMARY KEY,
  seq_num    integer NOT NULL DEFAULT 0
);

-- 2. 重建函数为 SECURITY DEFINER，确保任何调用者都有权操作计数表
CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_str text;
  seq_num int;
BEGIN
  today_str := to_char(now(), 'YYYYMMDD');

  INSERT INTO public.report_number_counters (date_str, seq_num)
  VALUES (today_str, 1)
  ON CONFLICT (date_str)
  DO UPDATE SET seq_num = report_number_counters.seq_num + 1
  RETURNING seq_num INTO seq_num;

  RETURN '魔镜-' || today_str || '-' || lpad(seq_num::text, 4, '0');
END;
$$;

-- 3. 授权 authenticated 与 anon 角色可以调用
GRANT EXECUTE ON FUNCTION public.generate_report_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_report_number() TO anon;
