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

**GHANA JOLLOF RICE**
Ingredients: Rice, Vegetable Oil, Fresh tomatoes, Tomato paste, Thyme, Scotch bonnet pepper/kpakposhito, Onion, Green bell pepper, Bayleaf, Salt, Protein of choice (Eggs, salted beef, chicken, mutton or herrings), Stock, Water.

**GHANA WAAKYE (Rice & Beans)**
Ingredients: Rice, Black-eyed beans or red beans, Dry sorghum leaves, Salt to taste, Onion, Coconut oil (optional), Bay-leaves for flavor (optional), Gari, Spaghetti, Eggs, Fish, Wele, Shito (spicy Ghanaian pepper sauce), Vegetables (tomatoes, onions, cabbage, lettuce for optional salad side).

**WAAKYE STEW / ZONGO STEW**
Ingredients: Beef or Mutton, Vegetable oil, Fresh tomato, Tomato paste, Scotch bonnet Pepper, Onions, Ginger, Garlic, Coriander seeds, Bay-leaves, Curry powder, Stock cube, Salt, Thyme, Rosemary, Cow skin (Wele).

**KONTOMIRE (Palava Sauce)**
Ingredients: Kontomire leaves or Potato Leaves, Palm oil or Vegetable oil, Onion, Tomatoes, Scotch bonnet pepper, Kpakposhito, Agushie (Melon seeds), Salt, Eggs, Wele, Tuna, Salmon, Momoni (optional), Crabs (optional), Beef (optional), Stock cube.
Serve with: Rice, yam, cocoyam, plantains or banku.

**GHANAIAN EGG STEW**
Ingredients: Palm oil or vegetable oil, Fresh tomato, Tomato paste, Scotch bonnet, Kpakposhito, Onion, Stock cube, Agushie (optional), Momoni (optional), Wele (optional), Beef, Salmon, Bell peppers, Rosemary, Bay-leaf, Thyme.

**TRADITIONAL GHANAIAN LIGHT SOUP**
Ingredients: Tomatoes, Tomato paste, Scotch bonnet pepper, Onion, Garden eggs, Ginger, Garlic, Stock cube, Kpakposhito for flavor and colour, Protein of choice (chicken, beef, mutton, dry-fish, smoked fish).

**TRADITIONAL PALM NUT SOUP**
Ingredients: Palm nut paste, Tomatoes, Tomato paste, Scotch bonnet pepper, Kpakposhito, Ginger, Garlic, Onion, Stock cube, Garden eggs, Prekese (optional), Protein of choice (Wele, beef, mutton, dry fish, smoked salmon, crabs).

**TRADITIONAL GROUNDNUT SOUP**
Ingredients: Groundnut paste, Tomato paste, Scotch bonnet pepper, Onion, Fresh tomato, Garden eggs, Protein of choice (chicken, beef, mutton, smoked salmon, dry fish, tuna, crabs optional).

**GARDEN EGG STEW**
Ingredients: Palm oil or vegetable oil, Fresh tomatoes, Scotch bonnet pepper, Kpakposhito, Onion, Momoni (optional), Stock cube, Protein options (boiled eggs, Wele, salmon, smoked fish).

**CLASSIC GHANAIAN VEGETABLE STEW**
Ingredients: Vegetable oil, Fresh Tomatoes, Tomato paste, Scotch bonnet pepper, Kpakposhito, Bell peppers, Carrot, Green beans, Cabbage, Ginger, Garlic, Stock cube, Protein of choice (eggs, fish, chicken, beef, salmon).

**GHANAIAN GARI FOTOR**
Ingredients: Gari, Vegetable oil, Ripe tomatoes, Tomato paste, Onion, Ginger, Garlic, Scotch bonnet pepper, Kpakposhito, Spring onion, Carrot, Bell peppers, Protein of choice (boiled or fried eggs, smoked fish, chicken, beef, mutton).

**GHANAIAN BRAISED RICE (Angwamo)**
Ingredients: Rice, Vegetable or coconut oil, Onion, Rosemary, Toolo-beef, Salt, Protein of choice (fried or boiled eggs, sardine, canned beef), Vegetables (optional), Avocado (optional).

**MPOTOMPOTO (Yam or Cocoyam Porridge)**
Ingredients: Yam or Cocoyam, Palm oil, Onion, Momoni, Tomatoes, Scotch bonnet pepper, Kpakposhito, Salt, Dry fish (herrings), Smoked fish (salmon), Toolo-beef, Stock cube, Salt.

**GHANAIAN SHITO (Black Pepper Sauce)**
Ingredients: Vegetable oil, Dried shrimps, Dried herrings, Powdered pepper/scotch bonnet, Onion, Ginger, Garlic, Aniseed, Rosemary, Stock cube, Salt, Fried beef (optional).

**GREEN CHILI SAUCE**
Ingredients: Ginger, Garlic, Onion, Vegetable oil, Salt, Stock cube.

**GHANAIAN FISH STEW (4-6 servings, 1hr 30min)**
Fish: 1 whole fish (10-12 inches)
Marinade: 1 tsp salt, 1.5 tsp fenugreek/fennel/turmeric, 4 green cardamom
Sauce: 10 tomatoes, 2-3 onions, 6 garlic cloves, 1-2 scotch bonnet peppers, 1 inch ginger
Spices: 1/2 nutmeg, 1 star anise, 1 tsp rosemary, 1/4 tsp red pepper seeds, 2-3 tsp salt, 2 maggi cubes, 1 tsp black pepper, 2 tsp fennel/fenugreek/coriander, 3 bay leaves, 1 tsp 5 spice
Other: 3 tbsp sesame oil, 1 package tomato paste, 2 cups water
Serve with: 2 cups rice, 1.5 cups beans

**GHANA SALAD (12 servings, 20min)**
Ingredients: 2 Tomatoes (sliced), 1 Onion (sliced), 1 Cucumber (sliced), 2 Eggs (boiled, sliced), 1 can Heinz Baked Beans, 1 package Romaine Salad Mix, Heinz Salad Cream (to top).

**KELEWELE (1 serving, 15min)**
Ingredients: 3 ripe plantains, 1/4 piece ginger (blended), 1/2 hot pepper (blended), Pinch of salt, 1 cup vegetable oil (for frying).
Serve as: Side dish with rice/tilapia or snack with peanuts.

**RED RED / GOBE / BEANS AND GARI (4-5 servings, 1hr)**
Ingredients: 3 cups black-eyed peas/beans, 1/2 cup palm oil, 2 onions (sliced), 3 tomatoes (blended), 4 ripe plantains (fried), Smoked fish (optional).
Tip: Palm oil gives the authentic red color.

**BOFROT / TOGBE (Ghanaian Doughnuts)**
Ingredients: 4 cups flour, 1/2 cup sugar, Pinch baking powder, Pinch salt, 1 tbsp yeast, 1 tbsp butter, 1 egg, 1.25 cups lukewarm water, Oil for frying.

**KOKO WITH KOOSE (Breakfast)**
Koko: Fermented corn porridge with ginger and pepper, optional sugar/evaporated milk.
Koose: Crunchy fritters from soaked black-eyed peas, ginger, scotch bonnet chiles.

**FUFU**
Ingredients: 1 cassava root (peeled, cubed), 1 green plantain (peeled, cubed), 1/4 cup water.
Blend cassava and plantain until smooth batter, then cook.
Serve with: Light soup, groundnut soup, palm nut soup.

**BANKU**
Ingredients: Fermented corn dough, Cassava dough, Water.
Combine and swirl in boiling water until solidified.
Serve with: Tilapia, okra stew, pepper sauce, wele (cowskin).

**KENKEY (Dokono)**
Ga Kenkey: Fermented 2-3 days, wrapped in corn husk.
Fante Kenkey: Fermented longer, wrapped in plantain leaves.
Serve with: Fried fish (tilapia/red snapper), spicy pepper sauce.

**TUO ZAAFI (TZ)**
Ingredients: Millet flour, Water.
Cook like oatmeal until thick and gooey.
Serve with: Ayoyo soup (jute leaves with chilis, ginger, star anise).

**OMO TUO (Rice Balls)**
Ingredients: Rice (soft-boiled until very soft).
Form into balls.
Serve with: Various soups.

=== END RECIPES ===

YOUR JOB:
1. ONLY recommend products that are EXACTLY listed in the PRODUCT CATALOG below
2. When user asks for a product (e.g., "rice"), show them the EXACT products we have with their actual names, sizes, and prices
3. Create shopping lists using ONLY products from our catalog
4. If we don't have a product, say "We don't have [item] in stock" and suggest alternatives from our catalog
5. Answer questions about GoShop features (gift cards, wallet, bubbles, delivery, etc.)

**CRITICAL: PRODUCT CATALOG - ONLY RECOMMEND THESE EXACT PRODUCTS:**
{product_catalog}

RESPONSE STYLE:
- Keep responses SHORT (2-3 sentences max)
- Get straight to the point
- When showing products, use the EXACT name and price from the catalog
- Only ask ONE clarifying question at a time if needed
- Use simple, clear language

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

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. **NEVER invent products** - ONLY recommend products with EXACT names from the PRODUCT CATALOG above
2. **Use exact product names** - If catalog says "Premium Rice 65kg Bag", say that exact name, NOT "Rice 1kg"
3. **Use exact prices** - Only quote prices shown in the catalog
4. **If product not in catalog, say so** - "We don't currently stock [item]. Here's what we have: [list similar items from catalog]"
5. **For recipes** - List ingredients, then show which ones we have in stock from the catalog
6. **Never make up quantities** - Use the unit sizes shown in the catalog (e.g., if we sell 65kg bags, don't suggest 1kg)

WHEN USER ASKS FOR A PRODUCT:
- Search the PRODUCT CATALOG above for matching items
- Show the EXACT product name, size, and price from catalog
- If no match, say "We don't have [item]" and suggest similar products FROM THE CATALOG

Example good response for "do you have rice?":
"Yes! We have Premium Rice 65kg Bag at GH₵600. Would you like to add it to your cart?"

Example bad response (NEVER DO THIS):
"We have Rice 1kg at GH₵10" (if this product doesn't exist in catalog)

BE CONCISE!"""
    
    def get_product_catalog(self, db: Session, message: str = "") -> str:
        """Fetch and format product catalog for AI context - limited to avoid token limits"""
        try:
            # Simple approach: Get 50 in-stock products, prioritize by name matching message keywords
            message_lower = message.lower()
            
            # Get all in-stock products
            all_products = db.query(Product).filter(
                Product.is_published == True,
                Product.is_active == True,
                Product.stock_quantity > 0
            ).all()
            
            # Score products by relevance to message
            scored_products = []
            for product in all_products:
                score = 0
                product_name_lower = product.name.lower() if product.name else ""
                
                # Check if product name appears in message or vice versa
                for word in message_lower.split():
                    if len(word) > 2 and word in product_name_lower:
                        score += 10
                for word in product_name_lower.split():
                    if len(word) > 2 and word in message_lower:
                        score += 5
                
                scored_products.append((score, product))
            
            # Sort by score (highest first) and take top 50
            scored_products.sort(key=lambda x: x[0], reverse=True)
            products = [p for _, p in scored_products[:50]]
            
            catalog_items = []
            for product in products:
                item = {
                    "id": str(product.id),
                    "name": product.name,
                    "price": float(product.price_per_unit),
                    "unit": product.unit_type,
                }
                catalog_items.append(item)
            
            # Format as compact text for AI to save tokens
            if catalog_items:
                catalog_text = f"AVAILABLE PRODUCTS ({len(catalog_items)} items):\n"
                for item in catalog_items:
                    catalog_text += f"- {item['name']}: GH₵{item['price']:.2f}/{item['unit']} (ID:{item['id']})\n"
            else:
                catalog_text = "PRODUCTS: No products currently in stock."
            
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
