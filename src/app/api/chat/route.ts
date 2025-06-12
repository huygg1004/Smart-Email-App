// app/api/chat/route.ts
import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  const { message } = await req.json()

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
    })

    const reply = completion.choices[0]?.message?.content ?? 'No response.'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('OpenAI API error:', err)
    return NextResponse.json({ error: 'Failed to get reply from OpenAI' }, { status: 500 })
  }
}
