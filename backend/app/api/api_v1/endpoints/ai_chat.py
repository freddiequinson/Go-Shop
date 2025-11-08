"""
AI Chat endpoints for recipe suggestions and shopping assistance
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.ai_assistant import ai_assistant
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models
class ChatMessage(BaseModel):
    """Single chat message"""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Chat request from user"""
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class ShoppingListItem(BaseModel):
    """Item in shopping list"""
    product_id: str
    name: str
    quantity: float
    unit: str
    price: float
    subtotal: float


class ShoppingList(BaseModel):
    """Complete shopping list"""
    dish: str
    servings: int
    total_cost: float
    items: List[ShoppingListItem]
    missing_items: Optional[List[str]] = []
    alternatives_suggested: Optional[List[str]] = []
    cooking_tips: Optional[str] = None


class ChatResponse(BaseModel):
    """Response from AI"""
    success: bool
    message: str
    shopping_list: Optional[ShoppingList] = None
    has_shopping_list: bool = False
    tokens_used: Optional[int] = 0


class BudgetMealRequest(BaseModel):
    """Request for budget meal suggestions"""
    budget: float
    servings: int = 4


class RecipeRequest(BaseModel):
    """Request for recipe ingredients"""
    dish_name: str
    servings: int = 4
    budget: Optional[float] = None


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Chat with AI assistant about recipes and shopping
    
    - **message**: User's message
    - **conversation_history**: Previous messages for context
    """
    try:
        # Convert conversation history to dict format
        history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]
        
        # Get AI response
        response = await ai_assistant.chat(
            message=request.message,
            db=db,
            conversation_history=history
        )
        
        return response
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request"
        )


@router.post("/suggest-budget-meals", response_model=ChatResponse)
async def suggest_budget_meals(
    request: BudgetMealRequest,
    db: Session = Depends(get_db)
):
    """
    Get meal suggestions within a budget
    
    - **budget**: Maximum budget in GH₵
    - **servings**: Number of people to serve
    """
    try:
        response = await ai_assistant.suggest_budget_meals(
            budget=request.budget,
            servings=request.servings,
            db=db
        )
        
        return response
    
    except Exception as e:
        logger.error(f"Error in budget meals endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get budget meal suggestions"
        )


@router.post("/recipe-ingredients", response_model=ChatResponse)
async def get_recipe_ingredients(
    request: RecipeRequest,
    db: Session = Depends(get_db)
):
    """
    Get ingredients for a specific recipe
    
    - **dish_name**: Name of the dish (e.g., "Jollof Rice")
    - **servings**: Number of people to serve
    - **budget**: Optional budget constraint
    """
    try:
        response = await ai_assistant.get_recipe_ingredients(
            dish_name=request.dish_name,
            servings=request.servings,
            budget=request.budget,
            db=db
        )
        
        return response
    
    except Exception as e:
        logger.error(f"Error in recipe ingredients endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recipe ingredients"
        )


@router.get("/quick-actions")
async def get_quick_actions():
    """
    Get suggested quick action prompts for users
    """
    return {
        "actions": [
            {
                "id": "budget_meal",
                "text": "Show me budget meals under GH₵50",
                "icon": "💰",
                "prompt": "I have a budget of GH₵50. What meals can I cook for 4 people?"
            },
            {
                "id": "jollof",
                "text": "I want to cook Jollof Rice",
                "icon": "🍚",
                "prompt": "I want to cook Jollof Rice for 6 people. Give me a shopping list."
            },
            {
                "id": "soup",
                "text": "Suggest a soup recipe",
                "icon": "🥣",
                "prompt": "Suggest a Ghanaian soup I can make with ingredients from your store."
            },
            {
                "id": "delivery",
                "text": "Tell me about delivery",
                "icon": "🚚",
                "prompt": "How does your delivery work? How long does it take?"
            },
            {
                "id": "weekly_shopping",
                "text": "Plan my weekly shopping",
                "icon": "📋",
                "prompt": "Help me plan a week's worth of meals for a family of 4 with a budget of GH₵300."
            }
        ]
    }


@router.get("/health")
async def health_check():
    """Check if AI service is available"""
    try:
        # Simple check to see if Groq API key is configured
        if not ai_assistant.client:
            return {"status": "unavailable", "message": "AI service not configured"}
        
        return {"status": "healthy", "message": "AI assistant is ready"}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}
