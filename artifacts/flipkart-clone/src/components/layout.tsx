import { Link, useLocation } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { ShoppingCart, Package, Search, Menu, LogOut, User as UserIcon } from "lucide-react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Header() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cart } = useGetCart(
    { userId: user?.id ?? "" },
    { query: { enabled: !!user?.id, queryKey: getGetCartQueryKey({ userId: user?.id ?? "" }) } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center">
          <span className="font-sans font-black italic text-2xl tracking-tighter flex items-center gap-1">
            ShopFast
            <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block mb-1"></span>
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative">
          <Input 
            className="w-full bg-white text-black pl-4 pr-10 border-0 focus-visible:ring-2 focus-visible:ring-secondary/50 rounded-sm h-10" 
            placeholder="Search for products, brands and more"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 h-10 w-10 text-primary hover:bg-transparent hover:text-primary/80">
            <Search className="h-5 w-5" />
          </Button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="secondary" className="bg-white text-primary hover:bg-gray-100 font-semibold px-6 rounded-sm">
                Login
              </Button>
            </Link>
          </Show>

          <Show when="signed-in">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white gap-2 font-semibold">
                  <UserIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">{user?.firstName || "Account"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="cursor-pointer flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" })}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/cart">
              <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white gap-2 font-semibold relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:inline">Cart</span>
                {cart && cart.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </Show>

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="flex relative">
          <Input 
            className="w-full bg-white text-black pl-4 pr-10 border-0 rounded-sm h-10" 
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 h-10 w-10 text-primary hover:bg-transparent">
            <Search className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </header>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto md:px-4 py-4 md:py-6">
        {children}
      </main>
      <footer className="bg-slate-900 text-slate-300 py-8 text-sm">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-slate-400 font-semibold mb-4 uppercase text-xs">About</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-400 font-semibold mb-4 uppercase text-xs">Help</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Payments</a></li>
              <li><a href="#" className="hover:text-white">Shipping</a></li>
              <li><a href="#" className="hover:text-white">Cancellation & Returns</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-400 font-semibold mb-4 uppercase text-xs">Policy</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Return Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Use</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-400 font-semibold mb-4 uppercase text-xs">Social</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Facebook</a></li>
              <li><a href="#" className="hover:text-white">Twitter</a></li>
              <li><a href="#" className="hover:text-white">YouTube</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-slate-800 text-center flex flex-col md:flex-row justify-between items-center">
          <div className="font-sans font-black italic text-xl tracking-tighter text-white mb-4 md:mb-0">ShopFast</div>
          <div>© {new Date().getFullYear()} ShopFast.com</div>
        </div>
      </footer>
    </div>
  );
}
