import { createAdminClient } from '@/lib/supabase/admin';
import AdminOrderCard from '@/components/AdminOrderCard';
import AdminReviewModeration from '@/components/AdminReviewModeration';
import type { Order } from '@/types/order';
import type { Review } from '@/types/review';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createAdminClient();

  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('*')
    .eq('product_sku', 'printed_ready')
    .in('status', ['paid', 'processing', 'pending'])
    .order('created_at', { ascending: false });

  const orders: Order[] = (ordersRaw ?? []) as Order[];

  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const pendingReviews: Review[] = (reviewsRaw ?? []) as Review[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Printed &amp; Ready Orders</h1>
            <p className="text-sm text-gray-500 mt-1">
              {orders.length === 0
                ? 'No pending orders'
                : `${orders.length} order${orders.length !== 1 ? 's' : ''} waiting`}
            </p>
          </div>
          <form action="/api/admin/auth" method="post">
            <input type="hidden" name="password" value="" />
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to site
            </a>
          </form>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <p className="text-4xl mb-4">✅</p>
            <p className="font-medium text-gray-700">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No pending Printed &amp; Ready orders.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <AdminOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Review moderation queue */}
        <div className="mt-14">
          <h2 className="text-2xl font-bold text-gray-900">Reviews to moderate</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            {pendingReviews.length === 0
              ? 'No reviews awaiting approval'
              : `${pendingReviews.length} review${pendingReviews.length !== 1 ? 's' : ''} awaiting approval`}
          </p>
          <AdminReviewModeration initialPending={pendingReviews} />
        </div>
      </div>
    </div>
  );
}
