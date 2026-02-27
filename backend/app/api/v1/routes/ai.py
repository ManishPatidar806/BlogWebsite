"""
AI API routes for Gemini integration
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.auth.auth import get_current_active_user
from app.models.models import User, AILog
from app.schemas.schemas import (
    AITextRequest, AIImproveRequest, AIRewriteRequest, 
    AITitleRequest, AIResponse, AITitleResponse
)
from app.services.ai_service import ai_service
from app.core.limiter import limiter


router = APIRouter()


async def _log_ai_usage(
    db: AsyncSession,
    user_id,
    action: str,
    input_text: str,
    output_text: str
):
    """Log AI usage for tracking"""
    log = AILog(
        user_id=user_id,
        action=action,
        input_text=input_text[:5000],  # Truncate for storage
        output_text=output_text[:5000],
        tokens_used=0  # Could be calculated based on length
    )
    db.add(log)
    await db.commit()


@router.post("/improve", response_model=AIResponse)
@limiter.limit("20/minute")
async def improve_text(
    request: Request,
    body: AIImproveRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Improve text clarity and readability.
    
    - **text**: Text to improve (max 10,000 characters)
    - **style**: Optional style (professional, casual, academic, concise)
    """
    try:
        result = await ai_service.improve_text(body.text, body.style)
        
        await _log_ai_usage(db, current_user.id, "improve", body.text, result)
        
        return AIResponse(
            original=body.text,
            result=result,
            action="improve"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )


@router.post("/grammar", response_model=AIResponse)
@limiter.limit("30/minute")
async def fix_grammar(
    request: Request,
    body: AITextRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fix grammar and spelling errors in text.
    
    - **text**: Text to fix (max 10,000 characters)
    """
    try:
        result = await ai_service.fix_grammar(body.text)
        
        await _log_ai_usage(db, current_user.id, "grammar", body.text, result)
        
        return AIResponse(
            original=body.text,
            result=result,
            action="grammar"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )


@router.post("/rewrite", response_model=AIResponse)
@limiter.limit("20/minute")
async def rewrite_text(
    request: Request,
    body: AIRewriteRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Rewrite text with a different tone or style.
    
    - **text**: Text to rewrite (max 10,000 characters)
    - **tone**: Optional tone (formal, friendly, persuasive, neutral)
    """
    try:
        result = await ai_service.rewrite_text(body.text, body.tone)
        
        await _log_ai_usage(db, current_user.id, "rewrite", body.text, result)
        
        return AIResponse(
            original=body.text,
            result=result,
            action="rewrite"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )


@router.post("/titles", response_model=AITitleResponse)
@limiter.limit("15/minute")
async def suggest_titles(
    request: Request,
    body: AITitleRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Suggest alternative titles for content.
    
    - **content**: Blog content (max 10,000 characters)
    - **current_title**: Optional current title for context
    """
    try:
        suggestions = await ai_service.suggest_titles(body.content, body.current_title)
        
        await _log_ai_usage(
            db, current_user.id, "titles", 
            body.content[:500], 
            ", ".join(suggestions)
        )
        
        return AITitleResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )


@router.post("/professional", response_model=AIResponse)
@limiter.limit("20/minute")
async def make_professional(
    request: Request,
    body: AITextRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Make text more professional and polished.
    
    - **text**: Text to make professional (max 10,000 characters)
    """
    try:
        result = await ai_service.make_professional(body.text)
        
        await _log_ai_usage(db, current_user.id, "professional", body.text, result)
        
        return AIResponse(
            original=body.text,
            result=result,
            action="professional"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )


@router.post("/paraphrase", response_model=AIResponse)
@limiter.limit("20/minute")
async def paraphrase_text(
    request: Request,
    body: AITextRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Paraphrase text while keeping the meaning.
    
    - **text**: Text to paraphrase (max 10,000 characters)
    """
    try:
        result = await ai_service.paraphrase(body.text)
        
        await _log_ai_usage(db, current_user.id, "paraphrase", body.text, result)
        
        return AIResponse(
            original=body.text,
            result=result,
            action="paraphrase"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )


@router.post("/tone", response_model=dict)
@limiter.limit("30/minute")
async def detect_tone(
    request: Request,
    body: AITextRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Detect the tone of the text.
    
    - **text**: Text to analyze (max 10,000 characters)
    """
    try:
        result = await ai_service.detect_tone(body.text)
        
        return {"tone_analysis": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )


@router.post("/expand", response_model=AIResponse)
@limiter.limit("15/minute")
async def expand_text(
    request: Request,
    body: AITextRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Expand and elaborate on the text.
    
    - **text**: Text to expand (max 10,000 characters)
    """
    try:
        result = await ai_service.expand_text(body.text)
        
        await _log_ai_usage(db, current_user.id, "expand", body.text, result)
        
        return AIResponse(
            original=body.text,
            result=result,
            action="expand"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )


@router.post("/summarize", response_model=AIResponse)
@limiter.limit("20/minute")
async def summarize_text(
    request: Request,
    body: AITextRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Summarize text into a concise version.
    
    - **text**: Text to summarize (max 10,000 characters)
    """
    try:
        result = await ai_service.summarize_text(body.text)
        
        await _log_ai_usage(db, current_user.id, "summarize", body.text, result)
        
        return AIResponse(
            original=body.text,
            result=result,
            action="summarize"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )


@router.post("/excerpt", response_model=dict)
@limiter.limit("15/minute")
async def generate_excerpt(
    request: Request,
    body: AITextRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a compelling excerpt for a blog post.
    
    - **text**: Blog content (max 10,000 characters)
    """
    try:
        result = await ai_service.generate_excerpt(body.text)
        
        return {"excerpt": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )


@router.post("/suggest-tags", response_model=dict)
@limiter.limit("15/minute")
async def suggest_tags(
    request: Request,
    body: AITitleRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Suggest relevant tags for a blog post.
    
    - **content**: Blog content (max 10,000 characters)
    - **current_title**: Blog title for context
    """
    try:
        title = body.current_title or "Untitled"
        result = await ai_service.suggest_tags(body.content, title)
        
        return {"tags": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )
