import type { Metadata } from "next";
import StudentAdmin from "./StudentAdmin";
import AdminWrongAnswers from "./AdminWrongAnswers";
import AdminGate from "./AdminGate";
import AdminStudyMaterials from "./AdminStudyMaterials";
import AdminLearningLinks from "./AdminLearningLinks";
import FeedbackReportTools from "./FeedbackReportTools";
import AdminQuizResults from "./AdminQuizResults";
import StudentLiveQuiz from "./StudentLiveQuiz";
import AdminHomeworkCompletions from "./AdminHomeworkCompletions";
import "../learning-tools.css";
import "./admin.css";
import "./admin-extra.css";
import "./admin-login-override.css";
import "./wrong-answer-admin.css";
import "./photo-analysis-extra.css";
import "./circle-progress.css";
import "./study-materials-admin.css";
import "./material-solutions-admin.css";
import "./admin-quiz.css";
import "./student-delete.css";
import "./admin-homework-live.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "학생 학습관리 | 벌교미래엔영어학원",
  description: "학생별 내신 학습기록과 학부모 피드백을 관리하는 관리자 페이지",
};

export default function AdminPage() {
  return <AdminGate><StudentAdmin /><StudentLiveQuiz /><AdminHomeworkCompletions /><AdminQuizResults /><FeedbackReportTools /><AdminLearningLinks /><AdminStudyMaterials /><AdminWrongAnswers /></AdminGate>;
}
