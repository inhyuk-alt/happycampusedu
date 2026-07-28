/* ==================================================================
   detail-widget.js
   ------------------------------------------------------------------
   상세페이지 상자(iw-detail-card)에 실제 데이터를 채워 넣는 공용 로직.

   이 파일 하나를 깃허브에 올려두고, 프로그램 12개 상세페이지가 전부
   이 파일을 <script src="..."></script> 로 불러다 씁니다. 그래서 로직을
   하나 고치면(달력 계산, 표/도식 렌더링 등) 12개 페이지에 전부 동시 반영됩니다.

   같이 필요한 다른 파일
   - detail-widget.css : 화면에 보이는 디자인(색·크기·여백 등) 전체
   - README.md         : 설치 방법, 데이터 구조, 카테고리 색상표 등 전체 설명

   각 상세페이지 코드위젯에는 이 파일을 불러오기 전에 아래처럼
   그 페이지의 프로그램 ID를 전역 변수로 먼저 선언해둬야 합니다.

     <script>window.PROGRAM_ID = '이 페이지의 프로그램 ID';</script>
     <script src="https://내계정.github.io/저장소이름/detail-widget.js"></script>

   ------------------------------------------------------------------
   데이터가 어디서 오는가
   ------------------------------------------------------------------
   실제 프로그램 내용(사진 주소, 제목, 카테고리, 지역별 일정/달력,
   모집인원/주요내용/문의/추가정보)은 이 파일 안에 없습니다. 전부
   별도로 만든 "상세페이지 데이터 관리 웹앱"(Code.gs + Index.html, 구글
   시트 기반)에서 입력·수정하고, 이 파일은 그 시트를 "웹에 게시(CSV)"한
   주소(SHEET_CSV_URL)를 읽어서 화면에 그리기만 합니다.

   시트의 각 프로그램 행은 다음 컬럼을 가집니다:
     id | visible | title | imageUrl | category | dataJson | updatedAt
   이 중 dataJson 칸 안에 아래 구조의 JSON이 통째로 들어있습니다:

     {
       "regions": [
         {
           "name": "지역/장소명",
           "nameColor": "#RRGGBB (선택, 이 지역명 글자색만 따로)",
           "subtitle": "부제목 (선택)",
           "detailRows": [
             { "label": "날짜", "content": "7월 8일(수) | 7월 13일(월) | ..." }
           ],
           "months": [
             {
               "year": 2026, "month": 7,
               "highlightDays": [ 8, { "day": 13, "color": "#e0607f" } ]
             }
           ]
         }
       ],
       "info": {
         "blocks": [
           { "type": "recruit", "label": "모집인원", "value": "회차별 40명" },
           { "type": "highlights", "label": "주요내용", "items": ["...", "..."] },
           { "type": "contacts", "label": "문의", "items": [
               { "name": "...", "phone": "...", "color": "#RRGGBB" }
           ] },
           { "type": "custom", "label": "추가 정보", "elements": [
               { "type": "subheading", "text": "..." },
               { "type": "text", "html": "<b>굵게</b> 등 서식 포함 가능" },
               { "type": "photos", "layout": "stack|grid3|scroll", "items": [
                   { "url": "...", "caption": "..." }
               ] },
               { "type": "table", "border": "thin|thick",
                 "headers": ["헤더1", "헤더2"],
                 "rows": [[ { "text": "", "rowspan": 1, "colspan": 1, "hidden": false } ]]
               },
               { "type": "diagram", "steps": [ { "html": "..." } ] }
           ] }
         ]
       }
     }

   info.blocks 배열의 순서 = 화면에 보이는 순서. custom 블록의 elements
   배열도 마찬가지로 그 순서 그대로 화면에 쌓입니다.
================================================================== */

(function () {
  // ------------------------------------------------------------
  // 모든 상세페이지 공통 설정: 여기 두 값만 이 파일 안에서 관리하면 됨
  // ------------------------------------------------------------

  // "programs" 시트를 웹에 게시(CSV)했을 때 나온 주소. 시트를 재게시해서
  // 주소가 바뀌면 여기 한 곳만 고치면 12개 페이지에 전부 반영됨
  var SHEET_CSV_URL = '여기에-게시된-CSV-URL-붙여넣기';

  // 페이지별 프로그램 ID는 각 코드위젯에서 window.PROGRAM_ID로 미리 선언해둠
  var PROGRAM_ID = window.PROGRAM_ID || '';

  // 카테고리별 배경색/구분선(포인트)색.
  // ⚠️ 관리 웹앱의 Code.gs 안 CATEGORY_STYLE_MAP과 항상 같은 값으로 맞춰야 함
  // (한쪽만 고치면 관리 화면 미리보기 색과 실제 페이지 색이 어긋남)
  var CATEGORY_STYLE_MAP = {
    '인생전환': { bg: '#ffe0eb', line: '#ff7dad' },
    '재무설계': { bg: '#d3d1f6', line: '#6e69da' },
    '관계소통': { bg: '#f9e8b2', line: '#f4af2c' },
    '사회활동': { bg: '#bcf0e4', line: '#23ceaa' },
    '일커리어': { bg: '#cef4ff', line: '#47aaff' }
  };

  var WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

  function pad2(value) {
    var text = String(value);
    return text.length < 2 ? '0' + text : text;
  }

  // ------------------------------------------------------------
  // CSV 읽기 (시트 → 텍스트 → 표 형태 배열)
  // ------------------------------------------------------------

  // 큰따옴표로 감싼 값 안의 콤마/줄바꿈까지 처리하는 CSV 파서 (목록 위젯과 동일)
  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;

    for (var i = 0; i < text.length; i += 1) {
      var char = text[i];
      var next = text[i + 1];

      if (inQuotes) {
        if (char === '"' && next === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          field += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && next === '\n') {
          i += 1;
        }
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }

    if (field !== '' || row.length > 0) {
      row.push(field);
      rows.push(row);
    }

    return rows.filter(function (r) {
      return r.length > 1 || (r.length === 1 && r[0] !== '');
    });
  }

  function isTruthy(value) {
    var normalized = String(value || '').trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'y' || normalized === 'yes';
  }

  // CSV 전체 행 중, PROGRAM_ID와 id 컬럼이 일치하는 행 하나를 찾아 객체로 변환
  function findProgramRow(rows) {
    if (rows.length === 0) {
      return null;
    }

    var header = rows[0].map(function (h) {
      return String(h || '').trim().toLowerCase();
    });

    var idIndex = header.indexOf('id');

    if (idIndex === -1) {
      return null;
    }

    for (var r = 1; r < rows.length; r += 1) {
      if (rows[r][idIndex] === PROGRAM_ID) {
        var program = {};

        for (var c = 0; c < header.length; c += 1) {
          program[header[c]] = rows[r][c] !== undefined ? rows[r][c] : '';
        }

        return program;
      }
    }

    return null;
  }

  // ------------------------------------------------------------
  // [달력] 계산 및 렌더링
  // ------------------------------------------------------------

  function buildCalendarWeeks(year, month) {
    var daysInMonth = new Date(year, month, 0).getDate();
    var firstWeekday = new Date(year, month - 1, 1).getDay();
    var cells = [];

    for (var lead = 0; lead < firstWeekday; lead += 1) {
      cells.push(null);
    }

    for (var day = 1; day <= daysInMonth; day += 1) {
      cells.push(day);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    var weeks = [];

    for (var start = 0; start < cells.length; start += 7) {
      weeks.push(cells.slice(start, start + 7));
    }

    return weeks;
  }

  function createCalendarElement(monthConfig) {
    var wrap = document.createElement('div');
    wrap.className = 'iw-detail-calendar';

    var label = document.createElement('div');
    label.className = 'iw-detail-calendar-label';

    var yearSpan = document.createElement('span');
    yearSpan.textContent = monthConfig.year + '.';

    var monthSpan = document.createElement('span');
    monthSpan.className = 'iw-detail-calendar-month';
    monthSpan.textContent = pad2(monthConfig.month);

    label.appendChild(yearSpan);
    label.appendChild(monthSpan);
    wrap.appendChild(label);

    var table = document.createElement('table');
    table.className = 'iw-detail-calendar-grid';

    var thead = document.createElement('thead');
    var headRow = document.createElement('tr');

    for (var w = 0; w < WEEKDAY_LABELS.length; w += 1) {
      var th = document.createElement('th');
      th.textContent = WEEKDAY_LABELS[w];
      headRow.appendChild(th);
    }

    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    var weeks = buildCalendarWeeks(monthConfig.year, monthConfig.month);

    // highlightDays 항목은 숫자(14) 또는 { day: 14, color: '#4a90d9' } 객체 둘 다 가능.
    // 숫자만 넣으면 기본 포인트색(accent)으로, 객체로 color를 넣으면 그 날짜만 그 색으로 표시됨.
    var highlightDays = monthConfig.highlightDays || [];
    var highlightColorMap = {};

    for (var h = 0; h < highlightDays.length; h += 1) {
      var entry = highlightDays[h];

      if (typeof entry === 'object' && entry !== null) {
        highlightColorMap[entry.day] = entry.color || null;
      } else {
        highlightColorMap[entry] = null;
      }
    }

    for (var weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
      var tr = document.createElement('tr');
      var week = weeks[weekIndex];

      for (var col = 0; col < week.length; col += 1) {
        var td = document.createElement('td');
        var dayValue = week[col];

        if (dayValue) {
          if (col === 0) {
            td.classList.add('iw-detail-sunday');
          }

          if (Object.prototype.hasOwnProperty.call(highlightColorMap, dayValue)) {
            var circle = document.createElement('span');
            circle.className = 'iw-detail-day-circle';
            circle.textContent = dayValue;

            var customColor = highlightColorMap[dayValue];

            if (customColor) {
              circle.style.backgroundColor = customColor;
            }

            td.appendChild(circle);
          } else {
            td.textContent = dayValue;
          }
        }

        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    wrap.appendChild(table);

    return wrap;
  }

  // ------------------------------------------------------------
  // [지역] 지역(장소 및 일정) 블록 렌더링
  // ------------------------------------------------------------

  function createDetailRow(row) {
    var line = document.createElement('div');
    line.className = 'iw-detail-region-detail';

    var label = document.createElement('span');
    label.className = 'iw-detail-region-detail-label';
    label.textContent = row.label || '';

    var content = document.createElement('span');
    content.className = 'iw-detail-region-detail-content';

    // "|"로 구분된 항목("7월 8일(수)" 같은 덩어리)이 중간에서 쪼개져 줄바꿈되지 않도록,
    // 항목 하나하나를 nowrap 처리하고 "|" 자리에서만 줄바꿈이 되도록 함
    var rawContent = row.content || '';
    var chunks = rawContent.split('|');

    for (var c = 0; c < chunks.length; c += 1) {
      var chunkText = chunks[c].trim();

      if (chunkText === '') {
        continue;
      }

      if (c > 0 && content.childNodes.length > 0) {
        content.appendChild(document.createTextNode(' | '));
      }

      var chunkSpan = document.createElement('span');
      chunkSpan.className = 'iw-detail-region-detail-chunk';
      chunkSpan.textContent = chunkText;
      content.appendChild(chunkSpan);
    }

    line.appendChild(label);
    line.appendChild(content);

    return line;
  }

  function createRegionElement(region) {
    var section = document.createElement('div');
    section.className = 'iw-detail-region';

    // 이 지역만 다른 이름 색을 쓰고 싶으면 region.nameColor 지정 (안 넣으면 카테고리 기본색을 그대로 씀)
    if (region.nameColor) {
      section.style.setProperty('--region-name-color', region.nameColor);
    }

    var name = document.createElement('h3');
    name.className = 'iw-detail-region-name';
    name.textContent = region.name || '';
    section.appendChild(name);

    if (region.subtitle) {
      var subtitle = document.createElement('p');
      subtitle.className = 'iw-detail-region-subtitle';
      subtitle.textContent = region.subtitle;
      section.appendChild(subtitle);
    }

    var detailRows = region.detailRows || [];

    for (var d = 0; d < detailRows.length; d += 1) {
      section.appendChild(createDetailRow(detailRows[d]));
    }

    var months = region.months || [];

    if (months.length > 0) {
      var rule = document.createElement('div');
      rule.className = 'iw-detail-region-rule';

      for (var r = 0; r < months.length; r += 1) {
        rule.appendChild(document.createElement('span'));
      }

      section.appendChild(rule);

      var monthsWrap = document.createElement('div');
      monthsWrap.className = 'iw-detail-months';

      for (var m = 0; m < months.length; m += 1) {
        monthsWrap.appendChild(createCalendarElement(months[m]));
      }

      section.appendChild(monthsWrap);
    }

    return section;
  }

  // ------------------------------------------------------------
  // 하단 정보 블록 공통 부품 — [모집인원] [주요내용] [문의] [추가정보]
  // ------------------------------------------------------------

  function createInfoRow(labelText, contentEl) {
    var row = document.createElement('div');
    row.className = 'iw-detail-info-row';

    var label = document.createElement('div');
    label.className = 'iw-detail-info-label';
    label.textContent = labelText;

    row.appendChild(label);
    row.appendChild(contentEl);

    return row;
  }

  // [사진] 사진 목록 하나를 만듦 (추가정보 블록 안 photos 요소, 예전 버전의 photos 블록 둘 다 이걸 씀)
  function buildPhotosElement(items, layout) {
    var photos = items || [];
    var validPhotos = photos.filter(function (p) { return p && p.url; });

    if (validPhotos.length === 0) {
      return null;
    }

    var photosWrap = document.createElement('div');
    photosWrap.className = 'iw-detail-info-photos';
    photosWrap.setAttribute('data-layout', layout || 'stack');

    for (var p = 0; p < validPhotos.length; p += 1) {
      var photoItem = document.createElement('figure');
      photoItem.className = 'iw-detail-info-photo-item';

      var img = document.createElement('img');
      img.src = validPhotos[p].url;
      img.alt = validPhotos[p].caption || '';
      photoItem.appendChild(img);

      if (validPhotos[p].caption) {
        var caption = document.createElement('figcaption');
        caption.textContent = validPhotos[p].caption;
        photoItem.appendChild(caption);
      }

      photosWrap.appendChild(photoItem);
    }

    return photosWrap;
  }

  // [소제목] [서식] [사진] [표] [도식] 추가정보 블록 안 요소 하나를 타입에 따라 만듦
  function buildCustomElementNode(element) {
    if (!element || !element.type) {
      return null;
    }

    if (element.type === 'subheading') {
      if (!element.text) {
        return null;
      }
      var subEl = document.createElement('h4');
      subEl.className = 'iw-detail-info-subheading';
      subEl.textContent = element.text;
      return subEl;
    }

    if (element.type === 'text') {
      if (!element.html) {
        return null;
      }
      var textEl = document.createElement('div');
      textEl.className = 'iw-detail-info-richtext';
      textEl.innerHTML = element.html;
      return textEl;
    }

    if (element.type === 'photos') {
      return buildPhotosElement(element.items, element.layout);
    }

    if (element.type === 'table') {
      return buildTableElement(element);
    }

    if (element.type === 'diagram') {
      return buildDiagramElement(element);
    }

    return null;
  }

  // [표] 칸 하나를 표준 형태 { text, rowspan, colspan, hidden }로 맞춤
  // (hidden=true는 다른 칸에 합쳐져서 화면에 별도로 안 그려지는 자리)
  function normalizeTableCell(cell) {
    if (cell && typeof cell === 'object') {
      return {
        text: cell.text || '',
        rowspan: cell.rowspan || 1,
        colspan: cell.colspan || 1,
        hidden: !!cell.hidden
      };
    }

    return { text: cell || '', rowspan: 1, colspan: 1, hidden: false };
  }

  // [표] 요소 하나를 실제 <table>로 만듦 (rowspan/colspan으로 합쳐진 칸 반영)
  function buildTableElement(element) {
    var headers = element.headers || [];
    var rows = (element.rows || []).map(function (row) {
      return row.map(normalizeTableCell);
    });

    var hasHeaderContent = headers.some(function (h) { return h && h.trim(); });
    var hasRowContent = rows.some(function (r) { return r.some(function (c) { return c.text && c.text.trim(); }); });

    if (!hasHeaderContent && !hasRowContent) {
      return null;
    }

    var table = document.createElement('table');
    table.className = 'iw-detail-info-table';
    table.setAttribute('data-border', element.border || 'thin');

    if (headers.length > 0) {
      var thead = document.createElement('thead');
      var headRow = document.createElement('tr');

      for (var h = 0; h < headers.length; h += 1) {
        var th = document.createElement('th');
        th.textContent = headers[h];
        headRow.appendChild(th);
      }

      thead.appendChild(headRow);
      table.appendChild(thead);
    }

    var tbody = document.createElement('tbody');

    for (var r = 0; r < rows.length; r += 1) {
      var tr = document.createElement('tr');

      for (var c = 0; c < rows[r].length; c += 1) {
        var cell = rows[r][c];

        if (cell.hidden) {
          continue; // 다른 칸에 합쳐진 자리라 표에 별도로 안 그림
        }

        var td = document.createElement('td');
        td.textContent = cell.text;

        if (cell.rowspan > 1) {
          td.rowSpan = cell.rowspan;
        }

        if (cell.colspan > 1) {
          td.colSpan = cell.colspan;
        }

        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);

    var scrollWrap = document.createElement('div');
    scrollWrap.className = 'iw-detail-info-table-scroll';
    scrollWrap.appendChild(table);

    return scrollWrap;
  }

  // [도식] 요소 하나를 좌→우 단계 흐름(박스+화살표)으로 만듦
  function buildDiagramElement(element) {
    var steps = (element.steps || []).filter(function (s) { return s && s.html; });

    if (steps.length === 0) {
      return null;
    }

    var wrap = document.createElement('div');
    wrap.className = 'iw-detail-info-diagram';

    for (var i = 0; i < steps.length; i += 1) {
      if (i > 0) {
        var arrow = document.createElement('div');
        arrow.className = 'iw-detail-info-diagram-arrow';
        arrow.innerHTML =
          '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        wrap.appendChild(arrow);
      }

      var stepEl = document.createElement('div');
      stepEl.className = 'iw-detail-info-diagram-step';

      var stepContent = document.createElement('div');
      stepContent.className = 'iw-detail-info-diagram-step-content';
      stepContent.innerHTML = steps[i].html;

      stepEl.appendChild(stepContent);
      wrap.appendChild(stepEl);
    }

    return wrap;
  }

  // info.blocks 배열 안 블록 하나(모집인원/주요내용/문의/추가정보)의 "내용" 부분을 만듦.
  // 라벨(제목)은 여기서 안 만들고 createInfoRow에서 따로 붙임.
  function createBlockContentElement(block) {
    if (block.type === 'highlights') {
      var items = block.items || [];

      if (items.length === 0) {
        return null;
      }

      var list = document.createElement('ul');
      list.className = 'iw-detail-info-list';

      for (var h = 0; h < items.length; h += 1) {
        var li = document.createElement('li');
        li.textContent = items[h];
        list.appendChild(li);
      }

      return list;
    }

    if (block.type === 'contacts') {
      var contacts = block.items || [];

      if (contacts.length === 0) {
        return null;
      }

      var contactsWrap = document.createElement('div');
      contactsWrap.className = 'iw-detail-info-contacts';

      for (var c = 0; c < contacts.length; c += 1) {
        var contact = contacts[c];
        var contactRow = document.createElement('div');
        contactRow.className = 'iw-detail-info-contact';

        var name = document.createElement('span');
        name.className = 'iw-detail-info-contact-name';
        name.textContent = contact.name || '';
        name.style.color = contact.color || '#222222';

        var phone = document.createElement('span');
        phone.className = 'iw-detail-info-contact-phone';
        phone.textContent = contact.phone || '';

        contactRow.appendChild(name);
        contactRow.appendChild(phone);
        contactsWrap.appendChild(contactRow);
      }

      return contactsWrap;
    }

    if (block.type === 'photos') {
      // 예전 버전 호환: "추가정보 = 사진 블록" 이었던 시절의 블록 타입
      return buildPhotosElement(block.items, block.layout);
    }

    if (block.type === 'custom') {
      // 추가 정보 블록: 소제목/텍스트/사진/표/도식이 저장된 순서 그대로 이어서 나옴
      var wrap = document.createElement('div');
      wrap.className = 'iw-detail-info-custom-elements';
      var hasContent = false;

      var elements = block.elements || [];

      for (var ei = 0; ei < elements.length; ei += 1) {
        var elementEl = buildCustomElementNode(elements[ei]);

        if (elementEl) {
          if (hasContent) {
            elementEl.style.marginTop = '14px';
          }
          wrap.appendChild(elementEl);
          hasContent = true;
        }
      }

      if (!hasContent) {
        // 예전 버전 호환: elements 배열이 생기기 전(lines/photos/html/value)에 저장된 데이터
        var lines = (block.lines || []).filter(function (l) { return l && l.trim(); });

        if (lines.length > 0) {
          var richList = document.createElement('ul');
          richList.className = 'iw-detail-info-list iw-detail-info-richtext';

          for (var rl = 0; rl < lines.length; rl += 1) {
            var li2 = document.createElement('li');
            li2.innerHTML = lines[rl];
            richList.appendChild(li2);
          }

          wrap.appendChild(richList);
          hasContent = true;
        } else if (block.html) {
          var richWrap = document.createElement('div');
          richWrap.className = 'iw-detail-info-richtext';
          richWrap.innerHTML = block.html;
          wrap.appendChild(richWrap);
          hasContent = true;
        }

        var legacyPhotos = block.photos || {};
        var legacyPhotosEl = buildPhotosElement(legacyPhotos.items, legacyPhotos.layout);

        if (legacyPhotosEl) {
          if (hasContent) {
            legacyPhotosEl.style.marginTop = '14px';
          }
          wrap.appendChild(legacyPhotosEl);
          hasContent = true;
        }

        if (!hasContent && block.value) {
          var legacyValue = document.createElement('div');
          legacyValue.className = 'iw-detail-info-value';
          legacyValue.textContent = block.value;
          wrap.appendChild(legacyValue);
          hasContent = true;
        }
      }

      return hasContent ? wrap : null;
    }

    // recruit: 단순 텍스트 한 줄
    if (!block.value) {
      return null;
    }

    var value = document.createElement('div');
    value.className = 'iw-detail-info-value';
    value.textContent = block.value;

    return value;
  }

  // info.blocks 배열 전체를 순서대로 렌더링 (구분선 + 라벨 + 내용을 블록마다 반복)
  function createInfoSection(info) {
    var wrap = document.createDocumentFragment();
    var blocks = info.blocks || [];

    for (var b = 0; b < blocks.length; b += 1) {
      var block = blocks[b];
      var contentEl = createBlockContentElement(block);

      if (!contentEl) {
        continue;
      }

      var rule = document.createElement('div');
      rule.className = 'iw-detail-info-rule';
      wrap.appendChild(rule);

      wrap.appendChild(createInfoRow(block.label || '', contentEl));
    }

    return wrap;
  }

  // ------------------------------------------------------------
  // 전체 조립 및 데이터 로딩
  // ------------------------------------------------------------

  function renderProgram(root, program, data) {
    var categoryStyle = CATEGORY_STYLE_MAP[program.category] || { bg: '#fdf1dc', line: '#d97b3f' };

    root.style.setProperty('--detail-bg', categoryStyle.bg);
    root.style.setProperty('--accent', categoryStyle.line);
    root.setAttribute('data-status', 'ready');

    var photo = root.querySelector('.iw-detail-photo');

    while (photo.firstChild) {
      photo.removeChild(photo.firstChild);
    }

    if (program.imageurl) {
      var img = document.createElement('img');
      img.src = program.imageurl;
      img.alt = program.title || '';
      photo.appendChild(img);
    } else {
      photo.textContent = '프로그램 사진을 여기에 넣으세요';
    }

    var badge = root.querySelector('.iw-detail-badge');
    badge.textContent = program.category || '';

    var title = root.querySelector('.iw-detail-title');
    title.textContent = program.title || '';

    var regionsWrap = root.querySelector('.iw-detail-regions');
    regionsWrap.innerHTML = '';

    var regions = (data && data.regions) || [];

    for (var i = 0; i < regions.length; i += 1) {
      regionsWrap.appendChild(createRegionElement(regions[i]));
    }

    var infoWrap = root.querySelector('.iw-detail-info');
    infoWrap.innerHTML = '';

    if (data && data.info) {
      infoWrap.appendChild(createInfoSection(data.info));
    }
  }

  function renderError(root) {
    root.setAttribute('data-status', 'error');
    var photo = root.querySelector('.iw-detail-photo');
    photo.textContent = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  function loadProgram() {
    var root = document.querySelector('.iw-detail-card');

    if (!root) {
      return;
    }

    var cacheBustedUrl =
      SHEET_CSV_URL +
      (SHEET_CSV_URL.indexOf('?') === -1 ? '?' : '&') +
      'cachebust=' +
      Date.now();

    fetch(cacheBustedUrl, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('네트워크 응답 오류');
        }
        return response.text();
      })
      .then(function (text) {
        var rows = parseCsv(text);
        var program = findProgramRow(rows);

        if (!program || !isTruthy(program.visible)) {
          renderError(root);
          return;
        }

        var data = { regions: [], info: {} };

        try {
          if (program.datajson) {
            data = JSON.parse(program.datajson);
          }
        } catch (err) {
          data = { regions: [], info: {} };
        }

        renderProgram(root, program, data);
      })
      .catch(function () {
        renderError(root);
      });
  }

  loadProgram();
})();
