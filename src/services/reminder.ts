import { supabase } from '@/db/supabase';

/**
 * 触发会员到期提醒（调用 Edge Function）
 * @param userId 可选，指定用户ID；不传则处理所有到期用户（仅管理员可用）
 */
export async function sendRenewalReminder(userId?: string): Promise<{
  success: boolean;
  message?: string;
  count?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('send-renewal-reminder', {
      body: userId ? { user_id: userId } : {},
    });

    if (error) {
      console.error('调用 Edge Function 失败:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: data.message,
      count: data.count,
    };
  } catch (err: any) {
    console.error('发送提醒异常:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 查询用户的提醒记录
 */
export async function getUserReminders(userId: string) {
  const { data, error } = await supabase
    .from('renewal_reminders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('查询提醒记录失败:', error);
    return [];
  }
  return data || [];
}

/**
 * 重置提醒状态（续费后调用）
 */
export async function resetReminderStatus(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ renewal_reminder_sent: false })
    .eq('id', userId);

  if (error) {
    console.error('重置提醒状态失败:', error);
    return false;
  }
  return true;
}
