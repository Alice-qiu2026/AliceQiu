import { useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Loader2, Mic, MicOff, Play, Square, RotateCcw, Shield, ShieldCheck, Crown } from 'lucide-react';
import { uploadCertFile, submitCertification } from '@/services/certification';
import type { CertificationLevel } from '@/types/certification';
import { useTranslation } from 'react-i18next';

const levelOptions: { key: CertificationLevel; label: string; price: string; desc: string; icon: typeof Shield; color: string }[] = [
  { key: 'basic', label: '基础认证', price: '¥699', desc: 'AI初审 + 基础人工 · 12个月', icon: Shield, color: '#3498db' },
  { key: 'standard', label: '标准认证', price: '¥399', desc: 'AI + 完整人工复核 · 12个月', icon: ShieldCheck, color: '#2980b9' },
  { key: 'gold', label: '金牌认证', price: '免费1次', desc: 'AI + 高级人工 + 深度背景 · 24个月', icon: Crown, color: '#D4AF37' },
];

interface UploadField {
  key: string;
  label: string;
  required: boolean;
  acceptedTypes: string;
}

const uploadFields: UploadField[] = [
  { key: 'id_document_url', label: '身份证 / 护照', required: true, acceptedTypes: 'image/*,application/pdf' },
  { key: 'marriage_certificate_url', label: '婚姻状况证明（如适用）', required: false, acceptedTypes: 'image/*,application/pdf' },
  { key: 'asset_proof_url', label: '资产证明文件', required: false, acceptedTypes: 'image/*,application/pdf' },
  { key: 'no_crime_record_url', label: '无犯罪记录证明', required: false, acceptedTypes: 'image/*,application/pdf' },
];

export default function CertificationApplyPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const defaultLevel = (searchParams.get('level') as CertificationLevel) || 'basic';
  const [level, setLevel] = useState<CertificationLevel>(defaultLevel);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [idType, setIdType] = useState<'passport' | 'id_card'>('passport');
  const [idNumber, setIdNumber] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<string>('');
  const [questionnaire, setQuestionnaire] = useState('');
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 语音录音状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceUploaded, setVoiceUploaded] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const selectedLevel = levelOptions.find((l) => l.key === level)!;

  const handleFileChange = async (fieldKey: string, file: File | null) => {
    if (!file) return;
    setUploadingKey(fieldKey);
    const url = await uploadCertFile(file, fieldKey);
    setUploadingKey(null);
    if (url) {
      setUploads((prev) => ({ ...prev, [fieldKey]: url }));
      toast.success('上传成功');
    } else {
      toast.error('上传失败');
    }
  };

  // ========== 语音录音 ==========
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // 自动上传
        setUploadingKey('voice');
        const uploadUrl = await uploadCertFile(blob, 'voice_note_url', `voice_${Date.now()}.webm`);
        setUploadingKey(null);
        if (uploadUrl) {
          setUploads((prev) => ({ ...prev, voice_note_url: uploadUrl }));
          setVoiceUploaded(true);
          toast.success('语音自述已保存');
        } else {
          toast.error('语音上传失败');
        }
        // 停止所有轨道
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      toast.error('无法访问麦克风：' + (err.message || '请检查权限设置'));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setVoiceUploaded(false);
    setRecordSeconds(0);
    setUploads((prev) => {
      const next = { ...prev };
      delete next.voice_note_url;
      return next;
    });
  }, [audioUrl]);

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t('common.login'));
      navigate('/auth/login');
      return;
    }
    if (!fullName.trim() || !idNumber.trim()) {
      toast.error(t('register.fillAll'));
      return;
    }
    const requiredUpload = uploadFields.find((f) => f.required && !uploads[f.key]);
    if (requiredUpload) {
      toast.error(`请上传：${requiredUpload.label}`);
      return;
    }

    setSubmitting(true);
    const result = await submitCertification({
      level,
      full_name: fullName.trim(),
      id_type: idType,
      id_number: idNumber.trim(),
      marital_status: (maritalStatus as any) || null,
      relationship_questionnaire: questionnaire.trim() || null,
      ...uploads,
    });
    setSubmitting(false);

    if (result.success) {
      toast.success(t('certification.applySuccess'));
      navigate('/certification');
    } else {
      toast.error(result.error || '提交失败');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部 */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <button
            onClick={() => navigate('/certification')}
            className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回安心认证
          </button>
          <h1 className="text-2xl font-bold">🔐 提交安心认证申请</h1>
          <p className="text-sm opacity-80 mt-1">
            请如实填写信息并上传所需材料，审核通常在 1-3 个工作日内完成
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl py-8 space-y-6">
        {/* 认证等级选择 */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-base font-bold text-primary mb-4">选择认证等级</h2>
            <div className="grid grid-cols-3 gap-3">
              {levelOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setLevel(opt.key)}
                  className={`rounded-xl border-2 p-3 text-center transition-all ${
                    level === opt.key
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <opt.icon className="w-6 h-6 mx-auto mb-1" style={{ color: opt.color }} />
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: opt.color }}>{opt.price}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {t('common.selected')}: {selectedLevel.label} · {selectedLevel.desc}
            </p>
          </CardContent>
        </Card>

        {/* 基本信息 */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-base font-bold text-primary">基本信息</h2>
            <div>
              <Label htmlFor="fullName">真实姓名 *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('register.namePlaceholder')}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>证件类型 *</Label>
                <div className="flex gap-2 mt-1">
                  {(['passport', 'id_card'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setIdType(t)}
                      className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                        idType === t
                          ? 'border-primary bg-primary/5 font-medium'
                          : 'border-border bg-card hover:border-muted-foreground/30'
                      }`}
                    >
                      {t === 'passport' ? '护照' : '身份证'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="idNumber">证件号码 *</Label>
                <Input
                  id="idNumber"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={t('admin.certification.certNumber')}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>婚姻状况</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { value: 'single', label: '未婚' },
                  { value: 'married', label: '已婚' },
                  { value: 'divorced', label: '离异' },
                  { value: 'widowed', label: '丧偶' },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setMaritalStatus(s.value)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                      maritalStatus === s.value
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 关系透明问卷 */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-base font-bold text-primary">关系透明问卷</h2>
            <p className="text-sm text-muted-foreground">
              请简要描述您的关系背景、主要担忧和希望获得的支持。这些信息将帮助我们更好地理解您的需求。
            </p>
            <Textarea
              value={questionnaire}
              onChange={(e) => setQuestionnaire(e.target.value)}
              placeholder="例如：我正准备与一位加拿大籍人士结婚，想了解对方在国内是否有未公开的婚姻或法律纠纷..."
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        {/* 语音自述 */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-primary">语音自述（可选）</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              用语音更自然地讲述您的故事。录制一段 1-3 分钟的自述，帮助我们更全面地了解您的情况。
            </p>

            {!audioUrl && !isRecording && !voiceUploaded && (
              <button
                onClick={startRecording}
                className="w-full py-6 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center gap-2"
              >
                <Mic className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium text-primary">点击开始录音</span>
                <span className="text-xs text-muted-foreground">支持 1-3 分钟语音自述</span>
              </button>
            )}

            {isRecording && (
              <div className="rounded-xl border-2 border-red-400 bg-red-50 p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  <span className="text-lg font-bold text-red-600">{formatSeconds(recordSeconds)}</span>
                </div>
                <p className="text-sm text-red-600 mb-3">正在录音...</p>
                <Button onClick={stopRecording} variant="outline" className="border-red-400 text-red-600 hover:bg-red-100">
                  <Square className="w-4 h-4 mr-1" />
                  {t('certification.stopRecord')}
                </Button>
              </div>
            )}

            {audioUrl && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <audio ref={audioPlayerRef} src={audioUrl} controls className="w-full h-10" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetRecording}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    {t('certification.reRecord')}
                  </Button>
                  {voiceUploaded ? (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1 px-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t('common.saved')}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 px-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      保存中...
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 材料上传 */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-base font-bold text-primary">材料上传</h2>
            <p className="text-sm text-muted-foreground">
              请上传清晰的扫描件或照片（支持 JPG、PNG、PDF，单文件最大 10MB）
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {uploadFields.map((field) => (
                <div key={field.key} className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </Label>
                    {uploads[field.key] && (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" />已上传
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept={field.acceptedTypes}
                    ref={(el) => { fileInputRefs.current[field.key] = el; }}
                    onChange={(e) => handleFileChange(field.key, e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={uploadingKey === field.key}
                    onClick={() => fileInputRefs.current[field.key]?.click()}
                  >
                    {uploadingKey === field.key ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : uploads[field.key] ? (
                      <ShieldCheck className="w-4 h-4 mr-1" />
                    ) : (
                      <Upload className="w-4 h-4 mr-1" />
                    )}
                    {uploads[field.key] ? '重新上传' : '点击上传'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 提交 */}
        <div className="space-y-3 pb-8">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            {t('certification.submitAgree')}
            {t('certification.privacyNote')}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary/90"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                提交中...
              </>
            ) : (
              '提交申请'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
