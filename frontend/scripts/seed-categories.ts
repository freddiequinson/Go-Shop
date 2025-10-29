/**
 * Seed initial categories for GoShopGhana
 * Run this from the frontend to populate categories via API
 */

const API_URL = "http://localhost:8000"

const categoriesData = [
  // Main Categories with Subcategories
  {
    name: "Groceries",
    description: "Food and grocery items",
    subcategories: [
      { name: "Vegetables", description: "Fresh vegetables" },
      { name: "Fruits", description: "Fresh fruits" },
      { name: "Tubers", description: "Root vegetables and tubers" },
      { name: "Spices", description: "Spices and seasonings" },
      { name: "Beverages", description: "Drinks and beverage items" },
      { name: "Animal Protein", description: "Meat, fish, and eggs" },
      { name: "Seeds & Nuts", description: "Seeds and nuts" },
      { name: "Grains", description: "Grains and cereals" },
    ]
  },
  { name: "Water", description: "Bottled and mineral water" },
  { name: "Men's Fashion", description: "Men's clothing and accessories" },
  { name: "Women's Fashion", description: "Women's clothing and accessories" },
  { name: "Baby", description: "Baby products and essentials" },
  { name: "Boy's Fashion", description: "Boys' clothing and accessories" },
  { name: "Girls Fashion", description: "Girls' clothing and accessories" },
  { name: "Auto Parts", description: "Automotive parts and accessories" },
  { name: "Electronics", description: "Electronic devices and gadgets" },
  { name: "Toiletries", description: "Personal care and hygiene products" },
  { name: "Arts & Craft", description: "Art supplies and craft materials" },
  { name: "Toys and Games", description: "Toys and games for children" },
  { name: "Pet's Supplies", description: "Pet food and accessories" },
  { name: "Home & Kitchen", description: "Home and kitchen essentials" },
  { name: "Health", description: "Health and wellness products" },
]

async function seedCategories() {
  const token = localStorage.getItem("access_token")
  
  if (!token) {
    console.error("❌ No access token found. Please login first.")
    return
  }

  console.log("🌱 Starting category seeding...")
  let created = 0

  try {
    for (const catData of categoriesData) {
      // Create main category
      const mainResponse = await fetch(`${API_URL}/api/v1/products/categories`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: catData.name,
          description: catData.description,
          is_active: true
        })
      })

      if (mainResponse.ok) {
        const mainCat = await mainResponse.json()
        created++
        console.log(`✅ Created main category: ${mainCat.name}`)

        // Create subcategories if any
        if (catData.subcategories) {
          for (const subData of catData.subcategories) {
            const subResponse = await fetch(`${API_URL}/api/v1/products/categories`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                name: subData.name,
                description: subData.description,
                parent_id: mainCat.id,
                is_active: true
              })
            })

            if (subResponse.ok) {
              const subCat = await subResponse.json()
              created++
              console.log(`  ✅ Created subcategory: ${subCat.name}`)
            } else {
              console.log(`  ⚠️ Subcategory ${subData.name} may already exist`)
            }
          }
        }
      } else {
        console.log(`⚠️ Category ${catData.name} may already exist`)
      }
    }

    console.log(`\n🎉 Successfully created ${created} categories!`)
    console.log("Categories are now available in the system.")
  } catch (error) {
    console.error("❌ Error seeding categories:", error)
  }
}

// Run the seeding
seedCategories()
