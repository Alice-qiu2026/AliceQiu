import { supabase } from '@/db/supabase';
import type { Report, Consultation, ReportData } from '@/types/types';

// 订单类型定义
export interface Order {
  id: string;
  order_no: string;
  user_id: string;
  status: string;
  wechat_pay_url: string | null;
  alipay_pay_url: string | null;
  pay_type: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

// 调用 Edge Function 创建微信支付订单
export async function createPaymentOrder(skuCode: string, quantity: number = 1): Promise<{ success: boolean; order?: Order; wechat_pay_url?: string; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: '请先登录' };
    }

    const { data, error } = await supabase.functions.invoke('create_payment_order', {
      body: { sku_code: skuCode, quantity },
    });

    if (error || !data?.success) {
      return { success: false, error: error?.message || data?.error || '创建订单失败' };
    }

    return {
      success: true,
      order: {
        id: data.order_id,
        order_no: data.order_no,
        user_id: session.user.id,
        status: 'pending',
        wechat_pay_url: data.wechat_pay_url,
        alipay_pay_url: null,
        pay_type: 'wechat',
        total_amount: data.total_amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      wechat_pay_url: data.wechat_pay_url,
    };
  } catch (err: any) {
    return { success: false, error: err.message || '网络错误' };
  }
}

// 调用 Edge Function 创建支付宝支付订单
export async function createAlipayOrder(skuCode: string, quantity: number = 1): Promise<{ success: boolean; order?: Order; alipay_pay_url?: string; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: '请先登录' };
    }

    const { data, error } = await supabase.functions.invoke('create_alipay_order', {
      body: { sku_code: skuCode, quantity },
    });

    if (error || !data?.success) {
      return { success: false, error: error?.message || data?.error || '创建支付宝订单失败' };
    }

    return {
      success: true,
      order: {
        id: data.order_id,
        order_no: data.order_no,
        user_id: session.user.id,
        status: 'pending',
        wechat_pay_url: null,
        alipay_pay_url: data.alipay_pay_url,
        pay_type: 'alipay',
        total_amount: data.total_amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      alipay_pay_url: data.alipay_pay_url,
    };
  } catch (err: any) {
    return { success: false, error: err.message || '网络错误' };
  }
}

// 查询用户订单列表
export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取订单列表失败:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

// 查询订单详情
export async function getOrderByNo(orderNo: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_no', orderNo)
    .maybeSingle();

  if (error) {
    console.error('获取订单详情失败:', error);
    return null;
  }
  return data;
}

// 查询用户的邀请记录
export async function getUserInvitations(userId: string): Promise<{ count: number; rewarded: number; pending: number }> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('inviter_id', userId);

  if (error) {
    console.error('获取邀请记录失败:', error);
    return { count: 0, rewarded: 0, pending: 0 };
  }

  const invitations = Array.isArray(data) ? data : [];
  const rewarded = invitations.filter((i) => i.reward_triggered).length;
  return {
    count: invitations.length,
    rewarded,
    pending: invitations.length - rewarded,
  };
}

// 报告相关API
export async function getUserReports(userId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('获取报告列表失败:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getReportById(reportId: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle();

  if (error) {
    console.error('获取报告详情失败:', error);
    return null;
  }
  return data;
}

export async function createReport(
  userId: string,
  subjectName: string,
  subjectInfo: Record<string, string>,
  riskLevel: string,
  reportData: ReportData
): Promise<Report | null> {
  // 使用原子递增的数据库函数生成唯一报告编号
  const { data: numData } = await supabase.rpc('generate_report_number');
  const reportNumber = numData || `魔镜-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now()}`;

  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      subject_name: subjectName,
      subject_info: subjectInfo,
      risk_level: riskLevel,
      status: 'completed',
      report_data: reportData,
      report_number: reportNumber,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('创建报告失败:', error);
    return null;
  }
  return data;
}

export async function updateReport(reportId: string, updates: Partial<Report>): Promise<boolean> {
  const { error } = await supabase
    .from('reports')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', reportId);

  if (error) {
    console.error('更新报告失败:', error);
    return false;
  }
  return true;
}

// 咨询表单API
export async function submitConsultation(consultation: Omit<Consultation, 'id' | 'created_at'>): Promise<boolean> {
  const { error } = await supabase
    .from('consultations')
    .insert(consultation);

  if (error) {
    console.error('提交咨询失败:', error);
    return false;
  }
  return true;
}

// 用户资料API
export async function updateFreeReports(userId: string, count: number): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ free_reports_remaining: count })
    .eq('id', userId);

  if (error) {
    console.error('更新免费次数失败:', error);
    return false;
  }
  return true;
}