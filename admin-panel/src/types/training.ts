// Training types - shared/types/training.ts'den import edilebilir ama admin panel için ayrı tanım
import type {
  Training,
  Lesson,
  VideoContent,
  DocumentContent,
  TestContent,
  Content,
  ContentType,
  VideoSource,
  TestQuestion,
  TestOption,
  CreateTrainingRequest,
  UpdateTrainingRequest,
  CreateLessonRequest,
  UpdateLessonRequest,
  CreateVideoContentRequest,
  UpdateVideoContentRequest,
  CreateDocumentContentRequest,
  UpdateDocumentContentRequest,
  CreateTestContentRequest,
  UpdateTestContentRequest,
  BulkTrainingAction,
  BulkTrainingActionRequest,
  BulkTrainingActionResult,
} from '@shared/types/training';

export type {
  Training,
  Lesson,
  VideoContent,
  DocumentContent,
  TestContent,
  Content,
  ContentType,
  VideoSource,
  TestQuestion,
  TestOption,
  CreateTrainingRequest,
  UpdateTrainingRequest,
  CreateLessonRequest,
  UpdateLessonRequest,
  CreateVideoContentRequest,
  UpdateVideoContentRequest,
  CreateDocumentContentRequest,
  UpdateDocumentContentRequest,
  CreateTestContentRequest,
  UpdateTestContentRequest,
  BulkTrainingAction,
  BulkTrainingActionRequest,
  BulkTrainingActionResult,
};

export interface TrainingListResponse {
  trainings: Training[];
  total?: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface LessonListResponse {
  lessons: Lesson[];
}

export interface ContentListResponse {
  contents: Content[];
}

export interface VideoListResponse {
  videos: VideoContent[];
}

export interface DocumentListResponse {
  documents: DocumentContent[];
}

export interface TestListResponse {
  tests: TestContent[];
}

