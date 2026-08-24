import type { Metadata } from "next";
import StudentStudyLog from "./StudentPortal";
import WrongAnswerNotebook from "./WrongAnswerNotebook";
import StudentStudyMaterials from "./StudentStudyMaterials";
import StudentLearningLinks from "./StudentLearningLinks";
import LearningResultUpload from "./LearningResultUpload";
import HomeworkCompletion from "./HomeworkCompletion";
import "../learning-tools.css";
import "./study-log.css";
import "./study-dashboard.css";
import "./study-analysis.css";
import "./study-login-override.css";
import "./wrong-answer.css";
import "./study-materials.css";
import "./material-solving.css";
import "./homework-completion.css";

export const metadata: Metadata = { title: "나의 내신 학습기록 | 벌교미래엔영어학원", description: "오늘 공부한 내용을 직접 확인하고 다음 학습을 계획하는 학생용 내신 학습기록표" };
export default function StudyLogPage(){return <><StudentStudyLog/><HomeworkCompletion/><StudentLearningLinks/><StudentStudyMaterials/><LearningResultUpload/><WrongAnswerNotebook/></>}
