import { useState } from "react";

// ============================================================
// TabFlow MVP — Complete UI Gallery (All 16 Screens)
// ============================================================

const C = {
  bg0: "#080A0F", bg1: "#0E1117", bg2: "#151921", bg3: "#1C2230", bg4: "#252B3C",
  accent: "#3CE882", accentDim: "rgba(60,232,130,0.12)", accentFaint: "rgba(60,232,130,0.06)",
  warn: "#F0A030", warnDim: "rgba(240,160,48,0.12)",
  danger: "#E8455A", dangerDim: "rgba(232,69,90,0.12)",
  info: "#5090F0", infoDim: "rgba(80,144,240,0.12)",
  t1: "#EAF0FA", t2: "#9AA4BD", t3: "#5C6482", t4: "#3C4360",
  border: "rgba(255,255,255,0.06)", borderH: "rgba(255,255,255,0.12)",
};

const mono = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";
const sans = "'SF Pro Display', 'Segoe UI', system-ui, sans-serif";

// ============================================================
// Shared tiny components
// ============================================================
const Favicon = ({ color, children, size = 18 }) => (
  <div style={{ width: size, height: size, borderRadius: 5, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5, fontWeight: 700, color: "#fff", flexShrink: 0, lineHeight: 1 }}>
    {children}
  </div>
);

const Pill = ({ color, bg, children, blink }) => (
  <span style={{ fontFamily: mono, fontSize: 10, padding: "2px 7px", borderRadius: 5, background: bg, color, fontWeight: 600, whiteSpace: "nowrap", animation: blink ? "tblink 1.4s ease infinite" : "none" }}>
    {children}
  </span>
);

const Badge = ({ color, bg, children }) => (
  <span style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 4, background: bg, color, fontWeight: 600, fontFamily: mono }}>
    {children}
  </span>
);

const Toggle = ({ on }) => (
  <div style={{ width: 34, height: 19, borderRadius: 10, background: on ? C.accent : C.bg4, position: "relative", cursor: "pointer", flexShrink: 0 }}>
    <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", position: "absolute", top: 2.5, left: on ? 17.5 : 2.5, transition: "left .2s" }} />
  </div>
);

const Btn = ({ children, primary, danger, small, style = {} }) => (
  <button style={{ padding: small ? "4px 10px" : "8px 16px", border: primary || danger ? "none" : `1px solid ${C.border}`, background: primary ? C.accent : danger ? C.dangerDim : "transparent", color: primary ? C.bg0 : danger ? C.danger : C.t2, fontFamily: sans, fontSize: small ? 10.5 : 12, fontWeight: 600, borderRadius: 7, cursor: "pointer", ...style }}>
    {children}
  </button>
);

// ============================================================
// Phone Frame wrapper (for popup screens)
// ============================================================
const PhoneFrame = ({ children, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
    <div style={{ width: 340, background: C.bg1, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
      {children}
    </div>
    <span style={{ fontSize: 11, color: C.t3, fontFamily: mono, letterSpacing: 1 }}>{label}</span>
  </div>
);

const TopBar = ({ hasRule } = {}) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: C.bg2, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${C.accent}, #28B860)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: 13 }}>TabFlow</span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <span style={{ fontFamily: mono, fontSize: 10, color: C.t3 }}><b style={{ color: C.t2 }}>23</b> tabs</span>
        <span style={{ fontFamily: mono, fontSize: 10, color: C.t3 }}><b style={{ color: C.t2 }}>4</b> rules</span>
      </div>
    </div>
    {/* Current tab context bar */}
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: C.bg3, borderBottom: `1px solid ${C.border}` }}>
      <Favicon color="#FF0000" size={14}>▶</Favicon>
      <span style={{ fontSize: 10.5, color: C.t3, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: mono }}>youtube.com</span>
      {hasRule ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: C.warnDim, border: `1px solid rgba(240,160,48,0.15)`, borderRadius: 5 }}>
          <span style={{ fontSize: 10, color: C.warn, fontWeight: 600 }}>Video 1hr · 42:10</span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: C.accentDim, border: `1px solid rgba(60,232,130,0.2)`, borderRadius: 5, cursor: "pointer" }}>
          <span style={{ fontSize: 10 }}>⚙️</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.accent }}>Manage</span>
        </div>
      )}
    </div>
  </div>
);

const NavBar = ({ active }) => (
  <div style={{ display: "flex", padding: "0 10px", background: C.bg2, borderBottom: `1px solid ${C.border}` }}>
    {[
      ["Now", "18"],
      ["Soon", "5"],
      ["Past", "12"],
    ].map(([t, count]) => (
      <div key={t} style={{ padding: "8px 10px", fontSize: 10.5, fontWeight: 600, color: t === active ? C.accent : C.t4, borderBottom: `2px solid ${t === active ? C.accent : "transparent"}`, display: "flex", alignItems: "center", gap: 4 }}>
        {t}
        <span style={{ fontSize: 9, fontFamily: mono, padding: "1px 5px", borderRadius: 4, background: t === active ? C.accentDim : C.bg3, color: t === active ? C.accent : C.t4 }}>{count}</span>
      </div>
    ))}
  </div>
);

// ============================================================
// SCREEN 1: Now — Currently open tabs
// ============================================================
const nowTabs = [
  { name: "GitHub — tabflow/tabflow-ext", domain: "github.com", time: "just now", fav: "G", fc: "#24292E" },
  { name: "Chrome Extension API Reference", domain: "developer.chrome.com", time: "1h ago", fav: "📄", fc: "#FBBC04" },
  { name: "Show HN: TabFlow — AI Tab Manager", domain: "news.ycombinator.com", time: "3h ago", fav: "Y", fc: "#FF6600" },
  { name: "Discord — #tabflow-dev", domain: "discord.com", time: "10m ago", fav: "D", fc: "#5865F2" },
];

const PopupMain = () => (
  <PhoneFrame label="01 · NOW (OPEN TABS)">
    <TopBar />
    <NavBar active="Now" />
    <div style={{ padding: "8px 12px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <span style={{ fontSize: 12, color: C.t4 }}>🔍</span>
        <span style={{ fontSize: 11.5, color: C.t4 }}>Search tabs...</span>
        <span style={{ marginLeft: "auto", fontSize: 9.5, fontFamily: mono, color: C.t4, padding: "1px 5px", background: C.bg4, borderRadius: 3 }}>⌘K</span>
      </div>
    </div>
    {/* Trust banner — shown after first auto-close, dismissible */}
    <div style={{ margin: "6px 12px 0", padding: "9px 12px", background: C.accentFaint, border: `1px solid rgba(60,232,130,0.2)`, borderRadius: 9, display: "flex", alignItems: "center", gap: 9 }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>✅</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: C.accent }}>3 tabs cleaned · Nothing lost</div>
        <div style={{ fontSize: 10, color: C.t3 }}>Everything is safe in <b style={{ color: C.accent, cursor: "pointer" }}>Past</b></div>
      </div>
      <span style={{ fontSize: 12, color: C.t4, cursor: "pointer", flexShrink: 0 }}>✕</span>
    </div>
    <div style={{ padding: "4px 12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
      {nowTabs.map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: C.bg2, borderRadius: 9, border: `1px solid ${C.border}` }}>
          <Favicon color={t.fc}>{t.fav}</Favicon>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
            <div style={{ fontSize: 9.5, color: C.t4, fontFamily: mono }}>{t.domain} · {t.time}</div>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", border: `1px dashed rgba(60,232,130,0.4)`, background: C.accentFaint, color: C.accent, borderRadius: 9, fontSize: 11.5, fontWeight: 600, cursor: "pointer", marginTop: 2 }}>
        ✨ AI Analyze All Tabs
      </div>
    </div>
  </PhoneFrame>
);

// ============================================================
// SCREEN 1B: Soon — Tabs with active countdowns
// ============================================================
const soonTabs = [
  { name: "Twitter / X — Home", domain: "x.com", time: "2m ago", fav: "𝕏", fc: "#1DA1F2", rule: "Social 30m", remaining: "18:32", urgent: false },
  { name: "How to Build a Compiler in Rust", domain: "youtube.com", time: "45m ago", fav: "▶", fc: "#FF0000", rule: "Video 1hr", remaining: "02:15", urgent: true },
  { name: "Reddit — r/programming", domain: "reddit.com", time: "20m ago", fav: "R", fc: "#FF4500", rule: "Social 30m", remaining: "10:42", urgent: false },
  { name: "Instagram — Feed", domain: "instagram.com", time: "35m ago", fav: "📷", fc: "#E1306C", rule: "Social 30m", remaining: "05:18", urgent: true },
  { name: "Bilibili — 编程教程", domain: "bilibili.com", time: "1h ago", fav: "B", fc: "#00A1D6", rule: "Video 1hr", remaining: "42:30", urgent: false },
];

const SoonView = () => (
  <PhoneFrame label="01B · SOON (CLOSING)">
    <TopBar hasRule />
    <NavBar active="Soon" />
    <div style={{ padding: "8px 12px 4px" }}>
      <div style={{ fontSize: 10, color: C.t4, marginBottom: 2 }}>These tabs will auto-close when their time is up.</div>
    </div>
    <div style={{ padding: "4px 12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
      {soonTabs.map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: C.bg2, borderRadius: 9, border: `1px solid ${t.urgent ? "rgba(232,68,68,0.25)" : C.border}` }}>
          <Favicon color={t.fc}>{t.fav}</Favicon>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
            <div style={{ fontSize: 9.5, color: C.t4, fontFamily: mono }}>{t.domain} · {t.rule}</div>
          </div>
          <Pill
            color={t.urgent ? C.danger : C.warn}
            bg={t.urgent ? C.dangerDim : C.warnDim}
            blink={t.urgent}
          >{t.remaining}</Pill>
        </div>
      ))}
    </div>
  </PhoneFrame>
);

// ============================================================
// SCREEN 1C: Popup — Grouped View (Many Tabs)
// ============================================================
const groups = [
  { domain: "youtube.com", fc: "#FF0000", fav: "▶", count: 8, ruled: 3, expanded: true,
    tabs: [
      { name: "How to Build a Compiler in Rust", time: "45m ago", remaining: "02:15", urgent: true },
      { name: "React 19 — What's New", time: "2h ago", remaining: "38:00", urgent: false },
      { name: "Figma Config 2025 Keynote", time: "3h ago", remaining: "52:17", urgent: false },
    ]},
  { domain: "github.com", fc: "#24292E", fav: "G", count: 6, ruled: 0, expanded: false, tabs: [] },
  { domain: "x.com", fc: "#1DA1F2", fav: "𝕏", count: 4, ruled: 4, expanded: false, tabs: [] },
  { domain: "stackoverflow.com", fc: "#F48024", fav: "S", count: 3, ruled: 0, expanded: false, tabs: [] },
  { domain: "reddit.com", fc: "#FF4500", fav: "R", count: 3, ruled: 2, expanded: false, tabs: [] },
  { domain: "developer.chrome.com", fc: "#FBBC04", fav: "📄", count: 2, ruled: 0, expanded: false, tabs: [] },
  { domain: "Others (5 sites)", fc: "#5D6380", fav: "···", count: 7, ruled: 1, expanded: false, tabs: [] },
];

const GroupedView = () => (
  <PhoneFrame label="01C · GROUPED VIEW (33 TABS)">
    <TopBar hasRule />
    <NavBar active="Now" />
    {/* Search */}
    <div style={{ padding: "8px 12px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <span style={{ fontSize: 12, color: C.t4 }}>🔍</span>
        <span style={{ fontSize: 11.5, color: C.t4 }}>Search 33 tabs...</span>
        <span style={{ marginLeft: "auto", fontSize: 9, fontFamily: mono, color: C.t4, padding: "1px 5px", background: C.bg4, borderRadius: 3 }}>Sort ▾</span>
      </div>
    </div>
    <div style={{ padding: "4px 12px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
      {groups.map((g, i) => (
        <div key={i} style={{ background: C.bg2, borderRadius: 9, border: `1px solid ${g.expanded ? C.borderH : C.border}`, overflow: "hidden" }}>
          {/* Group header */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", cursor: "pointer" }}>
            <Favicon color={g.fc}>{g.fav}</Favicon>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600 }}>{g.domain}</div>
              <div style={{ fontSize: 9.5, color: C.t4, fontFamily: mono }}>
                {g.count} tabs{g.ruled > 0 ? ` · ${g.ruled} ruled` : ""}
              </div>
            </div>
            {g.ruled > 0 && <Pill color={C.accent} bg={C.accentDim}>{g.ruled} ⚙️</Pill>}
            <span style={{ fontSize: 10, color: C.t4, transform: g.expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>▼</span>
          </div>
          {/* Expanded tabs */}
          {g.expanded && g.tabs.map((t, j) => (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px 6px 39px", borderTop: `1px solid ${C.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                <div style={{ fontSize: 9, color: C.t4, fontFamily: mono }}>{t.time}</div>
              </div>
              <Pill
                color={t.urgent ? C.danger : C.warn}
                bg={t.urgent ? C.dangerDim : C.warnDim}
                blink={t.urgent}
              >{t.remaining}</Pill>
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", border: `1px dashed rgba(60,232,130,0.4)`, background: C.accentFaint, color: C.accent, borderRadius: 9, fontSize: 11.5, fontWeight: 600, cursor: "pointer", marginTop: 2 }}>
        ✨ AI Analyze All 33 Tabs
      </div>
    </div>
  </PhoneFrame>
);

// ============================================================
// SCREEN 2: Past — Auto-closed tabs (recoverable)
// ============================================================
const pastTabs = [
  { name: "Instagram — Explore", domain: "instagram.com", rule: "Social 30m", ago: "2m ago", fav: "IG", fc: "#E4405F" },
  { name: "Reddit — r/webdev best practices", domain: "reddit.com", rule: "Social 30m", ago: "18m ago", fav: "R", fc: "#FF4500" },
  { name: "Taobao — Mechanical Keyboard", domain: "taobao.com", rule: "Shopping 20m", ago: "1h ago", fav: "T", fc: "#FF5722" },
  { name: "YouTube — React 19 Features", domain: "youtube.com", rule: "Video 1hr", ago: "3h ago", fav: "▶", fc: "#FF0000" },
  { name: "Twitter — AI News Thread", domain: "x.com", rule: "Social 30m", ago: "5h ago", fav: "𝕏", fc: "#1DA1F2" },
];

const PastScreen = () => (
  <PhoneFrame label="02 · PAST (NOTHING LOST)">
    <TopBar />
    <NavBar active="Past" />
    <div style={{ padding: "8px 12px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <span style={{ fontSize: 12, color: C.t4 }}>🔍</span>
        <span style={{ fontSize: 11.5, color: C.t4 }}>Search past tabs...</span>
      </div>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px 2px", fontSize: 10.5, color: C.t3 }}>
      <span>37 tabs · nothing lost</span>
      <span style={{ color: C.danger, cursor: "pointer", fontWeight: 500 }}>Clear All</span>
    </div>
    <div style={{ padding: "4px 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      {pastTabs.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: C.bg2, borderRadius: 9, border: `1px solid ${C.border}` }}>
          <Favicon color={s.fc}>{s.fav}</Favicon>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
            <div style={{ fontSize: 9, color: C.t4, fontFamily: mono }}>{s.rule} · closed {s.ago}</div>
          </div>
          <Btn primary small>Restore</Btn>
        </div>
      ))}
    </div>
    <div style={{ textAlign: "center", fontSize: 9.5, color: C.t4, padding: "4px 12px 12px", lineHeight: 1.5 }}>
      Everything is recoverable for 7 days.
    </div>
  </PhoneFrame>
);

// ============================================================
// SCREEN 2B: Past — Many Items (Time-Grouped)
// ============================================================
const PastFilterBar = ({ active }) => (
  <div style={{ display: "flex", gap: 5, padding: "6px 12px 0" }}>
    {["All", "By Rule", "By Site"].map((label, i) => (
      <div key={label} style={{ padding: "3px 9px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", background: label === active ? C.bg4 : "transparent", color: label === active ? C.t1 : C.t4, border: `1px solid ${label === active ? C.borderH : "transparent"}` }}>{label}</div>
    ))}
  </div>
);

const pastTimeGroups = [
  { label: "Just now", expanded: true, items: [
    { name: "Instagram — Explore", rule: "Social 30m", ago: "2m", fav: "IG", fc: "#E4405F" },
    { name: "Reddit — r/webdev", rule: "Social 30m", ago: "18m", fav: "R", fc: "#FF4500" },
  ]},
  { label: "Today", expanded: true, items: [
    { name: "Taobao — Mechanical Keyboard", rule: "Shopping 20m", ago: "1h", fav: "T", fc: "#FF5722" },
    { name: "YouTube — React 19 Features", rule: "Video 1hr", ago: "3h", fav: "▶", fc: "#FF0000" },
    { name: "Twitter — AI News Thread", rule: "Social 30m", ago: "5h", fav: "𝕏", fc: "#1DA1F2" },
    { name: "Amazon — USB-C Hub", rule: "Shopping 20m", ago: "6h", fav: "A", fc: "#FF9900" },
  ]},
  { label: "Yesterday · 12 tabs", expanded: false, items: [] },
  { label: "2 days ago · 9 tabs", expanded: false, items: [] },
  { label: "Older · 14 tabs", expanded: false, items: [] },
];

const PastMany = () => (
  <PhoneFrame label="02B · PAST (87 ITEMS)">
    <TopBar />
    <NavBar active="Past" />
    <div style={{ padding: "8px 12px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <span style={{ fontSize: 12, color: C.t4 }}>🔍</span>
        <span style={{ fontSize: 11.5, color: C.t4 }}>Search 87 past tabs...</span>
      </div>
    </div>
    <PastFilterBar active="All" />
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px 2px", fontSize: 10.5, color: C.t3 }}>
      <span>87 tabs · all recoverable</span>
      <span style={{ color: C.danger, cursor: "pointer", fontWeight: 500 }}>Clear expired</span>
    </div>
    <div style={{ padding: "4px 12px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
      {pastTimeGroups.map((g, i) => (
        <div key={i} style={{ background: C.bg2, borderRadius: 9, border: `1px solid ${g.expanded ? C.borderH : C.border}`, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "7px 10px", cursor: "pointer" }}>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: g.expanded ? C.t1 : C.t3 }}>{g.label}{g.expanded ? ` · ${g.items.length} tabs` : ""}</span>
            {g.expanded && g.items.length > 1 && (
              <span style={{ fontSize: 9.5, color: C.accent, fontWeight: 600, marginRight: 8, cursor: "pointer" }}>Restore all</span>
            )}
            <span style={{ fontSize: 10, color: C.t4, transform: g.expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
          </div>
          {g.expanded && g.items.map((s, j) => (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", borderTop: `1px solid ${C.border}` }}>
              <Favicon color={s.fc} size={16}>{s.fav}</Favicon>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                <div style={{ fontSize: 9, color: C.t4, fontFamily: mono }}>{s.rule} · closed {s.ago} ago</div>
              </div>
              <Btn primary small style={{ padding: "3px 8px", fontSize: 10 }}>Restore</Btn>
            </div>
          ))}
        </div>
      ))}
    </div>
    <div style={{ textAlign: "center", fontSize: 9.5, color: C.t4, padding: "2px 12px 10px", lineHeight: 1.5 }}>
      Everything is recoverable for 7 days.
    </div>
  </PhoneFrame>
);

// ============================================================
// SCREEN 3: AI Analysis Results
// ============================================================
const suggestions = [
  { icon: "🗑", title: "Close 6 tabs", desc: "3 read articles + 2 stale + 1 dup", btn: "Close All", color: C.danger, bg: C.dangerDim },
  { icon: "⚙️", title: "Create rule · 3 sites", desc: "Twitter 30m, Reddit 30m, YouTube 60m", btn: "Apply", color: C.warn, bg: C.warnDim },
  { icon: "✨", title: "Suggested rule", desc: "Auto-close shopping sites · 20min", btn: "Create", color: C.accent, bg: C.accentDim },
];

const AIResults = () => (
  <PhoneFrame label="03 · AI ANALYSIS RESULTS">
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 14px", background: C.bg2, borderBottom: `1px solid ${C.border}` }}>
      <span style={{ color: C.t3, fontSize: 13 }}>←</span>
      <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>✨ AI Analysis</span>
      <Badge color={C.t3} bg={C.bg4}>Claude Haiku</Badge>
    </div>
    <div style={{ padding: "10px 14px 6px" }}>
      <div style={{ fontSize: 12.5, fontWeight: 600 }}>Analyzed 23 tabs · 4 suggestions</div>
      <div style={{ fontSize: 9.5, color: C.t4, marginTop: 2 }}>🔒 Only URLs and titles sent. No page content.</div>
    </div>
    <div style={{ padding: "6px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
      {suggestions.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 11px", background: C.bg2, borderRadius: 9, border: `1px solid ${C.border}` }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{s.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600 }}>{s.title}</div>
            <div style={{ fontSize: 9.5, color: C.t4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.desc}</div>
          </div>
          <button style={{ padding: "4px 10px", border: "none", borderRadius: 5, background: s.bg, color: s.color, fontFamily: sans, fontSize: 10.5, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>{s.btn}</button>
        </div>
      ))}
    </div>
    <div style={{ display: "flex", gap: 7, padding: "10px 12px", borderTop: `1px solid ${C.border}`, marginTop: "auto" }}>
      <input placeholder="Ask about your tabs..." style={{ flex: 1, padding: "8px 11px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 7, color: C.t1, fontFamily: sans, fontSize: 11.5, outline: "none" }} />
      <div style={{ width: 32, height: 32, borderRadius: 7, background: C.accent, color: C.bg0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>↑</div>
    </div>
  </PhoneFrame>
);


// ============================================================
// SCREEN 5: AI Consent Modal
// ============================================================
const ConsentModal = () => (
  <PhoneFrame label="05 · AI CONSENT DIALOG">
    <div style={{ padding: "30px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>✨</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Enable AI Analysis</div>
      <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.6, marginBottom: 20 }}>TabFlow AI will analyze your open tabs to provide smart suggestions.</div>
      <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {[
          ["📤", "What is sent:", "Tab URLs and titles only"],
          ["🚫", "NOT sent:", "Page content, passwords, form data"],
          ["🔑", "Your API key:", "Stored locally, never sent to TabFlow"],
        ].map(([icon, label, desc], i) => (
          <div key={i} style={{ display: "flex", gap: 9, fontSize: 11.5, color: C.t2, lineHeight: 1.4 }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
            <div><b>{label}</b> {desc}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: C.t4, marginBottom: 18 }}>You can disable AI at any time in Settings.</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <Btn>Not Now</Btn>
        <Btn primary>I Understand, Enable AI</Btn>
      </div>
    </div>
  </PhoneFrame>
);


// ============================================================
// SCREEN 7: Rules Management (wide)
// ============================================================
const rules = [
  { name: "Social Media 30min", desc: "x.com, instagram.com, weibo.com → close after 30min inactive", tags: [["x.com", "d"], ["instagram.com", "d"], ["inactive 30m", "t"], ["close + stash", "a"]], stat: "47× · ~1.2GB saved", src: "Manual" },
  { name: "Video Sites 1hr Limit", desc: "youtube.com, bilibili.com → close after 60min open", tags: [["youtube.com", "d"], ["bilibili.com", "d"], ["open 60m", "t"], ["close + stash", "a"]], stat: "23× · ~3.5h saved", src: "Manual" },
  { name: "Shopping Auto-Archive", desc: "taobao.com, jd.com → close after 20min inactive", tags: [["taobao.com", "d"], ["jd.com", "d"], ["inactive 20m", "t"], ["close + stash", "a"], ["✨ AI", "ai"]], stat: "12× · 2 days ago", src: "✨ AI" },
];

const tagColor = (t) => ({ d: [C.info, C.infoDim], t: [C.warn, C.warnDim], a: [C.danger, C.dangerDim], ai: [C.accent, C.accentDim] }[t]);

const RulesScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
    <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 820 }}>
      {/* Sidebar */}
      <div style={{ width: 180, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          ["⏱", "Auto-Close", "3", true], ["✨", "AI Generated", "1", false],
        ].map(([icon, label, count, on], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 9, background: on ? C.bg2 : "transparent", border: `1px solid ${on ? C.borderH : "transparent"}`, color: on ? C.accent : C.t3, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            <span style={{ width: 26, height: 26, borderRadius: 6, background: on ? C.accentDim : C.bg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{icon}</span>
            <span style={{ flex: 1 }}>{label}</span>
            <span style={{ fontFamily: mono, fontSize: 10, color: C.t4 }}>{count}</span>
          </div>
        ))}
      </div>
      {/* Main */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Auto-Close Rules</span>
          <Btn primary style={{ fontSize: 11, padding: "6px 13px" }}>+ Create Rule</Btn>
        </div>
        {rules.map((r, i) => (
          <div key={i} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{r.name}</div>
                <div style={{ fontSize: 10.5, color: C.t3 }}>{r.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <Toggle on />
                <div style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: C.t3, background: i === 1 ? C.bg4 : "transparent", border: i === 1 ? `1px solid ${C.borderH}` : "1px solid transparent" }}>⋮</div>
              </div>
            </div>
            {/* Dropdown shown on second card as demo */}
            {i === 1 && (
              <div style={{ position: "absolute", top: 42, right: 14, width: 140, background: C.bg3, border: `1px solid ${C.borderH}`, borderRadius: 9, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 10, overflow: "hidden" }}>
                {[
                  ["✏️", "Edit", C.t1],
                  ["📋", "Duplicate", C.t1],
                  ["🗑", "Delete", C.danger],
                ].map(([icon, label, color], k) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 12, fontWeight: 500, color, cursor: "pointer", borderTop: k > 0 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ fontSize: 12 }}>{icon}</span>{label}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {r.tags.map(([label, type], j) => {
                const [c, b] = tagColor(type);
                return <span key={j} style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, fontFamily: mono, fontWeight: 500, background: b, color: c }}>{label}</span>;
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 10, color: C.t4, fontFamily: mono }}>{r.stat}</span>
              <Badge color={r.src.includes("AI") ? C.accent : C.t3} bg={r.src.includes("AI") ? C.accentDim : C.bg4}>{r.src}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
    <span style={{ fontSize: 11, color: C.t3, fontFamily: mono, letterSpacing: 1 }}>07 · RULES MANAGEMENT</span>
  </div>
);

// ============================================================
// SCREEN 04: Intent-driven Creator (from TopBar "Manage" or tab hover ⚙️)
// ============================================================
const QuickRuleCreator = () => (
  <PhoneFrame label="04 · WHY IS THIS OPEN?">
    <TopBar />
    <NavBar active="Now" />
    <div style={{ position: "relative" }}>
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6, opacity: 0.15 }}>
        {nowTabs.slice(0, 3).map((t, i) => (
          <div key={i} style={{ padding: "8px 10px", background: C.bg2, borderRadius: 9, border: `1px solid ${C.border}`, height: 42 }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: 8, left: 16, right: 16, background: C.bg1, border: `1px solid ${C.borderH}`, borderRadius: 14, padding: "16px 18px", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}>
        {/* Domain (read-only) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: C.bg2, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <Favicon color="#FF0000" size={16}>▶</Favicon>
          <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}>youtube.com</span>
          <span style={{ fontSize: 9, color: C.t4, fontFamily: mono }}>current tab</span>
        </div>

        {/* Intent question */}
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 10 }}>Why is this tab open?</div>

        {/* 3 intent buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {[
            ["⏳", "Just browsing", "Close after 15 min inactive", true, C.accent, C.accentDim],
            ["🔄", "I'll come back later", "Close after 2 hours inactive", false, C.warn, C.warnDim],
            ["📌", "Important — don't close", "Never auto-close this site", false, C.info, C.infoDim],
          ].map(([icon, label, desc, selected, color, bg]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: selected ? bg : C.bg2, border: `1px solid ${selected ? color : C.border}`, borderRadius: 9, cursor: "pointer" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: selected ? color : C.t2 }}>{label}</div>
                <div style={{ fontSize: 9.5, color: C.t4, marginTop: 1 }}>{desc}</div>
              </div>
              {selected && <span style={{ fontSize: 12, color }}>✓</span>}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 7 }}>
          <Btn style={{ flex: 1 }}>Cancel</Btn>
          <Btn primary style={{ flex: 2 }}>Done</Btn>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

// ============================================================
// SCREEN 08: Rule Editor (from Rules page "+ Create Rule")
// ============================================================
const RuleEditor = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
    <div style={{ width: 400, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>New Rule</div>
      
      {/* Step 1: Which site */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.accent, fontWeight: 700 }}>1</div>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Which site?</span>
        </div>
        <input placeholder="youtube.com, bilibili.com" style={{ width: "100%", padding: "9px 12px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 7, color: C.t1, fontFamily: mono, fontSize: 12.5, outline: "none" }} />
        <div style={{ fontSize: 9.5, color: C.t4, marginTop: 4 }}>Separate with commas. Subdomains auto-matched.</div>
      </div>

      {/* Step 2: Close after */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.accent, fontWeight: 700 }}>2</div>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Close after</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["15 min", "30 min", "1 hour", "2 hours"].map((t, i) => (
            <div key={t} style={{ flex: 1, padding: "9px 0", textAlign: "center", border: `1px solid ${i === 1 ? C.accent : C.border}`, background: i === 1 ? C.accentDim : C.bg3, color: i === 1 ? C.accent : C.t2, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Step 3: When */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.accent, fontWeight: 700 }}>3</div>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Start counting when...</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            ["I stop looking at it", true],
            ["It's been open (total)", false],
          ].map(([label, on]) => (
            <div key={label} style={{ flex: 1, padding: "10px 10px", textAlign: "center", border: `1px solid ${on ? C.accent : C.border}`, background: on ? C.accentDim : C.bg3, color: on ? C.accent : C.t2, borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: "pointer", lineHeight: 1.3 }}>{on && "✓ "}{label}</div>
          ))}
        </div>
        <div style={{ fontSize: 9.5, color: C.t4, marginTop: 5 }}>Most people pick the first option — tabs close when you forget about them.</div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn>Cancel</Btn>
        <Btn primary>Save Rule</Btn>
      </div>
    </div>
    <span style={{ fontSize: 11, color: C.t3, fontFamily: mono, letterSpacing: 1 }}>08 · RULE EDITOR</span>
  </div>
);

// ============================================================
// SCREEN 9: Settings
// ============================================================
const SettingsScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
    <div style={{ width: "100%", maxWidth: 600 }}>
      {/* Rules */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 7 }}>📐 Rules</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Active Rules</div>
            <div style={{ fontSize: 10, color: C.t4, marginTop: 1 }}>4 rules managing 8 domains</div>
          </div>
          <span style={{ fontSize: 12, color: C.accent, fontWeight: 600, cursor: "pointer" }}>Manage →</span>
        </div>
        <div style={{ padding: "9px 0" }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>Protected Domains</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["github.com", "docs.google.com", "notion.so"].map(d => (
              <span key={d} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontFamily: mono, background: C.infoDim, color: C.info, display: "flex", alignItems: "center", gap: 4 }}>📌 {d} <span style={{ cursor: "pointer", opacity: 0.6 }}>✕</span></span>
            ))}
          </div>
          <div style={{ fontSize: 9.5, color: C.t4, marginTop: 4 }}>These sites will never be auto-closed.</div>
        </div>
      </div>
      {/* General */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 7 }}>⚙️ General</div>
        {[
          ["Language", "Auto-detect from browser", ["English", "简体中文"]],
          ["Past Expiry", "How long closed tabs are recoverable", ["7 days", "14 days", "30 days"]],
        ].map(([label, sub, opts], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 1 ? `1px solid ${C.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{label}</div>
              {sub && <div style={{ fontSize: 10, color: C.t4, marginTop: 1 }}>{sub}</div>}
            </div>
            <select style={{ width: 170, padding: "6px 10px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, color: C.t1, fontFamily: sans, fontSize: 11.5, outline: "none", appearance: "none" }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      {/* AI */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 7 }}>✨ AI Configuration</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>AI Analysis</span>
          <Toggle on />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>LLM Provider</span>
          <select style={{ width: 170, padding: "6px 10px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, color: C.t1, fontFamily: sans, fontSize: 11.5, outline: "none", appearance: "none" }}>
            <option>Claude Haiku</option><option>DeepSeek</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0" }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>API Key</div>
            <div style={{ fontSize: 10, color: C.accent, fontFamily: mono, marginTop: 3 }}>✓ Connected</div>
          </div>
          <input type="password" defaultValue="sk-ant-xxxxx" style={{ width: 170, padding: "6px 10px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, color: C.t1, fontFamily: mono, fontSize: 11.5, outline: "none" }} />
        </div>
        <div style={{ background: C.accentFaint, border: `1px solid rgba(60,232,130,0.12)`, borderRadius: 9, padding: "11px 14px", marginTop: 10, fontSize: 10.5, color: C.t3, lineHeight: 1.6 }}>
          <b style={{ color: C.accent }}>🔒 Privacy:</b> Only tab URLs and titles are sent. Your API key is stored locally and never sent to TabFlow servers.
        </div>
      </div>
      {/* Data */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 7 }}>💾 Data Management</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn>📤 Export Rules</Btn>
          <Btn>📥 Import Rules</Btn>
          <Btn danger>🗑 Clear All Data</Btn>
        </div>
      </div>
    </div>
    <span style={{ fontSize: 11, color: C.t3, fontFamily: mono, letterSpacing: 1, marginTop: 6 }}>09 · SETTINGS</span>
  </div>
);

// ============================================================
// SCREEN 10: Chrome Web Store Promo
// ============================================================
const StorePromo = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
    <div style={{ width: "100%", maxWidth: 820, aspectRatio: "1280/800", background: `linear-gradient(135deg, ${C.bg0} 0%, ${C.bg2} 50%, ${C.bg0} 100%)`, borderRadius: 16, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "40px 48px", position: "relative", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
      {/* glow */}
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.accentDim} 0%, transparent 70%)`, top: -80, right: -40, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 250, height: 250, borderRadius: "50%", background: `radial-gradient(circle, ${C.accentFaint} 0%, transparent 70%)`, bottom: -60, left: 80, pointerEvents: "none" }} />
      {/* left */}
      <div style={{ flex: 1, zIndex: 1 }}>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -2, background: `linear-gradient(135deg, ${C.accent}, #8BFFC0)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>TabFlow</div>
        <div style={{ fontSize: 16, color: C.t2, fontWeight: 500, marginBottom: 28 }}>Smart Tab Lifecycle Manager</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {[
            ["⏱", "Auto-close tabs by custom rules"],
            ["✨", "AI-powered tab analysis & suggestions"],
            ["🔒", "Every closed tab can be restored"],
            ["🌍", "English & 中文 · Privacy-first"],
          ].map(([icon, text], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: C.t2 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>{text}
            </div>
          ))}
        </div>
      </div>
      {/* right mock */}
      <div style={{ width: 220, flexShrink: 0, zIndex: 1, transform: "perspective(800px) rotateY(-5deg) rotateX(2deg)" }}>
        <div style={{ background: C.bg1, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
          <div style={{ height: 26, background: C.bg2, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 10px", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: C.danger }} />
            <div style={{ width: 6, height: 6, borderRadius: 3, background: C.warn }} />
            <div style={{ width: 6, height: 6, borderRadius: 3, background: C.accent }} />
          </div>
          <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
            {[["#1DA1F2", 0.6, C.warnDim], ["#FF0000", 0.8, C.dangerDim], ["#24292E", 0.5, C.accentDim], ["#FBBC04", 0.65, C.warnDim], ["#FF6600", 0.55, C.warnDim]].map(([fc, w, pc], i) => (
              <div key={i} style={{ height: 22, background: C.bg2, borderRadius: 5, display: "flex", alignItems: "center", padding: "0 8px", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: fc }} />
                <div style={{ flex: 1, height: 5, background: C.bg4, borderRadius: 2 }}>
                  <div style={{ width: `${w * 100}%`, height: "100%", background: C.bg5, borderRadius: 2 }} />
                </div>
                <div style={{ width: 30, height: 11, borderRadius: 3, background: pc }} />
              </div>
            ))}
            <div style={{ marginTop: 2, padding: "6px", border: `1px dashed rgba(60,232,130,0.3)`, borderRadius: 6, textAlign: "center", fontSize: 8.5, color: C.accent, fontWeight: 600 }}>✨ AI Analyze</div>
          </div>
        </div>
      </div>
    </div>
    <span style={{ fontSize: 11, color: C.t3, fontFamily: mono, letterSpacing: 1 }}>10 · CHROME WEB STORE PROMO</span>
  </div>
);

// ============================================================
// SCREEN 0A: Welcome — First Install Splash (Options Page)
// ============================================================
const WelcomePage = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
    <div style={{ width: "100%", maxWidth: 560, background: C.bg1, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", padding: "40px 36px" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.accent}, #28B860)`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 14 }}>⚡</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, background: `linear-gradient(135deg, ${C.accent}, #8BFFC0)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Welcome to TabFlow</div>
        <div style={{ fontSize: 13, color: C.t3, marginTop: 6, lineHeight: 1.5 }}>Take control of your tabs. Set rules, let AI suggest,<br />and never lose a tab again.</div>
      </div>

      {/* 3 value props */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {[
          ["⏱", C.warn, C.warnDim, "Auto-close by rules", "Set time limits for any site. Tabs close automatically."],
          ["✨", C.accent, C.accentDim, "AI-powered suggestions", "Get smart advice: what to close or set rules for."],
          ["🛡", C.info, C.infoDim, "Nothing is lost", "Every closed tab is saved to stash. Restore anytime."],
        ].map(([icon, color, bg, title, desc], i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: C.bg2, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 11.5, color: C.t3, lineHeight: 1.4 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick setup CTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        <button style={{ width: "100%", padding: "12px 24px", border: "none", background: C.accent, color: C.bg0, fontFamily: sans, fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>Quick Setup (30 seconds) →</button>
        <button style={{ background: "none", border: "none", color: C.t4, fontFamily: sans, fontSize: 12, cursor: "pointer" }}>Skip, I'll explore on my own</button>
      </div>
    </div>
    <span style={{ fontSize: 11, color: C.t3, fontFamily: mono, letterSpacing: 1 }}>00A · WELCOME (FIRST INSTALL)</span>
  </div>
);

// ============================================================
// SCREEN 0B: Quick Setup — Rule Template Picker
// ============================================================
const QuickSetup = () => {
  const templates = [
    { icon: "🎭", name: "Social Media · 30min", desc: "Auto-close Twitter, Reddit, Instagram after 30 minutes inactive", sites: ["x.com", "reddit.com", "instagram.com"], on: true },
    { icon: "🎬", name: "Video Sites · 1hr", desc: "Auto-close YouTube, Bilibili after 1 hour open", sites: ["youtube.com", "bilibili.com"], on: false },
    { icon: "🛒", name: "Shopping · 20min", desc: "Auto-close Amazon, Taobao after 20 minutes inactive", sites: ["amazon.com", "taobao.com"], on: false },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
      <div style={{ width: "100%", maxWidth: 480, background: C.bg1, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", padding: "28px 28px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>⚡ Quick Setup</div>
          <div style={{ fontSize: 12.5, color: C.t3 }}>Toggle on the rules you want. You can customize them later.</div>
        </div>

        {/* Template cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {templates.map((t, i) => (
            <div key={i} style={{ padding: "14px 16px", background: t.on ? C.accentFaint : C.bg2, borderRadius: 11, border: `1px solid ${t.on ? "rgba(60,232,130,0.2)" : C.border}`, transition: "all .2s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</span>
                </div>
                <Toggle on={t.on} />
              </div>
              <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.4, marginBottom: 8 }}>{t.desc}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {t.sites.map(s => (
                  <span key={s} style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9.5, fontFamily: mono, background: C.infoDim, color: C.info, fontWeight: 500 }}>{s}</span>
                ))}
                <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9.5, fontFamily: mono, background: C.bg4, color: C.t4, cursor: "pointer" }}>+ edit</span>
              </div>
            </div>
          ))}
        </div>

        {/* AI opt-in (subtle) */}
        <div style={{ padding: "12px 14px", background: C.bg2, borderRadius: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 1 }}>Enable AI suggestions?</div>
            <div style={{ fontSize: 10.5, color: C.t4 }}>Optional. Needs API key. Only sends tab URLs.</div>
          </div>
          <Toggle on={false} />
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ flex: 1, padding: "11px", border: `1px solid ${C.border}`, background: "transparent", color: C.t3, fontFamily: sans, fontSize: 12.5, borderRadius: 9, cursor: "pointer" }}>Skip all</button>
          <button style={{ flex: 2, padding: "11px", border: "none", background: C.accent, color: C.bg0, fontFamily: sans, fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: "pointer" }}>Done · Activate 1 rule</button>
        </div>
      </div>
      <span style={{ fontSize: 11, color: C.t3, fontFamily: mono, letterSpacing: 1 }}>00B · QUICK SETUP (TEMPLATES)</span>
    </div>
  );
};

// ============================================================
// SCREEN 0C: First Open Popup — With Onboarding Banner
// ============================================================
const firstOpenTabs = [
  { name: "Twitter / X — Home", domain: "x.com", time: "5m ago", fav: "𝕏", fc: "#1DA1F2", remaining: "28:15", urgent: false },
  { name: "How to Build a Compiler in Rust", domain: "youtube.com", time: "12m ago", fav: "▶", fc: "#FF0000", remaining: null, urgent: false },
  { name: "GitHub — tabflow/tabflow-ext", domain: "github.com", time: "just now", fav: "G", fc: "#24292E", remaining: null, urgent: false },
  { name: "Chrome Extension API Reference", domain: "developer.chrome.com", time: "1h ago", fav: "📄", fc: "#FBBC04", remaining: null, urgent: false },
  { name: "Reddit — r/chrome", domain: "reddit.com", time: "20m ago", fav: "R", fc: "#FF4500", remaining: "10:42", urgent: false },
];

const FirstOpenPopup = () => (
  <PhoneFrame label="00C · FIRST OPEN POPUP">
    <TopBar />
    <NavBar active="Now" />
    {/* Onboarding banner */}
    <div style={{ margin: "8px 12px 0", padding: "10px 12px", background: C.accentFaint, border: `1px solid rgba(60,232,130,0.2)`, borderRadius: 9, display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🎉</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: C.accent }}>1 rule active · Social Media 30min</div>
        <div style={{ fontSize: 10, color: C.t3 }}>Matching tabs will auto-close when inactive.</div>
      </div>
      <span style={{ fontSize: 12, color: C.t4, cursor: "pointer", flexShrink: 0 }}>✕</span>
    </div>
    <div style={{ padding: "4px 12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
      {firstOpenTabs.map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: C.bg2, borderRadius: 9, border: `1px solid ${C.border}` }}>
          <Favicon color={t.fc}>{t.fav}</Favicon>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
            <div style={{ fontSize: 9.5, color: C.t4, fontFamily: mono }}>{t.domain} · {t.time}</div>
          </div>
          {t.remaining ? (
            <Pill color={C.warn} bg={C.warnDim}>{t.remaining}</Pill>
          ) : (
            <span style={{ fontSize: 9.5, color: C.t4 }}>—</span>
          )}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", border: `1px dashed rgba(60,232,130,0.4)`, background: C.accentFaint, color: C.accent, borderRadius: 9, fontSize: 11.5, fontWeight: 600, cursor: "pointer", marginTop: 2 }}>
        ✨ AI Analyze All Tabs
      </div>
    </div>
  </PhoneFrame>
);

// ============================================================
// SCREEN 0D: Trust Notification — After first auto-close
// ============================================================
const TrustNotification = () => (
  <PhoneFrame label="00D · FIRST AUTO-CLOSE">
    <TopBar />
    <NavBar active="Now" />
    {/* Trust banner */}
    <div style={{ margin: "8px 12px 0", padding: "12px 14px", background: C.accentFaint, border: `1px solid rgba(60,232,130,0.2)`, borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✅</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.accent }}>3 tabs cleaned · Nothing lost</div>
          <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>All safely saved. Restore anytime in Past.</div>
        </div>
        <span style={{ fontSize: 12, color: C.t4, cursor: "pointer", flexShrink: 0 }}>✕</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 1, padding: "6px", textAlign: "center", background: C.accentDim, border: `1px solid rgba(60,232,130,0.25)`, borderRadius: 6, fontSize: 10.5, fontWeight: 600, color: C.accent, cursor: "pointer" }}>View in Past →</div>
      </div>
    </div>
    <div style={{ padding: "8px 12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
      {nowTabs.slice(0, 3).map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: C.bg2, borderRadius: 9, border: `1px solid ${C.border}` }}>
          <Favicon color={t.fc}>{t.fav}</Favicon>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
            <div style={{ fontSize: 9.5, color: C.t4, fontFamily: mono }}>{t.domain} · {t.time}</div>
          </div>
        </div>
      ))}
    </div>
  </PhoneFrame>
);

// ============================================================
// SCREEN 0E: Undo Banner — 5 second window after auto-close
// ============================================================
const UndoBannerScreen = () => (
  <PhoneFrame label="00E · UNDO (5 SEC WINDOW)">
    <TopBar />
    <NavBar active="Now" />
    {/* Undo banner - highest priority, top of list */}
    <div style={{ margin: "8px 12px 0", padding: "10px 12px", background: C.warnDim, border: `1px solid rgba(240,160,48,0.25)`, borderRadius: 9, display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(240,160,48,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>⚡</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.warn }}>3 tabs just closed</div>
        <div style={{ fontSize: 9.5, color: C.t3, marginTop: 1 }}>x.com · reddit.com · instagram.com</div>
      </div>
      <div style={{ padding: "5px 12px", background: C.warn, borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#1A1C22", cursor: "pointer" }}>Undo</div>
    </div>
    {/* Countdown bar */}
    <div style={{ margin: "0 12px", height: 2, borderRadius: 1, background: C.bg3, overflow: "hidden" }}>
      <div style={{ width: "60%", height: "100%", background: C.warn, borderRadius: 1 }} />
    </div>
    <div style={{ padding: "8px 12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
      {nowTabs.slice(0, 3).map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: C.bg2, borderRadius: 9, border: `1px solid ${C.border}` }}>
          <Favicon color={t.fc}>{t.fav}</Favicon>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
            <div style={{ fontSize: 9.5, color: C.t4, fontFamily: mono }}>{t.domain} · {t.time}</div>
          </div>
        </div>
      ))}
    </div>
  </PhoneFrame>
);

// ============================================================
// SCREEN 0F: In-Page Snackbar (Phase 2, needs host_permissions)
// ============================================================
const SnackbarPreview = () => (
  <PhoneFrame label="00F · IN-PAGE SNACKBAR (PHASE 2)">
    {/* Simulated browser page content */}
    <div style={{ flex: 1, background: "#f5f5f5", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "10px 12px", background: "#fff", borderBottom: "1px solid #e0e0e0" }}>
        <div style={{ height: 6, width: "60%", background: "#e0e0e0", borderRadius: 3 }} />
        <div style={{ height: 5, width: "40%", background: "#eee", borderRadius: 3, marginTop: 5 }} />
      </div>
      <div style={{ padding: "12px" }}>
        {[100, 80, 90, 70, 85].map((w, i) => (
          <div key={i} style={{ height: 5, width: `${w}%`, background: "#e8e8e8", borderRadius: 3, marginBottom: 6 }} />
        ))}
      </div>

      {/* Snackbar at bottom-right */}
      <div style={{ position: "absolute", bottom: 12, right: 12, left: 12, background: "rgba(26,28,34,0.92)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>✔</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "#fff" }}>3 tabs cleaned</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>Everything is safe in Past</div>
        </div>
        <div style={{ padding: "5px 12px", background: C.accent, borderRadius: 6, fontSize: 10.5, fontWeight: 700, color: "#1A1C22", cursor: "pointer" }}>Undo</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: mono }}>4s</div>
      </div>

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.1)" }}>
        <div style={{ width: "80%", height: "100%", background: C.accent, borderRadius: 1, opacity: 0.6 }} />
      </div>
    </div>
    <div style={{ textAlign: "center", padding: "6px", background: C.bg1, fontSize: 9, color: C.t4 }}>
      Phase 2 · Requires optional host_permissions
    </div>
  </PhoneFrame>
);

// ============================================================
// MAIN APP — Gallery Layout
// ============================================================
export default function TabFlowUI() {
  const [view, setView] = useState("all");

  const screens = [
    { id: "welcome", label: "🆕 Welcome", comp: <WelcomePage />, wide: true },
    { id: "setup", label: "🆕 Quick Setup", comp: <QuickSetup /> },
    { id: "firstopen", label: "🆕 First Open", comp: <FirstOpenPopup /> },
    { id: "trust", label: "🆕 First Clean", comp: <TrustNotification /> },
    { id: "undo", label: "🆕 Undo Close", comp: <UndoBannerScreen /> },
    { id: "snackbar", label: "📌 Snackbar (P2)", comp: <SnackbarPreview /> },
    { id: "popup", label: "Now", comp: <PopupMain /> },
    { id: "soon", label: "Soon", comp: <SoonView /> },
    { id: "grouped", label: "Now (Grouped)", comp: <GroupedView /> },
    { id: "past", label: "Past", comp: <PastScreen /> },
    { id: "pastmany", label: "Past (Many)", comp: <PastMany /> },
    { id: "intent", label: "Intent Rule", comp: <QuickRuleCreator /> },
    { id: "ai", label: "AI Results", comp: <AIResults /> },
    { id: "consent", label: "AI Consent", comp: <ConsentModal /> },
    { id: "rules", label: "Rules (Settings)", comp: <RulesScreen />, wide: true },
    { id: "editor", label: "Rule Editor", comp: <RuleEditor /> },
    { id: "settings", label: "Settings", comp: <SettingsScreen />, wide: true },
    { id: "promo", label: "Store Promo", comp: <StorePromo />, wide: true },
  ];

  const filtered = view === "all" ? screens : screens.filter(s => s.id === view);

  return (
    <div style={{ minHeight: "100vh", background: C.bg0, color: C.t1, fontFamily: sans, WebkitFontSmoothing: "antialiased" }}>
      {/* Blink animation */}
      <style>{`@keyframes tblink{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 20px 20px" }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1.5, background: `linear-gradient(135deg, ${C.accent}, #8BFFC0)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
          TabFlow
        </h1>
        <p style={{ color: C.t3, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 500, marginTop: 4 }}>
          MVP UI Prototype · 18 Screens
        </p>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 36, padding: "0 16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: C.bg2, padding: 3, borderRadius: 12, gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
          {[{ id: "all", label: "All Screens" }, ...screens].map(s => (
            <button
              key={s.id}
              onClick={() => setView(s.id)}
              style={{
                padding: "7px 14px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: sans, fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap",
                background: view === s.id ? C.bg3 : "transparent",
                color: view === s.id ? C.accent : C.t3,
                boxShadow: view === s.id ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                transition: "all .2s",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 60px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 36, justifyContent: "center" }}>
          {filtered.map(s => (
            <div key={s.id} style={{ width: s.wide ? "100%" : "auto", display: "flex", justifyContent: "center" }}>
              {s.comp}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
