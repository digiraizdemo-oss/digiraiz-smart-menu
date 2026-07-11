"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function AdminDashboardPage() {
  const supabase = createClient()

  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    const { data } = await supabase.from("restaurants").select("*")
    setRestaurants(data || [])
    setLoading(false)
  }

  const deleteRestaurant = async (id: string) => {
    await supabase.from("restaurants").delete().eq("id", id)
    fetchRestaurants()
  }

return (
<div className="min-h-screen bg-slate-50">

  {/* Hero Header */}
  <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 text-white rounded-b-[35px] shadow-xl">

    <div className="max-w-7xl mx-auto px-5 py-8">

      <div className="flex flex-col lg:flex-row justify-between gap-6">

        <div>

          <p className="text-blue-100 font-medium">
            👋 Welcome Back
          </p>

          <h1 className="text-4xl font-bold mt-2">
            Super Admin
          </h1>

          <p className="text-blue-100 mt-2">
            Manage restaurants, menus, QR codes and orders.
          </p>

        </div>

        <div className="bg-white/20 backdrop-blur-lg rounded-3xl px-6 py-5">

          <p className="text-blue-100">
            Total Restaurants
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {restaurants.length}
          </h2>

          <p className="text-green-200 mt-1">
            Active Businesses
          </p>

        </div>

      </div>

    </div>

  </div>

  <div className="max-w-7xl mx-auto px-4 py-6">

    {/* Action Bar */}

    <div className="flex flex-col md:flex-row gap-4 mb-6">

      <button
        onClick={() => (window.location.href = "/admin/restaurants")}
        className="bg-blue-600 hover:bg-blue-700 transition text-white rounded-2xl px-6 py-3 font-semibold shadow-lg"
      >
        + Manage Restaurants
      </button>

      <input
        placeholder="Search restaurants..."
        className="flex-1 bg-white rounded-2xl border border-slate-200 px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
      />

    </div>

    {/* Stats */}

    <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

      <div className="bg-white rounded-3xl shadow p-5">

        <p className="text-slate-500">
          Restaurants
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {restaurants.length}
        </h2>

      </div>

      <div className="bg-green-50 rounded-3xl shadow p-5">

        <p className="text-green-700">
          Active
        </p>

        <h2 className="text-3xl font-bold mt-2 text-green-700">
          {restaurants.filter(r => r.is_active).length}
        </h2>

      </div>

      <div className="bg-yellow-50 rounded-3xl shadow p-5">

        <p className="text-yellow-700">
          Pending
        </p>

        <h2 className="text-3xl font-bold mt-2 text-yellow-700">
          0
        </h2>

      </div>

      <div className="bg-red-50 rounded-3xl shadow p-5">

        <p className="text-red-700">
          Inactive
        </p>

        <h2 className="text-3xl font-bold mt-2 text-red-700">
          {restaurants.filter(r => !r.is_active).length}
        </h2>

      </div>

    </div>

    {/* LIST */}
    <div className="space-y-5">
      {restaurants.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-2xl shadow p-4 flex gap-4"
        >

          {/* IMAGE */}
         <div className="relative w-28 h-28">

  {/* Banner */}
  <img
    src={r.banner_url || "https://via.placeholder.com/300"}
    className="w-full h-full object-cover rounded-xl"
  />

  {/* Logo */}
  <img
    src={r.logo_url || "https://via.placeholder.com/80"}
    className="w-12 h-12 rounded-xl absolute bottom-0 left-0 translate-y-1/2 border bg-white p-1"
  />

</div>

          {/* INFO */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-1 rounded-full ${
                r.is_active
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}>
                {r.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="font-bold text-lg">{r.name}</p>

            <p className="text-sm text-gray-500">{r.phone}</p>
            <p className="text-sm text-gray-500">{r.address}</p>

            {/* STATS */}
            <div className="flex gap-4 mt-3 text-sm">
              <span className="bg-gray-100 px-3 py-1 rounded">
                📦 {r.total_orders || 0} Orders
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded">
                ⭐ {r.rating || 0}
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded">
                📋 {r.total_items || 0}
              </span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col gap-2">
           <button
  onClick={() => (window.location.href = `/menu/${r.id}`)}
  className="border px-4 py-1 rounded-lg"
>
  View Menu
</button>

          <button
  onClick={() => (window.location.href = `/admin/restaurants/edit/${r.id}`)}
  className="border px-4 py-1 rounded-lg"
>
  Edit
</button>

            <button
              onClick={() => deleteRestaurant(r.id)}
              className="bg-red-500 text-white px-4 py-1 rounded-lg"
            >
              Delete
            </button>
          </div>

        </div>
      ))}
    </div>

  </div>
)
}