/**
 * Zod Schemas — API response validasyonu.
 *
 * Güvenilmeyen kaynaklardan (API) gelen verilerin runtime'da
 * doğrulanmasını sağlar. Yanlış/eksik veri uygulamayı çökertmek
 * yerine anlamlı hata mesajlarına dönüştürülür.
 */
import { z } from 'zod';

// ─── Ortak Yardımcılar ───────────────────────────────────────────────────────

/** Firestore Timestamp veya ISO string olarak gelebilen tarih */
const ApiDateSchema = z.union([
  z.string(),
  z.object({ _seconds: z.number(), _nanoseconds: z.number() }),
  z.object({ seconds: z.number(), nanoseconds: z.number() }),
]).optional().nullable();

// ─── User Schema ──────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  kadroUnvani: z.string().optional().nullable(),
  tcKimlikNo: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  kurumSicil: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  branchName: z.string().optional().nullable(),
  profileImageUrl: z.string().optional().nullable(),
  hasAcceptedKvkk: z.boolean().optional().nullable(),
  hasAcceptedTerms: z.boolean().optional().nullable(),
  isMemberOfOtherUnion: z.boolean().optional().nullable(),
  registrationStep: z.string().optional().nullable(),
  displayName: z.string().optional().nullable(),
  createdAt: ApiDateSchema,
  updatedAt: ApiDateSchema,
}).passthrough(); // Backend'den gelen ek alanları yutma

// ─── Auth Response Schemas ────────────────────────────────────────────────────

export const GetCurrentUserResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    user: UserSchema,
  }),
});

export const RegisterBasicResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    uid: z.string(),
    email: z.string(),
    customToken: z.string().optional().nullable(),
    nextStep: z.string().optional().nullable(),
  }),
});

export const RegisterDetailsResponseSchema = z.object({
  success: z.boolean(),
  data: UserSchema,
});

// ─── Training Schema ──────────────────────────────────────────────────────────

export const TrainingSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  lessonsCount: z.number().optional().nullable(),
  isPublished: z.boolean().optional().default(false),
  order: z.number().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
}).passthrough();

export const GetTrainingsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    trainings: z.array(TrainingSchema),
    total: z.number().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    hasMore: z.boolean().optional(),
  }),
});

// ─── Announcement Schema ──────────────────────────────────────────────────────

export const AnnouncementSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  content: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  isPublished: z.boolean().optional().default(false),
  priority: z.string().optional().nullable(),
  isFeatured: z.boolean().optional().nullable(),
  createdAt: ApiDateSchema,
  updatedAt: ApiDateSchema,
  publishedAt: ApiDateSchema,
}).passthrough();

export const GetAnnouncementsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    announcements: z.array(AnnouncementSchema),
    total: z.number().optional(),
    hasMore: z.boolean().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
  }),
});

// ─── Genel success response ───────────────────────────────────────────────────

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});
