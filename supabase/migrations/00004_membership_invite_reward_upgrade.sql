
-- 1. profiles 新增字段
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bonus_reports integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_free_minutes_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_free_minutes_reset_at timestamptz;

-- 2. invitations 新增 rewarded_at
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS rewarded_at timestamptz;

-- 3. 新增会员 SKU（如已存在则跳过）
INSERT INTO public.sku (sku_code, name, price) VALUES
  ('member-standard-monthly', '普通会员月付', 249.00),
  ('member-standard-yearly',  '普通会员年付', 2999.00),
  ('member-premium-monthly',  '高级会员月付', 599.00),
  ('member-premium-yearly',   '高级会员年付', 5999.00)
ON CONFLICT (sku_code) DO NOTHING;

-- 4. 创建 grant_invite_reward 函数（SECURITY DEFINER，Webhook service-key 调用）
CREATE OR REPLACE FUNCTION public.grant_invite_reward(
  p_invitee_id uuid,
  p_new_membership text  -- 'standard' | 'premium'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inviter_id        uuid;
  v_inviter_tier      text;
  v_invite_rewarded   boolean;
BEGIN
  -- 找邀请关系
  SELECT invited_by INTO v_inviter_id
  FROM profiles WHERE id = p_invitee_id;

  IF v_inviter_id IS NULL THEN
    RETURN; -- 没有邀请人，直接返回
  END IF;

  -- 检查奖励是否已触发
  SELECT reward_triggered INTO v_invite_rewarded
  FROM invitations
  WHERE invitee_id = p_invitee_id AND inviter_id = v_inviter_id
  ORDER BY created_at DESC LIMIT 1;

  IF v_invite_rewarded IS TRUE THEN
    RETURN; -- 已奖励，幂等保护
  END IF;

  -- 获取邀请人当前会员等级
  SELECT membership_type INTO v_inviter_tier
  FROM profiles WHERE id = v_inviter_id;

  -- 按邀请人等级发放奖励
  IF v_inviter_tier = 'free' OR v_inviter_tier IS NULL THEN
    -- 免费会员：+5 份魔镜报告（bonus_reports 和 free_reports_remaining 同步加）
    UPDATE profiles
    SET bonus_reports          = bonus_reports + 5,
        free_reports_remaining = free_reports_remaining + 5,
        updated_at             = now()
    WHERE id = v_inviter_id;

  ELSIF v_inviter_tier = 'standard' THEN
    -- 普通会员：延长1个月普通会员资格
    UPDATE profiles
    SET membership_expires_at = GREATEST(membership_expires_at, now())
                                  + INTERVAL '1 month',
        updated_at            = now()
    WHERE id = v_inviter_id;

  ELSIF v_inviter_tier = 'premium' THEN
    -- 高级会员：延长1个月高级会员资格
    UPDATE profiles
    SET membership_expires_at = GREATEST(membership_expires_at, now())
                                  + INTERVAL '1 month',
        updated_at            = now()
    WHERE id = v_inviter_id;
  END IF;

  -- 标记奖励已触发
  UPDATE invitations
  SET reward_triggered = true,
      rewarded_at      = now()
  WHERE invitee_id = p_invitee_id
    AND inviter_id = v_inviter_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_invite_reward(uuid, text) TO service_role;
