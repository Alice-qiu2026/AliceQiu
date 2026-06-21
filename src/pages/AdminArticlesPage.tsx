import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/db/supabase';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  ExternalLink,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Article } from '@/types/types';
import { useTranslation } from 'react-i18next';

type ArticleForm = {
  title: string;
  summary: string;
  cover_image: string;
  wechat_url: string;
  published_at: string;
  sort_order: string;
};

const emptyForm: ArticleForm = {
  title: '',
  summary: '',
  cover_image: '',
  wechat_url: '',
  published_at: '',
  sort_order: '0',
};

export default function AdminArticlesPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  // 管理员权限检查
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      toast.error('无权访问');
      navigate('/');
      return;
    }
    loadArticles();
  }, [profile]);

  const loadArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      toast.error('加载文章失败：' + error.message);
    } else {
      setArticles(data ?? []);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      summary: article.summary ?? '',
      cover_image: article.cover_image ?? '',
      wechat_url: article.wechat_url,
      published_at: article.published_at
        ? new Date(article.published_at).toISOString().split('T')[0]
        : '',
      sort_order: String(article.sort_order),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.wechat_url.trim()) {
      toast.error(t('admin.articles.titleRequired'));
      return;
    }
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      cover_image: form.cover_image.trim() || null,
      wechat_url: form.wechat_url.trim(),
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };

    if (editingId) {
      const { error } = await supabase.from('articles').update(payload).eq('id', editingId);
      if (error) {
        toast.error('更新失败：' + error.message);
      } else {
        toast.success(t('admin.articles.updateSuccess'));
        setDialogOpen(false);
        loadArticles();
      }
    } else {
      const { error } = await supabase.from('articles').insert(payload);
      if (error) {
        toast.error('添加失败：' + error.message);
      } else {
        toast.success(t('admin.articles.addSuccess'));
        setDialogOpen(false);
        loadArticles();
      }
    }

    setSaving(false);
  };

  const confirmDelete = (article: Article) => {
    setDeleteTarget(article);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    const { error } = await supabase.from('articles').delete().eq('id', deleteTarget.id);
    setDeleting(null);
    setConfirmOpen(false);
    if (error) {
      toast.error('删除失败：' + error.message);
    } else {
      toast.success(t('admin.articles.deleteSuccess'));
      loadArticles();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部 */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('common.back')}
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C59A3F]/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#C59A3F]" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">文章管理</h1>
                <p className="text-sm opacity-70">管理员后台 · 公众号文章发布与编辑</p>
              </div>
            </div>
            <Button
              onClick={openAdd}
              className="bg-[#C59A3F] text-white hover:bg-[#C59A3F]/90 shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('admin.articles.addBtn')}
            </Button>
          </div>
        </div>
      </section>

      {/* 文章列表 */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>暂无文章</p>
              <Button onClick={openAdd} variant="ghost" className="mt-3 text-[#C59A3F]">
                <Plus className="w-4 h-4 mr-1" />
                {t('admin.articles.addFirst')}
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 text-sm font-bold whitespace-nowrap">排序</th>
                      <th className="text-left px-4 py-3 text-sm font-bold whitespace-nowrap">标题</th>
                      <th className="text-left px-4 py-3 text-sm font-bold whitespace-nowrap hidden md:table-cell">摘要</th>
                      <th className="text-left px-4 py-3 text-sm font-bold whitespace-nowrap hidden md:table-cell">发布时间</th>
                      <th className="text-right px-4 py-3 text-sm font-bold whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article) => (
                      <tr key={article.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{article.sort_order}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm whitespace-nowrap">{article.title}</span>
                            <a
                              href={article.wechat_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#C59A3F] hover:opacity-70"
                              title="查看原文"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell max-w-xs truncate">
                          {article.summary || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {article.published_at
                              ? new Date(article.published_at).toLocaleDateString('zh-CN')
                              : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                              onClick={() => openEdit(article)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => confirmDelete(article)}
                              disabled={deleting === article.id}
                            >
                              {deleting === article.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* 添加/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-balance">
              {editingId ? '编辑文章' : '添加文章'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>标题 <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="文章标题"
                className="mt-1"
              />
            </div>
            <div>
              <Label>公众号链接 <span className="text-destructive">*</span></Label>
              <Input
                value={form.wechat_url}
                onChange={(e) => setForm({ ...form, wechat_url: e.target.value })}
                placeholder="https://mp.weixin.qq.com/s/..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>摘要</Label>
              <Textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="文章摘要（可选）"
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label>封面图URL</Label>
              <Input
                value={form.cover_image}
                onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                placeholder={t('admin.articles.imageLink')}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>发布时间</Label>
                <Input
                  type="date"
                  value={form.published_at}
                  onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>排序</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  placeholder="数字越小越靠前"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#C59A3F] text-white hover:bg-[#C59A3F]/90"
              >
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {editingId ? '保存修改' : '添加文章'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-balance">确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            确定要删除文章「{deleteTarget?.title}」吗？此操作不可撤销。
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
