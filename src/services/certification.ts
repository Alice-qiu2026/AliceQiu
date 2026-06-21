import { supabase } from '@/db/supabase';
import type { CertificationApplication } from '@/types/certification';

// 上传认证材料到 Supabase Storage
export async function uploadCertFile(
  file: File | Blob,
  folder: string,
  fileName?: string
): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const ext = file instanceof File ? (file.name.split('.').pop() || 'bin') : 'webm';
  const name = fileName || `${Date.now()}.${ext}`;
  const filePath = `${session.user.id}/${folder}/${name}`;

  const { error } = await supabase.storage
    .from('certification-files')
    .upload(filePath, file, { cacheControl: '3600', contentType: ext === 'webm' ? 'audio/webm' : undefined });

  if (error) {
    console.error('上传失败:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('certification-files')
    .getPublicUrl(filePath);

  return publicUrl;
}

// 提交认证申请
export async function submitCertification(
  values: Partial<CertificationApplication>
): Promise<{ success: boolean; data?: CertificationApplication; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: '未登录' };

  const { data, error } = await supabase
    .from('certification_applications')
    .insert({
      ...values,
      user_id: session.user.id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('提交失败:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// 查询用户的认证申请记录
export async function getUserCertifications(
  userId: string
): Promise<CertificationApplication[]> {
  const { data, error } = await supabase
    .from('certification_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('查询失败:', error);
    return [];
  }
  return data || [];
}

// ========== 管理员接口 ==========

// 获取所有认证申请（管理员用）
export async function getAllCertifications(): Promise<CertificationApplication[]> {
  const { data, error } = await supabase
    .from('certification_applications')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('管理员查询失败:', error);
    return [];
  }
  return (data || []).map((item: any) => ({
    ...item,
    applicant_name: item.profiles?.full_name,
    applicant_email: item.profiles?.email,
  })) as CertificationApplication[];
}

// 更新认证申请状态（管理员用）
export async function updateCertificationStatus(
  id: string,
  status: string,
  adminNote?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('certification_applications')
    .update({
      status,
      admin_note: adminNote || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('更新状态失败:', error);
    return false;
  }
  return true;
}
