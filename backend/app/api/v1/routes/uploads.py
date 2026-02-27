"""
File upload API routes
"""

import os
import uuid
import aiofiles
from datetime import datetime
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse

from app.auth.auth import get_current_active_user
from app.models.models import User


router = APIRouter()

# Configure upload directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def get_file_extension(filename: str) -> str:
    """Get lowercase file extension"""
    return Path(filename).suffix.lower()


def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return get_file_extension(filename) in ALLOWED_EXTENSIONS


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload an image file.
    
    Returns the URL to access the uploaded image.
    - Allowed formats: JPG, PNG, GIF, WebP, SVG
    - Max size: 10MB
    """
    # Validate file extension
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )
    
    # Generate unique filename
    ext = get_file_extension(file.filename)
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    
    # Create date-based subfolder
    date_folder = datetime.now().strftime("%Y/%m")
    folder_path = UPLOAD_DIR / date_folder
    folder_path.mkdir(parents=True, exist_ok=True)
    
    file_path = folder_path / unique_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Return the URL path
    url_path = f"/api/v1/uploads/images/{date_folder}/{unique_filename}"
    
    return {
        "url": url_path,
        "filename": unique_filename,
        "original_filename": file.filename,
        "size": len(content),
        "content_type": file.content_type
    }


@router.post("/images")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload multiple image files.
    
    Returns URLs for all uploaded images.
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 files can be uploaded at once"
        )
    
    results = []
    for file in files:
        if not is_allowed_file(file.filename):
            results.append({
                "filename": file.filename,
                "error": f"File type not allowed"
            })
            continue
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            results.append({
                "filename": file.filename,
                "error": "File too large"
            })
            continue
        
        # Generate unique filename
        ext = get_file_extension(file.filename)
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        
        # Create date-based subfolder
        date_folder = datetime.now().strftime("%Y/%m")
        folder_path = UPLOAD_DIR / date_folder
        folder_path.mkdir(parents=True, exist_ok=True)
        
        file_path = folder_path / unique_filename
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        url_path = f"/api/v1/uploads/images/{date_folder}/{unique_filename}"
        
        results.append({
            "url": url_path,
            "filename": unique_filename,
            "original_filename": file.filename,
            "size": len(content)
        })
    
    return {"uploads": results}


@router.get("/images/{year}/{month}/{filename}")
async def get_image(year: str, month: str, filename: str):
    """Serve an uploaded image"""
    file_path = UPLOAD_DIR / year / month / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Determine content type
    ext = get_file_extension(filename)
    content_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml"
    }
    
    return FileResponse(
        file_path,
        media_type=content_types.get(ext, "application/octet-stream"),
        headers={"Cache-Control": "public, max-age=31536000"}  # Cache for 1 year
    )
