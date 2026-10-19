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
import AdminHomeworkSubmissions from "./AdminHomeworkSubmissions";
import AdminResourceSubmissions from "./AdminResourceSubmissions";
import AdminStudentMirror from "./AdminStudentMirror";
import "../learning-tools.css";
import "./admin.css";
import "./admin-extra.css";
import "./admin-login-override.css";
import "./admin-practice-login.css";
import "./wrong-answer-admin.css";
import "./photo-analysis-extra.css";
import "./kakao-share.css";
import "./photo-name-visibility.css";
import "./photo-homework-layout.css";
import "./circle-progress.css";
import "./study-materials-admin.css";
import "./material-solutions-admin.css";
import "./admin-quiz.css";
import "./student-delete.css";
import "./admin-homework-live.css";
import "./live-rings.css";
import "./floating-report.css";
import "./student-login-controls.css";
import "./feedback-formation.css";
import "./admin-submissions.css";
import "./admin-resource-results.css";
import "./resource-assignment-state.css";
import "./resource-upload-progress.css";
import "./student-mirror.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "학생 학습관리 | 벌교미래엔영어학원",
  description: "학생별 내신 학습기록과 학부모 피드백을 관리하는 관리자 페이지",
};

export default function AdminPage() {
  return <AdminGate><StudentAdmin /><FeedbackReportTools /><AdminStudentMirror /><StudentLiveQuiz /><AdminHomeworkSubmissions /><AdminWrongAnswers /><AdminHomeworkCompletions /><AdminQuizResults /><AdminLearningLinks /><AdminResourceSubmissions /><AdminStudyMaterials /></AdminGate>;
}
