# 첸트룸 타우러스 진단평가 시스템

외국어 구술 능력 진단 평가를 위한 웹 기반 학습 관리 시스템입니다.

## 🎯 주요 기능

### 관리자 기능
- ✅ MP3 음성 파일 업로드 (1-50개)
- ✅ 테스트 세트 생성 및 관리
- ✅ 언어별 테스트 구분 (영어, 중국어, 러시아어, 독일어, 프랑스어)
- ✅ 학생 제출물 다운로드 (ZIP 파일)
- ✅ 관리자 비밀번호 보안 (bcrypt 암호화)

### 학생 기능
- ✅ 언어 선택 후 해당 테스트 자동 필터링
- ✅ 완전 자동화된 테스트 진행
  - 한 번 클릭 시: 문제 2회 재생 + 동시 녹음 + 자동 다음 문제 이동
- ✅ 이름 입력 및 녹음 파일 자동 저장

## 🚀 NAS 서버 배포

### ⚠️ 중요: NAS 성능 이슈 해결

NAS에서 직접 빌드 시 `npm ci`에서 멈추는 문제가 있습니다.  
**해결책:** PC에서 Docker 이미지를 빌드한 후 NAS로 전송하세요.

### 방법 1: PC에서 빌드 (권장 ⭐)

**NAS 성능이 부족하거나 빌드가 멈추는 경우**

1. **Replit에서 다운로드**
   ```
   Tools → Download as zip
   ```

2. **PC에서 Docker 이미지 빌드**
   
   **Windows:**
   ```powershell
   # 프로젝트 폴더에서
   .\build-for-nas.bat
   ```
   
   **macOS/Linux:**
   ```bash
   # 프로젝트 폴더에서
   chmod +x build-for-nas.sh
   ./build-for-nas.sh
   ```
   
   → `centrum-taurus.tar` 파일 생성 (약 500MB)

3. **NAS로 TAR 파일 업로드**
   - File Station으로 `/volume1/docker/centrum-taurus/` 폴더에 업로드

4. **NAS Container Manager에서 실행**
   - 상세 가이드: **[PC-DOCKER-BUILD.md](./PC-DOCKER-BUILD.md)** ← PC 빌드 방법
   - 상세 가이드: **[NAS-CONTAINER-SETUP.md](./NAS-CONTAINER-SETUP.md)** ← NAS 실행 방법

### 방법 2: NAS에서 직접 빌드 (고성능 NAS 전용)

**NAS 성능이 충분한 경우에만 사용**

1. **Replit에서 다운로드**
   ```
   Tools → Download as zip
   ```

2. **NAS에 업로드**
   - File Station에서 압축 해제
   - 예: `/volume1/docker/centrum-taurus`

3. **환경 설정**
   ```bash
   cp .env.example .env
   # .env 파일에서 비밀번호 수정
   ```

4. **Container Manager에서 실행**
   - 프로젝트 → 새로 만들기
   - 경로 선택 → `docker-compose.yml` 사용
   - 완료 (빌드 10-30분 소요)

5. **데이터베이스 초기화**
   ```bash
   sudo docker-compose exec app npm run db:push
   ```

6. **접속**
   ```
   http://나스IP:5000
   ```

**일반 배포 가이드:** [`NAS-DEPLOYMENT.md`](./NAS-DEPLOYMENT.md) 참조

## 💻 개발 환경

### 기술 스택
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL 15 (Neon serverless)
- **ORM:** Drizzle ORM
- **인증:** bcrypt, express-session
- **파일 처리:** Multer, Archiver

### 로컬 개발 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 DATABASE_URL 등 설정

# 데이터베이스 마이그레이션
npm run db:push

# 개발 서버 실행
npm run dev
```

개발 서버: `http://localhost:5000`

## 📁 프로젝트 구조

```
centrum-taurus/
├── client/                 # React 프론트엔드
│   └── src/
│       ├── components/     # UI 컴포넌트
│       ├── pages/          # 페이지 컴포넌트
│       └── lib/            # 유틸리티
├── server/                 # Express 백엔드
│   ├── index.ts           # 서버 엔트리 포인트
│   ├── routes.ts          # API 라우트
│   ├── storage.ts         # 데이터 저장 인터페이스
│   └── db.ts              # 데이터베이스 연결
├── shared/                 # 공유 타입 및 스키마
│   └── schema.ts          # Drizzle 스키마
├── docker-compose.yml      # Docker 구성
├── Dockerfile             # 컨테이너 이미지
└── NAS-DEPLOYMENT.md      # NAS 배포 가이드
```

## 🔐 보안

- ✅ 관리자 비밀번호: bcrypt 해싱 (10 rounds)
- ✅ 세션 기반 인증 (24시간 쿠키)
- ✅ 환경 변수로 민감 정보 관리
- ✅ PostgreSQL 연결 암호화

## 📝 라이센스

MIT License

## 🤝 지원

문제가 발생하면 [`NAS-DEPLOYMENT.md`](./NAS-DEPLOYMENT.md)의 "문제 해결" 섹션을 참조하세요.
