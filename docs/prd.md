# 需求文档

## 1. 应用概述

### 1.1 应用名称
跨境家和官网 / CROSSBORDER JIAHE

### 1.2 应用描述
跨境家和是连接跨境华人家庭与加拿大持牌专业律师的引荐平台，由资深律师邱律创立。平台提供三大核心服务：魔镜（AI风险识别工具）、家和成长营（文化教育社群）、家和协商室（律师引荐+智能匹配），帮助跨境家庭了解加拿大法律文化，预防文化误解，连接专业律师资源，守护家庭和谐。

### 1.3 品牌信息
- 品牌口号：跨境家庭·和谐共生 / 让跨境家庭更幸福
- 品牌色：深蓝 #1E3A5F + 金色 #D4AF37
- 核心定位：加拿大持牌律师引荐平台，非直接法律服务机构
- 参考网站：https://crossborder-qs6hjuwv.manus.space

---

## 2. 用户与使用场景

### 2.1 目标用户
- 移民加拿大的华人家庭
- 面临跨国婚恋或商务交流的个人
- 需要了解加拿大家庭法律文化的跨境人士
- 寻求持牌专业律师服务的跨境人群

### 2.2 核心使用场景
- 了解跨境家和的服务内容与品牌理念
- 使用魔镜工具进行跨境关系风险识别
- 预约免费咨询或参与家和成长营活动
- 通过平台匹配并联系持牌专业律师
- 查看历史魔镜报告并补充新证据更新报告
- 切换中英文语言浏览网站内容
- 使用AI小助手获取信息引导
- 查看会员权益并选择升级会员套餐

---

## 3. 页面结构与功能说明

### 3.1 页面结构树
```
跨境家和官网
├── 首页（/）
│   ├── 区块1：顶部导航栏
│   ├── 区块2：Hero区域
│   ├── 区块3：我们的使命
│   ├── 区块4：真实案例
│   ├── 区块5：三大核心服务
│   ├── 区块6：引荐平台信任体系
│   ├── 区块7：为什么选择跨境家和
│   ├── 区块8：FAQ常见问题
│   ├── 区块9：联系我们
│   └── 区块10：Footer页脚
├── 关于邱律页（/about-alice）
├── 魔镜功能页（/magic-mirror）
│   ├── 顶部Banner
│   ├── 用户输入区
│   ├── 实时搜索进度展示区
│   └── 注册弹窗（游客触发）
├── 报告详情页（/magic-mirror/report/:id）
├── 会员中心（/member）
├── 会员体系页（/membership）
├── 登录页（/auth/login）
├── 注册页（/auth/register）
└── AI小助手（全局浮动组件）
```

### 3.2 首页功能说明

#### 3.2.1 区块1：顶部导航栏
- 左侧展示Logo「跨境家和」+「CROSSBORDER JIAHE」
- 中间展示导航菜单（中文字号加大两级）：首页、魔镜、会员、家和成长营、AI调解、安心认证、关于邱律、联系我们
- 右侧展示功能按钮：
  + ☆ 免费次数（显示当前用户剩余免费次数）
  + EN 切换（语言切换按钮）
  + 注册
  + 登录
- 移动端自动折叠为汉堡菜单
- 点击语言切换按钮时，页面内容在中英文之间切换，保持当前页面路径不变

#### 3.2.2 区块2：Hero区域
- 展示数据统计条（4个卡片横排）：
  - 中文：25+ 年执业经验 / 英文：25+ Years of Practice
  - 中文：2 国家执业资质 / 英文：2 Countries Licensed
  - 中文：3 核心服务产品 / 英文：3 Core Services
  - 中文：∞ 家庭和谐可能 / 英文：∞ Family Harmony Possibilities
- 展示主标题（加大权重）：
  - 中文：守护跨境家庭，从理解开始
  - 英文：Protecting Cross-Border Families, Starting with Understanding
- 展示副标题：
  - 中文：移民加拿大，不只是换一个地址。法律文化的差异，往往在不经意间伤害最亲近的人。跨境家和帮助您了解加拿大家庭法律，预防文化误解，守护家庭和谐。
  - 英文：Immigrating to Canada is more than just changing an address. Legal and cultural differences often hurt those closest to us without warning. CrossBorder JiaHe helps you understand Canadian family law, prevent cultural misunderstandings, and protect family harmony.
- 展示歌德名言卡片（白底带阴影）：
  - 中文：「无论是国王还是农夫，家庭和睦是最幸福的。」— 歌德（Johann Wolfgang von Goethe）
  - 英文：「Whether king or peasant, family harmony is the greatest happiness.」— Johann Wolfgang von Goethe
- 展示首要CTA按钮（深蓝色，加大权重）：
  - 中文：开始魔镜筛查
  - 英文：Start Magic Mirror Screening
- 展示次要按钮（描边）：
  - 中文：预约免费咨询
  - 英文：Book Free Consultation

#### 3.2.3 区块3：我们的使命
- 展示标题：
  - 中文：文化差异不该成为家庭的隐形伤害
  - 英文：Cultural Differences Should Not Become Invisible Harm to Families
- 展示正文：
  - 中文：每一个移民家庭都值得被理解。跨境家和由资深律师邱律创立，专注于帮助跨境华人家庭识别法律文化风险，提供教育与支持，连接持牌专业律师资源，让每个家庭都能在新的土地上安心生活。
  - 英文：Every immigrant family deserves to be understood. CrossBorder JiaHe, founded by experienced attorney Alice Qiu, focuses on helping cross-border Chinese families identify legal and cultural risks, provide education and support, and connect with licensed professional lawyers, so that every family can live peacefully in their new land.

#### 3.2.4 区块4：真实案例
- 展示区块标题：
  - 中文：这些事，每天都在发生
  - 英文：These Things Happen Every Day
- 展示区块副标题：
  - 中文：文化误解造成的伤害，往往比我们想象的更深
  - 英文：The harm caused by cultural misunderstandings is often deeper than we imagine
- 展示三个案例卡片（横向排列，排版整洁，保持温暖叙事）：
  - 案例1：
    - 中文：大声争吵 ≠ 家暴 | 中国夫妻习惯大声表达情绪，邻居报警后男方被追究刑事责任。妻子后悔了——这只是她们在中国时养成的说话方式。| 标签：法律文化误解
    - 英文：Loud Arguments ≠ Domestic Violence | A Chinese couple used to expressing emotions loudly. After neighbors called the police, the husband faced criminal charges. The wife regretted it—this was just their way of speaking in China. | Tag: Legal Cultural Misunderstanding
  - 案例2：
    - 中文：帮孩子做作业的代价 | 母亲强迫孩子完成她代写的作业，被老师发现后，母亲被剥夺了监护权。她不知道，这在加拿大是严重违规行为。| 标签：监护权风险
    - 英文：The Cost of Helping with Homework | A mother forced her child to complete homework she had written. After the teacher discovered this, the mother lost custody. She didn't know this was a serious violation in Canada. | Tag: Custody Risk
  - 案例3：
    - 中文：赡养费≠孝顺 | 母亲按中国习俗向成年子女索要赡养费，孩子拒绝后母子关系破裂。双方都不了解，加拿大法律对此有完全不同的规定。| 标签：跨文化家庭冲突
    - 英文：Alimony ≠ Filial Piety | A mother demanded alimony from her adult children according to Chinese customs. After the children refused, the mother-child relationship broke down. Neither party understood that Canadian law has completely different regulations on this. | Tag: Cross-Cultural Family Conflict
- 展示底部CTA按钮：
  - 中文：了解如何预防这些风险
  - 英文：Learn How to Prevent These Risks

#### 3.2.5 区块5：三大核心服务
- 展示区块标题：
  - 中文：全方位守护您的跨境家庭
  - 英文：Comprehensive Protection for Your Cross-Border Family
- 展示区块副标题：
  - 中文：从风险识别到文化教育，从律师引荐到智能匹配，跨境家和陪伴您的每一步
  - 英文：From risk identification to cultural education, from lawyer referrals to intelligent matching, CrossBorder JiaHe accompanies you every step of the way
- 展示三个服务卡片：

**服务1：魔镜 Magic Mirror**
  - 展示英文标签：AI Powered
  - 展示标题：
    - 中文：魔镜 / Magic Mirror
    - 英文：Magic Mirror
  - 展示slogan：
    - 中文：魔镜魔镜告诉我，这个人的真实情况是怎样的？
    - 英文：Mirror, mirror, tell me, what is the true situation of this person?
  - 展示描述：
    - 中文：针对跨国婚恋或商务交流场景的 AI 风险识别工具。在重要决策前，帮您发现潜在的法律文化风险，让您在跨境关系中更有底气。49元起，3分钟获取报告。
    - 英文：An AI risk identification tool for cross-border romance or business communication scenarios. Before making important decisions, it helps you discover potential legal and cultural risks, giving you more confidence in cross-border relationships. Starting from ¥49, get your report in 3 minutes.
  - 展示四个功能点：
    - 中文：跨文化行为风险评估、法律合规性预检、个性化风险报告、专业转介建议
    - 英文：Cross-Cultural Behavioral Risk Assessment, Legal Compliance Pre-Check, Personalized Risk Report, Professional Referral Recommendations
  - 展示英文标签行：Reflect · Understand · Make · Inform
  - 展示CTA按钮：
    - 中文：开始魔镜筛查
    - 英文：Start Magic Mirror Screening

**服务2：家和成长营 Growth Camp**
  - 展示英文标签：Community Activities
  - 展示标题：
    - 中文：家和成长营 / Growth Camp
    - 英文：JiaHe Growth Camp
  - 展示slogan：Grow Together
  - 展示描述：
    - 中文：以线下读书会和真实案例分享为主的文化教育项目。在轻松的社群氛围中，了解加拿大家庭法律，结交同路人，共同成长。
    - 英文：A cultural education project focused on offline book clubs and real case sharing. In a relaxed community atmosphere, learn about Canadian family law, meet like-minded people, and grow together.
  - 展示四个功能点：
    - 中文：定期线下读书会、真实案例分析、法律文化工作坊、社群支持网络
    - 英文：Regular Offline Book Clubs, Real Case Analysis, Legal Culture Workshops, Community Support Network
  - 展示CTA按钮：
    - 中文：加入成长营
    - 英文：Join Growth Camp

**服务3：家和协商室 JiaHe Mediation Room**
  - 展示英文标签：Professional Support
  - 展示标题：
    - 中文：家和协商室 / JiaHe Mediation Room
    - 英文：JiaHe Mediation Room
  - 展示英文口号：Let's find solutions.
  - 展示英文副标题：I feel understood. / Your family, Your voice. / Our mission.
  - 展示描述：
    - 中文：律师引荐+智能匹配服务。运用 AI 技术辅助家庭成员间的沟通与和解，连接持牌专业律师，包括夫妻关系、亲子关系等。温和的调解支持，帮助家庭找到共同语言。
    - 英文：Lawyer referral + intelligent matching service. Using AI technology to assist communication and reconciliation between family members, connecting licensed professional lawyers, including spousal relationships, parent-child relationships, etc. Gentle mediation support to help families find common ground.
  - 展示四个功能点：
    - 中文：夫妻沟通辅助、亲子关系调解、跨文化沟通指导、持牌律师匹配
    - 英文：Spousal Communication Assistance, Parent-Child Relationship Mediation, Cross-Cultural Communication Guidance, Licensed Lawyer Matching
  - 展示CTA按钮：
    - 中文：预约律师咨询
    - 英文：Book Lawyer Consultation

#### 3.2.6 区块6：引荐平台信任体系
- 展示区块标题：
  - 中文：连接您与持牌专业律师
  - 英文：Connecting You with Licensed Professional Lawyers
- 展示区块副标题：
  - 中文：跨境家和是律师引荐平台，所有入驻律师均经过资质审核
  - 英文：CrossBorder JiaHe is a lawyer referral platform. All registered lawyers have been verified for qualifications.
- 展示六地持牌律师网络覆盖（图标+文字）：
  - 中国 / China
  - 加拿大 / Canada
  - 美国 / USA
  - 香港 / Hong Kong
  - 新加坡 / Singapore
  - 百慕大 / Bermuda
- 展示三大信任保障：
  - 中文：家和审核+推荐流程：所有入驻律师均经过资质审核
  - 英文：JiaHe Verification + Recommendation Process: All registered lawyers have been verified for qualifications
  - 中文：全程匿名隐私保护：您的信息严格保密
  - 英文：Full Anonymity and Privacy Protection: Your information is strictly confidential
  - 中文：安心认证标识：已认证律师徽章展示
  - 英文：Peace of Mind Certification Badge: Certified lawyer badge display

#### 3.2.7 区块7：为什么选择跨境家和
- 展示四个理由卡片：
  - 理由1：
    - 中文：双重法律背景 | 中加两国法律体系深度理解，精准识别跨境法律风险
    - 英文：Dual Legal Background | Deep understanding of Chinese and Canadian legal systems, precise identification of cross-border legal risks
  - 理由2：
    - 中文：跨文化专业 | 25 年跨国业务经验，深谙中加文化差异与沟通之道
    - 英文：Cross-Cultural Expertise | 25 years of cross-border business experience, deep understanding of Chinese-Canadian cultural differences and communication
  - 理由3：
    - 中文：预防优先 | 在危机发生前提供教育与识别，而非事后补救
    - 英文：Prevention First | Providing education and identification before crises occur, not remediation after the fact
  - 理由4：
    - 中文：以家庭为中心 | 所有服务围绕家庭和谐目标设计，而非单纯法律利益
    - 英文：Family-Centered | All services are designed around the goal of family harmony, not just legal interests

#### 3.2.8 区块8：FAQ常见问题
- 展示区块标题：
  - 中文：常见问题
  - 英文：Frequently Asked Questions
- 展示5-8个常见问题（中英双语，手风琴展开形式）：
  - Q1：
    - 中文：跨境家和是律师事务所吗？
    - 英文：Is CrossBorder JiaHe a law firm?
  - A1：
    - 中文：跨境家和是律师引荐平台，我们连接您与持牌专业律师。所有入驻律师均经过资质审核，我们不直接提供法律服务。
    - 英文：CrossBorder JiaHe is a lawyer referral platform. We connect you with licensed professional lawyers. All registered lawyers have been verified for qualifications. We do not provide legal services directly.
  - Q2：
    - 中文：魔镜报告是法律意见吗？
    - 英文：Is the Magic Mirror report a legal opinion?
  - A2：
    - 中文：魔镜报告是AI风险筛查工具，提供信息参考，不构成法律建议。个案咨询请通过平台预约持牌律师。
    - 英文：The Magic Mirror report is an AI risk screening tool that provides information for reference and does not constitute legal advice. For individual case consultations, please book a licensed lawyer through the platform.
  - Q3：
    - 中文：如何保护我的隐私？
    - 英文：How is my privacy protected?
  - A3：
    - 中文：我们承诺全程匿名隐私保护，您的信息严格保密，仅用于提供服务，不会向第三方分享。
    - 英文：We promise full anonymity and privacy protection. Your information is strictly confidential, used only to provide services, and will not be shared with third parties.
  - Q4：
    - 中文：魔镜报告需要多久生成？
    - 英文：How long does it take to generate a Magic Mirror report?
  - A4：
    - 中文：通常3分钟内生成，最长不超过2分钟。
    - 英文：Usually generated within 3 minutes, no longer than 2 minutes.
  - Q5：
    - 中文：如何联系持牌律师？
    - 英文：How do I contact a licensed lawyer?
  - A5：
    - 中文：您可以通过平台预约咨询，我们会根据您的需求智能匹配合适的持牌律师。
    - 英文：You can book a consultation through the platform, and we will intelligently match you with a suitable licensed lawyer based on your needs.
  - Q6：
    - 中文：会员套餐有哪些？
    - 英文：What membership packages are available?
  - A6：
    - 中文：我们提供免费会员、普通会员（年付¥2,999或月付¥249）、高级会员（年付¥5,999或月付¥599）三档会员权益。详情请访问会员页面。
    - 英文：We offer three membership tiers: Free Member, Standard Member (annual ¥2,999 or monthly ¥249), and Premium Member (annual ¥5,999 or monthly ¥599). For details, please visit the membership page.
  - Q7：
    - 中文：AI小助手能提供法律建议吗？
    - 英文：Can the AI assistant provide legal advice?
  - A7：
    - 中文：AI小助手仅提供信息引导，不构成法律建议。涉及具体法律问题时，请通过平台预约持牌律师。
    - 英文：The AI assistant only provides information guidance and does not constitute legal advice. For specific legal issues, please book a licensed lawyer through the platform.
  - Q8：
    - 中文：如何升级会员？
    - 英文：How do I upgrade my membership?
  - A8：
    - 中文：您可以在会员页面选择升级套餐，支付差价即可升级。到期前7天系统会提醒您续费或升级。
    - 英文：You can select an upgrade package on the membership page and pay the difference to upgrade. The system will remind you to renew or upgrade 7 days before expiration.

#### 3.2.9 区块9：联系我们
- 展示区块标题：
  - 中文：让我们帮助您的家庭
  - 英文：Let Us Help Your Family
- 展示区块副标题：
  - 中文：无论您面临什么跨境家庭问题，我们都愿意倾听。预约一次免费咨询，迈出守护家庭的第一步。
  - 英文：Whatever cross-border family issues you face, we are willing to listen. Book a free consultation and take the first step to protect your family.
- 展示联系信息（三列布局）：
  - 邮箱：info@crossborderjiahe.com（加强CTA）
  - 电话：
    - 中文：预约后提供
    - 英文：Provided after booking
  - 服务地区：
    - 中文：加拿大 · 中国 · 北美
    - 英文：Canada · China · North America
- 展示紧急提示（红色突出）：
  - 中文：如遇紧急家庭安全问题，请立即拨打 911
  - 英文：In case of emergency family safety issues, please call 911 immediately
- 展示咨询表单：
  - 标题：
    - 中文：我想了解：
    - 英文：I want to learn about:
  - 选项（复选框）：
    - 中文：魔镜·风险识别、家和成长营·文化教育、家和协商室·律师引荐、安心认证、其他
    - 英文：Magic Mirror · Risk Identification, JiaHe Growth Camp · Cultural Education, JiaHe Mediation Room · Lawyer Referral, Peace of Mind Certification, Other
- 展示底部CTA按钮：
  - 中文：预约咨询
  - 英文：Book Consultation

#### 3.2.10 区块10：Footer页脚
- 左侧展示：
  - Logo：跨境家和 / CROSSBORDER JIAHE
  - 标语：
    - 中文：「无论是国王还是农夫，家庭和睦是最幸福的。」— 歌德
    - 英文：「Whether king or peasant, family harmony is the greatest happiness.」— Johann Wolfgang von Goethe
  - 描述：
    - 中文：帮助跨境华人家庭了解加拿大法律文化，守护家庭关系，促进跨文化和谐。
    - 英文：Helping cross-border Chinese families understand Canadian legal culture, protect family relationships, and promote cross-cultural harmony.
- 中间展示导航：
  - 中文：魔镜·跨境风险识别、家和成长营·文化教育、家和协商室·律师引荐、安心认证、关于邱律
  - 英文：Magic Mirror · Cross-Border Risk Identification, JiaHe Growth Camp · Cultural Education, JiaHe Mediation Room · Lawyer Referral, Peace of Mind Certification, About Attorney Alice Qiu
- 右侧展示联系我们：
  - 创始人：
    - 中文：邱律 Alice Qiu
    - 英文：Attorney Alice Qiu
  - 服务地区：
    - 中文：加拿大 · 中国 · 北美
    - 英文：Canada · China · North America
  - 语言：
    - 中文：普通话 · 英语
    - 英文：Mandarin · English
  - 邮箱：info@crossborderjiahe.com
- 底部展示：
  - 中文：隐私政策链接、数据处理说明
  - 英文：Privacy Policy Link, Data Processing Statement

### 3.3 关于邱律页

#### 3.3.1 页面入口
- 从首页导航栏点击「关于邱律」进入
- URL：/about-alice

#### 3.3.2 页面内容
- 展示标题：Attorney Alice Qiu
- 展示子标题：Founder of CrossBorder JiaHe
- 展示卡通头像
- 展示背景标签：
  - 中文：千人律所资深律师 / 中国执业律师（1998年起） / 美加理财顾问双执照 / 跨国投资专家 / 婚姻家事业务
  - 英文：Senior Attorney at Thousand-Lawyer Firm / Licensed Attorney in China (since 1998) / Dual Licensed Financial Advisor in US & Canada / Cross-Border Investment Expert / Family Law Practice
- 展示四段履历：
  1. 中文：1998年，邱律取得中国律师执照，加入一家在中国市场综合排名前十、拥有逾千名执业律师、在国内30个城市设有办公室的大型律师事务所，长期深耕跨国投资与婚姻家事业务。
     英文：In 1998, Attorney Alice Qiu obtained her Chinese lawyer license and joined a large law firm ranked in the top ten in the Chinese market, with over a thousand practicing lawyers and offices in 30 cities across the country. She has long been deeply involved in cross-border investment and family law practice.
  2. 中文：2005年与家人定居加拿大后，邱律凭借对两国法律体系的深度理解，专门负责为国内同事来加拿大投资或处理婚姻家事争议，在各省采购专业律师服务。在这个过程中，她发现许多跨境家庭的离婚与继承纠纷，仅靠法律手段往往难以彻底解决——结合保险、保本基金等金融工具，才能更全面地帮助到客户。为此，她相继取得了美国与加拿大的理财顾问牌照。
     英文：After settling in Canada with her family in 2005, Attorney Qiu, with her deep understanding of the legal systems of both countries, specialized in assisting domestic colleagues with investments in Canada or handling family law disputes, procuring professional legal services in various provinces. In this process, she discovered that many cross-border family divorce and inheritance disputes could not be completely resolved by legal means alone—combining insurance, principal-protected funds, and other financial tools could provide more comprehensive assistance to clients. For this reason, she successively obtained financial advisor licenses in the United States and Canada.
  3. 中文：多年来，邱律亲眼目睹了无数本可避免的家庭悲剧：夫妻因大声争吵被追究刑事责任、母亲因帮孩子做作业失去监护权、老人因不了解加拿大法律向子女索要赡养费导致关系破裂……这些经历让她决心创立跨境家和，用教育与陪伴守护每一个跨境家庭。
     英文：Over the years, Attorney Qiu has witnessed countless avoidable family tragedies: couples facing criminal charges for loud arguments, mothers losing custody for helping children with homework, elderly parents demanding alimony from their children due to unfamiliarity with Canadian law, leading to broken relationships... These experiences led her to establish CrossBorder JiaHe, using education and companionship to protect every cross-border family.
  4. 中文：「无论是国王还是农夫，家庭和睦是最幸福的。」这句话是我创立跨境家和的初心。
     英文：「Whether king or peasant, family harmony is the greatest happiness.」This quote is the original intention behind my founding of CrossBorder JiaHe.

#### 3.3.3 引荐平台定位说明
- 展示区块标题：
  - 中文：连接您与持牌专业律师
  - 英文：Connecting You with Licensed Professional Lawyers
- 展示区块副标题：
  - 中文：跨境家和是律师引荐平台，我们连接您与持牌专业律师。所有入驻律师均经过资质审核，我们不直接提供法律服务。
  - 英文：CrossBorder JiaHe is a lawyer referral platform. We connect you with licensed professional lawyers. All registered lawyers have been verified for qualifications. We do not provide legal services directly.
- 展示六地持牌律师网络覆盖（图标+文字）：
  - 中国 / China
  - 加拿大 / Canada
  - 美国 / USA
  - 香港 / Hong Kong
  - 新加坡 / Singapore
  - 百慕大 / Bermuda
- 展示家和审核流程（三步）：
  1. 中文：资质审核：所有入驻律师均经过资质审核
     英文：Qualification Verification: All registered lawyers have been verified for qualifications
  2. 中文：智能匹配：根据您的需求智能匹配合适的持牌律师
     英文：Intelligent Matching: Intelligently match you with a suitable licensed lawyer based on your needs
  3. 中文：安心认证：已认证律师徽章展示
     英文：Peace of Mind Certification: Certified lawyer badge display

### 3.4 魔镜功能页

#### 3.4.1 页面入口
- 从首页点击「开始魔镜筛查」按钮进入
- URL：/magic-mirror

#### 3.4.2 顶部Banner
- 展示标题：魔镜 Magic Mirror
- 展示slogan：魔镜魔镜告诉我，这个人的真实情况是怎样的？
- 展示描述：针对跨国婚恋或商务交流场景的 AI 风险识别工具。在重要决策前，帮您发现潜在的法律文化风险，让您在跨境关系中更有底气。49元起，3分钟获取报告。

#### 3.4.3 用户输入区
- 展示标题：开始您的风险筛查
- 提供输入方式1：上传PDF文件（拖拽或点击上传）
  - 支持格式：PDF
  - 文件数量限制：最多5个
  - 文件大小限制：单个文件不超过10MB
  - 文件类型说明：财产证明、合同、法律文书等
- 提供输入方式2：手动输入信息
  - 输入框：姓名（中/英文）、关系描述、背景信息、自述资产/声明
- 展示按钮：开始筛查

#### 3.4.4 实时搜索进度展示区
- 用户点击「开始筛查」后，页面展示实时搜索进度
- 展示12个平台的查询进度（类似终端日志效果）：
  1. 百度搜索
  2. Google搜索
  3. 微博
  4. 知乎
  5. 微信公众号
  6. 今日头条
  7. 抖音/TikTok
  8. B站
  9. 小红书
  10. 新闻媒体（新华/人民等）
  11. GitHub（技术背景）
  12. 用户上传PDF内容分析
- 每个平台显示查询状态：
  - 查询中（进度条动画）
  - 已完成（显示找到的相关信息条数）
  - 受限（显示「已尝试查询/需人工核实」）
  - 失败（显示错误提示）
- 特殊平台处理：
  - 天眼查/裁判文书网/LinkedIn：显示「已尝试查询/需人工核实」

#### 3.4.5 注册弹窗（游客触发）
- 游客点击「开始筛查」后弹出注册弹窗
- 弹窗内容：
  - 标题：注册免费会员
  - 副标题：注册后可继续使用魔镜问询服务（第2次免费）
  - 按钮：完全免费
  - 输入框（3个）：您的姓名、电子邮件、电话号码
  - 隐私提示：您的信息将严格保密，仅用于提供服务。我们不会向第三方分享您的个人信息。
  - 注册按钮：立即注册并继续
  - 关闭按钮：右上角

#### 3.4.6 报告生成
- 生成时间：3分钟内
- 报告格式：固定4页PDF

#### 3.4.7 报告内容结构
**第1页：封面**
- 标题：跨境家和·魔镜 初筛报告
- 副标题：让跨境家庭更幸福
- 被筛查人：[姓名]
- 报告编号：会员姓名-被查人姓名-日期-序号
- 生成日期：[日期]
- 品牌标识（深蓝底+金色标题）

**第2页：核验信息 + 风险发现 + 参考资料**
- 核验信息表格
- 风险发现矩阵（四色标签）：
  - 红标（高风险）
  - 黄标（注意）
  - 绿标（正常）
  - 白标（无数据）
- 参考资料列表（展示各平台搜索结果来源）

**第3页：综合评估**
- 综合评级（四档）
- 魔镜建议（3条）

**第4页：核查清单**
- 线上可查清单
- 主动核实清单
- 实地核查清单
- 底部CTA：预约持牌律师深度咨询

**品牌水印**：右下角展示「跨境家和·魔镜」

### 3.5 报告详情页
- URL：/magic-mirror/report/:id
- 展示完整报告内容（4页结构）
- 提供下载PDF功能
- 提供「补充新证据/材料」入口，用户可上传新证据更新报告
- 底部展示CTA按钮：预约持牌律师深度咨询

### 3.6 会员中心
- URL：/member
- 展示历史报告列表，每个报告显示：
  - 报告标题/被筛查人
  - 生成日期
  - 风险等级
  - 状态（已完成/更新中）
- 支持操作：查看报告详情、下载PDF报告、补充新证据/材料更新报告
- 展示剩余免费次数

### 3.7 会员体系页

#### 3.7.1 页面入口
- 从首页导航栏点击「会员」进入
- URL：/membership

#### 3.7.2 页面内容
- 展示标题：
  - 中文：会员权益
  - 英文：Membership Benefits
- 展示副标题：
  - 中文：选择适合您的会员套餐，享受更多专属服务
  - 英文：Choose the membership package that suits you and enjoy more exclusive services

#### 3.7.3 会员权益对照表
- 展示三档会员权益对照表（表格形式）：

| 权益项目 | 免费会员 | 普通会员 | 高级会员 |
|---------|---------|---------|----------|
| 价格 | 免费 | 年付¥2,999 或 月付¥249 | 年付¥5,999 或 月付¥599 |
| AI辅助中心 | 免费36分钟 | ¥100/小时 | ¥50/小时 |
| 预约律师折扣 | 无 | 9折 | 8折 |
| 魔镜报告 | 2份免费 | 10次/月 | 20次/月 |
| 安心认证 | ¥699/次 | ¥399/次 | 免费1次 |
| 家和成长营 | 仅线上 | 线上+线下 | 蓝标专属 |

- 英文版对照表：

| Benefits | Free Member | Standard Member | Premium Member |
|---------|-------------|-----------------|----------------|
| Price | Free | Annual ¥2,999 or Monthly ¥249 | Annual ¥5,999 or Monthly ¥599 |
| AI Assistance Center | Free 36 minutes | ¥100/hour | ¥50/hour |
| Lawyer Booking Discount | None | 10% off | 20% off |
| Magic Mirror Reports | 2 free reports | 10 times/month | 20 times/month |
| Peace of Mind Certification | ¥699/time | ¥399/time | 1 free time |
| JiaHe Growth Camp | Online only | Online + Offline | Blue Badge Exclusive |

#### 3.7.4 升级路径说明
- 展示升级路径：游客 → 普通会员 → 高级会员
- 展示升级规则：
  - 中文：升级时支付差价即可，到期前7天系统会提醒您续费或升级
  - 英文：Pay the difference when upgrading. The system will remind you to renew or upgrade 7 days before expiration.

#### 3.7.5 CTA按钮
- 展示三个CTA按钮（对应三档会员）：
  - 中文：免费注册 / 升级至普通会员 / 升级至高级会员
  - 英文：Free Registration / Upgrade to Standard Member / Upgrade to Premium Member

### 3.8 登录页
- URL：/auth/login
- 输入框：电子邮件、密码
- 登录按钮

### 3.9 注册页
- URL：/auth/register
- 输入框：姓名、电子邮件、电话号码、密码
- 注册按钮

### 3.10 AI小助手（全局浮动组件）

#### 3.10.1 组件位置
- 固定在页面右下角
- 页面中线以下位置
- 随页面滚动保持在可视区域内

#### 3.10.2 组件名称
- 中文名：家和小助手
- 英文名：Blue Fairy

#### 3.10.3 语言跟随规则
- 中文页面：中文回复
- 英文页面：英文回复
- 中文欢迎语：您好，我是家和小助手，有什么可以帮助您的吗？
- 英文欢迎语：Hi, I'm Blue Fairy, your CrossBorder JiaHe assistant. How can I help you today?

#### 3.10.4 首次弹窗免责提示
- 用户首次点击AI小助手时弹出免责提示：
  - 中文：跨境家和是律师引荐平台，我们连接您与持牌专业律师。AI助手仅提供信息参考，不构成法律建议。个案咨询请通过平台预约持牌律师。
  - 英文：CrossBorder JiaHe is a lawyer referral platform. We connect you with licensed professional lawyers. The AI assistant only provides information for reference and does not constitute legal advice. For individual case consultations, please book a licensed lawyer through the platform.
- 用户确认后进入对话界面

#### 3.10.5 功能限制
- AI助手仅提供信息引导，不做法律判断
- 涉及具体法律问题时，引导用户预约持牌律师
- 回复示例：
  - 中文：我仅提供信息引导，不构成法律建议。个案咨询请通过平台预约持牌律师。
  - 英文：I only provide information guidance and do not constitute legal advice. For individual case consultations, please book a licensed lawyer through the platform.

### 3.11 国际化功能

#### 3.11.1 语言切换机制
- 使用react-i18next实现国际化支持
- 支持中文（zh）和英文（en）两种语言
- 所有页面文本使用翻译键替换硬编码文本
- 语言切换时保持当前页面路径不变，仅切换内容

#### 3.11.2 默认语言规则
- 默认语言跟随用户浏览器语言设置
- 支持通过URL参数切换语言
- 用户手动切换语言后，保存语言偏好

#### 3.11.3 翻译文件
- 翻译内容基于以下文件：
  - 中文原文：/workspace/app-cc2fqeuowe81/tasks/website_content_for_translation.md
  - 英文翻译：/workspace/app-cc2fqeuowe81/tasks/english_translation_v1.md
- 品牌术语统一翻译对照：
  - 跨境家和 → CrossBorder JiaHe
  - 邱律 → Attorney Alice Qiu
  - 蓝仙女 → Blue Fairy
  - 家和小助手 → JiaHe Assistant
  - 魔镜 → Magic Mirror
  - 家和成长营 → JiaHe Growth Camp
  - AI调解 → AI Mediation
  - 家和协商室 → JiaHe Mediation Room
  - 安心认证 → Peace of Mind Certification
  - 德和衡 → DeHeng Law Firm
  - 免费会员 → Free Member
  - 普通会员 → Standard Member
  - 高级会员 → Premium Member
- 去除所有 i18n key 占位符，完成全部翻译

---

## 4. 业务规则与逻辑

### 4.1 会员权益规则
- 游客：注册后获得1次免费魔镜体验
- 免费会员：2份免费魔镜报告 + 免费36分钟AI辅助中心
- 普通会员：
  - 价格：年付¥2,999 或 月付¥249
  - 权益：10次/月魔镜报告 + ¥100/小时AI辅助中心 + 9折预约律师 + ¥399/次安心认证 + 线上+线下家和成长营
- 高级会员：
  - 价格：年付¥5,999 或 月付¥599
  - 权益：20次/月魔镜报告 + ¥50/小时AI辅助中心 + 8折预约律师 + 免费1次安心认证 + 蓝标专属家和成长营
- 超额使用：单次购买¥49/份初筛报告

### 4.2 会员升级规则
- 升级路径：游客 → 免费会员 → 普通会员 → 高级会员
- 升级方式：支付差价即可升级
- 到期提醒：到期前7天系统自动提醒用户续费或升级

### 4.3 魔镜报告生成规则

#### 4.3.1 PDF文件处理
- 用户上传最多5个PDF文件
- 系统提取PDF文本内容
- AI分析关键信息（姓名、公司、地址、日期等）

#### 4.3.2 多平台搜索
- 系统自动搜索以下12个平台：
  1. 百度搜索
  2. Google搜索
  3. 微博
  4. 知乎
  5. 微信公众号
  6. 今日头条
  7. 抖音/TikTok
  8. B站
  9. 小红书
  10. 新闻媒体（新华/人民等）
  11. GitHub（技术背景）
  12. 用户上传PDF内容分析
- 特殊平台处理：
  - 天眼查/裁判文书网/LinkedIn：显示「已尝试查询/需人工核实」

#### 4.3.3 实时搜索进度展示
- 逐平台显示查询进度（类似终端日志效果）
- 每个平台显示查询状态：
  - 查询中（进度条动画）
  - 已完成（显示找到的相关信息条数）
  - 受限（显示「已尝试查询/需人工核实」）
  - 失败（显示错误提示）

#### 4.3.4 报告生成
- 生成时间：3分钟内
- 报告格式：固定4页PDF
- 报告编号：会员姓名-被查人姓名-日期-序号

#### 4.3.5 报告内容结构
- 第1页：封面
- 第2页：核验信息 + 风险发现 + 参考资料
- 第3页：综合评估
- 第4页：核查清单
- 四色风险标签：红（高风险）/黄（注意）/绿（正常）/白（无数据）

### 4.4 报告更新规则
- 用户可在会员中心或报告详情页补充新证据/材料
- 系统基于新证据重新生成报告
- 保留原报告版本记录

### 4.5 文件上传规则
- 支持格式：PDF
- 文件数量限制：最多5个
- 文件大小限制：单个文件不超过10MB

### 4.6 语言切换规则
- 用户点击语言切换按钮时，页面内容立即切换为对应语言
- 切换后保持当前页面路径和用户操作状态
- 语言偏好保存在本地存储中
- 首次访问时，根据浏览器语言设置自动选择语言

### 4.7 AI小助手规则
- AI小助手语言自动跟随页面语言
- 首次使用时展示免责提示
- AI助手仅提供信息引导，不做法律判断
- 涉及具体法律问题时，引导用户预约持牌律师

### 4.8 律师引荐规则
- 所有入驻律师均经过资质审核
- 用户信息全程匿名隐私保护
- 已认证律师展示安心认证标识

### 4.9 数据存储规则

#### 4.9.1 reports表
- 存储报告元数据：
  - 报告ID
  - 会员ID
  - 被查人姓名
  - 报告编号
  - 生成日期
  - 风险等级
  - 状态（已完成/更新中）

#### 4.9.2 search_results表
- 存储各平台搜索结果：
  - 搜索结果ID
  - 报告ID
  - 平台名称
  - 查询状态（已完成/受限/失败）
  - 找到的相关信息条数
  - 搜索结果内容

#### 4.9.3 uploaded_files表
- 存储上传的PDF文件信息：
  - 文件ID
  - 报告ID
  - 文件名称
  - 文件大小
  - 上传时间
  - 文件路径

---

## 5. SEO优化

### 5.1 页面元信息
- Title：跨境家和 | 守护跨境家庭，从理解开始
- Meta Description：专业跨境家庭法律服务 + 魔镜 AI 风险筛查，帮助移民家庭预防法律文化风险，守护家庭幸福

### 5.2 结构化数据
- 添加 JSON-LD Structured Data：
  - Organization（组织信息）
  - Person（创始人信息）
  - Service（服务信息）

### 5.3 标题结构
- H1/H2/H3 标题结构清晰
- 首页H1：守护跨境家庭，从理解开始
- 各区块使用H2标题
- 子内容使用H3标题

### 5.4 内部链接
- 魔镜入口突出，多处展示
- 各服务页面底部增加「预约咨询」或「开始使用」按钮
- Footer导航清晰
- 会员页面入口在导航栏中突出展示

---

## 6. 异常与边界情况

| 场景 | 处理方式 |
|------|----------|
| 游客未注册直接点击「开始筛查」 | 弹出注册弹窗 |
| 会员超过免费次数 | 提示购买单次报告（¥49/份）或升级会员 |
| 文件上传超过10MB | 提示文件过大，请压缩后上传 |
| 上传文件数量超过5个 | 提示最多上传5个PDF文件 |
| 上传文件格式不支持 | 提示仅支持PDF格式 |
| PDF文件读取失败 | 提示文件损坏或格式不正确，请重新上传 |
| 某平台搜索失败 | 显示「失败」状态，继续其他平台搜索 |
| 某平台搜索受限 | 显示「已尝试查询/需人工核实」 |
| 报告生成失败 | 提示系统异常，请稍后重试 |
| 用户输入信息不完整 | 提示必填项未填写 |
| 紧急家庭安全问题 | 页面红色突出提示：如遇紧急家庭安全问题，请立即拨打 911 |
| 浏览器不支持的语言 | 默认使用中文 |
| 翻译文件加载失败 | 显示中文内容并提示用户刷新页面 |
| AI小助手被问及法律判断 | 回复：我仅提供信息引导，不构成法律建议。个案咨询请通过平台预约持牌律师。 |
| 移动端访问 | 导航栏自动折叠为汉堡菜单，页面自适应 |
| 会员到期前7天 | 系统自动提醒用户续费或升级 |
| 用户尝试升级会员 | 计算差价并引导支付 |

---

## 7. 验收标准

1. 用户访问首页，浏览10个区块内容，了解跨境家和的品牌理念、三大核心服务与引荐平台信任体系
2. 用户点击Header中的语言切换按钮，页面内容在中英文之间切换，路径保持不变，所有文本完整翻译无i18n key占位符
3. 用户点击导航栏中的「会员」入口，进入会员体系页，查看三档会员权益对照表
4. 用户点击「开始魔镜筛查」按钮，进入魔镜功能页
5. 游客用户点击「开始筛查」，弹出注册弹窗，完成注册成为免费会员
6. 用户上传最多5个PDF文件或手动输入信息，点击「开始筛查」
7. 系统展示12个平台的实时搜索进度，逐平台显示查询状态（查询中→已完成/受限/失败）
8. 系统在3分钟内生成魔镜报告，报告包含4页内容（封面、核验信息+风险发现+参考资料、综合评估、核查清单），使用四色风险标签（红/黄/绿/白）
9. 用户在会员中心查看历史报告，点击某个报告查看详情，下载PDF报告
10. 用户在报告详情页补充新证据，系统更新报告并保留原版本记录
11. 用户点击右下角AI小助手（页面中线以下位置），首次使用时看到免责提示，确认后进入对话界面，AI助手语言跟随页面语言
12. 用户在会员体系页选择升级至普通会员或高级会员，系统计算差价并引导支付
13. 用户在魔镜报告末尾点击「预约持牌律师深度咨询」，进入咨询预约流程
14. 用户访问关于邱律页，查看创始人履历、六地持牌律师网络覆盖与家和审核流程

---

## 8. 本期不实现功能

- 家和成长营的线下活动报名与管理功能
- 家和协商室的具体调解流程与工具
- 法律咨询转介的律师匹配与预约功能（仅展示入口）
- 会员套餐购买与支付功能（仅展示会员权益对照表与升级入口）
- 社交媒体分享功能
- 用户评论与反馈功能
- 后台管理系统
- 除中英文以外的其他语言支持
- AI小助手的深度对话能力（仅提供基础信息引导）
- 律师端管理系统
- 安心认证的具体审核流程与管理功能
- 会员到期自动续费功能
- 会员权益使用统计与分析功能
- 天眼查/裁判文书网/LinkedIn的自动化查询功能（仅显示「已尝试查询/需人工核实」）
- PDF文件的OCR识别功能（仅支持文本型PDF）
- 多语言PDF文件的自动翻译功能
- 搜索结果的深度分析与关联挖掘功能
- 报告的自定义模板功能
- 报告的批量生成功能