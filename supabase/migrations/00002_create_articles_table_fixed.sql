CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  cover_image text,
  wechat_url text NOT NULL,
  published_at timestamptz,
  category text DEFAULT '邱律文章',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS enabled
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 所有人可读
CREATE POLICY "anon_read_articles" ON articles FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_articles" ON articles FOR SELECT TO authenticated USING (true);

-- 管理员可写 (使用 get_user_role)
CREATE POLICY "admin_insert_articles" ON articles FOR INSERT TO authenticated WITH CHECK (get_user_role(uid()) = 'admin'::user_role);
CREATE POLICY "admin_update_articles" ON articles FOR UPDATE TO authenticated USING (get_user_role(uid()) = 'admin'::user_role) WITH CHECK (get_user_role(uid()) = 'admin'::user_role);
CREATE POLICY "admin_delete_articles" ON articles FOR DELETE TO authenticated USING (get_user_role(uid()) = 'admin'::user_role);

-- 插入初始文章数据（7篇公众号文章）
INSERT INTO articles (title, summary, wechat_url, published_at, sort_order) VALUES
('公众号文章 1', '点击查看邱律的公众号文章', 'https://mp.weixin.qq.com/s/o4NN_ueI4FLyKuUxXB_Giw', now(), 1),
('公众号文章 2', '点击查看邱律的公众号文章', 'https://mp.weixin.qq.com/s/o-KTFDDX6BbBAGI3BIPFfg', now(), 2),
('公众号文章 3', '点击查看邱律的公众号文章', 'https://mp.weixin.qq.com/s/xmNDO3E1W5pgNZv_C5ukpg', now(), 3),
('公众号文章 4', '点击查看邱律的公众号文章', 'https://mp.weixin.qq.com/s/mufwAhKrJxvdVOInUfanXA', now(), 4),
('公众号文章 5', '点击查看邱律的公众号文章', 'https://mp.weixin.qq.com/s/9hkQ_N65jHPRkhv39plbHA', now(), 5),
('公众号文章 6', '点击查看邱律的公众号文章', 'https://mp.weixin.qq.com/s/8bXu4O_kIR8z9h-eRUmxEg', now(), 6),
('公众号文章 7', '点击查看邱律的公众号文章', 'https://mp.weixin.qq.com/s/0i76BU-rsECZ6djnCHLK2Q', now(), 7);