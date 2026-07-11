"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Store,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Eye,
  Upload,
  ImageIcon,
} from "lucide-react"
import Link from "next/link"

interface Restaurant {
  id: string
  name: string
  logo_url: string | null
  banner_url: string | null
  address: string | null
  whatsapp: string | null
  instagram: string | null
  maps_url: string | null
  description: string | null
  is_active: boolean
  plan_type: "QR" | "DASHBOARD"
  created_at: string
}

interface RestaurantForm {
  name: string
  address: string
  whatsapp: string
  instagram: string
  maps_url: string
  description: string
  logo: File | null
  banner: File | null
}

const initialForm: RestaurantForm = {
  name: "",
  address: "",
  whatsapp: "",
  instagram: "",
  maps_url: "",
  description: "",
  logo: null,
  banner: null,
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<RestaurantForm>(initialForm)
  const [plan, setPlan] = useState<"QR" | "DASHBOARD">("QR")
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const [role, setRole] = useState("owner")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false })
    setRestaurants(data || [])
    setLoading(false)
  }

  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (error) throw error

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let logoUrl = editingId ? restaurants.find(r => r.id === editingId)?.logo_url || null : null
      let bannerUrl = editingId ? restaurants.find(r => r.id === editingId)?.banner_url || null : null

      if (form.logo) {
        logoUrl = await uploadFile(form.logo, "restaurant-logos")
      }
      if (form.banner) {
        bannerUrl = await uploadFile(form.banner, "restaurant-banners")
      }

      const restaurantData = {
        name: form.name,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        address: form.address || null,
        whatsapp: form.whatsapp || null,
        instagram: form.instagram || null,
        maps_url: form.maps_url || null,
        description: form.description || null,
      }

      if (editingId) {
  const { error } = await supabase
  .from("restaurants")
  .update({
    ...restaurantData,
    plan_type: plan, // ✅ correct
    // ❌ NO DEFAULT now() here
  })
  .eq("id", editingId)
       if (error) {
  console.log("UPDATE ERROR:", error)
  alert(error.message)
  return
}

        alert("Updated successfully ✅")
      } else {
       const { data: newRestaurant, error: insertError } = await supabase
  .from("restaurants")
  .insert({
    ...restaurantData,
    plan_type: plan,// ✅ NEW
  })
  .select()
  .single()

if (insertError) {
  console.error(insertError)
  alert("Insert failed ❌")
  return
}
if (plan === "DASHBOARD") {
  const { data: userData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    alert("User creation failed ❌")
    console.error(authError)
    return
  }

  await supabase.from("profiles").insert({
    id: userData.user?.id,
    role: role,
    restaurant_id: newRestaurant.id,
  })
}
      }

      setForm(initialForm)
      setEditingId(null)
      setDialogOpen(false)
      setLogoPreview(null)
      setBannerPreview(null)
      fetchRestaurants()
    } catch (error) {
      console.error("Error saving restaurant:", error)
    } finally {
      setSubmitting(false)
    }
  }

 const handleEdit = (restaurant: Restaurant) => {
  setForm({
    name: restaurant.name,
    address: restaurant.address || "",
    whatsapp: restaurant.whatsapp || "",
    instagram: restaurant.instagram || "",
    maps_url: restaurant.maps_url || "",
    description: restaurant.description || "",
    logo: null,
    banner: null,
  })

  // Load the saved plan
  setPlan(restaurant.plan_type || "QR")

  // Clear login fields while editing
  setEmail("")
  setPassword("")

  setLogoPreview(restaurant.logo_url)
  setBannerPreview(restaurant.banner_url)

  setEditingId(restaurant.id)
  setDialogOpen(true)
}

  const handleDelete = async () => {
    if (!deleteId) return

    const { error } = await supabase
      .from("restaurants")
      .delete()
      .eq("id", deleteId)

    if (error) {
      console.error("Delete Error:", error)
      alert("Delete failed ❌")
      return
    }

    setDeleteId(null)
    fetchRestaurants()
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await supabase.from("restaurants").update({ is_active: isActive }).eq("id", id)
    setRestaurants(prev =>
      prev.map(r => r.id === id ? { ...r, is_active: isActive } : r)
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0]
    if (!file) return

    setForm(prev => ({ ...prev, [type]: file }))

    const reader = new FileReader()
    reader.onload = (e) => {
      if (type === "logo") {
        setLogoPreview(e.target?.result as string)
      } else {
        setBannerPreview(e.target?.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setLogoPreview(null)
    setBannerPreview(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
         <h1 className="text-2xl md:text-3xl font-bold">Restaurants</h1>
          <p className="text-muted-foreground">Manage your restaurant listings</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Restaurant" : "Add New Restaurant"}</DialogTitle>
              <DialogDescription>
                Fill in the details to {editingId ? "update" : "add"} a restaurant.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FieldGroup>
            <Field>
  <FieldLabel>Plan</FieldLabel>
  <select
    value={plan}
    onChange={(e) => setPlan(e.target.value as any)}
    className="border p-2 rounded w-full"
  >
    <option value="QR">QR Only</option>
    <option value="DASHBOARD">Dashboard</option>
  </select>
</Field>
{plan === "DASHBOARD" && (
  <>
    <Field>
      <FieldLabel>Email</FieldLabel>
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter login email"
      />
    </Field>

    <Field>
      <FieldLabel>Password</FieldLabel>
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
      />
    </Field>

    <Field>
      <FieldLabel>Role</FieldLabel>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="border p-2 rounded w-full"
      >
        <option value="owner">Owner</option>
        <option value="staff">Staff</option>
      </select>
    </Field>
  </>
)}
                {/* Logo Upload */}
                <Field>
                  <FieldLabel>Logo</FieldLabel>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "logo")}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Recommended: 200x200px</p>
                    </div>
                  </div>
                </Field>

                {/* Banner Upload */}
                <Field>
                  <FieldLabel>Banner Image</FieldLabel>
                  <div className="space-y-3">
                    <div className="w-full h-32 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                      {bannerPreview ? (
                        <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground mt-1">Upload banner</p>
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "banner")}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">Recommended: 1200x400px</p>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="whatsapp">WhatsApp Number</FieldLabel>
                  <Input
                    id="whatsapp"
                    value={form.whatsapp}
                    onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="+91 9876543210"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="instagram">Instagram URL</FieldLabel>
                  <Input
                    id="instagram"
                    value={form.instagram}
                    onChange={(e) => setForm(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="https://instagram.com/yourrestaurant"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="maps_url">Google Maps URL</FieldLabel>
                  <Input
                    id="maps_url"
                    value={form.maps_url}
                    onChange={(e) => setForm(prev => ({ ...prev, maps_url: e.target.value }))}
                    placeholder="https://maps.google.com/..."
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter restaurant description"
                    rows={3}
                  />
                </Field>
              </FieldGroup>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner className="mr-2" />
                      {editingId ? "Updating..." : "Adding..."}
                    </>
                  ) : editingId ? "Update Restaurant" : "Add Restaurant"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Restaurant Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <Store className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No restaurants yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first restaurant.</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Restaurant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <CardContent className="p-0">
                {/* Banner */}
                <div className="h-28 sm:h-32 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
                  {restaurant.banner_url && (
                    <img
                      src={restaurant.banner_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Active Toggle */}
                  <div className="absolute top-3 right-3">
                    <Switch
                      checked={restaurant.is_active}
                      onCheckedChange={(checked) => handleToggleActive(restaurant.id, checked)}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 -mt-8 relative">
                  {/* Logo */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-card shadow-lg ...">
                    {restaurant.logo_url ? (
                      <img
                        src={restaurant.logo_url}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-8 h-8 text-primary" />
                    )}
                  </div>

                  <h3 className="font-semibold text-lg text-foreground mb-1">{restaurant.name}</h3>

                  {restaurant.whatsapp && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                      <Phone className="w-3 h-3" />
                      {restaurant.whatsapp}
                    </p>
                  )}

                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium mb-4 ${restaurant.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${restaurant.is_active ? "bg-green-500" : "bg-gray-400"
                      }`} />
                    {restaurant.is_active ? "Active" : "Inactive"}
                  </div>

                  {/* Actions */}
                 <div className="flex flex-wrap gap-2 mt-4">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/menu/${restaurant.id}`} target="_blank">
                        <Eye className="w-4 h-4 mr-1" />
                        View Menu
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(restaurant)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(restaurant.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Restaurant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the restaurant and all its data including menus and QR codes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
