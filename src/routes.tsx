import HomePage from './pages/HomePage';
import MagicMirrorPage from './pages/MagicMirrorPage';
import GrowthCampPage from './pages/GrowthCampPage';
import AIMediationPage from './pages/AIMediationPage';
import AIMediationChatPage from './pages/AIMediationChatPage';
import CertificationPage from './pages/CertificationPage';
import CertificationApplyPage from './pages/CertificationApplyPage';
import AdminCertificationPage from './pages/AdminCertificationPage';
import MembershipPage from './pages/MembershipPage';
import ReportDetailPage from './pages/ReportDetailPage';
import MemberPage from './pages/MemberPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AboutPage from './pages/AboutPage';
import ArticlesPage from './pages/ArticlesPage';
import AdminArticlesPage from './pages/AdminArticlesPage';
import AICustomerServicePage from './pages/AICustomerServicePage';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: '首页',
    path: '/',
    element: <HomePage />,
    public: true,
  },
  {
    name: '魔镜',
    path: '/magic-mirror',
    element: <MagicMirrorPage />,
    public: true,
  },
  {
    name: '家和成长营',
    path: '/growth-camp',
    element: <GrowthCampPage />,
    public: true,
  },
  {
    name: '家和协商室',
    path: '/ai-mediation',
    element: <AIMediationPage />,
    public: true,
  },
  {
    name: '协商室对话',
    path: '/ai-mediation/chat',
    element: <AIMediationChatPage />,
    public: false,
  },
  {
    name: '安心认证',
    path: '/certification',
    element: <CertificationPage />,
    public: true,
  },
  {
    name: '申请认证',
    path: '/certification/apply',
    element: <CertificationApplyPage />,
    public: false,
  },
  {
    name: '认证审核',
    path: '/admin/certifications',
    element: <AdminCertificationPage />,
    public: false,
  },
  {
    name: '成为会员',
    path: '/join',
    element: <MembershipPage />,
    public: true,
  },
  {
    name: '成为会员',
    path: '/membership',
    element: <Navigate to="/join" replace />,
    public: true,
  },
  {
    name: '报告详情',
    path: '/magic-mirror/report/:id',
    element: <ReportDetailPage />,
    public: false,
  },
  {
    name: '会员中心',
    path: '/member',
    element: <MemberPage />,
    public: false,
  },
  {
    name: '登录',
    path: '/auth/login',
    element: <LoginPage />,
    public: true,
  },
  {
    name: '注册',
    path: '/auth/register',
    element: <RegisterPage />,
    public: true,
  },
  {
    name: '重置密码',
    path: '/reset-password',
    element: <ResetPasswordPage />,
    public: true,
  },
  {
    name: '订单详情',
    path: '/order/:orderNo',
    element: <OrderDetailPage />,
    public: false,
  },
  {
    name: '关于邱律',
    path: '/about',
    element: <AboutPage />,
    public: true,
  },
  {
    name: '邱律文章',
    path: '/articles',
    element: <ArticlesPage />,
    public: true,
  },
  {
    name: '文章管理',
    path: '/admin/articles',
    element: <AdminArticlesPage />,
    public: false,
  },
  {
    name: 'AI客服',
    path: '/ai-customer-service',
    element: <AICustomerServicePage />,
    public: false,
  },
];
