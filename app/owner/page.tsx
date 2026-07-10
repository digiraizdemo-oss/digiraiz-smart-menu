"use client"

import { useRef } from "react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function OwnerDashboard() {
  const [newOrderAlert, setNewOrderAlert] = useState(false)

const audioRef = useRef<HTMLAudioElement | null>(null)
useEffect(() => {
audioRef.current = new Audio("/notification.mp3")
  audioRef.current.volume = 1
}, [])

// 🔥 ✅ ADD AUDIO UNLOCK HERE (IMPORTANT)
  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {})
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      document.removeEventListener("click", unlockAudio)
    }

    document.addEventListener("click", unlockAudio)
  }, [])

  const supabase = createClient()

  const [restaurant, setRestaurant] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
const [showOrderPopup, setShowOrderPopup] = useState(false)

  // ✅ LOAD DATA ON START
  useEffect(() => {
    fetchData()
  }, [])

 // ✅ REALTIME ORDERS
useEffect(() => {
  if (!restaurant?.id) return

  const channel = supabase
    .channel("orders")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "orders",
        filter: `restaurant_id=eq.${restaurant.id}`,
      },
      (payload) => {

        // ✅ Add new order on top
        setOrders((prev) => [payload.new, ...prev])

        // ✅ Open popup automatically
        setSelectedOrder(payload.new)
        setShowOrderPopup(true)

        // ✅ Play notification sound
        playSound()

        // ✅ Show top alert
        setNewOrderAlert(true)

        setTimeout(() => {
          setNewOrderAlert(false)
        }, 3000)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [restaurant])
  // ✅ FETCH DATA (ONLY PLACE WHERE await IS USED)
  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) return

    // get restaurant
    const { data: rest } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", profile.restaurant_id)
      .single()

    if (rest) {
      setRestaurant(rest)

      const { data: ord } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", rest.id)
        .order("created_at", { ascending: false })

      setOrders(ord || [])
    }
  }

  const playSound = async () => {
  try {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0

      await audioRef.current.play()
    }
  } catch (err) {
    console.log("Audio blocked")
  }
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  window.location.href = "/auth/login"
}

  const totalOrders = orders.length
  const pending = orders.filter((o) => o.status === "pending").length
  const preparing = orders.filter((o) => o.status === "preparing").length
  const revenue = orders.reduce((a, b) => a + (b.total_price || 0), 0)

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-20">

      {/* HEADER */}
      <div className="bg-white p-4 flex justify-between items-center shadow-sm rounded-xl mb-4">
        <div className="flex items-center gap-3">
          <img
            src={restaurant?.logo_url || "/logo.png"}
            className="w-12 h-12 rounded-xl object-cover border"
          />
          <div>
            <h1 className="font-bold text-lg">
              {restaurant?.name || "Restaurant"}
            </h1>
            <p className="text-sm text-green-500">● Online</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-xl"
        >
          Logout
        </button>
      </div>

      {/* PREMIUM HERO */}
<div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-5 text-white mb-4 flex justify-between items-center">
  <div>
    <h2 className="text-lg font-semibold">Here's what's happening with your restaurant</h2>
    <p className="text-sm opacity-90">
      Here's what's happening with your restaurant
    </p>
  </div>
  <div className="text-4xl">🏪</div>
</div>

    {/* PREMIUM STATS */}
<div className="bg-white rounded-3xl p-5 shadow-lg">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">Total Orders</p>
      <h2 className="text-3xl font-bold mt-1">{totalOrders}</h2>
      <p className="text-green-600 text-xs mt-2">↑ Today</p>
    </div>

    <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">
      📦
    </div>
  </div>
</div>

   {/* LIVE ORDERS */}
<div className="bg-white rounded-2xl shadow-md p-4">

  {/* HEADER */}
  <div className="flex justify-between items-center mb-3">
    <h2 className="font-semibold text-lg">Live Orders</h2>
    <span className="text-sm text-red-500 font-medium">
      {orders.length} New Orders
    </span>
  </div>

  {/* ORDERS LIST */}
  <div className="space-y-3">

    {orders.map((order) => (
      <div
        key={order.id}
        className="border rounded-xl p-3 flex justify-between items-center bg-gray-50"
      >

        {/* LEFT SIDE */}
        <div>
          <p className="font-medium text-sm">
            {order.customer_name || "Guest"}
          </p>
          <p className="text-xs text-gray-500">
            Table {order.table_number}
          </p>
        </div>

        {/* CENTER */}
        <div className="text-center">
          <p className="font-semibold">₹{order.total_price}</p>

          {/* STATUS BADGE */}
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              order.status === "pending"
                ? "bg-yellow-100 text-yellow-600"
                : order.status === "bill_request"
                ? "bg-blue-100 text-blue-600"
                : order.status === "waiter_call"
                ? "bg-purple-100 text-purple-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {order.status.replace("_", " ")}
          </span>
        </div>

        {/* RIGHT SIDE ACTION */}
<div>
  <button
    onClick={() => {
      setSelectedOrder(order)
      setShowOrderPopup(true)
    }}
    className="text-blue-500 text-sm"
  >
    View →
  </button>
</div>

      </div>
    ))}

  </div>

  {/* VIEW ALL */}
  <div className="text-center mt-4">
    <button className="text-blue-500 text-sm font-medium">
      View All Orders →
    </button>
  </div>

</div>
{/* QUICK ACTIONS */}
<div className="grid grid-cols-2 gap-4">

  <button className="bg-white rounded-3xl shadow-lg p-5 text-left transition hover:shadow-xl hover:-translate-y-1">
    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl mb-4">
      🍔
    </div>

    <h3 className="font-semibold">
      Menu
    </h3>

    <p className="text-sm text-gray-500">
      Manage Food Items
    </p>
  </button>

  <button className="bg-white rounded-3xl shadow-lg p-5 text-left transition hover:shadow-xl hover:-translate-y-1">
    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl mb-4">
      📋
    </div>

    <h3 className="font-semibold">
      Orders
    </h3>

    <p className="text-sm text-gray-500">
      Live Orders
    </p>
  </button>

  <button className="bg-white rounded-3xl shadow-lg p-5 text-left transition hover:shadow-xl hover:-translate-y-1">
    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl mb-4">
      📈
    </div>

    <h3 className="font-semibold">
      Reports
    </h3>

    <p className="text-sm text-gray-500">
      Sales Analytics
    </p>
  </button>

  <button className="bg-white rounded-3xl shadow-lg p-5 text-left transition hover:shadow-xl hover:-translate-y-1">
    <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl mb-4">
      ⚙️
    </div>

    <h3 className="font-semibold">
      Settings
    </h3>

    <p className="text-sm text-gray-500">
      Restaurant Settings
    </p>
  </button>

</div>  
{/* POWERED */}
<div className="fixed bottom-14 left-0 right-0 text-center opacity-70">
  <p className="text-xs text-gray-500">
    Powered by{" "}
    <span className="font-semibold text-black">DigiRaiz</span>
  </p>
</div>

</div>
)
}