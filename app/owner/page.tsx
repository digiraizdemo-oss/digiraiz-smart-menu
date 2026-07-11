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

<div className="bg-white rounded-3xl shadow-lg p-5 mb-5">

  <div className="flex items-center justify-between">

    <div className="flex items-center gap-4">

      <img
        src={restaurant?.logo_url || "/logo.png"}
        className="w-16 h-16 rounded-2xl object-cover border"
      />

      <div>

        <h1 className="text-xl font-bold">
          {restaurant?.name || "Restaurant"}
        </h1>

        <div className="flex items-center gap-2 mt-1">

          <div className="w-2 h-2 rounded-full bg-green-500"></div>

          <span className="text-green-600 text-sm font-medium">
            Restaurant Open
          </span>

        </div>

      </div>

    </div>

    <button
      onClick={handleLogout}
      className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-medium hover:bg-red-100"
    >
      Logout
    </button>

  </div>

</div>
{/* BUSINESS STATUS */}

<div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl text-white p-6 mb-6">

  <p className="text-blue-100">

    Today's Business

  </p>

  <h2 className="text-3xl font-bold mt-2">

    ₹{revenue}

  </h2>

  <div className="grid grid-cols-3 gap-5 mt-6">

    <div>

      <p className="text-blue-100 text-sm">

        Orders

      </p>

      <p className="text-2xl font-bold">

        {totalOrders}

      </p>

    </div>

    <div>

      <p className="text-blue-100 text-sm">

        Pending

      </p>

      <p className="text-2xl font-bold">

        {pending}

      </p>

    </div>

    <div>

      <p className="text-blue-100 text-sm">

        Preparing

      </p>

      <p className="text-2xl font-bold">

        {preparing}

      </p>

    </div>

  </div>

</div>

   {/* SUMMARY */}

<div className="grid grid-cols-2 gap-4 mb-6">

<div className="bg-white rounded-3xl p-5 shadow">

<div className="text-3xl">
📦
</div>

<p className="text-gray-500 mt-3">
Orders
</p>

<h2 className="text-3xl font-bold">
{totalOrders}
</h2>

</div>

<div className="bg-white rounded-3xl p-5 shadow">

<div className="text-3xl">
💰
</div>

<p className="text-gray-500 mt-3">
Revenue
</p>

<h2 className="text-3xl font-bold">
₹{revenue}
</h2>

</div>

<div className="bg-white rounded-3xl p-5 shadow">

<div className="text-3xl">
🕒
</div>

<p className="text-gray-500 mt-3">
Pending
</p>

<h2 className="text-3xl font-bold">
{pending}
</h2>

</div>

<div className="bg-white rounded-3xl p-5 shadow">

<div className="text-3xl">
👨‍🍳
</div>

<p className="text-gray-500 mt-3">
Preparing
</p>

<h2 className="text-3xl font-bold">
{preparing}
</h2>

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