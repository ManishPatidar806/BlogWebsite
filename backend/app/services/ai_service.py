"""
AI Service for Google Gemini integration
"""

from typing import List, Optional
import google.generativeai as genai

from app.core.config import settings


class AIService:
    """Service for AI-powered text operations using Google Gemini"""
    
    def __init__(self):
        # Configure Gemini API
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
    
    async def improve_text(self, text: str, style: Optional[str] = None) -> str:
        """Improve text clarity and readability"""
        style_instruction = ""
        if style:
            style_instruction = f" Make the tone {style}."
        
        prompt = f"""Improve the following text for better clarity, flow, and readability.{style_instruction}
Keep the original meaning intact. Make it engaging and professional.
Only return the improved text without any explanations or comments.

Text to improve:
{text}

Improved text:"""
        
        response = await self._generate(prompt)
        return response.strip()
    
    async def fix_grammar(self, text: str) -> str:
        """Fix grammar and spelling errors"""
        prompt = f"""Fix all grammar, spelling, and punctuation errors in the following text.
Do not change the meaning or style. Only fix errors.
Return only the corrected text without explanations.

Text to fix:
{text}

Corrected text:"""
        
        response = await self._generate(prompt)
        return response.strip()
    
    async def rewrite_text(self, text: str, tone: Optional[str] = None) -> str:
        """Rewrite text with different tone or style"""
        tone_instruction = "a clear and engaging"
        if tone:
            tone_instruction = tone
        
        prompt = f"""Rewrite the following text in {tone_instruction} tone.
Keep the core message but express it differently.
Return only the rewritten text without explanations.

Original text:
{text}

Rewritten text:"""
        
        response = await self._generate(prompt)
        return response.strip()
    
    async def suggest_titles(self, content: str, current_title: Optional[str] = None) -> List[str]:
        """Suggest headline/title alternatives"""
        current = ""
        if current_title:
            current = f"\nCurrent title: {current_title}"
        
        prompt = f"""Based on the following blog content, suggest 5 compelling and SEO-friendly titles.
Make them engaging, clear, and clickable without being clickbait.{current}

Content:
{content[:2000]}

Return exactly 5 titles, one per line, numbered 1-5:"""
        
        response = await self._generate(prompt)
        
        # Parse titles from response
        lines = response.strip().split('\n')
        titles = []
        for line in lines:
            # Remove numbering and clean up
            clean_line = line.strip()
            if clean_line:
                # Remove common prefixes like "1.", "1)", "1:"
                for prefix in ['1.', '2.', '3.', '4.', '5.', '1)', '2)', '3)', '4)', '5)', '1:', '2:', '3:', '4:', '5:']:
                    if clean_line.startswith(prefix):
                        clean_line = clean_line[len(prefix):].strip()
                        break
                if clean_line:
                    titles.append(clean_line)
        
        return titles[:5]  # Return max 5 titles
    
    async def make_professional(self, text: str) -> str:
        """Make text more professional and polished"""
        prompt = f"""Transform the following text into a more professional, polished version.
Use appropriate vocabulary for a business/professional context.
Maintain clarity and the original meaning.
Return only the professional version without explanations.

Original text:
{text}

Professional version:"""
        
        response = await self._generate(prompt)
        return response.strip()
    
    async def paraphrase(self, text: str) -> str:
        """Paraphrase the text while keeping the meaning"""
        prompt = f"""Paraphrase the following text.
Express the same ideas using different words and sentence structures.
Maintain the original meaning and tone.
Return only the paraphrased text without explanations.

Original text:
{text}

Paraphrased text:"""
        
        response = await self._generate(prompt)
        return response.strip()
    
    async def detect_tone(self, text: str) -> str:
        """Detect the tone of the text"""
        prompt = f"""Analyze the tone of the following text.
Identify the primary tone (e.g., formal, casual, humorous, serious, persuasive, informative).
Provide a brief one-sentence explanation.

Text:
{text}

Tone analysis:"""
        
        response = await self._generate(prompt)
        return response.strip()
    
    async def expand_text(self, text: str) -> str:
        """Expand and elaborate on the text"""
        prompt = f"""Expand the following text with more details, examples, and explanations.
Make it more comprehensive while maintaining the original voice.
Add relevant information that supports the main points.
Return only the expanded text without extra commentary.

Original text:
{text}

Expanded version:"""
        
        response = await self._generate(prompt)
        return response.strip()
    
    async def summarize_text(self, text: str) -> str:
        """Summarize the text into a concise version"""
        prompt = f"""Summarize the following text into a brief, concise version.
Keep the key points and main message.
Return only the summary without explanations.

Original text:
{text}

Summary:"""
        
        response = await self._generate(prompt)
        return response.strip()
    
    async def generate_excerpt(self, content: str) -> str:
        """Generate a compelling excerpt for a blog post"""
        prompt = f"""Create a compelling 2-3 sentence excerpt for the following blog post.
Make it engaging and interesting to encourage readers to read the full article.
Return only the excerpt without explanations.

Blog content:
{content[:3000]}

Excerpt:"""
        
        response = await self._generate(prompt)
        return response.strip()
    
    async def suggest_tags(self, content: str, title: str) -> List[str]:
        """Suggest relevant tags for a blog post"""
        prompt = f"""Based on the following blog post, suggest 5-8 relevant tags.
Tags should be short (1-3 words) and commonly used in blogging.
Return only the tags, comma-separated.

Title: {title}

Content:
{content[:2000]}

Tags:"""
        
        response = await self._generate(prompt)
        
        # Parse tags
        tags = [tag.strip() for tag in response.split(',')]
        return [tag for tag in tags if tag][:8]
    
    async def _generate(self, prompt: str) -> str:
        """Generate response from Gemini AI"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"AI generation failed: {str(e)}")


# Singleton instance
ai_service = AIService()
