export interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIExplanation {
  explanation: string;
  keyPoints: string[];
  typicalMistakes: string[];
  imageDescription?: string;
  videoQuery?: string;
  sources: string[];
}

export interface DefinitionResult {
  definition: string;
  tip?: string;
  relatedTerms: string[];
}

function getErrorMessage(defaultMessage: string, error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return defaultMessage;
}

async function postJson<T>(url: string, body: unknown, defaultMessage: string): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || defaultMessage);
  }

  return response.json() as Promise<T>;
}

export async function generateMedicalChatReply(
  messages: ChatMessageInput[],
  context?: {
    question?: string;
    explanation?: string;
  },
) {
  try {
    const data = await postJson<{ content: string }>(
      '/api/ai/chat',
      { messages, context },
      'AI chat javobini olishda xatolik yuz berdi.',
    );

    return data.content || "Kechirasiz, javob olishda xatolik yuz berdi.";
  } catch (error) {
    throw new Error(getErrorMessage("Kechirasiz, javob olishda xatolik yuz berdi.", error));
  }
}

export async function generateExplanation(params: {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  topic?: string | null;
}) {
  try {
    return await postJson<AIExplanation>(
      '/api/ai/explain',
      {
        question: params.question,
        answer: params.selectedAnswer,
        context: `To'g'ri javob: ${params.correctAnswer}. Mavzu: ${params.topic || 'Noma\'lum'}`,
      },
      'AI tushuntirishini olishda xatolik yuz berdi.',
    );
  } catch (error) {
    throw new Error(getErrorMessage('AI tushuntirishini olishda xatolik yuz berdi.', error));
  }
}

export async function generateDefinition(term: string, fullContext?: string) {
  try {
    return await postJson<DefinitionResult>(
      '/api/ai/define',
      { term, fullContext: fullContext || term },
      "Ma'noni aniqlashda xatolik yuz berdi.",
    );
  } catch (error) {
    throw new Error(getErrorMessage("Ma'noni aniqlashda xatolik yuz berdi.", error));
  }
}
