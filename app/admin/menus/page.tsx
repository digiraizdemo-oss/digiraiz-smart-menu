"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AdminMenusContent() {
  const supabase = createClient()

  const [restaurants, setRestaurants] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
const [variants, setVariants] = useState<any[]>([])
  const [restaurantId, setRestaurantId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categoryName, setCategoryName] = useState("")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [itemType, setItemType] = useState("")
  const [price, setPrice] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const [isAvailable, setIsAvailable] = useState(true)
  const [isPopular, setIsPopular] = useState(false)
  const [isSpecial, setIsSpecial] = useState(false)

  const [editingItem, setEditingItem] = useState<any>(null)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    if (restaurantId) {
      fetchCategories()
      fetchItems()
    }
  }, [restaurantId])

  const fetchRestaurants = async () => {
    const { data } = await supabase.from("restaurants").select("*")
    setRestaurants(data || [])
  }

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantId)

    setCategories(data || [])
  }

  const fetchItems = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)

    setItems(data || [])
  }

  const uploadFile = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`
    await supabase.storage.from("menu-images").upload(fileName, file)
    const { data } = supabase.storage.from("menu-images").getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleAddCategory = async () => {
    await supabase.from("categories").insert({
      name: categoryName,
      restaurant_id: restaurantId,
    })
    setCategoryName("")
    fetchCategories()
  }

  const handleAddOrUpdateItem = async () => {
    let imageUrl = editingItem?.image_url || null

    if (file) {
      imageUrl = await uploadFile(file)
    }

    const payload = {
  name,
  description,
  item_type: itemType,
  price: Number(price),
  image_url: imageUrl,
  category_id: categoryId,
  restaurant_id: restaurantId,
  is_available: isAvailable,
  is_popular: isPopular,
  is_special: isSpecial,

  // ✅ VARIANTS
  variants: Array.isArray(variants) && variants.length > 0
  ? variants
  : null,
}

    if (editingItem) {
      await supabase.from("menu_items").update(payload).eq("id", editingItem.id)
    } else {
      await supabase.from("menu_items").insert(payload)
    }

    resetForm()
    fetchItems()
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setName(item.name)
    setDescription(item.description)
    setItemType(item.item_type)
    setPrice(item.price)
    setCategoryId(item.category_id)
    setIsAvailable(item.is_available)
    setIsPopular(item.is_popular)
    setIsSpecial(item.is_special)
   setVariants(Array.isArray(item.variants) ? item.variants : [])
  }

  const handleDelete = async (id: string) => {
    await supabase.from("menu_items").delete().eq("id", id)
    fetchItems()
  }

  const resetForm = () => {
    setEditingItem(null)
    setName("")
    setDescription("")
    setItemType("")
    setPrice("")
    setFile(null)
    setIsAvailable(true)
    setIsPopular(false)
    setIsSpecial(false)
    setVariants([])
  }

  // 🚀 FULL AUTO AI IMPORT
  const handleAIScan = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    if (!restaurantId) {
      alert("Select restaurant first ❗")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/scan-menu", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()

    if (!data?.categories?.length) {
      alert("AI failed ❌")
      return
    }

    for (const cat of data.categories) {
      // create category
      const { data: newCategory } = await supabase
        .from("categories")
        .insert({
          name: cat.name,
          restaurant_id: restaurantId,
        })
        .select()
        .single()

      const newCategoryId = newCategory.id

      // insert items
      for (const item of cat.items) {
        await supabase.from("menu_items").insert({
          name: item.name,
          description: item.description || "",
          item_type: item.type || "Full",
          price: Number(item.price) || 0,
          category_id: newCategoryId,
          restaurant_id: restaurantId,
          is_available: true,
          is_popular: item.popular || false,
          is_special: item.special || false,
        })
      }
    }

    alert("Full Menu Imported 🚀")

    fetchCategories()
    fetchItems()
  }
const addVariant = () => {
  setVariants([
    ...variants,
    {
      name: "",
      price: ""
    }
  ])
}

const updateVariant = (
  index: number,
  field: string,
  value: string
) => {

  const updated = [...variants]

  updated[index][field] = value

  setVariants(updated)
}

const removeVariant = (index: number) => {
  setVariants(variants.filter((_, i) => i !== index))
}
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      <h2 className="text-xl font-bold">Menu Management</h2>
      <input
        id="aiUpload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAIScan}
      />

      {/* SELECT RESTAURANT */}
      <select
        className="w-full border p-2 rounded"
        value={restaurantId}
        onChange={(e) => setRestaurantId(e.target.value)}
      >
        <option value="">Select Restaurant</option>
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {/* ADD CATEGORY */}
      <div className="space-y-2">
        <Input
          placeholder="Add Category"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
        />
        <Button onClick={handleAddCategory}>Add Category</Button>
      </div>

      {/* SELECT CATEGORY */}
      <select
        className="w-full border p-2 rounded"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* ITEM FORM */}
      <Input placeholder="Item Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

      <select
        value={itemType}
        onChange={(e) => setItemType(e.target.value)}
        className="w-full border rounded p-2"
      >
        <option value="">None</option>
        <option value="Full">Full</option>
        <option value="Half">Half</option>
        <option value="Plate">Plate</option>
      </select>

      <Input
        placeholder="Or enter custom type"
        onChange={(e) => setItemType(e.target.value)}
      />

      <Input type="number" placeholder="Price" value={price} 
      onChange={(e) => setPrice(e.target.value)} />
      {/* ✅ VARIANTS */}
<div className="space-y-3 mt-4">

  <div className="flex justify-between items-center">
    <h3 className="font-medium">Variants</h3>

    <button
      type="button"
      onClick={addVariant}
      className="text-sm bg-green-500 text-white px-3 py-1 rounded"
    >
      + Add Variant
    </button>
  </div>
{Array.isArray(variants) &&
  variants.map((variant, index) => (
    <div
      key={index}
      className="flex gap-2 items-center"
    >

      <input
        placeholder="Variant Name"
        value={variant.name}
        onChange={(e) =>
          updateVariant(index, "name", e.target.value)
        }
        className="flex-1 border p-2 rounded"
      />

      <input
        type="number"
        placeholder="Price"
        value={variant.price}
        onChange={(e) =>
          updateVariant(index, "price", e.target.value)
        }
        className="w-24 border p-2 rounded"
      />

      <button
        type="button"
        onClick={() => removeVariant(index)}
        className="text-red-500"
      >
        ✕
      </button>

    </div>
  ))}

</div>

      <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <div className="flex gap-4">
        <label><input type="checkbox" checked={isAvailable} onChange={() => setIsAvailable(!isAvailable)} /> Available</label>
        <label><input type="checkbox" checked={isPopular} onChange={() => setIsPopular(!isPopular)} /> Popular</label>
        <label><input type="checkbox" checked={isSpecial} onChange={() => setIsSpecial(!isSpecial)} /> Special</label>
      </div>

      <Button onClick={handleAddOrUpdateItem}>
        {editingItem ? "Update Item" : "Add Item"}
      </Button>

      {/* ITEMS LIST */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 border p-2 rounded">
            {item.image_url && <img src={item.image_url} className="w-12 h-12 rounded" />}
            <div className="flex-1">
              <p>{item.name}</p>
              <p className="text-sm text-gray-500">₹{item.price}</p>
            </div>
            <Button size="sm" onClick={() => handleEdit(item)}>Edit</Button>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
          </div>
        ))}
      </div>

    </div>
  )
}