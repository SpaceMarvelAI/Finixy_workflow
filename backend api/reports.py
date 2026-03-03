"""
Report API Endpoints
Provides access to final reports stored in database and S3
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from services.report_storage_service import ReportStorageService
from shared.config.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])

# Security
security = HTTPBearer()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ReportResponse(BaseModel):
    """Response model for report data"""
    report_id: str
    chat_id: str
    workflow_id: Optional[str]
    user_id: str
    company_id: str
    report_type: str
    report_title: str
    report_description: Optional[str]
    s3_report_key: str
    file_format: str
    status: str
    generated_at: str
    report_meta: Dict[str, Any]
    report_data: Optional[Dict[str, Any]]  # Full report data from S3


class ReportListItem(BaseModel):
    """Response model for report list item"""
    report_id: str
    chat_id: str
    workflow_id: Optional[str]
    report_type: str
    report_title: str
    status: str
    generated_at: str


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

def get_db():
    """Get database session"""
    from data_layer.database.session import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def decode_token(token: str) -> dict:
    """Decode JWT token"""
    import jwt
    import os
    try:
        JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    from data_layer.models.database_models import User
    token = credentials.credentials
    payload = decode_token(token)
    user = db.query(User).filter(User.id == payload['sub']).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get report by ID from database.
    
    Returns:
        Full report data including report_data dict
    """
    try:
        report_service = ReportStorageService()
        
        report = report_service.get_report(db, report_id)
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report {report_id} not found"
            )
        
        # Authorization check - verify user owns this report
        if report['user_id'] != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Fetch full report data from S3
        if report.get('s3_report_key'):
            report_data = report_service.get_report_data_from_s3(report['s3_report_key'])
            if report_data:
                report['report_data'] = report_data
        
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report {report_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/", response_model=List[ReportListItem])
async def list_reports(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all reports for the current user.
    
    Query Parameters:
        limit: Maximum number of reports to return (default: 50)
        offset: Offset for pagination (default: 0)
    
    Returns:
        List of report metadata (without report_data)
    """
    try:
        report_service = ReportStorageService()
        
        reports = report_service.list_reports(
            db=db,
            user_id=current_user.id,
            company_id=current_user.company_id,
            limit=limit,
            offset=offset
        )
        
        return reports
        
    except Exception as e:
        logger.error(f"Error listing reports: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
