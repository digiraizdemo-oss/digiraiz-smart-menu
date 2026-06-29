"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Star,
  Phone,
  Bell,
  Receipt,
  Instagram
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function PublicMenuPage() {
  const params = useParams()
  const [selectedVariants, setSelectedVariants] = useState<any>({})
  const [showBottomActions, setShowBottomActions] = useState(true)
  const [showBanner, setShowBanner] = useState(true)
  const [showBottomBar, setShowBottomBar] = useState(true)
  const searchParams = useSearchParams()
  const restaurantId = params.restaurantId as string
  const tableNumber = searchParams.get("table") || "1"

  const supabase = createClient()

  const [restaurant, setRestaurant] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const [cart, setCart] = useState<Map<string, any>>(new Map())
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [showFooter, setShowFooter] = useState(true)

  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setDarkMode(isDark)
  }, [])
  useEffect(() => {
    let lastScroll = 0

    const handleScroll = () => {
      const currentScroll = window.scrollY

      if (currentScroll > lastScroll && currentScroll > 80) {
        // scroll down → hide banner
        setShowBanner(false)
      } else {
        // scroll up → show banner
        setShowBanner(true)
      }

      lastScroll = currentScroll
    }

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  useEffect(() => {
    fetchData()
  }, [restaurantId])
  useEffect(() => {
    let lastScroll = 0

    const handleScroll = () => {
      const currentScroll = window.scrollY

      if (currentScroll > lastScroll && currentScroll > 100) {
        // scrolling down → hide
        setShowBottomBar(false)
      } else {
        // scrolling up → show
        setShowBottomBar(true)
      }

      lastScroll = currentScroll
    }

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }
    , [])
  const fetchData = async () => {
    setLoading(true)

    const [restaurantRes, categoriesRes, menuItemsRes] =
      await Promise.all([
        supabase.from("restaurants").select("*").eq("id", restaurantId).maybeSingle(),
        supabase.from("categories").select("*").eq("restaurant_id", restaurantId),
        supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .eq("is_available", true),
      ])

    setRestaurant(restaurantRes.data)
    setCategories(categoriesRes.data || [])
    setMenuItems(menuItemsRes.data || [])
    setLoading(false)
  }

  const filteredItems = useMemo(() => {
    const selectVariant = (itemId: string, variant: any) => {
      setSelectedVariants((prev: any) => ({
        ...prev,
        [itemId]: variant,
      }))
    }
    let items = menuItems

    if (searchQuery) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (activeCategory !== "all" && !searchQuery) {
      items = items.filter(i => i.category_id === activeCategory)
    }

    return items
  }, [menuItems, searchQuery, activeCategory])
  const selectVariant = (itemId: string, variant: any) => {
    setSelectedVariants((prev: any) => ({
      ...prev,
      [itemId]: variant,
    }))
  }

  const addToCart = (item: any) => {

    // ✅ check variants
    if (
      Array.isArray(item.variants) &&
      item.variants.length > 0 &&
      !selectedVariants[item.id]
    ) {
      alert("Please select item type")
      return
    }

    const selectedVariant = selectedVariants[item.id]

    const finalPrice =
      selectedVariant?.price || item.price

    const variantName =
      selectedVariant?.name || null

    // unique cart key
    const cartKey = variantName
      ? `${item.id}-${variantName}`
      : item.id

    setCart(prev => {
      const newCart = new Map(prev)

      const existing = newCart.get(cartKey)

      if (existing) {
        newCart.set(cartKey, {
          ...existing,
          quantity: existing.quantity + 1
        })
      } else {
        newCart.set(cartKey, {
          ...item,
          quantity: 1,
          price: finalPrice,
          selectedVariant: variantName,
          cartKey
        })
      }

      return newCart
    })

   setShowFooter(false)
setShowBottomActions(false)
}
  const removeFromCart = (id: string) => {
    setCart(prev => {
      const newCart = new Map(prev)
      const existing = newCart.get(id)

      if (existing?.quantity > 1) {
        newCart.set(id, {
          ...existing,
          quantity: existing.quantity - 1
        })
      } else {
        newCart.delete(id)
      }

      if (newCart.size === 0) {
        setShowFooter(true)
      }

      return newCart
    })
  }

  const getQty = (id: string) => cart.get(id)?.quantity || 0

  const cartItems = Array.from(cart.values())
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)
  // ✅ ADD HERE ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

  const placeOrder = async () => {
    if (!customerName) {
      alert("Enter your name")
      return
    }

    if (cartItems.length === 0) {
      alert("Cart is empty")
      return
    }

    const { error } = await supabase.from("orders").insert([
      {
        restaurant_id: restaurantId,
        table_number: tableNumber,
        customer_name: customerName,
        items: cartItems,
        total_price: cartTotal,
        status: "pending",
      },
    ])

    if (error) {
      alert("Order failed")
      console.log(error)
    } else {
      alert("Order placed successfully 🎉")
      setCart(new Map())
      setCheckoutOpen(false)
    }
  }

  const generateWhatsAppMessage = () => {
    if (!restaurant || !restaurant.whatsapp) {
      alert("Restaurant data not ready")
      return
    }

    if (!customerName) {
      alert("Please enter your name")
      return
    }

    const phone = restaurant.whatsapp.replace(/\D/g, "")

    const itemsList = cartItems
      .map(item => `${item.name} x ${item.quantity}`)
      .join("\n")

    const message = encodeURIComponent(
      `Hi, Order from Table ${tableNumber}\n\nName: ${customerName}\n\n${itemsList}\n\nTotal ₹${cartTotal}`
    )

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }
  const openReview = () => {
    if (!restaurant?.google_maps) return alert("No review link")
    window.open(restaurant.google_maps, "_blank")
  }

  const callRestaurant = () => {
    if (!restaurant?.phone) return alert("No phone number")
    window.location.href = `tel:${restaurant.phone}`
  }

  const openInstagram = () => {
    if (!restaurant?.instagram) return alert("No Instagram")
    window.open(restaurant.instagram, "_blank")
  }

  // ✅ WhatsApp helper
  const sendWhatsApp = (message: string) => {
    if (!restaurant?.whatsapp) return alert("WhatsApp not available")

    const phone = restaurant.whatsapp.replace(/\D/g, "")
    const encoded = encodeURIComponent(message)

    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank")
  }

  // ✅ Waiter request
  const callWaiter = async () => {
    sendWhatsApp(`Table ${tableNumber} needs a waiter`)

    // optional dashboard notification
    await supabase.from("orders").insert([
      {
        restaurant_id: restaurantId,
        table_number: tableNumber,
        customer_name: "System",
        items: [],
        total_price: 0,
        status: "waiter_call",
      },
    ])
  }

  // ✅ Bill request
  const requestBill = async () => {
    sendWhatsApp(`Table ${tableNumber} is requesting the bill`)

    await supabase.from("orders").insert([
      {
        restaurant_id: restaurantId,
        table_number: tableNumber,
        customer_name: "System",
        items: [],
        total_price: 0,
        status: "bill_request",
      },
    ])
  }
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!restaurant) return <div>Restaurant not found</div>

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-100 overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm">

        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-3 min-w-0">

            {/* LOGO */}
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>

            {/* RESTAURANT NAME */}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-black truncate">
                {restaurant.name}
              </h1>
            </div>

          </div>

          {/* RIGHT SIDE TABLE */}
          <div className="flex-shrink-0">
            <span className="text-sm sm:text-base font-bold text-blue-600">
              Table {tableNumber}
            </span>
          </div>

        </div>

      </header>

      <div className="flex-1">
        {/* BANNER IMAGE */}
        <div
          className={`px-4 pt-3 transition-all duration-300 ${showBanner ? "max-h-60 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
            }`}
        >
          <img
            src={restaurant.banner_url || "/banner.jpg"}
            className="w-full rounded-2xl object-cover"
          />
        </div>
        <div className="p-4">
          <Input
            placeholder="Search food..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-full"
          />
        </div>
        {/* CATEGORY PILLS */}
        <div className="px-4 pb-2 overflow-x-auto">
          <div className="flex gap-2">

            {/* ALL */}
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-4 py-2 rounded-full text-sm whitespace-nowrap transition",
                activeCategory === "all"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700"
              )}
            >
              All Items
            </button>

            {/* DYNAMIC CATEGORIES */}
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm whitespace-nowrap transition",
                  activeCategory === cat.id
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700"
                )}
              >
                {cat.name}
              </button>
            ))}

          </div>
        </div>
        <div className="space-y-4 px-3 sm:px-4 md:px-6 lg:px-8 pb-32 max-w-6xl mx-auto w-full">
          {filteredItems.map((item) => {
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm border p-3 flex gap-3 min-h-[130px] sm:min-h-[140px] w-full"
              >

                {/* IMAGE */}
                <div className="w-20 sm:w-24 h-[110px] sm:h-[120px] rounded-2xl overflow-hidden flex-shrink-0">
                  <img
                    src={item.image_url || "https://placehold.co/400x400/png"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* CONTENT */}
                <div className="flex-1 flex justify-between">

                  {/* LEFT SIDE */}
                  <div className="flex-1 min-w-0">

                    {/* NAME */}
                    <h3 className="font-semibold text-base leading-tight">
                      {item.name}
                    </h3>

                    {/* VARIANTS */}
                    {Array.isArray(item.variants) &&
                      item.variants.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">

                          {item.variants.map((variant: any, idx: number) => {

                            const active =
                              selectedVariants[item.id]?.name === variant.name

                            return (
                              <button
                                key={idx}
                                onClick={() =>
                                  selectVariant(item.id, variant)
                                }
                                className={`px-2 py-[4px] rounded-full text-[10px] border transition whitespace-nowrap ${active
                                  ? "bg-green-600 text-white border-green-600"
                                  : "bg-white text-gray-600 border-gray-300"
                                  }`}
                              >
                                {variant.name} ₹{variant.price}
                              </button>
                            )
                          })}

                        </div>
                      )}

                    {/* BADGES */}
                    <div className="flex gap-2 flex-wrap mt-2">

                      {item.is_popular && (
                        <span className="bg-red-100 text-red-500 text-[9px] px-2 py-[3px] rounded-full font-medium leading-none">
                          🔥
                        </span>
                      )}

                      {item.is_special && (
                        <span className="bg-yellow-100 text-yellow-600 text-[9px] px-2 py-[3px] rounded-full font-medium leading-none">
                          ⭐
                        </span>
                      )}

                    </div>

                    {/* DESCRIPTION */}
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {item.description}
                    </p>

                  </div>

                  {/* RIGHT SIDE */}
                  <div className="flex flex-col justify-center items-end ml-2 sm:ml-3 min-w-[80px] sm:min-w-[90px]">

                    {/* PRICE */}
                    <p className="text-2xl sm:text-[30px] font-bold text-black leading-none mb-4">
                      ₹{
                        selectedVariants[item.id]?.price ||
                        item.variants?.[0]?.price ||
                        item.price
                      }
                    </p>
                    {/* ADD BUTTON / QUANTITY */}
                    {getQty(item.id) === 0 ? (
                      <Button
                        onClick={() => addToCart(item)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 h-10 shadow-md"
                      >
                        + Add
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button onClick={() => removeFromCart(item.id)}>
                          -
                        </Button>

                        <span>{getQty(item.id)}</span>

                        <Button onClick={() => addToCart(item)}>
                          +
                        </Button>
                      </div>
                    )}

                    {/* AVAILABLE */}
                    <span className="text-xs flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full mt-4">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>

                      {item.is_available
                        ? "Available"
                        : "Not Available"}
                    </span>

                  </div>

                </div>

              </div>
            )
          })}
        </div>

      </div>

      {cartCount > 0 && (
  <Button
    className="fixed bottom-3 left-4 right-4 z-50"
    onClick={() => setCheckoutOpen(true)}
  >
    Checkout ₹{cartTotal}
  </Button>
)}

{/* CHECKOUT POPUP */}
<Dialog
  open={checkoutOpen}
  onOpenChange={setCheckoutOpen}
>

  <DialogContent
    aria-describedby={undefined}
    className="[&>button]:hidden"
  >

    {/* HEADER */}
    <DialogHeader className="flex flex-row justify-between items-center">

      <DialogTitle>
        Your Order
      </DialogTitle>

      {/* CLOSE */}
      <button
        onClick={() => setCheckoutOpen(false)}
        className="text-gray-500 text-lg"
      >
        ✕
      </button>

    </DialogHeader>

    {/* CUSTOMER NAME */}
    <input
      placeholder="Your Name"
      value={customerName}
      onChange={(e) =>
        setCustomerName(e.target.value)
      }
      className="w-full border p-2 rounded"
    />

    {/* ORDER LIST */}
    <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">

      {cartItems.map((item) => (

        <div
          key={item.cartKey || item.id}
          className="flex justify-between text-sm"
        >

          <div>
            {item.quantity} x {item.name}

            {item.selectedVariant && (
              <span className="text-gray-500">
                {" "}({item.selectedVariant})
              </span>
            )}
          </div>

          <span className="font-medium">
            ₹{item.quantity * item.price}
          </span>

        </div>

      ))}

    </div>

    {/* TOTAL */}
    <div className="flex justify-between mt-3 pt-2 border-t font-semibold">
      <span>Total</span>
      <span>₹{cartTotal}</span>
    </div>

    {/* ACTION BUTTONS */}
    <div className="space-y-3 mt-4">

      {/* DASHBOARD PLAN */}
      {restaurant.plan_type?.toUpperCase() === "DASHBOARD" ? (
        <>

          <Button
            onClick={placeOrder}
            className="w-full bg-blue-500 text-white"
          >
            Place Order
          </Button>

          <Button
            onClick={generateWhatsAppMessage}
            className="w-full bg-green-500"
          >
            Order on WhatsApp
          </Button>

        </>
      ) : (

        <Button
          onClick={generateWhatsAppMessage}
          className="w-full bg-green-500"
        >
          Order on WhatsApp
        </Button>

      )}

    </div>

  </DialogContent>

</Dialog>

{/* BOTTOM ACTIONS */}
{cartCount === 0 && (

  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">

    {/* BUTTON GRID */}
    <div className="grid grid-cols-5 gap-3 px-3 py-2">

      {/* REVIEW */}
      <button
        onClick={openReview}
        className="flex flex-col items-center justify-center bg-white rounded-[20px] h-[74px] shadow-[0_3px_10px_rgba(0,0,0,0.08)] border border-gray-100 active:scale-95 transition-all duration-200"
      >
        <span className="text-xl text-yellow-500">
          ⭐
        </span>

        <span className="text-[12px] mt-1 font-medium text-gray-700">
          Review
        </span>
      </button>

      {/* CALL */}
      <button
        onClick={callRestaurant}
        className="flex flex-col items-center justify-center bg-white rounded-[20px] h-[74px] shadow-[0_3px_10px_rgba(0,0,0,0.08)] border border-gray-100 active:scale-95 transition-all duration-200"
      >
        <span className="text-xl text-green-500">
          📞
        </span>

        <span className="text-[12px] mt-1 font-medium text-gray-700">
          Call
        </span>
      </button>

      {/* WAITER */}
      <button
        onClick={callWaiter}
        className="flex flex-col items-center justify-center bg-white rounded-[20px] h-[74px] shadow-[0_3px_10px_rgba(0,0,0,0.08)] border border-gray-100 active:scale-95 transition-all duration-200"
      >
        <span className="text-xl text-orange-500">
          🔔
        </span>

        <span className="text-[12px] mt-1 font-medium text-gray-700">
          Waiter
        </span>
      </button>

      {/* BILL */}
      <button
        onClick={requestBill}
        className="flex flex-col items-center justify-center bg-white rounded-[20px] h-[74px] shadow-[0_3px_10px_rgba(0,0,0,0.08)] border border-gray-100 active:scale-95 transition-all duration-200"
      >
        <span className="text-xl text-emerald-500">
          💵
        </span>

        <span className="text-[12px] mt-1 font-medium text-gray-700">
          Bill
        </span>
      </button>

      {/* FOLLOW */}
      <button
        onClick={openInstagram}
        className="flex flex-col items-center justify-center bg-white rounded-[20px] h-[74px] shadow-[0_3px_10px_rgba(0,0,0,0.08)] border border-gray-100 active:scale-95 transition-all duration-200"
      >

        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
          ⌾
        </div>

        <span className="text-[12px] mt-1 font-medium text-gray-700">
          Follow
        </span>

      </button>

    </div>

    {/* FOOTER */}
    <div className="text-center text-[11px] text-gray-400 pb-1">
      Powered by{" "}
      <span className="text-blue-500 font-medium">
        DigiRaiz
      </span>
    </div>

  </div>

)}

</div>
)
}