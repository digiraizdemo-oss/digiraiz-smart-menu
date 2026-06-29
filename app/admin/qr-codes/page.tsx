"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QrCode, Download, Store, Sparkles } from "lucide-react"
import QRCode from "qrcode"

interface Restaurant {
  id: string
  name: string
  logo_url: string | null
}

interface GeneratedQR {
  tableNumber: number
  dataUrl: string
  url: string
}

export default function QRCodesPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")
  const [tableCount, setTableCount] = useState<string>("10")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([])
  const [selectedRestaurantData, setSelectedRestaurantData] = useState<Restaurant | null>(null)

  const supabase = createClient()
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    if (selectedRestaurant) {
      const restaurant = restaurants.find(r => r.id === selectedRestaurant)
      setSelectedRestaurantData(restaurant || null)
    }
  }, [selectedRestaurant, restaurants])

  const fetchRestaurants = async () => {
    const { data } = await supabase
      .from("restaurants")
      .select("id, name, logo_url")
      .eq("is_active", true)
      .order("name")
    setRestaurants(data || [])
    setLoading(false)
  }

  const generateQRCodes = async () => {
    if (!selectedRestaurant || !tableCount) return

    setGenerating(true)
    const count = parseInt(tableCount)
    const qrs: GeneratedQR[] = []
 const baseUrl = "https://v0-digiraiz-smart-menu.vercel.app"

    for (let i = 1; i <= count; i++) {
      const url = `${baseUrl}/menu/${selectedRestaurant}?table=${i}`

      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 256,
          margin: 4,
          errorCorrectionLevel: "H",
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        })

        qrs.push({
          tableNumber: i,
          dataUrl,
          url,
        })

        // Save to database
        await supabase.from("qr_codes").upsert({
          restaurant_id: selectedRestaurant,
          table_number: i,
          qr_url: url,
        }, {
          onConflict: "restaurant_id,table_number"
        })
      } catch (error) {
        console.error(`Error generating QR for table ${i}:`, error)
      }
    }

    setGeneratedQRs(qrs)
    setGenerating(false)
  }

  const downloadQR = async (qr: GeneratedQR) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 400
    canvas.height = 520

    // Background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Header background
    ctx.fillStyle = "#1e3a5f"
    ctx.fillRect(0, 0, canvas.width, 60)

    // Restaurant name
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 20px Arial"
    ctx.textAlign = "center"
    ctx.fillText(selectedRestaurantData?.name || "Restaurant", canvas.width / 2, 38)

    // QR Code
    const qrImg = new Image()
    qrImg.crossOrigin = "anonymous"
    qrImg.src = qr.dataUrl

    await new Promise((resolve) => {
      qrImg.onload = resolve
    })

    ctx.drawImage(qrImg, 72, 80, 256, 256)

    // Logo overlay (if available)
    if (selectedRestaurantData?.logo_url) {
      const logoImg = new Image()
      logoImg.crossOrigin = "anonymous"
      logoImg.src = selectedRestaurantData.logo_url

      try {
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve
          logoImg.onerror = reject
        })

        const logoSize = 35
        const logoX = (canvas.width - logoSize) / 2
        const logoY = 80 + (256 - logoSize) / 2

        // White circle background
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 5, 0, Math.PI * 2)
        ctx.fill()

        // Logo
        ctx.save()
        ctx.beginPath()
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
        ctx.restore()
      } catch {
        // Logo failed to load, continue without it
      }
    }

    // "Scan Me for Menu" text
    ctx.fillStyle = "#1e3a5f"
    ctx.font = "bold 18px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Scan Me for Menu", canvas.width / 2, 370)

    // Table number
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(130, 395, 140, 50)
    ctx.strokeStyle = "#1e3a5f"
    ctx.lineWidth = 2
    ctx.strokeRect(130, 395, 140, 50)

    ctx.fillStyle = "#1e3a5f"
    ctx.font = "bold 24px Arial"
    ctx.fillText(`Table ${qr.tableNumber}`, canvas.width / 2, 428)

    // Footer
    {/* Footer */ }
    <footer className="border-t border-border/50 py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 text-center space-y-3">

        {/* Logo */}
        <img
          src="/logo.png"
          alt="DigiRaiz"
          className="w-14 h-14 mx-auto object-contain"
        />

        {/* Powered by */}
        <p className="text-muted-foreground">
          Powered by <span className="font-semibold text-foreground">DigiRaiz</span>
        </p>

        {/* Instagram */}
        <a
          href="https://www.instagram.com/digiraiz/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-pink-500 hover:scale-110 transition"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M7.75 2C4.57 2 2 4.57 2 7.75v8.5C2 19.43 4.57 22 7.75 22h8.5C19.43 22 22 19.43 22 16.25v-8.5C22 4.57 19.43 2 16.25 2h-8.5zm0 2h8.5A3.75 3.75 0 0120 7.75v8.5A3.75 3.75 0 0116.25 20h-8.5A3.75 3.75 0 014 16.25v-8.5A3.75 3.75 0 017.75 4zm8.75 1.5a1 1 0 100 2 1 1 0 000-2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z" />
          </svg>
        </a>

      </div>
    </footer>

    // Download
    const link = document.createElement("a")
    link.download = `qr-table-${qr.tableNumber}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const downloadAllQRs = async () => {
    for (const qr of generatedQRs) {
      await downloadQR(qr)
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
       <h1 className="text-2xl font-bold text-foreground">
    DigiRaiz QR Generator
</h1>
        <p className="text-muted-foreground">Generate QR codes for table menus</p>
      </div>

      {/* Generator Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
         <CardTitle className="text-lg flex items-center gap-2">
    <QrCode className="w-5 h-5 text-primary" />
   DigiRaiz Smart QR
</CardTitle>
          <CardDescription>Select a restaurant and specify the number of tables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field>
              <FieldLabel>Restaurant</FieldLabel>
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger>
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Number of Tables</FieldLabel>
              <Input
                type="number"
                min="1"
                max="100"
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value)}
                placeholder="10"
              />
            </Field>

            <div className="flex items-end">
              <Button
                onClick={generateQRCodes}
                disabled={!selectedRestaurant || generating}
                className="w-full gap-2"
              >
                {generating ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate QR Codes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated QR Codes */}
      {generatedQRs.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Generated QR Codes</CardTitle>
              <CardDescription>{generatedQRs.length} QR codes ready for download</CardDescription>
            </div>
            <Button onClick={downloadAllQRs} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {generatedQRs.map((qr) => (
                <div
                  key={qr.tableNumber}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-border hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="bg-primary py-2 px-3">
                    <p className="text-primary-foreground text-xs font-medium text-center truncate">
                      {selectedRestaurantData?.name}
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="p-3 relative">
                    <img
                      src={qr.dataUrl}
                      alt={`Table ${qr.tableNumber}`}
                      className="w-full aspect-square"
                    />
                    {/* Logo overlay */}
                    {selectedRestaurantData?.logo_url && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 bg-white rounded-full p-1 shadow">
                          <img
                            src={selectedRestaurantData.logo_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-3 pb-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Scan Me for Menu</p>
                    <div className="inline-block px-3 py-1 bg-muted rounded-lg">
                      <p className="font-bold text-sm text-foreground">Table {qr.tableNumber}</p>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="px-3 pb-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1"
                      onClick={() => downloadQR(qr)}
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {generatedQRs.length === 0 && selectedRestaurant && (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <QrCode className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No QR Codes Generated</h3>
            <p className="text-muted-foreground">
              Click the button above to generate QR codes for your tables.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-0 shadow-lg bg-muted/50">
        <CardContent className="py-6">
          <h3 className="font-semibold text-foreground mb-3">How to use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Select a restaurant from the dropdown</li>
            <li>Enter the number of tables in your restaurant</li>
            <li>Click &quot;Generate QR Codes&quot; to create QR codes</li>
            <li>Download individual QR codes or use &quot;Download All&quot;</li>
            <li>Print and place the QR codes on respective tables</li>
            <li>Customers scan to view the digital menu</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
