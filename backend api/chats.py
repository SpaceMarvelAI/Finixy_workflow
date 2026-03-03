"""
Chat API Endpoints
Provides CRUD operations for chat sessions with S3 message storage
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from services.chat_service import ChatService
from shared.config.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/chats", tags=["chats"])

# Security
security = HTTPBearer()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ChatUpdateRequest(BaseModel):
    """Request model for updating chat metadata"""
    session_title: Optional[str] = None
    pinned: Optional[bool] = None
    session_status: Optional[str] = None
    summary: Optional[str] = None


class MessageRequest(BaseModel):
    """Request model for adding a message"""
    role: str  # 'user' or 'assistant'
    content: str
    metadata: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Response model for chat with messages"""
    chat_id: str
    session_title: str
    session_type: str
    session_status: str
    pinned: bool
    summary: Optional[str]
    message_count: int
    document_count: int
    report_count: int
    document_ids: List[str]
    workflow_ids: List[str]
    final_report_ids: List[str]
    created_at: Optional[str]
    updated_at: Optional[str]
    last_message_at: Optional[str]
    messages: List[Dict[str, Any]]


class ChatListItem(BaseModel):
    """Response model for chat list item (without messages)"""
    chat_id: str
    session_title: str
    session_type: str
    session_status: str
    pinned: bool
    summary: Optional[str]
    message_count: int
    document_count: int
    report_count: int
    document_ids: List[str]
    workflow_ids: List[str]
    final_report_ids: List[str]
    created_at: Optional[str]
    last_message_at: Optional[str]


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

@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get chat by ID with all messages from S3.
    
    Returns:
        Chat metadata and full message history
    """
    try:
        chat_service = ChatService(db)
        chat_data = chat_service.get_chat_with_messages(chat_id)
        
        if not chat_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chat {chat_id} not found"
            )
        
        # TODO: Add authorization check - verify user has access to this chat
        # if chat_data['user_id'] != current_user.id:
        #     raise HTTPException(status_code=403, detail="Access denied")
        
        return chat_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/", response_model=List[ChatListItem])
async def list_chats(
    limit: int = 50,
    offset: int = 0,
    include_deleted: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all chats for the current user.
    
    Query Parameters:
        limit: Maximum number of chats to return (default: 50)
        offset: Offset for pagination (default: 0)
        include_deleted: Include soft-deleted chats (default: false)
    
    Returns:
        List of chat metadata (without messages)
    """
    try:
        chat_service = ChatService(db)
        chats = chat_service.list_chats(
            user_id=current_user.id,
            limit=limit,
            offset=offset,
            include_deleted=include_deleted
        )
        
        return chats
        
    except Exception as e:
        logger.error(f"Error listing chats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{chat_id}")
async def update_chat(
    chat_id: str,
    update_data: ChatUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update chat metadata (title, pinned status, etc.).
    
    Request Body:
        session_title: New title (optional)
        pinned: Pin status (optional)
        session_status: Status like 'active', 'archived' (optional)
        summary: Summary text (optional)
    
    Returns:
        Updated chat metadata
    """
    try:
        chat_service = ChatService(db)
        
        # TODO: Add authorization check
        # Verify user owns this chat before updating
        
        updated_chat = chat_service.update_chat_metadata(
            chat_id=chat_id,
            session_title=update_data.session_title,
            pinned=update_data.pinned,
            session_status=update_data.session_status,
            summary=update_data.summary
        )
        
        if not updated_chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chat {chat_id} not found"
            )
        
        return {
            "status": "success",
            "message": "Chat updated successfully",
            "chat_id": updated_chat.chat_id,
            "session_title": updated_chat.session_title,
            "pinned": updated_chat.pinned,
            "session_status": updated_chat.session_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating chat {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Soft delete a chat (sets status to 'deleted').
    
    Note: This is a soft delete. The chat and messages remain in the database
    and S3, but are marked as deleted.
    
    Returns:
        Success confirmation
    """
    try:
        chat_service = ChatService(db)
        
        # TODO: Add authorization check
        # Verify user owns this chat before deleting
        
        success = chat_service.soft_delete_chat(chat_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chat {chat_id} not found"
            )
        
        return {
            "status": "success",
            "message": f"Chat {chat_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{chat_id}/messages")
async def add_message(
    chat_id: str,
    message: MessageRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Add a message to a chat session.
    
    The message is appended to the chat's message history in S3.
    
    Request Body:
        role: 'user' or 'assistant'
        content: Message text
        metadata: Optional metadata dict
    
    Returns:
        Success confirmation
    """
    try:
        # Validate role
        if message.role not in ['user', 'assistant']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'user' or 'assistant'"
            )
        
        chat_service = ChatService(db)
        
        # TODO: Add authorization check
        # Verify user has access to this chat
        
        success = chat_service.add_message(
            chat_id=chat_id,
            role=message.role,
            content=message.content,
            metadata=message.metadata
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chat {chat_id} not found"
            )
        
        return {
            "status": "success",
            "message": "Message added successfully",
            "chat_id": chat_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding message to chat {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
