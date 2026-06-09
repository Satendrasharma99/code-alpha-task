import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Shop() {
  const searchStr = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(searchStr);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);

  const { data: categories } = useListCategories();

  const queryParams = {
    ...(search && { search }),
    ...(category && { category }),
    ...(priceRange[0] > 0 && { minPrice: priceRange[0] }),
    ...(priceRange[1] < 200000 && { maxPrice: priceRange[1] }),
    sortBy,
    limit: 24,
    page: 1,
  };

  const { data, isLoading } = useListProducts(queryParams);

  useEffect(() => {
    const p = new URLSearchParams(searchStr);
    setSearch(p.get("search") ?? "");
    setCategory(p.get("category") ?? "");
  }, [searchStr]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setSortBy("newest");
    setPriceRange([0, 200000]);
    setLocation("/shop");
  };

  const hasFilters = search || category || priceRange[0] > 0 || priceRange[1] < 200000;

  function FilterPanel() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wide text-muted-foreground">Categories</h3>
          <div className="space-y-1">
            <button
              onClick={() => setCategory("")}
              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${!category ? "text-primary font-semibold" : "text-foreground hover:text-primary"}`}
              data-testid="filter-category-all"
            >
              All Categories
            </button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.name)}
                className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex justify-between items-center ${category === cat.name ? "text-primary font-semibold" : "text-foreground hover:text-primary"}`}
                data-testid={`filter-category-${cat.slug}`}
              >
                <span>{cat.name}</span>
                <span className="text-xs text-muted-foreground">({cat.productCount})</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wide text-muted-foreground">Price Range</h3>
          <div className="px-1">
            <Slider
              min={0}
              max={200000}
              step={500}
              value={priceRange}
              onValueChange={(val) => setPriceRange(val as [number, number])}
              className="mb-3"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>₹{priceRange[0].toLocaleString("en-IN")}</span>
              <span>₹{priceRange[1].toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {hasFilters && (
          <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" /> Clear all filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex gap-4">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="bg-white rounded-sm p-4 shadow-sm border border-border sticky top-20">
            <h2 className="font-bold mb-4 text-base">Filters</h2>
            <FilterPanel />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="bg-white rounded-sm p-3 mb-3 shadow-sm border border-border flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-40">
              <Input
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 text-sm rounded-sm"
                data-testid="input-search"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Sort by:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 text-xs w-36 rounded-sm" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile filter */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden h-8 text-xs rounded-sm">
                  <SlidersHorizontal className="h-3 w-3 mr-1" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active filter chips */}
          {(category || search) && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {category && (
                <Badge variant="secondary" className="rounded-sm cursor-pointer" onClick={() => setCategory("")} data-testid="badge-filter-category">
                  {category} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {search && (
                <Badge variant="secondary" className="rounded-sm cursor-pointer" onClick={() => setSearch("")} data-testid="badge-filter-search">
                  "{search}" <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          )}

          {/* Results header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${data?.total ?? 0} products found`}
            </p>
          </div>

          {/* Product grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-sm p-4 space-y-3">
                  <Skeleton className="aspect-[4/5] w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : data?.products && data.products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-sm p-16 text-center shadow-sm border border-border">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-semibold text-lg mb-2">No products found</h3>
              <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters or search term</p>
              <Button variant="outline" onClick={clearFilters} className="rounded-sm">Clear Filters</Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
