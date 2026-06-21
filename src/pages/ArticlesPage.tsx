import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Calendar, BookOpen } from 'lucide-react';
import { supabase } from '@/db/supabase';
import type { Article } from '@/types/types';
import { useTranslation } from 'react-i18next';

export default function ArticlesPage() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('获取文章失败:', error);
      } else {
        setArticles(data ?? []);
      }
      setLoading(false);
    }

    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部横幅 */}
      <section className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#C59A3F]/20 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-[#C59A3F]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">邱律文章</h1>
          <p className="opacity-80 max-w-lg mx-auto">
            邱律在公众号发布的法律文化文章，帮助跨境家庭理解加拿大法律，守护家庭和谐。
          </p>
        </div>
      </section>

      {/* 文章列表 */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-full">
                  <CardContent className="p-5">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>暂无文章，敬请期待</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className="h-full flex flex-col hover:border-[#C59A3F]/50 transition-colors"
                >
                  <CardContent className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-primary text-base md:text-lg mb-2 leading-snug text-balance">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed text-pretty">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {article.published_at
                          ? new Date(article.published_at).toLocaleDateString('zh-CN')
                          : '近期发布'}
                      </div>
                      <a
                        href={article.wechat_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#C59A3F] hover:bg-[#C59A3F]/10 h-8 px-3"
                        >
                          {t('articles.readMore')}
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 提示 */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>文章同步自邱律微信公众号，点击卡片即可阅读原文</p>
        </div>
      </section>
    </div>
  );
}
