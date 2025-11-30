# Cloudtype 배포 가이드

> 첸트룸 타우러스 진단평가 시스템을 Cloudtype에 배포하는 완전한 가이드입니다.

---

## 📋 사전 준비

- ✅ Cloudtype 계정 ([cloudtype.io](https://cloudtype.io))
- ✅ GitHub 또는 Git 저장소에 코드 업로드
- ✅ PostgreSQL 데이터베이스 (Cloudtype에서 생성 가능)

---

## 1️⃣ GitHub에 코드 업로드

### Replit에서 다운로드 후 GitHub에 업로드

1. **Replit에서 다운로드**
   ```
   Tools → Download as zip
   ```

2. **GitHub에 새 저장소 생성**
   - https://github.com/new
   - 저장소 이름 입력 (예: `centrum-taurus`)

3. **코드 업로드**
   - ZIP 압축 해제
   - 모든 파일을 GitHub 저장소에 업로드

---

## 2️⃣ Cloudtype에서 PostgreSQL 생성

1. **Cloudtype 대시보드** 접속
2. **새 프로젝트 생성**
3. **서비스 추가** → **PostgreSQL** 선택
4. **생성 완료 후 연결 정보 확인:**
   - Host, Port, Database, Username, Password
   - 또는 DATABASE_URL 형식

---

## 3️⃣ Node.js 서비스 생성

### 3-1. 서비스 추가

1. **"서비스 추가"** 클릭
2. **"Node.js"** 선택
3. **GitHub 연결** → 저장소 선택

### 3-2. 빌드 설정 ⭐ (매우 중요!)

| 항목 | 값 |
|------|-----|
| **Build Command** | (아래 복사용 명령어 참조) |
| **Start Command** | `node dist/index.cjs` |
| **Port** | `5000` |

> **중요:** `npx` 대신 `./node_modules/.bin/`을 사용하여 정확히 설치된 버전을 실행합니다.

**복사용 Build Command:**
```bash
npm install && ./node_modules/.bin/vite build && ./node_modules/.bin/esbuild server/production.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/index.cjs
```

### 3-3. 환경 변수 설정

**필수 환경 변수:**

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://user:pass@host:port/db` | PostgreSQL 연결 문자열 |
| `SESSION_SECRET` | (랜덤 32자 이상) | 세션 암호화 키 |
| `NODE_ENV` | `production` | 프로덕션 환경 |
| `PORT` | `5000` | 포트 번호 |

**SESSION_SECRET 생성 방법:**
```bash
# 터미널에서 실행
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

또는 랜덤 문자열 생성 사이트 사용

---

## 4️⃣ 데이터베이스 초기화

### 방법 1: Cloudtype 터미널 사용

1. 서비스 상세 페이지 → **"터미널"** 탭
2. 명령어 실행:
   ```bash
   npm run db:push
   ```

### 방법 2: 로컬에서 실행

```bash
# DATABASE_URL을 Cloudtype PostgreSQL로 설정
export DATABASE_URL="postgresql://..."
npm run db:push
```

---

## 5️⃣ 배포 확인

### 접속 URL

배포 완료 후 Cloudtype에서 제공하는 URL로 접속:

```
https://your-app-name.cloudtype.app
```

### 확인 사항

- ✅ 메인 페이지가 나타나면 성공!
- ✅ `/admin/setup` 으로 이동하면 관리자 비밀번호 설정 화면

---

## 🔧 문제 해결

### ❌ "Cannot find module" 에러

→ Build Command가 올바른지 확인:
```bash
npm install && npx vite build && npx esbuild server/production.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/index.cjs
```

→ **`server/production.ts`** 파일이 있는지 확인 (프로덕션 전용 서버 엔트리)

### ❌ "Vite requires Node.js 20.19+ or 22.12+" 에러

→ `npm-shrinkwrap.json` 파일이 GitHub에 푸시되었는지 확인
→ 이 파일이 Vite 5.4.21 버전을 고정합니다

### ❌ "Database connection failed" 에러

→ DATABASE_URL 환경 변수 확인
→ PostgreSQL 서비스가 실행 중인지 확인

### ❌ "Port already in use" 에러

→ PORT 환경 변수가 5000인지 확인
→ Start Command가 `node dist/index.cjs`인지 확인

### ❌ 빌드 실패 (esbuild 관련)

→ 의존성 설치 확인. 모든 빌드 도구가 dependencies에 포함되어 있어야 함

### ❌ "SESSION_SECRET is not defined"

→ 환경 변수에 SESSION_SECRET 추가

---

## 📊 배포 설정 요약

| 항목 | 설정값 |
|------|--------|
| **Node.js 버전** | 20.x 또는 22.x |
| **Build Command** | `npm install && ./node_modules/.bin/vite build && ./node_modules/.bin/esbuild server/production.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/index.cjs` |
| **Start Command** | `node dist/index.cjs` |
| **Port** | `5000` |
| **환경 변수** | DATABASE_URL, SESSION_SECRET, NODE_ENV=production, PORT=5000 |
| **필수 파일** | npm-shrinkwrap.json, .npmrc, server/production.ts |

---

## 🔄 재배포 방법

코드 수정 후 GitHub에 push하면 자동으로 재배포됩니다.

수동 재배포:
1. Cloudtype 서비스 상세 페이지
2. **"재배포"** 버튼 클릭

---

## ✅ 완료!

Cloudtype에서 첸트룸 타우러스가 실행 중입니다! 🎉

**기본 접속:**
- 메인: `https://your-app.cloudtype.app`
- 관리자: `https://your-app.cloudtype.app/admin`
