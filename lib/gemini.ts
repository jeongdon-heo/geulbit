import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ============ OCR: 사진 → 텍스트 인식 ============
export async function recognizeHandwriting(imageBase64: string, mimeType: string) {
  const prompt = `당신은 초등학생 손글씨 인식 전문가입니다.
이미지에서 학생이 손으로 쓴 글을 정확하게 텍스트로 변환해주세요.

규칙:
1. 학생이 쓴 그대로 변환하세요 (맞춤법 틀린 것도 그대로)
2. 줄바꿈은 원본을 최대한 유지하세요
3. 읽기 어려운 부분은 최대한 추측하되, 확신도를 표시하세요

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "fullText": "인식된 전체 텍스트",
  "segments": [
    {
      "text": "인식된 텍스트 조각",
      "confidence": 0.95
    }
  ],
  "overallConfidence": 0.85,
  "notes": "인식이 어려웠던 부분에 대한 메모"
}`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      },
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("글자 인식에 실패했습니다. 사진을 다시 확인해주세요.");
  }
}

// ============ 분석: 텍스트 → 피드백 생성 ============
export async function analyzeWriting(
  text: string,
  studentName: string,
  round: number,
  previousScores?: { spelling: number; sentence: number; structure: number; expression: number } | null
) {
  const previousContext = previousScores
    ? `\n이전 회차(${round - 1}회차) 점수: 맞춤법 ${previousScores.spelling}, 문장 ${previousScores.sentence}, 구조 ${previousScores.structure}, 표현력 ${previousScores.expression}`
    : "\n이전 분석 기록이 없습니다 (첫 회차).";

  const prompt = `당신은 대한민국 초등학교 4학년 글쓰기 전문 교사입니다.
학생 "${studentName}"이(가) 쓴 글을 분석해주세요.
이것은 ${round}회차 글쓰기입니다.${previousContext}

학생이 쓴 글:
"""
${text}
"""

아래 두 가지를 생성해주세요:

1. 교사용 상세 분석 (feedback_teacher): 객관적이고 데이터 중심
2. 학생용 피드백 편지 (feedback_student): 따뜻하고 격려하는 말투, 학생 이름 사용

평가 기준 (각 0~100점):
- spelling: 맞춤법/띄어쓰기 (한글 맞춤법 규정 기준)
- sentence: 문장 구성력 (문장 완성도, 연결 자연스러움)
- structure: 글의 구조/논리 (처음-중간-끝 짜임새)
- expression: 표현력/어휘력 (다양성, 생생함, 비유)

반드시 아래 JSON 형식으로만 응답하세요:
{
  "scores": {
    "spelling": 점수,
    "sentence": 점수,
    "structure": 점수,
    "expression": 점수
  },
  "feedback_teacher": {
    "spelling": {
      "items": [
        { "original": "틀린 표현", "corrected": "올바른 표현", "type": "맞춤법|띄어쓰기|어휘", "explanation": "설명" }
      ]
    },
    "sentence": {
      "comment": "문장 구성에 대한 분석",
      "examples": [
        { "before": "수정 전 문장", "after": "수정 후 문장 제안", "tip": "팁" }
      ]
    },
    "structure": {
      "comment": "구조 분석",
      "analysis": [
        { "part": "처음|중간|끝", "status": "good|warning", "text": "평가", "suggestion": "제안" }
      ]
    },
    "expression": {
      "comment": "표현력 분석",
      "repetitions": [
        { "word": "반복 단어", "count": 횟수, "alternatives": ["대체 표현1", "대체 표현2"] }
      ],
      "vividTips": [
        { "before": "원래 문장", "after": "생생한 문장", "explanation": "설명" }
      ]
    },
    "overall": "교사용 종합 분석 (2~3문장)"
  },
  "feedback_student": {
    "sparkle": "${studentName}에게 보내는 '오늘 글의 반짝이는 점' - 구체적 칭찬 (3~4문장, 반말 친근하게)",
    "improve": "${studentName}에게 보내는 '다음엔 이렇게 해볼까?' - 고칠 점을 따뜻하게 안내 (5~7문장). 학생의 글에서 실제 고칠 부분을 구체적으로 짚어주고, 어떻게 고치면 좋은지 예시 문장을 함께 보여줘. 핵심 포인트는 **굵게** 표시. 맞춤법/띄어쓰기, 문장 다듬기, 표현력 등 영역별로 나눠서 알려줘.",
    "heart": "선생님의 마음 - 격려와 응원 (2~3문장)"
  }
}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("글 분석에 실패했습니다. 다시 시도해주세요.");
  }
}

// ============ 학년말 총평 생성 ============
export async function generateYearendReport(
  studentName: string,
  className: string,
  writings: Array<{
    round: number;
    title: string | null;
    analyzedAt: Date;
    scoreSpelling: number;
    scoreSentence: number;
    scoreStructure: number;
    scoreExpression: number;
    scoreTotal: number;
    originalText: string;
    feedbackTeacher: any;
  }>
) {
  const writingSummaries = writings.map((w) => ({
    round: w.round,
    title: w.title,
    date: w.analyzedAt.toISOString().slice(0, 10),
    scores: {
      spelling: w.scoreSpelling,
      sentence: w.scoreSentence,
      structure: w.scoreStructure,
      expression: w.scoreExpression,
      total: w.scoreTotal,
    },
    textPreview: w.originalText.slice(0, 200),
  }));

  const first = writings[0];
  const last = writings[writings.length - 1];

  const prompt = `당신은 대한민국 초등학교 4학년 담임교사입니다.
학생 "${studentName}" (${className})의 1년간 글쓰기 성장을 종합 분석해주세요.

총 ${writings.length}회 분석 데이터:
${JSON.stringify(writingSummaries, null, 2)}

시작 점수: ${first.scoreTotal}점 → 최종 점수: ${last.scoreTotal}점 (${last.scoreTotal - first.scoreTotal}점 성장)

아래 JSON으로 응답해주세요:
{
  "report_teacher": {
    "summary": "종합 분석 (3~4문단, 교사/학부모 대상 격식체)",
    "categoryAnalysis": {
      "spelling": "맞춤법 영역 1년 변화 분석 (2~3문장)",
      "sentence": "문장력 영역 1년 변화 분석",
      "structure": "구조 영역 1년 변화 분석",
      "expression": "표현력 영역 1년 변화 분석"
    },
    "milestones": [
      { "round": 회차, "title": "글 제목", "description": "이 글이 의미있는 이유", "badge": "이모지" }
    ],
    "bestSentences": [
      { "round": 회차, "title": "글 제목", "sentence": "빛나는 문장" }
    ],
    "nextYearSuggestions": ["5학년 학습 제안 1", "제안 2", "제안 3"]
  },
  "report_student": {
    "growthStory": "${studentName}에게 보내는 1년 성장 이야기 (4~5문장, 따뜻한 반말)",
    "bestMoments": "가장 빛났던 순간들 설명 (2~3문장)",
    "improvements": [
      { "emoji": "이모지", "title": "영역", "before": "전에는 이랬는데", "after": "지금은 이렇게!" }
    ],
    "nextYearMission": ["5학년 미션 1", "미션 2", "미션 3"],
    "teacherHeart": "선생님의 1년 마무리 메시지 (3~4문장, 감동적으로)"
  }
}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Yearend Report Error:", error);
    throw new Error("학년말 총평 생성에 실패했습니다. 다시 시도해주세요.");
  }
}
