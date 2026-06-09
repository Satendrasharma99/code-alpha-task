import { useParams, useLocation } from "wouter";
import { useGetProduct, useAddToCart, getGetCartQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { useUser, Show } from "@clerk/react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Star, Truck, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(Number(id), {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(Number(id)) },
  });

  const addToCart = useAddToCart();

  const handleAddToCart = () => {
    if (!user?.id) {
      setLocation("/sign-in");
      return;
    }
    addToCart.mutate(
      { data: { userId: user.id, productId: product!.id, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ userId: user.id }) });
          toast({ title: "Added to cart", description: `${product!.name} added successfully.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="bg-white rounded-sm p-6 shadow-sm border border-border">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full rounded-sm" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="bg-white rounded-sm p-16 text-center shadow-sm border border-border">
          <h2 className="text-xl font-bold mb-2">Product not found</h2>
          <Button onClick={() => setLocation("/shop")} className="rounded-sm mt-4">Back to Shop</Button>
        </div>
      </Layout>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const inStock = product.stock > 0;

  return (
    <Layout>
      <div className="bg-white rounded-sm shadow-sm border border-border overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="bg-gray-50 flex items-center justify-center p-8 min-h-80 border-r border-border">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-96 object-contain w-full"
              data-testid="img-product"
            />
          </div>

          {/* Details */}
          <div className="p-6 md:p-8">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1" data-testid="text-brand">{product.brand}</div>
            <h1 className="text-xl md:text-2xl font-bold mb-3 leading-snug" data-testid="text-product-name">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-green-700 text-white border-0 flex items-center gap-1 rounded-sm px-2">
                {product.rating.toFixed(1)} <Star className="h-3 w-3 fill-current" />
              </Badge>
              <span className="text-sm text-muted-foreground">{product.reviewCount.toLocaleString("en-IN")} ratings</span>
            </div>

            <Separator className="mb-4" />

            {/* Price */}
            <div className="mb-5">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-foreground" data-testid="text-price">₹{product.price.toLocaleString("en-IN")}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-base text-muted-foreground line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
                    <Badge className="bg-secondary/10 text-secondary border-secondary/30 rounded-sm font-bold">{discount}% off</Badge>
                  </>
                )}
              </div>
              {inStock ? (
                <p className="text-green-600 text-sm font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> In Stock ({product.stock} left)
                </p>
              ) : (
                <p className="text-red-500 text-sm font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Out of Stock
                </p>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

            {/* Highlights */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: Truck, text: "Free delivery" },
                { icon: ShieldCheck, text: "1 Year warranty" },
                { icon: RefreshCw, text: "7 day return" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-sm text-center">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-col sm:flex-row">
              <Show when="signed-in">
                <Button
                  size="lg"
                  className="flex-1 bg-secondary hover:bg-secondary/90 text-white rounded-sm font-bold"
                  onClick={handleAddToCart}
                  disabled={!inStock || addToCart.isPending}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {addToCart.isPending ? "Adding..." : "Add to Cart"}
                </Button>
              </Show>
              <Show when="signed-out">
                <Button
                  size="lg"
                  className="flex-1 bg-secondary hover:bg-secondary/90 text-white rounded-sm font-bold"
                  onClick={() => setLocation("/sign-in")}
                  data-testid="button-sign-in-to-buy"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" /> Sign in to Buy
                </Button>
              </Show>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 rounded-sm font-bold border-primary text-primary hover:bg-primary hover:text-white"
                onClick={() => setLocation("/shop")}
                data-testid="button-continue-shopping"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
