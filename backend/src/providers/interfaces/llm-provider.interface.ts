export interface LLMProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

export interface AnnotationSuggestion {
  type: 'focus' | 'exclude';
  text: string;
  startOffset: number;
  endOffset: number;
  confidence: number;
  reason?: string;
}

export interface QuizQuestion {
  type: 'mcq' | 'fill' | 'short';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuizGenerationRequest {
  content: string;
  annotations: Array<{
    type: 'focus' | 'exclude';
    text: string;
  }>;
  questionTypes: Array<'mcq' | 'fill' | 'short'>;
  count: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export abstract class LLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  abstract generateCompletion(messages: LLMMessage[]): Promise<LLMResponse>;
  
  abstract suggestAnnotations(content: string): Promise<AnnotationSuggestion[]>;
  
  abstract generateQuiz(request: QuizGenerationRequest): Promise<QuizQuestion[]>;
  
  abstract evaluateAnswer(question: string, correctAnswer: string, userAnswer: string): Promise<{
    score: number;
    feedback: string;
  }>;
}
