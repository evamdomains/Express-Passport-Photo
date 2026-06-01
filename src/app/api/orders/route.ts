import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import { sendErrorAlert } from '@/lib/alert';
import type { DocumentTypeId } from '@/types/document';

export async function POST(req: NextRequest) {
  try {
    const { documentTypeId } = (await req.json()) as { documentTypeId: DocumentTypeId };

    if (!DOCUMENT_SPECS[documentTypeId]) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('orders')
      .insert({ document_type: documentTypeId, product_sku: 'digital_download', status: 'pending' })
      .select('id')
      .single();

    if (error) {
      await sendErrorAlert({
        api: 'Supabase',
        error,
        context: { operation: 'orders.insert', documentTypeId },
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
