"""
API endpoints for Price Comparison
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from app.db.database import get_db
from app.core.deps import get_current_admin
from app.models.user import User
from app.models.supplier import Supplier, SupplierProduct
from app.models.product import Product
from app.schemas.supply_request import SupplierPriceComparison, PriceComparisonResponse


router = APIRouter()


def calculate_value_score(
    unit_price: Decimal,
    rating: Decimal,
    on_time_rate: Decimal,
    lead_time_days: int
) -> float:
    """
    Calculate value score for supplier
    
    Formula: (Rating * 0.3) + (OnTimeRate * 0.3) + (PriceScore * 0.3) + (SpeedScore * 0.1)
    - Lower price = higher score
    - Higher rating = higher score
    - Higher on-time rate = higher score
    - Lower lead time = higher score
    """
    # Normalize rating (0-5 to 0-1)
    rating_score = float(rating) / 5.0
    
    # Normalize on-time rate (0-100 to 0-1)
    on_time_score = float(on_time_rate) / 100.0
    
    # Price score (inverse - lower is better, normalized to 0-1)
    # Assuming max reasonable price is 10x the unit price
    price_score = 1.0 - min(float(unit_price) / (float(unit_price) * 10), 1.0)
    
    # Speed score (inverse - lower lead time is better)
    # Assuming max reasonable lead time is 30 days
    speed_score = 1.0 - min(lead_time_days / 30.0, 1.0)
    
    # Weighted average
    value_score = (
        rating_score * 0.3 +
        on_time_score * 0.3 +
        price_score * 0.3 +
        speed_score * 0.1
    )
    
    return round(value_score, 3)


@router.get("/product/{product_id}", response_model=PriceComparisonResponse)
def compare_product_prices(
    product_id: str,
    quantity: Optional[Decimal] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Compare prices from all suppliers for a specific product
    
    Returns suppliers sorted by value score (best value first)
    """
    # Get product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Get all supplier products for this product
    supplier_products = db.query(SupplierProduct).join(Supplier).filter(
        SupplierProduct.product_id == product_id,
        SupplierProduct.is_active == True,
        Supplier.is_active == True,
        Supplier.verification_status == "verified"
    ).all()
    
    if not supplier_products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No suppliers found for this product"
        )
    
    # Build comparison list
    comparisons = []
    prices = []
    
    for sp in supplier_products:
        supplier = sp.supplier
        
        # Calculate estimated total if quantity provided
        estimated_total = None
        if quantity:
            estimated_total = sp.unit_cost * quantity
            if supplier.delivery_fee:
                estimated_total += supplier.delivery_fee
        
        # Calculate value score
        value_score = calculate_value_score(
            sp.unit_cost,
            supplier.rating,
            supplier.on_time_delivery_rate,
            sp.lead_time_days
        )
        
        comparison = SupplierPriceComparison(
            supplier_id=supplier.id,
            supplier_name=supplier.name,
            supplier_code=supplier.supplier_code,
            categories=supplier.categories or [],
            unit_price=sp.unit_cost,
            available_quantity=sp.supply_capacity,
            lead_time_days=sp.lead_time_days,
            delivery_fee=supplier.delivery_fee,
            rating=supplier.rating,
            on_time_delivery_rate=supplier.on_time_delivery_rate,
            quality_rating=supplier.quality_rating,
            total_supplies=supplier.total_supplies,
            is_preferred=sp.is_preferred,
            images=sp.images or [],  # Include supplier's product photos
            estimated_total=estimated_total,
            value_score=value_score
        )
        
        comparisons.append(comparison)
        prices.append(float(sp.unit_cost))
    
    # Sort by value score (highest first)
    comparisons.sort(key=lambda x: x.value_score, reverse=True)
    
    # Find best price and best value
    best_price_supplier_id = min(comparisons, key=lambda x: x.unit_price).supplier_id
    best_value_supplier_id = comparisons[0].supplier_id if comparisons else None
    
    # Calculate average price and range
    average_price = Decimal(str(sum(prices) / len(prices))) if prices else None
    price_range = {
        "min": Decimal(str(min(prices))),
        "max": Decimal(str(max(prices)))
    } if prices else None
    
    return PriceComparisonResponse(
        product_id=product_id,
        product_name=product.name,
        suppliers=comparisons,
        best_price_supplier_id=best_price_supplier_id,
        best_value_supplier_id=best_value_supplier_id,
        average_price=average_price,
        price_range=price_range
    )


@router.get("/all-products")
def get_all_products_price_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get all products with their prices from different suppliers in table format
    Shows highest and lowest prices for each product
    """
    # Get all product IDs that have supplier products (avoid distinct on JSON columns)
    product_ids = db.query(SupplierProduct.product_id).filter(
        SupplierProduct.is_active == True
    ).distinct().all()
    
    product_ids = [pid[0] for pid in product_ids]
    
    # Get the actual products
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    
    result = []
    
    for product in products:
        # Get all supplier products for this product
        supplier_products = db.query(SupplierProduct).join(Supplier).filter(
            SupplierProduct.product_id == product.id,
            SupplierProduct.is_active == True,
            Supplier.is_active == True,
            Supplier.verification_status == "verified"
        ).all()
        
        if not supplier_products:
            continue
        
        # Get prices and supplier info
        suppliers_data = []
        prices = []
        
        for sp in supplier_products:
            supplier = sp.supplier
            price = float(sp.unit_cost)
            prices.append(price)
            
            suppliers_data.append({
                "supplier_id": supplier.id,
                "supplier_name": supplier.name,
                "supplier_code": supplier.supplier_code,
                "unit_price": price,
                "rating": float(supplier.rating),
                "lead_time_days": sp.lead_time_days,
                "available_quantity": sp.supply_capacity
            })
        
        # Calculate min and max prices
        min_price = min(prices) if prices else 0
        max_price = max(prices) if prices else 0
        
        # Find suppliers with min and max prices
        min_supplier = next((s for s in suppliers_data if s["unit_price"] == min_price), None)
        max_supplier = next((s for s in suppliers_data if s["unit_price"] == max_price), None)
        
        result.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_image": product.image_url,
            "category": product.category.name if product.category else None,
            "suppliers_count": len(suppliers_data),
            "lowest_price": min_price,
            "highest_price": max_price,
            "price_difference": max_price - min_price,
            "lowest_price_supplier": min_supplier,
            "highest_price_supplier": max_supplier,
            "all_suppliers": suppliers_data
        })
    
    # Sort by product name
    result.sort(key=lambda x: x["product_name"])
    
    return result


@router.get("/best-suppliers", response_model=List[SupplierPriceComparison])
def get_best_suppliers(
    category: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get best suppliers by category or overall
    
    Sorted by rating, on-time delivery rate, and total supplies
    """
    query = db.query(Supplier).filter(
        Supplier.is_active == True,
        Supplier.verification_status == "verified"
    )
    
    # Filter by category if provided
    if category:
        query = query.filter(Supplier.categories.contains([category]))
    
    # Order by performance metrics
    suppliers = query.order_by(
        Supplier.rating.desc(),
        Supplier.on_time_delivery_rate.desc(),
        Supplier.total_supplies.desc()
    ).limit(limit).all()
    
    # Build response
    comparisons = []
    for supplier in suppliers:
        # Get average unit price from supplier products
        avg_price = db.query(SupplierProduct).filter(
            SupplierProduct.supplier_id == supplier.id,
            SupplierProduct.is_active == True
        ).with_entities(
            SupplierProduct.unit_cost
        ).first()
        
        unit_price = avg_price[0] if avg_price else Decimal("0")
        
        # Calculate value score
        value_score = calculate_value_score(
            unit_price,
            supplier.rating,
            supplier.on_time_delivery_rate,
            1  # Assume 1 day lead time for best suppliers
        )
        
        comparison = SupplierPriceComparison(
            supplier_id=supplier.id,
            supplier_name=supplier.name,
            supplier_code=supplier.supplier_code,
            categories=supplier.categories or [],
            unit_price=unit_price,
            available_quantity=None,
            lead_time_days=1,
            delivery_fee=supplier.delivery_fee,
            rating=supplier.rating,
            on_time_delivery_rate=supplier.on_time_delivery_rate,
            quality_rating=supplier.quality_rating,
            total_supplies=supplier.total_supplies,
            is_preferred=True,
            estimated_total=None,
            value_score=value_score
        )
        
        comparisons.append(comparison)
    
    return comparisons
