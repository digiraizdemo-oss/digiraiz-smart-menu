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
  <div className="min-h-screen bg-gray-50 p-4">

  {/* HEADER */}
<div className="mb-8">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

    <div>
      <p className="text-blue-600 font-semibold text-sm">
        👋 Welcome Back
      </p>

      <h1 className="text-3xl md:text-4xl font-bold mt-1">
        Super Admin Dashboard
      </h1>

      <p className="text-gray-500 mt-2">
        Manage restaurants, menus and QR codes
      </p>
    </div>

    <div className="bg-white rounded-3xl shadow-lg px-6 py-4 flex items-center gap-4">
      <div className="text-4xl">🏬</div>

      <div>
        <p className="text-sm text-gray-500">
          Total Restaurants
        </p>

        <p className="text-2xl font-bold">
          {restaurants.length}
        </p>

        <p className="text-green-600 text-sm font-semibold">
          Active Restaurants
        </p>
      </div>
    </div>

  </div>
</div>

    {/* ACTION BAR */}
    <div className="flex gap-3 mb-6">
     <button
  onClick={() => (window.location.href = "/admin/restaurants")}
  className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow"
>
  Manage Restaurants
</button>

      <input
        placeholder="Search restaurants..."
        className="flex-1 px-4 py-2 border rounded-xl"
      />
    </div>

    {/* STATS */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">Total</p>
        <p className="text-xl font-bold">{restaurants.length}</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">Active</p>
        <p className="text-xl font-bold text-green-600">
          {restaurants.filter(r => r.is_active).length}
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">Pending</p>
        <p className="text-xl font-bold text-yellow-500">0</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-500 text-sm">Inactive</p>
        <p className="text-xl font-bold text-red-500">
          {restaurants.filter(r => !r.is_active).length}
        </p>
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