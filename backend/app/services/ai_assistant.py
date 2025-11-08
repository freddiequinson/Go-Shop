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

YOUR JOB:
1. Suggest ingredients for Ghanaian dishes (Jollof, Waakye, Banku, Fufu, soups, etc.)
2. Create shopping lists within budget
3. Check product availability
4. Answer questions about GoShop features (gift cards, wallet, bubbles, delivery, etc.)

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

SHOPPING LIST FORMAT (use JSON):
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

CRITICAL RULES:
1. ONLY use products from the catalog above
2. ALWAYS use quantities that meet or exceed the minimum for each product
3. If a product shows "stock: X", ensure quantity ≤ X
4. If out of stock, suggest alternatives briefly
5. Calculate costs accurately
6. Answer system questions accurately (gift cards, wallet, bubbles, etc.)
7. Be helpful but BRIEF

IMPORTANT: When creating shopping lists, check the product catalog for minimum quantities and stock levels. Never suggest quantities below the minimum!

Example: "To buy a gift card, go to the Gift Cards page, choose an amount, and send it via email. The recipient can redeem it in their wallet."

BE CONCISE!"""
    
    def get_product_catalog(self, db: Session) -> str:
        """Fetch and format product catalog for AI context"""
        try:
            # Get all published products that are in stock
            products = db.query(Product).filter(
                Product.is_published == True,
                Product.is_active == True
            ).all()
            
            catalog_items = []
            for product in products:
                # Get category name safely
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
                    "stock": product.stock_quantity,
                    "in_stock": product.stock_quantity > 0,
                    "category": category_name,
                    "min_qty": float(product.minimum_quantity) if product.minimum_quantity else 1.0
                }
                catalog_items.append(item)
            
            # Format as readable text for AI
            catalog_text = "PRODUCT CATALOG:\n"
            for item in catalog_items:
                stock_status = "✓ IN STOCK" if item["in_stock"] else "✗ OUT OF STOCK"
                catalog_text += f"- {item['name']}: GH₵{item['price']:.2f} per {item['unit']} [MIN: {item['min_qty']}{item['unit']}] [{stock_status}] (ID: {item['id']})\n"
            
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
            # Get fresh product catalog
            product_catalog = self.get_product_catalog(db)
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
            if "{" in assistant_message and "}" in assistant_message:
                try:
                    # Extract JSON from response
                    json_start = assistant_message.find("{")
                    json_end = assistant_message.rfind("}") + 1
                    json_str = assistant_message[json_start:json_end]
                    shopping_list = json.loads(json_str)
                except json.JSONDecodeError:
                    pass  # Not a JSON response, that's okay
            
            return {
                "success": True,
                "message": assistant_message,
                "shopping_list": shopping_list,
                "has_shopping_list": shopping_list is not None,
                "tokens_used": response.usage.total_tokens if response.usage else 0
            }
        
        except Exception as e:
            logger.error(f"Error in AI chat: {e}", exc_info=True)
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error details: {str(e)}")
            return {
                "success": False,
                "message": "Sorry, I'm having trouble right now. Please try again in a moment! 🙏",
                "error": str(e),
                "has_shopping_list": False
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
