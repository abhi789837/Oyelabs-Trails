import { lazy } from "react";

/**
 * Old pages shown inside the v5 shells until each is replaced (docs/v5/PLAN.md: "every other old
 * admin page is shown inside the v5 shell, unchanged"). Every one is lazy, so none of them lands in
 * a v5 learner's initial download. When a v5 screen replaces one, delete its line here and its
 * route in V5App.
 */

// Admin
export const OldAdminDepartmentsPage = lazy(() => import("@/features/admin/catalog/AdminDepartmentsPage"));
export const OldAdminOnboardPage = lazy(() => import("@/features/admin/AdminOnboardPage"));
export const OldAdminLearnerPage = lazy(() => import("@/features/admin/AdminLearnerPage"));
export const OldAdminAiPage = lazy(() => import("@/features/admin/AdminAiPage"));
export const OldAdminBankPage = lazy(() => import("@/features/admin/bank/AdminBankPage"));
export const OldAdminAiUsagePage = lazy(() => import("@/features/admin/usage/AdminAiUsagePage"));
export const OldAdminLivePage = lazy(() => import("@/features/admin/AdminLivePage"));
export const OldAdminAuditPage = lazy(() => import("@/features/admin/AdminAuditPage"));
export const OldAdminReviewsPage = lazy(() => import("@/features/admin/reviews/ReviewRequests"));
export const OldAdminSopPage = lazy(() => import("@/features/admin/AdminSopPage"));
export const OldAdminHandbookPage = lazy(() => import("@/features/admin/handbook/AdminHandbookPage"));
export const OldAdminIntegrityFeedPage = lazy(() => import("@/features/admin/AdminIntegrityFeedPage"));
export const OldAdminCurriculumPage = lazy(() => import("@/features/admin/AdminCurriculumPage"));
export const OldAdminTestItemsPage = lazy(() => import("@/features/admin/testItems/AdminTestItemsPage"));
export const OldAdminSkillGraphPage = lazy(() => import("@/features/admin/graph/AdminSkillGraphPage"));
export const OldAdminSkillGroupsPage = lazy(() => import("@/features/admin/groups/AdminSkillGroupsPage"));
export const OldAdminCoursesPage = lazy(() => import("@/features/admin/courses/AdminCoursesPage"));
export const OldAdminCourseEditorPage = lazy(() => import("@/features/admin/courses/AdminCourseEditorPage"));
export const OldAdminGeneratedPage = lazy(() => import("@/features/admin/builder/AdminGeneratedPage"));
export const OldAdminPoolPage = lazy(() => import("@/features/admin/AdminPoolPage"));
export const OldAdminIntegrityPage = lazy(() => import("@/features/admin/AdminIntegrityPage"));

// Learner pages v5 has no screen for yet (glossary, goals, role-play, old certificates).
export const OldGlossaryPage = lazy(() => import("@/features/handbook/GlossaryPage"));
export const OldFlashcardsPage = lazy(() => import("@/features/handbook/FlashcardsPage"));
export const OldClassifyPage = lazy(() => import("@/features/handbook/ClassifyPage"));
export const OldRoleplayPracticePage = lazy(() => import("@/features/roleplay/RoleplayPracticePage"));
export const OldCertificatePage = lazy(() => import("@/pages/CertificatePage"));
export const OldCapstonePage = lazy(() => import("@/features/goals/CapstonePage"));
