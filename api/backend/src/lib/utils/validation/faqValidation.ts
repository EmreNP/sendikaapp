import { validateStringLength } from './commonValidation';
import type { CreateFAQRequest, UpdateFAQRequest } from '@shared/types/faq';

// Question validation
export const validateFAQQuestion = (question: string): { valid: boolean; error?: string } => {
  if (!question || question.trim() === '') {
    return { valid: false, error: 'Soru zorunludur' };
  }
  
  const lengthValidation = validateStringLength(question, 'Soru', 2, 200);
  if (!lengthValidation.valid) {
    return lengthValidation;
  }
  
  return { valid: true };
};

// Answer validation (HTML)
export const validateFAQAnswer = (answer: string): { valid: boolean; error?: string } => {
  if (!answer || answer.trim() === '') {
    return { valid: false, error: 'Cevap zorunludur' };
  }
  
  // HTML tag'lerini temizleyerek uzunluk kontrolü
  const textContent = answer.replace(/<[^>]*>/g, '').trim();
  
  if (textContent.length < 10) {
    return { valid: false, error: 'Cevap en az 10 karakter olmalıdır' };
  }
  
  // Max uzunluk kontrolü (HTML dahil)
  if (answer.length > 50000) {
    return { valid: false, error: 'Cevap en fazla 50000 karakter olabilir' };
  }
  
  return { valid: true };
};

// Validation Result Interface
export interface FAQValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

// Create FAQ Validation
export const validateCreateFAQ = (data: CreateFAQRequest): FAQValidationResult => {
  const errors: Record<string, string> = {};
  
  // Question validation
  const questionValidation = validateFAQQuestion(data.question || '');
  if (!questionValidation.valid) {
    errors.question = questionValidation.error || 'Geçersiz soru';
  }
  
  // Answer validation (zorunlu)
  if (!data.answer) {
    errors.answer = 'Cevap zorunludur';
  } else {
    const answerValidation = validateFAQAnswer(data.answer);
    if (!answerValidation.valid) {
      errors.answer = answerValidation.error || 'Geçersiz cevap';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

// Update FAQ Validation (mevcut değerlerle birleştirilmiş)
export const validateUpdateFAQ = (
  data: UpdateFAQRequest,
  currentFAQ: { question?: string; answer?: string }
): FAQValidationResult => {
  const errors: Record<string, string> = {};
  
  // Question validation
  if (data.question !== undefined) {
    const questionValidation = validateFAQQuestion(data.question);
    if (!questionValidation.valid) {
      errors.question = questionValidation.error || 'Geçersiz soru';
    }
  }
  
  // Mevcut değerlerle birleştir
  const newAnswer = data.answer !== undefined ? data.answer : currentFAQ.answer;
  
  // Answer validation (eğer güncelleniyorsa veya mevcut değer yoksa zorunlu)
  if (data.answer !== undefined) {
    if (!newAnswer) {
      errors.answer = 'Cevap zorunludur';
    } else {
      const answerValidation = validateFAQAnswer(newAnswer);
      if (!answerValidation.valid) {
        errors.answer = answerValidation.error || 'Geçersiz cevap';
      }
    }
  } else if (!newAnswer) {
    // Eğer answer güncellenmiyorsa ama mevcut değer de yoksa hata
    errors.answer = 'Cevap zorunludur';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

