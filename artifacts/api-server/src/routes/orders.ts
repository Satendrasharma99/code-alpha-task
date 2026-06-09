import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListOrdersQueryParams, CreateOrderBody, GetOrderParams } from "@workspace/api-zod";

const router = Router();

async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;

  const items = await db
    .select({
      id: orderItemsTable.id,
      orderId: orderItemsTable.orderId,
      productId: orderItemsTable.productId,
      quantity: orderItemsTable.quantity,
      price: orderItemsTable.price,
      product: productsTable,
    })
    .from(orderItemsTable)
    .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, orderId));

  return {
    ...order,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    items: items.map(item => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: Number(item.price),
      product: {
        ...item.product,
        price: Number(item.product.price),
        originalPrice: item.product.originalPrice != null ? Number(item.product.originalPrice) : null,
        rating: Number(item.product.rating),
      },
    })),
  };
}

router.get("/orders", async (req, res) => {
  try {
    const parsed = ListOrdersQueryParams.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "userId is required" });

    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, parsed.data.userId))
      .orderBy(ordersTable.createdAt);

    const withItems = await Promise.all(orders.map(o => getOrderWithItems(o.id)));
    res.json(withItems.filter(Boolean));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const parsed = CreateOrderBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const { userId, shippingAddress, items } = parsed.data;
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const [order] = await db.insert(ordersTable).values({
      userId,
      shippingAddress,
      total: String(total),
      status: "confirmed",
    }).returning();

    await db.insert(orderItemsTable).values(
      items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: String(item.price),
      }))
    );

    const fullOrder = await getOrderWithItems(order.id);
    res.status(201).json(fullOrder);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const parsed = GetOrderParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid order ID" });

    const order = await getOrderWithItems(parsed.data.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
