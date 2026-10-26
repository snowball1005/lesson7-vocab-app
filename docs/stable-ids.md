# 고정 문항 ID와 기존 기록 이전

영어 DATA의 단어·숙어·영영풀이·표현·다의어에 명시적 `id`를 부여했습니다. 문항은 `:a`(영→뜻 등), `:b`(역방향), `:spell`(철자) 접미사를 사용합니다. 다의어 예문은 `exampleIds`로 각 의미를 식별합니다.

- 기존 `w0a`, `p0a`, `spell0`, `m0_0` 등의 인덱스 ID는 index.html의 동결된 `LEGACY_IDS`로 변환합니다.
- `eng_{lesson}_misses`, `eng_{lesson}_stats`는 원본으로 보존하고 `eng_{lesson}_v2_misses`, `eng_{lesson}_v2_stats`에 복사합니다.
- 두 대상 키 저장이 성공한 뒤에만 `eng_{lesson}_v2_migrated=1`을 기록합니다. 부분 저장 후 재시도 시 이미 존재하는 새 ID 기록을 덮어쓰거나 횟수를 중복 가산하지 않습니다.
- 기존 별·레벨·선택 단원 키는 유지합니다. 해석할 수 없는 옛 ID도 원본 키에 남습니다.
- 이전 버전이 저장하지 않았던 철자 오답은 복원할 수 없습니다. 수정 버전부터 저장·복습합니다.
- 배포 도메인·브라우저 저장소를 바꾸면 자동 이전되지 않습니다. 예전 버전 탭은 닫고 새 버전을 사용하세요. 여러 탭의 동시 채점 충돌 해결은 이번 범위에 포함하지 않습니다.

## 앞으로 콘텐츠를 편집할 때

1. 기존 항목을 재정렬하거나 철자·뜻을 바로잡아도 `id`를 바꾸지 않습니다.
2. 새 항목에는 고유 ID를 새로 부여합니다. 삭제된 ID를 다른 내용에 재사용하지 않습니다.
3. 다의어 예문과 `exampleIds`를 함께 이동합니다. 예문 의미를 바꾸면 새 ID를 부여합니다.
4. `LEGACY_IDS`는 최초 이전용 고정 대응표입니다. 현재 배열 순서로 재생성하지 않습니다.
5. `node --test tests/regression.cjs`를 실행해 ID 충돌·이전·복습 검증을 통과시킵니다.

## 검증 실행

기본 회귀 검증은 Node.js 20 이상에서 추가 패키지 없이 실행합니다.

```sh
node --test tests/regression.cjs
```

브라우저 검증은 Playwright와 Chromium 설치 후 실행합니다. 테스트 서버는 로컬 임시 포트를 사용합니다.

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/browser.cjs
```

브라우저 검증은 두 앱의 실제 서비스워커·오프라인 재실행, 카드 클릭, 기록 이전과 연속 채점을 확인합니다. 실제 휴대폰 설치·음성·배포 서버 점검은 [휴대폰 점검표](mobile-offline-checklist.md)로 별도 확인합니다.
