import { Role, StageStatus, ValidationType } from "./enums.js";

export interface UserSummary {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: Role;
  cohort: string | null;
  cliToken: string;
  trainingRepoId: number | null;
}

export interface StageSummary {
  id: string;
  slug: string;
  stepNumber: number;
  title: string;
  trackSlug: string;
  trackTitle: string;
  validationType: ValidationType;
}

export interface StageDetail extends StageSummary {
  theoryMd: string;
  missionMd: string;
  hints: string[];
  status: StageStatus;
  attempts: number;
  completedAt: string | null;
  unlockedHints: string[];
}

export interface TrackSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  stages: StageDetail[];
}

// ==========================================
// CLI <-> Backend Protocol DTOs
// ==========================================

export interface CliAuthResponse {
  valid: boolean;
  user?: UserSummary;
  currentStage?: StageSummary;
  error?: string;
}

export interface CliSubmissionRequest {
  stageSlug: string;
  passed: boolean;
  feedbackMsg: string;
  rawLogs?: string;
}

export interface CliSubmissionResponse {
  success: boolean;
  passed: boolean;
  attempts: number;
  feedbackMsg: string;
  unlockedNextStage?: StageSummary | null;
  error?: string;
}

// ==========================================
// GitLab Cloud Validation Engine DTOs
// ==========================================

export interface GitLabValidationRequest {
  stageSlug: string;
}

export interface GitLabValidationResponse {
  passed: boolean;
  feedbackMsg: string;
  rawLogs?: string;
  unlockedNextStageSlug?: string | null;
}

// ==========================================
// Admin Tracking Matrix DTOs (RF11, RF12)
// ==========================================

export interface MatrixStageColumn {
  slug: string;
  stepNumber: number;
  title: string;
  trackOrder: number;
  trackTitle?: string;
  trackSlug?: string;
}

export interface MatrixUserProgressCell {
  stageSlug: string;
  status: StageStatus;
  attempts: number;
  completedAt: string | null;
  hasCriticalFailures: boolean; // >= 3 attempts without success
}

export interface MatrixUserRow {
  userId: string;
  name: string | null;
  email: string;
  gitlabUsername: string | null;
  avatarUrl: string | null;
  role: Role;
  cohort: string | null;
  stages: Record<string, MatrixUserProgressCell>;
}

export interface AdminMatrixResponse {
  cohorts: string[];
  currentCohort: string | null;
  stages: MatrixStageColumn[];
  trainees: MatrixUserRow[];
  members: MatrixUserRow[];
}
