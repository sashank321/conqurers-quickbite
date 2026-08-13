import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ShoppingBag,
  User,
  LogOut,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Search,
  Activity,
  CreditCard,
  QrCode,
  Banknote,
  X,
  History,
  LayoutDashboard,
  Package,
  TrendingUp,
  Star,
  Clock,
  Flame,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Edit3,
  Eye,
  RefreshCw,
  BarChart2,
} from "lucide-react";
import {
  api,
  Product,
  CartData,
  OrderData,
  AuthUser,
  AdminAnalytics,
  getStoredUser,
} from "@/lib/api";

// Real hero food images
import heroPizza from "@/assets/hero-pizza.avif";
import heroBurger from "@/assets/hero-burger2.avif";
import heroHotdog from "@/assets/hero-hotdog.avif";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HotBite — Campus Food Ordering System" },
      {
        name: "description",
        content:
          "Order delicious campus food online. Browse menu, add to cart, and track your order in real time.",
      },
    ],
  }),
  component: Index,
});

const CATEGORIES = [
  "All",
  "Burgers",
  "Pizza",
  "Biryani",
  "South Indian",
  "Snacks",
  "Beverages",
  "Desserts",
];

const ORDER_STEPS = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
] as const;

const ORDER_STATUS_LABELS: Record<string, string> = {
  PLACED: "Order Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready for Pickup",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Colored letters: each char gets a color from the palette
const LETTER_COLORS = [
  "#F5A623", "#FF6B35", "#FF3D71", "#FFC947", "#F5A623",
  "#FF8C42", "#FFD166", "#FF6B6B", "#F5A623", "#FFBE0B",
];

function ColoredText({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((char, i) =>
        char === " " ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <motion.span
            key={i}
            style={{ color: LETTER_COLORS[i % LETTER_COLORS.length], display: "inline-block" }}
            initial={{ y: -60, opacity: 0, rotateX: -90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            transition={{ delay: i * 0.045, type: "spring", stiffness: 200, damping: 18 }}
            whileHover={{ scale: 1.15, y: -4, transition: { duration: 0.15 } }}
          >
            {char}
          </motion.span>
        )
      )}
    </>
  );
}

const HERO_SLIDES = [
  {
    headline: "WRAPPED",
    subline: "IN FLAVOR",
    tags: ["Spicy 🌶️", "Loaded 🔥", "Snappy ⚡"],
    bg: "#3B1A08",
    accent: "#F5A623",
    image: heroHotdog,
    imageStyle: { transform: "rotate(-8deg) scale(1.1)" },
  },
  {
    headline: "CRAFTED",
    subline: "WITH FIRE",
    tags: ["Stretchy 🧀", "Cheesy 🍕", "Crispy 🔥"],
    bg: "#1a0a03",
    accent: "#E8930A",
    image: heroPizza,
    imageStyle: { transform: "rotate(4deg) scale(1.05)" },
  },
  {
    headline: "SMASH",
    subline: "AND BOLD",
    tags: ["Juicy 💧", "Cheesy 🧀", "Saucy 🥵"],
    bg: "#0f1f0a",
    accent: "#4CAF50",
    image: heroBurger,
    imageStyle: { transform: "rotate(-3deg) scale(1.08)" },
  },
];

// ── Click Particle System ──
const CLICK_PARTICLES = ["🌶️","🔥","⚡","🍕","🍔","🌭","🧀","⭐","❤️","💥","✨","🤩"];

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  vx: number;
  vy: number;
}

function ClickParticles({ particles }: { particles: Particle[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[999] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, scale: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: p.x + p.vx * 80,
              y: p.y + p.vy * 80,
              scale: [0, 1.4, 0.8, 0],
              opacity: [1, 1, 0.5, 0],
              rotate: p.vx > 0 ? 180 : -180,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{
              position: "fixed",
              fontSize: "1.6rem",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const MARQUEE_ITEMS = [
  "Fresh Daily 🌶️",
  "Fast Service ⚡",
  "Bold Flavor 🔥",
  "Served Hot 🍽️",
  "Order Online 📱",
  "Campus Favorite ❤️",
  "Handmade Recipes 👨‍🍳",
  "Premium Ingredients ⭐",
];

const TESTIMONIALS = [
  {
    name: "Arjun K.",
    handle: "@arjun_campus",
    text: "The biryani here is absolutely incredible. Crispy fried rice, amazing sauces, and the portions are huge. Best campus food ever!",
    stars: 5,
    avatar: "AK",
  },
  {
    name: "Priya M.",
    handle: "@priya.m",
    text: "Love how I can order from my phone and pick it up fresh. The burger always tastes amazing and they're so fast with delivery.",
    stars: 5,
    avatar: "PM",
  },
  {
    name: "Rohit S.",
    handle: "@rohit_sinha",
    text: "Consistent quality every single time. The food stays hot and the website makes ordering super easy. Campus life is better!",
    stars: 5,
    avatar: "RS",
  },
  {
    name: "Divya N.",
    handle: "@divya.n",
    text: "Best campus canteen app by far! The cart system is smooth, and you can track your order status live. 10/10 would recommend.",
    stars: 5,
    avatar: "DN",
  },
];

const FEATURES = [
  { icon: "🌶️", title: "Fresh Sauces", desc: "House-made sauces crafted daily for bold flavor." },
  { icon: "🌙", title: "Open Late", desc: "Fresh campus food available for every craving." },
  { icon: "🍗", title: "Big Portions", desc: "Loaded meals made to satisfy every craving." },
  { icon: "🛵", title: "Fast Service", desc: "Quick ordering designed for busy campus life." },
  { icon: "🚀", title: "No Long Waits", desc: "Track your order from placed to ready in real time." },
  { icon: "🌯", title: "Combo Friendly", desc: "Fresh combo meals perfect for quick bites and sharing." },
];

// ───── Smooth Scroll Hook ─────
function useFadeIn() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".fade-up");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      { threshold: 0.15 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
}

// ───── QR Code Generator (simple SVG placeholder) ─────
function QRCodeDisplay({ value }: { value: string }) {
  const size = 120;
  const cells = 10;
  const cellSize = size / cells;
  const pattern: boolean[][] = [];
  for (let i = 0; i < cells; i++) {
    pattern[i] = [] as boolean[];
    for (let j = 0; j < cells; j++) {
      const hash = ((value.charCodeAt(i % value.length) * 31 + j * 17) ^ (i * 7)) % 4;
      (pattern[i] as boolean[])[j] = hash < 2;
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto border-4 border-white rounded-lg shadow-lg">
      <rect width={size} height={size} fill="white" />
      {pattern.map((row, i) =>
        row.map((cell, j) =>
          cell ? (
            <rect
              key={`${i}-${j}`}
              x={j * cellSize}
              y={i * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#3B1A08"
            />
          ) : null
        )
      )}
      {/* Finder patterns */}
      <rect x="0" y="0" width={cellSize * 3} height={cellSize * 3} fill="#3B1A08" />
      <rect x={cellSize} y={cellSize} width={cellSize} height={cellSize} fill="white" />
      <rect x={size - cellSize * 3} y="0" width={cellSize * 3} height={cellSize * 3} fill="#3B1A08" />
      <rect x={size - cellSize * 2} y={cellSize} width={cellSize} height={cellSize} fill="white" />
      <rect x="0" y={size - cellSize * 3} width={cellSize * 3} height={cellSize * 3} fill="#3B1A08" />
      <rect x={cellSize} y={size - cellSize * 2} width={cellSize} height={cellSize} fill="white" />
    </svg>
  );
}

function Index() {
  useFadeIn();

  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("student1@quickbite.com");
  const [authPassword, setAuthPassword] = useState("Student@123");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart
  const [cart, setCart] = useState<CartData | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("UPI");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  // Orders
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState<OrderData[]>([]);
  const [activeOrder, setActiveOrder] = useState<OrderData | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Admin
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<"analytics" | "orders" | "products">("analytics");
  const [allOrders, setAllOrders] = useState<OrderData[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ category: "Burgers", available: true, stock: 10 });
  const [showProductForm, setShowProductForm] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("");

  // Hero slider
  const [heroSlide, setHeroSlide] = useState(0);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Particles state
  const [particles, setParticles] = useState<Particle[]>([]);

  // Click particles effect
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newParticles = Array.from({ length: 4 }).map((_, i) => ({
        id: Date.now() + i,
        x: e.clientX,
        y: e.clientY,
        emoji: CLICK_PARTICLES[Math.floor(Math.random() * CLICK_PARTICLES.length)]!,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      }));
      setParticles((prev) => [...prev, ...newParticles].slice(-20)); // Keep max 20
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // ─── Initial Load ───
  useEffect(() => {
    const user = getStoredUser();
    if (user) setCurrentUser(user);

    api.checkHealth()
      .then((res) => setApiConnected(res.success))
      .catch(() => setApiConnected(false));

    loadProducts();
  }, []);

  // Hero auto-slide
  useEffect(() => {
    const t = setInterval(() => setHeroSlide((s) => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Sync cart
  useEffect(() => {
    if (currentUser?.role === "student") {
      loadCart();
    } else {
      setCart(null);
    }
  }, [currentUser]);

  // Fade-up re-apply on content change
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".fade-up:not(.in-view)");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); });
      },
      { threshold: 0.15 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [products]);

  // ─── Data Loaders ───
  const loadProducts = useCallback(async (category = selectedCategory, search = searchQuery) => {
    setLoadingProducts(true);
    try {
      const cat = category === "All" ? undefined : category;
      const data = await api.getProducts(cat, search || undefined);
      setProducts(data);
    } catch (err: any) {
      toast.error("Failed to load menu: " + err.message);
    } finally {
      setLoadingProducts(false);
    }
  }, [selectedCategory, searchQuery]);

  const loadCart = async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch { /* silent */ }
  };

  const loadOrders = async () => {
    try {
      const data = await api.getMyOrders();
      setMyOrders(data);
    } catch (err: any) {
      toast.error("Failed to load orders: " + err.message);
    }
  };

  const loadAdminData = async () => {
    setAdminLoading(true);
    try {
      const [analyticsData, ordersData, productsData] = await Promise.all([
        api.getAnalytics(),
        api.getAllOrders(orderStatusFilter || undefined),
        api.getProducts(),
      ]);
      setAnalytics(analyticsData);
      setAllOrders(ordersData);
      setAdminProducts(productsData);
    } catch (err: any) {
      toast.error("Failed to load admin data: " + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  // ─── Handlers ───
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    loadProducts(cat, searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadProducts(selectedCategory, val), 400);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      let user: AuthUser;
      if (authMode === "login") {
        user = await api.login(authEmail, authPassword);
        toast.success(`Welcome back, ${user.name}! 🔥`);
      } else {
        user = await api.register(authName, authEmail, authPassword);
        toast.success(`Welcome to HotBite, ${user.name}! 🎉`);
      }
      setCurrentUser(user);
      setIsAuthOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setCart(null);
    setMyOrders([]);
    setIsAdminOpen(false);
    toast.info("Logged out successfully");
  };

  const handleAddToCart = async (product: Product) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      toast.info("Please login to add items to your cart");
      return;
    }
    if (currentUser.role !== "student") {
      toast.error("Admin accounts cannot place orders. Use a student account.");
      return;
    }
    try {
      const updatedCart = await api.addToCart(product._id, 1);
      setCart(updatedCart);
      toast.success(`Added "${product.name}" to cart! 🛒`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add to cart");
    }
  };

  const handleUpdateQty = async (productId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    try {
      if (newQty <= 0) {
        const updatedCart = await api.removeCartItem(productId);
        setCart(updatedCart);
      } else {
        const updatedCart = await api.updateCartQuantity(productId, newQty);
        setCart(updatedCart);
      }
    } catch (err: any) {
      toast.error(err.message || "Could not update quantity");
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setShowPaymentConfirm(true);
  };

  const confirmOrder = async () => {
    setShowPaymentConfirm(false);
    setPlacingOrder(true);
    try {
      const order = await api.createOrder(paymentMethod);
      toast.success(`🎉 Order #${order.orderNumber} placed! ₹${order.totalAmount}`);
      setCart(null);
      setIsCartOpen(false);
      await loadProducts();
      await loadOrders();
      setActiveOrder(order);
      setIsOrdersOpen(true);
      setShowQR(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  // Admin handlers
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setAllOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      toast.success(`Order status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update order status");
    }
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct._id, newProduct);
        toast.success("Product updated successfully!");
      } else {
        await api.createProduct(newProduct);
        toast.success("Product created successfully!");
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setNewProduct({ category: "Burgers", available: true, stock: 10 });
      loadAdminData();
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.deleteProduct(id);
      toast.success("Product deleted");
      loadAdminData();
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({ ...product });
    setShowProductForm(true);
  };

  const totalCartCount = cart?.items.reduce((acc, i) => acc + i.quantity, 0) || 0;
  const currentSlide = HERO_SLIDES[heroSlide] ?? HERO_SLIDES[0]!;

  // ─── Render ───
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "DM Sans, sans-serif" }}>
      <ClickParticles particles={particles} />

      {/* ── Top Marquee Ticker ── */}
      <div
        className="overflow-hidden py-2 text-xs font-bold"
        style={{ background: currentSlide.accent, color: "#3B1A08" }}
      >
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="mx-8 whitespace-nowrap">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Sticky Navbar ── */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: "rgba(253, 243, 227, 0.92)", backdropFilter: "blur(12px)", borderColor: "rgba(59,26,8,0.12)" }}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          {/* Logo */}
          <a href="#top" className="flex items-center gap-2.5">
            <span className="text-2xl">🍔</span>
            <span
              style={{ fontFamily: "Anton, sans-serif", fontSize: "1.5rem", color: "#3B1A08", letterSpacing: "-0.01em", textTransform: "uppercase" }}
            >
              Hot<span style={{ color: currentSlide.accent }}>Bite</span>
            </span>
          </a>

          {/* Center nav */}
          <div className="hidden items-center gap-7 text-sm font-semibold md:flex" style={{ color: "#3B1A08" }}>
            <a href="#about" className="opacity-70 transition hover:opacity-100">About</a>
            <a href="#menu" className="opacity-70 transition hover:opacity-100">Menu</a>
            <a href="#specials" className="opacity-70 transition hover:opacity-100">Specials</a>
            <a href="#delivery" className="opacity-70 transition hover:opacity-100">Delivery</a>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            {/* API status */}
            <div
              className="hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold sm:flex"
              style={{ borderColor: "rgba(59,26,8,0.15)", background: "rgba(59,26,8,0.05)", color: "#3B1A08" }}
            >
              <Activity className={`h-3 w-3 ${apiConnected ? "text-green-500 animate-pulse" : "text-amber-500"}`} />
              <span>{apiConnected ? "Live" : "Connecting..."}</span>
            </div>

            {/* Admin dashboard */}
            {currentUser?.role === "admin" && (
              <button
                id="admin-dashboard-btn"
                onClick={() => { setIsAdminOpen(true); loadAdminData(); }}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all"
                style={{ background: "#3B1A08", color: currentSlide.accent }}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* My Orders */}
            {currentUser && (
              <button
                id="my-orders-btn"
                onClick={() => { loadOrders(); setIsOrdersOpen(true); }}
                className="flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all hover:opacity-80"
                style={{ borderColor: "rgba(59,26,8,0.2)", color: "#3B1A08" }}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Orders</span>
              </button>
            )}

            {/* Cart */}
            <button
              id="cart-btn"
              onClick={() => { if (!currentUser) { setIsAuthOpen(true); return; } setIsCartOpen(true); }}
              className="relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase transition-transform hover:scale-105"
              style={{ background: currentSlide.accent, color: "#3B1A08" }}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black"
                  style={{ background: "#3B1A08", color: currentSlide.accent }}>
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-bold md:inline" style={{ color: "#3B1A08" }}>
                  {currentUser.name.split(" ")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="rounded-full border p-2 transition-colors hover:opacity-70"
                  style={{ borderColor: "rgba(59,26,8,0.2)", color: "#3B1A08" }}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                id="login-btn"
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold uppercase transition-all hover:opacity-80"
                style={{ borderColor: "rgba(59,26,8,0.25)", color: "#3B1A08" }}
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* ── Hero Section ── */}
      <section
        id="top"
        className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-5"
        style={{
          background: currentSlide.bg,
          transition: "background 0.8s ease",
        }}
      >
        {/* Giant background text */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none"
          style={{
            fontFamily: "Anton, sans-serif",
            fontSize: "clamp(5rem, 20vw, 18rem)",
            lineHeight: 0.88,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
          }}
        >
          <div><ColoredText text={currentSlide.headline} /></div>
          <div><ColoredText text={currentSlide.subline} /></div>
        </div>

        {/* Real Food Image (Framer Motion) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={heroSlide}
            className="pointer-events-none absolute z-10 flex items-center justify-center"
            style={{
              top: "20%",
              left: "50%",
              width: "clamp(250px, 45vw, 600px)",
              height: "clamp(250px, 45vw, 600px)",
              filter: "drop-shadow(0 32px 48px rgba(0,0,0,0.6))",
            }}
            initial={{ opacity: 0, scale: 0.8, x: "-50%", y: 50, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.1, x: "-50%", y: -50, rotate: 20 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
          >
            <img
              src={currentSlide.image}
              alt={currentSlide.headline}
              className="w-full h-full object-contain"
              style={currentSlide.imageStyle}
            />
          </motion.div>
        </AnimatePresence>

        {/* Tag bubbles */}
        {currentSlide.tags.map((tag, i) => (
          <div
            key={tag}
            className="absolute rounded-full px-4 py-1.5 text-sm font-bold"
            style={{
              background: currentSlide.accent + "22",
              border: `2px solid ${currentSlide.accent}`,
              color: currentSlide.accent,
              top: `${28 + i * 8}%`,
              left: i === 0 ? "18%" : i === 1 ? "14%" : "22%",
              fontFamily: "DM Sans, sans-serif",
              backdropFilter: "blur(8px)",
            }}
          >
            {tag}
          </div>
        ))}

        {/* Main copy */}
        <div className="relative z-10 mt-[52vh] text-center">
          <p className="text-sm font-semibold" style={{ color: currentSlide.accent + "aa" }}>
            Crispy, juicy campus food made the right way.
          </p>
          <div className="mt-5 flex items-center justify-center gap-4">
            <a
              href="#menu"
              className="rounded-full px-7 py-3 text-sm font-bold uppercase transition-transform hover:scale-105"
              style={{ background: currentSlide.accent, color: "#3B1A08" }}
            >
              View Menu
            </a>
            <a
              href="#about"
              className="rounded-full border px-7 py-3 text-sm font-bold uppercase transition-colors hover:opacity-80"
              style={{ borderColor: currentSlide.accent + "88", color: currentSlide.accent }}
            >
              Our Story
            </a>
          </div>
        </div>

        {/* Slide controls */}
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-3">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === heroSlide ? 28 : 8,
                background: i === heroSlide ? currentSlide.accent : currentSlide.accent + "44",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => setHeroSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border p-2.5 transition hover:opacity-80"
          style={{ borderColor: currentSlide.accent + "44", color: currentSlide.accent, background: "#00000044" }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setHeroSlide((s) => (s + 1) % HERO_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border p-2.5 transition hover:opacity-80"
          style={{ borderColor: currentSlide.accent + "44", color: currentSlide.accent, background: "#00000044" }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Wave bottom */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: 60 }}>
          <path d="M0 60 C360 0 1080 60 1440 0 L1440 60 Z" fill="#FDF3E3" />
        </svg>
      </section>

      {/* ── About Section ── */}
      <section id="about" className="mx-auto max-w-7xl px-5 py-20" style={{ background: "#FDF3E3" }}>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center fade-up">
          {/* Photo collage */}
          <div className="relative flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4" style={{ transform: "rotate(-2deg)" }}>
              <div className="col-span-2 h-48 overflow-hidden rounded-2xl shadow-xl" style={{ border: "4px solid white" }}>
                <div className="h-full w-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-7xl">🍕</div>
              </div>
              <div className="h-36 overflow-hidden rounded-2xl shadow-xl" style={{ border: "4px solid white", transform: "rotate(2deg)" }}>
                <div className="h-full w-full bg-gradient-to-br from-red-100 to-orange-200 flex items-center justify-center text-5xl">🍔</div>
              </div>
              <div className="h-36 overflow-hidden rounded-2xl shadow-xl" style={{ border: "4px solid white", transform: "rotate(-1deg)" }}>
                <div className="h-full w-full bg-gradient-to-br from-yellow-100 to-amber-200 flex items-center justify-center text-5xl">🌯</div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <h2
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: "clamp(3rem, 8vw, 5rem)",
                color: "#3B1A08",
                textTransform: "uppercase",
                lineHeight: 0.9,
              }}
            >
              About
            </h2>
            <p className="mt-6 text-base leading-relaxed" style={{ color: "#5A3820" }}>
              HotBite is inspired by the energy of campus food culture — bold flavors, fast service, and food made fresh every single day.
            </p>
            <p className="mt-3 text-base leading-relaxed" style={{ color: "#5A3820" }}>
              From loaded wraps to smoky grilled classics, every bite is crafted with fresh ingredients, handmade recipes, and unforgettable flavor.
            </p>
            <a
              href="#menu"
              className="mt-6 inline-block rounded-full px-7 py-3 text-sm font-bold uppercase transition-transform hover:scale-105"
              style={{ background: "#F5A623", color: "#3B1A08" }}
            >
              Explore The Menu
            </a>
          </div>
        </div>
      </section>

      {/* ── "Flavor That Speaks Loud" section ── */}
      <section className="py-20 text-center" style={{ background: "#3B1A08" }}>
        <div className="fade-up">
          <h2
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: "clamp(3rem, 10vw, 8rem)",
              color: "#F5A623",
              textTransform: "uppercase",
              lineHeight: 0.88,
            }}
          >
            Flavor That<br />Speaks Loud
          </h2>
          <p className="mt-4 text-sm" style={{ color: "#FDF3E3aa" }}>Bold street flavors served fresh daily.</p>
          <div className="mt-6 flex items-center justify-center gap-4">
            {["🔥", "⭐", "❤️", "🍗"].map((emoji, i) => (
              <div key={i}
                className="flex h-12 w-12 items-center justify-center rounded-full text-xl"
                style={{ background: "#F5A62333", border: "2px solid #F5A62355" }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why We Hit Different ── */}
      <section className="py-20" style={{ background: "#3B1A08" }}>
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="fade-up">
              <h2
                style={{
                  fontFamily: "Anton, sans-serif",
                  fontSize: "clamp(2.5rem, 6vw, 4rem)",
                  color: "#FDF3E3",
                  textTransform: "uppercase",
                  lineHeight: 0.92,
                }}
              >
                Why We Hit<br />Different
              </h2>
              <div className="mt-10 grid grid-cols-2 gap-8">
                {FEATURES.map((f) => (
                  <div key={f.title} className="fade-up">
                    <div
                      className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                      style={{ background: "#F5A62322", border: "2px solid #F5A62355" }}
                    >
                      {f.icon}
                    </div>
                    <h4 style={{ fontFamily: "Anton, sans-serif", fontSize: "1.1rem", color: "#FDF3E3", textTransform: "uppercase" }}>
                      {f.title}
                    </h4>
                    <p className="mt-1 text-sm" style={{ color: "#FDF3E388" }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chef's Favorite preview */}
            <div className="fade-up">
              <div className="mb-4 text-sm font-semibold" style={{ color: "#F5A623" }}>
                ❤️ Chef's Favorite
              </div>
              <p className="text-sm mb-6" style={{ color: "#FDF3E388" }}>Crafted fresh and chosen by the chef.</p>
              <div className="grid grid-cols-2 gap-4">
                {products.slice(0, 2).map((p) => (
                  <div
                    key={p._id}
                    className="overflow-hidden rounded-2xl cursor-pointer transition-transform hover:scale-105"
                    style={{ border: "3px solid #F5A62333", background: "#2a1205" }}
                    onClick={() => handleAddToCart(p)}
                  >
                    <div
                      className="h-32 flex items-center justify-center text-5xl"
                      style={{ background: "linear-gradient(135deg, #F5A62322, #3B1A08)" }}
                    >
                      🍽️
                    </div>
                    <div className="p-3">
                      <h4 style={{ fontFamily: "Anton, sans-serif", fontSize: "0.9rem", color: "#FDF3E3", textTransform: "uppercase" }}>
                        {p.name}
                      </h4>
                      <div className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: "#F5A62333", color: "#F5A623" }}>
                        ₹{p.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <a href="#menu" className="mt-6 block w-full rounded-full border py-3 text-center text-sm font-bold uppercase transition hover:opacity-80"
                style={{ borderColor: "#F5A623", color: "#F5A623" }}>
                View Full Menu
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search Hero above Menu ── */}
      <section className="py-10" style={{ background: "#FDF3E3" }}>
        <div className="mx-auto max-w-xl px-5 fade-up">
          <div
            className="flex items-center rounded-full border px-5 py-3 shadow-sm"
            style={{ borderColor: "rgba(59,26,8,0.15)", background: "white" }}
          >
            <Search className="h-5 w-5 flex-shrink-0" style={{ color: "#5A3820" }} />
            <input
              id="menu-search"
              type="text"
              placeholder="Search burgers, biryani, dosa, coffee..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-transparent px-3 py-1 text-sm focus:outline-none"
              style={{ color: "#3B1A08" }}
            />
          </div>
        </div>
      </section>

      {/* ── Menu Section ── */}
      <section id="menu" className="py-16" style={{ background: "#FDF3E3" }}>
        <div className="mx-auto max-w-7xl px-5">
          <div className="fade-up mb-8">
            <h2
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: "clamp(3rem, 8vw, 6rem)",
                color: "#3B1A08",
                textTransform: "uppercase",
                lineHeight: 0.9,
              }}
            >
              Menu
            </h2>
            <div className="mt-1 flex items-center gap-3 text-sm" style={{ color: "#5A3820" }}>
              <span>⭐ 4.9 Rating</span>
              <span>•</span>
              <span>❤️ Loved Locally</span>
            </div>
          </div>

          {/* Category Pills */}
          <div className="mb-8 flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`cat-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => handleCategoryChange(cat)}
                className={`cat-pill rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all ${selectedCategory === cat ? "active" : ""}`}
                style={
                  selectedCategory === cat
                    ? { background: "#F5A623", color: "#3B1A08", boxShadow: "0 4px 14px rgba(245,166,35,0.35)" }
                    : { border: "2px solid rgba(59,26,8,0.15)", color: "#3B1A08", background: "white" }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loadingProducts ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4" style={{ borderColor: "#F5A623", borderTopColor: "transparent" }} />
              <p className="mt-4 text-sm font-semibold" style={{ color: "#5A3820" }}>Fetching menu from backend…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20"
              style={{ borderColor: "rgba(59,26,8,0.12)" }}>
              <p className="text-2xl">🍽️</p>
              <p className="mt-2 text-base font-semibold" style={{ color: "#3B1A08" }}>No items found</p>
              <p className="mt-1 text-sm" style={{ color: "#5A3820" }}>Try a different category or clear your search</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="food-card overflow-hidden rounded-2xl bg-white shadow-sm fade-up"
                  style={{ border: "2px solid rgba(59,26,8,0.07)" }}
                >
                  <div className="relative h-44 w-full overflow-hidden" style={{ background: "linear-gradient(135deg, #FFF3E0, #FFE0B2)" }}>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-6xl">🍽️</div>
                    )}
                    <span
                      className="absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase"
                      style={{ background: "rgba(253,243,227,0.9)", color: "#3B1A08", backdropFilter: "blur(6px)" }}
                    >
                      {product.category}
                    </span>
                    {(!product.available || product.stock <= 0) && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}>
                        <span className="rounded-lg px-4 py-1.5 text-xs font-black uppercase text-white" style={{ background: "#C0392B" }}>
                          Sold Out
                        </span>
                      </div>
                    )}
                    {product.stock <= 3 && product.stock > 0 && product.available && (
                      <span className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: "#E74C3C22", color: "#C0392B", border: "1px solid #C0392B44" }}>
                        Only {product.stock} left!
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold leading-tight" style={{ color: "#3B1A08" }}>{product.name}</h3>
                      <span className="shrink-0 text-base font-black" style={{ color: "#F5A623", fontFamily: "Anton, sans-serif" }}>
                        ₹{product.price}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed line-clamp-2" style={{ color: "#5A3820" }}>
                      {product.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: "rgba(59,26,8,0.08)" }}>
                      <span className="text-[11px]" style={{ color: "#5A3820" }}>
                        Stock: <strong style={{ color: "#3B1A08" }}>{product.stock}</strong>
                      </span>
                      <button
                        id={`add-to-cart-${product._id}`}
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.available || product.stock <= 0}
                        className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase transition-all hover:scale-105 disabled:opacity-40"
                        style={{ background: "#F5A623", color: "#3B1A08" }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HotBite Specials ── */}
      <section id="specials" className="py-20" style={{ background: "#FDF3E3" }}>
        <div className="mx-auto max-w-7xl px-5">
          <div className="fade-up text-center mb-12">
            <h2
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                color: "#3B1A08",
                textTransform: "uppercase",
                lineHeight: 0.9,
              }}
            >
              HotBite<br />Specials
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {products.slice(0, 3).map((product) => (
              <div key={product._id} className="food-card flex flex-col items-center fade-up">
                {/* Circular image with orange backing */}
                <div className="relative mb-4">
                  <div
                    className="absolute -bottom-2 -right-2 h-full w-full rounded-full"
                    style={{ background: "#F5A623", zIndex: 0 }}
                  />
                  <div
                    className="relative z-10 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full text-6xl shadow-xl"
                    style={{ background: "linear-gradient(135deg, #FFF3E0, #FFE0B2)", border: "4px solid #3B1A08" }}
                  >
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      "🍽️"
                    )}
                  </div>
                </div>
                <h3
                  className="mt-2 text-center"
                  style={{ fontFamily: "Anton, sans-serif", fontSize: "1.1rem", color: "#3B1A08", textTransform: "uppercase" }}
                >
                  {product.name}
                </h3>
                <div
                  className="mt-2 rounded-full px-4 py-1 text-sm font-bold cursor-pointer transition hover:scale-105"
                  style={{ background: "white", color: "#3B1A08", border: "2px solid rgba(59,26,8,0.15)" }}
                  onClick={() => handleAddToCart(product)}
                >
                  ₹{product.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Taste the Difference ── */}
      <section className="py-20" style={{ background: "#3B1A08" }}>
        <div className="mx-auto max-w-7xl px-5">
          <h2
            className="fade-up text-center"
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              color: "#FDF3E3",
              textTransform: "uppercase",
              lineHeight: 0.9,
            }}
          >
            Taste The<br />Difference
          </h2>
          <p className="mt-3 text-center text-sm fade-up" style={{ color: "#FDF3E388" }}>Street food done right.</p>

          <div className="mt-12 grid gap-8 lg:grid-cols-3 items-center">
            {/* Left features */}
            <div className="space-y-10 fade-up">
              {[
                { icon: "❤️", title: "Fresh Daily", desc: "Ingredients prepared fresh every single day." },
                { icon: "⭐", title: "Bold Flavor", desc: "Street food packed with rich and unforgettable flavor." },
              ].map((f) => (
                <div key={f.title} className="text-center">
                  <div className="text-2xl" style={{ color: "#F5A623" }}>{f.icon}</div>
                  <h4 style={{ fontFamily: "Anton, sans-serif", color: "#FDF3E3", textTransform: "uppercase", marginTop: "0.5rem" }}>{f.title}</h4>
                  <p className="mt-1 text-xs" style={{ color: "#FDF3E388" }}>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Center image */}
            <div className="fade-up flex justify-center">
              <div
                className="h-64 w-64 overflow-hidden rounded-3xl shadow-2xl flex items-center justify-center text-9xl"
                style={{ background: "linear-gradient(135deg, #2a1205, #3d1a08)", border: "4px solid white" }}
              >
                🍕
              </div>
            </div>

            {/* Right features */}
            <div className="space-y-10 fade-up">
              {[
                { icon: "⏰", title: "Fast Service", desc: "Hot food served quickly without cutting corners." },
                { icon: "🔥", title: "Served Hot", desc: "Freshly grilled food made to satisfy every craving." },
              ].map((f) => (
                <div key={f.title} className="text-center">
                  <div className="text-2xl" style={{ color: "#F5A623" }}>{f.icon}</div>
                  <h4 style={{ fontFamily: "Anton, sans-serif", color: "#FDF3E3", textTransform: "uppercase", marginTop: "0.5rem" }}>{f.title}</h4>
                  <p className="mt-1 text-xs" style={{ color: "#FDF3E388" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20" style={{ background: "#FDF3E3" }}>
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex items-start justify-between mb-10 fade-up">
            <h2
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                color: "#3B1A08",
                textTransform: "uppercase",
                lineHeight: 0.9,
              }}
            >
              Loved By<br />Customers
            </h2>
            <div className="text-right">
              <div className="text-sm font-bold" style={{ color: "#F5A623" }}>👍 98% Satisfaction</div>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-5 fade-up"
                style={{ background: "white", border: "1px solid rgba(59,26,8,0.08)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black"
                    style={{ background: "#3B1A08", color: "#F5A623" }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "#3B1A08" }}>{t.name}</p>
                    <p className="text-[10px]" style={{ color: "#5A3820" }}>{t.handle}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#5A3820" }}>"{t.text}"</p>
                <div className="mt-3 flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" style={{ color: "#F5A623" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Order Bold Section (Delivery) ── */}
      <section id="delivery" className="py-20" style={{ background: "#FDF3E3" }}>
        <div className="mx-auto max-w-7xl px-5 grid gap-12 lg:grid-cols-2 items-center">
          <div className="fade-up">
            <h2
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: "clamp(3rem, 8vw, 6rem)",
                color: "#3B1A08",
                textTransform: "uppercase",
                lineHeight: 0.88,
              }}
            >
              Order<br />Bold<br />Street<br />Flavor
            </h2>
          </div>
          <div className="fade-up">
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#5A3820" }}>
              Skip the wait and order HotBite for fast service, fresh ingredients, and bold flavor packed into every single bite you take.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => { if (!currentUser) { setIsAuthOpen(true); } else { document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); } }}
                className="rounded-full px-7 py-3 text-sm font-bold uppercase transition-transform hover:scale-105"
                style={{ background: "#F5A623", color: "#3B1A08" }}
              >
                Order Now 🔥
              </button>
              <button
                onClick={() => { loadOrders(); setIsOrdersOpen(true); }}
                className="rounded-full border px-7 py-3 text-sm font-bold uppercase transition-all hover:opacity-80"
                style={{ borderColor: "#3B1A08", color: "#3B1A08" }}
              >
                Track Order
              </button>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-4 text-center" style={{ background: "white", border: "1px solid rgba(59,26,8,0.08)" }}>
                <p className="text-2xl font-black" style={{ fontFamily: "Anton, sans-serif", color: "#F5A623" }}>500+</p>
                <p className="text-xs" style={{ color: "#5A3820" }}>Orders Served</p>
              </div>
              <div className="rounded-2xl p-4 text-center" style={{ background: "white", border: "1px solid rgba(59,26,8,0.08)" }}>
                <p className="text-2xl font-black" style={{ fontFamily: "Anton, sans-serif", color: "#F5A623" }}>4.9⭐</p>
                <p className="text-xs" style={{ color: "#5A3820" }}>Campus Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact / Let's Connect ── */}
      <section className="py-20" style={{ background: "#FDF3E3" }}>
        <div className="mx-auto max-w-7xl px-5 grid gap-12 lg:grid-cols-2 items-center fade-up">
          <div className="flex justify-center">
            <div
              className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-full shadow-2xl"
              style={{ background: "linear-gradient(135deg, #3B1A08, #6b3020)", border: "6px solid #F5A623" }}
            >
              <span className="text-9xl">👩‍🍳</span>
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold"
                style={{ background: "#F5A623", color: "#3B1A08" }}
              >
                On Campus Daily
              </div>
            </div>
          </div>
          <div>
            <h2
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                color: "#3B1A08",
                textTransform: "uppercase",
                lineHeight: 0.9,
              }}
            >
              Let's<br />Connect
            </h2>
            <div className="mt-8 space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#3B1A08" }}>Find Us</p>
                <p className="mt-1 text-sm" style={{ color: "#5A3820" }}>📍 Campus Food Court, Building A</p>
                <p className="text-sm" style={{ color: "#5A3820" }}>🕐 Open Daily – 8AM to 10PM</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#3B1A08" }}>Email Us</p>
                  <p className="mt-1 text-sm" style={{ color: "#5A3820" }}>📧 hello@hotbite.campus</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#3B1A08" }}>Call Us</p>
                  <p className="mt-1 text-sm" style={{ color: "#5A3820" }}>📞 +91 98765 43210</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#3B1A08" }}>
        {/* Marquee */}
        <div className="overflow-hidden py-3" style={{ background: "#F5A623" }}>
          <div className="marquee-track text-xs font-bold" style={{ color: "#3B1A08" }}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="mx-8 whitespace-nowrap">{item}</span>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-5 py-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-2xl">🍔</span>
            <span
              style={{ fontFamily: "Anton, sans-serif", fontSize: "1.5rem", color: "#FDF3E3", textTransform: "uppercase" }}
            >
              Hot<span style={{ color: "#F5A623" }}>Bite</span>
            </span>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm font-semibold mb-6" style={{ color: "#FDF3E388" }}>
            <a href="#about" className="hover:opacity-100 opacity-70 transition">About</a>
            <a href="#menu" className="hover:opacity-100 opacity-70 transition">Menu</a>
            <a href="#specials" className="hover:opacity-100 opacity-70 transition">Specials</a>
            <a href="#delivery" className="hover:opacity-100 opacity-70 transition">Delivery</a>
          </div>
          <div className="flex items-center justify-center gap-4 mb-8">
            {["📘", "𝕏", "📸"].map((icon, i) => (
              <div key={i}
                className="flex h-10 w-10 items-center justify-center rounded-full text-base transition hover:scale-110"
                style={{ background: "#F5A62322", border: "1px solid #F5A62333" }}
              >
                {icon}
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: "#FDF3E344" }}>© 2026 HotBite Campus Food. All rights reserved.</p>
        </div>

        {/* Watermark */}
        <div className="pb-6 text-center overflow-hidden">
          <span
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: "clamp(4rem, 15vw, 12rem)",
              color: "rgba(255,255,255,0.04)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              userSelect: "none",
            }}
          >
            HOTBITE
          </span>
        </div>
      </footer>

      {/* ════════════════════════════════════════
           MODALS & DRAWERS
         ════════════════════════════════════════ */}

      {/* ── Cart Drawer ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="flex h-full w-full max-w-md flex-col shadow-2xl" style={{ background: "#FDF3E3" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5" style={{ background: "#3B1A08" }}>
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5" style={{ color: "#F5A623" }} />
                <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "1.3rem", color: "#FDF3E3", textTransform: "uppercase" }}>
                  Your Cart
                </h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="rounded-full p-1.5 transition hover:opacity-70"
                style={{ color: "#FDF3E3" }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {!cart || cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <ShoppingBag className="h-12 w-12 opacity-20" style={{ color: "#3B1A08" }} />
                  <p className="mt-3 text-sm font-semibold" style={{ color: "#5A3820" }}>Your cart is empty</p>
                  <button onClick={() => setIsCartOpen(false)} className="mt-4 rounded-full px-6 py-2 text-sm font-bold"
                    style={{ background: "#F5A623", color: "#3B1A08" }}>
                    Browse Menu
                  </button>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.product._id}
                    className="flex items-center gap-3 rounded-2xl p-3.5"
                    style={{ background: "white", border: "1px solid rgba(59,26,8,0.08)" }}>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl"
                      style={{ background: "linear-gradient(135deg, #FFF3E0, #FFE0B2)" }}>
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="h-full w-full rounded-xl object-cover" />
                      ) : "🍽️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate text-sm font-bold" style={{ color: "#3B1A08" }}>{item.product.name}</h4>
                      <p className="text-xs" style={{ color: "#5A3820" }}>₹{item.product.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleUpdateQty(item.product._id, item.quantity, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full"
                        style={{ background: "rgba(59,26,8,0.08)", color: "#3B1A08" }}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-black" style={{ color: "#3B1A08" }}>{item.quantity}</span>
                      <button onClick={() => handleUpdateQty(item.product._id, item.quantity, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full"
                        style={{ background: "#F5A623", color: "#3B1A08" }}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-black" style={{ color: "#F5A623", fontFamily: "Anton, sans-serif" }}>
                      ₹{item.itemTotal}
                    </span>
                  </div>
                ))
              )}
            </div>

            {cart && cart.items.length > 0 && (
              <div className="p-5 space-y-4" style={{ borderTop: "1px solid rgba(59,26,8,0.1)" }}>
                {/* Payment method */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider" style={{ color: "#3B1A08" }}>
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["UPI", "CASH", "CARD"] as const).map((method) => {
                      const icons = { UPI: <QrCode className="h-4 w-4 mb-1" />, CASH: <Banknote className="h-4 w-4 mb-1" />, CARD: <CreditCard className="h-4 w-4 mb-1" /> };
                      return (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className="flex flex-col items-center justify-center rounded-xl p-2.5 text-xs font-bold transition-all"
                          style={paymentMethod === method
                            ? { background: "#F5A62322", border: "2px solid #F5A623", color: "#3B1A08" }
                            : { background: "white", border: "2px solid rgba(59,26,8,0.12)", color: "#5A3820" }
                          }
                        >
                          {icons[method]}
                          {method}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: "#3B1A08" }}>Total:</span>
                  <span style={{ fontFamily: "Anton, sans-serif", fontSize: "1.5rem", color: "#F5A623" }}>₹{cart.totalAmount}</span>
                </div>

                <button
                  id="place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full rounded-full py-4 text-sm font-black uppercase transition-transform hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: "#3B1A08", color: "#F5A623" }}
                >
                  {placingOrder ? "Processing…" : `Confirm Order (₹${cart.totalAmount})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Payment Confirmation Modal ── */}
      {showPaymentConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl" style={{ background: "#FDF3E3" }}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                style={{ background: "#3B1A08" }}>
                {paymentMethod === "UPI" ? "📱" : paymentMethod === "CARD" ? "💳" : "💵"}
              </div>
              <h3 style={{ fontFamily: "Anton, sans-serif", fontSize: "1.4rem", color: "#3B1A08", textTransform: "uppercase" }}>
                Confirm {paymentMethod} Payment
              </h3>
              <p className="mt-2 text-sm" style={{ color: "#5A3820" }}>
                Total: <strong style={{ color: "#F5A623", fontSize: "1.1rem" }}>₹{cart?.totalAmount}</strong>
              </p>
              {paymentMethod === "UPI" && (
                <div className="mt-4 rounded-2xl p-4" style={{ background: "#3B1A0811" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "#3B1A08" }}>Scan to pay via UPI</p>
                  <QRCodeDisplay value={`upi://pay?pa=hotbite@upi&am=${cart?.totalAmount}&tn=HotBiteOrder`} />
                  <p className="mt-2 text-xs" style={{ color: "#5A3820" }}>hotbite@upi</p>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowPaymentConfirm(false)}
                  className="flex-1 rounded-full border py-3 text-sm font-bold"
                  style={{ borderColor: "rgba(59,26,8,0.2)", color: "#3B1A08" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOrder}
                  className="flex-1 rounded-full py-3 text-sm font-black uppercase"
                  style={{ background: "#3B1A08", color: "#F5A623" }}
                >
                  ✓ Pay Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Auth Modal ── */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-sm rounded-3xl p-7 shadow-2xl" style={{ background: "#FDF3E3" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ fontFamily: "Anton, sans-serif", fontSize: "1.4rem", color: "#3B1A08", textTransform: "uppercase" }}>
                {authMode === "login" ? "Student Login" : "Create Account"}
              </h3>
              <button onClick={() => setIsAuthOpen(false)} className="rounded-full p-1 transition hover:opacity-70" style={{ color: "#3B1A08" }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase" style={{ color: "#3B1A08" }}>Full Name</label>
                  <input
                    type="text" required value={authName} onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "rgba(59,26,8,0.2)", background: "white", color: "#3B1A08" }}
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase" style={{ color: "#3B1A08" }}>Email</label>
                <input
                  type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
                  style={{ borderColor: "rgba(59,26,8,0.2)", background: "white", color: "#3B1A08" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase" style={{ color: "#3B1A08" }}>Password</label>
                <input
                  type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
                  style={{ borderColor: "rgba(59,26,8,0.2)", background: "white", color: "#3B1A08" }}
                />
              </div>
              <button
                type="submit" disabled={authLoading}
                className="w-full rounded-full py-3.5 text-sm font-black uppercase transition-transform hover:scale-[1.01] disabled:opacity-50"
                style={{ background: "#3B1A08", color: "#F5A623" }}
              >
                {authLoading ? "Processing…" : authMode === "login" ? "Login 🔥" : "Create Account 🎉"}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                  className="text-xs font-bold hover:underline" style={{ color: "#F5A623" }}>
                  {authMode === "login" ? "Don't have an account? Register" : "Already registered? Login"}
                </button>
              </div>
            </form>

            {/* Quick demo creds */}
            <div className="mt-4 rounded-xl p-3 text-center" style={{ background: "rgba(59,26,8,0.06)" }}>
              <p className="text-[10px] font-bold uppercase mb-1" style={{ color: "#3B1A08" }}>Demo Credentials</p>
              <p className="text-[10px]" style={{ color: "#5A3820" }}>Student: student1@quickbite.com / Student@123</p>
              <p className="text-[10px]" style={{ color: "#5A3820" }}>Admin: admin@quickbite.com / Admin@123</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Orders Drawer ── */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setIsOrdersOpen(false)}>
          <div className="flex h-full w-full max-w-md flex-col shadow-2xl" style={{ background: "#FDF3E3" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5" style={{ background: "#3B1A08" }}>
              <div className="flex items-center gap-3">
                <History className="h-5 w-5" style={{ color: "#F5A623" }} />
                <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "1.3rem", color: "#FDF3E3", textTransform: "uppercase" }}>
                  My Orders
                </h2>
              </div>
              <button onClick={() => setIsOrdersOpen(false)} className="rounded-full p-1.5" style={{ color: "#FDF3E3" }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {myOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <History className="h-12 w-12 opacity-20" style={{ color: "#3B1A08" }} />
                  <p className="mt-3 text-sm font-semibold" style={{ color: "#5A3820" }}>No orders yet</p>
                </div>
              ) : (
                myOrders.map((order) => (
                  <div key={order._id}
                    className={`rounded-2xl overflow-hidden cursor-pointer transition-all ${activeOrder?._id === order._id ? "ring-2" : ""}`}
                    style={{ background: "white", border: activeOrder?._id === order._id ? "2px solid #F5A623" : "1px solid rgba(59,26,8,0.08)" }}
                    onClick={() => setActiveOrder(activeOrder?._id === order._id ? null : order)}
                  >
                    <div className="flex items-center justify-between px-4 py-3" style={{ background: "#3B1A0808" }}>
                      <div>
                        <span className="text-xs font-black" style={{ fontFamily: "Anton, sans-serif", color: "#F5A623" }}>
                          #{order.orderNumber}
                        </span>
                        <p className="text-[10px]" style={{ color: "#5A3820" }}>
                          {new Date(order.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase status-${order.status}`}
                      >
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>

                    {/* Order tracking stepper */}
                    {order.status !== "CANCELLED" && (
                      <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          {ORDER_STEPS.map((step, idx) => {
                            const stepIdx = ORDER_STEPS.indexOf(order.status as typeof ORDER_STEPS[number]);
                            const isDone = idx < stepIdx;
                            const isActive = idx === stepIdx;
                            return (
                              <div key={step} className="flex flex-col items-center flex-1">
                                <div
                                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-black transition-all ${isDone ? "step-done" : isActive ? "step-active" : "step-todo"}`}
                                >
                                  {isDone ? <Check className="h-3 w-3 text-white" /> : isActive ? <span className="text-white">●</span> : ""}
                                </div>
                                <span className="mt-1 text-[8px] font-semibold text-center" style={{ color: isDone || isActive ? "#3B1A08" : "#999" }}>
                                  {step === "PLACED" ? "Placed" : step === "CONFIRMED" ? "Conf." : step === "PREPARING" ? "Prep." : step === "READY" ? "Ready" : "Done"}
                                </span>
                                {idx < ORDER_STEPS.length - 1 && (
                                  <div className="absolute" style={{ display: "none" }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Expanded details */}
                    {activeOrder?._id === order._id && (
                      <div className="border-t p-4" style={{ borderColor: "rgba(59,26,8,0.08)" }}>
                        <div className="space-y-1.5 mb-3">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs" style={{ color: "#5A3820" }}>
                              <span>{item.name} × {item.quantity}</span>
                              <span className="font-bold">₹{item.subtotal}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: "rgba(59,26,8,0.08)" }}>
                          <span className="text-xs font-bold" style={{ color: "#3B1A08" }}>Total ({order.paymentMethod})</span>
                          <span className="text-base font-black" style={{ color: "#F5A623", fontFamily: "Anton, sans-serif" }}>₹{order.totalAmount}</span>
                        </div>
                        {/* QR Code for order tracking */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveOrder(order); setShowQR(!showQR); }}
                          className="mt-3 w-full rounded-full border py-2 text-xs font-bold"
                          style={{ borderColor: "rgba(59,26,8,0.15)", color: "#3B1A08" }}
                        >
                          {showQR && activeOrder?._id === order._id ? "Hide QR" : "📱 Show QR Code"}
                        </button>
                        {showQR && activeOrder?._id === order._id && (
                          <div className="mt-3 p-4 rounded-2xl text-center" style={{ background: "#3B1A0808" }}>
                            <p className="text-xs font-bold mb-2" style={{ color: "#3B1A08" }}>Order #{order.orderNumber}</p>
                            <QRCodeDisplay value={`HOTBITE-ORDER-${order.orderNumber}-${order._id}`} />
                            <p className="mt-2 text-[10px]" style={{ color: "#5A3820" }}>Show this QR at the counter for pickup</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Dashboard Modal ── */}
      {isAdminOpen && currentUser?.role === "admin" && (
        <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setIsAdminOpen(false)}>
          <div
            className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden shadow-2xl m-4 rounded-3xl"
            style={{ background: "#FDF3E3" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Admin Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ background: "#3B1A08" }}>
              <div className="flex items-center gap-3">
                <div className="admin-badge flex items-center gap-2 rounded-full px-4 py-1.5 text-sm">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Panel
                </div>
                <button onClick={loadAdminData} className="rounded-full p-1.5 transition hover:opacity-70" style={{ color: "#F5A62388" }}>
                  <RefreshCw className={`h-4 w-4 ${adminLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
              <button onClick={() => setIsAdminOpen(false)} className="rounded-full p-1.5" style={{ color: "#FDF3E3" }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 px-6 pt-4">
              {(["analytics", "orders", "products"] as const).map((tab) => {
                const icons = { analytics: <BarChart2 className="h-4 w-4" />, orders: <Package className="h-4 w-4" />, products: <Edit3 className="h-4 w-4" /> };
                return (
                  <button
                    key={tab}
                    onClick={() => setAdminTab(tab)}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase transition-all"
                    style={adminTab === tab
                      ? { background: "#3B1A08", color: "#F5A623" }
                      : { background: "rgba(59,26,8,0.08)", color: "#3B1A08" }
                    }
                  >
                    {icons[tab]}
                    {tab}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {adminLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4" style={{ borderColor: "#F5A623", borderTopColor: "transparent" }} />
                </div>
              ) : (
                <>
                  {/* ── Analytics Tab ── */}
                  {adminTab === "analytics" && analytics && (
                    <div className="space-y-6">
                      {/* Stats cards */}
                      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[
                          { label: "Total Orders", value: analytics.totalOrders, icon: "📦", color: "#F5A623" },
                          { label: "Total Revenue", value: `₹${analytics.totalRevenue.toLocaleString()}`, icon: "💰", color: "#4CAF50" },
                          { label: "Orders Today", value: analytics.ordersToday, icon: "📅", color: "#2196F3" },
                          { label: "Revenue Today", value: `₹${analytics.revenueToday.toLocaleString()}`, icon: "⚡", color: "#9C27B0" },
                        ].map((stat) => (
                          <div key={stat.label}
                            className="rounded-2xl p-5 text-center"
                            style={{ background: "white", border: "1px solid rgba(59,26,8,0.08)" }}>
                            <div className="text-2xl mb-2">{stat.icon}</div>
                            <p className="text-2xl font-black" style={{ fontFamily: "Anton, sans-serif", color: stat.color }}>{stat.value}</p>
                            <p className="text-xs font-semibold mt-1" style={{ color: "#5A3820" }}>{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Orders by status */}
                      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(59,26,8,0.08)" }}>
                        <h3 style={{ fontFamily: "Anton, sans-serif", fontSize: "1.1rem", color: "#3B1A08", textTransform: "uppercase" }}>
                          Orders by Status
                        </h3>
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                            <div key={status}
                              className={`rounded-xl p-3 text-center status-${status}`}>
                              <p className="text-xl font-black">{count as number}</p>
                              <p className="text-xs font-bold mt-0.5">{status}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top products */}
                      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(59,26,8,0.08)" }}>
                        <h3 style={{ fontFamily: "Anton, sans-serif", fontSize: "1.1rem", color: "#3B1A08", textTransform: "uppercase" }}>
                          Top Products
                        </h3>
                        <div className="mt-4 space-y-3">
                          {analytics.topProducts.map((p, i) => (
                            <div key={p.name} className="flex items-center gap-3">
                              <span className="text-lg font-black w-6 text-center"
                                style={{ fontFamily: "Anton, sans-serif", color: i === 0 ? "#F5A623" : "#3B1A08" }}>
                                {i + 1}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-bold" style={{ color: "#3B1A08" }}>{p.name}</p>
                                <p className="text-xs" style={{ color: "#5A3820" }}>{p.totalSold} sold • ₹{p.revenue} revenue</p>
                              </div>
                              <TrendingUp className="h-4 w-4" style={{ color: "#F5A623" }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Orders Tab ── */}
                  {adminTab === "orders" && (
                    <div className="space-y-4">
                      {/* Status filter */}
                      <div className="flex gap-2 flex-wrap">
                        {["", "PLACED", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"].map((s) => (
                          <button key={s}
                            onClick={() => { setOrderStatusFilter(s); api.getAllOrders(s || undefined).then(setAllOrders); }}
                            className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                            style={orderStatusFilter === s
                              ? { background: "#3B1A08", color: "#F5A623" }
                              : { background: "rgba(59,26,8,0.08)", color: "#3B1A08" }
                            }
                          >
                            {s || "All"}
                          </button>
                        ))}
                      </div>

                      {allOrders.length === 0 ? (
                        <div className="flex flex-col items-center py-16">
                          <Package className="h-12 w-12 opacity-20" style={{ color: "#3B1A08" }} />
                          <p className="mt-3 text-sm font-semibold" style={{ color: "#5A3820" }}>No orders found</p>
                        </div>
                      ) : (
                        allOrders.map((order) => {
                          const userName = typeof order.user === "object" ? (order.user as any).name : "Student";
                          return (
                            <div key={order._id}
                              className="rounded-2xl p-4"
                              style={{ background: "white", border: "1px solid rgba(59,26,8,0.08)" }}>
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-sm font-black" style={{ fontFamily: "Anton, sans-serif", color: "#F5A623" }}>
                                    #{order.orderNumber}
                                  </p>
                                  <p className="text-xs" style={{ color: "#5A3820" }}>
                                    {userName} • {new Date(order.createdAt).toLocaleString("en-IN")}
                                  </p>
                                  <p className="text-xs mt-1" style={{ color: "#3B1A08" }}>
                                    {order.items.map((i) => `${i.name}×${i.quantity}`).join(", ")}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-base font-black" style={{ fontFamily: "Anton, sans-serif", color: "#3B1A08" }}>
                                    ₹{order.totalAmount}
                                  </p>
                                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase mt-1 status-${order.status}`}>
                                    {order.status}
                                  </span>
                                </div>
                              </div>

                              {/* Status action buttons */}
                              {!["COMPLETED", "CANCELLED"].includes(order.status) && (
                                <div className="mt-3 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: "rgba(59,26,8,0.08)" }}>
                                  {(order.status === "PLACED" ? ["CONFIRMED", "CANCELLED"] :
                                    order.status === "CONFIRMED" ? ["PREPARING", "CANCELLED"] :
                                      order.status === "PREPARING" ? ["READY", "CANCELLED"] :
                                        order.status === "READY" ? ["COMPLETED", "CANCELLED"] : []
                                  ).map((nextStatus) => (
                                    <button
                                      key={nextStatus}
                                      onClick={() => handleUpdateOrderStatus(order._id, nextStatus)}
                                      className="rounded-full px-3 py-1.5 text-xs font-bold uppercase transition hover:opacity-80"
                                      style={nextStatus === "CANCELLED"
                                        ? { background: "#C0392B22", color: "#C0392B", border: "1px solid #C0392B44" }
                                        : { background: "#F5A62322", color: "#3B1A08", border: "1px solid #F5A62355" }
                                      }
                                    >
                                      → {nextStatus}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* ── Products Tab ── */}
                  {adminTab === "products" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold" style={{ color: "#5A3820" }}>
                          {adminProducts.length} products in catalog
                        </p>
                        <button
                          onClick={() => { setEditingProduct(null); setNewProduct({ category: "Burgers", available: true, stock: 10 }); setShowProductForm(true); }}
                          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
                          style={{ background: "#3B1A08", color: "#F5A623" }}
                        >
                          <Plus className="h-4 w-4" />
                          Add Product
                        </button>
                      </div>

                      {/* Product Form */}
                      {showProductForm && (
                        <div className="rounded-2xl p-5" style={{ background: "white", border: "2px solid #F5A623" }}>
                          <h4 style={{ fontFamily: "Anton, sans-serif", fontSize: "1rem", color: "#3B1A08", textTransform: "uppercase" }}>
                            {editingProduct ? "Edit Product" : "New Product"}
                          </h4>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-bold" style={{ color: "#3B1A08" }}>Name *</label>
                              <input
                                value={newProduct.name || ""} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                placeholder="Spicy Chicken Burger"
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                                style={{ borderColor: "rgba(59,26,8,0.2)", color: "#3B1A08" }}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold" style={{ color: "#3B1A08" }}>Price (₹) *</label>
                              <input
                                type="number" value={newProduct.price || ""} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                                placeholder="149"
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                                style={{ borderColor: "rgba(59,26,8,0.2)", color: "#3B1A08" }}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold" style={{ color: "#3B1A08" }}>Category *</label>
                              <select value={newProduct.category || "Burgers"} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                                style={{ borderColor: "rgba(59,26,8,0.2)", color: "#3B1A08" }}>
                                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold" style={{ color: "#3B1A08" }}>Stock *</label>
                              <input
                                type="number" value={newProduct.stock ?? 10} onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                                placeholder="50"
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                                style={{ borderColor: "rgba(59,26,8,0.2)", color: "#3B1A08" }}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs font-bold" style={{ color: "#3B1A08" }}>Description</label>
                              <textarea value={newProduct.description || ""} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                placeholder="Juicy chicken patty with hot sauce..."
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                                rows={2}
                                style={{ borderColor: "rgba(59,26,8,0.2)", color: "#3B1A08", resize: "none" }} />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs font-bold" style={{ color: "#3B1A08" }}>Image URL</label>
                              <input value={newProduct.image || ""} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                                placeholder="https://..."
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                                style={{ borderColor: "rgba(59,26,8,0.2)", color: "#3B1A08" }} />
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="available" checked={newProduct.available ?? true}
                                onChange={(e) => setNewProduct({ ...newProduct, available: e.target.checked })} />
                              <label htmlFor="available" className="text-sm font-bold" style={{ color: "#3B1A08" }}>Available</label>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-3">
                            <button onClick={() => { setShowProductForm(false); setEditingProduct(null); }}
                              className="rounded-full border px-4 py-2 text-sm font-bold"
                              style={{ borderColor: "rgba(59,26,8,0.2)", color: "#3B1A08" }}>
                              Cancel
                            </button>
                            <button onClick={handleSaveProduct}
                              className="rounded-full px-6 py-2 text-sm font-bold"
                              style={{ background: "#3B1A08", color: "#F5A623" }}>
                              {editingProduct ? "Save Changes" : "Create Product"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Product List */}
                      <div className="space-y-3">
                        {adminProducts.map((product) => (
                          <div key={product._id}
                            className="flex items-center gap-3 rounded-2xl p-3"
                            style={{ background: "white", border: "1px solid rgba(59,26,8,0.08)" }}>
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl flex items-center justify-center text-2xl"
                              style={{ background: "linear-gradient(135deg, #FFF3E0, #FFE0B2)" }}>
                              {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : "🍽️"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="truncate text-sm font-bold" style={{ color: "#3B1A08" }}>{product.name}</h4>
                              <p className="text-xs" style={{ color: "#5A3820" }}>
                                {product.category} • ₹{product.price} • Stock: {product.stock}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={product.available ? { background: "#4CAF5022", color: "#388E3C" } : { background: "#C0392B22", color: "#C0392B" }}
                              >
                                {product.available ? "Active" : "Inactive"}
                              </span>
                              <button onClick={() => openEditProduct(product)}
                                className="rounded-full p-2 transition hover:opacity-70"
                                style={{ background: "#F5A62222", color: "#3B1A08" }}>
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product._id)}
                                className="rounded-full p-2 transition hover:opacity-70"
                                style={{ background: "#C0392B22", color: "#C0392B" }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
