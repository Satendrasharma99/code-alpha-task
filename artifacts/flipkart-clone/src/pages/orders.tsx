import { useState } from "react";
import { useLocation, Redirect } from "wouter";
import { useUser, Show } from "@clerk/react";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ChevronDown, ChevronUp, ArrowRight, ShoppingBag } from "lucide-react";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

function OrdersContent({ userId }: { userId: string }) {
  const [, setLocation] = useLocation();
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const { data: orders, isLoading } = useListOrders(
    { userId },
    { query: { enabled: !!userId, queryKey: getListOrdersQueryKey({ userId }) } }
  );

  const toggleOrder = (id: number) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-sm p-5 space-y-3 shadow-sm border border-border">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="bg-white rounded-sm p-16 text-center shadow-sm border border-border">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">No orders yet</h2>
        <p className="text-muted-foreground text-sm mb-6">Your order history will appear here once you place an order.</p>
        <Button onClick={() => setLocation("/shop")} className="rounded-sm bg-primary font-bold">
          Start Shopping <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => {
        const isExpanded = expandedOrders.has(order.id);
        const date = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

        return (
          <div key={order.id} className="bg-white rounded-sm shadow-sm border border-border overflow-hidden" data-testid={`order-${order.id}`}>
            <div
              className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleOrder(order.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm" data-testid={`text-order-id-${order.id}`}>Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground">{date} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-base" data-testid={`text-order-total-${order.id}`}>₹{order.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-sm border capitalize ${statusColor[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-border">
                <div className="px-5 py-3 bg-gray-50 text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">Shipping to:</span>
                  {order.shippingAddress}
                </div>
                <div className="divide-y divide-border">
                  {order.items.map(item => (
                    <div key={item.id} className="p-4 flex items-center gap-4" data-testid={`order-item-${item.id}`}>
                      <div className="w-14 h-14 flex-shrink-0 bg-gray-50 rounded-sm flex items-center justify-center overflow-hidden p-1">
                        <img src={item.product.imageUrl} alt={item.product.name} className="object-contain w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} · ₹{item.price.toLocaleString("en-IN")} each</p>
                      </div>
                      <div className="text-sm font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Orders() {
  const { user, isLoaded } = useUser();

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-xl font-bold">My Orders</h1>
        <p className="text-sm text-muted-foreground">Track and manage your recent orders</p>
      </div>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
      <Show when="signed-in">
        {isLoaded && user ? <OrdersContent userId={user.id} /> : null}
      </Show>
    </Layout>
  );
}
