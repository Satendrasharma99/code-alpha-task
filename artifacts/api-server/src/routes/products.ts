import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq, ilike, gte, lte, and, type SQL, sql } from "drizzle-orm";
import { ListProductsQueryParams, CreateProductBody } from "@workspace/api-zod";

const router = Router();

router.get("/products", async (req, res) => {
  try {
    const parsed = ListProductsQueryParams.safeParse(req.query);
    const q = parsed.success ? parsed.data : {};

    const conditions: SQL[] = [];
    if (q.category) conditions.push(eq(productsTable.category, q.category));
    if (q.search) conditions.push(ilike(productsTable.name, `%${q.search}%`));
    if (q.minPrice != null) conditions.push(gte(productsTable.price, String(q.minPrice)));
    if (q.maxPrice != null) conditions.push(lte(productsTable.price, String(q.maxPrice)));

    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const offset = (page - 1) * limit;

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [products, countResult] = await Promise.all([
      db.select().from(productsTable).where(where).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(productsTable).where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    const mapped = products.map(p => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice != null ? Number(p.originalPrice) : null,
      rating: Number(p.rating),
    }));

    res.json({ products: mapped, total, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/featured", async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.isFeatured, true))
      .limit(8);

    res.json(products.map(p => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice != null ? Number(p.originalPrice) : null,
      rating: Number(p.rating),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json({
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice != null ? Number(product.originalPrice) : null,
      rating: Number(product.rating),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const parsed = CreateProductBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const [product] = await db.insert(productsTable).values({
      ...parsed.data,
      price: String(parsed.data.price),
      originalPrice: parsed.data.originalPrice != null ? String(parsed.data.originalPrice) : null,
      rating: String(parsed.data.rating),
    }).returning();

    res.status(201).json({
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice != null ? Number(product.originalPrice) : null,
      rating: Number(product.rating),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/summary", async (req, res) => {
  try {
    const [totalResult, featuredResult, categoryResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(productsTable),
      db.select({ count: sql<number>`count(*)` }).from(productsTable).where(eq(productsTable.isFeatured, true)),
      db.select({ category: productsTable.category, count: sql<number>`count(*)` })
        .from(productsTable)
        .groupBy(productsTable.category),
    ]);

    const categories = categoryResult.map(r => ({ category: r.category, count: Number(r.count) }));

    res.json({
      totalProducts: Number(totalResult[0]?.count ?? 0),
      totalCategories: categories.length,
      featuredCount: Number(featuredResult[0]?.count ?? 0),
      topCategories: categories.sort((a, b) => b.count - a.count).slice(0, 5),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
