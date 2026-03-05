# ✏️ 글빛 (GeulBit)

**글쓰기가 빛나게 성장한다** — 초등학생의 글쓰기를 AI(Gemini 2.0 Flash)로 분석하고, 성장을 추적하는 교육 도구입니다.

## 주요 기능

- 📷 **사진 → AI 글자 인식** (손글씨 OCR)
- 👩‍🏫 **선생님 확인/수정 단계** (인식 오류 교정)
- 🤖 **AI 글쓰기 분석** (맞춤법, 문장력, 구조, 표현력)
- 📊 **교사용 상세 보고서** + 💌 **학생용 따뜻한 피드백 카드**
- 📈 **학생별 성장 추적** (회차별 점수 변화)
- 📋 **학년말 종합 보고서** (1년 성장 총평)
- 🔑 **초대 코드 기반** 교사 가입 (다중 교사 지원)

## 기술 스택

| 항목 | 기술 |
|------|------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | Next.js API Routes |
| DB | PostgreSQL (Railway) |
| AI | Google Gemini 2.0 Flash |
| 인증 | NextAuth.js + 초대 코드 |
| 배포 | Vercel (프론트) + Railway (DB) |

---

## 🚀 설치 & 실행 가이드

### 1단계: Railway에서 PostgreSQL 생성

1. [Railway](https://railway.app) 접속 → 로그인
2. **New Project** → **Add PostgreSQL**
3. Variables 탭에서 `DATABASE_URL` 복사

### 2단계: Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/apikey) 접속
2. **Create API Key** 클릭
3. 생성된 키 복사

### 3단계: 프로젝트 설정

```bash
# 프로젝트 클론 또는 다운로드
cd geulbit

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
```

`.env.local` 파일을 열고 값 채우기:

```
DATABASE_URL="railway에서 복사한 URL"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="openssl rand -base64 32 로 생성"
GEMINI_API_KEY="구글에서 복사한 키"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="관리자비밀번호"
ADMIN_NAME="관리자이름"
```

### 4단계: DB 초기화 & 실행

```bash
# DB 테이블 생성
npx prisma db push

# 관리자 계정 + 초기 초대 코드 생성
npm run db:seed

# 개발 서버 실행
npm run dev
```

→ http://localhost:3000 에서 확인!

### 5단계: Vercel 배포

```bash
# Vercel CLI 설치 (처음 한 번)
npm i -g vercel

# 배포
vercel

# 환경변수 설정 (Vercel 대시보드에서)
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, GEMINI_API_KEY 추가
```

---

## 📖 사용법

### 관리자 (처음 한 번)
1. `/admin` 접속 → 초대 코드 생성
2. 코드를 다른 선생님에게 공유

### 교사
1. 초대 코드로 가입 → 로그인
2. 학급 생성 (예: "4학년 1반")
3. 학생 등록 (번호, 이름)
4. 학생 선택 → 📷 분석 → 사진 업로드
5. AI 인식 결과 확인/수정 → 분석 진행
6. 교사용 보고서 확인 & 학생용 카드 인쇄
7. 학년말: 종합 보고서 생성

---

## 💰 예상 운영 비용

| 규모 | 월 비용 |
|------|---------|
| 1학급 (25명) | ~3,000원 |
| 10학급 | ~19,000원 |
| 100학급 | ~110,000원 |

---

## 📂 프로젝트 구조

```
geulbit/
├── app/
│   ├── (auth)/login, register    # 인증 페이지
│   ├── dashboard/                # 메인 대시보드
│   │   └── students/[id]/        # 학생 상세 + 분석
│   ├── admin/                    # 관리자 페이지
│   ├── reports/yearend/          # 학년말 총평
│   └── api/                      # API 라우트
├── components/                   # 공용 컴포넌트
├── lib/
│   ├── auth.ts                   # NextAuth 설정
│   ├── gemini.ts                 # Gemini API 래퍼
│   └── prisma.ts                 # DB 클라이언트
└── prisma/
    ├── schema.prisma             # DB 스키마
    └── seed.ts                   # 초기 데이터
```

## 라이선스

MIT License
