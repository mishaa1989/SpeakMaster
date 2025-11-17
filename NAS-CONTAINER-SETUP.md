# NAS Container Manager에서 실행하기

> PC에서 빌드한 Docker 이미지를 NAS Container Manager에서 실행하는 완전한 가이드입니다.

---

## 📋 사전 준비 확인

- ✅ PC에서 빌드한 `centrum-taurus.tar` 파일
- ✅ NAS에 Container Manager 설치됨
- ✅ .tar 파일이 NAS에 업로드됨 (예: `/volume1/docker/centrum-taurus/`)

---

## 1️⃣ Docker 이미지 불러오기

### SSH 방식 (추천)

1. **SSH로 NAS 접속**
   ```bash
   ssh admin@나스IP주소
   ```

2. **이미지 불러오기**
   ```bash
   cd /volume1/docker/centrum-taurus
   sudo docker load -i centrum-taurus.tar
   ```

3. **불러온 이미지 확인**
   ```bash
   sudo docker images | grep centrum-taurus
   ```
   
   출력 예시:
   ```
   centrum-taurus   latest   a1b2c3d4e5f6   10 minutes ago   500MB
   ```

### Container Manager UI 방식 (대안)

1. **Container Manager 앱 열기**

2. **좌측 메뉴 → "이미지"**

3. **"추가" → "파일에서 추가"**

4. **centrum-taurus.tar 선택**

5. **불러오기 완료 대기**

---

## 2️⃣ 환경 파일 준비

### .env 파일 생성

SSH 또는 File Station 텍스트 편집기로:

```bash
cd /volume1/docker/centrum-taurus
nano .env
```

**내용 입력:**
```env
# PostgreSQL 설정
POSTGRES_PASSWORD=강력한비밀번호여기입력
POSTGRES_PORT=5432

# 애플리케이션 설정
SESSION_SECRET=랜덤문자열32자이상여기입력
APP_PORT=5000

# 환경
NODE_ENV=production
```

**저장:** Ctrl + O → Enter → Ctrl + X

---

## 3️⃣ docker-compose.nas.yml 파일 확인

프로젝트 폴더에 `docker-compose.nas.yml` 파일이 있는지 확인:

```bash
ls -l docker-compose.nas.yml
```

없으면 Replit에서 다운로드한 파일에 포함되어 있어야 합니다.

---

## 4️⃣ Container Manager에서 프로젝트 생성

### UI 방식 (추천)

1. **Container Manager 앱 열기**

2. **좌측 메뉴 → "프로젝트"**

3. **"새로 만들기" 버튼 클릭**

4. **프로젝트 설정**
   - **프로젝트 이름**: `centrum-taurus`
   - **경로**: `/volume1/docker/centrum-taurus`
   - **소스**: "기존 docker-compose 사용"
   - **Compose 파일**: `docker-compose.nas.yml` 선택

5. **환경 변수 확인**
   - .env 파일이 자동으로 인식됨
   - 필요시 UI에서 직접 편집 가능

6. **"다음" → "완료"**

### CLI 방식 (대안)

```bash
cd /volume1/docker/centrum-taurus
sudo docker-compose -f docker-compose.nas.yml up -d
```

---

## 5️⃣ 데이터베이스 초기화

### Container Manager 터미널 사용

1. **Container Manager → 프로젝트 → centrum-taurus 선택**

2. **"컨테이너" 탭 → "centrum-taurus-app" 선택**

3. **"터미널" 탭 클릭**

4. **명령어 실행**
   ```bash
   npm run db:push
   ```

### SSH 방식

```bash
sudo docker-compose -f docker-compose.nas.yml exec app npm run db:push
```

**출력 예시:**
```
✓ Pushing schema changes to database...
✓ Tables created successfully
✓ Database initialized
```

---

## 6️⃣ 실행 확인

### 브라우저에서 접속

```
http://나스IP주소:5000
```

**예:** `http://192.168.1.100:5000`

### 확인 사항
- ✅ 로그인 페이지가 나타나면 성공!
- ✅ 최초 접속 시 관리자 비밀번호 설정 화면으로 자동 이동

---

## 7️⃣ Container Manager에서 관리

### 로그 확인

**UI:**
1. Container Manager → 프로젝트 → centrum-taurus
2. "로그" 탭

**CLI:**
```bash
sudo docker-compose -f docker-compose.nas.yml logs -f app
```

### 재시작

**UI:**
1. 프로젝트 선택
2. "작업" → "다시 시작"

**CLI:**
```bash
sudo docker-compose -f docker-compose.nas.yml restart
```

### 중지

**UI:**
1. 프로젝트 선택
2. "작업" → "중지"

**CLI:**
```bash
sudo docker-compose -f docker-compose.nas.yml down
```

---

## 8️⃣ 자동 시작 설정

### Container Manager 설정

1. **프로젝트 선택**

2. **"설정" 탭**

3. **"자동 시작" 체크**
   - NAS 재부팅 시 자동으로 시작됨

---

## 9️⃣ 외부 접속 설정 (선택)

### Reverse Proxy 설정

1. **Control Panel → 로그인 포털 → 고급**

2. **"Reverse Proxy" 탭 → "생성"**

3. **설정**
   - **설명**: Centrum Taurus
   - **소스**:
     - 프로토콜: HTTP
     - 호스트 이름: 원하는 도메인 또는 *
     - 포트: 80
   - **대상**:
     - 프로토콜: HTTP
     - 호스트 이름: localhost
     - 포트: 5000

4. **저장**

이제 `http://나스IP` 로 접속 가능!

---

## ✅ 완료!

첸트룸 타우러스 진단평가 시스템이 NAS Container Manager에서 실행 중입니다!

**접속:**
- 로컬: `http://나스IP:5000`
- Reverse Proxy 설정 시: `http://나스IP`

**관리자 로그인:**
1. 최초 접속 시 비밀번호 설정
2. 이후 `/admin/login`에서 로그인

---

## 🔧 문제 해결

### ❌ "이미지를 찾을 수 없음"
1. 이미지가 제대로 불러와졌는지 확인:
   ```bash
   sudo docker images | grep centrum-taurus
   ```
2. 없으면 1단계부터 다시 진행

### ❌ "포트 5000이 이미 사용 중"
1. `.env` 파일에서 포트 변경:
   ```env
   APP_PORT=3000
   ```
2. `docker-compose.nas.yml`에서도 포트 확인
3. 프로젝트 재시작

### ❌ "데이터베이스 연결 실패"
1. PostgreSQL 컨테이너 상태 확인:
   ```bash
   sudo docker-compose -f docker-compose.nas.yml ps
   ```
2. 모두 "Up" 상태인지 확인
3. 비밀번호 확인 (.env 파일)

### ❌ "관리자 비밀번호 설정 화면이 안 나옴"
1. 브라우저 캐시 삭제
2. 직접 접속: `http://나스IP:5000/admin/setup`

### ❌ Container Manager에서 프로젝트 생성 실패
1. docker-compose.nas.yml 파일 확인
2. .env 파일 위치 확인
3. 파일 권한 확인:
   ```bash
   sudo chmod 644 docker-compose.nas.yml
   sudo chmod 644 .env
   ```

---

## 📊 리소스 모니터링

### 메모리 사용량 확인
```bash
sudo docker stats centrum-taurus-app
```

### 디스크 사용량 확인
```bash
sudo docker system df
```

---

## 🔄 업데이트 방법

새 버전으로 업데이트하려면:

1. **PC에서 새 이미지 빌드**
2. **centrum-taurus.tar 생성**
3. **NAS에 업로드**
4. **기존 컨테이너 중지**
   ```bash
   sudo docker-compose -f docker-compose.nas.yml down
   ```
5. **새 이미지 불러오기**
   ```bash
   sudo docker load -i centrum-taurus.tar
   ```
6. **다시 시작**
   ```bash
   sudo docker-compose -f docker-compose.nas.yml up -d
   ```
