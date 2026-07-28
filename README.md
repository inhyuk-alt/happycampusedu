[README (1).md](https://github.com/user-attachments/files/30450956/README.1.md)
# 상세페이지 위젯 — 공용 디자인/로직 저장소

이 저장소는 아임웹 프로그램 상세페이지 12개가 **공통으로 불러다 쓰는** 디자인(CSS)과
동작 로직(JS)을 담아두는 곳입니다. 여기 파일 두 개만 고치면 12개 페이지 전부에
자동으로 반영됩니다 — 페이지마다 코드를 복사해서 붙여넣고 다닐 필요가 없습니다.

실제 프로그램 내용(제목, 사진, 지역별 일정, 모집인원 등)은 여기 없습니다.
그건 **별도의 "상세페이지 데이터 관리 웹앱"**(구글 시트 + Apps Script, Code.gs/Index.html)에서
입력·수정합니다. 이 저장소는 오직 "화면에 어떻게 보여줄지"만 담당합니다.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `detail-widget.css` | 배경색, 글꼴, 여백, 표/도식 스타일 등 화면에 보이는 디자인 전체 |
| `detail-widget.js` | 시트 데이터를 불러와서 화면에 실제로 그리는 로직 (달력 계산, 표/도식 렌더링 등) |
| `page-snippet-example.html` | 각 상세페이지 코드위젯에 붙여넣을 최소 코드 예시 |

## 한 번만 하는 설정

1. 깃허브(github.com) 무료 계정 생성
2. 새 저장소(Repository) 하나 생성 — **Public**으로 (비공개로 하면 브라우저가 파일을 못 불러옴)
3. `detail-widget.css`, `detail-widget.js` 두 파일을 저장소에 업로드
4. 저장소 **Settings → Pages** 들어가서 **Source: Deploy from a branch**, 브랜치는 `main`, 폴더는 `/(root)` 선택 → Save
5. 잠시 후 `https://내계정.github.io/저장소이름/` 형태의 주소가 생성됨. 그 뒤에 파일명을 붙이면 해당 파일 주소가 됨
   - `https://내계정.github.io/저장소이름/detail-widget.css`
   - `https://내계정.github.io/저장소이름/detail-widget.js`

**비용**: 완전 무료입니다. 무료 계정 기준 한 달 대역폭 100GB, 사이트 용량 1GB까지 제공되는데
(2026년 7월 기준), 이 정도 크기의 CSS/JS 파일 몇 개로는 이 한도 근처에도 갈 일이 없습니다.

## 각 상세페이지에 넣는 코드 (`page-snippet-example.html` 참고)

```html
<div class="iw-detail-card" data-status="loading">
  <div class="iw-detail-photo">불러오는 중입니다...</div>
  <span class="iw-detail-badge"></span>
  <h2 class="iw-detail-title"></h2>
  <div class="iw-detail-divider"></div>
  <div class="iw-detail-regions"></div>
  <div class="iw-detail-info"></div>
</div>

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap">
<link rel="stylesheet" href="https://내계정.github.io/저장소이름/detail-widget.css">

<script>
window.PROGRAM_ID = '이 페이지의 프로그램 ID';

fetch('https://내계정.github.io/저장소이름/detail-widget.js', { cache: 'no-store' })
  .then(function (response) { return response.text(); })
  .then(function (code) {
    var scriptTag = document.createElement('script');
    scriptTag.textContent = code;
    document.body.appendChild(scriptTag);
  });
</script>
```

- `href`, `fetch` 안 주소는 **12개 페이지 전부 완전히 동일**해야 함 (본인 계정/저장소 이름에 맞게 한 번만 바꾸기)
- `window.PROGRAM_ID`만 페이지마다 다르게 (관리 웹앱에서 그 프로그램을 저장했을 때 나온 ID)

⚠️ **주의**: JS는 `<script src="외부주소"></script>` 형태로 안 씁니다. 아임웹 코드위젯이
저장 시점에 이 형태의 태그를 걸러내서(실제로 겪은 문제), 저장 후 페이지에 아예 남지 않는
경우가 있었습니다. 그래서 `fetch`로 파일 내용을 텍스트로 받아온 뒤, 그 코드를 담은
`<script>` 요소를 직접 만들어 페이지에 끼워 넣는 방식으로 우회합니다. CSS는 `<link>`
태그라 이 문제와 무관해서 그대로 써도 됩니다.

## 디자인을 고치고 싶을 때 (앞으로 계속 반복되는 작업)

1. 깃허브 사이트에 로그인
2. `detail-widget.css` 클릭 → 연필(edit) 아이콘 클릭
3. 값 수정 → 아래 초록색 **Commit changes** 버튼
4. 대략 몇 십 초~1분 안에 12개 페이지 전부에 자동 반영

`detail-widget.css` 안에는 대괄호 태그로 구역이 나뉘어 있어서, 파일 안에서 `Ctrl+F`로
아래 단어를 검색하면 관련된 부분만 모아서 볼 수 있습니다.

| 찾고 싶은 것 | 검색어 |
|---|---|
| 사진 영역 | `[사진]` |
| 카테고리 배지 | `[배지]` |
| 프로그램 제목 | `[제목]` |
| 지역명·부제목·날짜/시간 배지 | `[지역]` |
| 달력(요일 헤더, 하이라이트 원 등) | `[달력]` |
| 모집인원 | `[모집인원]` |
| 주요내용 불릿 목록 | `[주요내용]` |
| 문의처 | `[문의]` |
| 추가정보 안 소제목 | `[소제목]` |
| 추가정보 안 표 | `[표]` |
| 추가정보 안 도식(단계 흐름) | `[도식]` |

로직(달력 계산, 표 합치기 반영, 데이터 불러오기 방식 등)을 고쳐야 하면 같은 방식으로
`detail-widget.js`를 편집하면 됩니다. 각 함수 위에 그 함수가 어떤 화면 요소를 만드는지
주석으로 적어뒀습니다.

## 공용 설정값 (이 저장소에서만 관리)

`detail-widget.js` 맨 위에 다음 두 값이 있습니다:

- `SHEET_CSV_URL` — "programs" 시트를 웹에 게시(CSV)한 주소. 시트를 재게시해서 주소가
  바뀌면 여기 한 곳만 고치면 됩니다.
- `CATEGORY_STYLE_MAP` — 카테고리 5개(인생전환/재무설계/관계소통/사회활동/일커리어)별
  배경색·포인트색.

  ⚠️ **이 값은 관리 웹앱의 `Code.gs` 안에 있는 같은 이름의 값과 항상 일치해야 합니다.**
  관리 화면에서 카테고리를 고를 때 보여주는 미리보기 색은 `Code.gs` 값을 쓰고, 실제
  상세페이지에 보이는 색은 여기 `detail-widget.js` 값을 쓰기 때문에, 색을 바꿀 땐
  **두 파일 모두** 같은 값으로 고쳐야 합니다.

## 데이터가 어떻게 저장되어 있는지 (참고용)

실제 프로그램 데이터는 시트의 `dataJson` 칸에 아래 구조의 JSON으로 들어있습니다.
직접 만질 일은 거의 없지만(관리 웹앱 화면에서 입력하면 자동으로 이 구조로 저장됨),
문제 진단이나 데이터를 직접 확인해야 할 때 참고하세요.

```json
{
  "regions": [
    {
      "name": "지역/장소명",
      "nameColor": "#RRGGBB (선택)",
      "subtitle": "부제목 (선택)",
      "detailRows": [{ "label": "날짜", "content": "7월 8일(수) | 7월 13일(월)" }],
      "months": [{ "year": 2026, "month": 7, "highlightDays": [8, { "day": 13, "color": "#e0607f" }] }]
    }
  ],
  "info": {
    "blocks": [
      { "type": "recruit", "label": "모집인원", "value": "회차별 40명" },
      { "type": "highlights", "label": "주요내용", "items": ["...", "..."] },
      { "type": "contacts", "label": "문의", "items": [{ "name": "...", "phone": "...", "color": "#RRGGBB" }] },
      {
        "type": "custom",
        "label": "추가 정보",
        "elements": [
          { "type": "subheading", "text": "..." },
          { "type": "text", "html": "<b>굵게</b> 등 서식 포함 가능" },
          { "type": "photos", "layout": "stack|grid3|scroll", "items": [{ "url": "...", "caption": "..." }] },
          {
            "type": "table",
            "border": "thin|thick",
            "headers": ["헤더1", "헤더2"],
            "rows": [[{ "text": "", "rowspan": 1, "colspan": 1, "hidden": false }]]
          },
          { "type": "diagram", "steps": [{ "html": "..." }] }
        ]
      }
    ]
  }
}
```

`info.blocks` 배열의 순서 = 화면에 보이는 순서. `custom` 블록 안 `elements` 배열도
마찬가지로 그 순서 그대로 위에서 아래로 쌓입니다.

## 이 저장소로 안 되는 것 (관리 웹앱에서 해야 하는 일)

- 프로그램 추가/삭제, 제목·사진·카테고리 변경
- 지역/일정/달력 날짜 입력
- 모집인원/주요내용/문의/추가정보 내용 입력

이런 **내용(콘텐츠) 변경**은 전부 별도의 관리 웹앱(구글 시트 기반)에서 합니다.
이 저장소는 오직 화면 디자인과 렌더링 로직만 담당합니다.

## 참고: 반영 지연

- 이 저장소(깃허브 페이지) 수정 → 보통 1분 이내 반영
- 관리 웹앱에서 프로그램 내용 수정 → 구글 시트의 "웹에 게시" 특성상 몇 초~몇 분 정도
  지연될 수 있음 (구글 쪽 캐시/재게시 주기 문제라 저희가 더 줄이기 어려운 부분입니다)
