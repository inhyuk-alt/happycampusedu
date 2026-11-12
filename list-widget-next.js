/* ==================================================================
   list-widget-next.js [4C-2] — 카드목록 위젯 (교육·커뮤니티 공통)
   ------------------------------------------------------------------
   지금 아임웹 코드위젯 안의 교육 카드목록 코드를 그대로 옮기고, 코드 안 고정값(필터·배지 색·마감 문구·카드 모양)만
   메뉴별 기본값(LIST_DEFAULTS) + 통합 시트 list_settings 탭으로 뺌. 메뉴는 <section data-menu="edu|community">.
   커뮤니티와의 차이(필터 없음, 배지 글자색 규칙, 추가카테고리3 없음, 데스크톱 3열)는 메뉴별 기본값으로 흡수.
   아임웹에 넣는 것: <section class="iw-post-grid" data-menu="edu"><div class="iw-post-filters-root"></div>
     <ul class="iw-post-list"><li class="iw-post-status" data-status="loading">불러오는 중입니다...</li></ul></section>
     + 이 파일과 list-widget-next.css 불러오기
================================================================== */
(function () {
  // [4C-2] 통합 시트 게시 주소 (list_edu / list_community / list_settings 탭). gid는 탭을 게시한 뒤 채움.
  // 시험·미리보기는 window.IW_LIST_SOURCES = {edu, community, settings} 또는 window.__IW_LIST_PREVIEW__로 바꿔 넣음
  var LIST_CSV_URLS = { edu: '', community: '' };
  var LIST_SETTINGS_CSV_URL = '';

  // [4C-2] 메뉴별 기본값 = 지금 아임웹 코드 안 값 그대로 (교육 / 커뮤니티). list_settings 탭이 키별로 덮어씀
  var LIST_DEFAULTS = {
    edu: {
      ariaLabel: '교육 프로그램 목록',
      cardSize: 'normal', columns: '', ratio: 'landscape', fit: 'cover', gap: 'normal', round: 'none', cardAlign: 'left', filterAlign: 'center',
      closedDivider: '마감된 교육 프로그램', blockClosedClick: false,
      badgeColors: {
        '인생전환': { bg: '#ffcade', text: '#9c1c56' },
        '재무설계': { bg: '#b5b4f0', text: '#3f3593' },
        '관계소통': { bg: '#f3c029', text: '#6b4a00' },
        '사회활동': { bg: '#90e7d4', text: '#0b6b5b' },
        '일커리어': { bg: '#acedff', text: '#0a5f80' },
        '북부': { bg: '#7c83c9', text: '#ffffff' },
        '남부': { bg: '#e0607f', text: '#ffffff' }
      },
      badgePalette: ['#17bcb4', '#7cb342', '#f5a623', '#8e44ad', '#4a90d9', '#e05f5f'],
      badgeTextRule: 'auto-white', // 추가 카테고리 배지: 자동 색 + 흰 글자
      extra3: true,
      filters: [
        { key: 'category', label: '핵심영역', enabled: true, allLabel: '전체보기', mode: 'dynamic', field: 'badge1_text' },
        { key: 'region', label: '지역', enabled: false, allLabel: '전체 지역', mode: 'keyword', keywords: ['남부', '북부'], scanFields: ['badge2_text', 'badge3_text', 'badge4_text'] },
        { key: 'semester', label: '학기', enabled: true, allLabel: '전체 학기', mode: 'keyword', keywords: ['1학기', '2학기'], scanFields: ['badge2_text', 'badge3_text', 'badge4_text'] }
      ]
    },
    community: {
      ariaLabel: '행복아지트 프로그램 목록',
      cardSize: 'normal', columns: '3', ratio: 'landscape', fit: 'cover', gap: 'normal', round: 'none', cardAlign: 'left', filterAlign: '',
      closedDivider: '마감된 교육 프로그램', blockClosedClick: false,
      badgeColors: {
        '강연': { bg: '#fff3d0', text: '#C28E4C' },
        '로망스쿨': { bg: '#e8f8f8', text: '#2F3640' },
        '행복아지트': { bg: '#fec5e8', text: '#ffffff' }
      },
      badgePalette: ['#17bcb4', '#7cb342', '#f5a623', '#8e44ad', '#4a90d9', '#e05f5f'],
      badgeTextRule: 'map-text', // 추가 카테고리 배지도 색표의 글자색 그대로 (없으면 흰 글자)
      extra3: false,
      filters: []
    }
  };
  var S = LIST_DEFAULTS.edu;
  // 관리웹앱 [목록 설정] 화면이 기본값을 같은 곳에서 읽음
  window.IWList = { DEFAULTS: LIST_DEFAULTS, cleanFilters: function (l, f) { return cleanFilters_(l, f); }, cleanBadges: function (m, f) { return cleanBadges_(m, f); } };

  var CATEGORY_STYLE_MAP = {}; // [4C-2] 설정 badgeColors

  var CATEGORY_COLOR_PALETTE = []; // [4C-2] 설정 badgePalette

  var categoryColorCache = {};
  var categoryColorNextIndex = 0;

  function getAutoCategoryColor(categoryText) {
    var key = String(categoryText || '').trim();

    if (key === '') {
      return '#666666';
    }

    if (CATEGORY_STYLE_MAP[key]) {
      return CATEGORY_STYLE_MAP[key].bg;
    }

    if (categoryColorCache[key]) {
      return categoryColorCache[key];
    }

    var assigned = CATEGORY_COLOR_PALETTE[categoryColorNextIndex % CATEGORY_COLOR_PALETTE.length];
    categoryColorNextIndex += 1;
    categoryColorCache[key] = assigned;

    return assigned;
  }

  function resolveCategoryAccent(categoryText) {
    var key = String(categoryText || '').trim();

    if (CATEGORY_STYLE_MAP[key]) {
      return CATEGORY_STYLE_MAP[key].text;
    }

    return getAutoCategoryColor(categoryText);
  }

  var root = document.querySelector('.iw-post-grid');
  var listEl = root ? root.querySelector('.iw-post-list') : null;

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, '').trim();
  }

  function resolveCardStatus(value) {
    var normalized = String(value || '').trim();

    if (normalized === '마감' || normalized.toUpperCase() === 'CLOSED') {
      return 'closed';
    }

    if (
      normalized === '비공개' ||
      normalized.toUpperCase() === 'FALSE' ||
      normalized === '0' ||
      normalized === ''
    ) {
      return 'hidden';
    }

    return 'visible';
  }

  var BLOCK_CLOSED_CARD_CLICK = false;
  var CLOSED_DIVIDER_TEXT = '마감된 교육 프로그램';

  // ------------------------------------------------------------
  // [필터 설정] 여기서 필터를 켜고 끄고, 순서를 바꾸고, 어떤 글자를 찾을지 정함.
  // 실제 카테고리를 시트의 어느 칸(핵심카테고리/추가카테고리1/2/3)에 적든 상관없이,
  // keywords에 적어둔 글자가 어디에 있든 자동으로 찾아내서 필터로 잡아줌 — 나중에
  // 관리자가 바뀌거나 작성 순서가 달라져도 이 keywords만 안 바뀌면 계속 정상 작동함.
  //
  // 각 항목 설명
  // - enabled: true면 그 필터 줄이 화면에 보이고, false면 통째로 안 보임 (코드는 그대로 둔 채
  //   여기 true/false만 바꾸면 켜고 끌 수 있음)
  // - label: 필터 줄 옆에는 안 쓰이고, 코드 안에서 구분하기 쉬우라고 붙인 이름표일 뿐
  // - allLabel: "전체 보기" 버튼에 쓰일 문구
  // - mode: 'dynamic'은 핵심카테고리 칸에 실제로 적힌 값들을 그대로 필터 항목으로 씀(지금
  //   핵심영역 필터가 이 방식). 'keyword'는 keywords 배열에 적어둔 단어가 있는지 찾아서 필터로 씀
  // - keywords: mode가 'keyword'일 때만 사용. 실제 데이터에 없는 키워드는 자동으로 필터 줄에서
  //   빠짐(예: 학기 필터를 켜놨는데 아직 "1학기"라고 적은 카드가 하나도 없으면 "1학기" 버튼은 안 보임)
  // - scanFields: mode가 'keyword'일 때, 어느 칸들을 뒤져볼지. 기본은 추가카테고리1/2/3
  //   (badge2/3/4). 핵심카테고리(badge1)까지 같이 뒤지고 싶으면 그 배열에 'badge1_text'도 추가하면 됨
  // ------------------------------------------------------------
  var FILTER_GROUPS = []; // [4C-2] 설정 filters

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

  var HEADER_MAP = {
    '공개여부': 'visible',
    '이미지주소': 'image_url',
    '호버이미지주소': 'hover_image_url',
    '링크': 'link',
    '제목': 'title',
    '제목크기': 'title_size',
    '부제목': 'subtitle',
    '설명': 'description',
    '기간': 'date',
    '핵심카테고리': 'badge1_text',
    '추가카테고리1': 'badge2_text',
    '추가1형태': 'badge2_style',
    '추가카테고리2': 'badge3_text',
    '추가2형태': 'badge3_style',
    '추가카테고리3': 'badge4_text',
    '추가3형태': 'badge4_style',
    // [4C-2] 썸네일 맞춤 (통합 시트 카드목록 탭에만 있는 칸, 비면 지금과 같음)
    '썸네일맞춤': 'thumb_fit',
    '중심점': 'thumb_focus',
    '빈공간채우기': 'thumb_fill'
  };

  function resolveHeaderKey(headerLabel) {
    var trimmed = normalizeText(headerLabel);
    return HEADER_MAP[trimmed] || trimmed.toLowerCase();
  }

  function rowsToCards(rows) {
    if (rows.length === 0) {
      return [];
    }

    var header = rows[0].map(resolveHeaderKey);

    var cards = [];

    for (var r = 1; r < rows.length; r += 1) {
      var raw = rows[r];
      var card = {};

      for (var c = 0; c < header.length; c += 1) {
        card[header[c]] = raw[c] !== undefined ? raw[c].trim() : '';
      }

      cards.push(card);
    }

    return cards;
  }

  function createBadge(text, style) {
    var badge = document.createElement('span');
    badge.className = 'iw-post-badge';

    if (!text) {
      return badge;
    }

    var resolvedStyle = style || 'filled';

    badge.textContent = text;
    badge.setAttribute('data-badge-style', resolvedStyle);

    // [4C-2] 커뮤니티 규칙: 색표에 있는 문구는 배경·글자색 그대로, 테두리만이면 글자색으로 테두리·글자
    if (S.badgeTextRule === 'map-text') {
      var info = CATEGORY_STYLE_MAP[String(text).trim()];
      var mapBg = info ? info.bg : getAutoCategoryColor(text);
      var mapText = info ? info.text : '#ffffff';
      if (resolvedStyle === 'outline') {
        badge.style.borderColor = mapText;
        badge.style.backgroundColor = 'transparent';
        badge.style.color = mapText;
      } else {
        badge.style.borderColor = mapBg;
        badge.style.backgroundColor = mapBg;
        badge.style.color = mapText;
      }
      return badge;
    }

    var resolvedColor = getAutoCategoryColor(text);
    badge.style.borderColor = resolvedColor;

    if (resolvedStyle === 'outline') {
      badge.style.backgroundColor = 'transparent';
      badge.style.color = resolvedColor;
    } else {
      badge.style.backgroundColor = resolvedColor;
      badge.style.color = '#ffffff';
    }

    return badge;
  }

  function createCoreBadge(text) {
    var badge = document.createElement('span');
    badge.className = 'iw-post-badge';

    if (!text) {
      return badge;
    }

    var key = String(text).trim();
    var styleInfo = CATEGORY_STYLE_MAP[key];
    var bg = styleInfo ? styleInfo.bg : getAutoCategoryColor(text);
    var textColor = styleInfo ? styleInfo.text : '#ffffff';

    badge.textContent = text;
    badge.setAttribute('data-badge-style', 'pill');
    badge.style.borderColor = bg;
    badge.style.backgroundColor = bg;
    badge.style.color = textColor;

    return badge;
  }

  // [4C-2] 썸네일: 꽉 채우기(cover, 중심점) / 전체 보이기(contain, 빈 공간 = 흐린 같은 사진 | 핵심카테고리 배지 색)
  function parseFocus_(value) {
    var m = String(value || '').match(/^\s*(\d{1,3}(?:\.\d+)?)%\s+(\d{1,3}(?:\.\d+)?)%\s*$/);
    if (!m || Number(m[1]) > 100 || Number(m[2]) > 100) return '';
    return Number(m[1]) + '% ' + Number(m[2]) + '%';
  }

  function applyThumbFit_(thumb, img, card) {
    var fit = card.thumb_fit === 'cover' || card.thumb_fit === 'contain' ? card.thumb_fit : '';
    if (!img || !fit) return;
    img.style.objectFit = fit;
    if (fit === 'cover') {
      var focus = parseFocus_(card.thumb_focus);
      if (focus) img.style.objectPosition = focus;
      return;
    }
    if (card.thumb_fill === 'blur') {
      var fill = document.createElement('span');
      fill.className = 'iw-post-thumb-fill';
      fill.setAttribute('aria-hidden', 'true');
      fill.style.backgroundImage = 'url(' + JSON.stringify(card.image_url) + ')';
      thumb.insertBefore(fill, img);
    } else if (card.thumb_fill === 'color') {
      var key = String(card.badge1_text || '').trim();
      thumb.style.backgroundColor = CATEGORY_STYLE_MAP[key] ? CATEGORY_STYLE_MAP[key].bg : getAutoCategoryColor(key);
    }
  }

  function createCard(card) {
    var status = resolveCardStatus(card.visible);

    var li = document.createElement('li');
    li.className = 'iw-post-card';
    li.setAttribute('data-visible', status === 'hidden' ? 'false' : 'true');
    li.setAttribute('data-card-status', status);
    li.setAttribute('data-filter-state', 'show');

    // [필터] 켜져있든 꺼져있든 상관없이 모든 필터 그룹의 값을 미리 다 붙여둠(꺼진 필터는
    // 화면에 안 보이니 값이 있어도 아무 영향 없음). 나중에 필터를 켜기만 하면 바로 작동함
    for (var fg = 0; fg < FILTER_GROUPS.length; fg += 1) {
      li.setAttribute('data-filter-' + FILTER_GROUPS[fg].key, extractFilterTag_(card, FILTER_GROUPS[fg]));
    }

    var link = document.createElement('a');
    link.className = 'iw-post-link';
    var linkValue = card.link || '';
    var linkBlocked = linkValue.trim() === '' || (status === 'closed' && BLOCK_CLOSED_CARD_CLICK);
    link.setAttribute('data-card-link', '');
    link.setAttribute('data-link-value', linkValue);
    link.setAttribute('aria-label', (card.title || '') + (status === 'closed' ? ' (마감)' : '') + ' 상세 보기');

    if (linkBlocked) {
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('tabindex', '-1');
    } else {
      link.setAttribute('href', linkValue);
    }

    var thumb = document.createElement('div');
    thumb.className = 'iw-post-thumb';

    var placeholder = document.createElement('span');
    placeholder.className = 'iw-post-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.textContent = '썸네일 이미지를 등록해 주세요';
    thumb.appendChild(placeholder);

    if (card.image_url) {
      var img = document.createElement('img');
      img.className = 'iw-post-image';
      img.src = card.image_url;
      img.alt = card.title || '';
      thumb.appendChild(img);
    }

    applyThumbFit_(thumb, img, card);

    if (card.hover_image_url && status !== 'closed') {
      var hoverImg = document.createElement('img');
      hoverImg.className = 'iw-post-image iw-post-image--hover';
      hoverImg.src = card.hover_image_url;
      hoverImg.alt = '';
      hoverImg.setAttribute('aria-hidden', 'true');
      thumb.appendChild(hoverImg);
      if (img) { hoverImg.style.objectFit = img.style.objectFit; hoverImg.style.objectPosition = img.style.objectPosition; }
    }

    if (status === 'closed') {
      var closedRibbon = document.createElement('span');
      closedRibbon.className = 'iw-post-closed-ribbon';
      closedRibbon.textContent = '마감';
      thumb.appendChild(closedRibbon);

      var closedOverlay = document.createElement('div');
      closedOverlay.className = 'iw-post-closed-overlay';
      closedOverlay.setAttribute('aria-hidden', 'true');
      var closedOverlayText = document.createElement('span');
      closedOverlayText.textContent = '마감';
      closedOverlay.appendChild(closedOverlayText);
      thumb.appendChild(closedOverlay);
    }

    var body = document.createElement('div');
    body.className = 'iw-post-body';

    var badges = document.createElement('div');
    badges.className = 'iw-post-badges';
    badges.setAttribute('aria-label', '카테고리와 특징');
    badges.appendChild(createCoreBadge(card.badge1_text));
    badges.appendChild(createBadge(card.badge2_text, card.badge2_style));
    badges.appendChild(createBadge(card.badge3_text, card.badge3_style));
    if (S.extra3) badges.appendChild(createBadge(card.badge4_text, card.badge4_style));
    body.appendChild(badges);

    var title = document.createElement('h3');
    title.className = 'iw-post-title';
    title.setAttribute('data-size', card.title_size || 'medium');
    title.textContent = card.title || '';
    body.appendChild(title);

    if (card.subtitle) {
      var subtitle = document.createElement('p');
      subtitle.className = 'iw-post-subtitle';
      subtitle.textContent = card.subtitle;
      body.appendChild(subtitle);
    }

    if (card.description) {
      var description = document.createElement('p');
      description.className = 'iw-post-description';
      description.textContent = card.description;
      body.appendChild(description);
    }

    if (card.date) {
      var date = document.createElement('p');
      date.className = 'iw-post-date';
      date.textContent = card.date;
      body.appendChild(date);
    }

    link.appendChild(thumb);
    link.appendChild(body);
    li.appendChild(link);

    return li;
  }

  // [필터] 카드 하나에서 특정 필터 그룹에 해당하는 값을 뽑아냄.
  // mode:'dynamic'이면 그 칸(field)에 적힌 값을 그대로, mode:'keyword'면 scanFields에 적힌
  // 칸들을 훑어서 keywords 중 처음 발견되는 단어를 반환함
  function extractFilterTag_(card, group) {
    if (group.mode === 'dynamic') {
      return String(card[group.field] || '').trim();
    }

    for (var f = 0; f < group.scanFields.length; f += 1) {
      var text = String(card[group.scanFields[f]] || '');

      for (var k = 0; k < group.keywords.length; k += 1) {
        if (text.indexOf(group.keywords[k]) !== -1) {
          return group.keywords[k];
        }
      }
    }

    return '';
  }

  // 실제 데이터 안에 존재하는 값만 필터 버튼으로 만들기 위해, 그룹별로 나올 수 있는 값 목록을 구함
  function parseFilterValues_(cards, group) {
    var values = [];

    if (group.mode === 'dynamic') {
      for (var i = 0; i < cards.length; i += 1) {
        var value = extractFilterTag_(cards[i], group);

        if (value !== '' && values.indexOf(value) === -1) {
          values.push(value);
        }
      }

      return values;
    }

    // keyword 모드는 keywords에 적어둔 순서를 그대로 따르되, 실제로 그 값을 가진 카드가
    // 하나도 없으면 그 버튼은 아예 안 만듦 (예: "1학기" 카드가 없으면 "1학기" 버튼 안 보임)
    for (var k = 0; k < group.keywords.length; k += 1) {
      var keyword = group.keywords[k];
      var found = false;

      for (var c = 0; c < cards.length; c += 1) {
        if (extractFilterTag_(cards[c], group) === keyword) {
          found = true;
          break;
        }
      }

      if (found) {
        values.push(keyword);
      }
    }

    return values;
  }

  // [필터 상태] 켜져있는 필터 그룹마다 지금 선택된 값을 기억해둠 (기본은 전부 "all")
  var activeFilters = {};

  // FILTER_GROUPS 설정에 따라 필터 줄들을 통째로 새로 그림. enabled:false인 그룹은 아예 안 만듦
  function buildFilterNav_(cards) {
    var root_ = root.querySelector('.iw-post-filters-root');

    if (!root_) {
      return;
    }

    if (!FILTER_GROUPS.some(function (g) { return g.enabled; })) {
      root_.parentNode.removeChild(root_);
      return;
    }

    while (root_.firstChild) {
      root_.removeChild(root_.firstChild);
    }

    for (var g = 0; g < FILTER_GROUPS.length; g += 1) {
      var group = FILTER_GROUPS[g];

      if (!group.enabled) {
        continue;
      }

      var values = parseFilterValues_(cards, group);

      // 켜놓은 필터인데 실제 데이터가 하나도 없으면(예: 학기 필터는 켰지만 아직 아무 카드에도
      // "1학기"/"2학기"를 안 적어둔 경우) 빈 필터 줄을 보여주는 대신 조용히 건너뜀
      if (group.mode === 'keyword' && values.length === 0) {
        continue;
      }

      activeFilters[group.key] = 'all';

      var nav = document.createElement('nav');
      nav.className = 'iw-post-filter-wrap';
      nav.setAttribute('aria-label', group.label + ' 분류');

      var inner = document.createElement('div');
      inner.className = 'iw-post-filter-inner';

      var allButton = document.createElement('button');
      allButton.type = 'button';
      allButton.className = 'iw-post-filter-chip';
      allButton.setAttribute('data-filter-group', group.key);
      allButton.setAttribute('data-filter', 'all');
      allButton.setAttribute('data-state', 'active');
      allButton.setAttribute('aria-pressed', 'true');
      allButton.style.setProperty('--tab-color', group.mode === 'dynamic' ? '#17bcb4' : '#888888');

      if (group.mode === 'dynamic') {
        var allNumber = document.createElement('span');
        allNumber.className = 'iw-post-filter-number';
        allNumber.textContent = '01';
        allButton.appendChild(allNumber);
      }

      var allLabel = document.createElement('span');
      allLabel.className = 'iw-post-filter-label';
      allLabel.textContent = group.allLabel;
      allButton.appendChild(allLabel);

      inner.appendChild(allButton);

      var dynamicWrap = document.createElement('div');
      dynamicWrap.className = 'iw-post-filter-dynamic';

      for (var index = 0; index < values.length; index += 1) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'iw-post-filter-chip';
        button.setAttribute('data-filter-group', group.key);
        button.setAttribute('data-filter', values[index]);
        button.setAttribute('data-state', 'inactive');
        button.setAttribute('aria-pressed', 'false');

        if (group.mode === 'dynamic') {
          var tabNumber = String(index + 2);

          if (tabNumber.length < 2) {
            tabNumber = '0' + tabNumber;
          }

          button.style.setProperty('--tab-color', resolveCategoryAccent(values[index]));

          var numberSpan = document.createElement('span');
          numberSpan.className = 'iw-post-filter-number';
          numberSpan.textContent = tabNumber;
          button.appendChild(numberSpan);
        } else {
          button.style.setProperty('--tab-color', '#888888');
        }

        var labelSpan = document.createElement('span');
        labelSpan.className = 'iw-post-filter-label';
        labelSpan.textContent = values[index];
        button.appendChild(labelSpan);

        dynamicWrap.appendChild(button);
      }

      inner.appendChild(dynamicWrap);
      nav.appendChild(inner);
      root_.appendChild(nav);
    }
  }

  function updateFilterButtons_(group, activeFilter) {
    var buttons = root.querySelectorAll('.iw-post-filter-chip[data-filter-group="' + group + '"]');

    for (var index = 0; index < buttons.length; index += 1) {
      var value = buttons[index].getAttribute('data-filter');
      var active = value === activeFilter;

      buttons[index].setAttribute('data-state', active ? 'active' : 'inactive');
      buttons[index].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  // 켜져있는 모든 필터 그룹을 동시에(AND 조건) 적용함. 꺼져있는 그룹은 activeFilters에 없어서
  // 자동으로 조건에서 빠짐(항상 통과)
  function applyFilters() {
    var cards = root.querySelectorAll('.iw-post-card');
    var anyClosedVisible = false;

    for (var key in activeFilters) {
      if (Object.prototype.hasOwnProperty.call(activeFilters, key)) {
        updateFilterButtons_(key, activeFilters[key]);
      }
    }

    for (var index = 0; index < cards.length; index += 1) {
      var visible = true;

      for (var groupKey in activeFilters) {
        if (!Object.prototype.hasOwnProperty.call(activeFilters, groupKey)) {
          continue;
        }

        var selected = activeFilters[groupKey];

        if (selected === 'all') {
          continue;
        }

        var cardValue = normalizeText(cards[index].getAttribute('data-filter-' + groupKey));

        if (cardValue !== normalizeText(selected)) {
          visible = false;
          break;
        }
      }

      cards[index].setAttribute('data-filter-state', visible ? 'show' : 'hide');

      if (visible && cards[index].getAttribute('data-card-status') === 'closed') {
        anyClosedVisible = true;
      }
    }

    var divider = root.querySelector('[data-closed-divider]');

    if (divider) {
      divider.style.display = anyClosedVisible ? '' : 'none';
    }
  }

  function isTouchEnvironment() {
    return !!(window.matchMedia && window.matchMedia('(hover: none)').matches);
  }

  function handleRootClick(event) {
    var filterButton = event.target.closest('.iw-post-filter-chip');

    if (filterButton && root.contains(filterButton)) {
      var group = filterButton.getAttribute('data-filter-group');
      activeFilters[group] = filterButton.getAttribute('data-filter') || 'all';
      applyFilters();
      return;
    }

    if (isTouchEnvironment()) {
      var thumbEl = event.target.closest('.iw-post-thumb');

      if (thumbEl && root.contains(thumbEl)) {
        var previewEl = thumbEl.querySelector('.iw-post-image--hover, .iw-post-closed-overlay');
        var cardEl = thumbEl.closest('.iw-post-card');

        if (previewEl && cardEl && cardEl.getAttribute('data-flip') !== 'true') {
          event.preventDefault();
          cardEl.setAttribute('data-flip', 'true');
          return;
        }
      }
    }

    var cardLink = event.target.closest('[data-card-link]');

    if (!cardLink || !root.contains(cardLink)) {
      return;
    }

    var linkValue = cardLink.getAttribute('data-link-value') || '';

    if (linkValue.trim() === '') {
      event.preventDefault();
    }
  }

  function renderCards(cards) {
    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }

    var displayableCards = cards.filter(function (card) {
      return resolveCardStatus(card.visible) !== 'hidden';
    });

    if (displayableCards.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'iw-post-status';
      empty.setAttribute('data-status', 'empty');
      empty.textContent = '등록된 프로그램이 없습니다.';
      listEl.appendChild(empty);
      return;
    }

    var openCards = displayableCards.filter(function (card) {
      return resolveCardStatus(card.visible) === 'visible';
    });
    var closedCards = displayableCards.filter(function (card) {
      return resolveCardStatus(card.visible) === 'closed';
    });
    var orderedCards = openCards.concat(closedCards);

    for (var i = 0; i < openCards.length; i += 1) {
      listEl.appendChild(createCard(openCards[i]));
    }

    if (closedCards.length > 0) {
      var divider = document.createElement('li');
      divider.className = 'iw-post-divider';
      divider.setAttribute('data-closed-divider', '');
      divider.textContent = CLOSED_DIVIDER_TEXT;
      listEl.appendChild(divider);

      for (var j = 0; j < closedCards.length; j += 1) {
        listEl.appendChild(createCard(closedCards[j]));
      }
    }

    buildFilterNav_(orderedCards);
    applyFilters();
  }

  function renderError() {
    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }

    var error = document.createElement('li');
    error.className = 'iw-post-status';
    error.setAttribute('data-status', 'error');
    error.textContent = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    listEl.appendChild(error);
  }

  // [4C-2] list_settings 탭(menu,key,value JSON)에서 이 메뉴 값만. 깨진 JSON·모르는 키·형식이 다른 값은 그 키만 버림
  function settingsFromCsv_(text, menu) {
    var out = {};
    var rows = text ? parseCsv(text) : [];
    if (!rows.length) return out;
    var head = rows[0].map(function (h) { return normalizeText(h); });
    var mi = head.indexOf('menu'), ki = head.indexOf('key'), vi = head.indexOf('value');
    if (mi === -1 || ki === -1 || vi === -1) return out;
    for (var r = 1; r < rows.length; r += 1) {
      if (normalizeText(rows[r][mi]) !== menu) continue;
      var key = normalizeText(rows[r][ki]);
      try { out[key] = JSON.parse(rows[r][vi]); } catch (err) { /* 그 키만 기본값 */ }
    }
    return out;
  }

  function sameKind_(a, b) {
    if (Array.isArray(a)) return Array.isArray(b);
    if (a && typeof a === 'object') return !!b && typeof b === 'object' && !Array.isArray(b);
    return typeof a === typeof b;
  }

  // 필터 한 줄이 쓸 수 있는 모양인지 (이름은 영문·숫자·_- 만, 방식별 필수 값)
  function cleanFilters_(list, fallback) {
    if (!Array.isArray(list)) return fallback;
    var ok = [];
    list.forEach(function (g) {
      if (!g || typeof g !== 'object' || !/^[\w-]+$/.test(String(g.key || ''))) return;
      var allLabel = typeof g.allLabel === 'string' ? g.allLabel : '전체';
      var label = typeof g.label === 'string' ? g.label : g.key;
      if (g.mode === 'dynamic' && typeof g.field === 'string') {
        ok.push({ key: g.key, label: label, enabled: !!g.enabled, allLabel: allLabel, mode: 'dynamic', field: g.field });
      } else if (g.mode === 'keyword' && Array.isArray(g.keywords)) {
        ok.push({ key: g.key, label: label, enabled: !!g.enabled, allLabel: allLabel, mode: 'keyword',
          keywords: g.keywords.filter(function (k) { return typeof k === 'string' && k; }),
          scanFields: Array.isArray(g.scanFields) ? g.scanFields.filter(function (f) { return typeof f === 'string'; }) : ['badge2_text', 'badge3_text', 'badge4_text'] });
      }
    });
    return list.length && !ok.length ? fallback : ok;
  }

  function cleanBadges_(map, fallback) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) return fallback;
    var out = {};
    Object.keys(map).forEach(function (k) {
      var v = map[k];
      if (v && typeof v === 'object' && typeof v.bg === 'string') out[k] = { bg: v.bg, text: typeof v.text === 'string' ? v.text : '#ffffff' };
    });
    return out;
  }

  function menuOf_() {
    return root && root.getAttribute('data-menu') === 'community' ? 'community' : 'edu';
  }

  function applySettings_(over) {
    var base = LIST_DEFAULTS[menuOf_()];
    var next = {};
    Object.keys(base).forEach(function (k) {
      next[k] = over && Object.prototype.hasOwnProperty.call(over, k) && sameKind_(base[k], over[k]) ? over[k] : base[k];
    });
    next.filters = cleanFilters_(next.filters, base.filters);
    next.badgeColors = cleanBadges_(next.badgeColors, base.badgeColors);
    next.badgePalette = next.badgePalette.filter(function (c) { return typeof c === 'string' && c; });
    S = next;
    CATEGORY_STYLE_MAP = S.badgeColors;
    CATEGORY_COLOR_PALETTE = S.badgePalette.length ? S.badgePalette : LIST_DEFAULTS.edu.badgePalette;
    FILTER_GROUPS = S.filters;
    CLOSED_DIVIDER_TEXT = S.closedDivider;
    BLOCK_CLOSED_CARD_CLICK = !!S.blockClosedClick;
    categoryColorCache = {};
    categoryColorNextIndex = 0;
    root.setAttribute('aria-label', S.ariaLabel);
    [['data-card-size', S.cardSize], ['data-columns', S.columns], ['data-ratio', S.ratio], ['data-fit', S.fit], ['data-gap', S.gap],
      ['data-round', S.round], ['data-card-align', S.cardAlign], ['data-filter-align', S.filterAlign]].forEach(function (p) {
      if (p[1]) root.setAttribute(p[0], p[1]); else root.removeAttribute(p[0]);
    });
  }

  function getText_(url) {
    var busted = url + (url.indexOf('?') === -1 ? '?' : '&') + 'cachebust=' + Date.now();
    return fetch(busted, { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('네트워크 응답 오류');
      return response.text();
    });
  }

  function renderMessage_(text) {
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
    var li = document.createElement('li');
    li.className = 'iw-post-status';
    li.setAttribute('data-status', 'error');
    li.textContent = text;
    listEl.appendChild(li);
  }

  function loadCards() {
    var menu = menuOf_();
    var preview = window.__IW_LIST_PREVIEW__;
    if (preview) {
      applySettings_(preview.settings || {});
      renderCards(rowsToCards(preview.rows || []));
      return;
    }
    var sources = window.IW_LIST_SOURCES || {};
    var dataUrl = sources[menu] || LIST_CSV_URLS[menu];
    var settingsUrl = sources.settings !== undefined ? sources.settings : LIST_SETTINGS_CSV_URL;
    if (!dataUrl) {
      applySettings_({});
      renderMessage_('카드목록 주소가 아직 없습니다. (통합 시트 카드목록 탭 게시 주소를 위젯에 넣어 주세요)');
      return;
    }
    Promise.all([
      getText_(dataUrl),
      settingsUrl ? getText_(settingsUrl).catch(function () { return ''; }) : Promise.resolve('')
    ]).then(function (res) {
      applySettings_(settingsFromCsv_(res[1], menu));
      renderCards(rowsToCards(parseCsv(res[0])));
    }).catch(function () {
      applySettings_({});
      renderError();
    });
  }

  if (root && listEl) {
    root.addEventListener('click', handleRootClick);
    loadCards();
  }
})();
