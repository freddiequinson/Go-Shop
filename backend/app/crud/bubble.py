"""
Bubble CRUD operations for GoShopGhana
Social commerce group management with Ghana market focus
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_, func
from datetime import datetime, timedelta

from app.models.bubble import (
    Bubble, BubbleMember, BubbleInvitation, BubbleActivity,
    BubbleType, BubbleStatus, MemberRole, MemberStatus
)
from app.schemas.bubble import (
    BubbleCreate, BubbleUpdate, BubbleMemberInvite, 
    BubbleMemberUpdate, BubbleSearchRequest
)


# Bubble CRUD operations
def create_bubble(db: Session, bubble_data: BubbleCreate, owner_id: str) -> Bubble:
    """Create a new bubble"""
    # Convert primary_products list to JSON string if provided
    primary_products_json = None
    if bubble_data.primary_products:
        import json
        primary_products_json = json.dumps(bubble_data.primary_products)
    
    # Convert fund transfer amounts to cedis
    min_fund_cedis = int(bubble_data.min_fund_transfer * 100)
    max_fund_cedis = int(bubble_data.max_fund_transfer * 100)
    
    bubble = Bubble(
        name=bubble_data.name,
        description=bubble_data.description,
        bubble_type=bubble_data.bubble_type,
        location=bubble_data.location,
        region=bubble_data.region,
        primary_products=primary_products_json,
        is_public=bubble_data.is_public,
        requires_approval=bubble_data.requires_approval,
        max_members=bubble_data.max_members,
        fund_transfer_enabled=bubble_data.fund_transfer_enabled,
        min_fund_transfer=min_fund_cedis,
        max_fund_transfer=max_fund_cedis,
        owner_id=owner_id,
        created_by_id=owner_id,
        member_count=1  # Owner is automatically a member
    )
    
    db.add(bubble)
    db.flush()  # Get the bubble ID
    
    # Add owner as first member
    owner_member = BubbleMember(
        bubble_id=bubble.id,
        user_id=owner_id,
        role=MemberRole.OWNER,
        status=MemberStatus.ACTIVE,
        can_invite=True,
        can_post=True,
        can_transfer_funds=bubble_data.fund_transfer_enabled,
        approved_at=datetime.utcnow()
    )
    
    db.add(owner_member)
    
    # Log activity
    activity = BubbleActivity(
        bubble_id=bubble.id,
        user_id=owner_id,
        activity_type="created_bubble",
        description=f"Created bubble '{bubble.name}'"
    )
    
    db.add(activity)
    db.commit()
    db.refresh(bubble)
    
    return bubble


def get_bubble_by_id(db: Session, bubble_id: str) -> Optional[Bubble]:
    """Get bubble by ID"""
    return db.query(Bubble).filter(Bubble.id == bubble_id).first()


def get_bubbles(
    db: Session, 
    skip: int = 0, 
    limit: int = 20,
    search: Optional[BubbleSearchRequest] = None
) -> List[Bubble]:
    """Get bubbles with optional filtering"""
    query = db.query(Bubble).filter(Bubble.status == BubbleStatus.ACTIVE)
    
    if search:
        if search.query:
            query = query.filter(
                or_(
                    Bubble.name.ilike(f"%{search.query}%"),
                    Bubble.description.ilike(f"%{search.query}%")
                )
            )
        
        if search.bubble_type:
            query = query.filter(Bubble.bubble_type == search.bubble_type)
        
        if search.location:
            query = query.filter(Bubble.location.ilike(f"%{search.location}%"))
        
        if search.region:
            query = query.filter(Bubble.region.ilike(f"%{search.region}%"))
        
        if search.is_public is not None:
            query = query.filter(Bubble.is_public == search.is_public)
        
        if search.has_fund_transfer is not None:
            query = query.filter(Bubble.fund_transfer_enabled == search.has_fund_transfer)
        
        if search.min_members is not None:
            query = query.filter(Bubble.member_count >= search.min_members)
        
        if search.max_members is not None:
            query = query.filter(Bubble.member_count <= search.max_members)
    
    return query.order_by(desc(Bubble.created_at)).offset(skip).limit(limit).all()


def update_bubble(db: Session, bubble_id: str, bubble_data: BubbleUpdate, user_id: str) -> Optional[Bubble]:
    """Update bubble (only by owner/admin)"""
    bubble = get_bubble_by_id(db, bubble_id)
    if not bubble:
        return None
    
    # Check if user has permission to update
    member = get_bubble_member(db, bubble_id, user_id)
    if not member or not member.is_admin_or_owner:
        raise ValueError("Only bubble owners and admins can update bubble settings")
    
    # Update fields
    update_data = bubble_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "primary_products" and value is not None:
            import json
            setattr(bubble, field, json.dumps(value))
        elif field in ["min_fund_transfer", "max_fund_transfer"] and value is not None:
            # Convert to cedis
            setattr(bubble, field, int(value * 100))
        else:
            setattr(bubble, field, value)
    
    # Log activity
    activity = BubbleActivity(
        bubble_id=bubble_id,
        user_id=user_id,
        activity_type="updated_bubble",
        description=f"Updated bubble settings"
    )
    
    db.add(activity)
    db.commit()
    db.refresh(bubble)
    
    return bubble


def delete_bubble(db: Session, bubble_id: str, user_id: str) -> bool:
    """Delete/archive bubble (only by owner)"""
    bubble = get_bubble_by_id(db, bubble_id)
    if not bubble:
        return False
    
    # Check if user is owner
    if bubble.owner_id != user_id:
        raise ValueError("Only bubble owner can delete the bubble")
    
    # Archive instead of delete
    bubble.status = BubbleStatus.ARCHIVED
    
    # Log activity
    activity = BubbleActivity(
        bubble_id=bubble_id,
        user_id=user_id,
        activity_type="archived_bubble",
        description=f"Archived bubble '{bubble.name}'"
    )
    
    db.add(activity)
    db.commit()
    
    return True


# Member management
def get_bubble_member(db: Session, bubble_id: str, user_id: str) -> Optional[BubbleMember]:
    """Get bubble member"""
    return db.query(BubbleMember).filter(
        and_(
            BubbleMember.bubble_id == bubble_id,
            BubbleMember.user_id == user_id
        )
    ).first()


def get_bubble_members(db: Session, bubble_id: str, skip: int = 0, limit: int = 50) -> List[BubbleMember]:
    """Get bubble members"""
    return db.query(BubbleMember).filter(
        BubbleMember.bubble_id == bubble_id
    ).order_by(BubbleMember.joined_at).offset(skip).limit(limit).all()


def join_bubble(db: Session, bubble_id: str, user_id: str, message: Optional[str] = None) -> BubbleMember:
    """Join a bubble"""
    bubble = get_bubble_by_id(db, bubble_id)
    if not bubble:
        raise ValueError("Bubble not found")
    
    if bubble.status != BubbleStatus.ACTIVE:
        raise ValueError("Cannot join inactive bubble")
    
    if bubble.is_full:
        raise ValueError("Bubble has reached maximum member limit")
    
    # Check if already a member
    existing_member = get_bubble_member(db, bubble_id, user_id)
    if existing_member:
        if existing_member.status == MemberStatus.ACTIVE:
            raise ValueError("Already a member of this bubble")
        elif existing_member.status == MemberStatus.BANNED:
            raise ValueError("You are banned from this bubble")
    
    # Determine initial status
    initial_status = MemberStatus.PENDING if bubble.requires_approval else MemberStatus.ACTIVE
    approved_at = None if bubble.requires_approval else datetime.utcnow()
    
    if existing_member:
        # Reactivate existing member
        existing_member.status = initial_status
        existing_member.approved_at = approved_at
        existing_member.joined_at = datetime.utcnow()
        member = existing_member
    else:
        # Create new member
        member = BubbleMember(
            bubble_id=bubble_id,
            user_id=user_id,
            status=initial_status,
            approved_at=approved_at
        )
        db.add(member)
    
    # Update member count if approved immediately
    if not bubble.requires_approval:
        bubble.member_count += 1
    
    # Log activity
    activity_type = "requested_to_join" if bubble.requires_approval else "joined_bubble"
    activity = BubbleActivity(
        bubble_id=bubble_id,
        user_id=user_id,
        activity_type=activity_type,
        description=message or f"{'Requested to join' if bubble.requires_approval else 'Joined'} bubble"
    )
    
    db.add(activity)
    db.commit()
    db.refresh(member)
    
    return member


def leave_bubble(db: Session, bubble_id: str, user_id: str, reason: Optional[str] = None) -> bool:
    """Leave a bubble"""
    bubble = get_bubble_by_id(db, bubble_id)
    if not bubble:
        return False
    
    member = get_bubble_member(db, bubble_id, user_id)
    if not member or member.status != MemberStatus.ACTIVE:
        return False
    
    # Owner cannot leave (must transfer ownership first)
    if member.role == MemberRole.OWNER:
        raise ValueError("Bubble owner cannot leave. Transfer ownership first.")
    
    # Update member status
    member.status = MemberStatus.LEFT
    
    # Update member count
    bubble.member_count = max(0, bubble.member_count - 1)
    
    # Log activity
    activity = BubbleActivity(
        bubble_id=bubble_id,
        user_id=user_id,
        activity_type="left_bubble",
        description=reason or "Left the bubble"
    )
    
    db.add(activity)
    db.commit()
    
    return True


def update_member_role(
    db: Session, 
    bubble_id: str, 
    target_user_id: str, 
    new_role: MemberRole, 
    admin_user_id: str
) -> Optional[BubbleMember]:
    """Update member role (admin/owner only)"""
    # Check admin permissions
    admin_member = get_bubble_member(db, bubble_id, admin_user_id)
    if not admin_member or not admin_member.is_admin_or_owner:
        raise ValueError("Only admins and owners can update member roles")
    
    # Get target member
    target_member = get_bubble_member(db, bubble_id, target_user_id)
    if not target_member:
        raise ValueError("Member not found")
    
    # Cannot change owner role (must use transfer ownership)
    if target_member.role == MemberRole.OWNER:
        raise ValueError("Cannot change owner role. Use transfer ownership instead.")
    
    # Only owner can assign admin role
    if new_role == MemberRole.ADMIN and admin_member.role != MemberRole.OWNER:
        raise ValueError("Only bubble owner can assign admin role")
    
    # Update role
    old_role = target_member.role
    target_member.role = new_role
    
    # Update permissions based on role
    if new_role in [MemberRole.ADMIN, MemberRole.MODERATOR]:
        target_member.can_invite = True
        target_member.can_post = True
    
    # Log activity
    activity = BubbleActivity(
        bubble_id=bubble_id,
        user_id=admin_user_id,
        activity_type="updated_member_role",
        description=f"Changed {target_user_id} role from {old_role} to {new_role}"
    )
    
    db.add(activity)
    db.commit()
    db.refresh(target_member)
    
    return target_member


def get_user_bubbles(db: Session, user_id: str, skip: int = 0, limit: int = 20) -> List[Bubble]:
    """Get bubbles where user is a member"""
    bubble_ids = db.query(BubbleMember.bubble_id).filter(
        and_(
            BubbleMember.user_id == user_id,
            BubbleMember.status == MemberStatus.ACTIVE
        )
    ).subquery()
    
    return db.query(Bubble).filter(
        and_(
            Bubble.id.in_(bubble_ids),
            Bubble.status == BubbleStatus.ACTIVE
        )
    ).order_by(desc(Bubble.updated_at)).offset(skip).limit(limit).all()


def get_bubble_statistics(db: Session) -> Dict[str, Any]:
    """Get bubble system statistics"""
    total_bubbles = db.query(Bubble).filter(Bubble.status == BubbleStatus.ACTIVE).count()
    
    total_members = db.query(func.sum(Bubble.member_count)).filter(
        Bubble.status == BubbleStatus.ACTIVE
    ).scalar() or 0
    
    # Bubbles by type
    bubbles_by_type = {}
    for bubble_type in BubbleType:
        count = db.query(Bubble).filter(
            and_(
                Bubble.bubble_type == bubble_type,
                Bubble.status == BubbleStatus.ACTIVE
            )
        ).count()
        bubbles_by_type[bubble_type.value] = count
    
    # Bubbles by region (top 10)
    bubbles_by_region = {}
    region_counts = db.query(
        Bubble.region, func.count(Bubble.id)
    ).filter(
        and_(
            Bubble.status == BubbleStatus.ACTIVE,
            Bubble.region.isnot(None)
        )
    ).group_by(Bubble.region).order_by(desc(func.count(Bubble.id))).limit(10).all()
    
    for region, count in region_counts:
        bubbles_by_region[region] = count
    
    fund_transfer_enabled = db.query(Bubble).filter(
        and_(
            Bubble.fund_transfer_enabled == True,
            Bubble.status == BubbleStatus.ACTIVE
        )
    ).count()
    
    return {
        'total_bubbles': total_bubbles,
        'active_bubbles': total_bubbles,  # Same as total since we filter active
        'total_members': total_members,
        'bubbles_by_type': bubbles_by_type,
        'bubbles_by_region': bubbles_by_region,
        'fund_transfer_enabled_count': fund_transfer_enabled
    }
