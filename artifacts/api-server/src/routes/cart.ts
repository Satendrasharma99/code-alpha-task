import { Router } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { GetCartQueryParams, AddToCartBody, UpdateCartItemBody, UpdateCartItemParams, RemoveCartItemParams, ClearCartQueryParams } from "@workspace/api-zod";

const router = Router();

async function getCartWithProducts(userId: string) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      userId: cartItemsTable.userId,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      product: productsTable,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, userId));

  const mapped = items.map(item => ({
    id: item.id,
    userId: item.userId,
    productId: item.productId,
    quantity: item.quantity,
    product: {
      ...item.product,
      price: Number(item.product.price),
      originalPrice: item.product.originalPrice != null ? Number(item.product.originalPrice) : null,
      rating: Number(item.product.rating),
    },
  }));

  const total = mapped.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = mapped.reduce((sum, item) => sum + item.quantity, 0);

  return { items: mapped, total, itemCount };
}

router.get("/cart", async (req, res) => {
  try {
    const parsed = GetCartQueryParams.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "userId is required" });

    const cart = await getCartWithProducts(parsed.data.userId);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cart", async (req, res) => {
  try {
    const parsed = AddToCartBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const { userId, productId, quantity } = parsed.data;

    const [existing] = await db
      .select()
      .from(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)));

    let cartItem;
    if (existing) {
      [cartItem] = await db
        .update(cartItemsTable)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(cartItemsTable.id, existing.id))
        .returning();
    } else {
      [cartItem] = await db
        .insert(cartItemsTable)
        .values({ userId, productId, quantity })
        .returning();
    }

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));

    res.status(201).json({
      ...cartItem,
      product: {
        ...product,
        price: Number(product.price),
        originalPrice: product.originalPrice != null ? Number(product.originalPrice) : null,
        rating: Number(product.rating),
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/cart/:itemId", async (req, res) => {
  try {
    const paramsParsed = UpdateCartItemParams.safeParse({ itemId: Number(req.params.itemId) });
    const bodyParsed = UpdateCartItemBody.safeParse(req.body);
    if (!paramsParsed.success || !bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

    const [cartItem] = await db
      .update(cartItemsTable)
      .set({ quantity: bodyParsed.data.quantity })
      .where(eq(cartItemsTable.id, paramsParsed.data.itemId))
      .returning();

    if (!cartItem) return res.status(404).json({ error: "Cart item not found" });

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, cartItem.productId));

    res.json({
      ...cartItem,
      product: {
        ...product,
        price: Number(product.price),
        originalPrice: product.originalPrice != null ? Number(product.originalPrice) : null,
        rating: Number(product.rating),
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cart/:itemId", async (req, res) => {
  try {
    const parsed = RemoveCartItemParams.safeParse({ itemId: Number(req.params.itemId) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid item ID" });

    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, parsed.data.itemId));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cart/clear", async (req, res) => {
  try {
    const parsed = ClearCartQueryParams.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "userId is required" });

    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, parsed.data.userId));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
