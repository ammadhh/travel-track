import { NextRequest, NextResponse } from 'next/server';
import { AIParser } from '@/lib/ai-parser';

export async function POST(request: NextRequest) {
  try {
    const { emailContent, subject, from } = await request.json();

    if (!emailContent) {
      return NextResponse.json({ error: 'Email content required' }, { status: 400 });
    }

    const aiParser = new AIParser();
    const startTime = Date.now();
    
    const parsedData = await aiParser.parseEmail(
      emailContent,
      subject || 'No Subject',
      from || 'Unknown Sender'
    );
    
    const processingTime = Date.now() - startTime;

    if (!parsedData) {
      return NextResponse.json({
        success: false,
        message: 'No travel data found in email',
        processingTime: `${processingTime}ms`
      });
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      processingTime: `${processingTime}ms`,
      model: 'gpt-4o-mini'
    });

  } catch (error: any) {
    console.error('AI parsing error:', error);
    return NextResponse.json({ 
      error: 'Failed to parse email content',
      details: error.message 
    }, { status: 500 });
  }
}