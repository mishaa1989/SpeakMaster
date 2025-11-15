# NAS 배포 가이드

## 방법 1: Docker 사용 (권장)

### 사전 요구사항
- Docker 및 Docker Compose 설치
- 포트 5000 사용 가능

### 배포 단계

1. **프로젝트 파일을 NAS로 복사**
   ```bash
   # ZIP 파일을 압축 해제하거나 Git clone
   unzip centrum-taurus.zip
   cd centrum-taurus
   ```

2. **환경 변수 설정**
   `docker-compose.yml` 파일에서 다음을 변경:
   - `your_secure_password_here` → 강력한 비밀번호로 변경
   - `change_this_to_random_secret_key` → 랜덤한 문자열로 변경

3. **Docker 컨테이너 실행**
   ```bash
   docker-compose up -d
   ```

4. **데이터베이스 마이그레이션**
   ```bash
   docker-compose exec app npm run db:push
   ```

5. **접속**
   - 브라우저에서 `http://your-nas-ip:5000` 접속
   - 최초 실행 시 `/admin/login`에서 관리자 비밀번호 설정

### 관리 명령어
```bash
# 로그 확인
docker-compose logs -f app

# 컨테이너 재시작
docker-compose restart

# 컨테이너 중지
docker-compose down

# 컨테이너 중지 및 데이터 삭제
docker-compose down -v
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

## 문제 해결

### 포트가 이미 사용 중인 경우
`docker-compose.yml` 또는 `.env`에서 PORT 변경:
```yaml
ports:
  - "3000:5000"  # 외부:내부
```

### 데이터베이스 연결 실패
1. PostgreSQL이 실행 중인지 확인
2. DATABASE_URL이 정확한지 확인
3. 방화벽 설정 확인

### 파일 업로드 용량 제한
Nginx를 사용하는 경우:
```nginx
client_max_body_size 100M;
```

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
