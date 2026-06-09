import { Link } from "wouter";
import { Product } from "@workspace/api-client-react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group cursor-pointer h-full border hover:shadow-lg transition-all duration-200 overflow-hidden bg-white rounded-sm hover-elevate">
        <CardContent className="p-0 flex flex-col h-full relative">
          {product.isFeatured && (
            <Badge className="absolute top-2 left-2 z-10 bg-secondary text-secondary-foreground hover:bg-secondary border-0">
              Featured
            </Badge>
          )}
          
          <div className="aspect-[4/5] relative w-full overflow-hidden p-4 bg-white flex items-center justify-center">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          <div className="p-4 flex-1 flex flex-col">
            <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">{product.brand}</div>
            
            <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2 flex-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-green-700 hover:bg-green-800 text-white rounded-sm px-1.5 py-0 text-xs font-bold border-0 flex items-center gap-1">
                {product.rating.toFixed(1)} <Star className="h-2.5 w-2.5 fill-current" />
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">({product.reviewCount})</span>
            </div>
            
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-base font-bold text-foreground">₹{product.price.toLocaleString('en-IN')}</span>
              {product.originalPrice && (
                <>
                  <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                  <span className="text-xs font-bold text-green-600">{discount}% off</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
