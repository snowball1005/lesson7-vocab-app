중2 영어 하루 10분 학습앱 · Lesson 7·8

학습 자료
- Lesson 7: 단어 52개, 숙어 16개, 영영풀이 15개, look 중요표현 11개, 다의어(shop/fat)
- Lesson 8: 단어 56개, 숙어 12개, 영영풀이 18개, 다의어(spring/star/track)

학습 모드
- 오늘의 10분: 오답 우선 + 단어/숙어/영영풀이/중요표현 혼합
- 단어: 영어→뜻 / 뜻→영어
- 숙어
- 영영풀이
- 중요표현·다의어
- 시험형 믹스
- 선택형 철자 연습
- 오답 자동 복습
- 전체 목록/발음

운영
- GitHub main 브랜치 변경 시 Render Auto-Deploy(On Commit)
- PWA 설치 가능, 학습 기록/별/레벨/오답은 기기 localStorage에 저장
- Android Chrome: 메뉴 → 앱 설치
- iPhone Safari: 공유 → 홈 화면에 추가

수정 및 검증 안내
- 영어 고정 ID 전환: 기존 오답/통계를 v2 키로 이전하며 원본은 보존합니다.
- 철자 오답 저장·입력형 복습, 중복 채점 방지, 화면 전환 예약 취소를 적용했습니다.
- 영어 캐시는 과학 캐시를 삭제하지 않으며 /science/ 요청을 처리하지 않습니다.
- 과학 앱: /science/ (기억 카드 정답 보기 오류 수정)
- 휴대폰 설치·오프라인 점검: docs/mobile-offline-checklist.md
- 기록 이전·콘텐츠 ID 편집 규칙 및 테스트: docs/stable-ids.md
- 회귀 테스트: node --test tests/regression.cjs
