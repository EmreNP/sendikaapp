import { validateStringLength } from './commonValidation';
import type { CreateTestContentRequest, UpdateTestContentRequest } from '@shared/types/training';

export const validateTestQuestions = (
  questions: any[]
): { valid: boolean; error?: string } => {
  if (!questions || questions.length === 0) {
    return { valid: false, error: 'En az bir soru eklenmelidir' };
  }
  
  if (questions.length > 50) {
    return { valid: false, error: 'En fazla 50 soru eklenebilir' };
  }
  
  for (const question of questions) {
    if (!question.question || question.question.trim() === '') {
      return { valid: false, error: 'Tüm sorular metin içermelidir' };
    }
    
    // Her soru tam 5 seçenek içermeli
    if (!question.options || !Array.isArray(question.options) || question.options.length !== 5) {
      return { valid: false, error: 'Her soru tam 5 seçenek içermelidir' };
    }
    
    // Her seçeneğin metni olmalı
    for (let i = 0; i < question.options.length; i++) {
      const option = question.options[i];
      if (!option.text || option.text.trim() === '') {
        return { valid: false, error: `Soru ${questions.indexOf(question) + 1}, Seçenek ${i + 1} metin içermelidir` };
      }
    }
    
    // Tam 1 doğru cevap olmalı
    const correctCount = question.options.filter((opt: any) => opt.isCorrect === true).length;
    if (correctCount !== 1) {
      return { valid: false, error: `Soru ${questions.indexOf(question) + 1} için tam 1 doğru cevap seçilmelidir` };
    }
  }
  
  return { valid: true };
};

export interface TestContentValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

export const validateCreateTestContent = (
  data: CreateTestContentRequest
): TestContentValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!data.lessonId || data.lessonId.trim() === '') {
    errors.lessonId = 'Ders ID zorunludur';
  }
  
  const titleValidation = validateStringLength(data.title || '', 'Başlık', 2, 200);
  if (!titleValidation.valid) {
    errors.title = titleValidation.error || 'Geçersiz başlık';
  }
  
  if (!data.questions || data.questions.length === 0) {
    errors.questions = 'En az bir soru eklenmelidir';
  } else {
    const questionsValidation = validateTestQuestions(data.questions);
    if (!questionsValidation.valid) {
      errors.questions = questionsValidation.error || 'Geçersiz sorular';
    }
  }
  
  if (data.timeLimit !== undefined && data.timeLimit < 0) {
    errors.timeLimit = 'Süre sınırı 0 veya pozitif bir sayı olmalıdır';
  }
  
  if (data.order !== undefined && data.order < 0) {
    errors.order = 'Sıralama 0 veya pozitif bir sayı olmalıdır';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

export const validateUpdateTestContent = (
  data: UpdateTestContentRequest
): TestContentValidationResult => {
  const errors: Record<string, string> = {};
  
  if (data.title !== undefined) {
    const titleValidation = validateStringLength(data.title, 'Başlık', 2, 200);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error || 'Geçersiz başlık';
    }
  }
  
  if (data.questions !== undefined) {
    if (data.questions.length === 0) {
      errors.questions = 'En az bir soru eklenmelidir';
    } else {
      const questionsValidation = validateTestQuestions(data.questions);
      if (!questionsValidation.valid) {
        errors.questions = questionsValidation.error || 'Geçersiz sorular';
      }
    }
  }
  
  if (data.timeLimit !== undefined && data.timeLimit < 0) {
    errors.timeLimit = 'Süre sınırı 0 veya pozitif bir sayı olmalıdır';
  }
  
  if (data.order !== undefined && data.order < 0) {
    errors.order = 'Sıralama 0 veya pozitif bir sayı olmalıdır';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

