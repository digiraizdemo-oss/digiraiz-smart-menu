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
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

{restaurants.map((r) => (

<div
key={r.id}
className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300"
>

{/* Banner */}

<div className="relative h-44">

<img
src={r.banner_url || "https://via.placeholder.com/900x400"}
className="w-full h-full object-cover"
/>

<button className="absolute top-4 right-4 bg-white rounded-full p-2 shadow">

<div
className={`w-4 h-4 rounded-full ${
r.is_active ? "bg-green-500" : "bg-red-500"
}`}
/>

</button>

</div>

{/* Body */}

<div className="relative px-6 pb-6">

{/* Logo */}

<div className="-mt-10 mb-4">

<img
src={r.logo_url || "https://via.placeholder.com/100"}
className="w-20 h-20 rounded-2xl border-4 border-white shadow object-cover bg-white"
/>

</div>

{/* Name */}

<h2 className="text-2xl font-bold">
{r.name}
</h2>

<p className="text-slate-500 mt-2">
📍 {r.address}
</p>

<p className="text-slate-500 mt-1">
📞 {r.phone}
</p>

<div className="mt-4">

<span
className={`px-4 py-2 rounded-full text-sm font-semibold ${
r.is_active
? "bg-green-100 text-green-700"
: "bg-red-100 text-red-700"
}`}
>

{r.is_active ? "🟢 Active" : "🔴 Inactive"}

</span>

</div>

{/* Stats */}

<div className="grid grid-cols-3 gap-3 mt-6">

<div className="bg-slate-100 rounded-xl py-3 text-center">

<div className="text-lg">📦</div>

<p className="font-bold">
{r.total_orders || 0}
</p>

<p className="text-xs text-slate-500">
Orders
</p>

</div>

<div className="bg-slate-100 rounded-xl py-3 text-center">

<div className="text-lg">⭐</div>

<p className="font-bold">
{r.rating || 0}
</p>

<p className="text-xs text-slate-500">
Rating
</p>

</div>

<div className="bg-slate-100 rounded-xl py-3 text-center">

<div className="text-lg">🍽️</div>

<p className="font-bold">
{r.total_items || 0}
</p>

<p className="text-xs text-slate-500">
Items
</p>

</div>

</div>

{/* Buttons */}

<div className="grid grid-cols-3 gap-3 mt-6">

<button
onClick={() => (window.location.href = `/menu/${r.id}`)}
className="border rounded-xl py-3 hover:bg-slate-100 transition"
>

👁 Menu

</button>

<button
onClick={() => (window.location.href = `/admin/restaurants/edit/${r.id}`)}
className="border rounded-xl py-3 hover:bg-slate-100 transition"
>

✏ Edit

</button>

<button
onClick={() => deleteRestaurant(r.id)}
className="bg-red-500 hover:bg-red-600 text-white rounded-xl py-3 transition"
>

🗑 Delete

</button>

</div>

</div>

</div>

))}

</div>
</div>
</div>
)
}