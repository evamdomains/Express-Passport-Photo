import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPickupReadyEmail } from '@/lib/resend';
import { sendErrorAlert } from '@/lib/alert';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { DocumentTypeId } from '@/types/document';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const { pickupTime } = (await req.json()) as { pickupTime: string };

  if (!pickupTime?.trim()) {
    return NextResponse.json({ error: 'pickupTime is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    if (fetchError && fetchError.code !== 'PGRST116') {
      await sendErrorAlert({
        api: 'Supabase',
        error: fetchError,
        orderId,
        context: { operation: 'orders.select', stage: 'admin-notify' },
      });
    }
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'fulfilled',
      pickup_time: pickupTime,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    await sendErrorAlert({
      api: 'Supabase',
      error: updateError,
      orderId,
      context: { operation: 'orders.update', stage: 'admin-mark-fulfilled' },
    });
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }

  if (order.email && order.store_name && order.store_address && order.store_maps_url) {
    const spec = DOCUMENT_SPECS[order.document_type as DocumentTypeId];
    try {
      await sendPickupReadyEmail({
        to: order.email,
        orderId,
        documentTypeName: spec?.name ?? order.document_type,
        storeName: order.store_name,
        storeAddress: order.store_address,
        storeMapsUrl: order.store_maps_url,
        pickupTime,
      });
    } catch (err) {
      // Resend failure — console only (do not alert via Resend on Resend failure)
      console.error('[admin-notify] pickup email FAILED:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
