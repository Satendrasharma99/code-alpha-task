import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const rows = await db
      .select({
        category: productsTable.category,
        count: sql<number>`count(*)`,
      })
      .from(productsTable)
      .groupBy(productsTable.category);

    const categoryMeta: Record<string, { slug: string; imageUrl: string }> = {
      "Electronics": { slug: "electronics", imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400" },
      "Fashion": { slug: "fashion", imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400" },
      "Home & Furniture": { slug: "home-furniture", imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400" },
      "Books": { slug: "books", imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400" },
      "Sports": { slug: "sports", imageUrl: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400" },
      "Beauty": { slug: "beauty", imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400" },
      "Toys": { slug: "toys", imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400" },
    };

    const categories = rows.map((row, i) => ({
      id: i + 1,
      name: row.category,
      slug: categoryMeta[row.category]?.slug ?? row.category.toLowerCase().replace(/\s+/g, "-"),
      imageUrl: categoryMeta[row.category]?.imageUrl ?? `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400`,
      productCount: Number(row.count),
    }));

    res.json(categories);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
