export const studyWeekPlans=[
 {week:"1주차",stage:"4주 전 · 기초 정리",title:"첫 번째 단원",tasks:["단어 암기","대화문 암기","본문 암기"]},
 {week:"2주차",stage:"3주 전 · 본문 암기·서술형",title:"첫 번째 단원",tasks:["문법 설명","문법 정리","문제풀이","오답노트"]},
 {week:"3주차",stage:"2주 전 · 실전 서술형",title:"두 번째 단원 및 교과서 외부지문",tasks:["단어 암기","대화문 암기","본문 암기"]},
 {week:"4주차",stage:"1주 전 · 최종 마무리",title:"두 번째 단원 및 마지막 점검",tasks:["문법 설명","문법 정리","문제풀이","오답노트","학교 프린트물 점검"]},
] as const;

export const fullStudyWeekPlan=studyWeekPlans.map(item=>`${item.week} ${item.title}: ${item.tasks.join(" · ")}`).join("\n");
export function planForStage(stage?:string){const item=studyWeekPlans.find(plan=>plan.stage===stage);return item?`${item.week} ${item.title}: ${item.tasks.join(" · ")}`:"주차별 계획을 확인하며 학습합니다."}
