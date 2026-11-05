/* ==================================================================
   detail-widget.js [1단계 통합본 + 2단계 색 변수]
   ------------------------------------------------------------------
   교육프로그램(happycampusedu)과 커뮤니티 공간(happyspace) 두 메뉴가 똑같은 이 파일
   하나를 씁니다. 두 저장소에 같은 파일을 올리면 되고, 아임웹 페이지 코드는 그대로 둡니다.
   - 시트를 합치기 전(3단계)까지는 두 시트를 함께 읽어서, 그 페이지 프로그램 ID가 들어있는
     쪽으로 그립니다(SHEET_CSV_URLS).
   - 교육 카테고리 색은 EDU_CATEGORY_STYLE_MAP, 커뮤니티 카테고리 색은 LAYOUT_SETTINGS
     마커 사이의 CATEGORY_STYLE_MAP. 커뮤니티 관리웹앱 "코드 생성" 결과는 지금처럼 마커
     사이에 붙여넣되, 두 저장소 파일 모두에 똑같이 넣어야 합니다.
   - 진단 로그는 평소 꺼져 있음. 페이지 주소 끝에 ?iwdebug=1 을 붙여 열면 콘솔에 나옴.

   상세페이지 상자(iw-detail-card)에 실제 데이터를 채워 넣는 공용 로직.

   이 파일 하나를 깃허브에 올려두고, 이 메뉴의 모든 상세페이지가 전부
   이 파일을 <script src="...">​</script> 로 불러다 씁니다. 그래서 로직을
   하나 고치면(달력 계산, 표/도식 렌더링 등) 모든 페이지에 전부 동시 반영됩니다.

   같이 필요한 다른 파일
   - detail-widget.css : 화면에 보이는 디자인(색·크기·여백 등) 전체
   - README.md         : 설치 방법, 데이터 구조, 카테고리 색상표 등 전체 설명

   각 상세페이지 코드위젯에는 이 파일을 불러오기 전에 아래처럼
   그 페이지의 프로그램 ID를 전역 변수로 먼저 선언해둬야 합니다.

     <script>window.PROGRAM_ID = '이 페이지의 프로그램 ID';</script>
     <script src="https://내계정.github.io/새메뉴저장소이름/detail-widget.js"></script>

   ------------------------------------------------------------------
   데이터가 어디서 오는가
   ------------------------------------------------------------------
   실제 프로그램 내용(사진 주소, 제목, 카테고리, 지역별 일정/달력,
   모집인원/주요내용/문의/추가정보)은 이 파일 안에 없습니다. 전부
   별도로 만든 "상세페이지 데이터 관리 웹앱"(Code.gs + Index.html, 구글
   시트 기반)에서 입력·수정하고, 이 파일은 그 시트를 "웹에 게시(CSV)"한
   주소(SHEET_CSV_URLS)를 읽어서 화면에 그리기만 합니다.

   시트의 각 프로그램 행은 다음 컬럼을 가집니다:
     id | visible | title | imageUrl | category | dataJson | updatedAt
   이 중 dataJson 칸 안에 아래 구조의 JSON이 통째로 들어있습니다:

     {
       "subtitleLabel": "라벨명 (선택, 예: 한 줄 소개)",
       "subtitleText": "제목 아래 표시될 짧은 문구 (선택)",
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

   ------------------------------------------------------------------
   [한 줄 소개] (2026-07 추가)
   ------------------------------------------------------------------
   제목 바로 아래 표시되는 짧은 소개 문구. subtitleLabel(라벨명)과
   subtitleText(내용) 둘 다 dataJson 최상단에 있음 — regions/info와
   같은 위치.

   이 요소(.iw-detail-subtitle)는 아임웹에 이미 붙여넣어진 12개 페이지의
   고정 HTML 스니펫에는 없습니다. 그래서 페이지 스니펫을 전혀 건드리지
   않고도 적용되도록, 이 파일이 실행될 때 필요하면 그 요소를 직접
   만들어서 제목(.iw-detail-title)과 구분선(.iw-detail-divider) 사이에
   끼워 넣습니다. subtitleLabel/subtitleText가 둘 다 비어 있으면 그
   요소 자체를 안 만들거나 숨겨서, 소개 문구가 없는 프로그램은 기존과
   완전히 동일하게 보입니다.
================================================================== */

(function () {
  // ------------------------------------------------------------
  // 모든 상세페이지 공통 설정: 여기 두 값만 이 파일 안에서 관리하면 됨
  // ------------------------------------------------------------

  // [3단계] 통합 시트의 public 탭(공개 행만)을 웹에 게시(CSV)한 주소. 행마다 menu 칸이 있어서 메뉴는 자동 구분.
  // 예전 메뉴별 시트 주소(되돌릴 때만):
  //   edu: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRphcNuCkSuwGWapzV-nfMQUkylKz3J_qJEnczUfILvM6PBonOBIJiV4RJc5uhhKwcukiUbfphKeCrq/pub?gid=147504769&single=true&output=csv'
  //   community: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQSJc7a_m0m9OFAyuUY9UbUkK-BscmJKvMa1cHsHMYlWP3UBa8kNybh528WC2KpkNXsMWaILtnexIEb/pub?gid=1937397128&single=true&output=csv'
  var SHEET_CSV_URLS = {
    unified: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAuSW0TCzXc6K6iojr8m5EDJbRFvdO9Z1r-uO1AijDvtLVITVWwOY1v-HJrUPUx9ehGqpo9s0zYoZn/pub?gid=1797732858&single=true&output=csv'
  };

  // [4A] 통합 시트의 categories·layout_settings 탭을 웹에 게시(CSV)한 주소.
  // 비워두면 요청하지 않고 아래 파일 안의 색표·글자 단계를 그대로 씀.
  // 채워두면 관리웹앱에서 바꾼 카테고리 색·글자 크기 단계가 코드 수정 없이 바로 반영됨
  var CATEGORIES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAuSW0TCzXc6K6iojr8m5EDJbRFvdO9Z1r-uO1AijDvtLVITVWwOY1v-HJrUPUx9ehGqpo9s0zYoZn/pub?gid=1248969931&single=true&output=csv';
  var LAYOUT_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAuSW0TCzXc6K6iojr8m5EDJbRFvdO9Z1r-uO1AijDvtLVITVWwOY1v-HJrUPUx9ehGqpo9s0zYoZn/pub?gid=219139048&single=true&output=csv';
  // 설정 CSV를 기다리는 최대 시간. 넘으면 파일 안 값으로 먼저 그림
  var SETTINGS_WAIT_MS = 3000;

  // [1단계 통합] 진단 로그는 평소엔 꺼둠(방문자 콘솔에 시트 내용이 찍히지 않게). 원인을 봐야 할 때만
  // 페이지 주소 끝에 ?iwdebug=1 을 붙여 열면 예전처럼 자세한 진단이 콘솔에 나옴
  var DEBUG = /[?&]iwdebug=1(&|$)/.test(window.location.search);
  var noop = function () {};
  var debugConsole = DEBUG ? console : { log: noop, warn: noop, error: noop, group: noop, groupEnd: noop };

  // 페이지별 프로그램 ID는 각 코드위젯에서 window.PROGRAM_ID로 미리 선언해둠
  var PROGRAM_ID = window.PROGRAM_ID || '';

  // [레이아웃 설정] 아래 두 줄(START~END) 사이는 관리 웹앱의 "레이아웃 설정" 화면에서
  // "코드 생성" 버튼을 누르면 나오는 코드로 통째로 바꿔넣는 자리입니다.
  // 마커 두 줄은 절대 지우지 말고, 그 사이 내용만 통째로 교체하세요.
  // (카테고리 색상표, 텍스트 블록 글자크기/줄간격 값이 여기 다 들어있음)
  // [1단계 통합] 교육프로그램 카테고리 색 (예전 교육 위젯과 같은 값)
  // ⚠️ 교육 관리웹앱 Code.gs 안 CATEGORY_STYLE_MAP과 같은 값 유지 — 5단계에서 시트 데이터로 옮기면 중복이 없어짐
  var EDU_CATEGORY_STYLE_MAP = {
    '인생전환': { bg: '#ffe0eb', line: '#ff7dad' },
    '재무설계': { bg: '#d3d1f6', line: '#6e69da' },
    '관계소통': { bg: '#f9e8b2', line: '#f4af2c', text: '#965800' },
    '사회활동': { bg: '#bcf0e4', line: '#23ceaa' },
    '일커리어': { bg: '#cef4ff', line: '#47aaff' }
  };

  // 아래 마커 사이 = 커뮤니티 공간 카테고리 색 + 글자크기/줄간격 (커뮤니티 관리웹앱 "코드 생성"으로 교체하는 자리)
  /* === LAYOUT_SETTINGS_START === */
  var CATEGORY_STYLE_MAP = {
  '강연': { bg: '#fff3d0', line: '#C28E4C', text: '#2C2A29' },
  '로망스쿨': { bg: '#e8f8f8', line: '#2F3640', text: '#A5C4D4' },
  '행복아지트': { bg: '#fec5e8', line: '#18a8f1', text: '#3e3e3e' },
  '재무설계': { bg: '#D3D1F6', line: '#6E69DA', text: '#3e3e3e' }
};

var TEXT_FONT_SIZE_MAP = {
  small: '14px',
  medium: '16px',
  large: '19px',
  xlarge: '22px'
};

var TEXT_LINE_HEIGHT_MAP = {
  normal: '1.7',
  wider: '2.4',
  wide: '2.0',
  tight: '1.4'
};
  /* === LAYOUT_SETTINGS_END === */

  var WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

  // ------------------------------------------------------------
  // [1단계 - HTML 정리] 관리 화면에서 입력한 서식(굵게·글자색·목록 등)은 그대로 살리고,
  // 페이지에서 실행될 수 있는 것(script, onerror 같은 이벤트 속성, javascript: 링크 등)만 걸러냄.
  // 목록에 없는 태그는 태그만 벗기고 글자는 남김 → 내용이 사라지는 일은 없음
  // ------------------------------------------------------------
  var SAFE_TAGS = {
    B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, STRIKE: 1, DEL: 1, INS: 1, MARK: 1, SMALL: 1, SUB: 1, SUP: 1,
    BR: 1, HR: 1, P: 1, DIV: 1, SPAN: 1, FONT: 1, UL: 1, OL: 1, LI: 1, A: 1, BLOCKQUOTE: 1, IMG: 1,
    H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1
  };
  var DROP_WITH_CONTENT = {
    SCRIPT: 1, STYLE: 1, IFRAME: 1, FRAME: 1, OBJECT: 1, EMBED: 1, LINK: 1, META: 1, BASE: 1, FORM: 1,
    INPUT: 1, BUTTON: 1, TEXTAREA: 1, SELECT: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, MATH: 1
  };
  var SAFE_ATTRS = {
    style: 1, 'class': 1, lang: 1, dir: 1, size: 1, face: 1, color: 1, align: 1, title: 1,
    href: 1, target: 1, rel: 1, src: 1, alt: 1, width: 1, height: 1
  };

  // 링크 주소는 http/https/전화/메일/페이지 안 이동(#, /)만 허용
  function safeUrl_(url) {
    var value = String(url == null ? '' : url).trim();
    var compact = value.replace(/[\u0000- ]/g, '').toLowerCase();

    if (/^(https?:|tel:|mailto:|#|\/)/.test(compact) || !/^[a-z][a-z0-9+.-]*:/.test(compact)) {
      return value;
    }

    return '';
  }

  function cleanNode_(node) {
    var children = Array.prototype.slice.call(node.childNodes);

    for (var i = 0; i < children.length; i += 1) {
      var child = children[i];

      if (child.nodeType === 8) {
        node.removeChild(child);
        continue;
      }

      if (child.nodeType !== 1) {
        continue;
      }

      var tag = child.tagName.toUpperCase();

      if (DROP_WITH_CONTENT[tag]) {
        node.removeChild(child);
        continue;
      }

      cleanNode_(child);

      if (!SAFE_TAGS[tag]) {
        while (child.firstChild) {
          node.insertBefore(child.firstChild, child);
        }
        node.removeChild(child);
        continue;
      }

      var attrs = Array.prototype.slice.call(child.attributes);

      for (var a = 0; a < attrs.length; a += 1) {
        var name = attrs[a].name.toLowerCase();
        var value = attrs[a].value;

        if (!SAFE_ATTRS[name]) {
          child.removeAttribute(attrs[a].name);
        } else if ((name === 'href' || name === 'src') && !safeUrl_(value)) {
          child.removeAttribute(attrs[a].name);
        } else if (name === 'style' && /expression\s*\(|javascript:|url\s*\(/i.test(value)) {
          child.removeAttribute(attrs[a].name);
        }
      }

      if (tag === 'A' && child.getAttribute('target') === '_blank') {
        child.setAttribute('rel', 'noopener noreferrer');
      }
    }
  }

  function sanitizeHtml_(html) {
    var template = document.createElement('template');
    template.innerHTML = String(html == null ? '' : html);
    cleanNode_(template.content);
    var holder = document.createElement('div');
    holder.appendChild(template.content);
    return holder.innerHTML;
  }

  // ------------------------------------------------------------
  // [4A] IWFormat — 데이터 글 칸을 다루는 순수 함수 모음.
  // 관리웹앱 편집 화면과 시험이 window.IWFormat으로 같이 씀 (페이지 그리기와는 무관)
  // 경로는 "regions.0.detailRows.1.content" 처럼 점으로 잇고, 숫자는 배열 번호
  // ------------------------------------------------------------
  var IWFormat = {
    FMT_VERSION: 2,

    getAt: function (data, path) {
      var parts = String(path).split('.');
      var cur = data;
      for (var i = 0; i < parts.length; i += 1) {
        if (cur == null || typeof cur !== 'object') return undefined;
        cur = cur[parts[i]];
      }
      return cur;
    },

    setAt: function (data, path, value) {
      var parts = String(path).split('.');
      var cur = data;
      for (var i = 0; i < parts.length - 1; i += 1) {
        if (cur[parts[i]] == null) cur[parts[i]] = /^\d+$/.test(parts[i + 1]) ? [] : {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
    },

    escapeHtml: function (text) {
      return String(text == null ? '' : text)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    plainText: function (html) {
      return String(html == null ? '' : html)
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ').trim();
    },

    // 그 프로그램의 글 칸 경로 전부 (페이지에 보이는 순서). 값이 문자열인 칸만
    textPaths: function (data) {
      var out = ['titleHtml'];
      data = data || {};

      function add(obj, base, keys) {
        if (!obj || typeof obj !== 'object') return;
        for (var k = 0; k < keys.length; k += 1) {
          if (typeof obj[keys[k]] === 'string') out.push(base + keys[k]);
        }
      }

      function each(list, base, fn) {
        if (!Array.isArray(list)) return;
        for (var i = 0; i < list.length; i += 1) fn(list[i], base + i + '.');
      }

      function strings(list, base) {
        each(list, base, function (v, b) { if (typeof v === 'string') out.push(b.slice(0, -1)); });
      }

      add(data, '', ['subtitleLabel', 'subtitleText']);

      function visitRegion(region, rb) {
        add(region, rb, ['name', 'subtitle']);
        each(region && region.detailRows, rb + 'detailRows.', function (row, b) { add(row, b, ['label', 'content']); });
      }

      function visitBlock(block, bb) {
        add(block, bb, ['label', 'value', 'html']);
        each(block && block.items, bb + 'items.', function (item, ib) {
          if (typeof item === 'string') out.push(ib.slice(0, -1));
          else add(item, ib, ['name', 'phone', 'address', 'text', 'caption']);
        });
        strings(block && block.lines, bb + 'lines.');

        each(block && block.elements, bb + 'elements.', function (el, eb) {
          add(el, eb, ['text', 'html']);
          strings(el && el.headers, eb + 'headers.');
          each(el && el.rows, eb + 'rows.', function (row, rb) {
            each(row, rb, function (cell, cb) {
              if (typeof cell === 'string') out.push(cb.slice(0, -1));
              else add(cell, cb, ['text', 'html']);
            });
          });
          each(el && el.items, eb + 'items.', function (item, ib) {
            if (typeof item === 'string') out.push(ib.slice(0, -1));
            else add(item, ib, ['caption']);
          });
          each(el && el.steps, eb + 'steps.', function (step, sb) { add(step, sb, ['html']); });
          each(el && el.groups, eb + 'groups.', function (group, gb) {
            add(group, gb, ['name']);
            each(group && group.sessions, gb + 'sessions.', function (s, sb) {
              add(s, sb, ['title', 'time', 'shortDesc', 'capacity', 'note', 'calendarLabel', 'detailHtml']);
              each(s && s.detailRows, sb + 'detailRows.', function (row, b) { add(row, b, ['label', 'content']); });
            });
          });
        });
      }

      IWFormat.normalizeOrder(data).forEach(function (key) {
        var target = IWFormat.getAt(data, key);
        if (key.indexOf('regions.') === 0) visitRegion(target, key + '.');
        else visitBlock(target, key + '.');
      });

      return out;
    },

    // 큰 블록(지역·정보 블록) 그리는 순서. order가 없으면 지역 전부 → 정보 블록 전부(지금 방식).
    // 잘못된 값·중복은 빼고, order에 빠진 블록은 원래 순서대로 끝에 붙임
    normalizeOrder: function (data) {
      data = data || {};
      var all = [];
      var regions = Array.isArray(data.regions) ? data.regions : [];
      var blocks = data.info && Array.isArray(data.info.blocks) ? data.info.blocks : [];
      for (var r = 0; r < regions.length; r += 1) all.push('regions.' + r);
      for (var b = 0; b < blocks.length; b += 1) all.push('info.blocks.' + b);
      if (!Array.isArray(data.order)) return all;

      var seen = {};
      var result = [];
      data.order.concat(all).forEach(function (key) {
        if (all.indexOf(key) !== -1 && !seen[key]) {
          seen[key] = true;
          result.push(key);
        }
      });
      return result;
    },

    // 예전 형식(글자만) → 새 형식(fmt 2, 모든 글 칸이 HTML). 화면이 지금과 같게 되는 최소한만 바꿈.
    // 사람이 줄을 나누려고 넣었던 "|"는 지금 위젯이 해석하던 그대로 바꾸고, 그 칸을 review로 알려줌
    toFmt2: function (data, program) {
      var copy = JSON.parse(JSON.stringify(data || {}));

      if (copy.fmt === IWFormat.FMT_VERSION) {
        return { data: copy, review: [] };
      }

      var review = [];
      var esc = IWFormat.escapeHtml;

      // 표 칸·표 머리: "|" 자리 = 줄바꿈 (fillTableCell_과 같은 규칙)
      function pipeBreaks(text, path) {
        var flat = String(text).replace(/\r\n|\r|\n/g, ' ').replace(/[ \t]+/g, ' ');
        if (flat.indexOf('|') !== -1) review.push({ path: path, reason: 'pipe-linebreak' });
        return flat.split('|').map(function (part) { return esc(part.trim()); }).join('<br>');
      }

      // 지역 세부 내용: "|" 자리 = 날짜 덩어리 나눔 (createDetailRow와 같은 규칙)
      function pipeChunks(text, path) {
        if (String(text).indexOf('|') !== -1) review.push({ path: path, reason: 'pipe-chunks' });
        return String(text).split('|')
          .map(function (part) { return part.trim(); })
          .filter(function (part) { return part !== ''; })
          .map(function (part) { return '<span class="iw-detail-region-detail-chunk">' + esc(part) + '</span>'; })
          .join(' | ');
      }

      IWFormat.textPaths(copy).forEach(function (path) {
        if (path === 'titleHtml' || /\.(html|detailHtml)$/.test(path) || /\.lines\.\d+$/.test(path)) {
          return;
        }

        var cellMatch = path.match(/^(.*\.rows\.\d+\.\d+)(\.text)?$/);
        if (cellMatch) {
          var cell = IWFormat.getAt(copy, cellMatch[1]);
          if (typeof cell === 'string') {
            IWFormat.setAt(copy, cellMatch[1], { text: cell, html: pipeBreaks(cell, cellMatch[1] + '.html') });
          } else if (cellMatch[2] && !cell.html) {
            cell.html = pipeBreaks(cell.text, cellMatch[1] + '.html');
          }
          return;
        }

        var value = IWFormat.getAt(copy, path);
        if (/\.headers\.\d+$/.test(path)) {
          IWFormat.setAt(copy, path, pipeBreaks(value, path));
        } else if (/detailRows\.\d+\.content$/.test(path)) {
          IWFormat.setAt(copy, path, pipeChunks(value, path));
        } else {
          IWFormat.setAt(copy, path, esc(value));
        }
      });

      copy.fmt = IWFormat.FMT_VERSION;
      copy.titleHtml = esc((program && program.title) || '');
      return { data: copy, review: review };
    },

    // [4C-1] 배경 테마: 관리웹앱이 저장 때 계산해 둔 최종 색(theme.resolved)을 CSS 변수로. 색 형식이 아닌 값은 버림
    themeVars: function (theme) {
      var out = {};
      var resolved = theme && theme.resolved;
      if (!resolved || typeof resolved !== 'object') return out;
      var isColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
      var MAP = {
        bg: ['--detail-bg'], accent: ['--accent'], accentText: ['--accent-text'], onAccent: ['--on-accent'], tableHead: ['--table-head-text'],
        ink: ['--ink'], muted: ['--muted'], surface: ['--surface'],
        text: ['--text-strong', '--text', '--text-body', '--text-sub', '--text-soft']
      };
      Object.keys(MAP).forEach(function (key) {
        var v = resolved[key];
        if (typeof v !== 'string' || !isColor.test(v.trim())) return;
        MAP[key].forEach(function (name) { out[name] = v.trim(); });
      });
      return out;
    }
  };

  window.IWFormat = IWFormat;

  // [4A] 지금 그리는 프로그램이 새 형식(fmt 2)인지. renderProgram에서 정함
  var currentFmt2_ = false;

  // 데이터 글 넣기: 새 형식이면 서식 있는 글(보안 필터 거침), 예전 형식이면 지금처럼 글자만
  function setText_(el, value, key) {
    var text = value == null ? '' : value;
    if (currentFmt2_) {
      el.innerHTML = sanitizeHtml_(text);
    } else {
      el.textContent = text;
    }
    if (key) tagPath_(el, key);
  }

  // [4A] 편집 모드 표시. 관리웹앱 편집 화면이 window.__IW_EDIT__ = true 로 켰을 때만,
  // 글 칸에는 data-iw-path(데이터 경로), 블록에는 data-iw-block 을 붙임. 방문자 화면엔 아무것도 안 붙음.
  // 그리는 중인 위치는 pathStack_ 에 쌓아둠 (예: ['info.blocks.2.', 'elements.0.'])
  var pathStack_ = [];

  function isEditMode_() {
    return window.__IW_EDIT__ === true;
  }

  function withPath_(prefix, fn) {
    pathStack_.push(prefix);
    try {
      return fn();
    } finally {
      pathStack_.pop();
    }
  }

  // [4B] 편집 화면에서만: 내용이 빈 블록도 자리를 보여줌 (방문자 화면은 지금처럼 숨김)
  function editEmpty_() {
    var box = document.createElement('div');
    box.className = 'iw-edit-empty';
    box.textContent = '비어 있음 — 오른쪽 블록 설정에서 내용을 넣으세요';
    return box;
  }

  function tagPath_(el, key) {
    if (isEditMode_() && el) el.setAttribute('data-iw-path', pathStack_.join('') + key);
  }

  function tagBlock_(el, name) {
    if (isEditMode_() && el) el.setAttribute('data-iw-block', name || pathStack_.join('').replace(/\.$/, ''));
  }

  function pad2(value) {
    var text = String(value);
    return text.length < 2 ? '0' + text : text;
  }

  // ------------------------------------------------------------
  // CSV 읽기 (시트 → 텍스트 → 표 형태 배열)
  // ------------------------------------------------------------

  // 큰따옴표로 감싼 값 안의 콤마/줄바꿈까지 처리하는 CSV 파서 (목록 위젯과 동일)
  function parseCsv(text) {
    // [진단/방어] 맨 앞에 BOM(\uFEFF)이 붙어오는 경우를 대비해 항상 제거하고 시작.
    // (원인이 아니었더라도 있어서 해될 것 없음)
    if (text.charCodeAt(0) === 0xfeff) {
      debugConsole.log('[진단] parseCsv: 텍스트 맨 앞에 BOM 발견 → 제거함');
      text = text.slice(1);
    }

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

  // [진단용] 눈에 안 보이는 문자(제로폭 공백, BOM, NBSP 등)를 모두 제거하고
  // 앞뒤 공백까지 지운 뒤 비교하기 위한 정규화 함수. id 비교가 계속 실패할 때
  // 원인이 "눈에 안 보이는 문자"인 경우를 방어하기 위해 추가함.
  function normalizeForCompare_(value) {
    return String(value == null ? '' : value)
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '') // 제로폭 공백류, BOM, NBSP 제거
      .trim();
  }

  // [진단용] 문자열을 사람이 읽을 수 있는 형태 + 각 글자의 문자코드로 같이 보여줌.
  // 눈에 안 보이는 문자가 어디에 끼어있는지 콘솔에서 바로 확인하기 위한 함수.
  function debugInspectString_(label, value) {
    var str = String(value == null ? '' : value);
    var codes = [];
    for (var i = 0; i < str.length; i += 1) {
      codes.push(str.charCodeAt(i));
    }
    debugConsole.log('[진단] ' + label + ' = ' + JSON.stringify(str) + ' / 문자코드: [' + codes.join(',') + ']');
  }

  // CSV 전체 행 중, PROGRAM_ID와 id 컬럼이 일치하는 행 하나를 찾아 객체로 변환
  function findProgramRow(rows) {
    debugConsole.group('[진단] findProgramRow 시작');
    debugConsole.log('[진단] 전체 rows:', rows);
    debugConsole.log('[진단] rows.length:', rows.length);

    if (rows.length === 0) {
      debugConsole.warn('[진단] CSV에 행이 하나도 없음 (rows.length === 0) → 시트가 비어있거나 CSV 응답이 비정상입니다.');
      debugConsole.groupEnd();
      return null;
    }

    var rawHeader = rows[0];
    debugConsole.log('[진단] 원본 헤더 행(rawHeader):', rawHeader);

    var header = rawHeader.map(function (h) {
      return String(h || '').trim().toLowerCase();
    });
    debugConsole.log('[진단] 정규화된 헤더(header):', JSON.stringify(header));

    // 정규화(눈에 안 보이는 문자 제거)한 헤더로도 한 번 더 찾아봄 (방어적 매칭)
    var normalizedHeader = rawHeader.map(function (h) {
      return normalizeForCompare_(String(h || '')).toLowerCase();
    });

    var idIndex = header.indexOf('id');
    debugConsole.log('[진단] header.indexOf("id") 결과 idIndex:', idIndex);

    if (idIndex === -1) {
      idIndex = normalizedHeader.indexOf('id');
      debugConsole.log('[진단] 일반 매칭 실패 → 정규화 매칭으로 재시도한 idIndex:', idIndex);
    }

    if (idIndex === -1) {
      debugConsole.error('[진단] "id" 컬럼을 헤더에서 끝내 못 찾음. 헤더 각 칸을 문자코드까지 출력합니다:');
      rawHeader.forEach(function (h, i) {
        debugInspectString_('헤더[' + i + ']', h);
      });
      debugConsole.groupEnd();
      return null;
    }

    debugConsole.log('[진단] 목표 PROGRAM_ID:', JSON.stringify(PROGRAM_ID));
    debugInspectString_('PROGRAM_ID', PROGRAM_ID);
    var normalizedTarget = normalizeForCompare_(PROGRAM_ID);

    for (var r = 1; r < rows.length; r += 1) {
      var rawIdValue = rows[r][idIndex];
      var normalizedRowId = normalizeForCompare_(rawIdValue);

      debugConsole.log(
        '[진단] ' + r + '번째 데이터 행 비교 — rows[' + r + '][' + idIndex + ']:',
        JSON.stringify(rawIdValue),
        '/ 정규화값:', JSON.stringify(normalizedRowId),
        '/ 정확일치(===):', rawIdValue === PROGRAM_ID,
        '/ 정규화일치:', normalizedRowId === normalizedTarget
      );

      if (rawIdValue !== PROGRAM_ID) {
        debugInspectString_('rows[' + r + '][' + idIndex + ']', rawIdValue);
      }

      // 1차: 완전 일치. 2차(방어): 눈에 안 보이는 문자·공백 제거 후 일치.
      if (rawIdValue === PROGRAM_ID || normalizedRowId === normalizedTarget) {
        var program = {};

        for (var c = 0; c < header.length; c += 1) {
          program[header[c]] = rows[r][c] !== undefined ? rows[r][c] : '';
        }

        debugConsole.log('[진단] 매칭 성공! program 객체:', program);
        debugConsole.groupEnd();
        return program;
      }
    }

    debugConsole.warn('[진단] 모든 데이터 행을 다 확인했지만 일치하는 id를 못 찾음.');
    debugConsole.groupEnd();

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
  // [세션 카드] 표 대신 쓰는 아코디언형 프로그램 목록.
  // 대분류(구분)별로 묶어서, 접힌 상태에는 날짜·시간·강의명·짧은 소개·정원·비고만 보여주고,
  // 카드를 클릭하면 자세한 강의 내용 + 그 날짜만 하이라이트한 미니 캘린더가 펼쳐짐.
  // ------------------------------------------------------------

  // 세션 하나의 날짜만 강조한 작은 달력. 하이라이트 원 + 별 표시 + 큰 숫자 + 문구 캡션까지
  // 다 넣어서, 여러 날짜가 있는 일반 캘린더 블록보다 훨씬 눈에 확 띄게 함.
  function buildSessionMiniCalendar_(year, month, day, labelText) {
    var wrap = document.createElement('div');
    wrap.className = 'iw-detail-session-calendar';

    var monthLabel = document.createElement('div');
    monthLabel.className = 'iw-detail-session-calendar-month';
    monthLabel.textContent = year + '년 ' + month + '월';
    wrap.appendChild(monthLabel);

    var table = document.createElement('table');
    table.className = 'iw-detail-session-calendar-grid';

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
    var weeks = buildCalendarWeeks(year, month);

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

          if (dayValue === day) {
            td.classList.add('iw-detail-session-calendar-highlight');

            var circle = document.createElement('span');
            circle.className = 'iw-detail-session-calendar-highlight-circle';
            circle.textContent = dayValue;

            var star = document.createElement('span');
            star.className = 'iw-detail-session-calendar-star';
            star.setAttribute('aria-hidden', 'true');
            star.textContent = '★';
            circle.appendChild(star);

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

    var weekday = WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];
    var caption = document.createElement('div');
    caption.className = 'iw-detail-session-calendar-caption';
    if (isEditMode_() && labelText) {
      setText_(caption, '★ ' + month + '월 ' + day + '일(' + weekday + ') · ');
      var labelPart = document.createElement('span');
      setText_(labelPart, labelText, 'calendarLabel');
      caption.appendChild(labelPart);
    } else {
      setText_(caption, '★ ' + month + '월 ' + day + '일(' + weekday + ')' + (labelText ? ' · ' + labelText : ''));
    }
    wrap.appendChild(caption);

    return wrap;
  }

  // 세션 카드 하나(접힌 상태 + 클릭하면 펼쳐지는 상세 영역)
  function buildSessionCard_(session) {
    var card = document.createElement('div');
    card.className = 'iw-detail-session-card';

    var head = document.createElement('div');
    head.className = 'iw-detail-session-card-head';

    var dateBox = document.createElement('div');
    dateBox.className = 'iw-detail-session-card-date';

    if (session.month) {
      var monthEl = document.createElement('span');
      monthEl.className = 'iw-detail-session-card-date-month';
      monthEl.textContent = session.month + '월';
      dateBox.appendChild(monthEl);
    }

    if (session.day) {
      var dayEl = document.createElement('span');
      dayEl.className = 'iw-detail-session-card-date-day';
      dayEl.textContent = session.day;
      dateBox.appendChild(dayEl);
    }

    if (session.time) {
      var timeEl = document.createElement('span');
      timeEl.className = 'iw-detail-session-card-date-time';
      setText_(timeEl, session.time, 'time');
      dateBox.appendChild(timeEl);
    }

    head.appendChild(dateBox);

    var body = document.createElement('div');
    body.className = 'iw-detail-session-card-body';

    if (session.title) {
      var titleEl = document.createElement('div');
      titleEl.className = 'iw-detail-session-card-title';
      setText_(titleEl, session.title, 'title');
      body.appendChild(titleEl);
    }

    if (session.shortDesc) {
      var descEl = document.createElement('div');
      descEl.className = 'iw-detail-session-card-desc';
      setText_(descEl, session.shortDesc, 'shortDesc');
      body.appendChild(descEl);
    }

    var metaParts = [];
    if (session.capacity) metaParts.push(session.capacity);
    if (session.note) metaParts.push(session.note);

    if (metaParts.length > 0) {
      var metaEl = document.createElement('div');
      metaEl.className = 'iw-detail-session-card-meta';
      if (isEditMode_()) {
        // 편집 모드에선 정원·강사를 각각 고칠 수 있게 나눠 담음 (보이는 모습은 같음)
        [['capacity', session.capacity], ['note', session.note]].forEach(function (pair) {
          if (!pair[1]) return;
          if (metaEl.childNodes.length) metaEl.appendChild(document.createTextNode(' · '));
          var part = document.createElement('span');
          setText_(part, pair[1], pair[0]);
          metaEl.appendChild(part);
        });
      } else {
        setText_(metaEl, metaParts.join(' · '));
      }
      body.appendChild(metaEl);
    }

    head.appendChild(body);

    var hasDetail = (session.detailHtml && session.detailHtml.trim()) ||
      (session.year && session.month && session.day);

    if (hasDetail) {
      var chevron = document.createElement('span');
      chevron.className = 'iw-detail-session-card-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = '▾';
      head.appendChild(chevron);

      // [모션] 바깥(expandPanel)은 overflow:hidden + max-height 0→내용높이 로만 애니메이션하고,
      // 실제 여백/테두리는 안쪽(expandInner)에 둠. 이렇게 나눠야 접혔을 때 padding 때문에
      // 빈 여백이 살짝 남는 것도 막고, max-height 트랜지션이 CSS만으로 부드럽게 동작함.
      var expandPanel = document.createElement('div');
      expandPanel.className = 'iw-detail-session-card-expand';

      var expandInner = document.createElement('div');
      expandInner.className = 'iw-detail-session-card-expand-inner';
      expandPanel.appendChild(expandInner);

      if (session.detailHtml && session.detailHtml.trim()) {
        var detailEl = document.createElement('div');
        detailEl.className = 'iw-detail-session-card-detail';
        // [텍스트 블록과 동일하게] 글자 크기·줄간격을 세션마다 지정한 값으로 적용
        // [버그 수정] 관리 화면 드롭다운은 값이 비어있으면 "보통"을 기본으로 보여주는데,
        // 여기서도 똑같이 기본값을 적용해야 함. 이 기능이 생기기 전에 저장된 세션은
        // detailFontSize 값 자체가 없어서(undefined), 기본값 보정 없이는 CSS의 예전
        // 크기(13px)로 표시되는 반면, 관리 화면에는 "보통"이 선택된 것처럼 보이는
        // 불일치가 있었음.
        detailEl.style.fontSize = TEXT_FONT_SIZE_MAP[session.detailFontSize || 'medium'] || '';
        detailEl.style.lineHeight = TEXT_LINE_HEIGHT_MAP[session.detailLineHeight || 'normal'] || '';
        detailEl.innerHTML = sanitizeHtml_(session.detailHtml);
        tagPath_(detailEl, 'detailHtml');
        expandInner.appendChild(detailEl);
      }

      // [세부 항목] 준비물/재료비 등, "장소 및 일정"의 세부항목과 완전히 같은 방식으로 표시
      var sessionDetailRows = session.detailRows || [];

      if (sessionDetailRows.length > 0) {
        var sessionDetailRowsWrap = document.createElement('div');
        sessionDetailRowsWrap.className = 'iw-detail-region-details iw-detail-session-card-detail-rows';

        for (var sdr = 0; sdr < sessionDetailRows.length; sdr += 1) {
          sessionDetailRowsWrap.appendChild(withPath_('detailRows.' + sdr + '.', function () { return createDetailRow(sessionDetailRows[sdr]); }));
        }

        expandInner.appendChild(sessionDetailRowsWrap);
      }

      if (session.year && session.month && session.day) {
        // [구분선] 강의 내용(+세부 항목)과 캘린더 사이 — 위에 아무것도 없으면(강의 내용도
        // 세부 항목도 없이 캘린더만 있는 경우) 굳이 안 그림
        if ((session.detailHtml && session.detailHtml.trim()) || sessionDetailRows.length > 0) {
          var calendarDivider = document.createElement('div');
          calendarDivider.className = 'iw-detail-session-card-divider';
          expandInner.appendChild(calendarDivider);
        }

        expandInner.appendChild(
          buildSessionMiniCalendar_(session.year, session.month, session.day, session.calendarLabel || '')
        );
      }

      head.style.cursor = 'pointer';
      head.setAttribute('role', 'button');
      head.setAttribute('tabindex', '0');
      head.setAttribute('aria-expanded', 'false');

      var toggleExpand = function () {
        var isOpen = card.classList.toggle('iw-detail-session-card--open');
        head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        // 매번 실제 내용 높이를 다시 재서 그 값까지 부드럽게 트랜지션함(내용 길이가
        // 제각각이라 고정값을 쓰면 짧은 카드는 여백이 남고 긴 카드는 잘릴 수 있음)
        if (isOpen) {
          expandPanel.style.maxHeight = expandInner.scrollHeight + 'px';
        } else {
          // 다 펼쳐진 뒤엔 높이 제한을 풀어뒀으므로(아래), 접힘 애니메이션이 보이게 지금 높이를 먼저 px로 고정
          expandPanel.style.maxHeight = expandPanel.scrollHeight + 'px';
          void expandPanel.offsetHeight;
          expandPanel.style.maxHeight = '0px';
        }
      };

      // [1단계 수정] 펼침 애니메이션이 끝나면 높이 제한을 풀어서, 안의 사진이 늦게 뜨거나
      // 화면을 돌려 폭이 바뀌어도 내용이 잘리지 않게 함
      expandPanel.addEventListener('transitionend', function (e) {
        if (e.propertyName === 'max-height' && card.classList.contains('iw-detail-session-card--open')) {
          expandPanel.style.maxHeight = 'none';
        }
      });

      head.addEventListener('click', toggleExpand);
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleExpand();
        }
      });

      card.appendChild(head);
      card.appendChild(expandPanel);
    } else {
      card.appendChild(head);
    }

    return card;
  }

  // [세션 카드] 요소 하나(대분류별 그룹 여러 개) 전체 렌더링
  // [카드 크기 통일] 한 그룹(grid) 안의 카드들 중 "접힌 상태(head)"가 가장 큰 카드를 찾아,
  // 그 높이로 나머지 카드의 head도 똑같이 맞춰줌. 펼쳐진 상태(expand)는 손대지 않음 —
  // 펼침 애니메이션은 이미 max-height로 별도 처리하고 있어서 여기서 높이를 강제로 만지면
  // 애니메이션이 어긋날 수 있음.
  function equalizeSessionCardHeads_(grid) {
    var heads = grid.querySelectorAll('.iw-detail-session-card-head');

    if (heads.length < 2) {
      return;
    }

    // 먼저 전부 auto로 되돌려서, 내용이 바뀐 뒤(재실행) 예전 높이가 남아있지 않게 함
    heads.forEach(function (head) { head.style.minHeight = ''; });

    var maxHeight = 0;
    heads.forEach(function (head) {
      maxHeight = Math.max(maxHeight, head.offsetHeight);
    });

    if (maxHeight > 0) {
      heads.forEach(function (head) { head.style.minHeight = maxHeight + 'px'; });
    }
  }

  function buildSessionsElement(element) {
    var groups = (element.groups || []).filter(function (g) {
      return g && (g.sessions || []).some(function (s) { return s && (s.title || '').trim(); });
    });

    if (groups.length === 0) {
      return null;
    }

    var wrap = document.createElement('div');
    wrap.className = 'iw-detail-sessions';

    groups.forEach(function (group) {
      withPath_('groups.' + element.groups.indexOf(group) + '.', function () { buildSessionGroup_(group); });
    });

    function buildSessionGroup_(group) {
      var sessions = (group.sessions || []).filter(function (s) { return s && (s.title || '').trim(); });

      if (sessions.length === 0) {
        return;
      }

      var groupWrap = document.createElement('div');
      groupWrap.className = 'iw-detail-sessions-group';

      var header = document.createElement('div');
      header.className = 'iw-detail-sessions-group-header';

      if (group.name) {
        var badge = document.createElement('span');
        badge.className = 'iw-detail-sessions-group-badge';
        setText_(badge, group.name, 'name');
        if (group.badgeColor) {
          badge.style.background = group.badgeColor;
        }
        header.appendChild(badge);
      }

      var count = document.createElement('span');
      count.className = 'iw-detail-sessions-group-count';
      count.textContent = sessions.length + '개 세션';
      header.appendChild(count);

      groupWrap.appendChild(header);

      var grid = document.createElement('div');
      grid.className = 'iw-detail-sessions-grid';

      sessions.forEach(function (session) {
        grid.appendChild(withPath_('sessions.' + group.sessions.indexOf(session) + '.', function () { return buildSessionCard_(session); }));
      });

      groupWrap.appendChild(grid);
      wrap.appendChild(groupWrap);

      // [카드 크기 통일] 접힌 상태(head)만 가장 큰 카드 기준으로 높이를 맞춤.
      // CSS grid의 기본 stretch를 그대로 쓰면 카드를 "펼칠 때"도 옆 카드가 같이
      // 늘어나 보이는 문제가 생겨서(위 align-items:start로 그건 막아둠), 대신
      // 접힌 상태의 높이 맞추기는 JS로 따로 처리함. 실제 화면에 붙은 뒤에야 높이를
      // 잴 수 있어서 requestAnimationFrame으로 한 박자 늦춰서 실행함.
      requestAnimationFrame(function () { equalizeSessionCardHeads_(grid); });
    }

    return wrap;
  }

  // ------------------------------------------------------------
  // [지역] 지역(장소 및 일정) 블록 렌더링
  // ------------------------------------------------------------

  // 라벨 텍스트를 한 글자씩 개별 span으로 쪼갬 — 라벨 폭이 넓게 통일된 뒤,
  // CSS의 justify-content: space-between과 만나 짧은 글자도 폭 전체에 균등하게 퍼짐
  // (예: "날짜" → "날" ... "짜" 처럼 벌어지고, "모집인원"처럼 이미 꽉 찬 라벨은 그대로 보임)
  function appendJustifiedCharacters(container, text) {
    var chars = String(text || '').split('');

    for (var i = 0; i < chars.length; i += 1) {
      var charSpan = document.createElement('span');
      charSpan.textContent = chars[i];
      container.appendChild(charSpan);
    }
  }

  function createDetailRow(row) {
    var line = document.createElement('div');
    line.className = 'iw-detail-region-detail';
    // [배치] 전체/절반 폭. 값이 없는 예전 데이터는 항상 전체 폭으로 처리됨
    line.setAttribute('data-width', row.width === 'half' ? 'half' : 'full');

    var label = document.createElement('span');
    label.className = 'iw-detail-region-detail-label';
    var labelText = row.label || '';

    tagPath_(label, 'label');

    // [4A] 새 형식 라벨에 서식 태그가 있으면 그대로 그리고, 없으면 지금처럼 글자를 벌려 그림
    if (currentFmt2_ && labelText.indexOf('<') !== -1) {
      label.innerHTML = sanitizeHtml_(labelText);
      labelText = IWFormat.plainText(labelText);
    } else {
      if (currentFmt2_) labelText = IWFormat.plainText(labelText);
      appendJustifiedCharacters(label, labelText);
    }

    // 글자가 1개뿐이면 space-between이 왼쪽으로 쏠려 보이므로, 이 경우만 가운데 정렬로 보정
    if (labelText.length <= 1) {
      label.style.justifyContent = 'center';
    }

    var content = document.createElement('span');
    content.className = 'iw-detail-region-detail-content';

    // "|"로 구분된 항목("7월 8일(수)" 같은 덩어리)이 중간에서 쪼개져 줄바꿈되지 않도록,
    // 항목 하나하나를 nowrap 처리하고 "|" 자리에서만 줄바꿈이 되도록 함
    var rawContent = row.content || '';
    // [4A] 새 형식은 "|" 를 해석하지 않음 (변환할 때 덩어리 표시로 이미 바뀜)
    var chunks = currentFmt2_ ? [] : rawContent.split('|');

    if (currentFmt2_) {
      content.innerHTML = sanitizeHtml_(rawContent);
    }
    tagPath_(content, 'content');

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

  // 지역(장소) 하나 안에서, 세부항목 라벨(날짜/시간/모집인원 등)들의 폭을 전부 통일함.
  // 이미 실제 문서에 삽입되어 레이아웃이 계산된 뒤에 호출해야 정확한 폭을 잴 수 있음.
  function equalizeRegionLabels(regionEl) {
    var labels = regionEl.querySelectorAll('.iw-detail-region-detail-label');

    if (labels.length === 0) {
      return;
    }

    var maxWidth = 0;

    for (var i = 0; i < labels.length; i += 1) {
      labels[i].style.width = ''; // 혹시 이전에 강제 폭이 남아있으면 리셋 후 다시 측정
      var w = labels[i].getBoundingClientRect().width;

      if (w > maxWidth) {
        maxWidth = w;
      }
    }

    for (var j = 0; j < labels.length; j += 1) {
      labels[j].style.width = maxWidth + 'px';
    }
  }

  function createRegionElement(region) {
    region = region || {};
    var section = document.createElement('div');
    section.className = 'iw-detail-region';

    // 이 지역만 다른 이름 색을 쓰고 싶으면 region.nameColor 지정 (안 넣으면 카테고리 기본색을 그대로 씀)
    if (region.nameColor) {
      section.style.setProperty('--region-name-color', region.nameColor);
    }

    var name = document.createElement('h3');
    name.className = 'iw-detail-region-name';
    tagBlock_(section);
    setText_(name, region.name || '', 'name');
    section.appendChild(name);

    if (region.subtitle) {
      var subtitle = document.createElement('p');
      subtitle.className = 'iw-detail-region-subtitle';
      setText_(subtitle, region.subtitle, 'subtitle');
      section.appendChild(subtitle);
    }

    var detailRows = region.detailRows || [];

    if (detailRows.length > 0) {
      var detailsWrap = document.createElement('div');
      detailsWrap.className = 'iw-detail-region-details';

      for (var d = 0; d < detailRows.length; d += 1) {
        detailsWrap.appendChild(withPath_('detailRows.' + d + '.', function () { return createDetailRow(detailRows[d]); }));
      }

      section.appendChild(detailsWrap);
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
  // [한 줄 소개] 제목 아래, 구분선 위에 들어가는 짧은 소개 문구
  // ------------------------------------------------------------

  // 페이지 스니펫에 이미 있는 요소가 아니므로, 없으면 직접 만들어서
  // .iw-detail-title 과 .iw-detail-divider 사이에 끼워 넣음
  function getOrCreateSubtitleElement(root) {
    var existing = root.querySelector('.iw-detail-subtitle');

    if (existing) {
      return existing;
    }

    var titleEl = root.querySelector('.iw-detail-title');
    var dividerEl = root.querySelector('.iw-detail-divider');

    if (!titleEl || !dividerEl) {
      return null;
    }

    var subtitleEl = document.createElement('p');
    subtitleEl.className = 'iw-detail-subtitle';
    titleEl.parentNode.insertBefore(subtitleEl, dividerEl);

    return subtitleEl;
  }

  // subtitleLabel/subtitleText를 받아 라벨(있으면 굵게, 포인트색) + 본문 텍스트로 채움.
  // 둘 다 비어 있으면 요소 자체를 숨김 (기존 페이지 레이아웃과 동일하게 유지됨)
  function renderSubtitle(root, subtitleLabel, subtitleText) {
    var hasContent = !!(subtitleText && subtitleText.trim());
    subtitleText = subtitleText || '';

    if (!hasContent && !isEditMode_()) {
      var existing = root.querySelector('.iw-detail-subtitle');
      if (existing) {
        existing.style.display = 'none';
      }
      return;
    }

    var subtitleEl = getOrCreateSubtitleElement(root);

    if (!subtitleEl) {
      return;
    }

    subtitleEl.innerHTML = '';
    subtitleEl.style.display = '';

    if ((subtitleLabel && subtitleLabel.trim()) || isEditMode_()) {
      var labelSpan = document.createElement('span');
      labelSpan.className = 'iw-detail-subtitle-label';
      setText_(labelSpan, (subtitleLabel || '').trim(), 'subtitleLabel');
      subtitleEl.appendChild(labelSpan);
    }

    tagBlock_(subtitleEl, 'subtitle');

    if (isEditMode_()) {
      var textPart = document.createElement('span');
      setText_(textPart, subtitleText.trim(), 'subtitleText');
      subtitleEl.appendChild(textPart);
    } else if (currentFmt2_) {
      subtitleEl.insertAdjacentHTML('beforeend', sanitizeHtml_(subtitleText.trim()));
    } else {
      subtitleEl.appendChild(document.createTextNode(subtitleText.trim()));
    }
  }

  // ------------------------------------------------------------
  // 하단 정보 블록 공통 부품 — [모집인원] [주요내용] [문의] [추가정보]
  // ------------------------------------------------------------

  function createInfoRow(labelText, contentEl) {
    var row = document.createElement('div');
    row.className = 'iw-detail-info-row';

    var label = document.createElement('div');
    label.className = 'iw-detail-info-label';
    setText_(label, labelText, 'label');

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
      img.alt = currentFmt2_ ? IWFormat.plainText(validPhotos[p].caption) : (validPhotos[p].caption || '');
      photoItem.appendChild(img);

      if (validPhotos[p].caption) {
        var caption = document.createElement('figcaption');
        setText_(caption, validPhotos[p].caption, 'items.' + photos.indexOf(validPhotos[p]) + '.caption');
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

    // [4A] 새 요소: 글머리 목록(항목마다 서식), 강조 상자
    if (element.type === 'list') {
      var listEl = document.createElement('ul');
      listEl.className = 'iw-detail-info-list iw-detail-info-el-list';
      (element.items || []).forEach(function (item, index) {
        if ((!item || !IWFormat.plainText(item)) && !isEditMode_()) return;
        var itemEl = document.createElement('li');
        itemEl.innerHTML = sanitizeHtml_(item);
        tagPath_(itemEl, 'items.' + index);
        listEl.appendChild(itemEl);
      });
      return listEl.childNodes.length ? listEl : null;
    }

    if (element.type === 'callout') {
      if ((!element.html || !IWFormat.plainText(element.html)) && !isEditMode_()) return null;
      var calloutEl = document.createElement('div');
      calloutEl.className = 'iw-detail-info-callout';
      calloutEl.innerHTML = sanitizeHtml_(element.html);
      tagPath_(calloutEl, 'html');
      return calloutEl;
    }

    if (!element || !element.type) {
      return null;
    }

    if (element.type === 'subheading') {
      if (!element.text && !isEditMode_()) {
        return null;
      }
      var subEl = document.createElement('h4');
      subEl.className = 'iw-detail-info-subheading';
      setText_(subEl, element.text, 'text');
      return subEl;
    }

    if (element.type === 'text') {
      if (!element.html && !isEditMode_()) {
        return null;
      }
      var textEl = document.createElement('div');
      textEl.className = 'iw-detail-info-richtext';
      textEl.innerHTML = sanitizeHtml_(element.html);
      tagPath_(textEl, 'html');
      // [글자 크기 / 줄간격] 블록 전체에 적용되는 값. 값이 없는 예전 데이터는
      // CSS 기본값(font-size:16px, line-height:1.7)이 그대로 적용됨
      textEl.style.fontSize = TEXT_FONT_SIZE_MAP[element.fontSize] || '';
      textEl.style.lineHeight = TEXT_LINE_HEIGHT_MAP[element.lineHeight] || '';
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

    if (element.type === 'button') {
      return buildButtonElement(element);
    }

    if (element.type === 'sessions') {
      return buildSessionsElement(element);
    }

    return null;
  }

  // [버튼] 문구 + 링크가 둘 다 있어야 노출됨 (하나라도 비면 자동으로 숨김, 실수 방지용).
  // 색은 카테고리 포인트색(--accent, 이미 root에 지정돼 있음)을 그대로 씀. 새 탭으로 열림.
  function buildButtonElement(element) {
    // [1단계 수정] 허용되지 않는 주소(javascript: 등)도 "링크 없음"으로 보고 버튼을 숨김
    if (!element || !element.text || !safeUrl_(element.url)) {
      return null;
    }

    var wrap = document.createElement('div');
    wrap.className = 'iw-detail-info-button-wrap';

    var link = document.createElement('a');
    link.className = 'iw-detail-info-button';
    link.setAttribute('data-style', element.style === 'outline' ? 'outline' : 'filled');
    link.href = safeUrl_(element.url);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    setText_(link, element.text, 'text');

    wrap.appendChild(link);
    return wrap;
  }

  // [표] 칸 하나를 표준 형태 { text, rowspan, colspan, hidden }로 맞춤
  // (hidden=true는 다른 칸에 합쳐져서 화면에 별도로 안 그려지는 자리)
  function normalizeTableCell(cell) {
    if (cell && typeof cell === 'object') {
      return {
        text: cell.text || '',
        // [표 서식] 관리 화면에서 셀을 워드처럼 직접 편집(굵게/기울임/색 등)한 결과물.
        // 있으면 이 값을 최우선으로 그대로 그리고, 없으면(예전 데이터) text를 씀
        html: cell.html || '',
        bg: cell.bg || '',
        rowspan: cell.rowspan || 1,
        colspan: cell.colspan || 1,
        hidden: !!cell.hidden
      };
    }

    return { text: cell || '', html: '', bg: '', rowspan: 1, colspan: 1, hidden: false };
  }

  // [표 - 줄바꿈] 셀 안에 실수로 들어간 줄바꿈(Alt+Enter, 복사 과정에서 우연히 생긴 것 등)은
  // 전부 무시하고 공백으로 합쳐버립니다. 그 대신 셀 안에 "|" 기호를 직접 입력한 자리에서만
  // 실제로 줄을 바꿉니다. 예전에는 실제 줄바꿈이 있으면 CSS(white-space: pre-line)가 그걸
  // 그대로 살리는 동시에 폭이 좁으면 자동 줄바꿈도 같이 일어나서, 의도한 줄바꿈과 자동
  // 줄바꿈이 겹쳐 어색해 보이는 문제가 있었음 — 이제는 "|" 로 표시한 곳만 강제 줄바꿈이고
  // 나머지는 전부 자연스러운 자동 줄바꿈 하나만 적용됨.
  function fillTableCell_(td, rawText) {
    var flattened = String(rawText == null ? '' : rawText)
      .replace(/\r\n|\r|\n/g, ' ') // 실수로 들어간 줄바꿈 → 공백으로 합침
      .replace(/[ \t]+/g, ' '); // 중복 공백 정리

    var parts = flattened.split('|').map(function (part) {
      return part.trim();
    });

    parts.forEach(function (part, index) {
      if (index > 0) {
        td.appendChild(document.createElement('br')); // "|" 자리에서만 강제 줄바꿈
      }
      td.appendChild(document.createTextNode(part));
    });
  }

  // [표 서식] 셀 하나를 채움. html(관리 화면에서 워드처럼 직접 편집한 서식 있는 내용)이
  // 있으면 그걸 그대로 신뢰해서 그리고(다른 텍스트 블록·도식 요소와 동일한 방식),
  // 없으면(예전 데이터, 또는 서식 편집을 아직 안 한 셀) 예전 방식(text + "|" 줄바꿈)으로 그림.
  // bg가 있으면 셀 배경색도 같이 입힘.
  function fillTableCellRich_(td, cell) {
    if (cell.html || currentFmt2_) {
      td.innerHTML = sanitizeHtml_(cell.html);
    } else {
      fillTableCell_(td, cell.text);
    }

    if (cell.bg) {
      td.style.backgroundColor = cell.bg;
    }
  }

  // [표] 요소 하나를 실제 <table>로 만듦 (rowspan/colspan으로 합쳐진 칸 반영)
  function buildTableElement(element) {
    var headers = element.headers || [];
    var rows = (element.rows || []).map(function (row) {
      return row.map(normalizeTableCell);
    });

    var hasHeaderContent = headers.some(function (h) { return h && h.trim(); });
    var hasRowContent = rows.some(function (r) {
      return r.some(function (c) { return (c.text && c.text.trim()) || (c.html && c.html.trim()); });
    });

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
        tagPath_(th, 'headers.' + h);
        if (currentFmt2_) {
          th.innerHTML = sanitizeHtml_(headers[h]);
        } else {
          fillTableCell_(th, headers[h]);
        }
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
        fillTableCellRich_(td, cell);
        tagPath_(td, 'rows.' + r + '.' + c + '.html');

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
      stepContent.innerHTML = sanitizeHtml_(steps[i].html);
      tagPath_(stepContent, 'steps.' + element.steps.indexOf(steps[i]) + '.html');

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
        setText_(li, items[h], 'items.' + h);
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

        // 이름+전화번호는 한 줄(양끝 정렬), 주소는 있을 때만 그 아래 별도 줄로 표시
        var contactMain = document.createElement('div');
        contactMain.className = 'iw-detail-info-contact-main';

        var name = document.createElement('span');
        name.className = 'iw-detail-info-contact-name';
        setText_(name, contact.name || '', 'items.' + c + '.name');
        if (contact.color) name.style.color = contact.color; // 없으면 CSS 기본색(--text-strong)

        var phone = document.createElement('span');
        phone.className = 'iw-detail-info-contact-phone';
        setText_(phone, contact.phone || '', 'items.' + c + '.phone');

        contactMain.appendChild(name);
        contactMain.appendChild(phone);
        contactRow.appendChild(contactMain);

        // [주소] 있을 때만 표시
        if (contact.address) {
          var address = document.createElement('span');
          address.className = 'iw-detail-info-contact-address';
          setText_(address, contact.address, 'items.' + c + '.address');
          contactRow.appendChild(address);
        }

        contactsWrap.appendChild(contactRow);
      }

      return contactsWrap;
    }

    if (block.type === 'photos') {
      // 예전 버전 호환: "추가정보 = 사진 블록" 이었던 시절의 블록 타입
      return buildPhotosElement(block.items, block.layout);
    }

    if (block.type === 'calendar') {
      // [캘린더 블록] 장소·일정 블록 안의 달력과 완전히 동일한 요소(createCalendarElement)를
      // 재사용. 위치는 이 블록이 info.blocks 안에서 어디에 놓였는지에 따라 자유롭게 정해짐.
      var months = block.months || [];

      if (months.length === 0) {
        return null;
      }

      var monthsWrap = document.createElement('div');
      monthsWrap.className = 'iw-detail-months';

      for (var mi = 0; mi < months.length; mi += 1) {
        monthsWrap.appendChild(createCalendarElement(months[mi]));
      }

      return monthsWrap;
    }

    if (block.type === 'custom') {
      // 추가 정보 블록: 소제목/텍스트/사진/표/도식이 저장된 순서 그대로 이어서 나옴
      var wrap = document.createElement('div');
      wrap.className = 'iw-detail-info-custom-elements';
      var hasContent = false;

      var elements = block.elements || [];

      var previousType = null;

      for (var ei = 0; ei < elements.length; ei += 1) {
        var elementEl = withPath_('elements.' + ei + '.', function () {
          var node = buildCustomElementNode(elements[ei]) || (isEditMode_() && elements[ei] ? editEmpty_() : null);
          tagBlock_(node);
          return node;
        });

        if (elementEl) {
          if (hasContent) {
            if (elements[ei].type === 'subheading') {
              elementEl.style.marginTop = '32px'; // 소제목 위 여백 — 윗 블록과 확실히 구분
            } else if (previousType === 'subheading') {
              elementEl.style.marginTop = '18px'; // 소제목 바로 아래 여백 — 위 여백보다 작게
            } else {
              elementEl.style.marginTop = '14px'; // 그 외 일반 요소 간 여백 — 기존과 동일
            }
          }
          wrap.appendChild(elementEl);
          hasContent = true;
          previousType = elements[ei].type;
        }
      }

      if (!hasContent) {
        // 예전 버전 호환: elements 배열이 생기기 전(lines/photos/html/value)에 저장된 데이터
        var allLines = block.lines || [];
        var lines = allLines.filter(function (l) { return l && l.trim(); });

        if (lines.length > 0) {
          var richList = document.createElement('ul');
          richList.className = 'iw-detail-info-list iw-detail-info-richtext';

          for (var rl = 0; rl < allLines.length; rl += 1) {
            if (!allLines[rl] || !allLines[rl].trim()) continue;
            var li2 = document.createElement('li');
            li2.innerHTML = sanitizeHtml_(allLines[rl]);
            tagPath_(li2, 'lines.' + rl);
            richList.appendChild(li2);
          }

          wrap.appendChild(richList);
          hasContent = true;
        } else if (block.html) {
          var richWrap = document.createElement('div');
          richWrap.className = 'iw-detail-info-richtext';
          richWrap.innerHTML = sanitizeHtml_(block.html);
          tagPath_(richWrap, 'html');
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
          setText_(legacyValue, block.value, 'value');
          wrap.appendChild(legacyValue);
          hasContent = true;
        }
      }

      return hasContent ? wrap : null;
    }

    if (block.type === 'button') {
      // [버튼] 문의처(contacts)처럼 독립된 블록. 여러 개면 나란히 배치됨(각 버튼은
      // buildButtonElement가 문구+링크 둘 다 있을 때만 만들어줌 — 하나라도 비면 자동 제외)
      var buttonItems = block.items || [];
      var buttonsWrap = document.createElement('div');
      buttonsWrap.className = 'iw-detail-info-buttons';
      var hasButton = false;

      for (var bi = 0; bi < buttonItems.length; bi += 1) {
        var buttonNode = withPath_('items.' + bi + '.', function () { return buildButtonElement(buttonItems[bi]); });

        if (buttonNode) {
          buttonsWrap.appendChild(buttonNode);
          hasButton = true;
        }
      }

      return hasButton ? buttonsWrap : null;
    }

    // recruit: 단순 텍스트 한 줄
    if (!block.value && !isEditMode_()) {
      return null;
    }
    var value = document.createElement('div');
    value.className = 'iw-detail-info-value';
    setText_(value, block.value, 'value');

    return value;
  }

  // info.blocks 배열 전체를 순서대로 렌더링 (구분선 + 라벨 + 내용을 블록마다 반복)
  // keys: 그릴 큰 블록 경로 목록. 없으면 정보 블록 전부(지금 방식).
  // 지역 블록이 섞여 있으면(블록 순서 지정) 지역도 정보 블록과 같은 구분선을 앞에 두고 이 자리에 그림
  function createInfoSection(info, keys, regions) {
    var wrap = document.createDocumentFragment();
    var blocks = info.blocks || [];

    if (!keys) {
      keys = blocks.map(function (x, index) { return 'info.blocks.' + index; });
    }

    for (var k = 0; k < keys.length; k += 1) {
      var regionMatch = keys[k].match(/^regions\.(\d+)$/);
      if (regionMatch) {
        var regionIndex = Number(regionMatch[1]);
        var regionRule = document.createElement('div');
        regionRule.className = 'iw-detail-info-rule';
        wrap.appendChild(regionRule);
        wrap.appendChild(withPath_(keys[k] + '.', function () { return createRegionElement(regions[regionIndex]); }));
        continue;
      }

      var b = Number(keys[k].split('.')[2]);
      var block = blocks[b];
      if (!block) continue;
      var infoRow = withPath_('info.blocks.' + b + '.', function () {
        var contentEl = createBlockContentElement(block);
        if (!contentEl) {
          if (!isEditMode_()) return null;
          contentEl = editEmpty_();
        }
        var row = createInfoRow(block.label || '', contentEl);
        tagBlock_(row);
        return row;
      });

      if (!infoRow) {
        continue;
      }

      var rule = document.createElement('div');
      rule.className = 'iw-detail-info-rule';
      wrap.appendChild(rule);

      wrap.appendChild(infoRow);
    }

    return wrap;
  }

  // ------------------------------------------------------------
  // 전체 조립 및 데이터 로딩
  // ------------------------------------------------------------

  function renderProgram(root, program, data) {
    currentFmt2_ = !!(data && data.fmt === IWFormat.FMT_VERSION);

    // [4A] 글자 크기 단계(iw-fs-small~xlarge)가 쓰는 값. 레이아웃 설정 단계값을 그대로 씀
    Object.keys(TEXT_FONT_SIZE_MAP).forEach(function (step) {
      root.style.setProperty('--iw-fs-' + step, TEXT_FONT_SIZE_MAP[step]);
    });

    // [1단계 통합] 메뉴별 카테고리 색표 선택. 관리 화면 미리보기처럼 메뉴를 모르면 카테고리 이름으로 추정
    var menu = program.menu || inferMenuFromCategory_(program.category);
    var styleMap = menu === 'edu' ? EDU_CATEGORY_STYLE_MAP : CATEGORY_STYLE_MAP;
    var categoryStyle = styleMap[program.category] || { bg: '#fdf1dc', line: '#d97b3f' };

    root.setAttribute('data-menu', menu);

    root.style.setProperty('--detail-bg', categoryStyle.bg);
    root.style.setProperty('--accent', categoryStyle.line);
    // [텍스트 전용색] 순수 글자색으로 쓰이는 4곳(한줄소개 라벨/지역명/블록 라벨/소제목)에서만 사용.
    // text가 따로 없으면 line과 동일한 값을 써서 기존과 똑같이 보임
    root.style.setProperty('--accent-text', categoryStyle.text || categoryStyle.line);
    // [4C-1] 사람이 고른 배경 테마가 있으면 카테고리 색 위에 덮어씀 (없으면 지금과 같음)
    var themeVars = IWFormat.themeVars(data && data.theme);
    Object.keys(themeVars).forEach(function (name) { root.style.setProperty(name, themeVars[name]); });
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

    tagBlock_(photo, 'photo');

    var badge = root.querySelector('.iw-detail-badge');
    badge.textContent = program.category || '';
    tagBlock_(badge, 'category');

    var title = root.querySelector('.iw-detail-title');
    if (currentFmt2_ && typeof data.titleHtml === 'string' && IWFormat.plainText(data.titleHtml)) {
      title.innerHTML = sanitizeHtml_(data.titleHtml);
    } else {
      title.textContent = program.title || '';
    }
    tagBlock_(title, 'title');
    tagPath_(title, 'titleHtml');

    // [한 줄 소개] dataJson 최상단에 저장된 subtitleLabel/subtitleText를 반영
    renderSubtitle(root, data && data.subtitleLabel, data && data.subtitleText);

    var regionsWrap = root.querySelector('.iw-detail-regions');
    regionsWrap.innerHTML = '';

    var regions = (data && data.regions) || [];

    var infoWrap = root.querySelector('.iw-detail-info');
    infoWrap.innerHTML = '';

    // [4A] 블록 순서(order)가 지정돼 지금 순서와 다르면, 지역도 정보 블록 사이 자리에 섞어 그림
    var order = IWFormat.normalizeOrder(data || {});
    var defaultOrder = IWFormat.normalizeOrder({ regions: data && data.regions, info: data && data.info });
    var mixedOrder = !!(data && Array.isArray(data.order)) && order.join(',') !== defaultOrder.join(',');

    // [라벨 폭 통일] 실제 문서에 삽입되어 레이아웃이 잡힌 뒤에 폭을 재야 정확해서,
    // 지역을 다 넣은 시점에 지역별로 한 번씩 실행함 (지역 간에는 서로 영향 없음).
    // 지금 순서에서는 정보 블록을 넣기 전에 실행해야 함 — 순서가 바뀌면 크롬이 표 가로 스크롤바를
    // 다시 계산하지 않아 높이가 15px 달라지는 일이 있었음(4A 비교 시험에서 발견)
    function equalizeAllRegionLabels() {
      var insertedRegionEls = root.querySelectorAll('.iw-detail-region');

      for (var ri = 0; ri < insertedRegionEls.length; ri += 1) {
        equalizeRegionLabels(insertedRegionEls[ri]);
      }
    }

    if (mixedOrder) {
      infoWrap.appendChild(createInfoSection((data && data.info) || {}, order, regions));
      equalizeAllRegionLabels();
    } else {
      for (var i = 0; i < regions.length; i += 1) {
        regionsWrap.appendChild(withPath_('regions.' + i + '.', function () { return createRegionElement(regions[i]); }));
      }

      equalizeAllRegionLabels();

      if (data && data.info) {
        infoWrap.appendChild(createInfoSection(data.info));
      }
    }
  }

  // 교육에만 있는 카테고리면 edu, 커뮤니티에만 있으면 community, 둘 다 있으면(재무설계) edu
  function inferMenuFromCategory_(category) {
    if (CATEGORY_STYLE_MAP[category] && !EDU_CATEGORY_STYLE_MAP[category]) {
      return 'community';
    }

    return 'edu';
  }

  function renderError(root) {
    root.setAttribute('data-status', 'error');
    var photo = root.querySelector('.iw-detail-photo');
    photo.textContent = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    console.warn('[상세페이지] 프로그램을 표시하지 못했습니다. 페이지 주소 끝에 ?iwdebug=1 을 붙여 다시 열면 원인이 콘솔에 나옵니다.');
  }

  // [4A] 시트의 설정 CSV를 읽어 색표·글자 단계를 덮어씀. 실패·지연돼도 절대 멈추지 않음(항상 resolve)
  function loadSheetSettings_() {
    var jobs = [];

    // [4B] 관리웹앱 편집 화면은 이미 읽어 둔 설정을 넘겨줌 (시트를 다시 읽지 않아 바로 그려짐)
    if (window.__IW_SETTINGS__) {
      if (window.__IW_SETTINGS__.categories) applyCategoryRows_(window.__IW_SETTINGS__.categories);
      if (window.__IW_SETTINGS__.layout) applyLayoutRows_(window.__IW_SETTINGS__.layout);
      return Promise.resolve();
    }

    function fetchCsv(url) {
      var bust = url + (url.indexOf('?') === -1 ? '?' : '&') + 'cachebust=' + Date.now();
      return fetch(bust, { cache: 'no-store' }).then(function (response) {
        if (!response.ok) throw new Error('status ' + response.status);
        return response.text();
      }).then(parseCsv);
    }

    if (CATEGORIES_CSV_URL) {
      jobs.push(fetchCsv(CATEGORIES_CSV_URL).then(applyCategoryRows_).catch(function (err) {
        debugConsole.warn('[진단] 카테고리 색 CSV 실패 → 파일 안 색표 사용:', err);
      }));
    }

    if (LAYOUT_CSV_URL) {
      jobs.push(fetchCsv(LAYOUT_CSV_URL).then(applyLayoutRows_).catch(function (err) {
        debugConsole.warn('[진단] 글자 단계 CSV 실패 → 파일 안 값 사용:', err);
      }));
    }

    if (jobs.length === 0) {
      return Promise.resolve();
    }

    return Promise.race([
      Promise.all(jobs),
      new Promise(function (resolve) { setTimeout(resolve, SETTINGS_WAIT_MS); })
    ]);
  }

  function rowsToObjects_(rows) {
    var header = (rows[0] || []).map(function (h) { return String(h || '').trim(); });
    return rows.slice(1).map(function (row) {
      var obj = {};
      header.forEach(function (h, i) { obj[h] = String(row[i] == null ? '' : row[i]).trim(); });
      return obj;
    });
  }

  // categories 탭: menu,name,bg,accent,text,locked → 메뉴별 색표에 덮어씀 (없는 이름은 파일 안 값 유지)
  function applyCategoryRows_(rows) {
    rowsToObjects_(rows).forEach(function (row) {
      var isColor = /^#[0-9a-f]{3,8}$/i;
      if (!row.name || !isColor.test(row.bg) || !isColor.test(row.accent) || (row.text && !isColor.test(row.text))) {
        if (row.name) debugConsole.warn('[진단] 카테고리 색 형식이 아님 → 파일 안 값 유지:', row);
        return;
      }
      var map = row.menu === 'edu' ? EDU_CATEGORY_STYLE_MAP : row.menu === 'community' ? CATEGORY_STYLE_MAP : null;
      if (!map) return;
      var style = { bg: row.bg, line: row.accent };
      if (row.text) style.text = row.text;
      map[row.name] = style;
    });
  }

  // layout_settings 탭: key,value(JSON) — fontSize·lineHeight 단계값
  function applyLayoutRows_(rows) {
    rowsToObjects_(rows).forEach(function (row) {
      var target = row.key === 'fontSize' ? TEXT_FONT_SIZE_MAP : row.key === 'lineHeight' ? TEXT_LINE_HEIGHT_MAP : null;
      if (!target) return;
      try {
        var values = JSON.parse(row.value);
        Object.keys(values).forEach(function (k) { if (values[k]) target[k] = values[k]; });
      } catch (err) {
        debugConsole.warn('[진단] 레이아웃 설정 값이 깨짐:', row.key, err);
      }
    });
  }

  function loadProgram() {
    debugConsole.log('%c[진단] loadProgram() 시작', 'color:#4caf50;font-weight:bold;');
    debugConsole.log('[진단] window.PROGRAM_ID:', JSON.stringify(window.PROGRAM_ID));
    debugConsole.log('[진단] SHEET_CSV_URLS:', SHEET_CSV_URLS);

    var root = document.querySelector('.iw-detail-card');
    debugConsole.log('[진단] .iw-detail-card 요소:', root);

    if (!root) {
      debugConsole.error('[진단] .iw-detail-card 요소를 DOM에서 찾지 못함 → 여기서 중단. 코드위젯 HTML이 페이지에 실제로 삽입됐는지 확인 필요.');
      return;
    }

    // [4A] 카드가 있을 때만 설정 CSV를 요청 (관리웹앱이 IWFormat만 쓰려고 불러올 때는 요청 안 함)
    var settingsReady = loadSheetSettings_();

    // [핵심 수정] window.PROGRAM_ID는 별도 <script> 태그가 실행돼야 값이 채워지는데,
    // 아임웹 코드위젯 환경에서는 인라인 스크립트와 외부 스크립트(src)의 실행 순서가
    // 문서에 쓴 순서대로 보장되지 않는 경우가 있습니다 (특히 detail-widget.js가
    // 브라우저 캐시에 있어서 거의 즉시 실행될 때). 그래서 window.PROGRAM_ID가
    // 아직 안 채워진 시점에 이 스크립트가 먼저 실행되면 PROGRAM_ID가 빈 값이 됩니다.
    //
    // 이를 근본적으로 막기 위해, div 자체의 data-program-id 속성을 최우선으로 읽습니다.
    // HTML 속성은 이 div가 파싱되는 순간 이미 존재하므로 스크립트 실행 순서와 무관합니다.
    // (구버전 코드위젯과의 호환을 위해 window.PROGRAM_ID도 계속 보조 수단으로 지원합니다.)
    var domProgramId = root.getAttribute('data-program-id');
    debugConsole.log('[진단] div의 data-program-id 속성값:', JSON.stringify(domProgramId));

    if (domProgramId && domProgramId.trim() && domProgramId.indexOf('여기에_') !== 0) {
      PROGRAM_ID = domProgramId.trim();
      debugConsole.log('[진단] data-program-id 속성값을 PROGRAM_ID로 사용:', JSON.stringify(PROGRAM_ID));
    } else if (window.PROGRAM_ID) {
      PROGRAM_ID = String(window.PROGRAM_ID).trim();
      debugConsole.log('[진단] data-program-id가 없어 window.PROGRAM_ID를 대신 사용 (구버전 방식):', JSON.stringify(PROGRAM_ID));
    } else {
      debugConsole.error('[진단] data-program-id 속성도, window.PROGRAM_ID도 둘 다 비어있음. 코드위젯 HTML에 둘 중 하나는 반드시 있어야 합니다.');
    }

    // [미리보기] 관리 화면에서 내려받은 미리보기 파일은 구글 시트를 거치지 않고
    // window.__PREVIEW_DATA__ 에 담긴 내용을 그대로 그림 (네트워크 요청 없음).
    // 실제 12개 페이지에는 이 값이 없으므로 평소 동작에는 전혀 영향 없음.
    if (window.__PREVIEW_DATA__) {
      debugConsole.log('[진단] window.__PREVIEW_DATA__ 감지됨 → 시트 fetch 없이 미리보기 데이터로 렌더링:', window.__PREVIEW_DATA__);
      var previewPayload = window.__PREVIEW_DATA__;
      var previewProgram = {
        title: previewPayload.title || '',
        category: previewPayload.category || '',
        imageurl: previewPayload.imageUrl || '',
        menu: previewPayload.menu || ''
      };
      settingsReady.then(function () { renderProgram(root, previewProgram, previewPayload); });
      return;
    }

    if (!PROGRAM_ID) {
      debugConsole.error('[진단] PROGRAM_ID가 비어있음. 코드위젯의 data-program-id 또는 window.PROGRAM_ID를 확인 필요.');
      renderError(root);
      return;
    }

    // [1단계 통합] 두 메뉴 시트를 동시에 받아서, 이 ID가 들어있는 시트가 도착하는 대로 바로 그림.
    // 어느 시트에도 없거나 전부 실패하면 오류 화면
    var menus = Object.keys(SHEET_CSV_URLS);
    var pending = menus.length;
    var settled = false;

    menus.forEach(function (menu) {
      var url = SHEET_CSV_URLS[menu];
      var cacheBustedUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + 'cachebust=' + Date.now();

      debugConsole.log('[진단] fetch 요청 (' + menu + '):', cacheBustedUrl);

      fetch(cacheBustedUrl, { cache: 'no-store' })
        .then(function (response) {
          debugConsole.log('[진단] ' + menu + ' 응답 status:', response.status, '/ content-type:', response.headers.get('content-type'));

          if (!response.ok) {
            throw new Error('네트워크 응답 오류 (' + menu + ', status: ' + response.status + ')');
          }
          return response.text();
        })
        .then(function (text) {
          if (settled) {
            return;
          }

          if (text.trim().slice(0, 1) === '<') {
            debugConsole.error('[진단] ' + menu + ' 응답이 CSV가 아니라 HTML로 보임(로그인 페이지 등). 시트 "웹에 게시" 설정 확인 필요.');
          }

          var program = findProgramRow(parseCsv(text));

          if (!program) {
            debugConsole.log('[진단] ' + menu + ' 시트에는 이 ID가 없음');
            return;
          }

          settled = true;
          // [3단계] 통합 시트는 행마다 menu 칸이 있음. 없으면(예전 시트) 어느 시트에서 찾았는지로 정함
          if (program.menu !== 'edu' && program.menu !== 'community') {
            program.menu = menu === 'edu' || menu === 'community' ? menu : '';
          }
          settingsReady.then(function () { showProgram_(root, program); });
        })
        .catch(function (err) {
          debugConsole.error('[진단] ' + menu + ' 시트 불러오기 실패:', err);
        })
        .then(function () {
          pending -= 1;

          if (pending === 0 && !settled) {
            debugConsole.error('[진단] 어느 시트에서도 PROGRAM_ID와 일치하는 행을 찾지 못함:', JSON.stringify(PROGRAM_ID));
            renderError(root);
          }
        });
    });
  }

  function showProgram_(root, program) {
    debugConsole.log('[진단] program.visible 원본값:', JSON.stringify(program.visible), '/ isTruthy 결과:', isTruthy(program.visible));

    if (!isTruthy(program.visible)) {
      debugConsole.error('[진단] program은 찾았지만 visible이 참으로 인식되지 않음 → 화면 표시 안 함 처리됨.');
      renderError(root);
      return;
    }

    var data = { regions: [], info: {}, subtitleLabel: '', subtitleText: '' };

    try {
      if (program.datajson) {
        data = JSON.parse(program.datajson);
        debugConsole.log('[진단] dataJson 파싱 성공:', data);
      } else {
        debugConsole.warn('[진단] program.datajson이 비어있음. 상세 내용이 비어있는 상태로 렌더링됩니다.');
      }
    } catch (err) {
      debugConsole.error('[진단] dataJson JSON.parse 실패! 원본 dataJson 문자열:', program.datajson, '/ 에러:', err);
      data = { regions: [], info: {}, subtitleLabel: '', subtitleText: '' };
    }

    debugConsole.log('[진단] 최종 renderProgram 호출', { program: program, data: data });
    renderProgram(root, program, data);
  }

  loadProgram();
})();
