import { NextResponse } from 'next/server';

export const maxDuration = 60; // Set timeout limit for hosting platforms like Vercel

export async function POST(req: Request) {
  try {
    const { fileType, content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'No schedule content provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      console.error('NVIDIA_API_KEY is not defined in the environment variables');
      return NextResponse.json(
        { success: false, error: 'API configuration error on server' },
        { status: 500 }
      );
    }

    // Prepare system instructions for parsing
    const schemaInstructions = `
You are an expert class schedule parsing assistant. Parse the provided schedule (image or text) and return a JSON object matching this TypeScript schema:

interface ScheduleResponse {
  subjects: Array<{
    id: string;        // lowercase slug with no spaces, e.g., "math-101", "physics-lab"
    name: string;      // full formatted subject name, e.g., "Mathematics I", "Physics Lab"
    teacher?: string;  // teacher/professor name if available, e.g., "Dr. John Doe"
    room?: string;     // classroom or lab room name if available, e.g., "Room 304B"
  }>;
  schedule: Array<{
    subjectId: string; // MUST match one of the ids in the subjects array exactly
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    startTime: string; // 24-hour format HH:MM, e.g., "09:00", "13:30"
    endTime: string;   // 24-hour format HH:MM, e.g., "10:30", "15:00"
  }>;
}

CRITICAL RULES:
1. Make sure to generate consistent 'id' (in subjects) and 'subjectId' (in schedule) to link them correctly.
2. Keep IDs simple, alphanumeric with hyphens, e.g. "chem-102".
3. Verify that the startTime and endTime are in 24-hour format (e.g. 2:00 PM becomes "14:00").
4. Respond ONLY with the JSON object. Do not include markdown code block syntax (like \`\`\`json), explanations, or conversational text. Return raw JSON.
`;

    // Construct the payload content for standard chat completions API
    let userContent: any[] = [];

    if (fileType === 'text/plain') {
      userContent.push({
        type: 'text',
        text: `Here is the class schedule text:\n\n${content}\n\nParse this schedule according to the schema.`
      });
    } else {
      // Assuming it's an image. Ensure base64 string includes standard MIME prefix
      const imageUrl = content.startsWith('data:') ? content : `data:${fileType};base64,${content}`;
      userContent.push(
        {
          type: 'text',
          text: 'Parse the class schedule visible in this image according to the schema.'
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl
          }
        }
      );
    }

    // Call NVIDIA NIM Endpoint
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        messages: [
          {
            role: 'system',
            content: schemaInstructions
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        max_tokens: 2048,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA NIM API error:', errorText);
      return NextResponse.json(
        { success: false, error: `NVIDIA API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    const rawText = responseData.choices?.[0]?.message?.content || '';

    // Extract and parse JSON from the response text
    let parsedData;
    try {
      parsedData = parseJSONFlexibly(rawText);
    } catch (parseError) {
      console.error('JSON parsing failed. Raw response was:', rawText);
      return NextResponse.json(
        { success: false, error: 'Failed to parse schedule JSON structure from AI response', rawResponse: rawText },
        { status: 500 }
      );
    }

    // Validate structure minimally
    if (!parsedData.subjects || !parsedData.schedule || !Array.isArray(parsedData.subjects) || !Array.isArray(parsedData.schedule)) {
      return NextResponse.json(
        { success: false, error: 'AI output did not follow the required schedule schema', rawResponse: rawText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subjects: parsedData.subjects,
      schedule: parsedData.schedule
    });

  } catch (error: any) {
    console.error('Error in analyze-schedule API route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Robustly parses a JSON object even if the model wrapped it in markdown code blocks or text.
 */
function parseJSONFlexibly(text: string): any {
  const cleaned = text.trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Look for JSON markers like ```json ... ``` or just { ... }
    const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
    const match = cleaned.match(jsonBlockRegex);
    if (match && match[1]) {
      return JSON.parse(match[1].trim());
    }

    // Try finding the first '{' and last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(candidate);
    }

    throw e;
  }
}
