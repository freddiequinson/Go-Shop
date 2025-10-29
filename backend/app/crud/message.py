"""
CRUD operations for messaging system
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func, case

from app.models.message import (
    Conversation, ConversationParticipant, Message, 
    MessageRead, MessageNotification, ConversationType, MessageStatus
)
from app.models.user import User
from app.schemas.message import (
    ConversationCreate, ConversationUpdate, MessageCreate, 
    ConversationParticipantCreate, MessageRead as MessageReadSchema
)


class ConversationCRUD:
    """CRUD operations for conversations"""
    
    def create_conversation(
        self, 
        db: Session, 
        conversation_data: ConversationCreate, 
        creator_id: str
    ) -> Conversation:
        """Create a new conversation with participants"""
        
        # Create conversation
        conversation = Conversation(
            type=conversation_data.type,
            title=conversation_data.title,
            description=conversation_data.description,
            bubble_id=conversation_data.bubble_id,
            order_id=conversation_data.order_id,
            product_id=conversation_data.product_id,
            language_preference=conversation_data.language_preference,
            market_context=conversation_data.market_context
        )
        
        db.add(conversation)
        db.flush()  # Get the ID
        
        # Add participants
        participants = []
        for i, user_id in enumerate(conversation_data.participant_ids):
            # Creator gets admin role
            role = "admin" if user_id == creator_id else "member"
            can_add_members = user_id == creator_id
            
            participant = ConversationParticipant(
                conversation_id=conversation.id,
                user_id=user_id,
                role=role,
                can_add_members=can_add_members
            )
            participants.append(participant)
            db.add(participant)
        
        db.commit()
        db.refresh(conversation)
        
        return conversation
    
    def get_conversation(self, db: Session, conversation_id: str, user_id: str) -> Optional[Conversation]:
        """Get conversation if user is a participant"""
        return db.query(Conversation).join(ConversationParticipant).filter(
            and_(
                Conversation.id == conversation_id,
                ConversationParticipant.user_id == user_id,
                ConversationParticipant.is_active == True
            )
        ).options(
            joinedload(Conversation.participants).joinedload(ConversationParticipant.user)
        ).first()
    
    def get_user_conversations(
        self, 
        db: Session, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 20,
        conversation_type: Optional[ConversationType] = None
    ) -> List[Conversation]:
        """Get user's conversations with pagination"""
        
        query = db.query(Conversation).join(ConversationParticipant).filter(
            and_(
                ConversationParticipant.user_id == user_id,
                ConversationParticipant.is_active == True,
                Conversation.is_active == True
            )
        )
        
        if conversation_type:
            query = query.filter(Conversation.type == conversation_type)
        
        return query.options(
            joinedload(Conversation.participants).joinedload(ConversationParticipant.user)
        ).order_by(desc(Conversation.last_message_at)).offset(skip).limit(limit).all()
    
    def update_conversation(
        self, 
        db: Session, 
        conversation_id: str, 
        user_id: str, 
        update_data: ConversationUpdate
    ) -> Optional[Conversation]:
        """Update conversation (only admins can update)"""
        
        # Check if user is admin of conversation
        participant = db.query(ConversationParticipant).filter(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
                ConversationParticipant.role.in_(["admin", "moderator"]),
                ConversationParticipant.is_active == True
            )
        ).first()
        
        if not participant:
            return None
        
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            return None
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(conversation, field, value)
        
        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conversation)
        
        return conversation
    
    def add_participant(
        self, 
        db: Session, 
        conversation_id: str, 
        adder_id: str, 
        participant_data: ConversationParticipantCreate
    ) -> Optional[ConversationParticipant]:
        """Add participant to conversation"""
        
        # Check if adder has permission
        adder_participant = db.query(ConversationParticipant).filter(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == adder_id,
                ConversationParticipant.can_add_members == True,
                ConversationParticipant.is_active == True
            )
        ).first()
        
        if not adder_participant:
            return None
        
        # Check if user is already a participant
        existing = db.query(ConversationParticipant).filter(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == participant_data.user_id
            )
        ).first()
        
        if existing:
            if not existing.is_active:
                # Reactivate existing participant
                existing.is_active = True
                existing.joined_at = datetime.utcnow()
                db.commit()
                return existing
            return None  # Already active participant
        
        # Create new participant
        participant = ConversationParticipant(
            conversation_id=conversation_id,
            user_id=participant_data.user_id,
            role=participant_data.role,
            can_send_messages=participant_data.can_send_messages,
            can_add_members=participant_data.can_add_members,
            can_remove_members=participant_data.can_remove_members
        )
        
        db.add(participant)
        db.commit()
        db.refresh(participant)
        
        return participant
    
    def remove_participant(
        self, 
        db: Session, 
        conversation_id: str, 
        remover_id: str, 
        participant_id: str
    ) -> bool:
        """Remove participant from conversation"""
        
        # Check if remover has permission or is removing themselves
        if remover_id != participant_id:
            remover_participant = db.query(ConversationParticipant).filter(
                and_(
                    ConversationParticipant.conversation_id == conversation_id,
                    ConversationParticipant.user_id == remover_id,
                    ConversationParticipant.can_remove_members == True,
                    ConversationParticipant.is_active == True
                )
            ).first()
            
            if not remover_participant:
                return False
        
        # Remove participant
        participant = db.query(ConversationParticipant).filter(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == participant_id,
                ConversationParticipant.is_active == True
            )
        ).first()
        
        if participant:
            participant.is_active = False
            participant.left_at = datetime.utcnow()
            db.commit()
            return True
        
        return False


class MessageCRUD:
    """CRUD operations for messages"""
    
    def create_message(
        self, 
        db: Session, 
        message_data: MessageCreate, 
        sender_id: str
    ) -> Optional[Message]:
        """Create a new message"""
        
        # Check if sender can send messages in this conversation
        participant = db.query(ConversationParticipant).filter(
            and_(
                ConversationParticipant.conversation_id == message_data.conversation_id,
                ConversationParticipant.user_id == sender_id,
                ConversationParticipant.can_send_messages == True,
                ConversationParticipant.is_active == True
            )
        ).first()
        
        if not participant:
            return None
        
        # Create message
        message = Message(
            conversation_id=message_data.conversation_id,
            sender_id=sender_id,
            message_type=message_data.message_type,
            content=message_data.content,
            content_type=message_data.content_type,
            reply_to_id=message_data.reply_to_id,
            language=message_data.language,
            market_terms=message_data.market_terms,
            location_data=message_data.location_data,
            attachments=message_data.attachments
        )
        
        db.add(message)
        
        # Update conversation last_message_at
        conversation = db.query(Conversation).filter(
            Conversation.id == message_data.conversation_id
        ).first()
        if conversation:
            conversation.last_message_at = datetime.utcnow()
        
        db.commit()
        db.refresh(message)
        
        # Create notifications for other participants
        self._create_message_notifications(db, message)
        
        return message
    
    def get_conversation_messages(
        self, 
        db: Session, 
        conversation_id: str, 
        user_id: str,
        skip: int = 0, 
        limit: int = 50
    ) -> List[Message]:
        """Get messages from a conversation"""
        
        # Check if user is participant
        participant = db.query(ConversationParticipant).filter(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
                ConversationParticipant.is_active == True
            )
        ).first()
        
        if not participant:
            return []
        
        return db.query(Message).filter(
            and_(
                Message.conversation_id == conversation_id,
                Message.is_deleted == False
            )
        ).options(
            joinedload(Message.sender)
        ).order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
    
    def mark_message_as_read(
        self, 
        db: Session, 
        message_id: str, 
        user_id: str
    ) -> bool:
        """Mark message as read by user"""
        
        # Check if read record exists
        existing_read = db.query(MessageRead).filter(
            and_(
                MessageRead.message_id == message_id,
                MessageRead.user_id == user_id
            )
        ).first()
        
        if existing_read:
            return True  # Already marked as read
        
        # Create read record
        message_read = MessageRead(
            message_id=message_id,
            user_id=user_id,
            read_at=datetime.utcnow()
        )
        
        db.add(message_read)
        
        # Update message read count
        message = db.query(Message).filter(Message.id == message_id).first()
        if message:
            message.read_count += 1
        
        # Update participant unread count
        # First get the message to find its conversation_id
        if message:
            participant = db.query(ConversationParticipant).filter(
                and_(
                    ConversationParticipant.user_id == user_id,
                    ConversationParticipant.conversation_id == message.conversation_id
                )
            ).first()
            
            if participant and participant.unread_count > 0:
                participant.unread_count -= 1
                participant.last_read_at = datetime.utcnow()
        
        db.commit()
        return True
    
    def get_unread_messages_count(self, db: Session, user_id: str) -> int:
        """Get total unread messages count for user"""
        
        return db.query(func.sum(ConversationParticipant.unread_count)).filter(
            and_(
                ConversationParticipant.user_id == user_id,
                ConversationParticipant.is_active == True
            )
        ).scalar() or 0
    
    def _create_message_notifications(self, db: Session, message: Message):
        """Create notifications for message recipients"""
        
        # Get all participants except sender
        participants = db.query(ConversationParticipant).filter(
            and_(
                ConversationParticipant.conversation_id == message.conversation_id,
                ConversationParticipant.user_id != message.sender_id,
                ConversationParticipant.is_active == True
            )
        ).all()
        
        for participant in participants:
            # Increment unread count
            participant.unread_count += 1
            
            # Create notification
            notification = MessageNotification(
                user_id=participant.user_id,
                message_id=message.id,
                conversation_id=message.conversation_id,
                notification_type="message",
                title=f"New message from {message.sender.full_name}",
                body=message.content[:100] + "..." if len(message.content) > 100 else message.content
            )
            db.add(notification)
        
        db.commit()


# Create instances
conversation_crud = ConversationCRUD()
message_crud = MessageCRUD()
