"""
CRUD operations for Delivery Settings
"""

from sqlalchemy.orm import Session
from app.models.delivery_settings import DeliverySettings
from app.schemas.delivery_settings import DeliverySettingsCreate, DeliverySettingsUpdate
from typing import Optional


def get_delivery_settings(db: Session) -> Optional[DeliverySettings]:
    """Get the active delivery settings (should only be one)"""
    return db.query(DeliverySettings).filter(DeliverySettings.is_active == True).first()


def get_delivery_settings_by_id(db: Session, settings_id: str) -> Optional[DeliverySettings]:
    """Get delivery settings by ID"""
    return db.query(DeliverySettings).filter(DeliverySettings.id == settings_id).first()


def create_delivery_settings(db: Session, settings: DeliverySettingsCreate) -> DeliverySettings:
    """Create new delivery settings"""
    # Deactivate any existing settings
    db.query(DeliverySettings).update({"is_active": False})
    
    db_settings = DeliverySettings(**settings.model_dump())
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings


def update_delivery_settings(
    db: Session,
    settings_id: str,
    settings_update: DeliverySettingsUpdate
) -> Optional[DeliverySettings]:
    """Update delivery settings"""
    db_settings = get_delivery_settings_by_id(db, settings_id)
    if not db_settings:
        return None
    
    update_data = settings_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_settings, field, value)
    
    db.commit()
    db.refresh(db_settings)
    return db_settings


def delete_delivery_settings(db: Session, settings_id: str) -> bool:
    """Delete delivery settings"""
    db_settings = get_delivery_settings_by_id(db, settings_id)
    if not db_settings:
        return False
    
    db.delete(db_settings)
    db.commit()
    return True
