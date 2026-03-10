import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { itemId } = body;

    if (!itemId) {
      return Response.json({ error: 'itemId is required' }, { status: 400 });
    }

    // Fetch the item to verify ownership before deleting
    let items;
    try {
      items = await base44.asServiceRole.entities.PortfolioItem.filter({ id: itemId });
    } catch {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }
    if (!items || items.length === 0) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    const item = items[0];

    // Verify the user owns the vendor associated with this portfolio item
    const vendors = await base44.asServiceRole.entities.Vendor.list('-created_date', 200);
    const ownsVendor = vendors.some(v =>
      v.id === item.vendor_id &&
      (v.created_by === user.email || v.contact_email === user.email || user.vendor_id === v.id)
    );

    if (!ownsVendor && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await base44.asServiceRole.entities.PortfolioItem.delete(itemId);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});