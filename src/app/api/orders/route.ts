import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import { sendErrorAlert } from '@/lib/alert';
import type { DocumentTypeId } from '@/types/document';
import type { ReviewType } from '@/types/order';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      documentTypeId: DocumentTypeId;
      reviewType?: ReviewType;
      customerName?: string;
      email?: string;
      customerPhone?: string;
    };
    const { documentTypeId } = body;
    const reviewType: ReviewType = body.reviewType === 'human' ? 'human' : 'ai';

    if (!DOCUMENT_SPECS[documentTypeId]) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // The human path collects contact details up front so we can email the
    // "in review" confirmation on submit and reach the customer on live chat.
    if (reviewType === 'human' && !body.email) {
      return NextResponse.json({ error: 'Email is required for human review' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('orders')
      .insert({
        document_type: documentTypeId,
        product_sku: 'digital_download',
        status: 'pending',
        review_type: reviewType,
        // review_status starts null; it becomes 'awaiting_review' once the photo
        // is submitted (after the $0 checkout completes).
        review_status: null,
        customer_name: body.customerName ?? null,
        email: reviewType === 'human' ? body.email ?? null : null,
        customer_phone: body.customerPhone ?? null,
      })
      .select('id')
      .single();

    if (error) {
      await sendErrorAlert({
        api: 'Supabase',
        error,
        context: { operation: 'orders.insert', documentTypeId, reviewType },
      });
      throw error;
    }

    return NextResponse.json({ orderId: data.id });
  } catch (err) {
    console.error('[orders POST]', err);
    return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json({ error: 'orderId required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    // PGRST116 = no rows — normal "not found", not an infrastructure error
    if (error.code !== 'PGRST116') {
      await sendErrorAlert({
        api: 'Supabase',
        error,
        orderId,
        context: { operation: 'orders.select', orderId },
      });
    }
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
