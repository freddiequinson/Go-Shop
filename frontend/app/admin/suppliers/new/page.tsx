"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Building2, User, Mail, Phone, MapPin, FileText, ArrowLeft, Save, CreditCard, Briefcase, Tag } from "lucide-react"
import { getErrorMessage } from "@/lib/error-handler"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function AddSupplierPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    supplier_type: "farmer" as "farmer" | "wholesaler" | "distributor" | "manufacturer",
    contact_person: "",
    phone: "",
    email: "",
    alternative_phone: "",
    location: {
      address: "",
      city: "",
      region: "",
      gps_address: ""
    },
    business_registration: "",
    tax_id: "",
    payment_terms: "",
    bank_details: {
      bank_name: "",
      account_number: "",
      account_name: "",
      branch: ""
    },
    specialization: [] as string[],
    notes: ""
  })

  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch("http://localhost:8000/api/v1/products/categories/", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  // Organize categories by parent
  const organizedCategories = categories.reduce((acc: any, category: any) => {
    if (!category.parent_id) {
      acc.push({
        ...category,
        subcategories: categories.filter((c: any) => c.parent_id === category.id)
      })
    }
    return acc
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/suppliers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          // Only include location if address is provided
          location: formData.location.address ? formData.location : null,
          // Only include bank_details if bank_name is provided
          bank_details: formData.bank_details.bank_name ? formData.bank_details : null,
          // Only include specialization if not empty
          specialization: formData.specialization.length > 0 ? formData.specialization : null
        })
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Supplier created successfully"
        })
        router.push("/admin/suppliers")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: getErrorMessage(error, "Failed to create supplier"),
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating supplier:", error)
      toast({
        title: "Error",
        description: "Failed to create supplier",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 bg-[#F4F2E6] min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/admin/suppliers">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Add New Supplier</h1>
            <p className="text-[#303A4D]/70">Register a new supplier to your network</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card className="p-6 mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-[#303A4D]">Basic Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Supplier Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fresh Farms Ltd"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="supplier_type" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Supplier Type *
                </Label>
                <Select
                  value={formData.supplier_type}
                  onValueChange={(value: any) => setFormData({ ...formData, supplier_type: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select supplier type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="contact_person" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Person
              </Label>
              <Input
                id="contact_person"
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="e.g., John Doe"
                className="mt-2"
              />
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6 mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[#303A4D]">Contact Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Primary Phone *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+233 24 123 4567"
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="alternative_phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Alternative Phone
              </Label>
              <Input
                id="alternative_phone"
                type="tel"
                value={formData.alternative_phone}
                onChange={(e) => setFormData({ ...formData, alternative_phone: e.target.value })}
                placeholder="+233 20 987 6543"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="supplier@example.com"
                className="mt-2"
              />
            </div>
          </div>
        </Card>

        {/* Location Information */}
        <Card className="p-6 mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-[#303A4D]">Location Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Physical Address
              </Label>
              <Textarea
                id="address"
                value={formData.location.address}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: { ...formData.location, address: e.target.value }
                })}
                placeholder="Enter supplier's physical address..."
                className="mt-2 min-h-20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location: { ...formData.location, city: e.target.value }
                  })}
                  placeholder="e.g., Accra"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.location.region}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location: { ...formData.location, region: e.target.value }
                  })}
                  placeholder="e.g., Greater Accra"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="gps_address">GPS Address</Label>
                <Input
                  id="gps_address"
                  value={formData.location.gps_address}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location: { ...formData.location, gps_address: e.target.value }
                  })}
                  placeholder="e.g., GA-123-4567"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Business Details */}
        <Card className="p-6 mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-[#303A4D]">Business Details</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business_registration">Business Registration Number</Label>
                <Input
                  id="business_registration"
                  value={formData.business_registration}
                  onChange={(e) => setFormData({ ...formData, business_registration: e.target.value })}
                  placeholder="e.g., BN123456789"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="tax_id">Tax ID / TIN</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="e.g., C0123456789"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Input
                id="payment_terms"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="e.g., Net 30 days, Cash on delivery"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Specify payment terms and conditions</p>
            </div>
          </div>
        </Card>

        {/* Bank Details */}
        <Card className="p-6 mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[#303A4D]">Bank Details</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_details.bank_name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    bank_details: { ...formData.bank_details, bank_name: e.target.value }
                  })}
                  placeholder="e.g., GCB Bank"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={formData.bank_details.account_number}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    bank_details: { ...formData.bank_details, account_number: e.target.value }
                  })}
                  placeholder="e.g., 1234567890"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={formData.bank_details.account_name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    bank_details: { ...formData.bank_details, account_name: e.target.value }
                  })}
                  placeholder="e.g., Fresh Farms Ltd"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={formData.bank_details.branch}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    bank_details: { ...formData.bank_details, branch: e.target.value }
                  })}
                  placeholder="e.g., Accra Main Branch"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Specialization */}
        <Card className="p-6 mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Tag className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-[#303A4D]">Product Specialization</h2>
          </div>
          
          <div>
            <Label>Select Categories</Label>
            <p className="text-sm text-gray-500 mb-3">Choose the product categories this supplier specializes in</p>
            
            {loadingCategories ? (
              <p className="text-sm text-gray-400">Loading categories...</p>
            ) : organizedCategories.length === 0 ? (
              <p className="text-sm text-gray-400">No categories available</p>
            ) : (
              <div className="space-y-4">
                {organizedCategories.map((parent: any) => (
                  <div key={parent.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Checkbox
                        id={parent.id}
                        checked={formData.specialization.includes(parent.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Add parent and all subcategories
                            const allIds = [parent.id, ...parent.subcategories.map((s: any) => s.id)]
                            setFormData({
                              ...formData,
                              specialization: [...new Set([...formData.specialization, ...allIds])]
                            })
                          } else {
                            // Remove parent and all subcategories
                            const idsToRemove = [parent.id, ...parent.subcategories.map((s: any) => s.id)]
                            setFormData({
                              ...formData,
                              specialization: formData.specialization.filter(id => !idsToRemove.includes(id))
                            })
                          }
                        }}
                      />
                      <Label
                        htmlFor={parent.id}
                        className="text-base font-semibold cursor-pointer text-[#303A4D]"
                      >
                        {parent.name}
                      </Label>
                    </div>
                    
                    {parent.subcategories.length > 0 && (
                      <div className="ml-6 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {parent.subcategories.map((sub: any) => (
                          <div key={sub.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={sub.id}
                              checked={formData.specialization.includes(sub.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    specialization: [...formData.specialization, sub.id]
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    specialization: formData.specialization.filter(id => id !== sub.id)
                                  })
                                }
                              }}
                            />
                            <Label
                              htmlFor={sub.id}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {sub.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Additional Notes */}
        <Card className="p-6 mb-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-[#303A4D]">Additional Notes</h2>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes about this supplier..."
              className="mt-2 min-h-24"
            />
            <p className="text-xs text-gray-500 mt-1">Delivery schedules, special requirements, certifications, etc.</p>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card className="p-6 bg-white">
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold py-6 text-lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? "Creating Supplier..." : "Create Supplier"}
            </Button>
            <Link href="/admin/suppliers" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full py-6 text-lg font-bold"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </Card>
        </form>
      </div>
    </div>
  )
}
