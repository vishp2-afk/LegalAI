// AI-powered legal document analysis using OpenAI - from javascript_openai blueprint
import OpenAI from "openai";
import crypto from "crypto";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AnalysisSummary {
  documentType: string;
  totalClauses: number;
  riskScore: number;
  completionStatus: 'analyzing' | 'completed' | 'needs-input';
  keyFindings: string[];
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  level: 'low' | 'medium' | 'high';
  clause: string;
  recommendation: string;
  impact: string;
}

export interface DocumentHighlight {
  id: string;
  startIndex: number;
  endIndex: number;
  type: 'risk-high' | 'risk-medium' | 'risk-low' | 'suggestion';
  note?: string;
}

export interface QAMessage {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export interface LegalAnalysisResult {
  summary: AnalysisSummary;
  risks: RiskItem[];
  highlights: DocumentHighlight[];
  qaMessages: QAMessage[];
}

export async function analyzeLegalDocument(
  content: string, 
  fileName: string,
  userContext?: string
): Promise<LegalAnalysisResult> {
  try {
    // Step 1: Initial document analysis
    const analysisPrompt = `
You are a legal expert specializing in contract interpretation and risk communication.
Your purpose is to help non-lawyers clearly understand what they are signing — including obligations, rights, risks, and implications — in plain, easy-to-understand language.

Document: ${fileName}
Content: ${content}

${userContext ? `User Context: ${userContext}` : ''}

When reviewing this contract:
1. Simplify without diluting meaning.
   • Explain each clause in everyday language.
   • Avoid legal jargon; if you must use it, define it in simple terms.

2. Identify and explain risks.
   • Highlight any clauses that are one-sided, vague, or high-risk.
   • Clearly explain why a clause could be risky (e.g., lack of termination rights, hidden costs, liability exposure).
   • Flag terms that favor one party disproportionately.

3. Evaluate the language quality.
   • Identify good contract language (clear, mutual, specific, time-bound).
   • Identify bad contract language (ambiguous, open-ended, lacking mutuality, missing definitions).
   • Give examples of how unclear wording can lead to disputes.

4. Suggest practical improvements.
   • Provide specific rewording suggestions that make the clause clearer or more balanced.
   • Back each suggestion with reasoning or negotiation logic (e.g., "This protects you from unlimited liability" or "This clarifies the timeline for performance").
   • Offer alternative phrasing when relevant.

Please provide a detailed JSON response with the following structure:
{
  "summary": {
    "documentType": "string (e.g., Employment Agreement, NDA, etc.)",
    "totalClauses": number,
    "riskScore": number (0-100, where 100 is highest risk),
    "completionStatus": "completed",
    "keyFindings": ["array of 3-5 key observations in plain language"]
  },
  "risks": [
    {
      "id": "unique-id",
      "title": "Clause Summary (brief title)",
      "description": "Plain-Language Meaning: Explain what this clause means in everyday terms, avoiding jargon. Then provide Risk Assessment: Describe potential issues, imbalances, or why this could be problematic.",
      "level": "high|medium|low",
      "clause": "The actual clause text from the contract",
      "recommendation": "Suggested Change: Provide clearer or fairer wording if needed. Include Rationale: Explain the business or legal logic for the change (e.g., 'This protects you from unlimited liability').",
      "impact": "Potential consequences if this clause is not addressed or negotiated"
    }
  ]
}

Your tone should be educational, calm, and empowering — never alarmist.
Your goal is to make people feel confident and informed about what they're signing.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
      messages: [
        {
          role: "system",
          content: "You are a legal expert who specializes in making contracts understandable for everyday people. Your role is educational, calm, and empowering. Explain legal concepts in plain language, identify risks clearly without being alarmist, and provide practical suggestions. Always respond with valid JSON."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4000,
    });

    const analysisResult = JSON.parse(response.choices[0].message.content || '{}');

    // Step 2: Generate document highlights
    const highlights: DocumentHighlight[] = [];
    if (analysisResult.risks) {
      analysisResult.risks.forEach((risk: RiskItem) => {
        if (risk.clause && content.includes(risk.clause.substring(0, 50))) {
          const startIndex = content.indexOf(risk.clause.substring(0, 50));
          if (startIndex !== -1) {
            highlights.push({
              id: risk.id,
              startIndex,
              endIndex: startIndex + Math.min(risk.clause.length, 200),
              type: `risk-${risk.level}` as any,
              note: risk.title
            });
          }
        }
      });
    }

    // Step 3: Generate initial Q&A message
    const qaMessages: QAMessage[] = [
      {
        id: crypto.randomUUID(),
        type: 'question',
        content: `I've analyzed your ${analysisResult.summary?.documentType || 'legal document'}. I found ${analysisResult.risks?.length || 0} potential issues. To provide better guidance, could you tell me more about your situation?`,
        timestamp: new Date(),
        suggestions: [
          'I need help understanding the risks',
          'I want to negotiate better terms',
          'I just want to know if this is safe to sign',
          'I need specific clause recommendations'
        ]
      }
    ];

    return {
      summary: analysisResult.summary || {
        documentType: 'Legal Document',
        totalClauses: 0,
        riskScore: 50,
        completionStatus: 'completed',
        keyFindings: ['Analysis completed']
      },
      risks: analysisResult.risks || [],
      highlights,
      qaMessages
    };

  } catch (error) {
    console.error('Legal analysis failed:', error);
    throw new Error('Failed to analyze document: ' + (error as Error).message);
  }
}

export async function generateQAResponse(
  conversation: QAMessage[],
  userMessage: string,
  documentContent: string,
  analysisResult: LegalAnalysisResult
): Promise<QAMessage> {
  try {
    const conversationHistory = conversation.map(msg => 
      `${msg.type === 'question' ? 'AI' : 'User'}: ${msg.content}`
    ).join('\n');

    const qaPrompt = `
You are a legal AI assistant helping a user understand their document analysis. 

Document Analysis Summary:
- Document Type: ${analysisResult.summary.documentType}
- Risk Score: ${analysisResult.summary.riskScore}/100
- Key Risks: ${analysisResult.risks.map(r => `${r.title} (${r.level})`).join(', ')}

Conversation History:
${conversationHistory}

User's latest message: ${userMessage}

Please provide a helpful, practical response as a legal AI assistant. If appropriate, ask follow-up questions to better understand their needs and include helpful suggestions.

Respond in JSON format:
{
  "content": "Your response text",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"] // optional array of quick response options
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
      messages: [
        {
          role: "system",
          content: "You are a legal expert who specializes in making contracts understandable for everyday people. Your role is educational, calm, and empowering. Use plain language, avoid jargon, and help users feel confident about what they're signing. Always respond with valid JSON."
        },
        {
          role: "user",
          content: qaPrompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
    });

    const qaResult = JSON.parse(response.choices[0].message.content || '{}');

    return {
      id: crypto.randomUUID(),
      type: 'question',
      content: qaResult.content || 'I\'d be happy to help you with that. Could you provide more details?',
      timestamp: new Date(),
      suggestions: qaResult.suggestions || []
    };

  } catch (error) {
    console.error('Q&A generation failed:', error);
    
    // Return a fallback response
    return {
      id: crypto.randomUUID(),
      type: 'question',
      content: 'I\'d be happy to help you with that. Could you provide more specific details about what you\'d like to know?',
      timestamp: new Date(),
      suggestions: ['Explain the main risks', 'Help me understand a specific clause', 'What should I negotiate?']
    };
  }
}