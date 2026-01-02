"""
AI Assistant Service using Groq
Handles recipe suggestions, shopping lists, and customer support
"""

from typing import List, Dict, Optional, Any
from groq import Groq
from app.core.config import settings
from sqlalchemy.orm import Session
from app.models.product import Product
import json
import logging

logger = logging.getLogger(__name__)


class AIAssistant:
    """AI Assistant for recipe suggestions and shopping lists"""
    
    def __init__(self):
        """Initialize Groq client with context"""
        if not settings.GROQ_API_KEY:
            logger.error("GROQ_API_KEY not set in environment variables")
            raise ValueError("GROQ_API_KEY not set in environment variables")
        
        try:
            self.client = Groq(api_key=settings.GROQ_API_KEY)
            self.model = settings.GROQ_MODEL
            self.max_tokens = settings.GROQ_MAX_TOKENS
            self.temperature = settings.GROQ_TEMPERATURE
            logger.info(f"Groq AI Assistant initialized successfully with model: {self.model}")
            logger.info(f"API Key (first 10 chars): {settings.GROQ_API_KEY[:10]}...")
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {e}", exc_info=True)
            raise
    
    def get_system_prompt(self, product_catalog: str) -> str:
        """Generate system prompt with product catalog"""
        return f"""You are Gloria, GoShop Ghana's AI shopping assistant. Be CONCISE and DIRECT.

GOSHOP GHANA SYSTEM KNOWLEDGE:

DELIVERY & ORDERS:
- 48-hour delivery guarantee across Ghana
- Fresh products from local farmers
- Track orders in your account dashboard
- Contact support for order issues

GIFT CARDS:
- Buy gift cards from the Gift Cards page
- Choose amount: GH₵50, GH₵100, GH₵200, or custom
- Send to anyone via email
- Recipients redeem in their wallet
- Check gift card balance in Wallet section
- Apply gift cards at checkout automatically

WALLET & PAYMENTS:
- Add money to wallet via Mobile Money or Card
- Use wallet balance at checkout
- Send money to friends (Bubbles feature)
- View transaction history in Wallet page
- Gift cards add to wallet balance

BUBBLES (GROUP BUYING):
- Create shopping groups with friends/family
- Pool money together for bulk orders
- Share costs and save money
- Manage in Bubbles section

ACCOUNT FEATURES:
- Save multiple delivery addresses
- Track order history
- Manage payment methods
- Update profile information
- View loyalty points

=== GHANAIAN RECIPES KNOWLEDGE BASE ===

**GHANAIAN FISH STEW (4-6 servings, 1hr 30min)**
Fish: 1 whole fish (10-12 inches)
Marinade: 1 tsp salt, 1.5 tsp fenugreek/fennel/turmeric, 4 green cardamom
Sauce: 10 tomatoes, 2-3 onions, 6 garlic cloves, 1-2 scotch bonnet peppers, 1 inch ginger
Spices: 1/2 nutmeg, 1 star anise, 1 tsp rosemary, 1/4 tsp red pepper seeds, 2-3 tsp salt, 2 maggi cubes, 1 tsp black pepper, 2 tsp fennel/fenugreek/coriander, 3 bay leaves, 1 tsp 5 spice
Other: 3 tbsp sesame oil, 1 package tomato paste, 2 cups water
Serve with: 2 cups rice, 1.5 cups beans

**GHANA SALAD (12 servings, 20min)**
- 2 Tomatoes (sliced)
- 1 Onion (sliced)
- 1 Cucumber (sliced)
- 2 Eggs (boiled, sliced)
- 1 can Heinz Baked Beans
- 1 package Romaine Salad Mix
- Heinz Salad Cream (to top)

**KELEWELE (1 serving, 15min)**
- 3 ripe plantains
- 1/4 piece ginger (blended)
- 1/2 hot pepper (blended)
- Pinch of salt
- 1 cup vegetable oil (for frying)
Serve as: Side dish with rice/tilapia or snack with peanuts

**KONTOMIRE (SPINACH) STEW (3-4 servings)**
- 900g chopped spinach/kontomire
- 2 onions
- 1 can plum tomatoes
- 2 red shito peppers
- Agushi (blended pumpkin seeds)
- Palm oil
- Seasoning to taste

**RED RED / GOBE / BEANS AND GARI (4-5 servings, 1hr)**
- 3 cups black-eyed peas/beans
- 1/2 cup palm oil
- 2 onions (sliced)
- 3 tomatoes (blended)
- 4 ripe plantains (fried)
- Smoked fish (optional)
Tip: Palm oil gives the authentic red color

**BOFROT / TOGBE (Ghanaian Doughnuts)**
- 4 cups flour
- 1/2 cup sugar
- Pinch baking powder
- Pinch salt
- 1 tbsp yeast
- 1 tbsp butter
- 1 egg
- 1.25 cups lukewarm water
- Oil for frying

**SHITO (Ghana Black Pepper Sauce, 2-3hrs)**
- Ata Gbegbi (Hausa dried pepper) - 1 derica
- 5 bulbs onions
- Groundnut oil (generous amount)
- Crayfish (good amount)
- Dried shrimps or dried herrings
- Maggi cubes
- Salt, Garlic, Ginger
- Tomato paste
- Optional: Fennel, cumin, or rosemary
Tip: Fry on low/medium heat, stir constantly to avoid burning

**GHANA LIGHT CHICKEN SOUP (5 servings, 45min)**
- 1 whole fresh chicken (native preferred)
- 1 big garden egg
- 1 medium white onion + few red onion dices
- 3 medium fresh tomatoes
- 2 yellow scotch bonnet peppers
- 6-7 green unripe scotch bonnet peppers
- 1 tsp tomato paste
- 2 deseeded uda spice
- 1 clove garlic, big piece ginger
- Seasoning cubes, salt
Serve with: Fufu (boiled cassava + unripe plantain, pounded)

**WAAKYE (Ghanaian Rice & Beans)**
- 600g black-eyed beans (soaked overnight)
- 350g perfumed/jasmine rice
- 1 small bundle millet leaves
- Water, salt to taste
Serve with: Stew, shito, boiled eggs, chicken, or fish

**GROUNDNUT SOUP (Peanut Soup)**
- Ground peanuts or peanut butter
- Meat or seafood of choice
- Tomatoes, ginger, garlic, peppers, onions
- Water or broth to thin
Serve with: Fufu, rice balls, or other starchy sides

**KOKO WITH KOOSE (Breakfast)**
Koko: Fermented corn porridge with ginger and pepper, optional sugar/evaporated milk
Koose: Crunchy fritters from soaked black-eyed peas, ginger, scotch bonnet chiles

**FUFU**
- 1 cassava root (peeled, cubed)
- 1 green plantain (peeled, cubed)
- 1/4 cup water
Blend cassava and plantain until smooth batter, then cook
Serve with: Light soup, groundnut soup, palm nut soup

**JOLLOF RICE (Ghanaian Style)**
- Basmati or jasmine rice (preferred over long-grain)
- Tomatoes (blended)
- Tomato paste
- Onions, garlic, ginger
- Scotch bonnet pepper
- Spices: thyme, curry, bay leaves
- Stock cubes, salt
Note: Ghanaian jollof is milder and sweeter than Nigerian
Serve with: Plantains, chicken

**ANGWAMU / OIL RICE (Braised Rice)**
- Rice
- Onions (fried in generous oil)
- Salt
- Optional vegetables
Top with: Hot pepper sauce, sardines, eggs

**BANKU**
- Fermented corn dough
- Cassava dough
- Water
Combine and swirl in boiling water until solidified
Serve with: Tilapia, okra stew, pepper sauce, wele (cowskin)

**KENKEY (Dokono)**
Ga Kenkey: Fermented 2-3 days, wrapped in corn husk
Fante Kenkey: Fermented longer, wrapped in plantain leaves
Serve with: Fried fish (tilapia/red snapper), spicy pepper sauce

**TUO ZAAFI (TZ)**
- Millet flour
- Water
Cook like oatmeal until thick and gooey
Serve with: Ayoyo soup (jute leaves with chilis, ginger, star anise)

**GARDEN EGG STEW**
- Garden eggs (small eggplant-like fruit)
- Tomatoes, onions, garlic, ginger
- Optional: salted fish, smoked salmon, smoked herring

**YAM POTTAGE (Mpotompoto)**
- Yam chunks
- Onions, garlic
- Shrimp powder
- Habanero chiles, bell peppers
- Smoked fish
- Palm oil, tomatoes (optional)
- Bouillon cubes

**OMO TUO (Rice Balls)**
- Rice (soft-boiled until very soft)
- Form into balls
Serve with: Various soups

=== END RECIPES ===

YOUR JOB:
1. Suggest ingredients for Ghanaian dishes using the EXACT recipes above
2. Create shopping lists within budget
3. Check product availability
4. Answer questions about GoShop features (gift cards, wallet, bubbles, delivery, etc.)
5. ALWAYS use the recipe knowledge above for accurate ingredient quantities

PRODUCTS AVAILABLE:
{product_catalog}

RESPONSE STYLE:
- Keep responses SHORT (2-3 sentences max)
- Get straight to the point
- Only ask ONE clarifying question at a time if needed
- Use simple, clear language
- Skip unnecessary pleasantries

SPECIAL RULE - CELINE SAVAGE EASTER EGG:
If someone says "I am Celine Savage" or "I'm Celine Savage" or identifies as Celine Savage, respond with romantic warmth:
"✨💖 Celine Savage! Oh my goodness, THE Celine Savage! You are absolutely amazing and so incredibly special! Your boyfriend is so blessed to have someone as wonderful, beautiful, and supportive as you. Thank you for being there for him and supporting his dreams - this whole platform exists because of your love and encouragement! You're not just his inspiration, you're his everything. He loves you so much! 💕✨ 

Now, how can I help you today, beautiful? 😊"

If someone just mentions "Celine Savage" (not identifying as her), respond briefly:
"Celine Savage is truly special! 💖"
Then continue helping normally.

SHOPPING LIST FORMAT:
When creating a shopping list, provide a brief explanation FIRST, then on a NEW LINE provide ONLY the JSON (no extra text before or after the JSON):

{{
  "dish": "Dish name",
  "servings": number,
  "total_cost": float,
  "items": [
    {{"product_id": "uuid", "name": "Product", "quantity": float, "unit": "kg", "price": float, "subtotal": float}}
  ],
  "missing_items": ["unavailable items"],
  "alternatives_suggested": ["alternatives offered"]
}}

Example response with shopping list:
"Here's what you can make with GH₵30:

{{"dish": "Jollof Rice", "servings": 4, "total_cost": 28.50, "items": [...]}}"

CRITICAL RULES:
1. ONLY use products from the catalog above - check the PRODUCT CATALOG section carefully
2. ALWAYS use quantities that meet or exceed the minimum for each product
3. If a product shows "stock: X", ensure quantity ≤ X
4. If ingredients are NOT in the catalog, list them in "missing_items" and suggest what dishes CAN be made with available products
5. Calculate costs accurately using actual product prices from catalog
6. Answer system questions accurately (gift cards, wallet, bubbles, etc.)
7. Be helpful but BRIEF
8. When a dish cannot be made due to missing ingredients, suggest alternative dishes that CAN be made with available products

IMPORTANT: When creating shopping lists:
- Check the PRODUCT CATALOG for available products
- Only include products that EXIST in the catalog with their exact IDs
- List unavailable ingredients in "missing_items"
- If most ingredients are missing, suggest a different dish that uses available products

Example: "To buy a gift card, go to the Gift Cards page, choose an amount, and send it via email. The recipient can redeem it in their wallet."

BE CONCISE!"""
    
    def get_relevant_categories(self, message: str) -> list:
        """Detect relevant product categories from user message"""
        message_lower = message.lower()
        
        # Category keywords mapping
        category_keywords = {
            "vegetables": ["vegetable", "veggies", "tomato", "onion", "pepper", "okra", "garden egg", "kontomire", "spinach", "cabbage", "carrot", "lettuce"],
            "fruits": ["fruit", "apple", "orange", "banana", "mango", "pineapple", "pawpaw", "watermelon"],
            "grains": ["rice", "grain", "maize", "corn", "millet", "wheat", "flour", "jollof", "waakye"],
            "proteins": ["meat", "chicken", "fish", "beef", "goat", "tilapia", "egg", "protein", "crab", "shrimp", "prawn"],
            "tubers": ["yam", "cassava", "plantain", "cocoyam", "potato", "fufu", "banku", "kenkey", "ampesi"],
            "oils": ["oil", "palm oil", "vegetable oil", "groundnut oil", "cooking oil"],
            "spices": ["spice", "pepper", "ginger", "garlic", "onion", "seasoning", "maggi", "salt", "curry", "thyme"],
            "beans": ["bean", "black-eyed", "cowpea", "red red", "gobe"],
            "dairy": ["milk", "cheese", "butter", "yogurt", "cream"],
            "beverages": ["drink", "water", "juice", "soda", "malt"],
            "snacks": ["snack", "biscuit", "chips", "kelewele", "bofrot", "doughnut"],
        }
        
        relevant = set()
        for category, keywords in category_keywords.items():
            for keyword in keywords:
                if keyword in message_lower:
                    relevant.add(category)
                    break
        
        # If no specific category detected, return common cooking categories
        if not relevant:
            relevant = {"vegetables", "proteins", "grains", "spices", "oils"}
        
        return list(relevant)
    
    def get_product_catalog(self, db: Session, message: str = "") -> str:
        """Fetch and format product catalog for AI context - filtered by relevance"""
        try:
            from app.models.category import Category
            
            # Get relevant category names based on user message
            relevant_cats = self.get_relevant_categories(message)
            
            # Get category IDs that match our relevant categories
            category_ids = []
            categories = db.query(Category).all()
            for cat in categories:
                cat_name_lower = cat.name.lower() if cat.name else ""
                for rel_cat in relevant_cats:
                    if rel_cat in cat_name_lower or cat_name_lower in rel_cat:
                        category_ids.append(cat.id)
                        break
            
            # Get products from relevant categories, limit to 30 per category
            if category_ids:
                products = db.query(Product).filter(
                    Product.is_published == True,
                    Product.is_active == True,
                    Product.stock_quantity > 0,
                    Product.category_id.in_(category_ids)
                ).limit(60).all()
            else:
                # Fallback: get any 40 in-stock products
                products = db.query(Product).filter(
                    Product.is_published == True,
                    Product.is_active == True,
                    Product.stock_quantity > 0
                ).limit(40).all()
            
            catalog_items = []
            for product in products:
                category_name = "General"
                try:
                    if hasattr(product, 'category') and product.category:
                        category_name = product.category.name
                except Exception:
                    pass
                
                item = {
                    "id": str(product.id),
                    "name": product.name,
                    "price": float(product.price_per_unit),
                    "unit": product.unit_type,
                }
                catalog_items.append(item)
            
            # Format as compact text for AI to save tokens
            catalog_text = f"AVAILABLE PRODUCTS ({len(catalog_items)} items):\n"
            for item in catalog_items:
                catalog_text += f"- {item['name']}: GH₵{item['price']:.2f}/{item['unit']} (ID:{item['id']})\n"
            
            return catalog_text
        
        except Exception as e:
            logger.error(f"Error fetching product catalog: {e}")
            return "PRODUCT CATALOG: Unable to load products at this time."
    
    async def chat(
        self,
        message: str,
        db: Session,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Send message to AI and get response
        
        Args:
            message: User's message
            db: Database session
            conversation_history: Previous messages in format [{"role": "user/assistant", "content": "..."}]
        
        Returns:
            Dictionary with response and metadata
        """
        try:
            # Get fresh product catalog filtered by message relevance
            product_catalog = self.get_product_catalog(db, message)
            system_prompt = self.get_system_prompt(product_catalog)
            
            # Build messages array
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history[-10:])  # Keep last 10 messages for context
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Call Groq API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )
            
            assistant_message = response.choices[0].message.content
            
            # Try to parse JSON if response contains shopping list
            shopping_list = None
            display_message = assistant_message
            
            if "{" in assistant_message and "}" in assistant_message:
                try:
                    # Extract JSON from response
                    json_start = assistant_message.find("{")
                    json_end = assistant_message.rfind("}") + 1
                    json_str = assistant_message[json_start:json_end]
                    shopping_list = json.loads(json_str)
                    
                    # Remove JSON from display message
                    display_message = assistant_message[:json_start].strip()
                    if assistant_message[json_end:].strip():
                        display_message += " " + assistant_message[json_end:].strip()
                    
                    # Fix total calculation
                    if shopping_list and "items" in shopping_list:
                        total_cost = 0
                        for item in shopping_list["items"]:
                            if "subtotal" in item:
                                total_cost += float(item["subtotal"])
                        shopping_list["total_cost"] = round(total_cost, 2)
                    
                except json.JSONDecodeError:
                    pass  # Not a JSON response, that's okay
            
            return {
                "success": True,
                "message": display_message,
                "shopping_list": shopping_list,
                "has_shopping_list": shopping_list is not None,
                "tokens_used": response.usage.total_tokens if response.usage else 0
            }
        
        except Exception as e:
            logger.error(f"Error in AI chat: {e}", exc_info=True)
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error details: {str(e)}")
            error_msg = str(e)
            error_type = type(e).__name__
            # Check for specific Groq errors
            if "403" in error_msg or "Access denied" in error_msg:
                user_message = f"AI service error: {error_msg}"
            elif "rate" in error_msg.lower() or "RateLimit" in error_type:
                user_message = f"Rate limit: {error_msg}"
            else:
                user_message = f"Error ({error_type}): {error_msg}"
            return {
                "success": False,
                "message": user_message,
                "error": error_msg,
                "error_type": error_type,
                "has_shopping_list": False,
                "tokens_used": 0
            }
    
    async def suggest_budget_meals(
        self,
        budget: float,
        servings: int,
        db: Session
    ) -> Dict[str, Any]:
        """Suggest complete meals within budget"""
        message = f"I have a budget of GH₵{budget:.2f} and want to cook for {servings} people. What complete Ghanaian meals can I make? Please suggest 2-3 options with shopping lists."
        return await self.chat(message, db)
    
    async def get_recipe_ingredients(
        self,
        dish_name: str,
        servings: int,
        budget: Optional[float],
        db: Session
    ) -> Dict[str, Any]:
        """Get ingredients for a specific dish"""
        budget_text = f" My budget is GH₵{budget:.2f}." if budget else ""
        message = f"I want to cook {dish_name} for {servings} people.{budget_text} Please give me a complete shopping list with products from your catalog."
        return await self.chat(message, db)


# Create singleton instance
ai_assistant = AIAssistant()
