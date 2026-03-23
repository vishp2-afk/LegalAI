import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable is required");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AnalysisSummary {
  documentType: string;
  totalClauses: number;
  riskScore: number;
  completionStatus: 'analyzing' | 'completed' | 'needs-input';
  keyFindings: string[];
  jurisdiction?: string;
  parties?: string[];
  effectiveDate?: string;
  termLength?: string;
  missingClauses?: string[];
  obligationsSummary?: string;
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  level: 'low' | 'medium' | 'high';
  clause: string;
  recommendation: string;
  impact: string;
  category?: string;
  negotiable?: boolean;
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

const SYSTEM_PROMPT = `You are a senior legal expert with 20+ years of experience across contract law, employment law, IP law, and corporate transactions. You specialize in making complex legal documents understandable for non-lawyers without losing accuracy or nuance.

Your analysis must be:
- Comprehensive: Cover every material clause, not just obvious risks
- Precise: Quote exact contract language, never paraphrase when quoting
- Practical: Give real-world consequence explanations, not abstract legal theory
- Balanced: Note favorable terms as well as unfavorable ones
- Actionable: Every identified risk must have a concrete negotiation suggestion

Always respond with valid JSON matching the requested structure exactly.`;

export async function analyzeLegalDocument(
  content: string,
  fileName: string,
  userContext?: string
): Promise<LegalAnalysisResult> {
  const analysisPrompt = `Perform a thorough legal document analysis. File: "${fileName}"
${userContext ? `\nUser context: ${userContext}\n` : ''}
Document content:
---
${content}
---

Analyze this document across ALL of the following dimensions:

1. DOCUMENT IDENTIFICATION
   - Document type, jurisdiction indicators, governing law, effective date, term/duration
   - All parties and their roles (who has more power in this agreement?)

2. CLAUSE-BY-CLAUSE RISK ANALYSIS
   For every material clause, evaluate:
   - One-sided or asymmetric obligations
   - Vague or undefined terms that create ambiguity
   - Missing protections (notice periods, cure rights, caps on liability)
   - Auto-renewal or hard-to-exit provisions
   - Broad indemnification or warranty waivers
   - IP assignment scope (is it too broad? does it capture pre-existing work?)
   - Non-compete / non-solicitation scope and enforceability
   - Dispute resolution (mandatory arbitration, venue, choice of law)
   - Termination rights (who can terminate, for what, with what notice?)
   - Payment terms, late fees, and audit rights

3. MISSING STANDARD PROTECTIONS
   Identify clauses that are typically present in this document type but are absent here, and explain why their absence matters.

4. OBLIGATIONS SUMMARY
   Distinguish between: what YOU must do vs. what THEY must do. Flag any obligation imbalances.

5. RISK SCORING
   Score 0-100 (100 = extremely high risk). Base this on: number of high-risk clauses, severity of missing protections, asymmetry of obligations, and enforceability concerns.

Respond ONLY with this JSON structure (no markdown, no code fences):
{
  "summary": {
    "documentType": "string",
    "totalClauses": number,
    "riskScore": number,
    "completionStatus": "completed",
    "keyFindings": ["5-7 most important plain-language observations"],
    "jurisdiction": "string or null",
    "parties": ["Party Name (Role)", ...],
    "effectiveDate": "string or null",
    "termLength": "string or null",
    "missingClauses": ["list of missing standard protections"],
    "obligationsSummary": "2-3 sentence plain-language summary of obligation balance"
  },
  "risks": [
    {
      "id": "risk-1",
      "title": "Brief clause title (5-8 words)",
      "description": "Plain-language meaning of this clause, then explain the specific risk or concern in everyday terms. Be concrete about what could go wrong.",
      "level": "high|medium|low",
      "clause": "Exact quoted text from the contract",
      "recommendation": "Specific suggested revision or negotiation point. Include example alternative wording where helpful.",
      "impact": "Concrete real-world consequence if this clause is not addressed (financial, operational, or legal)",
      "category": "liability|ip|payment|termination|confidentiality|non-compete|indemnification|dispute-resolution|general",
      "negotiable": true|false
    }
  ]
}

Include ALL material risks found — do not limit the count. Order risks by severity (high first). For favorable clauses that protect the reader, include them as "low" risk items with a positive description.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: analysisPrompt }],
  });

  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("");

  // Strip markdown code fences if present
  const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const analysisResult = JSON.parse(jsonText);

  // Generate document highlights from identified risks
  const highlights: DocumentHighlight[] = [];
  if (analysisResult.risks) {
    for (const risk of analysisResult.risks as RiskItem[]) {
      if (risk.clause) {
        const searchFragment = risk.clause.substring(0, 60);
        const startIndex = content.indexOf(searchFragment);
        if (startIndex !== -1) {
          highlights.push({
            id: risk.id,
            startIndex,
            endIndex: startIndex + Math.min(risk.clause.length, 300),
            type: `risk-${risk.level}` as DocumentHighlight['type'],
            note: risk.title,
          });
        }
      }
    }
  }

  const highCount = (analysisResult.risks as RiskItem[]).filter(r => r.level === 'high').length;
  const medCount = (analysisResult.risks as RiskItem[]).filter(r => r.level === 'medium').length;

  const qaMessages: QAMessage[] = [
    {
      id: crypto.randomUUID(),
      type: 'question',
      content: `I've completed a full analysis of your ${analysisResult.summary?.documentType || 'legal document'}. I found ${highCount} high-risk, ${medCount} medium-risk clause${medCount !== 1 ? 's' : ''}, and ${analysisResult.summary?.missingClauses?.length || 0} missing standard protections. What would you like to explore?`,
      timestamp: new Date(),
      suggestions: [
        'Walk me through the highest-risk clauses',
        'What should I try to negotiate?',
        'Explain the missing protections',
        'Is this safe to sign as-is?',
        'Summarize my obligations under this contract',
      ],
    },
  ];

  return {
    summary: analysisResult.summary || {
      documentType: 'Legal Document',
      totalClauses: 0,
      riskScore: 50,
      completionStatus: 'completed',
      keyFindings: ['Analysis completed'],
    },
    risks: analysisResult.risks || [],
    highlights,
    qaMessages,
  };
}

export async function generateQAResponse(
  conversation: QAMessage[],
  userMessage: string,
  documentContent: string,
  analysisResult: LegalAnalysisResult
): Promise<QAMessage> {
  const highRisks = analysisResult.risks.filter(r => r.level === 'high');
  const conversationHistory = conversation
    .map(msg => `${msg.type === 'question' ? 'Assistant' : 'User'}: ${msg.content}`)
    .join('\n');

  const qaPrompt = `You are helping a user understand their legal document analysis. Answer their question directly and practically.

Document: ${analysisResult.summary.documentType}
Risk Score: ${analysisResult.summary.riskScore}/100
High-risk items (${highRisks.length}): ${highRisks.map(r => r.title).join('; ')}
Key findings: ${analysisResult.summary.keyFindings?.join(' | ')}
${analysisResult.summary.missingClauses?.length ? `Missing protections: ${analysisResult.summary.missingClauses.join(', ')}` : ''}

Conversation so far:
${conversationHistory}

User's question: ${userMessage}

Instructions:
- Answer directly and specifically — reference actual clause language when relevant
- Use plain language, define any legal terms you must use
- If recommending negotiation, give specific alternative wording
- Keep your answer focused; avoid generic legal disclaimers
- Offer 2-3 natural follow-up questions at the end

Respond ONLY with this JSON (no markdown, no code fences):
{
  "content": "Your answer here",
  "suggestions": ["follow-up 1", "follow-up 2", "follow-up 3"]
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: qaPrompt }],
  });

  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("");

  const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const qaResult = JSON.parse(jsonText);
    return {
      id: crypto.randomUUID(),
      type: 'question',
      content: qaResult.content || "I'd be happy to help. Could you provide more details?",
      timestamp: new Date(),
      suggestions: qaResult.suggestions || [],
    };
  } catch {
    return {
      id: crypto.randomUUID(),
      type: 'question',
      content: rawText || "I'd be happy to help. Could you provide more details?",
      timestamp: new Date(),
      suggestions: ['Explain the main risks', 'What should I negotiate?', 'Is this standard?'],
    };
  }
}
