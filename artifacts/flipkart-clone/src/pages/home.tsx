import { Link } from "wouter";
import { useGetFeaturedProducts, useListCategories, useGetStoreSummary } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Headphones } from "lucide-react";

function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Skeleton className="w-16 h-16 rounded-full" />
      <Skeleton className="w-16 h-3" />
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-sm p-4 space-y-3">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

export default function Home() {
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedProducts();
  const { data: categories, isLoading: catsLoading } = useListCategories();
  const { data: summary } = useGetStoreSummary();

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="relative rounded-sm overflow-hidden mb-6 bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
        <div className="px-8 py-12 md:py-16 md:px-16 max-w-2xl relative z-10">
          <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/20">
            Summer Sale 2025
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Shop Everything.<br />
            <span className="text-secondary">Delivered Fast.</span>
          </h1>
          <p className="text-slate-300 mb-6 text-base md:text-lg">
            Millions of products across electronics, fashion, home & more — at prices that make you smile.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/shop">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold px-8 rounded-sm">
                Shop Now <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-sm">
                View Deals
              </Button>
            </Link>
          </div>
          {summary && (
            <div className="mt-8 flex gap-6 text-sm text-slate-300">
              <div><span className="text-white font-bold text-lg">{summary.totalProducts}+</span><br />Products</div>
              <div><span className="text-white font-bold text-lg">{summary.totalCategories}+</span><br />Categories</div>
              <div><span className="text-white font-bold text-lg">Fast</span><br />Delivery</div>
            </div>
          )}
        </div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #2874f0 0%, transparent 60%)" }} />
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { icon: Truck, label: "Free Delivery", sub: "On orders above ₹499" },
          { icon: ShieldCheck, label: "Secure Payment", sub: "100% protected" },
          { icon: RefreshCw, label: "Easy Returns", sub: "7-day return policy" },
          { icon: Headphones, label: "24/7 Support", sub: "Dedicated help team" },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="bg-white rounded-sm p-4 flex items-center gap-3 shadow-sm border border-border">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Browser */}
      <section className="mb-8">
        <div className="bg-white rounded-sm p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-foreground">Shop by Category</h2>
            <Link href="/shop" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
            {catsLoading
              ? Array.from({ length: 7 }).map((_, i) => <CategorySkeleton key={i} />)
              : categories?.map(cat => (
                <Link key={cat.id} href={`/shop?category=${encodeURIComponent(cat.name)}`}>
                  <div className="flex flex-col items-center gap-2 group cursor-pointer" data-testid={`category-${cat.slug}`}>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-xs font-medium text-center text-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="bg-white rounded-sm p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Featured Products</h2>
              <p className="text-sm text-muted-foreground">Handpicked deals just for you</p>
            </div>
            <Link href="/shop" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {featuredLoading
              ? Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} />)
              : featured?.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            }
          </div>
        </div>
      </section>
    </Layout>
  );
}
