import { useState } from "react";
import { useLocation, Redirect } from "wouter";
import { useUser, Show } from "@clerk/react";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
  useCreateOrder,
  getGetCartQueryKey,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

function CartContent({ userId }: { userId: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [shippingAddress, setShippingAddress] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const { data: cart, isLoading } = useGetCart(
    { userId },
    { query: { enabled: !!userId, queryKey: getGetCartQueryKey({ userId }) } }
  );

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const createOrder = useCreateOrder();

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ userId }) });

  const handleUpdateQty = (itemId: number, quantity: number) => {
    if (quantity < 1) return handleRemove(itemId);
    updateItem.mutate(
      { itemId, data: { quantity } },
      { onSuccess: invalidateCart, onError: () => toast({ title: "Error", variant: "destructive" }) }
    );
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate(
      { itemId },
      { onSuccess: invalidateCart, onError: () => toast({ title: "Error", variant: "destructive" }) }
    );
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddress.trim()) {
      toast({ title: "Address required", description: "Please enter your shipping address.", variant: "destructive" });
      return;
    }
    if (!cart?.items.length) return;
    setIsPlacingOrder(true);
    createOrder.mutate(
      {
        data: {
          userId,
          shippingAddress,
          items: cart.items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.product.price })),
        },
      },
      {
        onSuccess: (order) => {
          clearCart.mutate(
            { userId },
            {
              onSuccess: () => {
                invalidateCart();
                queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({ userId }) });
                toast({ title: "Order placed!", description: `Order #${order.id} confirmed.` });
                setLocation("/orders");
              },
            }
          );
        },
        onError: () => {
          toast({ title: "Order failed", description: "Could not place order. Try again.", variant: "destructive" });
          setIsPlacingOrder(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-sm p-4 flex gap-4">
            <Skeleton className="w-20 h-20 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!cart?.items.length) {
    return (
      <div className="bg-white rounded-sm p-16 text-center shadow-sm border border-border">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground text-sm mb-6">Add items from the shop to see them here.</p>
        <Button onClick={() => setLocation("/shop")} className="rounded-sm bg-secondary hover:bg-secondary/90 font-bold">
          Shop Now <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Cart items */}
      <div className="md:col-span-2 space-y-3">
        {cart.items.map(item => (
          <div key={item.id} className="bg-white rounded-sm p-4 shadow-sm border border-border flex gap-4" data-testid={`cart-item-${item.id}`}>
            <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-sm overflow-hidden flex items-center justify-center p-1">
              <img src={item.product.imageUrl} alt={item.product.name} className="object-contain w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-semibold uppercase">{item.product.brand}</p>
              <p className="font-medium text-sm line-clamp-2 mb-1" data-testid={`text-item-name-${item.id}`}>{item.product.name}</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-bold text-base" data-testid={`text-item-price-${item.id}`}>₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</span>
                {item.product.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">₹{(item.product.originalPrice * item.quantity).toLocaleString("en-IN")}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-sm">
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 rounded-none"
                    onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                    disabled={updateItem.isPending}
                    data-testid={`button-decrease-${item.id}`}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold" data-testid={`text-qty-${item.id}`}>{item.quantity}</span>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 rounded-none"
                    onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                    disabled={updateItem.isPending}
                    data-testid={`button-increase-${item.id}`}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost" size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-sm h-7 text-xs"
                  onClick={() => handleRemove(item.id)}
                  disabled={removeItem.isPending}
                  data-testid={`button-remove-${item.id}`}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="space-y-3">
        <div className="bg-white rounded-sm p-5 shadow-sm border border-border">
          <h2 className="font-bold text-base mb-4 pb-2 border-b border-border">Price Details</h2>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price ({cart.itemCount} items)</span>
              <span>₹{cart.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery charges</span>
              <span className="text-green-600 font-semibold">Free</span>
            </div>
          </div>
          <Separator className="mb-4" />
          <div className="flex justify-between font-bold text-base mb-5">
            <span>Total Amount</span>
            <span data-testid="text-cart-total">₹{cart.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>

          <div className="mb-4">
            <Label className="text-sm font-semibold mb-2 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Shipping Address
            </Label>
            <Textarea
              placeholder="Enter your full delivery address including pincode..."
              value={shippingAddress}
              onChange={e => setShippingAddress(e.target.value)}
              className="rounded-sm text-sm resize-none"
              rows={3}
              data-testid="input-shipping-address"
            />
          </div>

          <Button
            className="w-full rounded-sm bg-secondary hover:bg-secondary/90 font-bold"
            size="lg"
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || createOrder.isPending}
            data-testid="button-place-order"
          >
            {isPlacingOrder ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const { user, isLoaded } = useUser();

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-xl font-bold">My Cart</h1>
      </div>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
      <Show when="signed-in">
        {isLoaded && user ? <CartContent userId={user.id} /> : null}
      </Show>
    </Layout>
  );
}
