import { createClient } from '@/lib/supabase/server';

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await authenticatedClient();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const [transactions, inventory, parties, crops] = await Promise.all([
    supabase.from('transactions').select('*').is('deleted_at', null).order('date', { ascending: false }),
    supabase.from('inventory_items').select('*').is('deleted_at', null).order('name'),
    supabase.from('parties').select('*').is('deleted_at', null).order('name'),
    supabase.from('crops').select('*').order('harvest_date'),
  ]);
  const error = transactions.error || inventory.error || parties.error || crops.error;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({
    transactions: transactions.data,
    inventory: inventory.data?.map(item => ({ ...item, value: item.quantity * item.purchase_price })),
    parties: parties.data?.map(party => ({ ...party, balance: party.total - party.paid })),
    crops: crops.data,
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json() as Record<string, string | number>;
    if (body.kind === 'transaction') {
      const amount = Number(body.amount);
      if (!amount || amount <= 0 || !body.description || !['income', 'expense'].includes(String(body.type))) return Response.json({ error: 'Invalid transaction' }, { status: 400 });
      const { data, error } = await supabase.from('transactions').insert({ owner_id: user.id, business_id: body.businessId, type: body.type, category: body.category, amount, date: body.date, party: body.party || null, description: body.description, payment_method: body.paymentMethod, notes: body.notes || null }).select('id').single();
      if (error) throw error;
      return Response.json({ ok: true, id: data.id });
    }
    if (body.kind === 'inventory') {
      const quantity = Number(body.quantity), purchasePrice = Number(body.purchasePrice);
      if (!body.name || quantity < 0 || purchasePrice < 0) return Response.json({ error: 'Invalid inventory' }, { status: 400 });
      const { data, error } = await supabase.from('inventory_items').insert({ owner_id: user.id, business_id: body.businessId, name: body.name, category: body.category, brand: body.brand || null, quantity, unit: body.unit, purchase_price: purchasePrice, selling_price: Number(body.sellingPrice) || null, minimum_stock: Number(body.minimumStock) || 0, supplier: body.supplier || null, location: body.location || null, expiration_date: body.expirationDate || null }).select('id').single();
      if (error) throw error;
      return Response.json({ ok: true, id: data.id });
    }
    if (body.kind === 'movement') {
      const itemId = Number(body.itemId), quantity = Number(body.quantity);
      const { data: item } = await supabase.from('inventory_items').select('id,business_id,quantity').eq('id', itemId).single();
      if (!item || !quantity || quantity <= 0 || (body.movementType === 'out' && quantity > item.quantity)) return Response.json({ error: 'Invalid movement' }, { status: 400 });
      const nextQuantity = item.quantity + (body.movementType === 'out' ? -quantity : quantity);
      const { error: updateError } = await supabase.from('inventory_items').update({ quantity: nextQuantity }).eq('id', itemId);
      if (updateError) throw updateError;
      const { error: movementError } = await supabase.from('inventory_movements').insert({ owner_id: user.id, item_id: itemId, business_id: item.business_id, movement_type: body.movementType, reason: body.reason, quantity, date: body.date, notes: body.notes || null });
      if (movementError) throw movementError;
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'Unknown operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not save record' }, { status: 500 });
  }
}
