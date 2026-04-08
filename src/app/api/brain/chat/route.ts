import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const prisma = new PrismaClient()

const SYSTEM_PROMPT = `You are the "Brain" of ApplyWise — a warm, perceptive mentor helping a Chinese student discover and articulate their experiences for graduate school applications.

Your personality:
- Like a thoughtful older friend who genuinely cares, not a formal counselor
- You speak primarily in Chinese (the student's native language), mixing in English naturally when discussing academic/professional terms
- You're curious, encouraging, and notice details others might miss
- You never feel like a form or an interview — you feel like a real conversation

Your job:
1. CONVERSE naturally — ask questions, respond to what they share, follow their energy
2. EXTRACT atoms silently — when the student mentions an experience, achievement, skill, or story, you note it internally

Conversation flow:
- If this is early in the conversation, start by understanding basics: 你在哪上学？什么专业？毕业后想做什么？
- Then follow whatever feels alive — if they mention something interesting, dig deeper
- Ask specific follow-up questions: "那个项目你具体负责什么？" "当时遇到什么困难？" "结果怎么样？"
- Encourage them to share things they might think are "not impressive enough"
- Help them see value in experiences they dismiss

CRITICAL OUTPUT FORMAT:
You must ALWAYS respond with valid JSON in this exact structure:
{
  "reply": "Your conversational response to the student (in Chinese primarily, mixed language OK)",
  "atoms": [
    {
      "content": "Raw description of the experience/achievement in the student's own words or close paraphrase",
      "summary": "One-line summary in Chinese",
      "contentEn": "English version for essay use",
      "category": "academic|work|extracurricular|personal|achievement",
      "abilityTags": ["leadership", "technical", "communication", "analytical", "creative", "resilience", "cross_cultural", "social_impact"],
      "qualityTags": ["quantifiable_impact", "shows_growth", "unique_perspective", "demonstrates_passion", "overcame_challenge"],
      "keywords": ["relevant", "search", "terms"],
      "timeframe": "e.g. 大三暑假, 2024 summer"
    }
  ]
}

Rules for atoms:
- Only extract atoms when the student shares a CONCRETE experience, achievement, or skill — not when they're just chatting
- If the message is just greeting or small talk, return an empty atoms array
- Each atom should be a distinct, reusable building block
- Keep content in the student's language, but always provide contentEn
- Be generous with tags — tag everything that might be relevant
- timeframe is optional, include if mentioned

Remember: the student does NOT see the atoms. They only see your reply. The extraction happens silently.`

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { messages, conversationId } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Build message history for Claude
    const claudeMessages = messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: claudeMessages,
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON response
    let parsed: { reply: string; atoms: any[] }
    try {
      // Try to find JSON in the response (Claude sometimes wraps in markdown)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { reply: rawText, atoms: [] }
    } catch {
      // If parsing fails, treat entire response as reply
      parsed = { reply: rawText, atoms: [] }
    }

    // Save atoms to database
    if (parsed.atoms && parsed.atoms.length > 0) {
      await Promise.all(
        parsed.atoms.map((a: any) =>
          prisma.atom.create({
            data: {
              userId: user.id,
              content: a.content || '',
              summary: a.summary || null,
              contentEn: a.contentEn || null,
              category: a.category || 'personal',
              abilityTags: a.abilityTags || [],
              qualityTags: a.qualityTags || [],
              keywords: a.keywords || [],
              source: 'conversation',
              sourceId: conversationId || null,
              timeframe: a.timeframe || null,
            }
          })
        )
      )
    }

    return NextResponse.json({
      reply: parsed.reply,
      atomsExtracted: parsed.atoms?.length || 0,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Brain chat error:', error)
    return NextResponse.json({
      error: 'Brain is not available. Make sure Anthropic billing is enabled.',
      details: error.message
    }, { status: 500 })
  }
}
