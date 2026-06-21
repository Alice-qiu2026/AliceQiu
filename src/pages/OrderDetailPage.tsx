import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { getOrderByNo } from '@/services/api';
import type { Order } from '@/services/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待支付', color: 'bg-accent text-accent-foreground', icon: <Clock className="w-5 h-5" /> },
  paid: { label: '已支付', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-5 h-5" /> },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-5 h-5" /> },
  cancelled: { label: '已取消', color: 'bg-secondary text-secondary-foreground', icon: <Clock className="w-5 h-5" /> },
  refunded: { label: '已退款', color: 'bg-secondary text-secondary-foreground', icon: <Clock className="w-5 h-5" /> },
  partial_refunded: { label: '部分退款', color: 'bg-secondary text-secondary-foreground', icon: <Clock className="w-5 h-5" /> },
};

function generateQRCodeUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
}

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const { orderNo } = useParams<{ orderNo: string }>();
  const { user, refreshProfile } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderNo) return;
    const data = await getOrderByNo(orderNo);
    setOrder(data);
    setLoading(false);
  }, [orderNo]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // 轮询订单状态
  useEffect(() => {
    if (!order || order.status !== 'pending') return;
    setPolling(true);
    const interval = setInterval(async () => {
      const updated = await getOrderByNo(order.order_no);
      if (updated && updated.status !== 'pending') {
        setOrder(updated);
        setPolling(false);
        clearInterval(interval);
        toast.success(t('orderDetail.paySuccessMsg'));
        await refreshProfile();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [order, refreshProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">订单不存在</p>
        <Link to="/member">
          <Button variant="outline">返回会员中心</Button>
        </Link>
      </div>
    );
  }

  const statusInfo = statusLabels[order.status] || statusLabels.pending;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <Link to="/member" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回会员中心
        </Link>

        <h1 className="text-xl font-bold text-primary mb-6">订单详情</h1>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('orderDetail.orderId')}</p>
                <p className="font-mono font-medium">{order.order_no}</p>
              </div>
              <Badge className={statusInfo.color}>
                <span className="flex items-center gap-1">
                  {statusInfo.icon}
                  {statusInfo.label}
                </span>
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品</span>
                <span className="font-medium">魔镜初筛报告</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">数量</span>
                <span className="font-medium">1</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-medium">支付金额</span>
                <span className="text-lg font-bold text-primary">¥ {order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.status === 'pending' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">
                {order.pay_type === 'alipay' ? '支付宝支付' : '微信支付'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              {order.pay_type === 'alipay' && order.alipay_pay_url ? (
                <>
                  <div className="bg-white p-4 rounded-lg inline-block mb-4">
                    <img
                      src={generateQRCodeUrl(order.alipay_pay_url)}
                      alt="支付宝支付二维码"
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    请使用支付宝扫一扫完成支付
                  </p>
                  {polling && (
                    <div className="flex items-center justify-center gap-2 text-sm text-accent">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      等待支付结果...
                    </div>
                  )}
                </>
              ) : order.wechat_pay_url ? (
                <>
                  <div className="bg-white p-4 rounded-lg inline-block mb-4">
                    <img
                      src={generateQRCodeUrl(order.wechat_pay_url)}
                      alt="微信支付二维码"
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    请使用微信扫一扫完成支付
                  </p>
                  {polling && (
                    <div className="flex items-center justify-center gap-2 text-sm text-accent">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      等待支付结果...
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">支付链接生成中...</p>
              )}
            </CardContent>
          </Card>
        )}

        {order.status === 'paid' && (
          <Card className="mb-6 border-green-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-700 mb-1">支付成功</h3>
              <p className="text-sm text-muted-foreground mb-4">
                您的免费报告次数已增加，现在可以继续生成魔镜报告了
              </p>
              <Link to="/magic-mirror">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {t('orderDetail.goToReport')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <p>如有疑问，请联系客服</p>
        </div>
      </div>
    </div>
  );
}
