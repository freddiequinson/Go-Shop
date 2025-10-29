"""
API endpoints for messaging system
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.message import ConversationType
from app.crud.message import conversation_crud, message_crud
from app.schemas.message import (
    ConversationCreate, ConversationResponse, ConversationUpdate,
    ConversationListResponse, MessageCreate, MessageResponse,
    MessageListResponse, ConversationParticipantCreate,
    MessageRead, UserMessagingStats, ConversationStats,
    GhanaMarketMessage, BubbleGroupMessage, OrderChatMessage
)

router = APIRouter()


# Conversation endpoints
@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    conversation_data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new conversation
    
    - **Direct conversations**: Between 2 users (buyer-seller)
    - **Bubble groups**: Multiple users in a social commerce bubble
    - **Order chats**: Conversation tied to specific order
    """
    
    # Validate conversation type and participants
    if conversation_data.type == ConversationType.DIRECT and len(conversation_data.participant_ids) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Direct conversations must have exactly 2 participants"
        )
    
    if current_user.id not in conversation_data.participant_ids:
        conversation_data.participant_ids.append(current_user.id)
    
    conversation = conversation_crud.create_conversation(
        db=db, 
        conversation_data=conversation_data, 
        creator_id=current_user.id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create conversation"
        )
    
    return conversation


@router.get("/conversations", response_model=ConversationListResponse)
def get_user_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    conversation_type: Optional[ConversationType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's conversations with pagination
    
    - Filter by conversation type (direct, bubble_group, order_chat)
    - Ordered by last message time
    - Includes unread message counts
    """
    
    conversations = conversation_crud.get_user_conversations(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        conversation_type=conversation_type
    )
    
    # Calculate unread counts for each conversation
    for conversation in conversations:
        participant = next(
            (p for p in conversation.participants if p.user_id == current_user.id), 
            None
        )
        conversation.unread_count = participant.unread_count if participant else 0
    
    total = len(conversations)  # In production, use a separate count query
    
    return ConversationListResponse(
        conversations=conversations,
        total=total,
        page=skip // limit + 1,
        per_page=limit,
        has_next=total > skip + limit,
        has_prev=skip > 0
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversation details"""
    
    conversation = conversation_crud.get_conversation(
        db=db, 
        conversation_id=conversation_id, 
        user_id=current_user.id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied"
        )
    
    return conversation


@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: str,
    update_data: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update conversation (admin/moderator only)"""
    
    conversation = conversation_crud.update_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        update_data=update_data
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied or conversation not found"
        )
    
    return conversation


@router.post("/conversations/{conversation_id}/participants")
def add_participant(
    conversation_id: str,
    participant_data: ConversationParticipantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add participant to conversation"""
    
    participant = conversation_crud.add_participant(
        db=db,
        conversation_id=conversation_id,
        adder_id=current_user.id,
        participant_data=participant_data
    )
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied or participant already exists"
        )
    
    return {"message": "Participant added successfully"}


@router.delete("/conversations/{conversation_id}/participants/{participant_id}")
def remove_participant(
    conversation_id: str,
    participant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove participant from conversation"""
    
    success = conversation_crud.remove_participant(
        db=db,
        conversation_id=conversation_id,
        remover_id=current_user.id,
        participant_id=participant_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied or participant not found"
        )
    
    return {"message": "Participant removed successfully"}


# Message endpoints
@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
def send_message(
    conversation_id: str,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send message to conversation
    
    - Supports text, images, files, location data
    - Ghana market context (local terms, market location)
    - Automatic notifications to participants
    """
    
    # Ensure conversation_id matches
    message_data.conversation_id = conversation_id
    
    message = message_crud.create_message(
        db=db,
        message_data=message_data,
        sender_id=current_user.id
    )
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot send message to this conversation"
        )
    
    return message


@router.get("/conversations/{conversation_id}/messages", response_model=MessageListResponse)
def get_conversation_messages(
    conversation_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages from conversation with pagination"""
    
    messages = message_crud.get_conversation_messages(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    if not messages and skip == 0:
        # Check if conversation exists and user has access
        conversation = conversation_crud.get_conversation(
            db=db, 
            conversation_id=conversation_id, 
            user_id=current_user.id
        )
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied"
            )
    
    total = len(messages)  # In production, use separate count query
    
    return MessageListResponse(
        messages=messages,
        total=total,
        page=skip // limit + 1,
        per_page=limit,
        has_next=total > skip + limit,
        has_prev=skip > 0
    )


@router.post("/messages/{message_id}/read")
def mark_message_as_read(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark message as read"""
    
    success = message_crud.mark_message_as_read(
        db=db,
        message_id=message_id,
        user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    return {"message": "Message marked as read"}


# Ghana market specific endpoints
@router.post("/conversations/{conversation_id}/ghana-market-message", response_model=MessageResponse)
def send_ghana_market_message(
    conversation_id: str,
    message_data: GhanaMarketMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send Ghana market specific message
    
    - Include market location, local language
    - Product and price mentions
    - Cultural context
    """
    
    # Convert to standard message format
    standard_message = MessageCreate(
        conversation_id=conversation_id,
        content=message_data.content,
        message_type=message_data.message_type,
        content_type=message_data.content_type,
        language=message_data.local_language or message_data.language,
        market_terms={
            "market_location": message_data.market_location,
            "product_mentioned": message_data.product_mentioned,
            "price_mentioned": message_data.price_mentioned,
            "currency": message_data.currency
        },
        location_data=message_data.location_data,
        attachments=message_data.attachments
    )
    
    message = message_crud.create_message(
        db=db,
        message_data=standard_message,
        sender_id=current_user.id
    )
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot send message to this conversation"
        )
    
    return message


@router.post("/conversations/{conversation_id}/bubble-message", response_model=MessageResponse)
def send_bubble_group_message(
    conversation_id: str,
    message_data: BubbleGroupMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send message to bubble group
    
    - Support @mentions
    - Announcements and priority levels
    - Group-specific features
    """
    
    # Convert to standard message format
    standard_message = MessageCreate(
        conversation_id=conversation_id,
        content=message_data.content,
        message_type=message_data.message_type,
        content_type=message_data.content_type,
        language=message_data.language,
        market_terms={
            "bubble_id": message_data.bubble_id,
            "mentions": message_data.mentions,
            "is_announcement": message_data.is_announcement,
            "priority": message_data.priority
        },
        location_data=message_data.location_data,
        attachments=message_data.attachments
    )
    
    message = message_crud.create_message(
        db=db,
        message_data=standard_message,
        sender_id=current_user.id
    )
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot send message to this conversation"
        )
    
    return message


# Statistics endpoints
@router.get("/stats/unread-count")
def get_unread_messages_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get total unread messages count for user"""
    
    unread_count = message_crud.get_unread_messages_count(
        db=db, 
        user_id=current_user.id
    )
    
    return {"unread_count": unread_count}


@router.get("/stats/user", response_model=UserMessagingStats)
def get_user_messaging_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's messaging statistics"""
    
    # This would be implemented with more complex queries
    # For now, return basic stats
    return UserMessagingStats(
        total_conversations=0,
        active_conversations=0,
        total_messages_sent=0,
        total_messages_received=0,
        unread_messages=message_crud.get_unread_messages_count(db, current_user.id),
        avg_response_time_minutes=None,
        most_contacted_users=[]
    )


@router.get("/conversations/{conversation_id}/stats", response_model=ConversationStats)
def get_conversation_stats(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversation statistics"""
    
    # Verify access to conversation
    conversation = conversation_crud.get_conversation(
        db=db, 
        conversation_id=conversation_id, 
        user_id=current_user.id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied"
        )
    
    # Return basic stats (implement detailed queries as needed)
    return ConversationStats(
        total_messages=0,
        total_participants=len(conversation.participants),
        active_participants=len([p for p in conversation.participants if p.is_active]),
        messages_today=0,
        messages_this_week=0,
        most_active_user=None,
        avg_response_time_minutes=None
    )
