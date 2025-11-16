# 첸트룸 타우러스 NAS 배포 가이드

> Synology NAS에 첸트룸 타우러스 진단평가 시스템을 배포하는 완전한 가이드입니다.

## 📋 필수 요구사항

- **Synology NAS** (DSM 7.0 이상)
- **Container Manager** (또는 Docker) 패키지 설치됨
- **최소 1GB 여유 RAM**
- **최소 2GB 여유 저장 공간**

---

## 🚀 빠른 시작 (5분 설정)

### 1단계: 프로젝트 다운로드

1. Replit에서 좌측 **"Tools"** → **"Download as zip"** 클릭
2. `centrum-taurus.zip` 파일 다운로드

### 2단계: NAS에 업로드

1. **File Station** 열기
2. 공유 폴더 선택 (예: `/docker` 또는 `/web`)
3. **centrum-taurus** 폴더 생성
4. ZIP 파일 업로드 후 압축 해제

### 3단계: 환경 변수 설정

1. `.env.example` 파일을 `.env`로 복사
2. `.env` 파일 편집:
   ```env
   POSTGRES_PASSWORD=강력한비밀번호여기입력
   SESSION_SECRET=랜덤문자열32자이상
   APP_PORT=5000
   ```

### 4단계: Container Manager에서 실행

**방법 A: UI 사용 (추천)**

1. **Container Manager** 앱 열기
2. 좌측 메뉴에서 **"프로젝트"** 클릭
3. **"새로 만들기"** 버튼 클릭
4. 프로젝트 이름: `centrum-taurus`
5. 경로: `/volume1/docker/centrum-taurus` (업로드한 폴더)
6. **"다음"** 클릭 (docker-compose.yml 자동 인식됨)
7. **"완료"** 클릭

**방법 B: SSH 사용**

```bash
# SSH로 NAS 접속
ssh admin@나스IP주소

# 프로젝트 폴더로 이동
cd /volume1/docker/centrum-taurus

# .env 파일 생성 및 편집
cp .env.example .env
nano .env  # 비밀번호 수정

# Docker Compose 실행
sudo docker-compose up -d
```

### 5단계: 데이터베이스 초기화

```bash
# Container Manager 터미널 또는 SSH에서
sudo docker-compose exec app npm run db:push
```

### 6단계: 접속 확인

브라우저에서 `http://나스IP주소:5000` 접속

- ✅ 로그인 페이지가 나타나면 성공!
- ✅ 최초 접속 시 관리자 비밀번호 설정 화면으로 자동 이동

---

## 방법 1: Docker 사용 (권장)

### Container Manager에서 관리

**로그 확인:**
1. Container Manager → 프로젝트 → `centrum-taurus` 선택
2. "로그" 탭에서 실시간 로그 확인

**재시작:**
1. 프로젝트 선택
2. "작업" → "다시 시작"

**중지:**
1. 프로젝트 선택
2. "작업" → "중지"

**CLI 관리 명령어:**
```bash
# 로그 확인
sudo docker-compose logs -f app

# 애플리케이션만 재시작
sudo docker-compose restart app

# 전체 재시작
sudo docker-compose restart

# 중지
sudo docker-compose down

# 중지 및 데이터 삭제 (주의!)
sudo docker-compose down -v
```

---

## 방법 2: 직접 Node.js 실행

### 사전 요구사항
- Node.js 20.x 이상
- PostgreSQL 15 이상

### 배포 단계

1. **PostgreSQL 데이터베이스 생성**
   ```sql
   CREATE DATABASE centrum_taurus;
   CREATE USER centrum_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE centrum_taurus TO centrum_user;
   ```

2. **환경 변수 파일 생성**
   `.env` 파일 생성:
   ```bash
   DATABASE_URL=postgresql://centrum_user:your_password@localhost:5432/centrum_taurus
   SESSION_SECRET=your_random_secret_key_here
   NODE_ENV=production
   PORT=5000
   ```

3. **의존성 설치**
   ```bash
   npm install
   ```

4. **데이터베이스 마이그레이션**
   ```bash
   npm run db:push
   ```

5. **애플리케이션 시작**
   ```bash
   # 직접 실행
   npm start

   # 또는 PM2 사용 (권장)
   npm install -g pm2
   pm2 start npm --name "centrum-taurus" -- start
   pm2 save
   pm2 startup
   ```

### PM2 관리 명령어
```bash
# 상태 확인
pm2 status

# 로그 확인
pm2 logs centrum-taurus

# 재시작
pm2 restart centrum-taurus

# 중지
pm2 stop centrum-taurus
```

---

## 역방향 프록시 설정 (선택사항)

### Nginx 설정 예시
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔧 문제 해결

### ❌ "포트 5000이 이미 사용 중입니다"

`.env` 파일에서 포트 변경:
```env
APP_PORT=3000
```

또는 실행 중인 다른 서비스 확인:
```bash
sudo netstat -tulpn | grep 5000
```

### ❌ "데이터베이스 연결 실패"

1. **PostgreSQL 컨테이너 상태 확인:**
   ```bash
   sudo docker-compose ps
   ```
   
2. **PostgreSQL 로그 확인:**
   ```bash
   sudo docker-compose logs postgres
   ```

3. **비밀번호 확인:**
   - `.env` 파일의 `POSTGRES_PASSWORD` 확인
   - `docker-compose.yml`과 일치하는지 확인

### ❌ "Container Manager에서 프로젝트가 시작되지 않음"

1. **로그 확인:**
   - Container Manager → 프로젝트 → 로그 탭
   
2. **빌드 다시 실행:**
   ```bash
   cd /volume1/docker/centrum-taurus
   sudo docker-compose build --no-cache
   sudo docker-compose up -d
   ```

### ❌ "관리자 비밀번호 설정 화면이 안 나옴"

1. **브라우저 캐시 삭제** 후 다시 접속
2. **직접 설정 페이지로 이동:**
   `http://나스IP:5000/admin/setup`

### ❌ "파일 업로드가 안 됨"

MP3 파일 업로드는 기본적으로 제한이 없지만, Reverse Proxy(Nginx) 사용 시:

1. **Application Portal 설정에서:**
   - Custom Header 추가: `client_max_body_size 100M;`

2. **또는 직접 포트 접속:**
   - `http://나스IP:5000` (Reverse Proxy 우회)

---

## 백업

### 데이터베이스 백업
```bash
# Docker 사용 시
docker-compose exec postgres pg_dump -U postgres centrum_taurus > backup.sql

# 직접 설치 시
pg_dump -U centrum_user centrum_taurus > backup.sql
```

### 데이터베이스 복원
```bash
# Docker 사용 시
docker-compose exec -T postgres psql -U postgres centrum_taurus < backup.sql

# 직접 설치 시
psql -U centrum_user centrum_taurus < backup.sql
```

---

## 보안 권장사항

1. **강력한 비밀번호 사용**
   - DATABASE_URL의 비밀번호
   - SESSION_SECRET (최소 32자 이상의 랜덤 문자열)

2. **방화벽 설정**
   - 필요한 포트만 개방 (5000 또는 80/443)
   - PostgreSQL 포트(5432)는 외부 접근 차단

3. **정기적인 업데이트**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

4. **HTTPS 사용 (Let's Encrypt)**
   ```bash
   # Certbot 설치 후
   certbot --nginx -d your-domain.com
   ```
