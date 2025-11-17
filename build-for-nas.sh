#!/bin/bash

# 첸트룸 타우러스 NAS 배포용 Docker 이미지 빌드 스크립트
# macOS / Linux 용

echo "========================================="
echo "  첸트룸 타우러스 Docker 이미지 빌드"
echo "========================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 이미지 이름 및 태그
IMAGE_NAME="centrum-taurus"
IMAGE_TAG="latest"
TAR_FILE="centrum-taurus.tar"

# Docker 설치 확인
echo -e "${YELLOW}[1/5] Docker 설치 확인...${NC}"
if ! command -v docker &> /dev/null
then
    echo -e "${RED}❌ Docker가 설치되어 있지 않습니다.${NC}"
    echo "Docker Desktop을 설치해주세요: https://www.docker.com/products/docker-desktop/"
    exit 1
fi
echo -e "${GREEN}✓ Docker 설치 확인 완료${NC}"
echo ""

# Docker 실행 확인
echo -e "${YELLOW}[2/5] Docker 실행 상태 확인...${NC}"
if ! docker info &> /dev/null
then
    echo -e "${RED}❌ Docker가 실행 중이지 않습니다.${NC}"
    echo "Docker Desktop을 실행해주세요."
    exit 1
fi
echo -e "${GREEN}✓ Docker 실행 중${NC}"
echo ""

# 이미지 빌드
echo -e "${YELLOW}[3/5] Docker 이미지 빌드 시작...${NC}"
echo "예상 소요 시간: 5-10분"
echo ""

if docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
then
    echo ""
    echo -e "${GREEN}✓ 이미지 빌드 성공!${NC}"
else
    echo ""
    echo -e "${RED}❌ 이미지 빌드 실패${NC}"
    exit 1
fi
echo ""

# 이미지 저장
echo -e "${YELLOW}[4/5] 이미지를 TAR 파일로 저장...${NC}"
if docker save ${IMAGE_NAME}:${IMAGE_TAG} -o ${TAR_FILE}
then
    echo -e "${GREEN}✓ TAR 파일 생성 완료: ${TAR_FILE}${NC}"
else
    echo -e "${RED}❌ TAR 파일 생성 실패${NC}"
    exit 1
fi
echo ""

# 파일 크기 확인
echo -e "${YELLOW}[5/5] 생성된 파일 확인...${NC}"
if [ -f ${TAR_FILE} ]; then
    FILE_SIZE=$(du -h ${TAR_FILE} | cut -f1)
    echo -e "${GREEN}✓ 파일: ${TAR_FILE}${NC}"
    echo -e "${GREEN}✓ 크기: ${FILE_SIZE}${NC}"
    echo ""
else
    echo -e "${RED}❌ TAR 파일을 찾을 수 없습니다${NC}"
    exit 1
fi

# 완료 메시지
echo "========================================="
echo -e "${GREEN}  ✓ 빌드 완료!${NC}"
echo "========================================="
echo ""
echo "다음 단계:"
echo "1. ${TAR_FILE} 파일을 NAS로 업로드하세요"
echo "2. NAS-CONTAINER-SETUP.md 가이드를 참고하여 설치하세요"
echo ""
echo "파일 위치: $(pwd)/${TAR_FILE}"
echo ""
