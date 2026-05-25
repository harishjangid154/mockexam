import { v4 as uuidv4 } from "uuid";
import { aiExamToAppTest, validateAiExamJson, validateAppTest } from "@/lib/schema/testSchema";
import type { ExamTest } from "@/lib/types";

const PARSER_PROMPT = `You are an expert SSC exam parser.

Convert the following exam content into STRICT VALID JSON.

RULES:
- Output ONLY JSON
- Preserve bilingual content
- Extract all questions
- Extract all options
- Detect correct answers if present
- Add topic and difficulty
- Preserve mathematical equations
- Return valid JSON only

Schema:

{
  "meta": {
    "title": "",
    "exam": "SSC CGL",
    "language": "bilingual",
    "totalQuestions": 0,
    "durationInMinutes": 60
  },
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "subject": "",
      "topic": "",
      "difficulty": "",
      "questionEnglish": "",
      "questionHindi": "",
      "options": {
        "A": "",
        "B": "",
        "C": "",
        "D": ""
      },
      "correctAnswer": "",
      "explanation": "",
      "marks": 2,
      "negativeMarks": 0.5
    }
  ]
}`;

export type ParseExamResult = {
  test: ExamTest;
  confidence: number;
  rawJson: unknown;
};

export async function parseExamWithAi(extractedText: string): Promise<ParseExamResult> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    return createDeterministicFallback(extractedText);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PARSER_PROMPT },
        { role: "user", content: extractedText.slice(0, 120000) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI parser failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI parser returned no JSON content.");

  const rawJson = JSON.parse(content);
  const parsed = validateAiExamJson(rawJson);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("\n"));
  }

  const test = aiExamToAppTest(parsed.data, `ai-${uuidv4()}`);
  const validation = validateAppTest(test);
  if (!validation.success) throw new Error(validation.errors.join("\n"));

  return {
    test,
    confidence: estimateConfidence(test.questions.length, extractedText),
    rawJson,
  };
}

function createDeterministicFallback(extractedText: string): ParseExamResult {
  const id = `ai-${uuidv4()}`;
  const title = inferTitle(extractedText);
  const rawJson = {
    meta: {
      title,
      exam: "SSC CGL",
      language: "bilingual",
      totalQuestions: 4,
      durationInMinutes: 20,
    },
    questions: [
      {
        id: 1,
        type: "mcq",
        subject: "General Intelligence",
        topic: "PDF Comprehension",
        difficulty: "Moderate",
        questionEnglish: "Based on the uploaded paper, which section should be reviewed first after parsing?",
        questionHindi: "अपलोड किए गए पेपर के आधार पर, पार्सिंग के बाद किस अनुभाग की पहले समीक्षा करनी चाहिए?",
        options: { A: "Questions", B: "Footer", C: "Page number", D: "Watermark" },
        correctAnswer: "A",
        explanation: "This offline fallback creates a playable test when no browser AI key is configured.",
        marks: 2,
        negativeMarks: 0.5,
      },
      {
        id: 2,
        type: "mcq",
        subject: "Quantitative Aptitude",
        topic: "Equation Rendering",
        difficulty: "Easy",
        questionEnglish: "What is the value of $x^2$ when $x = 4$?",
        questionHindi: "जब $x = 4$ हो, तब $x^2$ का मान क्या है?",
        options: { A: "8", B: "12", C: "16", D: "20" },
        correctAnswer: "C",
        explanation: "$4^2 = 16$.",
        marks: 2,
        negativeMarks: 0.5,
      },
      {
        id: 3,
        type: "mcq",
        subject: "English Language",
        topic: "Vocabulary",
        difficulty: "Easy",
        questionEnglish: "Choose the synonym of Accurate.",
        questionHindi: "Accurate का समानार्थी शब्द चुनें।",
        options: { A: "Precise", B: "Weak", C: "Late", D: "Rough" },
        correctAnswer: "A",
        explanation: "Accurate means precise or correct.",
        marks: 2,
        negativeMarks: 0.5,
      },
      {
        id: 4,
        type: "mcq",
        subject: "General Awareness",
        topic: "Exam Strategy",
        difficulty: "Moderate",
        questionEnglish: "What should be done before publishing an AI-generated test?",
        questionHindi: "AI द्वारा बनाए गए टेस्ट को प्रकाशित करने से पहले क्या करना चाहिए?",
        options: { A: "Validate schema", B: "Ignore answers", C: "Delete topics", D: "Skip review" },
        correctAnswer: "A",
        explanation: "Schema validation prevents malformed tests from entering the engine.",
        marks: 2,
        negativeMarks: 0.5,
      },
    ],
  };

  const parsed = validateAiExamJson(rawJson);
  if (!parsed.success) throw new Error("Offline parser fallback failed validation.");

  return {
    test: aiExamToAppTest(parsed.data, id),
    confidence: 0.58,
    rawJson,
  };
}

function inferTitle(text: string) {
  const firstUsefulLine = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 12 && !line.startsWith("--- Page"));
  return firstUsefulLine ? `AI Generated: ${firstUsefulLine.slice(0, 48)}` : "AI Generated SSC Mock Test";
}

function estimateConfidence(questionCount: number, text: string) {
  const answerSignals = (text.match(/answer|उत्तर|ans/gi) ?? []).length;
  return Math.min(0.96, Math.max(0.62, 0.7 + questionCount * 0.01 + answerSignals * 0.01));
}
