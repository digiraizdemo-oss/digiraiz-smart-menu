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
    <h2 className="text-lg font-semibold">Hello how are you Today?👋</h2>
    <p className="text-sm opacity-90">
      Here's what's happening with your restaurant
    </p>
  </div>
  <div className="text-4xl">🏪</div>
</div>

    {/* PREMIUM STATS */}
<div className="grid grid-cols-2 gap-3 mb-4">

  <div className="bg-white p-4 rounded-2xl shadow flex justify-between items-center">
    <div>
      <p className="text-xs text-gray-500">Total Orders</p>
      <h2 className="text-xl font-bold">{totalOrders}</h2>
    </div>
    <div className="bg-blue-100 p-2 rounded-full">📋</div>
  </div>

  <div className="bg-white p-4 rounded-2xl shadow flex justify-between items-center">
    <div>
      <p className="text-xs text-gray-500">Pending</p>
      <h2 className="text-xl font-bold text-orange-500">{pending}</h2>
    </div>
    <div className="bg-orange-100 p-2 rounded-full">⏳</div>
  </div>

  <div className="bg-white p-4 rounded-2xl shadow flex justify-between items-center">
    <div>
      <p className="text-xs text-gray-500">Preparing</p>
      <h2 className="text-xl font-bold text-green-500">{preparing}</h2>
    </div>
    <div className="bg-green-100 p-2 rounded-full">🍳</div>
  </div>

  <div className="bg-white p-4 rounded-2xl shadow flex justify-between items-center">
    <div>
      <p className="text-xs text-gray-500">Revenue</p>
      <h2 className="text-xl font-bold">₹{revenue}</h2>
    </div>
    <div className="bg-purple-100 p-2 rounded-full">💰</div>
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
<div className="bg-white rounded-2xl p-4 shadow mb-4">
  <h3 className="font-semibold mb-3">Quick Actions</h3>

  <div className="grid grid-cols-4 gap-3 text-center text-xs">
    <div className="bg-blue-100 p-3 rounded-xl">📋<br/>Menu</div>
    <div className="bg-green-100 p-3 rounded-xl">🧾<br/>Orders</div>
    <div className="bg-orange-100 p-3 rounded-xl">📊<br/>Reports</div>
    <div className="bg-purple-100 p-3 rounded-xl">⚙️<br/>Settings</div>
  </div>
</div>
{/* SALES OVERVIEW */}
<div className="bg-white rounded-2xl p-4 shadow mb-4">
  <div className="flex justify-between items-center mb-3">
    <div>
      <h3 className="font-semibold">Sales Overview</h3>
      <p className="text-xs text-green-500">↑ 18.6%</p>
    </div>

    <select className="text-xs border rounded-lg px-2 py-1">
      <option>This Week</option>
      <option>This Month</option>
    </select>
  </div>

  <div className="mb-3">
    <p className="text-xs text-gray-500">Total Sales</p>
    <h2 className="text-xl font-bold">₹{revenue}</h2>
    <p className="text-xs text-gray-400">
      From {orders.length} orders
    </p>
  </div>

  {/* SIMPLE GRAPH LINE */}
  <div className="h-24 flex items-end gap-2">
    {[40, 60, 30, 80, 70, 90, 50].map((h, i) => (
      <div
        key={i}
        className="bg-blue-500 rounded-full w-2"
        style={{ height: `${h}%` }}
      />
    ))}
  </div>

  <div className="flex justify-between text-xs text-gray-400 mt-2">
    <span>Mon</span>
    <span>Tue</span>
    <span>Wed</span>
    <span>Thu</span>
    <span>Fri</span>
    <span>Sat</span>
    <span>Sun</span>
  </div>
</div>
{/* ORDER DETAILS POPUP */}
{showOrderPopup && selectedOrder && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

    <div className="bg-white rounded-3xl w-full max-w-md p-5 relative">

      {/* CLOSE */}
      <button
        onClick={() => setShowOrderPopup(false)}
        className="absolute top-4 right-4 text-2xl text-gray-400"
      >
        ×
      </button>

      {/* TITLE */}
      <h2 className="text-xl font-bold mb-4">
        Order Details
      </h2>

      {/* INFO */}
      <div className="space-y-1 mb-4">

        <p>
          <span className="font-semibold">
            Customer:
          </span>{" "}
          {selectedOrder.customer_name || "Guest"}
        </p>

        <p>
          <span className="font-semibold">
            Table:
          </span>{" "}
          {selectedOrder.table_number}
        </p>

        <p>
          <span className="font-semibold">
            Status:
          </span>{" "}
          {selectedOrder.status}
        </p>

      </div>

      {/* ITEMS */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto">

        {(selectedOrder.items || []).map(
          (item: any, index: number) => (
            <div
              key={index}
              className="border rounded-2xl p-3 flex gap-3 items-center"
            >

              <img
                src={
                  item.image_url ||
                  "/placeholder.png"
                }
                className="w-16 h-16 rounded-xl object-cover border"
              />

              <div className="flex-1">

                <h3 className="font-semibold text-sm">
                  {item.name}
                </h3>

                <p className="text-xs text-gray-500">
                  Quantity : {item.quantity}
                </p>

                <p className="text-xs text-gray-500">
                  Price : ₹{item.price}
                </p>

                {item.note && (
                  <p className="text-xs text-orange-500 mt-1">
                    Note : {item.note}
                  </p>
                )}

              </div>
            </div>
          )
        )}

      </div>

      {/* TOTAL */}
      <div className="flex justify-between items-center mt-5 pt-4 border-t">

        <span className="font-bold text-lg">
          Total
        </span>

        <span className="font-bold text-2xl">
          ₹{selectedOrder.total_price}
        </span>

      </div>

    </div>

  </div>
)}
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