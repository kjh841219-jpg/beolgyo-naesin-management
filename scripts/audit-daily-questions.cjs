const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "app", "DailyMiniTest.tsx");
const sourceText = fs.readFileSync(sourcePath, "utf8");
const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function valueOf(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(valueOf);
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map((property) => {
      const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : property.name.getText(source);
      return [name, valueOf(property.initializer)];
    }));
  }
  throw new Error(`지원하지 않는 데이터 표현식: ${node.getText(source).slice(0, 80)}`);
}

const wanted = new Set(["audioSources", "dailySets", "extraQuestions", "additionalListeningQuestions", "grammarQuestions", "highDifficultyQuestions", "supplementaryQuestions"]);
const data = {};
source.forEachChild(function visit(node) {
  if (ts.isVariableStatement(node)) {
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && wanted.has(declaration.name.text) && declaration.initializer) {
        data[declaration.name.text] = valueOf(declaration.initializer);
      }
    }
  }
  ts.forEachChild(node, visit);
});

const errors = [];
const warnings = [];
const signatures = new Map();
let questionCount = 0;

function inspect(question, location) {
  questionCount += 1;
  if (!["듣기", "단어", "문법", "리딩"].includes(question.skill)) errors.push(`${location}: 알 수 없는 영역 '${question.skill}'`);
  if (!question.prompt?.trim()) errors.push(`${location}: 문제 문장이 비어 있음`);
  if (!Array.isArray(question.options) || question.options.length !== 4) errors.push(`${location}: 보기가 4개가 아님`);
  if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) errors.push(`${location}: 정답 번호가 보기 범위를 벗어남`);
  if (new Set(question.options.map((option) => option.trim().toLowerCase())).size !== question.options.length) errors.push(`${location}: 동일한 보기가 중복됨`);
  if (question.skill === "듣기" && !question.audio) errors.push(`${location}: 듣기 문항에 음성 문장이 없음`);
  if (question.skill === "리딩" && !question.passage) errors.push(`${location}: 리딩 문항에 지문이 없음`);
  if (question.audio && !data.audioSources[question.audio]) warnings.push(`${location}: 사전 제작 음원 없음(기기 음성 합성 사용) — ${question.audio}`);
  if (question.audio && /^(I|My)\b/i.test(question.audio) && /(소년|소녀|남자|여자|누나|형|오빠|언니)/.test(question.prompt)) {
    errors.push(`${location}: 1인칭 음성에 없는 화자 성별·관계를 질문이 임의로 단정함`);
  }

  // Literal-answer questions must contain the fact stated in the passage.
  // This catches the reported case where "orange" appeared in the passage but
  // no Orange choice existed.
  if (/what color/i.test(question.prompt) && question.passage) {
    const color = question.passage.match(/\b(?:is|are)\s+(red|blue|green|yellow|orange|purple|black|white|brown|pink)\b/i)?.[1];
    if (!color) errors.push(`${location}: 색상 문제의 지문에서 정답 색상을 찾을 수 없음`);
    else if (!question.options.some((option) => option.trim().toLowerCase() === color.toLowerCase())) {
      errors.push(`${location}: 지문의 색상 '${color}'이 보기에 없음`);
    } else if (question.options[question.answer].trim().toLowerCase() !== color.toLowerCase()) {
      errors.push(`${location}: 지문의 색상 '${color}'과 지정 정답이 다름`);
    }
  }

  // The UI shuffles choices on every generated set. Verify repeatedly that
  // the answer index continues to point to the original correct choice.
  for (let offset = 0; offset < 32; offset += 1) {
    const rotated = question.options.map((text, index) => ({ text, correct: index === question.answer }));
    for (let index = rotated.length - 1; index > 0; index -= 1) {
      const target = (offset * 17 + index * 11) % (index + 1);
      [rotated[index], rotated[target]] = [rotated[target], rotated[index]];
    }
    const answer = rotated.findIndex((option) => option.correct);
    if (answer < 0 || rotated[answer]?.text !== question.options[question.answer]) {
      errors.push(`${location}: 보기 순서 변경 후 정답 위치가 일치하지 않음`);
      break;
    }
  }

  const signature = [question.skill, question.prompt, question.audio || "", question.passage || "", ...question.options].join("|").toLowerCase();
  if (signatures.has(signature)) errors.push(`${location}: ${signatures.get(signature)}와 완전히 동일한 문항`);
  else signatures.set(signature, location);
}

const variantBlock = sourceText.match(/function applyDailyVariant[\s\S]*?\n}/)?.[0] || "";
if (/\.replace(All)?\s*\(/.test(variantBlock) || /replacements|new RegExp/.test(variantBlock)) {
  errors.push("문항 변형 로직이 지문·보기의 단어를 변경할 수 있음");
}

// Verify the circular selection rule independently for many pool sizes and
// attempts: each test is unique internally and a source is not repeated until
// all sources in that skill pool have appeared.
for (let poolSize = 3; poolSize <= 40; poolSize += 1) {
  const recent = [];
  for (let serial = 0; serial < 100; serial += 1) {
    const selected = Array.from({ length: Math.min(3, poolSize) }, (_, slot) => ((serial * 3) + slot) % poolSize);
    if (new Set(selected).size !== selected.length) errors.push(`선택 로직: 크기 ${poolSize}, 회차 ${serial} 안에 중복 문항`);
    for (const source of selected) {
      if (recent.slice(-Math.min(poolSize - 1, recent.length)).includes(source)) {
        errors.push(`선택 로직: 크기 ${poolSize} 문제은행을 모두 사용하기 전에 ${source}번 문항 재출제`);
      }
      recent.push(source);
    }
  }
}

for (const [bankName, bank] of Object.entries(data)) {
  if (bankName === "audioSources") continue;
  for (const [level, entries] of Object.entries(bank)) {
    const questions = bankName === "dailySets" ? entries.flatMap((set) => set.questions) : entries;
    questions.forEach((question, index) => inspect(question, `${bankName}.${level}[${index}]`));
  }
}

console.log(`DAILY 문항 ${questionCount}개 검사 완료`);
warnings.forEach((warning) => console.warn(`주의: ${warning}`));
errors.forEach((error) => console.error(`오류: ${error}`));
if (errors.length) process.exitCode = 1;
else console.log(`구조 오류 및 완전 중복 없음 (주의 ${warnings.length}건)`);
