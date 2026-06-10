import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createCheckoutSession } from '@/lib/stripe';
import { PRODUCTS } from '@/constants/products';
import { sendErrorAlert } from '@/lib/alert';
import type { ProductSku } from '@/types/order';

export async function POST(req: NextRequest) {
  let orderId: string | undefined;

  try {
    const body = await req.json() as {
      orderId: string;
      sku: ProductSku;
      email: string;
      storeName?: string;
      storeAddress?: string;
      storePlaceId?: string;
      storeMapsUrl?: string;
    };

    orderId = body.orderId;
    const { sku, email } = body;

    if (!orderId || !sku || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (sku === 'printed_ready' && !body.storeName) {
      return NextResponse.json({ error: 'Store selection required for Printed & Ready' }, { status: 400 });
    }

    const product = PRODUCTS.find((p) => p.sku === sku);
    if (!product) {
      return NextResponse.json({ error: 'Invalid SKU' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();

    if (orderError) {
      if (orderError.code !== 'PGRST116') {
        await sendErrorAlert({
          api: 'Supabase',
          error: orderError,
          orderId,
          context: { operation: 'orders.select', stage: 'checkout-lookup' },
        });
      }
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Save store details BEFORE creating the Stripe session to avoid race condition
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        product_sku: sku,
        email,
        ...(sku === 'printed_ready' && {
          store_name: body.storeName,
          store_address: body.storeAddress,
          store_place_id: body.storePlaceId,
          store_maps_url: body.storeMapsUrl,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      await sendErrorAlert({
        api: 'Supabase',
        error: updateError,
        orderId,
        context: { operation: 'orders.update', stage: 'pre-checkout-store-details' },
      });
      return NextResponse.json({ error: 'Could not save order details' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    let session;
    try {
      session = await createCheckoutSession({
        productName: product.name,
        unitAmount: Math.round(product.price * 100),
        orderId,
        email,
        successUrl: `${appUrl}/order-confirmation?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${appUrl}/checkout?orderId=${orderId}`,
      });
    } catch (stripeError) {
      await sendErrorAlert({
        api: 'Stripe',
        error: stripeError,
        orderId,
        context: { operation: 'createCheckoutSession', sku, unitAmount: Math.round(product.price * 100) },
      });
      throw stripeError;
    }

    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[checkout]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}
