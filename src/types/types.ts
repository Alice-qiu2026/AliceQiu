export type UserRole = 'user' | 'admin' | 'premium';

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  role: UserRole;
  free_reports_remaining: number;
  invite_code: string | null;
  invited_by: string | null;
  membership_type: 'free' | 'standard' | 'premium';
  membership_expires_at: string | null;
  renewal_reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  inviter_id: string;
  invitee_id: string;
  invite_code: string;
  reward_triggered: boolean;
  created_at: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'updating';

export interface Report {
  id: string;
  user_id: string;
  subject_name: string;
  subject_info: Record<string, string> | null;
  risk_level: RiskLevel;
  status: ReportStatus;
  report_data: ReportData | null;
  report_number: string;
  version: number;
  parent_report_id: string | null;
  created_at: string;
  updated_at: string;
}

/** 上传文件分析结果 */
export interface UploadedFileResult {
  name: string;
  summary: string; // 200字以内核心内容描述
  extracted: boolean; // 是否成功提取文字
}

/** 单平台搜索结果 */
export interface PlatformSearchResult {
  id: string;
  name: string;
  query: string; // 实际搜索关键词
  status: 'completed' | 'no_results' | 'limited' | 'failed';
  findings: {
    title: string;
    url: string;
    snippet: string;
  }[];
}

export interface ReportData {
  identityVerification: {
    name: string;
    age: string;
    occupation: string;
    location: string;
    nationality: string;
  };
  riskSignals: {
    category: string;
    level: RiskLevel;
    description: string;
  }[];
  overallRating: string;
  recommendations: string[];
  actionChecklist: {
    online: string[];
    proactive: string[];
    onsite: string[];
  };
  /** 上传文件分析（可选，新版） */
  uploadedFiles?: UploadedFileResult[];
  /** 各平台实际搜索结果（可选，新版） */
  searchResults?: PlatformSearchResult[];
  /** 旧版兼容参考资料 */
  references?: { platform: string; title: string; url: string }[];
}

export interface Consultation {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  interests: string[];
  message: string | null;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string | null;
  cover_image: string | null;
  wechat_url: string;
  published_at: string | null;
  category: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}