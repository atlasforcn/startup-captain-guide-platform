const routes = [
  {
    id: "sunset",
    code: "S1",
    name: "夕照海灣線",
    theme: "sunset",
    captain: "阿堯船長",
    seats: 18,
    booked: 11,
    status: "開放預約",
    depart: "16:40",
    berth: "正濱 3 號棧橋",
    partner: "正濱商圈",
    point: "彩色屋、外木山夕照、咖啡回遊券",
    risk: "順風，適合一般旅客",
    score: 94,
    marker: { x: 474, y: 72 },
  },
  {
    id: "culture",
    code: "C2",
    name: "港邊故事線",
    theme: "culture",
    captain: "林船長",
    seats: 12,
    booked: 9,
    status: "低名額",
    depart: "10:30",
    berth: "和平島遊艇碼頭",
    partner: "和平島導覽",
    point: "港史口述、海蝕地景、地方導覽員共創",
    risk: "名額偏低，建議保留候補",
    score: 88,
    marker: { x: 394, y: 159 },
  },
  {
    id: "food",
    code: "F3",
    name: "漁市食旅線",
    theme: "food",
    captain: "小花船長",
    seats: 16,
    booked: 16,
    status: "候補中",
    depart: "05:50",
    berth: "崁仔頂集合口",
    partner: "崁仔頂合作店",
    point: "凌晨魚市、漁貨拍賣、早餐店家導流",
    risk: "已滿班，僅開放候補",
    score: 91,
    marker: { x: 455, y: 276 },
  },
  {
    id: "night",
    code: "N4",
    name: "夜航燈火線",
    theme: "sunset",
    captain: "阿堯船長",
    seats: 10,
    booked: 4,
    status: "天候觀察",
    depart: "19:20",
    berth: "西岸旅客碼頭",
    partner: "港邊咖啡",
    point: "港區燈火、船長故事、夜間安全導覽",
    risk: "晚間風勢待觀察",
    score: 76,
    marker: { x: 565, y: 104 },
  },
];

const captains = [
  { name: "阿堯船長", license: "載客小船執照", hours: 6, safety: "救生衣盤點完成", load: 15, tone: "熟悉夕照與夜航" },
  { name: "林船長", license: "已驗證", hours: 4, safety: "待確認油料", load: 9, tone: "港史口述搭配導覽" },
  { name: "小花船長", license: "已驗證", hours: 5, safety: "清晨靠泊檢核完成", load: 16, tone: "漁市與店家動線強" },
];

let bookings = [
  { guest: "張家四人", route: "夕照海灣線", people: 4, state: "待付款" },
  { guest: "設計系旅讀團", route: "港邊故事線", people: 8, state: "已確認" },
  { guest: "親子食旅", route: "漁市食旅線", people: 3, state: "候補" },
];

let logs = [
  { title: "崁仔頂合作店補上早餐套票", detail: "漁市食旅線候補旅客可轉入 05:50 場次。", time: "08:42" },
  { title: "西岸夜航啟動風勢觀察", detail: "19:20 前依潮汐視窗重新判讀。", time: "07:55" },
  { title: "和平島導覽員完成共創腳本", detail: "港邊故事線新增海蝕地景停留點。", time: "07:20" },
];

let activeFilter = "all";
let selectedRouteId = routes[0].id;
let tideValue = 62;

const routeList = document.querySelector("#routeList");
const routeDetail = document.querySelector("#routeDetail");
const captainList = document.querySelector("#captainList");
const bookingList = document.querySelector("#bookingList");
const impactList = document.querySelector("#impactList");
const logList = document.querySelector("#logList");
const chartMarkers = document.querySelector("#chartMarkers");
const seatCount = document.querySelector("#seatCount");
const queueCount = document.querySelector("#queueCount");
const weatherState = document.querySelector("#weatherState");
const bookingForm = document.querySelector("#bookingForm");
const routeSelect = document.querySelector("#routeSelect");
const tideRange = document.querySelector("#tideRange");
const tideLabel = document.querySelector("#tideLabel");

function availableSeats(route) {
  return Math.max(0, route.seats - route.booked);
}

function selectedRoute() {
  return routes.find((route) => route.id === selectedRouteId) || routes[0];
}

function filteredRoutes() {
  if (activeFilter === "all") return routes;
  if (activeFilter === "waitlist") {
    return routes.filter((route) => route.status === "候補中" || availableSeats(route) <= 3 || route.status === "天候觀察");
  }
  return routes.filter((route) => route.theme === activeFilter);
}

function riskClass(route) {
  if (availableSeats(route) === 0) return "full";
  if (route.status === "低名額" || route.status === "天候觀察" || tideValue > 78) return "caution";
  return "";
}

function addLog(title, detail) {
  const now = new Date();
  logs.unshift({
    title,
    detail,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  });
  logs = logs.slice(0, 5);
}

function renderMetrics() {
  const seats = routes.reduce((sum, route) => sum + availableSeats(route), 0);
  const queue = bookings.filter((booking) => booking.state !== "已確認").length;
  seatCount.textContent = seats;
  queueCount.textContent = queue;
  weatherState.textContent = tideValue > 78 || routes.some((route) => route.status === "天候觀察") ? "觀察" : "穩定";
  tideLabel.textContent = tideValue >= 50 ? `漲潮 ${tideValue}%` : `退潮 ${tideValue}%`;
}

function renderRouteOptions() {
  routeSelect.innerHTML = routes.map((route) => (
    `<option value="${route.name}">${route.name}</option>`
  )).join("");
}

function renderChartMarkers() {
  chartMarkers.innerHTML = routes.map((route) => `
    <g class="chart-marker ${route.id === selectedRouteId ? "active" : ""}" tabindex="0" role="button" aria-label="${route.name}" data-route="${route.id}" transform="translate(${route.marker.x} ${route.marker.y})">
      <circle r="12"></circle>
      <text text-anchor="middle" y="5">${route.code}</text>
    </g>
  `).join("");

  chartMarkers.querySelectorAll(".chart-marker").forEach((marker) => {
    const activate = () => {
      selectedRouteId = marker.dataset.route;
      addLog("海圖焦點切換", `${selectedRoute().name} 進入調度牌。`);
      renderAll();
    };
    marker.addEventListener("click", activate);
    marker.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });
}

function renderRoutes() {
  const visibleRoutes = filteredRoutes();

  routeList.innerHTML = visibleRoutes.map((route) => {
    const seatsLeft = availableSeats(route);
    return `
      <article class="route-row ${route.id === selectedRouteId ? "selected" : ""} ${seatsLeft === 0 ? "soldout" : ""}">
        <div>
          <span class="route-meta">${route.depart} / ${route.berth} / ${route.partner}</span>
          <h3>${route.name}</h3>
          <p>${route.captain} · ${route.point}</p>
        </div>
        <div class="route-actions">
          <span class="seat-badge">${seatsLeft}/${route.seats}</span>
          <button type="button" data-select="${route.id}">調度</button>
          <button class="primary" type="button" data-book="${route.id}">${seatsLeft ? "快速預約" : "排候補"}</button>
        </div>
      </article>
    `;
  }).join("");

  if (!visibleRoutes.length) {
    routeList.innerHTML = `<article class="route-row"><div><h3>目前沒有符合條件的航線</h3><p>請切回全部航線或候補警戒。</p></div></article>`;
  }

  routeList.querySelectorAll("[data-select]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedRouteId = button.dataset.select;
      addLog("調度牌更新", `${selectedRoute().name} 被設為目前航線。`);
      renderAll();
    });
  });

  routeList.querySelectorAll("[data-book]").forEach((button) => {
    button.addEventListener("click", () => {
      const route = routes.find((item) => item.id === button.dataset.book);
      if (!route) return;

      const seatsLeft = availableSeats(route);
      bookings.unshift({
        guest: seatsLeft ? "碼頭現場客" : "候補旅客",
        route: route.name,
        people: seatsLeft ? 2 : 1,
        state: seatsLeft ? "待付款" : "候補",
      });

      if (seatsLeft) {
        route.booked = Math.min(route.seats, route.booked + 2);
      }

      selectedRouteId = route.id;
      addLog(seatsLeft ? "快速預約進線" : "候補需求進線", `${route.name} 新增 ${seatsLeft ? 2 : 1} 人需求。`);
      renderAll();
    });
  });
}

function renderRouteDetail() {
  const route = selectedRoute();
  const seatsLeft = availableSeats(route);
  routeDetail.innerHTML = `
    <div class="detail-stamp">
      <div>
        <span class="caption">${route.code} / ${route.status}</span>
        <strong>${route.name}</strong>
      </div>
      <div>
        <span class="caption">體驗分</span>
        <strong>${route.score}</strong>
      </div>
    </div>
    <ul class="detail-list">
      <li><span>船長</span><strong>${route.captain}</strong></li>
      <li><span>出航</span><strong>${route.depart}</strong></li>
      <li><span>集合</span><strong>${route.berth}</strong></li>
      <li><span>合作節點</span><strong>${route.partner}</strong></li>
      <li><span>剩餘名額</span><strong>${seatsLeft} / ${route.seats}</strong></li>
    </ul>
    <div class="risk ${riskClass(route)}">
      <strong>港況判讀</strong>
      <p>${route.risk}。目前潮汐視窗 ${tideValue}%，${tideValue > 78 ? "建議保留改期方案" : "可維持原訂營運節奏"}。</p>
    </div>
  `;
}

function renderCaptains() {
  const route = selectedRoute();
  captainList.innerHTML = captains.map((captain) => {
    const loadPercent = Math.min(100, Math.round((captain.load / 18) * 100));
    const assigned = route.captain === captain.name;
    return `
      <article class="captain-item">
        <div class="captain-top">
          <div>
            <strong>${captain.name}</strong>
            <span>${captain.license} / ${captain.safety}</span>
          </div>
          <span>${captain.hours}h</span>
        </div>
        <div class="load-rail" aria-label="船長負載 ${loadPercent}%"><i style="--value: ${loadPercent}%"></i></div>
        <span>${captain.tone}</span>
        <button class="${assigned ? "assigned" : ""}" type="button" data-captain="${captain.name}">${assigned ? "已在此線" : "指派到此線"}</button>
      </article>
    `;
  }).join("");

  captainList.querySelectorAll("[data-captain]").forEach((button) => {
    button.addEventListener("click", () => {
      const routeToAssign = selectedRoute();
      routeToAssign.captain = button.dataset.captain;
      addLog("船長排班變更", `${button.dataset.captain} 指派至 ${routeToAssign.name}。`);
      renderAll();
    });
  });
}

function nextBookingState(state) {
  if (state === "待付款") return "已確認";
  if (state === "已確認") return "候補";
  return "待付款";
}

function stateClass(state) {
  if (state === "已確認") return "confirmed";
  if (state === "候補") return "waiting";
  return "";
}

function renderBookings() {
  bookingList.innerHTML = bookings.map((booking, index) => `
    <article class="booking-item">
      <div>
        <strong>${booking.guest}</strong>
        <span>${booking.route} / ${booking.people} 人</span>
      </div>
      <button class="${stateClass(booking.state)}" type="button" data-confirm="${index}">${booking.state}</button>
    </article>
  `).join("");

  bookingList.querySelectorAll("[data-confirm]").forEach((button) => {
    button.addEventListener("click", () => {
      const booking = bookings[Number(button.dataset.confirm)];
      booking.state = nextBookingState(booking.state);
      addLog("預約狀態更新", `${booking.guest} 目前為 ${booking.state}。`);
      renderAll();
    });
  });
}

function renderImpacts() {
  const confirmedPeople = bookings.reduce((sum, booking) => (
    booking.state === "已確認" ? sum + booking.people : sum
  ), 0);
  const partnerGroups = routes.filter((route) => route.booked > 0).length * 9 + bookings.length;
  const revenue = (confirmedPeople * 1800) + (partnerGroups * 950);
  const returnRate = Math.min(94, 72 + Math.round(routes.reduce((sum, route) => sum + route.score, 0) / routes.length / 5));
  const impacts = [
    { label: "本週體驗人次", value: `${confirmedPeople} 人`, progress: Math.min(100, confirmedPeople * 3), note: "已確認預約會推進船班與保險名冊。" },
    { label: "合作店家導流", value: `${partnerGroups} 組`, progress: Math.min(100, partnerGroups * 2), note: "依航線合作節點與新增需求估算。" },
    { label: "地方營收估算", value: `NT$ ${Math.round(revenue / 1000)}K`, progress: Math.min(100, Math.round(revenue / 1800)), note: "船班、導覽與店家消費的 demo 加總。" },
    { label: "回訪意願", value: `${returnRate}%`, progress: returnRate, note: "以航線體驗分推估問卷表現。" },
  ];

  impactList.innerHTML = impacts.map((impact) => `
    <article class="impact-item">
      <div class="impact-head">
        <span>${impact.label}</span>
        <strong>${impact.value}</strong>
      </div>
      <div class="impact-rail" aria-label="${impact.label} ${impact.progress}%"><i style="--value: ${impact.progress}%"></i></div>
      <p>${impact.note}</p>
    </article>
  `).join("");
}

function renderLogs() {
  logList.innerHTML = logs.map((log) => `
    <li>
      <span>${log.time}</span>
      <strong>${log.title}</strong>
      <span>${log.detail}</span>
    </li>
  `).join("");
}

function renderAll() {
  renderMetrics();
  renderChartMarkers();
  renderRoutes();
  renderRouteDetail();
  renderCaptains();
  renderBookings();
  renderImpacts();
  renderLogs();
}

document.querySelectorAll(".filter-group button").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter-group button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    addLog("航線篩選切換", `${button.textContent} 已套用。`);
    renderAll();
  });
});

document.querySelector("#optimize").addEventListener("click", () => {
  routes.sort((a, b) => {
    const riskA = availableSeats(a) === 0 || a.status === "天候觀察" ? 0 : 1;
    const riskB = availableSeats(b) === 0 || b.status === "天候觀察" ? 0 : 1;
    return riskA - riskB || availableSeats(a) - availableSeats(b);
  });
  captains.sort((a, b) => a.load - b.load);
  selectedRouteId = routes[0].id;
  addLog("靠泊順序重排", "候補、天候觀察與低名額航線已推到調度牌前段。");
  renderAll();
});

tideRange.addEventListener("input", () => {
  tideValue = Number(tideRange.value);
  renderMetrics();
  renderRouteDetail();
});

tideRange.addEventListener("change", () => {
  addLog("潮汐視窗更新", `潮汐視窗調整為 ${tideValue}%。`);
  renderAll();
});

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(bookingForm);
  const route = routes.find((item) => item.name === data.get("route"));
  const people = Number(data.get("people"));
  const seatsLeft = route ? availableSeats(route) : 0;
  const state = seatsLeft >= people ? "待付款" : "候補";

  bookings.unshift({
    guest: data.get("guest").toString().trim(),
    route: data.get("route"),
    people,
    state,
  });

  if (route && seatsLeft) {
    route.booked = Math.min(route.seats, route.booked + people);
    selectedRouteId = route.id;
  }

  addLog("預約需求新增", `${data.get("guest")} 送進 ${data.get("route")}，狀態為 ${state}。`);
  bookingForm.reset();
  renderAll();
});

renderRouteOptions();
renderAll();
