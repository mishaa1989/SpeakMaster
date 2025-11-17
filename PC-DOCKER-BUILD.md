# PC에서 Docker 이미지 빌드하기

> NAS Container Manager에서 실행할 Docker 이미지를 PC에서 빌드하는 완전한 가이드입니다.

---

## 📋 사전 준비

### 필요한 것
- ✅ Windows 10/11 또는 macOS
- ✅ 최소 5GB 여유 디스크 공간
- ✅ 인터넷 연결
- ✅ 프로젝트 파일 (Replit에서 다운로드한 ZIP)

---

## 1️⃣ Docker Desktop 설치

### Windows 사용자

1. **Docker Desktop 다운로드**
   - 링크: https://www.docker.com/products/docker-desktop/
   - "Download for Windows" 클릭

2. **설치 실행**
   - 다운로드한 `Docker Desktop Installer.exe` 실행
   - "Use WSL 2 instead of Hyper-V" 체크 (권장)
   - 설치 완료 후 재부팅

3. **설치 확인**
   - 작업 표시줄에서 Docker 아이콘 확인 (고래 모양)
   - PowerShell 또는 명령 프롬프트 열기
   ```powershell
   docker --version
   ```
   - 버전 정보가 나오면 성공!

### macOS 사용자

1. **Docker Desktop 다운로드**
   - 링크: https://www.docker.com/products/docker-desktop/
   - Intel Mac: "Download for Mac (Intel chip)"
   - M1/M2/M3 Mac: "Download for Mac (Apple silicon)"

2. **설치 실행**
   - 다운로드한 `.dmg` 파일 실행
   - Docker.app을 Applications 폴더로 드래그
   - Applications에서 Docker 실행

3. **설치 확인**
   - 상단 메뉴 바에서 Docker 아이콘 확인
   - 터미널 열기
   ```bash
   docker --version
   ```
   - 버전 정보가 나오면 성공!

---

## 2️⃣ 프로젝트 파일 준비

1. **ZIP 파일 압축 해제**
   ```
   centrum-taurus.zip → centrum-taurus 폴더
   ```

2. **폴더 위치 확인**
   - Windows: 예) `C:\Users\사용자명\Downloads\centrum-taurus`
   - macOS: 예) `/Users/사용자명/Downloads/centrum-taurus`

---

## 3️⃣ Docker 이미지 빌드

### Windows (PowerShell)

1. **PowerShell 열기**
   - 시작 메뉴 → "PowerShell" 검색 → 우클릭 → "관리자 권한으로 실행"

2. **프로젝트 폴더로 이동**
   ```powershell
   cd C:\Users\사용자명\Downloads\centrum-taurus
   ```
   > 💡 팁: 폴더를 PowerShell 창에 드래그하면 경로가 자동 입력됩니다!

3. **Docker 이미지 빌드 시작**
   ```powershell
   docker build -t centrum-taurus:latest .
   ```
   
   **예상 시간: 5-10분**
   
   진행 상황:
   ```
   [+] Building 234.5s (15/15) FINISHED
   => [internal] load build definition
   => [internal] load .dockerignore
   => [builder 1/6] FROM node:20-alpine
   => [builder 2/6] COPY package*.json ./
   => [builder 3/6] RUN npm ci
   => [builder 4/6] COPY . .
   => [builder 5/6] RUN npm run build
   ...
   => => naming to docker.io/library/centrum-taurus:latest
   ```

4. **빌드 완료 확인**
   ```powershell
   docker images | findstr centrum-taurus
   ```
   
   출력 예시:
   ```
   centrum-taurus   latest   a1b2c3d4e5f6   2 minutes ago   500MB
   ```

### macOS (터미널)

1. **터미널 열기**
   - Spotlight (⌘ + Space) → "터미널" 입력 → 실행

2. **프로젝트 폴더로 이동**
   ```bash
   cd ~/Downloads/centrum-taurus
   ```

3. **Docker 이미지 빌드 시작**
   ```bash
   docker build -t centrum-taurus:latest .
   ```
   
   **예상 시간: 5-10분**

4. **빌드 완료 확인**
   ```bash
   docker images | grep centrum-taurus
   ```

---

## 4️⃣ 이미지를 파일로 저장 (.tar)

### Windows

```powershell
docker save centrum-taurus:latest -o centrum-taurus.tar
```

**파일 저장 위치 확인:**
```powershell
dir centrum-taurus.tar
```

출력 예시:
```
    디렉터리: C:\Users\사용자명\Downloads\centrum-taurus

2025-01-17  오후 11:30        524,288,000 centrum-taurus.tar
```

### macOS

```bash
docker save centrum-taurus:latest -o centrum-taurus.tar
```

**파일 저장 위치 확인:**
```bash
ls -lh centrum-taurus.tar
```

출력 예시:
```
-rw-r--r--  1 user  staff   500M Jan 17 23:30 centrum-taurus.tar
```

---

## 5️⃣ 파일 크기 및 검증

### 예상 파일 크기
- **centrum-taurus.tar**: 약 500MB ~ 1GB

### 파일이 제대로 생성되었는지 확인

**Windows:**
```powershell
# 파일 크기가 100MB 이상이면 정상
(Get-Item centrum-taurus.tar).length / 1MB
```

**macOS:**
```bash
# 파일 크기가 100MB 이상이면 정상
du -h centrum-taurus.tar
```

---

## 6️⃣ NAS로 파일 전송

### 방법 1: File Station 사용 (권장)

1. **브라우저에서 NAS 접속**
   - 주소: `http://나스IP주소:5000`

2. **File Station 열기**

3. **업로드할 폴더 생성**
   - 예: `/volume1/docker/centrum-taurus`

4. **centrum-taurus.tar 업로드**
   - "업로드" 버튼 클릭
   - 파일 선택
   - 업로드 완료 대기 (크기에 따라 1-5분)

### 방법 2: SCP 사용 (고급)

**Windows (PowerShell):**
```powershell
scp centrum-taurus.tar admin@나스IP:/volume1/docker/centrum-taurus/
```

**macOS (터미널):**
```bash
scp centrum-taurus.tar admin@나스IP:/volume1/docker/centrum-taurus/
```

---

## ✅ 완료!

이제 다음 단계로 진행하세요:
👉 **[NAS-CONTAINER-SETUP.md](./NAS-CONTAINER-SETUP.md)** - NAS Container Manager에서 실행하기

---

## 🔧 문제 해결

### ❌ "docker: command not found"
→ Docker Desktop이 실행 중인지 확인하세요
→ 재부팅 후 다시 시도

### ❌ 빌드 중 "npm ci" 에러
→ 인터넷 연결 확인
→ `docker build --no-cache -t centrum-taurus:latest .` 재시도

### ❌ "permission denied" (macOS)
→ `sudo docker build -t centrum-taurus:latest .`

### ❌ 디스크 공간 부족
→ Docker Desktop → Settings → Resources → Disk image size 확인
→ 최소 10GB 이상 필요

### ❌ 빌드가 너무 느림 (30분 이상)
→ 정상입니다. PC 사양에 따라 차이가 있습니다
→ 인터넷 속도가 느리면 더 오래 걸릴 수 있습니다
