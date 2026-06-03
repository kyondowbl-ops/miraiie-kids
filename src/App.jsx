import React from 'react';
import { useState, useMemo, useEffect, useCallback } from "react";
import * as XLSX from "xlsx-js-style";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// Supabase設定
// ============================================================
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || "";
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,        // セッションをlocalStorageに永続保存
        autoRefreshToken: true,      // トークンを自動更新（再ログイン不要）
        detectSessionInUrl: false,
      }
    })
  : null;

// ============================================================
// ログイン画面コンポーネント
// ============================================================
const LoginScreen = ({ onLogin }) => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPw,   setShowPw]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("メールアドレスとパスワードを入力してください"); return; }
    setLoading(true); setError("");
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      onLogin(data.user);
    } catch(e) {
      setError("メールアドレスまたはパスワードが正しくありません");
    } finally {
      setLoading(false);
    }
  };

  const loginStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Noto Sans JP',sans-serif;background:linear-gradient(135deg,#1a3a5c 0%,#2a5070 50%,#1a3a5c 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;}
    .login-wrap{width:100%;max-width:380px;padding:20px;}
    .login-card{background:white;border-radius:20px;padding:32px 28px;box-shadow:0 20px 60px rgba(0,0,0,.3);}
    .login-icon{width:64px;height:64px;background:linear-gradient(135deg,#4a9eed,#1a3a5c);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px;}
    .login-title{font-size:20px;font-weight:700;color:#1a3a5c;text-align:center;margin-bottom:4px;}
    .login-sub{font-size:12px;color:#a0aec0;text-align:center;margin-bottom:28px;}
    .login-field{margin-bottom:16px;}
    .login-label{font-size:11px;font-weight:700;color:#4a5568;margin-bottom:5px;display:block;}
    .login-input{width:100%;border:2px solid #e2e8f0;border-radius:10px;padding:12px 14px;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s;background:#f7fafc;}
    .login-input:focus{border-color:#4a9eed;background:white;}
    .pw-wrap{position:relative;}
    .pw-toggle{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;color:#a0aec0;}
    .login-btn{width:100%;padding:14px;background:linear-gradient(135deg,#4a9eed,#1a3a5c);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:8px;transition:opacity .15s;}
    .login-btn:hover{opacity:.9;}
    .login-btn:disabled{opacity:.6;cursor:not-allowed;}
    .login-error{background:#fff5f5;border:1.5px solid #fed7d7;border-radius:8px;padding:10px 12px;font-size:12px;color:#c53030;margin-top:12px;text-align:center;}
    .login-note{font-size:10px;color:#a0aec0;text-align:center;margin-top:16px;line-height:1.6;}
  `;

  return (
    <>
      <style>{loginStyles}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-icon">🌟</div>
          <div className="login-title">みらいえキッズ</div>
          <div className="login-sub">放課後等デイサービス管理システム</div>

          <div className="login-field">
            <label className="login-label">メールアドレス</label>
            <input className="login-input" type="email" placeholder="staff@miraiie.jp"
              value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>

          <div className="login-field">
            <label className="login-label">パスワード</label>
            <div className="pw-wrap">
              <input className="login-input" type={showPw?"text":"password"} placeholder="••••••••"
                value={password} onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              <button className="pw-toggle" onClick={()=>setShowPw(!showPw)}>{showPw?"🙈":"👁"}</button>
            </div>
          </div>

          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </button>

          {error && <div className="login-error">⚠️ {error}</div>}

          <div className="login-note">
            アカウントの追加・削除は管理者にお問い合わせください
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================
// 認証ラッパーコンポーネント
// ============================================================
const AuthWrapper = ({ children }) => {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // Supabase未設定の場合はオフラインモードで動作
      setUser({ email: "offline@local", id: "offline" });
      setAuthLoading(false);
      return;
    }

    // 既存セッションを確認（ページロード時）
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // 認証状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"linear-gradient(135deg,#1a3a5c,#2a5070)"}}>
        <div style={{color:"white",fontSize:16,fontWeight:700}}>🌟 読み込み中...</div>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={setUser}/>;
  return children;
};

// DB操作ヘルパー
const dbUpsert = async (table, keyField, keyVal, data) => {
  if (!supabase) return;
  try {
    await supabase.from(table).upsert({ [keyField]: keyVal, data, updated_at: new Date().toISOString() }, { onConflict: keyField });
  } catch(e) { console.error("DB upsert error:", e); }
};

const dbLoad = async (table) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw error;
    return data;
  } catch(e) { console.error("DB load error:", e); return null; }
};

// 同期状態表示用
const SyncBadge = ({ syncing, error }) => (
  <span style={{
    fontSize:10, padding:"2px 7px", borderRadius:10, fontWeight:700,
    background: error?"#fed7d7": syncing?"#fefce8":"#c6f6d5",
    color: error?"#c53030": syncing?"#744210":"#276749",
    marginLeft:8
  }}>
    {error?"⚠️ 同期エラー": syncing?"🔄 同期中":"✓ 同期済"}
  </span>
);

// ============================================================
// 初期データ
// ============================================================
const INITIAL_CHILDREN = [
  { id: 1, name: "松原 中井", jukyuNo: "0001000001", kubun: "2", keiyakuDays: 10 },
  { id: 2, name: "植村",      jukyuNo: "0001000002", kubun: "2", keiyakuDays: 10 },
  { id: 3, name: "村上",      jukyuNo: "0001000003", kubun: "2", keiyakuDays: 10 },
  { id: 4, name: "稲本",      jukyuNo: "0001000004", kubun: "2", keiyakuDays: 10 },
  { id: 5, name: "今中",      jukyuNo: "0001000005", kubun: "2", keiyakuDays: 10 },
  { id: 6, name: "八田 車山", jukyuNo: "0001000006", kubun: "2", keiyakuDays: 10 },
  { id: 7, name: "仮屋",      jukyuNo: "0001762095", kubun: "2", keiyakuDays: 10 },
];
const INITIAL_STAFF = [
  { id: 1, name: "恭兵" },
  { id: 2, name: "田中" },
  { id: 3, name: "佐藤" },
];
const INITIAL_CARS = [
  { id: 1, name: "アルファード", color: "#e67e22" },
  { id: 2, name: "ハイエース",   color: "#3182ce" },
  { id: 3, name: "ノア",         color: "#38a169" },
];

const JIGYOSHO    = "みらいえ";
const JIGYOSHO_NO = "2795720184";
const JIGYOSHO_NAME = "みらいえキッズ";
const CAR_COLORS  = ["#e67e22","#3182ce","#38a169","#805ad5","#e53e3e","#d69e2e","#319795"];

const today    = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
const YOUBI    = ["日","月","火","水","木","金","土"];

const getReiwa = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `R${d.getFullYear()-2018}年${d.getMonth()+1}月${d.getDate()}日（${YOUBI[d.getDay()]}）`;
};
const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
const getDow = (y, m, d) => YOUBI[new Date(y, m-1, d).getDay()];
const isWeekend = (y, m, d) => { const w = new Date(y, m-1, d).getDay(); return w===0||w===6; };

const toMins = (t) => { if (!t) return null; const [h,m] = t.split(":").map(Number); return h*60+m; };
const calcSantei = (s, e) => {
  const sm = toMins(s), em = toMins(e);
  if (!sm||!em||em<=sm) return "";
  const mins = em - sm;
  const h = Math.floor(mins/60), m = mins%60;
  return m===0 ? `${h}` : `${h}.${Math.round(m/6)}`;
};
const calcZaitai = (s, e) => {
  const sm = toMins(s), em = toMins(e);
  if (!sm||!em||em<=sm) return "";
  const mins = em - sm;
  return `${Math.floor(mins/60)}:${String(mins%60).padStart(2,"0")}`;
};

// 送迎表：1便のデータ構造
const newStop = (type="child") => ({ id: Date.now()+Math.random(), type, time:"", childId:"", basho:"" });
const newBin  = () => ({ id: Date.now()+Math.random(), carId:"", driverId:"", joshuId:"",
  stops: [{ ...newStop("base"), id: Date.now()+Math.random() }] });

// 送迎表から特定の子の「みらいえ到着時刻（開始）」「みらいえ出発時刻（終了）」を導出
// 迎え便：子のストップより後にある最初のbaseストップの時刻 → 開始時間
// 送り便：子のストップより前にある最後のbaseストップの時刻 → 終了時間
function deriveJisseki(dateStr, childId, schedule) {
  let startTime = null;
  let endTime   = null;
  let driverId  = null;
  let joshuId   = null;
  let soJu = false, soBin = false;

  // 迎え便を検索
  const mukaeBins = schedule[`${dateStr}-mukae`] || [];
  for (const bin of mukaeBins) {
    const idx = bin.stops.findIndex(s => s.type==="child" && String(s.childId)===String(childId));
    if (idx === -1) continue;
    // 子より後のbaseストップを探す
    for (let i = idx+1; i < bin.stops.length; i++) {
      if (bin.stops[i].type === "base" && bin.stops[i].time) {
        startTime = bin.stops[i].time;
        driverId  = bin.driverId;
        joshuId   = bin.joshuId;
        soJu = true; // 迎え = 住
        break;
      }
    }
    if (startTime) break;
  }

  // 送り便を検索
  const okuriBins = schedule[`${dateStr}-okuri`] || [];
  for (const bin of okuriBins) {
    const idx = bin.stops.findIndex(s => s.type==="child" && String(s.childId)===String(childId));
    if (idx === -1) continue;
    // 子より前のbaseストップを探す（最後のもの）
    for (let i = idx-1; i >= 0; i--) {
      if (bin.stops[i].type === "base" && bin.stops[i].time) {
        endTime = bin.stops[i].time;
        if (!driverId) driverId = bin.driverId;
        soBin = true; // 送り = 便
        break;
      }
    }
    if (endTime) break;
  }

  return { startTime, endTime, driverId, joshuId, soJu, soBin };
}

// ============================================================
// スタイル
// ============================================================
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans JP',sans-serif;background:#eef2f7;color:#1a202c;min-height:100vh;}
.app{max-width:100%;padding-bottom:80px;}

.header{background:#1a3a5c;color:white;padding:14px 16px 10px;position:sticky;top:0;z-index:100;box-shadow:0 2px 10px rgba(0,0,0,.2);}
.header-row{display:flex;align-items:center;gap:10px;}
.hicon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.header h1{font-size:15px;font-weight:700;}
.header-sub{font-size:10px;color:#93c5fd;margin-left:42px;margin-top:2px;}

.nav{display:flex;background:#fff;border-bottom:2px solid #e2e8f0;padding:0 8px;overflow-x:auto;}
.nav-tab{padding:10px 12px;font-size:11px;font-weight:500;color:#718096;cursor:pointer;border:none;border-bottom:3px solid transparent;margin-bottom:-2px;white-space:nowrap;background:none;font-family:inherit;transition:color .15s,border-color .15s;}
.nav-tab.active{color:#1a3a5c;font-weight:700;}
.nav-tab.t-sougei.active{border-bottom-color:#e67e22;}
.nav-tab.t-jisseki.active{border-bottom-color:#3182ce;}
.nav-tab.t-master.active{border-bottom-color:#38a169;}
.nav-tab.t-kojin.active{border-bottom-color:#805ad5;}
.nav-tab.t-joko.active{border-bottom-color:#319795;}
.nav-tab.t-gyomu.active{border-bottom-color:#d69e2e;}
.nav-tab.t-saibai.active{border-bottom-color:#2b6cb0;}
.nav-tab.t-dl.active{border-bottom-color:#276749;}
.nav-tab.t-shusseki.active{border-bottom-color:#d69e2e;}

/* 出席予定表 */
.shusseki-ctrl{background:white;border-radius:12px;padding:11px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.shusseki-wrap{overflow-x:auto;margin-bottom:14px;}
.shusseki-table{border-collapse:collapse;font-size:11px;background:white;border:2px solid #333;}
.shusseki-table th{padding:5px 4px;text-align:center;border:1px solid #666;font-weight:700;font-size:10px;white-space:nowrap;}
.shusseki-table th.s-name{background:#c8d8e8;min-width:90px;font-size:10px;border-right:2px solid #555;}
.shusseki-table th.s-sat{background:#b8cce4;color:#1a365d;}
.shusseki-table th.s-sun{background:#e4b8b8;color:#742a2a;}
.shusseki-table th.s-week{background:#d0dce8;}
.shusseki-table td{border:1px solid #aaa;padding:0;height:68px;vertical-align:top;}
.shusseki-table td.s-name-cell{font-size:10px;color:#555;padding:3px 6px;background:#efefef;min-width:90px;border-right:2px solid #666;vertical-align:middle;white-space:nowrap;}
.shusseki-table td.s-sat{background:#eaf3fb;}
.shusseki-table td.s-sun{background:#fbeeee;}
.shusseki-table tr.s-week-sep th,.shusseki-table tr.s-week-sep-data td{border-top:2px solid #333!important;}
.shusseki-table td.s-count{background:#e0e0e0;font-weight:700;font-size:11px;text-align:center;vertical-align:middle;height:24px!important;}
.shusseki-table td.s-name-count{background:#d0d0d0;font-size:10px;padding:3px 6px;font-weight:700;border-right:2px solid #666;}
.s-cell{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;height:68px;cursor:pointer;min-width:72px;padding:3px 2px;}
.s-cell-name{font-size:12px;font-weight:700;color:#1a3a5c;line-height:1.3;text-align:center;padding:2px 0 2px;border-bottom:1px solid #e0e0e0;width:100%;margin-bottom:2px;}
.s-cell-time{font-size:11px;color:#c05621;border:1px solid #fbd38d;border-radius:5px;background:#fffbeb;width:90%;text-align:center;padding:2px;cursor:pointer;font-family:inherit;margin:1px auto;display:block;}
.s-cell-memo{font-size:10px;color:#553c9a;border:none;background:transparent;width:95%;text-align:center;outline:none;font-family:inherit;padding:0;}

.content{padding:12px 12px;}

/* 共通 */
.date-bar{background:white;border-radius:12px;padding:11px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.date-display{font-size:15px;font-weight:700;color:#1a3a5c;}
.date-input{border:1.5px solid #e2e8f0;border-radius:8px;padding:5px 9px;font-size:13px;font-family:inherit;background:#f7fafc;outline:none;cursor:pointer;}
.date-input:focus{border-color:#e67e22;}

/* ============ 送迎表 ============ */
.dir-tabs{display:flex;gap:0;margin-bottom:12px;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.07);}
.dir-tab{flex:1;padding:11px 8px;text-align:center;font-size:12px;font-weight:600;cursor:pointer;border:none;font-family:inherit;background:none;color:#718096;transition:all .15s;border-bottom:3px solid transparent;}
.dir-tab.active.mukae{background:#fff8f0;color:#c05621;border-bottom-color:#e67e22;}
.dir-tab.active.okuri{background:#f0f8ff;color:#2b6cb0;border-bottom-color:#3182ce;}

.bin-card{background:white;border-radius:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden;}
.bin-header{display:flex;flex-direction:column;gap:7px;padding:10px 13px;border-bottom:2px solid #edf2f7;}
.bin-header-top{display:flex;align-items:center;gap:7px;}
.bin-badge{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0;}
.bin-label{font-size:12px;font-weight:700;color:#4a5568;}
.bin-delete{background:#fff5f5;border:1.5px solid #fed7d7;color:#e53e3e;border-radius:6px;padding:3px 9px;font-size:11px;cursor:pointer;font-family:inherit;margin-left:auto;}

.car-select-row{display:flex;gap:5px;flex-wrap:wrap;}
.car-btn{padding:5px 10px;border-radius:7px;border:2px solid #e2e8f0;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;background:#f7fafc;color:#718096;transition:all .15s;}
.car-btn.on{color:white;}

.staff-row{display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
.slabel{font-size:10px;color:#718096;font-weight:600;white-space:nowrap;}
.sselect{border:1.5px solid #e2e8f0;border-radius:7px;padding:4px 7px;font-size:11px;font-family:inherit;background:#f7fafc;outline:none;min-width:80px;cursor:pointer;}
.sselect:focus{border-color:#e67e22;}
.sselect.on{border-color:#e67e22;background:#fff8f0;color:#c05621;font-weight:600;}

.route-list{padding:7px 13px 9px;}
.route-item{display:flex;align-items:flex-start;gap:5px;}
.rc{display:flex;flex-direction:column;align-items:center;width:16px;flex-shrink:0;padding-top:9px;}
.rdot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
.rdot.base{background:#e67e22;border:2px solid #c05621;}
.rdot.child{background:#48bb78;border:2px solid #276749;}
.rdot.blank{background:#e2e8f0;border:2px solid #a0aec0;}
.rline{width:2px;background:#e2e8f0;flex:1;min-height:20px;}
.rcontent{flex:1;padding:3px 0 7px 4px;border-bottom:1px solid #f0f4f8;display:flex;flex-direction:column;gap:5px;}
.rtop{display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
.tinput{border:1.5px solid #e2e8f0;border-radius:6px;padding:3px 5px;font-size:11px;font-family:'DM Mono',monospace;text-align:center;background:#f7fafc;outline:none;width:58px;}
.tinput:focus{border-color:#e67e22;}
.base-lbl{font-size:12px;font-weight:700;color:#c05621;background:#fff3e0;border:1.5px solid #e67e22;border-radius:6px;padding:2px 9px;}
.csel{border:1.5px solid #e2e8f0;border-radius:6px;padding:3px 7px;font-size:11px;font-family:inherit;background:#f7fafc;outline:none;flex:1;min-width:90px;cursor:pointer;}
.csel:focus{border-color:#48bb78;}
.sdel{background:none;border:none;color:#fc8181;cursor:pointer;font-size:15px;padding:0 2px;flex-shrink:0;}
.basho-row{display:flex;gap:5px;}
.basho-btn{flex:1;padding:6px 0;border-radius:7px;border:2px solid #e2e8f0;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;background:#f7fafc;color:#718096;transition:all .15s;text-align:center;}
.basho-btn.school.on{background:#ebf8ff;border-color:#3182ce;color:#2b6cb0;}
.basho-btn.home.on{background:#f0fff4;border-color:#38a169;color:#276749;}

.add-stop-row{display:flex;gap:5px;padding:7px 0 2px;flex-wrap:wrap;}
.add-stop-btn{padding:5px 9px;border-radius:7px;border:1.5px dashed #cbd5e0;background:white;font-size:10px;color:#718096;cursor:pointer;font-family:inherit;transition:all .12s;}
.add-stop-btn:hover{border-color:#48bb78;color:#276749;}
.add-bin-btn{display:flex;align-items:center;gap:5px;width:100%;padding:12px;border-radius:12px;border:2px dashed #cbd5e0;background:white;font-size:12px;font-weight:600;color:#718096;cursor:pointer;font-family:inherit;justify-content:center;transition:all .15s;margin-bottom:12px;}
.add-bin-btn:hover{border-color:#e67e22;color:#c05621;}

/* 車種別 */
.car-sec{background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:12px;}
.car-sec-hd{display:flex;align-items:center;gap:7px;padding:9px 13px;color:white;}
.ctable{width:100%;border-collapse:collapse;font-size:11px;}
.ctable th{background:rgba(0,0,0,.12);color:white;padding:5px 7px;text-align:center;font-size:10px;}
.ctable td{border-bottom:1px solid #edf2f7;padding:6px 7px;text-align:center;vertical-align:middle;}
.ctable tr:last-child td{border-bottom:none;}

/* ============ 実績記録 ============ */
.month-sel{background:white;border-radius:12px;padding:11px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.msel{border:1.5px solid #e2e8f0;border-radius:7px;padding:5px 8px;font-size:13px;font-family:inherit;background:#f7fafc;outline:none;cursor:pointer;}
.msel:focus{border-color:#3182ce;}
.child-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;}
.chip{padding:6px 12px;border-radius:16px;border:2px solid #e2e8f0;background:white;font-size:12px;cursor:pointer;font-family:inherit;color:#4a5568;transition:all .15s;}
.chip.on{background:#1a3a5c;border-color:#1a3a5c;color:white;font-weight:700;}

.info-card{background:white;border-radius:12px;padding:11px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);}
.info-title{font-size:12px;font-weight:700;color:#1a3a5c;text-align:center;border-bottom:2px solid #1a3a5c;padding-bottom:5px;margin-bottom:8px;}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;}
.info-row{display:flex;align-items:center;gap:4px;}
.ilabel{font-size:10px;color:#718096;white-space:nowrap;min-width:90px;}
.ivalue{font-size:11px;font-weight:600;}

.sum-bar{display:flex;background:white;border-radius:12px;overflow:hidden;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);}
.sum-item{flex:1;display:flex;flex-direction:column;align-items:center;padding:9px 4px;border-right:1px solid #edf2f7;}
.sum-item:last-child{border-right:none;}
.sum-val{font-size:19px;font-weight:700;font-family:'DM Mono',monospace;color:#1a3a5c;}
.sum-lbl{font-size:9px;color:#718096;margin-top:1px;text-align:center;}

.linked-badge{background:#ebf8ff;color:#2b6cb0;border-radius:4px;padding:1px 5px;font-size:9px;font-weight:700;margin-left:3px;}
.manual-badge{background:#fefce8;color:#92400e;border-radius:4px;padding:1px 5px;font-size:9px;font-weight:700;margin-left:3px;}

.tbl-wrap{overflow-x:auto;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.07);margin-bottom:12px;}
.jtable{border-collapse:collapse;font-size:11px;background:white;min-width:800px;width:100%;}
.jtable th{background:#1a3a5c;color:white;padding:7px 5px;text-align:center;font-weight:600;font-size:10px;border:1px solid #2a4a6c;}
.jtable th.sub{background:#2a5070;font-size:9px;}
.jtable td{border:1px solid #e2e8f0;padding:3px 3px;vertical-align:middle;text-align:center;}
.jtable tr.wkend td{background:#fef9f0;}
.jtable tr.hasdata td{background:#f0f8ff;}
.jtable tr.hasdata.wkend td{background:#fff3e8;}
.jtable tr.absent td{background:#fff5f5;}
.jtable tr:hover td{background:#f0f4f8!important;}
.dnum{font-family:'DM Mono',monospace;font-size:12px;font-weight:600;}
.dnum.sun{color:#e53e3e;}.dnum.sat{color:#3182ce;}
.dow{font-size:10px;font-weight:600;}
.dow.sun{color:#e53e3e;}.dow.sat{color:#3182ce;}

.tog{width:22px;height:22px;border-radius:50%;border:2px solid #e2e8f0;background:white;cursor:pointer;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;}
.tog.present{background:#38a169;border-color:#38a169;color:white;}
.tog.absent{background:#fc8181;border-color:#fc8181;color:white;}

.ti{border:1px solid #e2e8f0;border-radius:4px;padding:2px 3px;font-size:10px;font-family:'DM Mono',monospace;text-align:center;background:transparent;outline:none;width:54px;}
.ti:focus{border-color:#3182ce;background:white;}
.ti.linked{background:#ebf8ff;border-color:#bee3f8;color:#2b6cb0;}
.ti:disabled{background:transparent;border-color:transparent;color:#a0aec0;}

.cv{font-family:'DM Mono',monospace;font-size:10px;color:#2b6cb0;font-weight:600;}
.msel2{border:1px solid #e2e8f0;border-radius:4px;padding:2px 3px;font-size:10px;font-family:inherit;background:transparent;outline:none;max-width:34px;cursor:pointer;}
.chkbox{width:18px;height:18px;border:1.5px solid #cbd5e0;border-radius:3px;background:white;cursor:pointer;font-size:9px;display:inline-flex;align-items:center;justify-content:center;transition:all .12s;}
.chkbox.on{background:#3182ce;border-color:#3182ce;color:white;}
.sign-area{min-width:40px;height:24px;border:1px dashed #cbd5e0;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:9px;color:#a0aec0;}
.sign-area.signed{border:1px solid #c6f6d5;background:#f0fff4;}
.note-inp{border:1px solid #e2e8f0;border-radius:4px;padding:2px 4px;font-size:10px;font-family:inherit;background:transparent;outline:none;width:66px;}
.note-inp:focus{border-color:#3182ce;background:white;}
.tot-row td{background:#f0f4f8!important;font-weight:700;font-size:10px;border-top:2px solid #1a3a5c;}

/* 個人記録 */
.kojin-month-sel{background:white;border-radius:12px;padding:11px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.kojin-child-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;}
.kojin-header{background:white;border-radius:12px;padding:11px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);}
.kojin-header-title{font-size:13px;font-weight:700;color:#1a3a5c;text-align:center;border-bottom:2px solid #805ad5;padding-bottom:6px;margin-bottom:8px;}
.kojin-list{display:flex;flex-direction:column;gap:10px;margin-bottom:16px;}
.kojin-card{background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden;}
.kojin-card-header{display:flex;align-items:center;gap:8px;padding:9px 13px;background:#f8f5ff;border-bottom:1px solid #e9d8fd;cursor:pointer;}
.kojin-card-date{font-size:14px;font-weight:700;color:#553c9a;font-family:'DM Mono',monospace;min-width:55px;}
.kojin-card-dow{font-size:12px;font-weight:700;padding:2px 7px;border-radius:10px;background:#805ad5;color:white;}
.kojin-card-dow.sun{background:#e53e3e;}.kojin-card-dow.sat{background:#3182ce;}
.kojin-card-time{font-size:11px;color:#718096;font-family:'DM Mono',monospace;margin-left:4px;}
.kojin-card-preview{font-size:11px;color:#805ad5;margin-left:auto;font-weight:600;}
.kojin-card-arrow{font-size:12px;color:#a0aec0;margin-left:4px;}
.kojin-body{padding:12px 13px;display:flex;flex-direction:column;gap:10px;}
.kojin-row{display:flex;flex-direction:column;gap:4px;}
.kojin-row-label{font-size:10px;font-weight:700;color:#553c9a;display:flex;align-items:center;gap:4px;}
.kojin-tag-wrap{display:flex;gap:5px;flex-wrap:wrap;}
.kjbtn{padding:5px 10px;border-radius:7px;border:2px solid #e9d8fd;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;background:#faf5ff;color:#553c9a;transition:all .15s;}
.kjbtn.on{background:#805ad5;border-color:#805ad5;color:white;}
.kojin-memo{border:1.5px solid #e9d8fd;border-radius:8px;padding:7px 10px;font-size:12px;font-family:inherit;background:#faf5ff;outline:none;width:100%;resize:none;min-height:56px;}
.kojin-memo:focus{border-color:#805ad5;}
.kojin-save-btn{background:#805ad5;color:white;border:none;border-radius:8px;padding:8px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;align-self:flex-end;}
.kojin-empty{text-align:center;padding:32px 20px;color:#a0aec0;font-size:13px;}
.kojin-complete-badge{background:#c6f6d5;color:#276749;border-radius:5px;padding:2px 7px;font-size:10px;font-weight:700;}

/* 日付一覧カード */
.kojin-day-card{background:white;border-radius:12px;padding:11px 13px;display:flex;align-items:center;gap:10px;box-shadow:0 1px 4px rgba(0,0,0,.07);cursor:pointer;transition:all .15s;margin-bottom:8px;}
.kojin-day-card:hover{box-shadow:0 3px 10px rgba(0,0,0,.12);transform:translateY(-1px);}
.kojin-day-left{display:flex;align-items:center;gap:6px;min-width:80px;}
.kojin-day-center{flex:1;display:flex;gap:5px;flex-wrap:wrap;}
.kojin-day-right{display:flex;align-items:center;min-width:50px;justify-content:flex-end;}
.kojin-child-pill{padding:3px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#f0e6ff;color:#553c9a;border:1.5px solid #d6bcfa;}
.kojin-child-pill.done{background:#c6f6d5;color:#276749;border-color:#9ae6b4;}

/* 日別入力ヘッダー */
.kojin-day-header{background:white;border-radius:12px;padding:11px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.kojin-back-btn{background:#f0e6ff;color:#553c9a;border:1.5px solid #d6bcfa;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
.kojin-day-title{display:flex;align-items:center;flex-wrap:wrap;gap:4px;}
.kojin-child-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#9f7aea,#553c9a);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:700;flex-shrink:0;}

/* 個人記録 追加スタイル */
.kojin-top-bar{background:white;border-radius:12px;padding:12px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);}
.kojin-progress{display:inline-block;width:60px;height:8px;background:#e9d8fd;border-radius:4px;overflow:hidden;vertical-align:middle;}
.kojin-progress-bar{display:block;height:100%;background:#805ad5;border-radius:4px;transition:width .3s;}
.kojin-mode-btn{padding:7px 14px;border-radius:8px;border:2px solid #e9d8fd;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;background:#faf5ff;color:#553c9a;transition:all .15s;}
.kojin-mode-btn.active{background:#805ad5;border-color:#805ad5;color:white;}

.kojin-name-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;}
.kojin-name-tab{padding:7px 13px;border-radius:20px;border:2px solid #e9d8fd;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;background:#faf5ff;color:#553c9a;transition:all .15s;position:relative;}
.kojin-name-tab.active{background:#805ad5;border-color:#805ad5;color:white;}
.kojin-name-tab.done{border-color:#9ae6b4;background:#f0fff4;color:#276749;}
.kojin-name-tab.active.done{background:#38a169;border-color:#38a169;color:white;}

.kojin-form-card{background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden;margin-bottom:12px;}
.kojin-form-header{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f8f5ff;border-bottom:2px solid #e9d8fd;}
.kojin-form-row{padding:10px 14px;border-bottom:1px solid #f3eeff;}
.kojin-form-row:last-of-type{border-bottom:none;}
.kojin-form-label{display:flex;align-items:baseline;gap:6px;margin-bottom:6px;}
.kojin-form-label-main{font-size:12px;font-weight:700;color:#553c9a;}
.kojin-form-label-sub{font-size:10px;color:#a0aec0;}

/* まとめカード */
.kojin-summary-card{background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.07);overflow:hidden;}
.kojin-summary-header{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#f8f5ff;border-bottom:1px solid #e9d8fd;flex-wrap:wrap;}
.kojin-edit-btn{margin-left:auto;background:#e9d8fd;color:#553c9a;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;}
.kojin-summary-body{padding:8px 14px;display:flex;flex-direction:column;gap:0;}
.kojin-summary-row{display:flex;gap:8px;padding:5px 0;border-bottom:1px solid #f8f5ff;align-items:flex-start;}
.kojin-summary-row:last-child{border-bottom:none;}
.kojin-summary-label{font-size:10px;font-weight:700;color:#805ad5;white-space:nowrap;min-width:70px;padding-top:1px;}
.kojin-summary-val{font-size:12px;color:#2d3748;line-height:1.5;}

/* 書類形式テーブル */
.kojin-doc-wrap{background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:14px;}
.kojin-doc-title{background:#553c9a;color:white;padding:10px 14px;font-size:13px;font-weight:700;display:flex;align-items:center;}
.kojin-row-header{display:flex;background:#f0e6ff;border-bottom:2px solid #d6bcfa;font-size:10px;font-weight:700;color:#553c9a;}
.kojin-col-name{width:90px;flex-shrink:0;padding:8px 8px;border-right:1px solid #e9d8fd;display:flex;flex-direction:column;align-items:center;text-align:center;}
.kojin-col-yousu{flex:3;padding:8px 8px;border-right:1px solid #e9d8fd;}
.kojin-col-renraku{flex:2;padding:8px 8px;border-right:1px solid #e9d8fd;}
.kojin-col-other{width:50px;flex-shrink:0;padding:8px 6px;text-align:center;font-size:10px;font-weight:700;color:#553c9a;}

.kojin-doc-row{border-bottom:1px solid #f0e6ff;}
.kojin-doc-row:last-child{border-bottom:none;}
.kojin-doc-row.done .kojin-doc-row-top{background:#f8fff8;}
.kojin-doc-row.open .kojin-doc-row-top{background:#f8f5ff;}
.kojin-doc-row-top{display:flex;cursor:pointer;transition:background .15s;}
.kojin-doc-row-top:hover{background:#faf5ff;}
.kojin-preview{font-size:11px;color:#4a5568;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}

.kojin-doc-form{border-top:2px solid #e9d8fd;background:#faf5ff;padding:4px 0 0;}
.kojin-form-section{padding:10px 14px;border-bottom:1px solid #f0e6ff;}
.kojin-form-section:last-of-type{border-bottom:none;}
.kojin-form-sec-label{font-size:11px;font-weight:700;color:#553c9a;margin-bottom:6px;}

/* 出来事タイムライン */
.kojin-add-event-btn{margin-left:auto;background:#805ad5;color:white;border:none;border-radius:7px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;}
.kojin-add-event-btn-large{width:100%;padding:10px;border-radius:10px;border:2px dashed #d6bcfa;background:#faf5ff;color:#805ad5;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-align:center;transition:all .15s;}
.kojin-add-event-btn-large:hover{background:#f0e6ff;border-color:#805ad5;}
.kojin-step-card{background:white;border-radius:12px;padding:12px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);}
.kojin-step-label{font-size:10px;font-weight:700;color:#805ad5;margin-bottom:8px;letter-spacing:.05em;}
.kojin-timeline{display:flex;flex-direction:column;gap:0;}
.kojin-event-row{display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px dashed #e9d8fd;}
.kojin-event-row:last-child{border-bottom:none;}
.kojin-event-dot{width:10px;height:10px;border-radius:50%;background:#805ad5;flex-shrink:0;margin-top:10px;}
.kojin-event-body{flex:1;}
.kojin-event-cat{border:1.5px solid #e9d8fd;border-radius:7px;padding:4px 7px;font-size:11px;font-family:inherit;background:#faf5ff;outline:none;flex:1;cursor:pointer;}
.kojin-event-cat:focus{border-color:#805ad5;}
.kojin-event-summary-item{display:flex;gap:6px;align-items:flex-start;flex-wrap:wrap;padding:2px 0;}
.kojin-event-time{font-size:11px;font-family:'DM Mono',monospace;color:#805ad5;font-weight:700;white-space:nowrap;}
.kojin-event-cat-badge{background:#f0e6ff;color:#553c9a;border-radius:5px;padding:1px 7px;font-size:10px;font-weight:700;white-space:nowrap;}

/* シート形式（書類の形） */
.kojin-sheet-card{background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden;margin-bottom:16px;}
.kojin-sheet-header{display:flex;align-items:center;background:#1a3a5c;color:white;font-size:11px;font-weight:700;padding:7px 0;}
.kojin-sheet-col-name{width:90px;padding:0 8px;flex-shrink:0;border-right:1px solid rgba(255,255,255,.2);}
.kojin-sheet-col-main{flex:2;padding:0 8px;border-right:1px solid rgba(255,255,255,.2);}
.kojin-sheet-col-renraku{flex:2;padding:0 8px;border-right:1px solid rgba(255,255,255,.2);}
.kojin-sheet-col-other{flex:1;padding:0 8px;}

.kojin-sheet-row{border-bottom:1px solid #f0f0f0;}
.kojin-sheet-row:last-child{border-bottom:none;}
.kojin-sheet-row.filled{background:#fafafa;}
.kojin-sheet-row-preview{display:flex;align-items:center;padding:7px 0;cursor:pointer;min-height:44px;transition:background .12s;}
.kojin-sheet-row-preview:hover{background:#faf5ff;}
.kojin-sheet-row-preview .kojin-sheet-col-name{display:flex;align-items:center;gap:5px;width:90px;padding:0 8px;flex-shrink:0;}
.kojin-sheet-row-preview .kojin-sheet-col-main{flex:2;padding:0 8px;}
.kojin-sheet-row-preview .kojin-sheet-col-renraku{flex:2;padding:0 8px;}
.kojin-sheet-row-preview .kojin-sheet-col-other{flex:1;padding:0 8px;}
.kojin-preview-text{font-size:11px;color:#2d3748;line-height:1.4;}
.kojin-placeholder{font-size:10px;color:#cbd5e0;}

.kojin-sheet-form{background:#f8f5ff;border-top:1px solid #e9d8fd;padding:12px 14px;}
.kojin-sheet-form-inner{display:flex;flex-direction:column;gap:10px;}
.kojin-field{display:flex;flex-direction:column;gap:4px;}
.kojin-field-label{font-size:11px;font-weight:700;color:#553c9a;}
.kojin-textarea{border:1.5px solid #e9d8fd;border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit;background:white;outline:none;resize:vertical;line-height:1.6;}
.kojin-textarea:focus{border-color:#805ad5;}

/* 乗降記録 */
.joko-date-bar{background:white;border-radius:12px;padding:11px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.joko-section{background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:14px;}
.joko-section-hd{display:flex;align-items:center;gap:8px;padding:10px 14px;color:white;}
.joko-section-title{font-size:13px;font-weight:700;}
.joko-table{width:100%;border-collapse:collapse;font-size:11px;}
.joko-table th{background:rgba(0,0,0,.15);color:white;padding:7px 6px;text-align:center;font-size:10px;font-weight:700;}
.joko-table td{border-bottom:1px solid #edf2f7;padding:6px 5px;text-align:center;vertical-align:middle;background:white;}
.joko-table tr:last-child td{border-bottom:none;}
.joko-time-inp{border:1px solid #e2e8f0;border-radius:5px;padding:3px 4px;font-size:10px;font-family:'DM Mono',monospace;text-align:center;background:#f7fafc;outline:none;width:58px;}
.joko-time-inp:focus{border-color:#319795;background:white;}
.joko-time-inp.linked{background:#e6fffa;border-color:#81e6d9;color:#234e52;}
.joko-basho{font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;}
.joko-basho.mirai{background:#fff3e0;color:#c05621;}
.joko-basho.gakko{background:#ebf8ff;color:#2b6cb0;}
.joko-basho.jitaku{background:#f0fff4;color:#276749;}
.joko-sign{min-width:40px;height:24px;border:1px dashed #cbd5e0;border-radius:5px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:10px;color:#a0aec0;margin:auto;}
.joko-sign.signed{border:1px solid #c6f6d5;background:#f0fff4;font-size:16px;}
.joko-dir-badge{border-radius:4px;padding:2px 6px;font-size:9px;font-weight:700;}
.joko-dir-badge.mukae{background:#fff3e0;color:#c05621;}
.joko-dir-badge.okuri{background:#ebf8ff;color:#2b6cb0;}
.joko-empty{padding:30px;text-align:center;color:#a0aec0;font-size:12px;}

/* 業務日誌 */
.gyomu-date-bar{background:white;border-radius:12px;padding:11px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.gyomu-doc{background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:14px;}
.gyomu-doc-title{background:#744210;color:white;padding:10px 16px;display:flex;align-items:center;gap:10px;}
.gyomu-doc-title-main{font-size:14px;font-weight:700;}
.gyomu-doc-title-sub{font-size:11px;opacity:.8;margin-left:auto;}
.gyomu-section{padding:12px 14px;border-bottom:1px solid #fef3c7;}
.gyomu-section:last-child{border-bottom:none;}
.gyomu-sec-label{font-size:11px;font-weight:700;color:#744210;margin-bottom:7px;display:flex;align-items:center;gap:5px;}
.gyomu-tag-wrap{display:flex;gap:5px;flex-wrap:wrap;}
.gybtn{padding:5px 10px;border-radius:7px;border:1.5px solid #fde68a;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;background:#fefce8;color:#744210;transition:all .15s;}
.gybtn.on{background:#d69e2e;border-color:#d69e2e;color:white;}
.gyomu-staff-row{display:flex;gap:6px;flex-wrap:wrap;}
.gyomu-staff-btn{padding:6px 12px;border-radius:16px;border:1.5px solid #e2e8f0;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;background:#f7fafc;color:#4a5568;transition:all .15s;}
.gyomu-staff-btn.on{background:#1a3a5c;border-color:#1a3a5c;color:white;}
.gyomu-child-list{display:flex;gap:6px;flex-wrap:wrap;}
.gyomu-child-chip{padding:4px 10px;border-radius:10px;background:#fffbeb;border:1px solid #fde68a;font-size:11px;color:#744210;font-weight:600;}
.gyomu-memo{border:1.5px solid #fde68a;border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;background:#fffbeb;outline:none;width:100%;resize:none;}
.gyomu-memo:focus{border-color:#d69e2e;}
.gyomu-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.gyomu-field{display:flex;flex-direction:column;gap:5px;}
.gyomu-field label{font-size:10px;font-weight:700;color:#744210;}
.gyomu-input{border:1.5px solid #fde68a;border-radius:7px;padding:6px 9px;font-size:12px;font-family:inherit;background:#fffbeb;outline:none;}
.gyomu-input:focus{border-color:#d69e2e;}

/* 采配簿 */
.saibai-ctrl{background:white;border-radius:12px;padding:11px 14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.saibai-view-btn{padding:7px 14px;border-radius:8px;border:2px solid #bee3f8;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;background:#ebf8ff;color:#2b6cb0;transition:all .15s;}
.saibai-view-btn.active{background:#2b6cb0;border-color:#2b6cb0;color:white;}
.saibai-wrap{overflow-x:auto;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:14px;}
.saibai-table{border-collapse:collapse;font-size:11px;background:white;min-width:600px;}
.saibai-table th{background:#1a3a5c;color:white;padding:7px 5px;text-align:center;font-size:10px;font-weight:700;border:1px solid #2a4a6c;white-space:nowrap;}
.saibai-table th.drive{background:#2b6cb0;}
.saibai-table th.fac{background:#276749;}
.saibai-table th.total{background:#553c9a;}
.saibai-table td{border:1px solid #e2e8f0;padding:5px 4px;text-align:center;vertical-align:middle;font-size:11px;}
.saibai-table tr.weekend td{background:#fef9f0;}
.saibai-table tr.today td{background:#ebf8ff;}
.saibai-table tr.total-row td{background:#f0f4f8;font-weight:700;border-top:2px solid #1a3a5c;}
.drive-val{color:#2b6cb0;font-weight:600;font-family:'DM Mono',monospace;}
.fac-val{color:#276749;font-weight:600;font-family:'DM Mono',monospace;}
.total-val{color:#553c9a;font-weight:700;font-family:'DM Mono',monospace;}
.saibai-staff-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;}
.saibai-staff-tab{padding:7px 13px;border-radius:16px;border:2px solid #bee3f8;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;background:#ebf8ff;color:#2b6cb0;transition:all .15s;}
.saibai-staff-tab.active{background:#2b6cb0;border-color:#2b6cb0;color:white;}
.saibai-legend{display:flex;gap:12px;font-size:10px;margin-bottom:10px;flex-wrap:wrap;}
.legend-item{display:flex;align-items:center;gap:4px;}
.legend-dot{width:10px;height:10px;border-radius:3px;}

/* 名簿管理 */
.sec-title{font-size:12px;font-weight:700;color:#1a3a5c;margin-bottom:9px;padding-bottom:5px;border-bottom:2px solid #e2e8f0;}
.mcard{background:white;border-radius:11px;padding:10px 13px;display:flex;align-items:center;gap:9px;box-shadow:0 1px 4px rgba(0,0,0,.07);margin-bottom:7px;}
.mavatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;flex-shrink:0;}
.cicon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
.minfo{flex:1;}
.mname{font-size:12px;font-weight:700;}
.mmeta{font-size:10px;color:#a0aec0;margin-top:1px;}
.btn{padding:6px 11px;border-radius:7px;border:none;font-size:11px;font-weight:600;font-family:inherit;cursor:pointer;}
.btn-d{background:#fff5f5;color:#e53e3e;border:1.5px solid #fed7d7;}
.btn-p{background:#1a3a5c;color:white;}
.add-form{background:white;border-radius:11px;padding:12px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;flex-wrap:wrap;gap:7px;align-items:flex-end;}
.fg{display:flex;flex-direction:column;gap:3px;flex:1;min-width:110px;}
.fg label{font-size:10px;color:#718096;font-weight:600;}
.fg input,.fg select{border:1.5px solid #e2e8f0;border-radius:7px;padding:6px 9px;font-size:12px;font-family:inherit;background:#f7fafc;outline:none;}
.fg input:focus,.fg select:focus{border-color:#e67e22;}

.tag-mukae{background:#fff3e0;color:#c05621;border-radius:4px;padding:1px 5px;font-size:9px;font-weight:700;}
.tag-okuri{background:#ebf8ff;color:#2b6cb0;border-radius:4px;padding:1px 5px;font-size:9px;font-weight:700;}
.tag-school{background:#ebf8ff;color:#2b6cb0;border-radius:4px;padding:1px 5px;font-size:10px;font-weight:700;}
.tag-home{background:#f0fff4;color:#276749;border-radius:4px;padding:1px 5px;font-size:10px;font-weight:700;}
.ttime{font-family:'DM Mono',monospace;font-size:11px;font-weight:600;}
.nodata{padding:20px;color:#a0aec0;font-size:12px;text-align:center;}

/* Excel出力ボタン */
.excel-btn{background:#1d6f42;color:white;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;transition:all .15s;}
.excel-btn:hover{background:#155a34;}

/* ダウンロードページ */
.dl-page{display:flex;flex-direction:column;gap:14px;}
.dl-card{background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);}
.dl-card-header{padding:12px 16px;display:flex;align-items:center;gap:10px;}
.dl-card-icon{font-size:22px;}
.dl-card-title{font-size:14px;font-weight:700;color:white;}
.dl-card-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
.dl-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.dl-label{font-size:12px;color:#4a5568;font-weight:600;min-width:80px;}
.dl-select{border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit;background:#f7fafc;outline:none;cursor:pointer;}
.dl-select:focus{border-color:#276749;}
.dl-btn-xlsx{background:#1d6f42;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;transition:all .15s;}
.dl-btn-xlsx:hover{background:#155a34;}
.dl-btn-csv{background:#0d6efd;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;transition:all .15s;}
.dl-btn-csv:hover{background:#0b5ed7;}
.dl-divider{height:1px;background:#edf2f7;margin:2px 0;}
.dl-btn-pdf{background:#c53030;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;transition:all .15s;}
.dl-btn-pdf:hover{background:#9b2c2c;}
`;

// ============================================================
// メインコンポーネント
// ============================================================
// ============================================================
// エントリーポイント（認証ラッパー付き）
// ============================================================
const AppWithAuth = () => (
  <AuthWrapper>
    <App/>
  </AuthWrapper>
);

export default AppWithAuth;


function TimeWheelTrigger({ value, onChange }) {
  return (
    <input className="tinput" type="time" step="300"
      value={value||''} onChange={e=>onChange(e.target.value)}
      style={{minWidth:60,textAlign:'center',cursor:'pointer'}}/>
  );
}

function App() {
  const [tab, setTab]         = useState("sougei");
  const [children, setChildren] = useState([]);
  const [staff, setStaff]     = useState(INITIAL_STAFF);
  const [cars, setCars]       = useState(INITIAL_CARS);
  const [schedule, setSchedule] = useState({});       // 送迎表データ
  const [overrides, setOverrides] = useState({});     // 実績上書きデータ

  // 送迎表用
  const [sDate, setSDate]     = useState(todayStr);
  const [dir, setDir]         = useState("mukae");

  // 実績記録用
  const [jYear, setJYear]     = useState(today.getFullYear());
  const [jMonth, setJMonth]   = useState(today.getMonth()+1);
  const [jChildId, setJChildId] = useState(1);

  // 個人記録用
  const [kYear, setKYear]     = useState(today.getFullYear());
  const [kMonth, setKMonth]   = useState(today.getMonth()+1);
  const [kChildId, setKChildId] = useState(1);
  const [kojinRecords, setKojinRecords] = useState({});
  const [editDay, setEditDay] = useState(null); // 編集中の日

  // 個人記録 helpers
  const getKR = (childId, y, m, d) => {
    const key = `${childId}-${y}-${m}-${d}`;
    return kojinRecords[key] || {};
  };
  const setKR = (childId, y, m, d, field, val) => {
    const key = `${childId}-${y}-${m}-${d}`;
    const newData = { ...(kojinRecords[key]||{}), [field]: val };
    setKojinRecords(p => ({ ...p, [key]: newData }));
    if (supabase) {
      setSyncing(true);
      dbUpsert("kojin_records", "record_key", key, newData)
        .catch(()=>setSyncError(true))
        .finally(()=>setSyncing(false));
    }
  };
  const setKRMulti = (childId, y, m, d, obj) => {
    const key = `${childId}-${y}-${m}-${d}`;
    setKojinRecords(p => ({ ...p, [key]: { ...p[key], ...obj } }));
  };

  // 采配簿用
  const [saibaiYear,  setSaibaiYear]  = useState(today.getFullYear());
  const [saibaiMonth, setSaibaiMonth] = useState(today.getMonth()+1);
  const [saibaiStaffId, setSaibaiStaffId] = useState(null);
  const [saibaiView, setSaibaiView] = useState("monthly"); // "monthly" | "staff"

  // 送迎表からスタッフの運転時間を計算（1日）
  const getDriverMins = (staffId, dateStr) => {
    let mins = 0;
    ["mukae","okuri"].forEach(dir => {
      (schedule[`${dateStr}-${dir}`]||[]).forEach(bin => {
        if (Number(bin.driverId)!==staffId && Number(bin.joshuId)!==staffId) return;
        // 最初のbaseから最後のbaseまでの時間
        const bases = bin.stops.filter(s=>s.type==="base"&&s.time);
        if (bases.length < 2) return;
        const sm = toMins(bases[0].time);
        const em = toMins(bases[bases.length-1].time);
        if (sm && em && em > sm) mins += em - sm;
      });
    });
    return mins;
  };

  // 実績記録からスタッフの施設対応時間を計算（1日：その日出勤の全利用者の提供時間の最大幅）
  const getFacilityMins = (dateStr) => {
    const [y,m,d] = dateStr.split("-").map(Number);
    let minStart = null, maxEnd = null;
    children.forEach(child => {
      const linked = deriveJisseki(dateStr, child.id, schedule);
      const ov     = overrides[`${child.id}-${y}-${m}-${d}`] || {};
      const hasLinked = linked.startTime || linked.endTime;
      const attend = ov.attend !== undefined ? ov.attend : (hasLinked ? "present" : "");
      if (attend !== "present") return;
      const s = toMins(ov.timeStart || linked.startTime || "");
      const e = toMins(ov.timeEnd   || linked.endTime   || "");
      if (s && (minStart===null || s < minStart)) minStart = s;
      if (e && (maxEnd  ===null || e > maxEnd))   maxEnd   = e;
    });
    if (minStart===null || maxEnd===null) return 0;
    return Math.max(0, maxEnd - minStart);
  };

  const minsToHHMM = (m) => {
    if (!m) return "0:00";
    return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;
  };

  // 出席予定表用
  const [shussekiYear,  setShussekiYear]  = useState(today.getFullYear());
  const [shussekiActivePopup, setShussekiActivePopup] = useState(null);
  const [shussekiMonth, setShussekiMonth] = useState(today.getMonth()+1);
  const [shussekiData,  setShussekiData]  = useState({});

  const setSD = (key, val) => {
    setShussekiData(p => {
      const next = { ...p, [key]: val };
      if (supabase) {
        // キーから年月を抽出して月単位で保存 (key形式: "YYYY-M-d-slot-type")
        const parts = key.split("-");
        const dataKey = `shusseki-${parts[0]}-${parts[1]}`;
        const monthPrefix = `${parts[0]}-${parts[1]}-`;
        const monthData = Object.fromEntries(
          Object.entries(next).filter(([k]) => k.startsWith(monthPrefix))
        );
        setSyncing(true);
        dbUpsert("shusseki_data", "data_key", dataKey, monthData)
          .catch(() => setSyncError(true))
          .finally(() => setSyncing(false));
      }
      return next;
    });
  };
  const getSD = (d, slot, type) => shussekiData[`${shussekiYear}-${shussekiMonth}-${d}-${slot}-${type}`] || "";

  const getShussekiWeeks = (y, m) => {
    const days = getDaysInMonth(y, m);
    const weeks = [];
    let week = [];
    for (let d = 1; d <= days; d++) {
      const dow = new Date(y, m-1, d).getDay();
      week.push({d, dow});
      if (dow === 0 || d === days) { weeks.push([...week]); week = []; }
    }
    if (week.length) weeks.push(week);
    return weeks;
  };

  const SHUSSEKI_TIMES = ["", ...Array.from({length:121},(_,i)=>{
    const h = Math.floor(i/12)+9;
    const m = (i%12)*5;
    return h<=19?`${h}:${String(m).padStart(2,"0")}`:null;
  }).filter(Boolean)];

  const NUM_SLOTS = 13;

  // 出席予定表 Excel出力
  const exportShussekiXLSX = (year, month) => {
    const wb = XLSX.utils.book_new();
    const weeks = getShussekiWeeks(year, month);
    weeks.forEach((week, wi) => {
      const COLS = week.length + 1;
      const ws = {};
      const R = (r,c) => XLSX.utils.encode_cell({r,c});
      let row = 0;
      // タイトル
      ws[R(row,0)] = xlCell(`令和${year-2018}年${month}月　出席予定　${week[0].d}日〜${week[week.length-1].d}日`,{bold:true,sz:11,fill:"1a3a5c",color:"FFFFFF",align:"left"});
      for(let c=1;c<COLS;c++) ws[R(row,c)]=xlCell("",{fill:"1a3a5c",color:"FFFFFF"});
      row++;
      // ヘッダー
      ws[R(row,0)] = xlHdr("出席児童名");
      week.forEach(({d,dow},ci) => {
        const dowStr = ["日","月","火","水","木","金","土"][dow];
        const fill = dow===6?"2b5797":dow===0?"8B0000":"1a3a5c";
        ws[R(row,ci+1)] = xlCell(`${d}
${dowStr}`,{bold:true,fill,color:"FFFFFF"});
      });
      row++;
      // データ行
      for(let slot=0;slot<NUM_SLOTS;slot++){
        ws[R(row,0)] = xlCell(`出席児童名 ${slot+1}`,{align:"left",fill:"f0f0f0"});
        week.forEach(({d},ci) => {
          const name = shussekiData[`${year}-${month}-${d}-${slot}-name`]||"";
          const time = shussekiData[`${year}-${month}-${d}-${slot}-time`]||"";
          const memo = shussekiData[`${year}-${month}-${d}-${slot}-memo`]||"";
          const val = name ? `${name}${time?"\n"+time:""}${memo?"\n"+memo:""}` : "";
          ws[R(row,ci+1)] = xlCell(val,{align:"center",wrap:true,fill:name?"ffffff":undefined});
        });
        row++;
      }
      // 集計行
      ws[R(row,0)] = xlHdr("出席予定人数","276749");
      week.forEach(({d},ci) => {
        const cnt = Array.from({length:NUM_SLOTS},(_,i)=>shussekiData[`${year}-${month}-${d}-${i}-name`]||"").filter(Boolean).length;
        ws[R(row,ci+1)] = xlCell(cnt>0?cnt:"",{bold:true,fill:"c6f6d5"});
      });
      row++;
      ws["!ref"] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:row-1,c:COLS-1}});
      ws["!cols"] = [{wch:14},...week.map(()=>({wch:12}))];
      ws["!rows"] = [{hpt:16},{hpt:20},...Array(NUM_SLOTS).fill({hpt:40}),{hpt:16}];
      XLSX.utils.book_append_sheet(wb, ws, `第${wi+1}週(${week[0].d}〜${week[week.length-1].d}日)`);
    });
    XLSX.writeFile(wb, `出席予定_令和${year-2018}年${month}月.xlsx`);
  };

  // 出席予定表 PDF印刷（週ごとにA4）
  const printShusseki = (year, month) => {
    const weeks = getShussekiWeeks(year, month);
    let html = "";
    weeks.forEach((week, wi) => {
      html += `${wi>0?'<div style="page-break-before:always;"></div>':''}
        <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:#1a3a5c;">
          令和${year-2018}年${month}月　出席予定　${week[0].d}日（${["日","月","火","水","木","金","土"][week[0].dow]}）〜${week[week.length-1].d}日（${["日","月","火","水","木","金","土"][week[week.length-1].dow]}）
          <span style="font-size:10px;font-weight:400;margin-left:8px;">${JIGYOSHO_NAME}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:10px;">
          <tr>
            <th style="border:1px solid #333;padding:4px 6px;background:#1a3a5c;color:white;text-align:center;min-width:80px;">出席児童名</th>
            ${week.map(({d,dow})=>{
              const dn=["日","月","火","水","木","金","土"][dow];
              const bg=dow===0?"#fdd":dow===6?"#ddf":"#e8e8e8";
              return `<th style="border:1px solid #333;padding:4px;background:${bg};text-align:center;width:${100/week.length}%">
                <div style="font-size:10px;">${dn}</div><div style="font-size:14px;font-weight:700;">${d}</div>
              </th>`;
            }).join("")}
          </tr>
          ${Array.from({length:NUM_SLOTS},(_,slot)=>{
            return `<tr>
              <td style="border:1px solid #ccc;padding:3px 5px;background:#f5f5f5;font-size:9px;color:#666;">出席児童名 ${slot+1}</td>
              ${week.map(({d})=>{
                const name=shussekiData[`${year}-${month}-${d}-${slot}-name`]||"";
                const time=shussekiData[`${year}-${month}-${d}-${slot}-time`]||"";
                const memo=shussekiData[`${year}-${month}-${d}-${slot}-memo`]||"";
                return `<td style="border:1px solid #ccc;padding:3px;text-align:center;height:40px;vertical-align:middle;">
                  ${name?`<div style="font-size:11px;font-weight:700;">${name}</div>`:""}
                  ${time?`<div style="font-size:9px;color:#c05621;">${time}</div>`:""}
                  ${memo?`<div style="font-size:9px;color:#553c9a;">${memo}</div>`:""}
                </td>`;
              }).join("")}
            </tr>`;
          }).join("")}
          <tr>
            <td style="border:1px solid #999;padding:3px 5px;background:#e8e8e8;font-size:9px;font-weight:700;">出席予定人数</td>
            ${week.map(({d})=>{
              const cnt=Array.from({length:NUM_SLOTS},(_,i)=>shussekiData[`${year}-${month}-${d}-${i}-name`]||"").filter(Boolean).length;
              return `<td style="border:1px solid #999;padding:3px;text-align:center;background:#e8f5e9;font-weight:700;">${cnt>0?cnt:""}</td>`;
            }).join("")}
          </tr>
        </table>`;
    });
    printHTML(html, `出席予定_令和${year-2018}年${month}月`);
  };

  // ダウンロード用
  const [dlYear,  setDlYear]  = useState(today.getFullYear());
  const [dlMonth, setDlMonth] = useState(today.getMonth()+1);
  const [dlChild, setDlChild] = useState("all");

  // 業務日誌用
  const [gyomuDate, setGyomuDate] = useState(todayStr);
  const [gyomuRecords, setGyomuRecords] = useState({});

  const getGR = (dateStr) => gyomuRecords[dateStr] || {};
  const setGR = (dateStr, field, val) => {
    const newData = { ...(gyomuRecords[dateStr]||{}), [field]: val };
    setGyomuRecords(p => ({ ...p, [dateStr]: newData }));
    if (supabase) {
      setSyncing(true);
      dbUpsert("gyomu_records", "date_str", dateStr, newData)
        .catch(()=>setSyncError(true))
        .finally(()=>setSyncing(false));
    }
  };

  // 乗降記録用
  const [jokoDate, setJokoDate] = useState(todayStr);
  const [jokoOverrides, setJokoOverrides] = useState({}); // 手動修正用

  // 乗降記録：送迎表から1日分のデータを生成
  const getJokoData = (dateStr) => {
    const rows = [];
    ["mukae","okuri"].forEach((dir,di) => {
      const bins = schedule[`${dateStr}-${dir}`] || [];
      bins.forEach((bin, bi) => {
        const car    = cars.find(c=>c.id===Number(bin.carId));
        const driver = staff.find(s=>s.id===Number(bin.driverId))?.name||"";
        const joshu  = staff.find(s=>s.id===Number(bin.joshuId))?.name||"";
        // みらいえの時刻を取得
        const baseStops = bin.stops.filter(s=>s.type==="base");
        const firstBase = baseStops[0];
        const lastBase  = baseStops[baseStops.length-1];
        // 子供ストップを抽出
        bin.stops.forEach((stop,si) => {
          if (stop.type!=="child"||!stop.childId) return;
          const child = children.find(c=>c.id===Number(stop.childId));
          if (!child) return;
          const ovKey = `${dateStr}-${dir}-${bin.id}-${stop.id}`;
          const ov    = jokoOverrides[ovKey] || {};
          // 迎え：子の時刻=乗車、最後のbase=降車(みらいえ到着)
          // 送り：最初のbase=乗車(みらいえ出発)、子の時刻=降車
          let joTime="", joBasho="", koTime="", koBasho="";
          if (dir==="mukae") {
            joTime  = ov.joTime  !== undefined ? ov.joTime  : (stop.time||"");
            joBasho = ov.joBasho !== undefined ? ov.joBasho : (stop.basho||"");
            koTime  = ov.koTime  !== undefined ? ov.koTime  : (lastBase?.time||"");
            koBasho = ov.koBasho !== undefined ? ov.koBasho : JIGYOSHO;
          } else {
            joTime  = ov.joTime  !== undefined ? ov.joTime  : (firstBase?.time||"");
            joBasho = ov.joBasho !== undefined ? ov.joBasho : JIGYOSHO;
            koTime  = ov.koTime  !== undefined ? ov.koTime  : (stop.time||"");
            koBasho = ov.koBasho !== undefined ? ov.koBasho : (stop.basho||"");
          }
          rows.push({
            dir, binNo:bi+1, car, driver, joshu,
            child, stop, bin,
            joTime, joBasho, koTime, koBasho,
            signed: ov.signed||false,
            ovKey,
          });
        });
      });
    });
    return rows;
  };

  const setJokoOv = (ovKey, field, val) => {
    setJokoOverrides(p=>({...p, [ovKey]:{...p[ovKey],[field]:val}}));
  };

  // 名簿管理フォーム
  const [nfChild, setNfChild] = useState({ name:"", jukyuNo:"", shichosonNo:"", jigyoshoNo:"", kubun:"2", keiyakuDays:10 });
  const [nfStaff, setNfStaff] = useState({ name:"" });
  const [nfCar,   setNfCar]   = useState({ name:"" });

  // Supabase同期状態
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // 初回ロード：DBからデータを読み込む
  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }
    const loadAll = async () => {
      setSyncing(true);
      try {
        // スケジュール
        const schedData = await dbLoad("schedule");
        if (schedData) {
          const newSched = {};
          schedData.forEach(row => {
            // 新形式(date_str + direction別カラム)と旧形式(date_str_direction)の両方に対応
            if (row.direction) {
              newSched[`${row.date_str}-${row.direction}`] = row.data;
            } else {
              const m = row.date_str.match(/^(.+)_(mukae|okuri)$/);
              if (m) newSched[`${m[1]}-${m[2]}`] = row.data;
            }
          });
          setSchedule(newSched);
        }
        // 実績上書き
        const ovData = await dbLoad("overrides");
        if (ovData) {
          const newOv = {};
          ovData.forEach(row => { newOv[row.record_key] = row.data; });
          setOverrides(newOv);
        }
        // 個人記録
        const krData = await dbLoad("kojin_records");
        if (krData) {
          const newKr = {};
          krData.forEach(row => { newKr[row.record_key] = row.data; });
          setKojinRecords(newKr);
        }
        // 乗降記録
        const jokoData = await dbLoad("joko_overrides");
        if (jokoData) {
          const newJoko = {};
          jokoData.forEach(row => { newJoko[row.ov_key] = row.data; });
          setJokoOverrides(newJoko);
        }
        // 業務日誌
        const gyomuData = await dbLoad("gyomu_records");
        if (gyomuData) {
          const newGyomu = {};
          gyomuData.forEach(row => { newGyomu[row.date_str] = row.data; });
          setGyomuRecords(newGyomu);
        }
        // 出席予定表
        const shussekiDbData = await dbLoad("shusseki_data");
        if (shussekiDbData) {
          const newShusseki = {};
          shussekiDbData.forEach(row => {
            if (row.data && typeof row.data === "object") {
              Object.assign(newShusseki, row.data);
            }
          });
          setShussekiData(newShusseki);
        }
        // 名簿
        const masterData = await dbLoad("master_data");
        if (masterData) {
          masterData.forEach(row => {
            if (row.data_key === "children") setChildren(row.data);
            if (row.data_key === "staff")    setStaff(row.data);
            if (row.data_key === "cars")     setCars(row.data);
          });
        }
        setSyncError(false);
      } catch(e) {
        setSyncError(true);
      } finally {
        setSyncing(false);
        setLoaded(true);
      }
    };
    loadAll();
  }, []);

  // リアルタイム購読（他のスタッフの変更を受信）
  useEffect(() => {
    if (!supabase) return;
    const tables = ["schedule","overrides","kojin_records","joko_overrides","gyomu_records","master_data","shusseki_data"];
    const subs = tables.map(table =>
      supabase.channel(`realtime-${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
          // 変更があったら該当stateを更新
          const row = payload.new;
          if (!row) return;
          if (table==="schedule") {
            if (row.direction) {
              setSchedule(p=>({...p,[`${row.date_str}-${row.direction}`]:row.data}));
            } else {
              const m = row.date_str.match(/^(.+)_(mukae|okuri)$/);
              if (m) setSchedule(p=>({...p,[`${m[1]}-${m[2]}`]:row.data}));
            }
          }
          if (table==="overrides")     setOverrides(p=>({...p,[row.record_key]:row.data}));
          if (table==="kojin_records") setKojinRecords(p=>({...p,[row.record_key]:row.data}));
          if (table==="joko_overrides")setJokoOverrides(p=>({...p,[row.ov_key]:row.data}));
          if (table==="gyomu_records") setGyomuRecords(p=>({...p,[row.date_str]:row.data}));
          if (table==="shusseki_data") {
            if (row.data && typeof row.data === "object") {
              setShussekiData(p => ({ ...p, ...row.data }));
            }
          }
          if (table==="master_data") {
            if (row.data_key==="children") setChildren(row.data);
            if (row.data_key==="staff")    setStaff(row.data);
            if (row.data_key==="cars")     setCars(row.data);
          }
        })
        .subscribe()
    );
    return () => subs.forEach(s => supabase.removeChannel(s));
  }, []);

  // DB保存ヘルパー（debounce付き）
  const saveSchedule = useCallback(async (key, bins) => {
    setSyncing(true);
    const [dateStr, dir] = key.split(/-(?=[^-]*$)/);
    await dbUpsert("schedule", "date_str", dateStr, bins)
      .catch(()=>setSyncError(true))
      .finally(()=>setSyncing(false));
  }, []);

  const saveMaster = useCallback(async (key, data) => {
    setSyncing(true);
    await dbUpsert("master_data", "data_key", key, data)
      .catch(()=>setSyncError(true))
      .finally(()=>setSyncing(false));
  }, []);

  // --- 送迎表 helpers ---
  const sKey  = `${sDate}-${dir}`;
  const sBins = schedule[sKey] || [];
  const updSched = (b) => {
    setSchedule(p => ({ ...p, [sKey]: b }));
    if (supabase) {
      setSyncing(true);
      const parts = sKey.match(/^(.+)-(mukae|okuri)$/);
      if (parts) {
        supabase.from("schedule")
          .upsert({ date_str: parts[1], direction: parts[2], data: b, updated_at: new Date().toISOString() },
                  { onConflict: "date_str,direction" })
          .then(({error}) => { if(error) setSyncError(true); })
          .finally(() => setSyncing(false));
      }
    }
  };
  const addBin  = () => updSched([...sBins, newBin()]);
  const remBin  = (id) => updSched(sBins.filter(b => b.id !== id));
  const updBin  = (id, f, v) => updSched(sBins.map(b => b.id===id ? {...b,[f]:v} : b));
  const addStop = (bid, type) => updSched(sBins.map(b => b.id!==bid ? b : {...b, stops:[...b.stops, {...newStop(type), id:Date.now()+Math.random()}]}));
  const remStop = (bid, sid) => updSched(sBins.map(b => b.id!==bid ? b : {...b, stops:b.stops.filter(s=>s.id!==sid)}));
  const updStop = (bid, sid, f, v) => updSched(sBins.map(b => b.id!==bid ? b : {...b, stops:b.stops.map(s=>s.id!==sid?s:{...s,[f]:v})}));
  const addBase = (bid) => updSched(sBins.map(b => b.id!==bid ? b : {...b, stops:[...b.stops, {...newStop("base"), id:Date.now()+Math.random()}]}));

  const getCarById   = (id) => cars.find(c => c.id===Number(id));
  const getStaffName = (id) => staff.find(s => s.id===Number(id))?.name || "";
  const getChildName = (id) => children.find(c => c.id===Number(id))?.name || "";

  // 車種別集計
  const carSummary = useMemo(() => {
    const res = {};
    ["mukae","okuri"].forEach(d => {
      const bs = schedule[`${sDate}-${d}`] || [];
      bs.forEach(bin => {
        if (!bin.carId) return;
        const car = getCarById(bin.carId);
        if (!car) return;
        if (!res[car.id]) res[car.id] = { car, rows:[] };
        bin.stops.forEach(stop => {
          if (stop.type==="child" && stop.childId) {
            res[car.id].rows.push({
              dir: d, time: stop.time,
              name: getChildName(stop.childId),
              basho: stop.basho,
              driver: getStaffName(bin.driverId),
              joshu: getStaffName(bin.joshuId),
            });
          }
        });
      });
    });
    return Object.values(res);
  }, [schedule, sDate, cars, children, staff]);

  // --- 実績記録 helpers ---
  const days = getDaysInMonth(jYear, jMonth);
  const jChild = children.find(c => c.id === jChildId);

  // 実績1行分のデータを取得（送迎表連携 + 手動上書き）
  const getJisseki = (d) => {
    const dateStr = `${jYear}-${String(jMonth).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const linked  = deriveJisseki(dateStr, jChildId, schedule);
    const key     = `${jChildId}-${jYear}-${jMonth}-${d}`;
    const ov      = overrides[key] || {};

    // 送迎表にデータあれば出席、なければ欠席（上書き優先）
    const hasLinked = linked.startTime || linked.endTime;
    const attend = ov.attend !== undefined ? ov.attend : (hasLinked ? "present" : "");

    return {
      attend,
      timeStart: ov.timeStart !== undefined ? ov.timeStart : (linked.startTime || ""),
      timeEnd:   ov.timeEnd   !== undefined ? ov.timeEnd   : (linked.endTime   || ""),
      keitai: ov.keitai || "1",
      kubun:  ov.kubun  || jChild?.kubun || "2",
      soJu:   ov.soJu   !== undefined ? ov.soJu   : linked.soJu,
      soBin:  ov.soBin  !== undefined ? ov.soBin  : linked.soBin,
      kazoku: ov.kazoku || false,
      enchyo: ov.enchyo || false,
      senmon: ov.senmon || false,
      iryo:   ov.iryo   || false,
      jiritsu:ov.jiritsu|| false,
      kankei: ov.kankei || false,
      signed: ov.signed || false,
      note:   ov.note   || "",
      isLinked: hasLinked && ov.timeStart===undefined && ov.timeEnd===undefined,
    };
  };

  const setOv = (d, f, v) => {
    const key = `${jChildId}-${jYear}-${jMonth}-${d}`;
    const newData = { ...(overrides[key]||{}), [f]: v };
    setOverrides(p => ({ ...p, [key]: newData }));
    if (supabase) {
      setSyncing(true);
      dbUpsert("overrides", "record_key", key, newData)
        .catch(()=>setSyncError(true))
        .finally(()=>setSyncing(false));
    }
  };

  // 月集計
  const totals = useMemo(() => {
    let present=0, totalMins=0, soJu=0, soBin=0;
    for (let d=1; d<=days; d++) {
      const r = getJisseki(d);
      if (r.attend !== "present") continue;
      present++;
      if (r.soJu) soJu++;
      if (r.soBin) soBin++;
      const sm = toMins(r.timeStart), em = toMins(r.timeEnd);
      if (sm && em && em>sm) totalMins += em-sm;
    }
    return { present, absent: days-present, soJu, soBin,
      hours: Math.floor(totalMins/60), mins: totalMins%60 };
  }, [overrides, schedule, jChildId, jYear, jMonth, days]);

  const years = [today.getFullYear()-1, today.getFullYear(), today.getFullYear()+1];

  // 名簿操作
  const addChild = () => {
    if (!nfChild.name.trim()) return;
    const id = Date.now();
    const newList = [...children, { ...nfChild, id, name:nfChild.name.trim() }];
    setChildren(newList);
    setNfChild({ name:"", jukyuNo:"", shichosonNo:"", jigyoshoNo:"", kubun:"2", keiyakuDays:10 });
    if (supabase) saveMaster("children", newList);
  };
  const addStaff = () => {
    if (!nfStaff.name.trim()) return;
    const newList = [...staff, { id:Date.now(), name:nfStaff.name.trim() }];
    setStaff(newList);
    setNfStaff({ name:"" });
    if (supabase) saveMaster("staff", newList);
  };
  const addCar = () => {
    if (!nfCar.name.trim()) return;
   setCars(p => { const nl=[...p,{id:Date.now(),name:nfCar.name.trim(),color:CAR_COLORS[p.length%CAR_COLORS.length]}]; saveMaster("cars",nl); return nl; });
    setNfCar({ name:"" });
  };
  const del = (setter, id, masterKey, currentList) => {
    if (window.confirm("削除しますか？")) {
      const newList = currentList.filter(x => x.id !== id);
      setter(newList);
      if (supabase && masterKey) saveMaster(masterKey, newList);
    }
  };

  // ============================================================
  // Excel出力関数
  // ============================================================
  // ============================================================
  // Excel罫線ヘルパー関数
  // ============================================================
  const XL_BORDER = {
    top:    {style:"thin",color:{rgb:"000000"}},
    bottom: {style:"thin",color:{rgb:"000000"}},
    left:   {style:"thin",color:{rgb:"000000"}},
    right:  {style:"thin",color:{rgb:"000000"}},
  };
  const XL_BORDER_MED = {
    top:    {style:"medium",color:{rgb:"000000"}},
    bottom: {style:"medium",color:{rgb:"000000"}},
    left:   {style:"medium",color:{rgb:"000000"}},
    right:  {style:"medium",color:{rgb:"000000"}},
  };
  const xlCell = (v, opts={}) => ({
    v: v ?? "", t: typeof v==="number"?"n":"s",
    s: {
      font: {sz:opts.sz||9, name:"MS Gothic", bold:opts.bold||false, color:{rgb:opts.color||"000000"}},
      alignment: {horizontal:opts.align||"center", vertical:"center", wrapText:opts.wrap||false},
      border: opts.thick ? XL_BORDER_MED : XL_BORDER,
      fill: {patternType:"solid", fgColor:{rgb: opts.fill||"FFFFFF"}, bgColor:{rgb:"FFFFFF"}},
    }
  });
  const xlHdr = (v, fill="1a3a5c") => xlCell(v, {bold:true, color:"FFFFFF", fill});
  // AOAの2D配列にスタイルを一括適用してWSを作成
  const makeStyledWS = (data, headerRows=1, colWidths=[], hdrFill="1a3a5c") => {
    const ws = {};
    data.forEach((row, ri) => {
      row.forEach((val, ci) => {
        const addr = XLSX.utils.encode_cell({r:ri,c:ci});
        const isHdr = ri < headerRows;
        const isWkend = false;
        ws[addr] = isHdr
          ? xlHdr(val, hdrFill)
          : xlCell(val, {align: ci===0?"center":"left"});
      });
    });
    if(colWidths.length) ws["!cols"] = colWidths.map(w=>({wch:w}));
    ws["!ref"] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:data.length-1,c:(data[0]?.length||1)-1}});
    return ws;
  };



  // 送迎表をExcel出力（月単位）
  const exportSougeiExcel = (year, month) => {
    const wb = XLSX.utils.book_new();
    const daysInMon = getDaysInMonth(year, month);

    for (let d = 1; d <= daysInMon; d++) {
      const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow     = getDow(year, month, d);
      if (isWeekend(year, month, d)) continue; // 必要なら週末もincludeに変更可

      const rows = [];
      // ヘッダー
      rows.push([`送迎表　令和${year-2018}年${month}月${d}日（${dow}）`, "", "", "", "", "", "", ""]);
      rows.push(["区分","便","車種","運転者","同乗者","時刻","お子さん","場所"]);

      ["mukae","okuri"].forEach((dir,di) => {
        const bins = schedule[`${dateStr}-${dir}`] || [];
        bins.forEach((bin, bi) => {
          const car    = cars.find(c=>c.id===Number(bin.carId))?.name || "";
          const driver = staff.find(s=>s.id===Number(bin.driverId))?.name || "";
          const joshu  = staff.find(s=>s.id===Number(bin.joshuId))?.name || "";
          bin.stops.forEach(stop => {
            const dirLabel = dir==="mukae" ? "迎え" : "送り";
            if (stop.type==="base") {
              rows.push([dirLabel, `${bi+1}便`, car, driver, joshu, stop.time||"", "みらいえ", ""]);
            } else if (stop.type==="child" && stop.childId) {
              const childName = children.find(c=>c.id===Number(stop.childId))?.name || "";
              rows.push([dirLabel, `${bi+1}便`, car, driver, joshu, stop.time||"", childName, stop.basho||""]);
            }
          });
        });
      });

      if (rows.length <= 2) return; // データなしの日はスキップ

      const ws = XLSX.utils.aoa_to_sheet(rows);
      // 列幅設定
      ws["!cols"] = [{wch:6},{wch:6},{wch:14},{wch:8},{wch:8},{wch:8},{wch:14},{wch:8}];
      // タイトルのマージ
      ws["!merges"] = [{s:{r:0,c:0},e:{r:0,c:7}}];
      XLSX.utils.book_append_sheet(wb, ws, `${month}月${d}日`);
    }

    // 月間サマリーシート追加
    const summaryRows = [["送迎表月間サマリー", `令和${year-2018}年${month}月`,"","","","","",""]];
    summaryRows.push(["日付","曜日","区分","便","車種","運転者","お子さん","場所"]);
    for (let d = 1; d <= daysInMon; d++) {
      const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow = getDow(year, month, d);
      ["mukae","okuri"].forEach(dir => {
        (schedule[`${dateStr}-${dir}`]||[]).forEach((bin,bi) => {
          const car    = cars.find(c=>c.id===Number(bin.carId))?.name || "";
          const driver = staff.find(s=>s.id===Number(bin.driverId))?.name || "";
          bin.stops.forEach(stop => {
            if (stop.type==="child" && stop.childId) {
              const childName = children.find(c=>c.id===Number(stop.childId))?.name || "";
              summaryRows.push([
                `${month}/${d}`, dow,
                dir==="mukae"?"迎え":"送り",
                `${bi+1}便`, car, driver, childName, stop.basho||""
              ]);
            }
          });
        });
      });
    }
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary["!cols"] = [{wch:8},{wch:6},{wch:6},{wch:6},{wch:14},{wch:8},{wch:14},{wch:8}];
    wsSummary["!merges"] = [{s:{r:0,c:0},e:{r:0,c:7}}];
    XLSX.utils.book_append_sheet(wb, wsSummary, "月間サマリー");

    XLSX.writeFile(wb, `送迎表_令和${year-2018}年${month}月.xlsx`);
  };


  // ============================================================
  // スプレッドシート（CSV）出力ヘルパー
  // ============================================================
  const downloadCSV = (rows, filename) => {
    const csv = rows.map(r =>
      r.map(cell => {
        const s = String(cell ?? "");
        return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s;
      }).join(",")
    ).join("\n");
    const bom  = "\uFEFF";
    const blob = new Blob([bom + csv], {type:"text/csv;charset=utf-8;"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // 送迎表 Excel
  const exportSougeiXLSX = (year, month) => {
    const wb = XLSX.utils.book_new();
    const daysInMon = getDaysInMonth(year, month);
    const sumData = [["日付","曜日","区分","便","車種","運転者","同乗者","時刻","お子さん","場所"]];
    for (let d = 1; d <= daysInMon; d++) {
      const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow = getDow(year, month, d);
      const wkend = isWeekend(year, month, d);
      const dayData = [[`送迎表　令和${year-2018}年${month}月${d}日（${dow}）　${JIGYOSHO_NAME}`,"","","","","","",""],
                       ["区分","便","車種","運転者","同乗者","時刻","お子さん","場所"]];
      let hasData = false;
      ["mukae","okuri"].forEach(dir => {
        (schedule[`${dateStr}-${dir}`]||[]).forEach((bin,bi) => {
          const car    = cars.find(c=>c.id===Number(bin.carId))?.name||"";
          const driver = staff.find(s=>s.id===Number(bin.driverId))?.name||"";
          const joshu  = staff.find(s=>s.id===Number(bin.joshuId))?.name||"";
          const dirFill = dir==="mukae"?"fff3e0":"ebf8ff";
          bin.stops.forEach(stop => {
            const dl = dir==="mukae"?"迎え":"送り";
            if (stop.type==="base") {
              dayData.push([dl,`${bi+1}便`,car,driver,joshu,stop.time||"","🏫 みらいえ",""]);
              sumData.push([`${month}/${d}`,dow,dl,`${bi+1}便`,car,driver,joshu,stop.time||"","みらいえ",""]);
              hasData = true;
            } else if (stop.type==="child"&&stop.childId) {
              const cn = children.find(c=>c.id===Number(stop.childId))?.name||"";
              dayData.push([dl,`${bi+1}便`,car,driver,joshu,stop.time||"",cn,stop.basho||""]);
              sumData.push([`${month}/${d}`,dow,dl,`${bi+1}便`,car,driver,joshu,stop.time||"",cn,stop.basho||""]);
              hasData = true;
            }
          });
        });
      });
      if (hasData) {
        const ws = {};
        dayData.forEach((row,ri) => {
          row.forEach((val,ci) => {
            const addr = XLSX.utils.encode_cell({r:ri,c:ci});
            const isTitle = ri===0;
            const isHdr = ri===1;
            ws[addr] = isTitle ? xlCell(val,{bold:true,sz:11,fill:"1a3a5c",color:"FFFFFF",align:"left"}) :
                       isHdr  ? xlHdr(val) :
                       xlCell(val,{align:ci>=5?"center":"left",
                         fill:val==="迎え"?"fff3e0":val==="送り"?"ebf8ff":undefined});
          });
        });
        ws["!cols"]=[{wch:6},{wch:6},{wch:14},{wch:10},{wch:8},{wch:8},{wch:16},{wch:8}];
        ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:7}}];
        ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:dayData.length-1,c:7}});
        XLSX.utils.book_append_sheet(wb, ws, `${month}月${d}日`);
      }
    }
    // 月間サマリーシート
    const wsSummary = {};
    sumData.forEach((row,ri) => {
      row.forEach((val,ci) => {
        wsSummary[XLSX.utils.encode_cell({r:ri,c:ci})] =
          ri===0 ? xlHdr(val) : xlCell(val,{align:ci>=5?"center":"left"});
      });
    });
    wsSummary["!cols"]=[{wch:8},{wch:6},{wch:6},{wch:6},{wch:14},{wch:10},{wch:8},{wch:8},{wch:16},{wch:8}];
    wsSummary["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:sumData.length-1,c:9}});
    XLSX.utils.book_append_sheet(wb, wsSummary, "月間サマリー");
    XLSX.writeFile(wb, `送迎表_令和${year-2018}年${month}月.xlsx`);
  };

  // 送迎表 CSV
  const exportSougeiCSV = (year, month) => {
    const daysInMon = getDaysInMonth(year, month);
    const rows = [["日付","曜日","区分","便","車種","運転者","同乗者","時刻","お子さん","場所"]];
    for (let d = 1; d <= daysInMon; d++) {
      const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow = getDow(year, month, d);
      ["mukae","okuri"].forEach(dir => {
        (schedule[`${dateStr}-${dir}`]||[]).forEach((bin,bi) => {
          const car    = cars.find(c=>c.id===Number(bin.carId))?.name||"";
          const driver = staff.find(s=>s.id===Number(bin.driverId))?.name||"";
          const joshu  = staff.find(s=>s.id===Number(bin.joshuId))?.name||"";
          bin.stops.forEach(stop => {
            const dl = dir==="mukae"?"迎え":"送り";
            if (stop.type==="base") {
              rows.push([`${month}/${d}`,dow,dl,`${bi+1}便`,car,driver,joshu,stop.time||"","みらいえ",""]);
            } else if (stop.type==="child"&&stop.childId) {
              const cn = children.find(c=>c.id===Number(stop.childId))?.name||"";
              rows.push([`${month}/${d}`,dow,dl,`${bi+1}便`,car,driver,joshu,stop.time||"",cn,stop.basho||""]);
            }
          });
        });
      });
    }
    downloadCSV(rows, `送迎表_令和${year-2018}年${month}月.csv`);
  };

  // 実績記録 Excel（子ども別）- 紙書式準拠
  const exportJissekiXLSX = (year, month, childId) => {
    const wb = XLSX.utils.book_new();
    const daysInMon = getDaysInMonth(year, month);
    const targetChildren = childId === "all" ? children : children.filter(c=>c.id===Number(childId));

    targetChildren.forEach(child => {
      const ws = {};
      const R = (r,c) => XLSX.utils.encode_cell({r,c});
      const merges = [];
      let row = 0;
      const N = 19;
      const thin = {style:"thin", color:{rgb:"000000"}};
      const bAll = {top:thin,right:thin,bottom:thin,left:thin};

      const C = (v, opts={}) => ({
        v: v??'', t:'s',
        s:{
          font:{sz:opts.sz||9, name:"MS Gothic", bold:opts.bold||false, color:{rgb:opts.color||"000000"}},
          alignment:{horizontal:opts.align||"center", vertical:"center", wrapText:true},
          border:bAll,
          fill:{patternType:"solid", fgColor:{rgb:opts.fill||"FFFFFF"}, bgColor:{rgb:"FFFFFF"}},
        }
      });

      // ===== 行0: タイトル =====
      for(let c=0;c<N;c++) ws[R(row,c)]=C("");
      ws[R(row,0)]=C(`令和${year-2018}年${month}月分`,{sz:11,bold:true,align:"left"});
      ws[R(row,5)]=C("放課後等デイサービス提供実績記録票",{sz:13,bold:true,align:"center"});
      ws[R(row,15)]=C("事業所番号",{sz:8,align:"center"});
      ws[R(row,16)]=C(child.jigyoshoNo||JIGYOSHO_NO,{sz:9,align:"center"});
      merges.push(
        {s:{r:0,c:0},e:{r:0,c:4}},
        {s:{r:0,c:5},e:{r:0,c:14}},
        {s:{r:0,c:15},e:{r:0,c:15}},
        {s:{r:0,c:16},e:{r:0,c:18}},
      );
      row++;

      // ===== 行1: 受給者証番号・氏名・事業者名 =====
      for(let c=0;c<N;c++) ws[R(row,c)]=C("");
      ws[R(row,0)]=C("受給者証\n番　号",{sz:8,align:"center"});
      ws[R(row,1)]=C(child.jukyuNo||"",{sz:9,align:"center"});
      ws[R(row,3)]=C("給付決定保護者氏名\n（障害児氏名）",{sz:8,align:"center"});
      ws[R(row,5)]=C(child.name,{sz:12,bold:true,align:"center"});
      ws[R(row,11)]=C("事業者\n及び\n事業者名",{sz:8,align:"center"});
      ws[R(row,12)]=C(JIGYOSHO_NAME,{sz:11,bold:true,align:"center"});
      merges.push(
        {s:{r:1,c:0},e:{r:1,c:0}},
        {s:{r:1,c:1},e:{r:1,c:2}},
        {s:{r:1,c:3},e:{r:1,c:4}},
        {s:{r:1,c:5},e:{r:1,c:10}},
        {s:{r:1,c:11},e:{r:3,c:11}},
        {s:{r:1,c:12},e:{r:3,c:18}},
      );
      row++;

      // ===== 行2: 市町村番号 =====
      for(let c=0;c<N;c++) ws[R(row,c)]=C("");
      ws[R(row,0)]=C("市町村\n番　号",{sz:8,align:"center"});
      ws[R(row,1)]=C(child.shichosonNo||"",{sz:9,align:"center"});
      merges.push(
        {s:{r:2,c:0},e:{r:2,c:0}},
        {s:{r:2,c:1},e:{r:2,c:2}},
        {s:{r:2,c:3},e:{r:2,c:10}},
      );
      row++;

      // ===== 行3: 契約支給量 =====
      for(let c=0;c<N;c++) ws[R(row,c)]=C("");
      ws[R(row,0)]=C("契約支給量",{sz:8,align:"center"});
      ws[R(row,1)]=C(`${child.keiyakuDays||10}日／月`,{sz:10,align:"center"});
      merges.push(
        {s:{r:3,c:0},e:{r:4,c:0}},
        {s:{r:3,c:1},e:{r:4,c:10}},
      );
      row++;

      // ===== 行4: マージ続き =====
      for(let c=0;c<N;c++) ws[R(row,c)]=C("");
      row++;

      // ===== 行4: ヘッダー大分類 =====
      const FH="DDEEFF";
      for(let c=0;c<N;c++) ws[R(row,c)]=C("",{fill:FH});
      ws[R(row,0)]=C("日\n付",{sz:9,fill:FH});
      ws[R(row,1)]=C("曜\n日",{sz:9,fill:FH});
      ws[R(row,2)]=C("サービス提供実績",{sz:9,fill:FH});
      ws[R(row,17)]=C("保護者等\n確認欄",{sz:8,fill:FH});
      ws[R(row,18)]=C("備考",{sz:9,fill:FH});
      merges.push(
        {s:{r:5,c:0},e:{r:7,c:0}},
        {s:{r:5,c:1},e:{r:7,c:1}},
        {s:{r:5,c:2},e:{r:5,c:16}},
        {s:{r:5,c:17},e:{r:7,c:17}},
        {s:{r:5,c:18},e:{r:7,c:18}},
      );
      row++;

      // ===== 行5: ヘッダー中分類 =====
      for(let c=0;c<N;c++) ws[R(row,c)]=C("",{fill:FH});
      ws[R(row,2)] =C("サービス提供の\n状況",{sz:8,fill:FH});
      ws[R(row,3)] =C("提供\n形態",{sz:8,fill:FH});
      ws[R(row,4)] =C("区分",{sz:8,fill:FH});
      ws[R(row,5)] =C("開始\n時間",{sz:8,fill:FH});
      ws[R(row,6)] =C("終了\n時間",{sz:8,fill:FH});
      ws[R(row,7)] =C("算定\n時間数",{sz:8,fill:FH});
      ws[R(row,8)] =C("滞在\n時間",{sz:8,fill:FH});
      ws[R(row,9)] =C("送迎加算",{sz:8,fill:FH});
      ws[R(row,11)]=C("家族\n支援加算",{sz:7,fill:FH});
      ws[R(row,12)]=C("延長\n支援加算",{sz:7,fill:FH});
      ws[R(row,13)]=C("専門的支援加算\n(支援実施時)",{sz:6,fill:FH});
      ws[R(row,14)]=C("通所自立\n支援加算",{sz:7,fill:FH});
      ws[R(row,15)]=C("自立\nサポート加算",{sz:7,fill:FH});
      ws[R(row,16)]=C("関係機関\n連携",{sz:7,fill:FH});
      merges.push(
        {s:{r:6,c:2},e:{r:7,c:2}},
        {s:{r:6,c:3},e:{r:7,c:3}},
        {s:{r:6,c:4},e:{r:7,c:4}},
        {s:{r:6,c:5},e:{r:7,c:5}},
        {s:{r:6,c:6},e:{r:7,c:6}},
        {s:{r:6,c:7},e:{r:7,c:7}},
        {s:{r:6,c:8},e:{r:7,c:8}},
        {s:{r:6,c:9},e:{r:6,c:10}},
        {s:{r:6,c:11},e:{r:7,c:11}},
        {s:{r:6,c:12},e:{r:7,c:12}},
        {s:{r:6,c:13},e:{r:7,c:13}},
        {s:{r:6,c:14},e:{r:7,c:14}},
        {s:{r:6,c:15},e:{r:7,c:15}},
        {s:{r:6,c:16},e:{r:7,c:16}},
      );
      row++;

      // ===== 行6: 往/復 =====
      for(let c=0;c<N;c++) ws[R(row,c)]=C("",{fill:FH});
      ws[R(row,9)] =C("往",{sz:8,fill:FH});
      ws[R(row,10)]=C("復",{sz:8,fill:FH});
      row++;

      // ===== データ行 =====
      const DOWS=["日","月","火","水","木","金","土"];
      const firstDow=new Date(year, month-1, 1).getDay();
      let totSoJu=0,totSoBin=0,totKazoku=0,totEnchyo=0,totSenmon=0,totTsuusho=0,totJiritsu=0,totKankei=0;
      const jissekiMap={};

      for(let d=1;d<=daysInMon;d++){
        const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const dow=DOWS[(firstDow+d-1)%7];
        const isSat=dow==="土",isSun=dow==="日";
        const bf=isSat?"EBF8FF":isSun?"FFF5F5":"FFFFFF";
        const dc=isSat?"2b6cb0":isSun?"c53030":"000000";
        const linked=deriveJisseki(dateStr,child.id,schedule);
        const ov=overrides[`${child.id}-${year}-${month}-${d}`]||{};
        const hasLinked=linked.startTime||linked.endTime;
        const attend=ov.attend!==undefined?ov.attend:(hasLinked?"present":"");

        for(let c=0;c<N;c++) ws[R(row,c)]=C("",{fill:bf});
        ws[R(row,0)]=C(String(d),{bold:true,fill:bf,color:dc});
        ws[R(row,1)]=C(dow,{fill:bf,color:dc});

        if(attend==="present"){
          jissekiMap[d]=true;
          const s=ov.timeStart||linked.startTime||"";
          const e=ov.timeEnd||linked.endTime||"";
          const santei=ov.santeiManual!==undefined?ov.santeiManual:calcSantei(s,e);
          const soJu=(ov.soJu!==undefined?ov.soJu:linked.soJu)?true:false;
          const soBin=(ov.soBin!==undefined?ov.soBin:linked.soBin)?true:false;
          ws[R(row,2)]=C("○",{fill:"E8F5E9"});
          ws[R(row,3)]=C(ov.keitai||"1",{fill:bf});
          ws[R(row,4)]=C(ov.kubun||child.kubun||"2",{fill:bf});
          ws[R(row,5)]=C(s,{fill:bf});
          ws[R(row,6)]=C(e,{fill:bf});
          ws[R(row,7)]=C(String(santei||""),{fill:bf});
          ws[R(row,8)]=C(calcZaitai(s,e),{fill:bf});
          if(soJu){  ws[R(row,9)] =C("1",{fill:"D4EDDA"}); totSoJu++; }
          if(soBin){ ws[R(row,10)]=C("1",{fill:"D4EDDA"}); totSoBin++; }
          if(ov.kazoku){ ws[R(row,11)]=C("回",{fill:"D4EDDA"}); totKazoku++; }
          if(ov.enchyo){ ws[R(row,12)]=C("回",{fill:"D4EDDA"}); totEnchyo++; }
          if(ov.senmon){ ws[R(row,13)]=C("回",{fill:"D4EDDA"}); totSenmon++; }
          if(ov.iryo){   ws[R(row,14)]=C("回",{fill:"D4EDDA"}); totTsuusho++; }
          if(ov.jiritsu){ws[R(row,15)]=C("回",{fill:"D4EDDA"}); totJiritsu++; }
          if(ov.kankei){ ws[R(row,16)]=C("回",{fill:"D4EDDA"}); totKankei++; }
          if(ov.signed){ ws[R(row,17)]=C("印",{fill:"E8F5E9"}); }
          if(ov.note){   ws[R(row,18)]=C(ov.note,{fill:bf,align:"left"}); }
        }
        row++;
      }

      // ===== 合計行 =====
      const totAttend = Object.values(jissekiMap).filter(Boolean).length; // 出席回数
      const totSoTotal = totSoJu + totSoBin; // 送迎往路+復路合計
      for(let c=0;c<N;c++) ws[R(row,c)]=C("",{fill:"F2F2F2"});
      ws[R(row,0)]=C("合計",{sz:9,fill:"F2F2F2",align:"left"});
      ws[R(row,3)]=C(totAttend?`${totAttend}回`:"回",{fill:"F2F2F2"}); // 提供形態列に出席回数
      ws[R(row,9)] =C(totSoTotal?`${totSoTotal}回`:"回",{fill:"F2F2F2"}); // 往復合計（結合）
      ws[R(row,10)]=C("",{fill:"F2F2F2"});
      merges.push({s:{r:row,c:9},e:{r:row,c:10}});
      ws[R(row,11)]=C(totKazoku?`${totKazoku}回`:"回",{fill:"F2F2F2"});
      ws[R(row,12)]=C(totEnchyo?`${totEnchyo}回`:"回",{fill:"F2F2F2"});
      ws[R(row,13)]=C(totSenmon?`${totSenmon}回`:"回",{fill:"F2F2F2"});
      ws[R(row,14)]=C(totTsuusho?`${totTsuusho}回`:"回",{fill:"F2F2F2"});
      ws[R(row,15)]=C(totJiritsu?`${totJiritsu}回`:"回",{fill:"F2F2F2"});
      ws[R(row,16)]=C("",{fill:"F2F2F2"}); // 関係機関連携は合計なし
      merges.push({s:{r:row,c:0},e:{r:row,c:2}});
      row++;

      // ===== 空行 =====
      for(let c=0;c<N;c++) ws[R(row,c)]=C(""); row++;

      // ===== 保育・教育等移行支援加算 =====
      for(let c=0;c<N;c++) ws[R(row,c)]=C("");
      ws[R(row,0)]=C("保育・教育等移行支援加算",{sz:8,align:"left"});
      ws[R(row,4)]=C("移行日",{sz:8});
      ws[R(row,9)]=C("移行後算定日",{sz:8});
      merges.push({s:{r:row,c:0},e:{r:row,c:3}},{s:{r:row,c:4},e:{r:row,c:8}},{s:{r:row,c:9},e:{r:row,c:18}});
      row++;

      // ===== 集中的支援加算 =====
      for(let c=0;c<N;c++) ws[R(row,c)]=C("");
      ws[R(row,0)]=C("集中的支援加算",{sz:8,align:"left"});
      ws[R(row,4)]=C("支援開始日",{sz:8});
      merges.push({s:{r:row,c:0},e:{r:row,c:3}},{s:{r:row,c:4},e:{r:row,c:18}});
      row++;

      // ===== 枚中/枚 =====
      for(let c=0;c<N;c++) ws[R(row,c)]=C("");
      ws[R(row,15)]=C("枚中",{sz:8});
      ws[R(row,17)]=C("枚",{sz:8});
      merges.push({s:{r:row,c:0},e:{r:row,c:14}},{s:{r:row,c:15},e:{r:row,c:16}},{s:{r:row,c:17},e:{r:row,c:18}});
      row++;

      ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:row-1,c:N-1}});
      // A4縦に収まるよう列幅調整
      // A4縦の印刷幅 ≒ 19cm = 約72wch相当。全19列の合計を72以内に
      ws["!cols"]=[
        {wch:4.5}, // 日付
        {wch:4.0}, // 曜日
        {wch:6.5}, // サービス提供状況
        {wch:4.0}, // 提供形態
        {wch:3.0}, // 区分
        {wch:5.0}, // 開始時間
        {wch:5.0}, // 終了時間
        {wch:5.0}, // 算定時間数
        {wch:5.0}, // 滞在時間
        {wch:3.0}, // 往
        {wch:3.0}, // 復
        {wch:4.5}, // 家族支援加算
        {wch:4.5}, // 延長支援加算
        {wch:5.0}, // 専門的支援加算
        {wch:5.0}, // 通所自立支援加算
        {wch:5.0}, // 自立サポート加算
        {wch:4.5}, // 関係機関連携
        {wch:5.0}, // 確認欄
        {wch:8.0}, // 備考
      ];
      // A4縦印刷設定
      // A4縦・余白最小・1ページに収める
      ws["!pageSetup"]={
        paperSize: 9,          // A4
        orientation: "portrait", // 縦向き
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,        // 1ページ高さに収める
        scale: 100,
      };
      ws["!margins"]={left:0.15, right:0.15, top:0.15, bottom:0.15, header:0.0, footer:0.0};
      // A4縦762pt総高さに収まるよう行高さを配分
      // ヘッダー8行: 16+20+16+16+16+11+28+12 = 135pt
      // フッター5行: 22+4+13+13+13 = 65pt
      // データ行に残り: 762-135-65 = 562pt → 562/daysInMon per row
      const dataRowHpt = Math.floor(562 / daysInMon);
      ws["!rows"]=[
        {hpt:16},                                    // タイトル
        {hpt:20},{hpt:16},{hpt:16},{hpt:16},         // 受給者情報（市町村番号含む4行）
        {hpt:11},{hpt:28},{hpt:12},                  // ヘッダー
        ...Array(daysInMon).fill({hpt:dataRowHpt}),  // データ行
        {hpt:22},{hpt:4},{hpt:13},{hpt:13},{hpt:13}, // 合計（高め）・加算
      ];
      ws["!merges"]=merges;
      XLSX.utils.book_append_sheet(wb, ws, child.name.slice(0,31));
    });
    XLSX.writeFile(wb, `実績記録_令和${year-2018}年${month}月.xlsx`);
  };

  // 実績記録 CSV
  const exportJissekiCSV = (year, month, childId) => {
    const daysInMon = getDaysInMonth(year, month);
    const targetChildren = childId==="all"?children:children.filter(c=>c.id===Number(childId));
    const rows = [["氏名","日","曜","状況","開始時間","終了時間","算定時間","滞在時間","送迎(住)","送迎(便)","備考"]];
    targetChildren.forEach(child => {
      for (let d = 1; d <= daysInMon; d++) {
        const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const dow = getDow(year, month, d);
        const linked = deriveJisseki(dateStr, child.id, schedule);
        const ov     = overrides[`${child.id}-${year}-${month}-${d}`]||{};
        const hasLinked = linked.startTime||linked.endTime;
        const attend = ov.attend!==undefined?ov.attend:(hasLinked?"present":"");
        const s = ov.timeStart||linked.startTime||"";
        const e = ov.timeEnd  ||linked.endTime  ||"";
        if (attend==="present"||s||e) {
          rows.push([child.name,d,dow,attend==="present"?"○":"×",s,e,calcSantei(s,e),calcZaitai(s,e),
            (ov.soJu!==undefined?ov.soJu:linked.soJu)?"1":"",
            (ov.soBin!==undefined?ov.soBin:linked.soBin)?"1":"",ov.note||""]);
        }
      }
    });
    downloadCSV(rows, `実績記録_令和${year-2018}年${month}月.csv`);
  };

  // 個人記録 Excel
  const exportKojinXLSX = (year, month, childId) => {
    const wb = XLSX.utils.book_new();
    const daysInMon = getDaysInMonth(year, month);
    const getAttIds = (y,m,d) => {
      const ds=`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const ids=new Set();
      ["mukae","okuri"].forEach(dir=>(schedule[`${ds}-${dir}`]||[]).forEach(bin=>bin.stops.forEach(s=>{if(s.type==="child"&&s.childId)ids.add(Number(s.childId));})));
      return [...ids];
    };
    const targetChildren = childId==="all"?children:children.filter(c=>c.id===Number(childId));
    targetChildren.forEach(child => {
      const ws = {};
      const R = (r,c) => XLSX.utils.encode_cell({r,c});
      const COLS = 9;
      let row = 0;
      ws[R(row,0)]=xlCell(`個人記録　${child.name}　令和${year-2018}年${month}月　${JIGYOSHO_NAME}`,{bold:true,sz:11,fill:"805ad5",color:"FFFFFF",align:"left"});
      for(let c=1;c<COLS;c++) ws[R(row,c)]=xlCell("",{fill:"805ad5",color:"FFFFFF"});
      row++;
      const hdrs=["日","曜","利用時間","今日の様子","活動内容","関わり方","家庭・学校連絡","その他","出来事"];
      hdrs.forEach((h,c)=>ws[R(row,c)]=xlHdr(h,"553c9a"));
      row++;
      for (let d = 1; d <= daysInMon; d++) {
        const ids = getAttIds(year,month,d);
        if (!ids.includes(child.id)) continue;
        const kr  = getKR(child.id,year,month,d);
        const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const jLink=deriveJisseki(dateStr,child.id,schedule);
        const jOv=overrides[`${child.id}-${year}-${month}-${d}`]||{};
        const s=jOv.timeStart||jLink.startTime||"";
        const e=jOv.timeEnd  ||jLink.endTime  ||"";
        const dow=getDow(year,month,d);
        const wkend=isWeekend(year,month,d);
        const fill=wkend?"fff8f0":undefined;
        const events=(kr.events||[]).map(ev=>`${ev.time||""}${ev.category?"["+ev.category+"]":""}${ev.memo||""}`).join(" / ");
        ws[R(row,0)]=xlCell(d,{bold:true,fill});
        ws[R(row,1)]=xlCell(dow,{color:dow==="日"?"e53e3e":dow==="土"?"3182ce":"000000",fill});
        ws[R(row,2)]=xlCell(s&&e?`${s}〜${e}`:"",{fill});
        ws[R(row,3)]=xlCell((kr.yousu||[]).join("・"),{align:"left",fill,wrap:true});
        ws[R(row,4)]=xlCell((kr.what||[]).join("・"),{align:"left",fill,wrap:true});
        ws[R(row,5)]=xlCell((kr.how||[]).join("・"),{align:"left",fill,wrap:true});
        ws[R(row,6)]=xlCell(kr.renraku||"",{align:"left",fill,wrap:true});
        ws[R(row,7)]=xlCell(kr.sonota||"",{align:"left",fill,wrap:true});
        ws[R(row,8)]=xlCell(events,{align:"left",fill,wrap:true});
        row++;
      }
      ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:row-1,c:COLS-1}});
      ws["!cols"]=[{wch:4},{wch:4},{wch:12},{wch:24},{wch:18},{wch:14},{wch:20},{wch:14},{wch:28}];
      ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:COLS-1}}];
      XLSX.utils.book_append_sheet(wb,ws,child.name.slice(0,31));
    });
    XLSX.writeFile(wb,`個人記録_令和${year-2018}年${month}月.xlsx`);
  };

  // 個人記録 CSV
  const exportKojinCSV = (year, month, childId) => {
    const daysInMon = getDaysInMonth(year, month);
    const getAttIds = (y,m,d) => {
      const ds=`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const ids=new Set();
      ["mukae","okuri"].forEach(dir=>(schedule[`${ds}-${dir}`]||[]).forEach(bin=>bin.stops.forEach(s=>{if(s.type==="child"&&s.childId)ids.add(Number(s.childId));})));
      return [...ids];
    };
    const targetChildren = childId==="all"?children:children.filter(c=>c.id===Number(childId));
    const rows=[["氏名","日","曜","時間","今日の様子","活動内容","関わり方","家庭・学校連絡","その他","出来事"]];
    targetChildren.forEach(child=>{
      for(let d=1;d<=daysInMon;d++){
        if(!getAttIds(year,month,d).includes(child.id))continue;
        const kr=getKR(child.id,year,month,d);
        const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const jLink=deriveJisseki(dateStr,child.id,schedule);
        const jOv=overrides[`${child.id}-${year}-${month}-${d}`]||{};
        const s=jOv.timeStart||jLink.startTime||"";
        const e=jOv.timeEnd  ||jLink.endTime  ||"";
        const events=(kr.events||[]).map(ev=>`${ev.time||""}${ev.category?"["+ev.category+"]":""}${ev.memo||""}`).join(" / ");
        rows.push([child.name,d,getDow(year,month,d),s&&e?`${s}〜${e}`:"",
          (kr.yousu||[]).join("・"),(kr.what||[]).join("・"),(kr.how||[]).join("・"),
          kr.renraku||"",kr.sonota||"",events]);
      }
    });
    downloadCSV(rows,`個人記録_令和${year-2018}年${month}月.csv`);
  };

  // 乗降記録 Excel
  const exportJokoXLSX = (year, month) => {
    const wb = XLSX.utils.book_new();
    const daysInMon = getDaysInMonth(year, month);
    const ws = {};
    const R = (r,c) => XLSX.utils.encode_cell({r,c});
    const COLS = 12;
    let row = 0;
    ws[R(row,0)]=xlCell(`乗降記録　令和${year-2018}年${month}月　${JIGYOSHO_NAME}`,{bold:true,sz:11,fill:"319795",color:"FFFFFF",align:"left"});
    for(let c=1;c<COLS;c++) ws[R(row,c)]=xlCell("",{fill:"319795",color:"FFFFFF"});
    row++;
    const hdrs=["日付","曜日","区分","便","車種","運転者","お子さん","乗車時刻","乗車場所","降車時刻","降車場所","確認"];
    hdrs.forEach((h,c)=>ws[R(row,c)]=xlHdr(h,"276749"));
    row++;
    for(let d=1;d<=daysInMon;d++){
      const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow=getDow(year,month,d);
      const wkend=isWeekend(year,month,d);
      const fill=wkend?"fff8f0":undefined;
      const jokoRows=getJokoData(dateStr);
      jokoRows.forEach(jrow=>{
        const dowColor=dow==="日"?"e53e3e":dow==="土"?"3182ce":"000000";
        ws[R(row,0)]=xlCell(`${month}/${d}`,{bold:true,fill});
        ws[R(row,1)]=xlCell(dow,{color:dowColor,fill});
        ws[R(row,2)]=xlCell(jrow.dir==="mukae"?"迎え":"送り",{fill:jrow.dir==="mukae"?"fff3e0":"ebf8ff"});
        ws[R(row,3)]=xlCell(`${jrow.binNo}便`,{fill});
        ws[R(row,4)]=xlCell(jrow.car?.name||"",{align:"left",fill});
        ws[R(row,5)]=xlCell(jrow.driver,{fill});
        ws[R(row,6)]=xlCell(jrow.child.name,{bold:true,align:"left",fill});
        ws[R(row,7)]=xlCell(jrow.joTime,{fill});
        ws[R(row,8)]=xlCell(jrow.joBasho,{fill});
        ws[R(row,9)]=xlCell(jrow.koTime,{fill});
        ws[R(row,10)]=xlCell(jrow.koBasho,{fill});
        ws[R(row,11)]=xlCell(jrow.signed?"㊞":"",{fill});
        row++;
      });
    }
    ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:row-1,c:COLS-1}});
    ws["!cols"]=[{wch:8},{wch:6},{wch:6},{wch:6},{wch:14},{wch:8},{wch:14},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8}];
    ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:COLS-1}}];
    XLSX.utils.book_append_sheet(wb,ws,"乗降記録");
    XLSX.writeFile(wb,`乗降記録_令和${year-2018}年${month}月.xlsx`);
  };

  // 乗降記録 CSV
  const exportJokoCSV = (year, month) => {
    const daysInMon = getDaysInMonth(year, month);
    const rows=[["日付","曜日","区分","便","車種","運転者","お子さん","乗車時刻","乗車場所","降車時刻","降車場所","確認"]];
    for(let d=1;d<=daysInMon;d++){
      const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow=getDow(year,month,d);
      getJokoData(dateStr).forEach(row=>{
        rows.push([`${month}/${d}`,dow,row.dir==="mukae"?"迎え":"送り",`${row.binNo}便`,
          row.car?.name||"",row.driver,row.child.name,row.joTime,row.joBasho,row.koTime,row.koBasho,row.signed?"確認済":""]);
      });
    }
    downloadCSV(rows,`乗降記録_令和${year-2018}年${month}月.csv`);
  };

  // 業務日誌 Excel
  const exportGyomuXLSX = (year, month) => {
    const wb = XLSX.utils.book_new();
    const daysInMon = getDaysInMonth(year, month);
    const ws = {};
    const R = (r,c) => XLSX.utils.encode_cell({r,c});
    const COLS = 9;
    let row = 0;
    ws[R(row,0)]=xlCell(`業務日誌　令和${year-2018}年${month}月　${JIGYOSHO_NAME}`,{bold:true,sz:11,fill:"744210",color:"FFFFFF",align:"left"});
    for(let c=1;c<COLS;c++) ws[R(row,c)]=xlCell("",{fill:"744210",color:"FFFFFF"});
    row++;
    const hdrs=["日付","曜日","天気","出勤スタッフ","利用者数","活動内容","全体の様子","事故等","申し送り"];
    hdrs.forEach((h,c)=>ws[R(row,c)]=xlHdr(h,"92400e"));
    row++;
    for(let d=1;d<=daysInMon;d++){
      const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow=getDow(year,month,d);
      const wkend=isWeekend(year,month,d);
      const gr=gyomuRecords[dateStr]||{};
      if(!gr.shukkin&&!gr.zentai) continue;
      const fill=wkend?"fff8f0":undefined;
      const shukkinNames=(gr.shukkin||[]).map(id=>staff.find(s=>s.id===id)?.name||"").join("・");
      ws[R(row,0)]=xlCell(`${month}/${d}`,{bold:true,fill});
      ws[R(row,1)]=xlCell(dow,{color:dow==="日"?"e53e3e":dow==="土"?"3182ce":"000000",fill});
      ws[R(row,2)]=xlCell(gr.tenki||"",{fill});
      ws[R(row,3)]=xlCell(shukkinNames,{align:"left",fill});
      ws[R(row,4)]=xlCell(gr.riyo_count||"",{fill});
      ws[R(row,5)]=xlCell((gr.katsudo||[]).join("・"),{align:"left",fill,wrap:true});
      ws[R(row,6)]=xlCell(gr.zentai||"",{align:"left",fill,wrap:true});
      ws[R(row,7)]=xlCell(gr.jiko||"",{align:"left",fill,wrap:true});
      ws[R(row,8)]=xlCell(gr.moshiokuri||"",{align:"left",fill,wrap:true});
      row++;
    }
    ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:row-1,c:COLS-1}});
    ws["!cols"]=[{wch:8},{wch:6},{wch:6},{wch:20},{wch:8},{wch:24},{wch:30},{wch:12},{wch:30}];
    ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:COLS-1}}];
    XLSX.utils.book_append_sheet(wb,ws,"業務日誌");
    XLSX.writeFile(wb,`業務日誌_令和${year-2018}年${month}月.xlsx`);
  };

  // 業務日誌 CSV
  const exportGyomuCSV = (year, month) => {
    const daysInMon = getDaysInMonth(year, month);
    const rows=[["日付","曜日","天気","出勤スタッフ","利用者数","活動内容","全体の様子","事故等","申し送り"]];
    for(let d=1;d<=daysInMon;d++){
      const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow=getDow(year,month,d);
      const gr=gyomuRecords[dateStr]||{};
      if(!gr.shukkin&&!gr.zentai) continue;
      const shukkinNames=(gr.shukkin||[]).map(id=>staff.find(s=>s.id===id)?.name||"").join("・");
      rows.push([`${month}/${d}`,dow,gr.tenki||"",shukkinNames,gr.riyo_count||"",
        (gr.katsudo||[]).join("・"),gr.zentai||"",gr.jiko||"",gr.moshiokuri||""]);
    }
    downloadCSV(rows,`業務日誌_令和${year-2018}年${month}月.csv`);
  };

  // 采配簿 Excel
  const exportSaibaiXLSX = (year, month) => {
    const wb = XLSX.utils.book_new();
    const daysInMon = getDaysInMonth(year, month);
    const COLS = 3 + staff.length;
    const ws = {};
    const R = (r,c) => XLSX.utils.encode_cell({r,c});
    let row = 0;
    ws[R(row,0)]=xlCell(`采配簿　令和${year-2018}年${month}月　${JIGYOSHO_NAME}`,{bold:true,sz:11,fill:"2b6cb0",color:"FFFFFF",align:"left"});
    for(let c=1;c<COLS;c++) ws[R(row,c)]=xlCell("",{fill:"2b6cb0",color:"FFFFFF"});
    row++;
    const hdrs=["日","曜","🏫施設対応",...staff.map(s=>`🚗${s.name}`)];
    hdrs.forEach((h,c)=>ws[R(row,c)]=xlHdr(h,c===2?"276749":"2b6cb0"));
    row++;
    let totalFac=0; const staffTotals=staff.map(()=>0);
    for(let d=1;d<=daysInMon;d++){
      const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow=getDow(year,month,d);
      const wkend=isWeekend(year,month,d);
      const facMins=getFacilityMins(dateStr);
      totalFac+=facMins;
      const fill=wkend?"fff8f0":undefined;
      ws[R(row,0)]=xlCell(d,{bold:true,fill});
      ws[R(row,1)]=xlCell(dow,{color:dow==="日"?"e53e3e":dow==="土"?"3182ce":"000000",fill});
      ws[R(row,2)]=xlCell(facMins>0?minsToHHMM(facMins):"",{fill:facMins>0?"e8fff0":fill});
      staff.forEach((s,i)=>{
        const m=getDriverMins(s.id,dateStr);
        staffTotals[i]+=m;
        ws[R(row,3+i)]=xlCell(m>0?minsToHHMM(m):"",{fill:m>0?"dbeafe":fill});
      });
      row++;
    }
    // 合計行
    ws[R(row,0)]=xlCell("合計",{bold:true,fill:"f0f4f8"});
    ws[R(row,1)]=xlCell("",{fill:"f0f4f8"});
    ws[R(row,2)]=xlCell(minsToHHMM(totalFac),{bold:true,fill:"276749",color:"FFFFFF"});
    staff.forEach((_,i)=>ws[R(row,3+i)]=xlCell(minsToHHMM(staffTotals[i]),{bold:true,fill:"2b6cb0",color:"FFFFFF"}));
    row++;
    ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:row-1,c:COLS-1}});
    ws["!cols"]=[{wch:4},{wch:4},{wch:12},...staff.map(()=>({wch:12}))];
    ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:COLS-1}}];
    XLSX.utils.book_append_sheet(wb,ws,"采配簿");
    XLSX.writeFile(wb,`采配簿_令和${year-2018}年${month}月.xlsx`);
  };

  // ============================================================
  // テレッサ固定書式 Excel出力（業務実績簿・采配簿）
  // ============================================================

  // 時間をhh:mm文字列に変換（Excelのシリアル値ではなく文字列として扱う）
  const toTimeStr = (mins) => {
    if (!mins || mins === 0) return "0:00";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${String(m).padStart(2,"0")}`;
  };

  // セルスタイル定義
  const cellStyle = (opts = {}) => ({
    font: { name: "MS Gothic", sz: opts.sz || 8, bold: opts.bold || false, color: { rgb: opts.color || "000000" } },
    alignment: { horizontal: opts.align || "center", vertical: "center", wrapText: true },
    border: {
      top:    { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left:   { style: "thin", color: { rgb: "000000" } },
      right:  { style: "thin", color: { rgb: "000000" } },
    },
    fill: { patternType: "solid", fgColor: { rgb: opts.fill || "FFFFFF" }, bgColor: { rgb: "FFFFFF" } },
  });

  const makeCellObj = (v, opts = {}) => ({ v: v ?? "", t: typeof v === "number" ? "n" : "s", s: cellStyle(opts) });

  // 業務実績簿（テレッサ書式）Excel出力
  const exportTeresaXLSX = (year, month) => {
    const wb = XLSX.utils.book_new();
    const daysInMon = getDaysInMonth(year, month);

    // ── シート1：業務実績簿（利用者別算定時間） ──
    const ws1 = {};
    const R = (r, c) => XLSX.utils.encode_cell({ r, c });

    // 書式に合わせた色
    const HDR_BLUE  = "1a3a5c";
    const HDR_GOLD  = "c8a850";
    const ROW_YELLOW= "FFFACD";
    const ROW_CYAN  = "E0F7FF";
    const TOTAL_GRY = "F0F4F8";

    let row = 0;

    // タイトル行
    ws1[R(row,0)] = makeCellObj(`業務実績簿　令和${year-2018}年${month}月分　${JIGYOSHO_NAME}`, {bold:true, sz:11, fill:"1a3a5c", color:"FFFFFF", align:"left"});
    for(let c=1; c<=children.length*2+3; c++) ws1[R(row,c)] = makeCellObj("", {fill:"1a3a5c"});
    row++;

    // ヘッダー行1：区分
    ws1[R(row,0)] = makeCellObj("日", {bold:true, fill:HDR_BLUE, color:"FFFFFF"});
    ws1[R(row,1)] = makeCellObj("曜", {bold:true, fill:HDR_BLUE, color:"FFFFFF"});
    ws1[R(row,2)] = makeCellObj("利用者数", {bold:true, fill:HDR_GOLD});
    children.forEach((child, ci) => {
      ws1[R(row, 3 + ci*2)]   = makeCellObj(child.name, {bold:true, fill:HDR_GOLD, sz:8});
      ws1[R(row, 3 + ci*2+1)] = makeCellObj("", {fill:HDR_GOLD});
    });
    ws1[R(row, 3+children.length*2)] = makeCellObj("合計算定時間", {bold:true, fill:HDR_BLUE, color:"FFFFFF"});
    row++;

    // ヘッダー行2：詳細
    ws1[R(row,0)] = makeCellObj("", {fill:HDR_BLUE, color:"FFFFFF"});
    ws1[R(row,1)] = makeCellObj("", {fill:HDR_BLUE, color:"FFFFFF"});
    ws1[R(row,2)] = makeCellObj("(名)", {fill:HDR_GOLD, sz:7});
    children.forEach((child, ci) => {
      ws1[R(row, 3+ci*2)]   = makeCellObj("算定時間", {fill:HDR_GOLD, sz:7});
      ws1[R(row, 3+ci*2+1)] = makeCellObj("滞在時間", {fill:HDR_GOLD, sz:7});
    });
    ws1[R(row, 3+children.length*2)] = makeCellObj("(h:mm)", {fill:HDR_BLUE, color:"FFFFFF", sz:7});
    row++;

    // データ行（日付ごと）
    let totalRiyosha = 0;
    const childSanteiTotals = children.map(() => 0);
    const childZaitaiTotals = children.map(() => 0);
    let grandSanteiTotal = 0;

    for (let d = 1; d <= daysInMon; d++) {
      const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow = getDow(year, month, d);
      const wkend = isWeekend(year, month, d);
      const fillColor = dow === "日" ? "FFE0E0" : dow === "土" ? "E0E8FF" : wkend ? "F0F0F0" : "";

      // その日の出席者と時間を集計
      let riyoshaCount = 0;
      let daySanteiTotal = 0;
      const childData = children.map((child) => {
        const linked = deriveJisseki(dateStr, child.id, schedule);
        const ov = overrides[`${child.id}-${year}-${month}-${d}`] || {};
        const hasLinked = linked.startTime || linked.endTime;
        const attend = ov.attend !== undefined ? ov.attend : (hasLinked ? "present" : "");
        if (attend !== "present") return { santei: "", zaitai: "" };
        const s = ov.timeStart || linked.startTime || "";
        const e = ov.timeEnd   || linked.endTime   || "";
        const santeiStr = calcSantei(s, e);
        const zaitaiStr = calcZaitai(s, e);
        const santeiMins = santeiStr ? parseFloat(santeiStr) * 60 : 0;
        const zaitaiMins = zaitaiStr ? (() => { const [h,m]=zaitaiStr.split(":").map(Number); return h*60+m; })() : 0;
        riyoshaCount++;
        daySanteiTotal += santeiMins;
        return { santei: santeiStr, zaitai: zaitaiStr, santeiMins, zaitaiMins };
      });

      childData.forEach((cd, ci) => {
        if (cd.santeiMins) childSanteiTotals[ci] += cd.santeiMins;
        if (cd.zaitaiMins) childZaitaiTotals[ci] += cd.zaitaiMins;
      });
      totalRiyosha += riyoshaCount;
      grandSanteiTotal += daySanteiTotal;

      const rf = fillColor || "";
      ws1[R(row,0)] = makeCellObj(d, {bold: riyoshaCount>0, fill: rf || undefined});
      ws1[R(row,1)] = makeCellObj(dow, {fill: rf || undefined});
      ws1[R(row,2)] = makeCellObj(riyoshaCount > 0 ? riyoshaCount : "", {fill: riyoshaCount>0 ? ROW_YELLOW : rf || undefined});
      childData.forEach((cd, ci) => {
        const cf = cd.santei ? ROW_CYAN : rf || undefined;
        ws1[R(row, 3+ci*2)]   = makeCellObj(cd.santei || "", {fill: cf});
        ws1[R(row, 3+ci*2+1)] = makeCellObj(cd.zaitai || "", {fill: cf});
      });
      ws1[R(row, 3+children.length*2)] = makeCellObj(
        daySanteiTotal > 0 ? toTimeStr(daySanteiTotal) : "",
        {bold: daySanteiTotal>0, fill: daySanteiTotal>0 ? ROW_YELLOW : rf || undefined}
      );
      row++;
    }

    // 合計行
    ws1[R(row,0)] = makeCellObj("合計", {bold:true, fill:TOTAL_GRY});
    ws1[R(row,1)] = makeCellObj("", {fill:TOTAL_GRY});
    ws1[R(row,2)] = makeCellObj(totalRiyosha, {bold:true, fill:HDR_GOLD});
    children.forEach((_,ci) => {
      ws1[R(row,3+ci*2)]   = makeCellObj(toTimeStr(childSanteiTotals[ci]), {bold:true, fill:HDR_GOLD});
      ws1[R(row,3+ci*2+1)] = makeCellObj(toTimeStr(childZaitaiTotals[ci]), {bold:true, fill:HDR_GOLD});
    });
    ws1[R(row, 3+children.length*2)] = makeCellObj(toTimeStr(grandSanteiTotal), {bold:true, fill:HDR_BLUE, color:"FFFFFF"});
    row++;

    // 列幅
    ws1["!cols"] = [
      {wch:4},{wch:4},{wch:8},
      ...children.flatMap(()=>[{wch:8},{wch:8}]),
      {wch:10}
    ];
    ws1["!ref"] = XLSX.utils.encode_range({s:{r:0,c:0}, e:{r:row-1,c:3+children.length*2}});
    ws1["!rows"] = [{hpt:20},...Array(row-1).fill({hpt:15})];

    XLSX.utils.book_append_sheet(wb, ws1, "業務実績簿");

    // ── シート2：采配簿（スタッフ別ドライバー・施設時間） ──
    const ws2 = {};
    let row2 = 0;

    // タイトル
    ws2[R(row2,0)] = makeCellObj(`采配簿　令和${year-2018}年${month}月分　${JIGYOSHO_NAME}`, {bold:true, sz:11, fill:HDR_BLUE, color:"FFFFFF", align:"left"});
    for(let c=1; c<=staff.length*2+3; c++) ws2[R(row2,c)] = makeCellObj("", {fill:HDR_BLUE});
    row2++;

    // ヘッダー1
    ws2[R(row2,0)] = makeCellObj("日",{bold:true,fill:HDR_BLUE,color:"FFFFFF"});
    ws2[R(row2,1)] = makeCellObj("曜",{bold:true,fill:HDR_BLUE,color:"FFFFFF"});
    ws2[R(row2,2)] = makeCellObj("施設対応時間",{bold:true,fill:"276749",color:"FFFFFF"});
    staff.forEach((s,si) => {
      ws2[R(row2,3+si*2)]   = makeCellObj(s.name,{bold:true,fill:"2b6cb0",color:"FFFFFF",sz:8});
      ws2[R(row2,3+si*2+1)] = makeCellObj("",{fill:"2b6cb0",color:"FFFFFF"});
    });
    ws2[R(row2,3+staff.length*2)] = makeCellObj("合計",{bold:true,fill:HDR_BLUE,color:"FFFFFF"});
    row2++;

    // ヘッダー2
    ws2[R(row2,0)] = makeCellObj("",{fill:HDR_BLUE,color:"FFFFFF"});
    ws2[R(row2,1)] = makeCellObj("",{fill:HDR_BLUE,color:"FFFFFF"});
    ws2[R(row2,2)] = makeCellObj("(h:mm)",{fill:"276749",color:"FFFFFF",sz:7});
    staff.forEach((_,si) => {
      ws2[R(row2,3+si*2)]   = makeCellObj("運転時間",{fill:"2b6cb0",color:"FFFFFF",sz:7});
      ws2[R(row2,3+si*2+1)] = makeCellObj("施設時間",{fill:"2b6cb0",color:"FFFFFF",sz:7});
    });
    ws2[R(row2,3+staff.length*2)] = makeCellObj("(h:mm)",{fill:HDR_BLUE,color:"FFFFFF",sz:7});
    row2++;

    let totalFac2 = 0;
    const staffDriveTotals = staff.map(()=>0);
    const staffFacTotals   = staff.map(()=>0);

    for(let d=1;d<=daysInMon;d++){
      const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow=getDow(year,month,d);
      const wkend=isWeekend(year,month,d);
      const fillColor2 = dow==="日"?"FFE0E0":dow==="土"?"E0E8FF":"";
      const facMins=getFacilityMins(dateStr);
      totalFac2+=facMins;

      ws2[R(row2,0)] = makeCellObj(d,{fill:fillColor2||undefined});
      ws2[R(row2,1)] = makeCellObj(dow,{fill:fillColor2||undefined});
      ws2[R(row2,2)] = makeCellObj(facMins>0?toTimeStr(facMins):"",{fill:facMins>0?"E0FFE8":fillColor2||undefined,bold:facMins>0});

      let rowTotal=0;
      staff.forEach((s,si)=>{
        const driveMins=getDriverMins(s.id,dateStr);
        staffDriveTotals[si]+=driveMins;
        staffFacTotals[si]+=facMins;
        rowTotal+=driveMins;
        ws2[R(row2,3+si*2)]   = makeCellObj(driveMins>0?toTimeStr(driveMins):"",{fill:driveMins>0?"DBEAFE":fillColor2||undefined});
        ws2[R(row2,3+si*2+1)] = makeCellObj(facMins>0?toTimeStr(facMins):"",{fill:facMins>0?"DCFCE7":fillColor2||undefined});
      });
      ws2[R(row2,3+staff.length*2)] = makeCellObj(rowTotal+facMins>0?toTimeStr(rowTotal+facMins):"",{bold:true,fill:rowTotal+facMins>0?ROW_YELLOW:undefined});
      row2++;
    }

    // 合計行
    ws2[R(row2,0)] = makeCellObj("合計",{bold:true,fill:TOTAL_GRY});
    ws2[R(row2,1)] = makeCellObj("",{fill:TOTAL_GRY});
    ws2[R(row2,2)] = makeCellObj(toTimeStr(totalFac2),{bold:true,fill:"276749",color:"FFFFFF"});
    staff.forEach((_,si)=>{
      ws2[R(row2,3+si*2)]   = makeCellObj(toTimeStr(staffDriveTotals[si]),{bold:true,fill:"2b6cb0",color:"FFFFFF"});
      ws2[R(row2,3+si*2+1)] = makeCellObj(toTimeStr(staffFacTotals[si]),{bold:true,fill:"2b6cb0",color:"FFFFFF"});
    });
    ws2[R(row2,3+staff.length*2)] = makeCellObj(
      toTimeStr(totalFac2+staffDriveTotals.reduce((a,b)=>a+b,0)),
      {bold:true,fill:HDR_BLUE,color:"FFFFFF"}
    );
    row2++;

    ws2["!cols"]=[{wch:4},{wch:4},{wch:10},...staff.flatMap(()=>[{wch:9},{wch:9}]),{wch:10}];
    ws2["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:row2-1,c:3+staff.length*2}});
    ws2["!rows"]=[{hpt:20},...Array(row2-1).fill({hpt:15})];

    XLSX.utils.book_append_sheet(wb, ws2, "采配簿");

    XLSX.writeFile(wb, `業務実績簿_令和${year-2018}年${month}月.xlsx`);
  };

  // 采配簿 CSV
  const exportSaibaiCSV = (year, month) => {
    const daysInMon = getDaysInMonth(year, month);
    const rows=[["日","曜","施設対応時間",...staff.map(s=>`ドライバー_${s.name}`)]];
    for(let d=1;d<=daysInMon;d++){
      const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const facMins=getFacilityMins(dateStr);
      rows.push([d,getDow(year,month,d),minsToHHMM(facMins),...staff.map(s=>minsToHHMM(getDriverMins(s.id,dateStr)))]);
    }
    downloadCSV(rows,`采配簿_令和${year-2018}年${month}月.csv`);
  };

  // ============================================================
  // PDF印刷関数（印刷用HTMLを新しいウィンドウで開く）
  // ============================================================

  const printHTML = (html, title) => {
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html lang="ja"><head>
      <meta charset="UTF-8"/>
      <title>${title}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Noto Sans JP',sans-serif;font-size:10px;color:#000;background:white;}
        @page{size:A4 portrait;margin:12mm 10mm;}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
        table{width:100%;border-collapse:collapse;}
        th,td{border:1px solid #333;padding:3px 4px;text-align:center;vertical-align:middle;font-size:9px;}
        th{background:#1a3a5c;color:white;font-weight:700;}
        .page-break{page-break-before:always;}
        .title{font-size:14px;font-weight:700;text-align:center;margin-bottom:6px;padding-bottom:4px;border-bottom:2px solid #1a3a5c;}
        .sub-title{font-size:11px;font-weight:700;margin:8px 0 4px;color:#1a3a5c;}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;font-size:9px;}
        .info-row{display:flex;gap:4px;}
        .info-label{color:#666;min-width:80px;}
        .info-val{font-weight:700;}
        .tag{display:inline-block;background:#eee;border-radius:3px;padding:1px 4px;margin:1px;font-size:8px;}
        .present{background:#e6ffe6;}.absent{background:#fff0f0;}
        .drive-col{background:#e8f4ff;}.fac-col{background:#e8fff0;}
        .week-sat{background:#f0f8ff;}.week-sun{background:#fff0f0;}
        .section{margin-bottom:10px;}
        .section-label{font-size:9px;font-weight:700;color:#1a3a5c;border-bottom:1px solid #ccc;margin-bottom:3px;padding-bottom:2px;}
        .memo-box{border:1px solid #ccc;min-height:18px;padding:2px 4px;font-size:9px;width:100%;}
        .sign-box{border:1px solid #999;width:40px;height:20px;display:inline-block;}
        h2{font-size:12px;font-weight:700;margin:10px 0 4px;padding:3px 8px;background:#1a3a5c;color:white;}
      </style>
    </head><body>${html}<script>window.onload=()=>{window.print();}<\/script></body></html>`);
    win.document.close();
  };

  // 送迎表 PDF（日付指定）
  const printSougei = (year, month) => {
    const daysInMon = getDaysInMonth(year, month);
    let html = `<div class="title">送迎表　令和${year-2018}年${month}月　${JIGYOSHO_NAME}</div>`;
    for (let d = 1; d <= daysInMon; d++) {
      const dateStr = `${year}-${String(month).padStart(2,"00")}-${String(d).padStart(2,"00")}`;
      const dow = getDow(year,month,d);
      const mukaeBins = schedule[`${dateStr}-mukae`]||[];
      const okuriBins = schedule[`${dateStr}-okuri`]||[];
      if (!mukaeBins.length && !okuriBins.length) continue;
      html += `${d>1?'<div class="page-break"></div>':''}
        <div class="title" style="font-size:12px;">${month}月${d}日（${dow}）</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">`;
      ["mukae","okuri"].forEach(dir => {
        const bins = schedule[`${dateStr}-${dir}`]||[];
        html += `<div><div class="sub-title">${dir==="mukae"?"🏠→🏫 迎え（行き）":"🏫→🏠 送り（帰り）"}</div>`;
        if (!bins.length) { html += `<p style="color:#999;font-size:9px;">データなし</p>`; }
        bins.forEach((bin,bi) => {
          const car    = cars.find(c=>c.id===Number(bin.carId))?.name||"未設定";
          const driver = staff.find(s=>s.id===Number(bin.driverId))?.name||"—";
          const joshu  = staff.find(s=>s.id===Number(bin.joshuId))?.name||"—";
          html += `<table style="margin-bottom:6px;">
            <tr><th colspan="3" style="text-align:left;padding:3px 6px;">第${bi+1}便　🚗${car}　運転：${driver}　同乗：${joshu}</th></tr>
            <tr><th style="width:50px;">時刻</th><th>お子さん・場所</th><th style="width:40px;">確認</th></tr>`;
          bin.stops.forEach(stop => {
            if (stop.type==="base") {
              html += `<tr style="background:#fff3e0;"><td>${stop.time||"—"}</td><td style="font-weight:700;">🏫 ${JIGYOSHO}</td><td></td></tr>`;
            } else if (stop.type==="child"&&stop.childId) {
              const cn = children.find(c=>c.id===Number(stop.childId))?.name||"";
              html += `<tr><td>${stop.time||"—"}</td><td>${cn}　${stop.basho||""}</td><td><span class="sign-box"></span></td></tr>`;
            }
          });
          html += `</table>`;
        });
        html += `</div>`;
      });
      html += `</div>`;
    }
    printHTML(html, `送迎表_令和${year-2018}年${month}月`);
  };

  // 実績記録 PDF
  const printJisseki = (year, month, childId) => {
    const daysInMon = getDaysInMonth(year, month);
    const targets = childId==="all"?children:children.filter(c=>c.id===Number(childId));
    let html = "";
    targets.forEach((child,ci) => {
      html += `${ci>0?'<div class="page-break"></div>':''}
        <div class="title">放課後等デイサービス提供実績記録票　令和${year-2018}年${month}月分</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">受給者証番号：</span><span class="info-val">${child.jukyuNo||""}</span></div>
          <div class="info-row"><span class="info-label">事業所番号：</span><span class="info-val">${JIGYOSHO_NO}</span></div>
          <div class="info-row"><span class="info-label">給付決定保護者氏名：</span><span class="info-val">${child.name}</span></div>
          <div class="info-row"><span class="info-label">事業所名：</span><span class="info-val">${JIGYOSHO_NAME}</span></div>
          <div class="info-row"><span class="info-label">契約支給量：</span><span class="info-val">${child.keiyakuDays}日/月</span></div>
          <div class="info-row"><span class="info-label">区分：</span><span class="info-val">${child.kubun}</span></div>
        </div>
        <table>
          <tr>
            <th rowspan="2">日</th><th rowspan="2">曜</th>
            <th colspan="5">サービス提供実績</th>
            <th colspan="2">送迎</th>
            <th rowspan="2">家族<br>支援</th><th rowspan="2">延長<br>支援</th>
            <th rowspan="2">保護者<br>確認</th><th rowspan="2">備考</th>
          </tr>
          <tr>
            <th>状況</th><th>形態</th><th>区分</th>
            <th style="width:48px;">開始</th><th style="width:48px;">終了</th>
            <th>住</th><th>便</th>
          </tr>`;
      let presentCount=0;
      for (let d=1;d<=daysInMon;d++) {
        const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const dow=getDow(year,month,d);
        const wkend=isWeekend(year,month,d);
        const linked=deriveJisseki(dateStr,child.id,schedule);
        const ov=overrides[`${child.id}-${year}-${month}-${d}`]||{};
        const hasLinked=linked.startTime||linked.endTime;
        const attend=ov.attend!==undefined?ov.attend:(hasLinked?"present":"");
        const s=ov.timeStart||linked.startTime||"";
        const e=ov.timeEnd||linked.endTime||"";
        if(attend==="present") presentCount++;
        const dowCls=dow==="日"?"week-sun":dow==="土"?"week-sat":"";
        const rowBg=attend==="present"?"#f0fff0":attend==="absent"?"#fff5f5":wkend?"#fef9f0":"";
        html+=`<tr style="background:${rowBg}">
          <td class="${dowCls}" style="font-weight:600;">${d}</td>
          <td class="${dowCls}">${dow}</td>
          <td>${attend==="present"?"○":attend==="absent"?"×":""}</td>
          <td>${ov.keitai||"1"}</td><td>${ov.kubun||child.kubun||"2"}</td>
          <td>${s}</td><td>${e}</td>
          <td>${(ov.soJu!==undefined?ov.soJu:linked.soJu)?"1":""}</td>
          <td>${(ov.soBin!==undefined?ov.soBin:linked.soBin)?"1":""}</td>
          <td>${ov.kazoku?"✓":""}</td><td>${ov.enchyo?"✓":""}</td>
          <td><span class="sign-box"></span></td>
          <td style="text-align:left;">${ov.note||""}</td>
        </tr>`;
      }
      html+=`<tr style="font-weight:700;background:#f0f4f8;">
        <td colspan="2">合計</td>
        <td>${presentCount}日</td>
        <td colspan="10"></td>
      </tr></table>`;
    });
    printHTML(html, `実績記録_令和${year-2018}年${month}月`);
  };

  // 個人記録 PDF
  const printKojin = (year, month, childId) => {
    const daysInMon = getDaysInMonth(year, month);
    const getAttIds = (y,m,d) => {
      const ds=`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const ids=new Set();
      ["mukae","okuri"].forEach(dir=>(schedule[`${ds}-${dir}`]||[]).forEach(bin=>bin.stops.forEach(s=>{if(s.type==="child"&&s.childId)ids.add(Number(s.childId));})));
      return [...ids];
    };
    let html = `<div class="title">個人記録　令和${year-2018}年${month}月　${JIGYOSHO_NAME}</div>`;
    for (let d=1;d<=daysInMon;d++) {
      const ids = getAttIds(year,month,d);
      if (!ids.length) continue;
      const targets = childId==="all" ? ids : ids.filter(id=>id===Number(childId));
      if (!targets.length) continue;
      const dow=getDow(year,month,d);
      html+=`<div style="margin-top:8px;border:1.5px solid #1a3a5c;border-radius:4px;overflow:hidden;">
        <div style="background:#1a3a5c;color:white;padding:4px 8px;font-size:10px;font-weight:700;">
          ${month}月${d}日（${dow}）　利用者${targets.length}名
        </div>
        <table style="margin:0;">
          <tr>
            <th style="width:70px;">氏名</th>
            <th style="width:60px;">時間</th>
            <th>今日の様子・活動</th>
            <th>家庭・学校より連絡</th>
            <th>その他</th>
          </tr>`;
      targets.forEach(cid => {
        const child=children.find(c=>c.id===cid);
        const kr=getKR(cid,year,month,d);
        const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const jLink=deriveJisseki(dateStr,cid,schedule);
        const jOv=overrides[`${cid}-${year}-${month}-${d}`]||{};
        const s=jOv.timeStart||jLink.startTime||"";
        const e=jOv.timeEnd||jLink.endTime||"";
        const yousu=[...(kr.yousu||[]),...(kr.what||[])].join("・");
        const events=(kr.events||[]).map(ev=>`${ev.time||""}${ev.category?"["+ev.category+"]":""}${ev.memo||""}`).join(" / ");
        html+=`<tr>
          <td style="font-weight:700;text-align:left;padding:3px 4px;">${child?.name||"?"}</td>
          <td style="font-size:8px;">${s&&e?`${s}〜${e}`:""}</td>
          <td style="text-align:left;min-height:22px;">${yousu}${kr.yousuMemo?`<br><span style="font-size:8px;color:#444;">${kr.yousuMemo}</span>`:""}${events?`<br><span style="font-size:8px;color:#805ad5;">${events}</span>`:""}</td>
          <td style="text-align:left;">${kr.renraku||""}</td>
          <td style="text-align:left;">${kr.sonota||""}</td>
        </tr>`;
      });
      html+=`</table></div>`;
    }
    printHTML(html, `個人記録_令和${year-2018}年${month}月`);
  };

  // 乗降記録 PDF
  const printJoko = (year, month) => {
    const daysInMon = getDaysInMonth(year, month);
    let html=`<div class="title">乗降記録　令和${year-2018}年${month}月　${JIGYOSHO_NAME}</div>
      <table>
        <tr>
          <th>日付</th><th>曜</th><th>区分</th><th>便</th><th>車種</th>
          <th>運転者</th><th>お子さん</th>
          <th>乗車時刻</th><th>乗車場所</th>
          <th>降車時刻</th><th>降車場所</th><th>確認</th>
        </tr>`;
    for(let d=1;d<=daysInMon;d++){
      const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow=getDow(year,month,d);
      const rows=getJokoData(dateStr);
      rows.forEach(row=>{
        const dowCls=dow==="日"?"week-sun":dow==="土"?"week-sat":"";
        html+=`<tr class="${dowCls}">
          <td style="font-weight:600;">${month}/${d}</td><td>${dow}</td>
          <td>${row.dir==="mukae"?"迎え":"送り"}</td>
          <td>${row.binNo}便</td><td>${row.car?.name||""}</td>
          <td>${row.driver||""}</td>
          <td style="font-weight:700;">${row.child.name}</td>
          <td>${row.joTime||""}</td><td>${row.joBasho||""}</td>
          <td>${row.koTime||""}</td><td>${row.koBasho||""}</td>
          <td><span class="sign-box"></span></td>
        </tr>`;
      });
    }
    html+=`</table>`;
    printHTML(html, `乗降記録_令和${year-2018}年${month}月`);
  };

  // 業務日誌 PDF
  const printGyomu = (year, month) => {
    const daysInMon = getDaysInMonth(year, month);
    let html="";
    for(let d=1;d<=daysInMon;d++){
      const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow=getDow(year,month,d);
      const gr=gyomuRecords[dateStr]||{};
      if(!gr.shukkin&&!gr.zentai&&!gr.katsudo) continue;
      const shukkinNames=(gr.shukkin||[]).map(id=>staff.find(s=>s.id===id)?.name||"").join("　");
      const attendIds=new Set();
      ["mukae","okuri"].forEach(dir=>(schedule[`${dateStr}-${dir}`]||[]).forEach(bin=>bin.stops.forEach(s=>{if(s.type==="child"&&s.childId)attendIds.add(Number(s.childId));})));
      const attendNames=children.filter(c=>attendIds.has(c.id)).map(c=>c.name).join("　");
      html+=`${d>1?'<div class="page-break"></div>':''}
        <div class="title">業務日誌　令和${year-2018}年${month}月${d}日（${dow}）　${JIGYOSHO_NAME}</div>
        <table style="margin-bottom:6px;">
          <tr><th style="width:100px;">出勤スタッフ</th><td style="text-align:left;">${shukkinNames||"—"}</td>
              <th style="width:80px;">天気</th><td style="width:60px;">${gr.tenki||""}</td></tr>
          <tr><th>本日の利用者</th><td colspan="3" style="text-align:left;">${attendNames||"—"}　（${attendIds.size}名）</td></tr>
          <tr><th>活動内容</th><td colspan="3" style="text-align:left;">${(gr.katsudo||[]).join("　")}</td></tr>
        </table>
        <div class="section"><div class="section-label">全体の様子・特記事項</div>
          <div class="memo-box" style="min-height:40px;">${gr.zentai||""}</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="section"><div class="section-label">事故・ヒヤリハット</div>
            <div class="memo-box" style="min-height:24px;">${gr.jiko||"なし"}${gr.jikoMemo?" / "+gr.jikoMemo:""}</div></div>
          <div class="section"><div class="section-label">会議・連絡対応</div>
            <div class="memo-box" style="min-height:24px;">${(gr.kaigi||[]).join("　")}${gr.kaigiMemo?" / "+gr.kaigiMemo:""}</div></div>
        </div>
        <div class="section"><div class="section-label">申し送り事項</div>
          <div class="memo-box" style="min-height:30px;">${gr.moshiokuri||""}</div></div>
        <table style="margin-top:6px;">
          <tr>
            <th style="width:80px;">記録者</th>
            <td style="width:100px;">${gr.kirokusha?staff.find(s=>s.id===Number(gr.kirokusha))?.name||"":""}</td>
            <th style="width:80px;">管理者確認</th>
            <td>${gr.kanri?staff.find(s=>s.id===Number(gr.kanri))?.name||"":""}</td>
            <th style="width:60px;">確認印</th>
            <td><span class="sign-box"></span></td>
          </tr>
        </table>`;
    }
    if(!html) html=`<p style="text-align:center;color:#999;margin-top:40px;">この月の業務日誌データがありません</p>`;
    printHTML(html, `業務日誌_令和${year-2018}年${month}月`);
  };

  // 采配簿 PDF
  const printSaibai = (year, month) => {
    const daysInMon = getDaysInMonth(year, month);
    let html=`<div class="title">采配簿（ドライバー・施設対応時間）　令和${year-2018}年${month}月　${JIGYOSHO_NAME}</div>
      <table>
        <tr>
          <th style="width:30px;">日</th>
          <th style="width:24px;">曜</th>
          <th class="fac-col">🏫 施設対応時間</th>
          ${staff.map(s=>`<th class="drive-col">🚗 ${s.name}</th>`).join("")}
        </tr>`;
    let totalFac=0; const sTotals=staff.map(()=>0);
    for(let d=1;d<=daysInMon;d++){
      const dateStr=`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dow=getDow(year,month,d);
      const wkend=isWeekend(year,month,d);
      const facMins=getFacilityMins(dateStr);
      totalFac+=facMins;
      const sMins=staff.map((s,i)=>{const m=getDriverMins(s.id,dateStr);sTotals[i]+=m;return m;});
      const dowCls=dow==="日"?"week-sun":dow==="土"?"week-sat":"";
      const bg=wkend?"#fef9f0":"";
      html+=`<tr style="background:${bg};">
        <td class="${dowCls}" style="font-weight:600;">${d}</td>
        <td class="${dowCls}">${dow}</td>
        <td class="fac-col" style="font-weight:600;">${facMins>0?minsToHHMM(facMins):"—"}</td>
        ${sMins.map(m=>`<td class="drive-col" style="font-weight:600;">${m>0?minsToHHMM(m):"—"}</td>`).join("")}
      </tr>`;
    }
    html+=`<tr style="background:#f0f4f8;font-weight:700;">
      <td colspan="2">月合計</td>
      <td class="fac-col">${minsToHHMM(totalFac)}</td>
      ${sTotals.map(m=>`<td class="drive-col">${minsToHHMM(m)}</td>`).join("")}
    </tr></table>`;
    printHTML(html, `采配簿_令和${year-2018}年${month}月`);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* ヘッダー */}
        <div className="header">
          <div className="header-row">
            <div className="hicon" style={{background:"#4a9eed"}}>🌟</div>
            <h1>{JIGYOSHO_NAME}</h1>
          </div>
          <div className="header-sub" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span>
              放課後等デイサービス管理アプリ
              {supabase && <SyncBadge syncing={syncing} error={syncError}/>}
              {!supabase && <span style={{fontSize:10,marginLeft:8,color:"#fbd38d"}}>⚠️ オフラインモード</span>}
            </span>
            {supabase && (
              <button
                onClick={async ()=>{ await supabase.auth.signOut(); }}
                style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",color:"white",borderRadius:6,padding:"3px 8px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>
                ログアウト
              </button>
            )}
          </div>
        </div>

        {/* ナビ */}
        <div className="nav">
          {[
            { key:"sougei",  label:"🚌 送迎表",    cls:"t-sougei"  },
            { key:"carsummary", label:"🚗 車種別",  cls:"t-sougei"  },
            { key:"jisseki", label:"📋 実績記録",   cls:"t-jisseki" },
            { key:"kojin",   label:"📓 個人記録",   cls:"t-kojin"   },
            { key:"joko",    label:"🚗 乗降記録",   cls:"t-joko"    },
            { key:"gyomu",   label:"📔 業務日誌",   cls:"t-gyomu"   },
            { key:"saibai",  label:"📊 采配簿",     cls:"t-saibai"  },
            { key:"master",  label:"⚙️ 名簿管理",  cls:"t-master"  },
            { key:"shusseki", label:"📅 出席予定", cls:"t-shusseki" },
            { key:"dl",      label:"📥 ダウンロード", cls:"t-dl"      },
          ].map(t => (
            <button key={t.key} className={`nav-tab ${t.cls} ${tab===t.key?"active":""}`} onClick={()=>setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="content">

          {/* ===================================================
              送迎表
          =================================================== */}
          {tab === "sougei" && (
            <>
              <div className="date-bar">
                <input className="date-input" type="date" value={sDate} onChange={e=>setSDate(e.target.value)} />
                <span className="date-display">{getReiwa(sDate)}</span>
                <button className="excel-btn" style={{marginLeft:"auto"}}
                  onClick={()=>{
                    const d = new Date(sDate+"T00:00:00");
                    exportSougeiExcel(d.getFullYear(), d.getMonth()+1);
                  }}>
                  📥 Excel出力
                </button>
              </div>
              <div className="dir-tabs">
                <button className={`dir-tab mukae ${dir==="mukae"?"active mukae":""}`} onClick={()=>setDir("mukae")}>🏠→🏫 迎え（行き）</button>
                <button className={`dir-tab okuri ${dir==="okuri"?"active okuri":""}`} onClick={()=>setDir("okuri")}>🏫→🏠 送り（帰り）</button>
              </div>

              {sBins.map((bin, bi) => {
                const selCar = getCarById(bin.carId);
                return (
                  <div key={bin.id} className="bin-card">
                    <div className="bin-header">
                      <div className="bin-header-top">
                        <div className="bin-badge" style={{background: selCar?.color||"#a0aec0"}}>{bi+1}</div>
                        <span className="bin-label">{bi+1}便</span>
                        <button className="bin-delete" onClick={()=>remBin(bin.id)}>削除</button>
                      </div>
                      <div className="car-select-row">
                        {cars.map(car => (
                          <button key={car.id}
                            className={`car-btn ${bin.carId===car.id?"on":""}`}
                            style={bin.carId===car.id ? {background:car.color,borderColor:car.color} : {borderColor:car.color,color:car.color}}
                            onClick={()=>updBin(bin.id,"carId", bin.carId===car.id?"":car.id)}
                          >🚗 {car.name}</button>
                        ))}
                      </div>
                      <div className="staff-row">
                        <span className="slabel">運転者</span>
                        <select className={`sselect ${bin.driverId?"on":""}`} value={bin.driverId} onChange={e=>updBin(bin.id,"driverId",e.target.value)}>
                          <option value="">選択</option>
                          {staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <span className="slabel">同乗者</span>
                        <select className={`sselect ${bin.joshuId?"on":""}`} value={bin.joshuId} onChange={e=>updBin(bin.id,"joshuId",e.target.value)}>
                          <option value="">なし</option>
                          {staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="route-list">
                      {bin.stops.map((stop, si) => {
                        const isLast = si===bin.stops.length-1;
                        return (
                          <div key={stop.id} className="route-item">
                            <div className="rc">
                              <div className={`rdot ${stop.type}`}/>
                              {!isLast && <div className="rline"/>}
                            </div>
                            <div className="rcontent">
                              <div className="rtop">
                                <TimeWheelTrigger value={stop.time} onChange={v=>updStop(bin.id,stop.id,"time",v)}/>
                                {stop.type==="base" ? (
                                  <><span className="base-lbl">🏫 {JIGYOSHO}</span>{bin.stops.filter(s=>s.type==="base").indexOf(stop) > 0 && (<button className="sdel" onClick={()=>remStop(bin.id,stop.id)}>✕</button>)}</>
                                ) : stop.type==="child" ? (
                                  <>
                                    <select className="csel" value={stop.childId} onChange={e=>updStop(bin.id,stop.id,"childId",e.target.value)}>
                                      <option value="">お子さんを選択</option>
                                      {children.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button className="sdel" onClick={()=>remStop(bin.id,stop.id)}>✕</button>
                                  </>
                                ) : (
                                  <>
                                    <span style={{fontSize:10,color:"#a0aec0"}}>□空欄</span>
                                    <button className="sdel" onClick={()=>remStop(bin.id,stop.id)}>✕</button>
                                  </>
                                )}
                              </div>
                              {stop.type==="child" && stop.childId && (
                                <div className="basho-row">
                                  <button className={`basho-btn school ${stop.basho==="学校"?"on":""}`} onClick={()=>updStop(bin.id,stop.id,"basho",stop.basho==="学校"?"":"学校")}>🏫 学校</button>
                                  <button className={`basho-btn home  ${stop.basho==="自宅"?"on":""}`}  onClick={()=>updStop(bin.id,stop.id,"basho",stop.basho==="自宅"?"":"自宅")}>🏠 自宅</button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div className="add-stop-row">
                        <button className="add-stop-btn" onClick={()=>addStop(bin.id,"child")}>＋ お子さん</button>
                        <button className="add-stop-btn" onClick={()=>addBase(bin.id)}>＋ みらいえ</button>
                        <button className="add-stop-btn" onClick={()=>addStop(bin.id,"blank")}>＋ □空欄</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button className="add-bin-btn" onClick={addBin}>＋ {dir==="mukae"?"迎え":"送り"}の便を追加</button>
            </>
          )}

          {/* ===================================================
              車種別一覧
          =================================================== */}
          {tab === "carsummary" && (
            <>
              <div className="date-bar">
                <input className="date-input" type="date" value={sDate} onChange={e=>setSDate(e.target.value)} />
                <span className="date-display">{getReiwa(sDate)}</span>
              </div>
              {carSummary.length===0 ? (
                <div className="nodata">この日の送迎データがありません</div>
              ) : carSummary.map(({car,rows}) => (
                <div key={car.id} className="car-sec">
                  <div className="car-sec-hd" style={{background:car.color}}>
                    <span style={{fontSize:18}}>🚗</span>
                    <span style={{fontSize:13,fontWeight:700}}>{car.name}</span>
                    <span style={{fontSize:11,opacity:.85,marginLeft:"auto"}}>{rows.length}件</span>
                  </div>
                  <table className="ctable">
                    <thead style={{background:car.color}}>
                      <tr><th>種別</th><th>時刻</th><th>お子さん</th><th>場所</th><th>運転者</th><th>同乗者</th></tr>
                    </thead>
                    <tbody>
                      {rows.map((r,i)=>(
                        <tr key={i}>
                          <td><span className={r.dir==="mukae"?"tag-mukae":"tag-okuri"}>{r.dir==="mukae"?"迎え":"送り"}</span></td>
                          <td><span className="ttime">{r.time||"—"}</span></td>
                          <td style={{fontWeight:600}}>{r.name}</td>
                          <td>{r.basho==="学校"?<span className="tag-school">🏫 学校</span>:r.basho==="自宅"?<span className="tag-home">🏠 自宅</span>:"—"}</td>
                          <td style={{fontSize:10}}>{r.driver||"—"}</td>
                          <td style={{fontSize:10}}>{r.joshu||"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}

          {/* ===================================================
              実績記録
          =================================================== */}
          {tab === "jisseki" && (
            <>
              {/* 年月選択 */}
              <div className="month-sel">
                <select className="msel" value={jYear} onChange={e=>setJYear(Number(e.target.value))}>
                  {years.map(y=><option key={y} value={y}>令和{y-2018}年（{y}）</option>)}
                </select>
                <select className="msel" value={jMonth} onChange={e=>setJMonth(Number(e.target.value))}>
                  {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}月分</option>)}
                </select>
              </div>

              {/* お子さん選択 */}
              <div className="child-chips">
                {children.map(c=>(
                  <button key={c.id} className={`chip ${jChildId===c.id?"on":""}`} onClick={()=>setJChildId(c.id)}>{c.name}</button>
                ))}
              </div>

              {jChild && (
                <>
                  {/* ヘッダー情報 */}
                  <div className="info-card">
                    <div className="info-title">令和{jYear-2018}年{jMonth}月分　放課後等デイサービス提供実績記録票</div>
                    <div className="info-grid">
                      <div className="info-row"><span className="ilabel">受給者証番号：</span><span className="ivalue" style={{fontFamily:"'DM Mono',monospace"}}>{jChild.jukyuNo||"—"}</span></div>
                      <div className="info-row"><span className="ilabel">事業所番号：</span><span className="ivalue" style={{fontFamily:"'DM Mono',monospace"}}>{JIGYOSHO_NO}</span></div>
                      <div className="info-row"><span className="ilabel">給付決定保護者氏名：</span><span className="ivalue">{jChild.name}</span></div>
                      <div className="info-row"><span className="ilabel">事業所名：</span><span className="ivalue">{JIGYOSHO_NAME}</span></div>
                      <div className="info-row"><span className="ilabel">契約支給量：</span><span className="ivalue">{jChild.keiyakuDays}日/月</span></div>
                      <div className="info-row"><span className="ilabel">区分：</span><span className="ivalue">{jChild.kubun}</span></div>
                    </div>
                  </div>

                  {/* 集計バー */}
                  <div className="sum-bar">
                    <div className="sum-item"><span className="sum-val">{totals.present}</span><span className="sum-lbl">出席日数</span></div>
                    <div className="sum-item"><span className="sum-val">{totals.soJu}</span><span className="sum-lbl">送迎（住）</span></div>
                    <div className="sum-item"><span className="sum-val">{totals.soBin}</span><span className="sum-lbl">送迎（便）</span></div>
                    <div className="sum-item"><span className="sum-val">{totals.hours}h{totals.mins>0?totals.mins+"m":""}</span><span className="sum-lbl">総提供時間</span></div>
                  </div>

                  {/* 凡例 */}
                  <div style={{fontSize:10,color:"#718096",marginBottom:8,display:"flex",gap:10}}>
                    <span><span className="linked-badge">連携</span> 送迎表から自動反映</span>
                    <span><span className="manual-badge">手動</span> 手動で編集済み</span>
                  </div>

                  {/* 実績テーブル */}
                  <div className="tbl-wrap">
                    <table className="jtable">
                      <thead>
                        <tr>
                          <th rowSpan={2} style={{width:20}}>テ</th>
                          <th rowSpan={2} style={{width:22}}>日</th>
                          <th rowSpan={2} style={{width:18}}>曜</th>
                          <th colSpan={7}>サービス提供実績</th>
                          <th colSpan={2}>送迎</th>
                          <th rowSpan={2} style={{width:24}}>家族<br/>支援</th>
                          <th rowSpan={2} style={{width:24}}>延長<br/>支援</th>
                          <th rowSpan={2} style={{width:24}}>専門<br/>支援</th>
                          <th rowSpan={2} style={{width:24}}>医療<br/>連携</th>
                          <th rowSpan={2} style={{width:24}}>自立<br/>S</th>
                          <th rowSpan={2} style={{width:24}}>関係<br/>機関</th>
                          <th rowSpan={2} style={{width:44}}>保護者<br/>確認</th>
                          <th rowSpan={2} style={{width:68}}>備考</th>
                        </tr>
                        <tr>
                          <th className="sub" style={{width:22}}>状況</th>
                          <th className="sub" style={{width:26}}>形態</th>
                          <th className="sub" style={{width:20}}>区分</th>
                          <th className="sub" style={{width:54}}>開始</th>
                          <th className="sub" style={{width:54}}>終了</th>
                          <th className="sub" style={{width:32}}>算定</th>
                          <th className="sub" style={{width:36}}>滞在</th>
                          <th className="sub" style={{width:22}}>住</th>
                          <th className="sub" style={{width:22}}>便</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({length:days},(_,i)=>i+1).map(d => {
                          const dow = getDow(jYear,jMonth,d);
                          const wkend = isWeekend(jYear,jMonth,d);
                          const r = getJisseki(d);
                          const dateStr = `${jYear}-${String(jMonth).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                          const linkedInfo = deriveJisseki(dateStr, jChildId, schedule);
                          const hasLinkedStart = !!linkedInfo.startTime;
                          const hasLinkedEnd   = !!linkedInfo.endTime;
                          const isManualStart  = overrides[`${jChildId}-${jYear}-${jMonth}-${d}`]?.timeStart !== undefined;
                          const isManualEnd    = overrides[`${jChildId}-${jYear}-${jMonth}-${d}`]?.timeEnd   !== undefined;
                          const dowCls = dow==="日"?"sun":dow==="土"?"sat":"";
                          const rowCls = r.attend==="present" ? (wkend?"hasdata wkend":"hasdata") : r.attend==="absent" ? "absent" : (wkend?"wkend":"");
                          const santei = calcSantei(r.timeStart, r.timeEnd);
                          const zaitai = calcZaitai(r.timeStart, r.timeEnd);
                          return (
                            <tr key={d} className={rowCls}>
                              <td>
                                <button className={`tog ${r.attend==="present"?"present":r.attend==="absent"?"absent":""}`}
                                  onClick={()=>setOv(d,"attend", r.attend==="present"?"absent":r.attend==="absent"?"":"present")}>
                                  {r.attend==="present"?"✓":r.attend==="absent"?"×":""}
                                </button>
                              </td>
                              <td><span className={`dnum ${dowCls}`}>{d}</span></td>
                              <td><span className={`dow ${dowCls}`}>{dow}</span></td>
                              {/* 提供状況 */}
                              <td>
                                <button className={`tog ${r.attend==="present"?"present":r.attend==="absent"?"absent":""}`}
                                  onClick={()=>setOv(d,"attend", r.attend==="present"?"absent":r.attend==="absent"?"":"present")}>
                                  {r.attend==="present"?"✓":r.attend==="absent"?"×":""}
                                </button>
                              </td>
                              <td>
                                <select className="msel2" value={r.keitai} onChange={e=>setOv(d,"keitai",e.target.value)} disabled={r.attend!=="present"}>
                                  <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                                </select>
                              </td>
                              <td>
                                <select className="msel2" value={r.kubun} onChange={e=>setOv(d,"kubun",e.target.value)} disabled={r.attend!=="present"}>
                                  <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                                </select>
                              </td>
                              {/* 開始時間 */}
                              <td>
                                <input className={`ti ${hasLinkedStart&&!isManualStart?"linked":""}`}
                                  type="time" value={r.timeStart}
                                  onChange={e=>setOv(d,"timeStart",e.target.value)}
                                  disabled={r.attend!=="present"}/>
                                {hasLinkedStart && !isManualStart && <span className="linked-badge">連携</span>}
                                {isManualStart  && <span className="manual-badge">手動</span>}
                              </td>
                              {/* 終了時間 */}
                              <td>
                                <input className={`ti ${hasLinkedEnd&&!isManualEnd?"linked":""}`}
                                  type="time" value={r.timeEnd}
                                  onChange={e=>setOv(d,"timeEnd",e.target.value)}
                                  disabled={r.attend!=="present"}/>
                                {hasLinkedEnd && !isManualEnd && <span className="linked-badge">連携</span>}
                                {isManualEnd  && <span className="manual-badge">手動</span>}
                              </td>
                              <td><input className="ti" style={{width:40}} value={r.attend==="present"?(r.santeiManual!==undefined?r.santeiManual:santei):""} onChange={e=>setOv(d,"santeiManual",e.target.value)} disabled={r.attend!=="present"}/></td>
                              <td><span className="cv">{r.attend==="present"?zaitai:""}</span></td>
                              <td><button className={`chkbox ${r.soJu?"on":""}`} onClick={()=>setOv(d,"soJu",!r.soJu)} disabled={r.attend!=="present"}>{r.soJu?"1":""}</button></td>
                              <td><button className={`chkbox ${r.soBin?"on":""}`} onClick={()=>setOv(d,"soBin",!r.soBin)} disabled={r.attend!=="present"}>{r.soBin?"1":""}</button></td>
                              <td><select className="msel2" style={{width:36,fontSize:10}} value={r.attend==="present"?(r.kazoku||""):""} onChange={e=>setOv(d,"kazoku",e.target.value)} disabled={r.attend!=="present"}><option value=""></option><option value="I">I</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option></select></td>
                              <td><input className="ti" style={{width:30,textAlign:"center"}} type="number" min="0" value={r.attend==="present"?(r.enchyo||""):""} onChange={e=>setOv(d,"enchyo",e.target.value)} disabled={r.attend!=="present"}/></td>
                              <td><input className="ti" style={{width:30,textAlign:"center"}} type="number" min="0" value={r.attend==="present"?(r.senmon||""):""} onChange={e=>setOv(d,"senmon",e.target.value)} disabled={r.attend!=="present"}/></td>
                              <td><input className="ti" style={{width:30,textAlign:"center"}} type="number" min="0" value={r.attend==="present"?(r.iryo||""):""} onChange={e=>setOv(d,"iryo",e.target.value)} disabled={r.attend!=="present"}/></td>
                              <td><input className="ti" style={{width:30,textAlign:"center"}} type="number" min="0" value={r.attend==="present"?(r.jiritsu||""):""} onChange={e=>setOv(d,"jiritsu",e.target.value)} disabled={r.attend!=="present"}/></td>
                              <td><select className="msel2" style={{width:36,fontSize:10}} value={r.attend==="present"?(r.kankei||""):""} onChange={e=>setOv(d,"kankei",e.target.value)} disabled={r.attend!=="present"}><option value=""></option><option value="I">I</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option></select></td>
                              <td>
                                {r.attend==="present" && (
                                  <div className={`sign-area ${r.signed?"signed":""}`} onClick={()=>setOv(d,"signed",!r.signed)}>
                                    {r.signed ? "㊞" : "確認"}
                                  </div>
                                )}
                              </td>
                              <td><input className="note-inp" value={r.note} onChange={e=>setOv(d,"note",e.target.value)}/></td>
                            </tr>
                          );
                        })}
                        {/* 合計行 */}
                        <tr className="tot-row">
                          <td colSpan={9} style={{textAlign:"right",paddingRight:6}}>合　計</td>
                          <td><span className="cv">{Array.from({length:days},(_,i)=>i+1).reduce((a,d)=>{const r=getJisseki(d);return a+(r.attend==="present"?parseFloat(calcSantei(r.timeStart,r.timeEnd)||0):0)},0).toFixed(1)}</span></td>
                          <td></td>
                          <td><span className="cv">{totals.soJu>0?totals.soJu+"回":""}</span></td>
                          <td><span className="cv">{totals.soBin>0?totals.soBin+"回":""}</span></td>
                          <td colSpan={8}/>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {/* ===================================================
              個人記録
          =================================================== */}
          {tab === "kojin" && (() => {
            const YOUSU_OPTIONS   = ["落ち着いていた","元気いっぱい","少し不安定","集中できていた","疲れ気味","友達と関われた","自分から取り組めた","支援が必要だった","楽しそうだった","癇癪・パニックあり"];
            const WHAT_OPTIONS    = ["学習支援","制作・工作","運動・身体活動","SST","自由遊び","生活習慣支援","集団活動","個別課題","その他"];
            const HOW_OPTIONS     = ["声かけ支援","手添え支援","見守り","自立して取り組む","促し支援"];

            const getAttendChildIds = (y, m, d) => {
              const dateStr = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              const ids = new Set();
              ["mukae","okuri"].forEach(dir => {
                (schedule[`${dateStr}-${dir}`] || []).forEach(bin => {
                  bin.stops.forEach(s => { if (s.type==="child" && s.childId) ids.add(Number(s.childId)); });
                });
              });
              return [...ids];
            };

            const kDays = getDaysInMonth(kYear, kMonth);
            const activeDays = Array.from({length: kDays}, (_,i) => i+1)
              .filter(d => getAttendChildIds(kYear,kMonth,d).length > 0);

            const totalSlots = activeDays.reduce((a,d) => a + getAttendChildIds(kYear,kMonth,d).length, 0);
            const totalDone  = activeDays.reduce((a,d) =>
              a + getAttendChildIds(kYear,kMonth,d).filter(cid => {
                const kr = getKR(cid,kYear,kMonth,d);
                return kr.yousu && kr.yousu.length > 0;
              }).length, 0);

            // viewMode: "list"=日付一覧, "input"=入力（日付選択済）, "summary"=まとめ
            const kojinMode = editDay === "summary" ? "summary" : editDay ? "input" : "list";
            const inputDay  = kojinMode === "input" ? editDay : null;
            const dayChildIds = inputDay ? getAttendChildIds(kYear, kMonth, inputDay) : [];

            return (
              <>
                {/* ── トップバー ── */}
                <div className="kojin-top-bar">
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <select className="msel" value={kYear} onChange={e=>{setKYear(Number(e.target.value));setEditDay(null);}}>
                      {[today.getFullYear()-1,today.getFullYear(),today.getFullYear()+1].map(y=><option key={y} value={y}>令和{y-2018}年（{y}）</option>)}
                    </select>
                    <select className="msel" value={kMonth} onChange={e=>{setKMonth(Number(e.target.value));setEditDay(null);}}>
                      {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}月</option>)}
                    </select>
                    <span className="kojin-progress"><span className="kojin-progress-bar" style={{width:totalSlots>0?`${Math.round(totalDone/totalSlots*100)}%`:"0%"}}/></span>
                    <span style={{fontSize:11,color:"#553c9a",fontWeight:700}}>{totalDone}/{totalSlots}件</span>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:8}}>
                    <button className={`kojin-mode-btn ${kojinMode!=="summary"?"active":""}`} onClick={()=>setEditDay(null)}>✏️ 入力</button>
                    <button className={`kojin-mode-btn ${kojinMode==="summary"?"active":""}`} onClick={()=>setEditDay("summary")}>📋 まとめ</button>
                  </div>
                </div>

                {/* ══ 日付一覧 ══ */}
                {kojinMode === "list" && (
                  activeDays.length === 0 ? (
                    <div className="kojin-empty">
                      <div style={{fontSize:40,marginBottom:8}}>📓</div>
                      <p>この月の送迎データがありません。<br/>先に送迎表を入力してください。</p>
                    </div>
                  ) : (
                    <div className="kojin-list">
                      {activeDays.map(d => {
                        const dow    = getDow(kYear,kMonth,d);
                        const dowCls = dow==="日"?"sun":dow==="土"?"sat":"";
                        const ids    = getAttendChildIds(kYear,kMonth,d);
                        const done   = ids.filter(cid=>{const kr=getKR(cid,kYear,kMonth,d);return kr.yousu&&kr.yousu.length>0;}).length;
                        const allDone= done===ids.length;
                        return (
                          <div key={d} className="kojin-day-card" onClick={()=>{setEditDay(d);setKChildId(-1);}}>
                            <div className="kojin-day-left">
                              <span className="kojin-card-date">{kMonth}/{d}</span>
                              <span className={`kojin-card-dow ${dowCls}`}>{dow}</span>
                            </div>
                            <div className="kojin-day-center">
                              {ids.map(cid=>{
                                const c=children.find(x=>x.id===cid);
                                const kr=getKR(cid,kYear,kMonth,d);
                                const ok=kr.yousu&&kr.yousu.length>0;
                                return <span key={cid} className={`kojin-child-pill ${ok?"done":""}`}>{c?.name||"?"}</span>;
                              })}
                            </div>
                            <div className="kojin-day-right">
                              {allDone
                                ? <span className="kojin-complete-badge">✓完了</span>
                                : <span style={{fontSize:11,color:"#e53e3e",fontWeight:700}}>{done}/{ids.length}</span>}
                              <span style={{fontSize:16,color:"#a0aec0",marginLeft:4}}>›</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* ══ 入力モード ══ */}
                {kojinMode === "input" && (() => {
                  const EVENT_CATS = [
                    {val:"🤜 トラブル・喧嘩", color:"#fed7d7", textColor:"#c53030"},
                    {val:"😢 泣き・パニック",  color:"#bee3f8", textColor:"#2b6cb0"},
                    {val:"🚽 排泄",            color:"#c6f6d5", textColor:"#276749"},
                    {val:"🤕 怪我・体調不良",  color:"#fefcbf", textColor:"#744210"},
                    {val:"💊 服薬",            color:"#e9d8fd", textColor:"#553c9a"},
                    {val:"📞 保護者連絡",      color:"#fde8d8", textColor:"#c05621"},
                    {val:"⭐ できたこと",       color:"#faf089", textColor:"#744210"},
                    {val:"🔔 その他",           color:"#e2e8f0", textColor:"#4a5568"},
                  ];

                  // 選択中の子のKR
                  const selKr   = kChildId > 0 ? getKR(kChildId, kYear, kMonth, inputDay) : null;
                  const selChild = kChildId > 0 ? children.find(c=>c.id===kChildId) : null;

                  return (
                    <>
                      {/* ステップ①：日付バー */}
                      <div className="kojin-day-header">
                        <button className="kojin-back-btn" onClick={()=>{setEditDay(null);setKChildId(-1);}}>← 一覧</button>
                        <span style={{fontSize:15,fontWeight:700,color:"#553c9a"}}>
                          {kMonth}月{inputDay}日（{getDow(kYear,kMonth,inputDay)}）
                        </span>
                        <span style={{fontSize:11,color:"#718096",marginLeft:4}}>{dayChildIds.length}名利用</span>
                      </div>

                      {/* ステップ②：名前を選ぶ */}
                      <div className="kojin-step-card">
                        <div className="kojin-step-label">① 名前を選ぶ</div>
                        <div className="kojin-name-tabs" style={{marginBottom:0}}>
                          {dayChildIds.map(cid => {
                            const c  = children.find(x=>x.id===cid);
                            const kr = getKR(cid, kYear, kMonth, inputDay);
                            const eventCount = (kr.events||[]).length;
                            const hasMemo = kr.yousuMemo||kr.renraku||kr.sonota;
                            const isDone = kr.yousu&&kr.yousu.length>0;
                            return (
                              <button key={cid}
                                className={`kojin-name-tab ${kChildId===cid?"active":""} ${isDone?"done":""}`}
                                onClick={()=>setKChildId(kChildId===cid?-1:cid)}>
                                {c?.name||"?"}
                                {eventCount>0&&<span style={{
                                  marginLeft:4,fontSize:9,background:"#fc8181",color:"white",
                                  borderRadius:"50%",padding:"0 4px",fontWeight:700
                                }}>{eventCount}</span>}
                                {isDone&&<span style={{marginLeft:3,fontSize:10}}>✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ステップ③：選んだ子の記録 */}
                      {kChildId > 0 && selKr !== null && selChild && (
                        <div className="kojin-form-card">
                          {/* 子供名ヘッダー */}
                          <div className="kojin-form-header">
                            <div className="kojin-child-avatar">{selChild.name[0]}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:14,fontWeight:700}}>{selChild.name}</div>
                              {(() => {
                                const dateStr=`${kYear}-${String(kMonth).padStart(2,"0")}-${String(inputDay).padStart(2,"0")}`;
                                const jLink=deriveJisseki(dateStr,kChildId,schedule);
                                const jOv=overrides[`${kChildId}-${kYear}-${kMonth}-${inputDay}`]||{};
                                const s=jOv.timeStart||jLink.startTime||"";
                                const e=jOv.timeEnd||jLink.endTime||"";
                                return s&&e?<div style={{fontSize:11,color:"#718096",fontFamily:"'DM Mono',monospace"}}>{s}〜{e}</div>:null;
                              })()}
                            </div>
                          </div>

                          {/* 今日の様子 */}
                          <div className="kojin-form-section">
                            <div className="kojin-form-sec-label">📊 今日の様子</div>
                            <div className="kojin-tag-wrap">
                              {YOUSU_OPTIONS.map(o=>{
                                const isOn=(selKr.yousu||[]).includes(o);
                                return <button key={o} className={`kjbtn ${isOn?"on":""}`}
                                  onClick={()=>{const cur=selKr.yousu||[];setKR(kChildId,kYear,kMonth,inputDay,"yousu",cur.includes(o)?cur.filter(x=>x!==o):[...cur,o]);}}>{o}</button>;
                              })}
                            </div>
                          </div>

                          {/* 活動内容 */}
                          <div className="kojin-form-section">
                            <div className="kojin-form-sec-label">🎯 活動内容</div>
                            <div className="kojin-tag-wrap">
                              {WHAT_OPTIONS.map(o=>{
                                const isOn=(selKr.what||[]).includes(o);
                                return <button key={o} className={`kjbtn ${isOn?"on":""}`}
                                  onClick={()=>{const cur=selKr.what||[];setKR(kChildId,kYear,kMonth,inputDay,"what",cur.includes(o)?cur.filter(x=>x!==o):[...cur,o]);}}>{o}</button>;
                              })}
                            </div>
                          </div>

                          {/* 関わり方 */}
                          <div className="kojin-form-section">
                            <div className="kojin-form-sec-label">🤝 関わり方</div>
                            <div className="kojin-tag-wrap">
                              {HOW_OPTIONS.map(o=>{
                                const isOn=(selKr.how||[]).includes(o);
                                return <button key={o} className={`kjbtn ${isOn?"on":""}`}
                                  onClick={()=>{const cur=selKr.how||[];setKR(kChildId,kYear,kMonth,inputDay,"how",cur.includes(o)?cur.filter(x=>x!==o):[...cur,o]);}}>{o}</button>;
                              })}
                            </div>
                          </div>

                          {/* 様子の詳細 */}
                          <div className="kojin-form-section">
                            <div className="kojin-form-sec-label">📝 様子の詳細</div>
                            <textarea className="kojin-memo" rows={2} placeholder="具体的な様子を記入..."
                              value={selKr.yousuMemo||""} onChange={e=>setKR(kChildId,kYear,kMonth,inputDay,"yousuMemo",e.target.value)}/>
                          </div>

                          {/* ── 出来事リスト＋追加 ── */}
                          <div className="kojin-form-section">
                            <div className="kojin-form-sec-label">📌 出来事・特記事項</div>

                            {/* 既存の出来事 */}
                            {(selKr.events||[]).length > 0 && (
                              <div className="kojin-timeline" style={{marginBottom:10}}>
                                {(selKr.events||[]).map((ev,ei)=>{
                                  const catInfo = EVENT_CATS.find(c=>c.val===ev.category);
                                  return (
                                    <div key={ev.id} className="kojin-event-row">
                                      <div className="kojin-event-dot" style={{background:catInfo?.textColor||"#805ad5"}}/>
                                      <div className="kojin-event-body">
                                        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                                          <input type="time" className="tinput" style={{width:64}}
                                            value={ev.time||""}
                                            onChange={e=>{const evs=[...(selKr.events||[])];evs[ei]={...evs[ei],time:e.target.value};setKR(kChildId,kYear,kMonth,inputDay,"events",evs);}}/>
                                          <div style={{display:"flex",gap:5,flexWrap:"wrap",flex:1}}>
                                            {EVENT_CATS.map(cat=>(
                                              <button key={cat.val}
                                                style={{
                                                  padding:"3px 8px",borderRadius:6,border:"1.5px solid",
                                                  fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                                                  background: ev.category===cat.val ? cat.textColor : cat.color,
                                                  borderColor: cat.textColor,
                                                  color: ev.category===cat.val ? "white" : cat.textColor,
                                                  transition:"all .12s"
                                                }}
                                                onClick={()=>{const evs=[...(selKr.events||[])];evs[ei]={...evs[ei],category:ev.category===cat.val?"":cat.val};setKR(kChildId,kYear,kMonth,inputDay,"events",evs);}}>
                                                {cat.val}
                                              </button>
                                            ))}
                                          </div>
                                          <button className="sdel" onClick={()=>{
                                            const evs=(selKr.events||[]).filter((_,i)=>i!==ei);
                                            setKR(kChildId,kYear,kMonth,inputDay,"events",evs);
                                          }}>✕</button>
                                        </div>
                                        <textarea className="kojin-memo" rows={2}
                                          placeholder="内容を記入（例：Bくんと口論になり別室で落ち着かせた）"
                                          value={ev.memo||""}
                                          onChange={e=>{const evs=[...(selKr.events||[])];evs[ei]={...evs[ei],memo:e.target.value};setKR(kChildId,kYear,kMonth,inputDay,"events",evs);}}/>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* 出来事を追加するボタン（常に表示） */}
                            <button className="kojin-add-event-btn-large"
                              onClick={()=>{
                                const evs=selKr.events||[];
                                setKR(kChildId,kYear,kMonth,inputDay,"events",[...evs,{id:Date.now(),time:"",category:"",memo:""}]);
                              }}>
                              ＋ 出来事を追加する
                            </button>
                          </div>

                          {/* 家庭・学校よりの連絡事項 */}
                          <div className="kojin-form-section">
                            <div className="kojin-form-sec-label">🏠 家庭・学校よりの連絡事項</div>
                            <textarea className="kojin-memo" rows={2} placeholder="保護者・学校からの連絡など..."
                              value={selKr.renraku||""} onChange={e=>setKR(kChildId,kYear,kMonth,inputDay,"renraku",e.target.value)}/>
                          </div>

                          {/* その他 */}
                          <div className="kojin-form-section">
                            <div className="kojin-form-sec-label">📌 その他</div>
                            <textarea className="kojin-memo" rows={2} placeholder="その他特記事項..."
                              value={selKr.sonota||""} onChange={e=>setKR(kChildId,kYear,kMonth,inputDay,"sonota",e.target.value)}/>
                          </div>

                          <div style={{padding:"8px 14px 14px",display:"flex",justifyContent:"flex-end"}}>
                            <button className="kojin-save-btn" onClick={()=>setKChildId(-1)}>✓ 保存して次の人へ</button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* ══ まとめ閲覧 ══ */}
                {kojinMode === "summary" && (
                  <>
                    {/* フィルター：日付 or 子ども */}
                    <div style={{background:"white",borderRadius:12,padding:"10px 14px",marginBottom:12,boxShadow:"0 1px 4px rgba(0,0,0,.07)"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#553c9a",marginBottom:6}}>表示切替</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <button className={`kojin-mode-btn ${kChildId===-2?"active":""}`} style={{fontSize:11,padding:"5px 10px"}}
                          onClick={()=>setKChildId(-2)}>📅 日付順</button>
                        {children.map(c=>(
                          <button key={c.id} className={`kojin-name-tab ${kChildId===c.id?"active":""}`}
                            onClick={()=>setKChildId(c.id)}>{c.name}</button>
                        ))}
                      </div>
                    </div>

                    {(() => {
                      const rows = [];
                      activeDays.forEach(d => {
                        const ids = kChildId===-2
                          ? getAttendChildIds(kYear,kMonth,d)
                          : getAttendChildIds(kYear,kMonth,d).filter(id=>id===kChildId);
                        ids.forEach(cid => {
                          const kr = getKR(cid,kYear,kMonth,d);
                          if (!kr.yousu || kr.yousu.length===0) return;
                          const dateStr = `${kYear}-${String(kMonth).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                          const jLink   = deriveJisseki(dateStr,cid,schedule);
                          const jOv     = overrides[`${cid}-${kYear}-${kMonth}-${d}`]||{};
                          rows.push({ d, cid,
                            name: children.find(c=>c.id===cid)?.name||"?",
                            dow:  getDow(kYear,kMonth,d),
                            startT: jOv.timeStart||jLink.startTime||"",
                            endT:   jOv.timeEnd  ||jLink.endTime  ||"",
                            kr });
                        });
                      });

                      if (rows.length===0) return <div className="kojin-empty"><p>記録済みのデータがありません</p></div>;

                      return rows.map((row,i) => {
                        const dowCls = row.dow==="日"?"sun":row.dow==="土"?"sat":"";
                        return (
                          <div key={i} className="kojin-summary-card" style={{marginBottom:10}}>
                            <div className="kojin-summary-header">
                              <span className={`kojin-card-dow ${dowCls}`}>{row.dow}</span>
                              <span style={{fontSize:14,fontWeight:700,color:"#553c9a",fontFamily:"'DM Mono',monospace"}}>{kMonth}/{row.d}</span>
                              {kChildId===-2&&<span style={{fontSize:12,fontWeight:700,background:"#f0e6ff",color:"#553c9a",borderRadius:8,padding:"2px 8px"}}>{row.name}</span>}
                              {row.startT&&row.endT&&<span style={{fontSize:11,color:"#718096",fontFamily:"'DM Mono',monospace"}}>{row.startT}〜{row.endT}</span>}
                              <button className="kojin-edit-btn" onClick={()=>{setEditDay(row.d);setKChildId(row.cid);}}>編集</button>
                            </div>
                            <div className="kojin-summary-body">
                              {row.kr.yousu?.length>0&&<div className="kojin-summary-row"><span className="kojin-summary-label">今日の様子</span><span className="kojin-summary-val">{row.kr.yousu.join("・")}</span></div>}
                              {row.kr.what?.length>0&&<div className="kojin-summary-row"><span className="kojin-summary-label">活動内容</span><span className="kojin-summary-val">{row.kr.what.join("・")}</span></div>}
                              {row.kr.how?.length>0&&<div className="kojin-summary-row"><span className="kojin-summary-label">関わり方</span><span className="kojin-summary-val">{row.kr.how.join("・")}</span></div>}
                              {row.kr.yousuMemo&&<div className="kojin-summary-row"><span className="kojin-summary-label">様子の詳細</span><span className="kojin-summary-val">{row.kr.yousuMemo}</span></div>}
                              {row.kr.renraku&&<div className="kojin-summary-row"><span className="kojin-summary-label">家庭・学校より</span><span className="kojin-summary-val">{row.kr.renraku}</span></div>}
                              {row.kr.sonota&&<div className="kojin-summary-row"><span className="kojin-summary-label">その他</span><span className="kojin-summary-val">{row.kr.sonota}</span></div>}
                              {row.kr.events&&row.kr.events.length>0&&(
                                <div className="kojin-summary-row">
                                  <span className="kojin-summary-label">出来事</span>
                                  <div style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
                                    {row.kr.events.map((ev,ei)=>(
                                      <div key={ei} className="kojin-event-summary-item">
                                        {ev.time&&<span className="kojin-event-time">{ev.time}</span>}
                                        {ev.category&&<span className="kojin-event-cat-badge">{ev.category}</span>}
                                        {ev.memo&&<span style={{fontSize:11,color:"#2d3748"}}>{ev.memo}</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </>
                )}
              </>
            );
          })()}

          {/* ===================================================
              乗降記録
          =================================================== */}
          {tab === "joko" && (() => {
            const jokoRows = getJokoData(jokoDate);
            // 車種ごとにグループ化
            const grouped = {};
            jokoRows.forEach(row => {
              const key = row.car ? row.car.id : "nocar";
              if (!grouped[key]) grouped[key] = { car: row.car, rows: [] };
              grouped[key].rows.push(row);
            });
            const groups = Object.values(grouped);

            const bashoLabel = (b) => {
              if (!b) return "—";
              if (b===JIGYOSHO) return <span className="joko-basho mirai">🏫 {JIGYOSHO}</span>;
              if (b==="学校")   return <span className="joko-basho gakko">🏫 学校</span>;
              if (b==="自宅")   return <span className="joko-basho jitaku">🏠 自宅</span>;
              return <span className="joko-basho">{b}</span>;
            };

            return (
              <>
                {/* 日付バー */}
                <div className="joko-date-bar">
                  <input className="date-input" type="date" value={jokoDate} onChange={e=>setJokoDate(e.target.value)}/>
                  <span className="date-display">{getReiwa(jokoDate)}</span>
                  {jokoRows.length > 0 && (
                    <span style={{fontSize:11,color:"#319795",fontWeight:700,marginLeft:"auto"}}>
                      {jokoRows.length}名
                    </span>
                  )}
                </div>

                {/* 凡例 */}
                <div style={{fontSize:10,color:"#718096",marginBottom:10,display:"flex",gap:10,flexWrap:"wrap"}}>
                  <span style={{color:"#319795"}}>🔗 送迎表から自動反映　時刻は修正可能</span>
                </div>

                {jokoRows.length === 0 ? (
                  <div className="joko-empty">
                    <div style={{fontSize:36,marginBottom:8}}>🚗</div>
                    <p>この日の送迎データがありません。<br/>送迎表を入力すると自動で表示されます。</p>
                  </div>
                ) : (
                  groups.map(({car, rows}) => (
                    <div key={car?.id||"nocar"} className="joko-section">
                      {/* 車種ヘッダー */}
                      <div className="joko-section-hd" style={{background: car?.color||"#718096"}}>
                        <span style={{fontSize:18}}>🚗</span>
                        <span className="joko-section-title">{car?.name||"車種未設定"}</span>
                        <span style={{fontSize:11,opacity:.85,marginLeft:"auto"}}>{rows.length}名</span>
                      </div>

                      {/* 乗降テーブル */}
                      <div style={{overflowX:"auto"}}>
                        <table className="joko-table">
                          <thead>
                            <tr>
                              <th>区分</th>
                              <th>便</th>
                              <th>お子さん</th>
                              <th>乗車時刻</th>
                              <th>乗車場所</th>
                              <th>降車時刻</th>
                              <th>降車場所</th>
                              <th>運転者</th>
                              <th>確認</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, ri) => {
                              const isLinkedJo = jokoOverrides[row.ovKey]?.joTime === undefined;
                              const isLinkedKo = jokoOverrides[row.ovKey]?.koTime === undefined;
                              return (
                                <tr key={ri}>
                                  <td><span className={`joko-dir-badge ${row.dir}`}>{row.dir==="mukae"?"迎え":"送り"}</span></td>
                                  <td style={{fontWeight:600}}>{row.binNo}便</td>
                                  <td style={{fontWeight:700,fontSize:12}}>{row.child.name}</td>
                                  {/* 乗車時刻 */}
                                  <td>
                                    <input className={`joko-time-inp ${isLinkedJo?"linked":""}`}
                                      type="time" value={row.joTime}
                                      onChange={e=>setJokoOv(row.ovKey,"joTime",e.target.value)}/>
                                  </td>
                                  {/* 乗車場所 */}
                                  <td>{bashoLabel(row.joBasho)}</td>
                                  {/* 降車時刻 */}
                                  <td>
                                    <input className={`joko-time-inp ${isLinkedKo?"linked":""}`}
                                      type="time" value={row.koTime}
                                      onChange={e=>setJokoOv(row.ovKey,"koTime",e.target.value)}/>
                                  </td>
                                  {/* 降車場所 */}
                                  <td>{bashoLabel(row.koBasho)}</td>
                                  {/* 運転者 */}
                                  <td style={{fontSize:11}}>
                                    {row.driver||"—"}
                                    {row.joshu&&<span style={{fontSize:9,color:"#a0aec0",display:"block"}}>{row.joshu}</span>}
                                  </td>
                                  {/* 確認サイン */}
                                  <td>
                                    <div className={`joko-sign ${row.signed?"signed":""}`}
                                      onClick={()=>setJokoOv(row.ovKey,"signed",!row.signed)}>
                                      {row.signed?"㊞":"確認"}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* 運転者・同乗者サマリー */}
                      <div style={{padding:"8px 14px",background:"#f7fafc",borderTop:"1px solid #edf2f7",fontSize:10,color:"#718096"}}>
                        {[...new Set(rows.map(r=>r.driver).filter(Boolean))].map(d=>(
                          <span key={d} style={{marginRight:10}}>運転者：<strong style={{color:"#2d3748"}}>{d}</strong></span>
                        ))}
                        {[...new Set(rows.map(r=>r.joshu).filter(Boolean))].map(j=>(
                          <span key={j} style={{marginRight:10}}>同乗者：<strong style={{color:"#2d3748"}}>{j}</strong></span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </>
            );
          })()}

          {/* ===================================================
              業務日誌
          =================================================== */}
          {tab === "gyomu" && (() => {
            const gr = getGR(gyomuDate);

            const TENKI_OPTIONS   = ["晴れ","曇り","雨","雪"];
            const KATSUDO_OPTIONS = ["学習支援","制作・工作","運動・身体活動","SST","自由遊び","生活習慣支援","集団活動","個別課題","外出・校外活動","その他"];
            const JIKO_OPTIONS    = ["なし","ヒヤリハット","軽微な怪我","受診が必要な怪我","物品破損","その他"];
            const KAIGI_OPTIONS   = ["なし","スタッフミーティング","保護者対応","関係機関連絡","研修","その他"];

            // 送迎表からその日の利用者を取得
            const attendIds = new Set();
            ["mukae","okuri"].forEach(dir => {
              (schedule[`${gyomuDate}-${dir}`]||[]).forEach(bin => {
                bin.stops.forEach(s => { if(s.type==="child"&&s.childId) attendIds.add(Number(s.childId)); });
              });
            });
            const attendChildren = children.filter(c => attendIds.has(c.id));

            return (
              <>
                {/* 日付バー */}
                <div className="gyomu-date-bar">
                  <input className="date-input" type="date" value={gyomuDate} onChange={e=>setGyomuDate(e.target.value)}/>
                  <span className="date-display">{getReiwa(gyomuDate)}</span>
                </div>

                <div className="gyomu-doc">
                  <div className="gyomu-doc-title">
                    <span style={{fontSize:18}}>📔</span>
                    <span className="gyomu-doc-title-main">業務日誌</span>
                    <span className="gyomu-doc-title-sub">{JIGYOSHO_NAME}</span>
                  </div>

                  {/* 出勤スタッフ */}
                  <div className="gyomu-section">
                    <div className="gyomu-sec-label">👤 出勤スタッフ</div>
                    <div className="gyomu-staff-row">
                      {staff.map(s => {
                        const isOn = (gr.shukkin||[]).includes(s.id);
                        return (
                          <button key={s.id} className={`gyomu-staff-btn ${isOn?"on":""}`}
                            onClick={()=>{
                              const cur = gr.shukkin||[];
                              setGR(gyomuDate,"shukkin", isOn?cur.filter(x=>x!==s.id):[...cur,s.id]);
                            }}>
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                    {(gr.shukkin||[]).length > 0 && (
                      <div style={{marginTop:6,fontSize:11,color:"#744210"}}>
                        責任者：
                        <select style={{border:"1px solid #fde68a",borderRadius:6,padding:"2px 6px",fontSize:11,fontFamily:"inherit",background:"#fffbeb",marginLeft:4}}
                          value={gr.sekininsha||""} onChange={e=>setGR(gyomuDate,"sekininsha",e.target.value)}>
                          <option value="">選択</option>
                          {(gr.shukkin||[]).map(sid=>{
                            const s=staff.find(x=>x.id===sid);
                            return s?<option key={sid} value={sid}>{s.name}</option>:null;
                          })}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 利用者（送迎表から自動） */}
                  <div className="gyomu-section">
                    <div className="gyomu-sec-label">👦 本日の利用者
                      <span style={{fontSize:9,color:"#a0aec0",fontWeight:400}}>送迎表から自動反映</span>
                    </div>
                    {attendChildren.length === 0 ? (
                      <span style={{fontSize:11,color:"#a0aec0"}}>送迎表にデータがありません</span>
                    ) : (
                      <div className="gyomu-child-list">
                        {attendChildren.map(c=>(
                          <span key={c.id} className="gyomu-child-chip">{c.name}</span>
                        ))}
                        <span style={{fontSize:11,color:"#744210",fontWeight:700,alignSelf:"center"}}>{attendChildren.length}名</span>
                      </div>
                    )}
                  </div>

                  {/* 天気・利用者数 */}
                  <div className="gyomu-section">
                    <div className="gyomu-2col">
                      <div>
                        <div className="gyomu-sec-label">🌤 天気</div>
                        <div className="gyomu-tag-wrap">
                          {TENKI_OPTIONS.map(o=>(
                            <button key={o} className={`gybtn ${gr.tenki===o?"on":""}`}
                              onClick={()=>setGR(gyomuDate,"tenki",gr.tenki===o?"":o)}>{o}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="gyomu-sec-label">📊 利用者数</div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <input type="number" className="gyomu-input" style={{width:60}}
                            value={gr.riyo_count||attendChildren.length||""}
                            onChange={e=>setGR(gyomuDate,"riyo_count",e.target.value)}/>
                          <span style={{fontSize:12,color:"#744210"}}>名</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 本日の活動内容 */}
                  <div className="gyomu-section">
                    <div className="gyomu-sec-label">🎯 本日の活動内容（複数選択可）</div>
                    <div className="gyomu-tag-wrap">
                      {KATSUDO_OPTIONS.map(o=>{
                        const isOn=(gr.katsudo||[]).includes(o);
                        return <button key={o} className={`gybtn ${isOn?"on":""}`}
                          onClick={()=>{const cur=gr.katsudo||[];setGR(gyomuDate,"katsudo",cur.includes(o)?cur.filter(x=>x!==o):[...cur,o]);}}>
                          {o}</button>;
                      })}
                    </div>
                  </div>

                  {/* 全体の様子 */}
                  <div className="gyomu-section">
                    <div className="gyomu-sec-label">📝 全体の様子・特記事項</div>
                    <textarea className="gyomu-memo" rows={3}
                      placeholder="本日の全体的な様子、気になったこと、良かったことなど..."
                      value={gr.zentai||""} onChange={e=>setGR(gyomuDate,"zentai",e.target.value)}/>
                  </div>

                  {/* 事故・ヒヤリハット */}
                  <div className="gyomu-section">
                    <div className="gyomu-sec-label">⚠️ 事故・ヒヤリハット</div>
                    <div className="gyomu-tag-wrap" style={{marginBottom:6}}>
                      {JIKO_OPTIONS.map(o=>(
                        <button key={o} className={`gybtn ${gr.jiko===o?"on":""}`}
                          onClick={()=>setGR(gyomuDate,"jiko",gr.jiko===o?"":o)}>{o}</button>
                      ))}
                    </div>
                    {gr.jiko && gr.jiko!=="なし" && (
                      <textarea className="gyomu-memo" rows={2}
                        placeholder="詳細を記入..."
                        value={gr.jikoMemo||""} onChange={e=>setGR(gyomuDate,"jikoMemo",e.target.value)}/>
                    )}
                  </div>

                  {/* 保護者・関係機関連絡 */}
                  <div className="gyomu-section">
                    <div className="gyomu-sec-label">📞 会議・連絡対応</div>
                    <div className="gyomu-tag-wrap" style={{marginBottom:6}}>
                      {KAIGI_OPTIONS.map(o=>{
                        const isOn=(gr.kaigi||[]).includes(o);
                        return <button key={o} className={`gybtn ${isOn?"on":""}`}
                          onClick={()=>{const cur=gr.kaigi||[];setGR(gyomuDate,"kaigi",cur.includes(o)?cur.filter(x=>x!==o):[...cur,o]);}}>
                          {o}</button>;
                      })}
                    </div>
                    {(gr.kaigi||[]).some(x=>x!=="なし") && (
                      <textarea className="gyomu-memo" rows={2}
                        placeholder="詳細を記入..."
                        value={gr.kaigiMemo||""} onChange={e=>setGR(gyomuDate,"kaigiMemo",e.target.value)}/>
                    )}
                  </div>

                  {/* 申し送り */}
                  <div className="gyomu-section">
                    <div className="gyomu-sec-label">📨 申し送り事項</div>
                    <textarea className="gyomu-memo" rows={3}
                      placeholder="次の担当者への申し送り、翌日の注意事項など..."
                      value={gr.moshiokuri||""} onChange={e=>setGR(gyomuDate,"moshiokuri",e.target.value)}/>
                  </div>

                  {/* 管理者確認 */}
                  <div className="gyomu-section">
                    <div className="gyomu-2col">
                      <div className="gyomu-field">
                        <label>記録者</label>
                        <select className="gyomu-input"
                          value={gr.kirokusha||""} onChange={e=>setGR(gyomuDate,"kirokusha",e.target.value)}>
                          <option value="">選択</option>
                          {staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="gyomu-field">
                        <label>管理者確認</label>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <select className="gyomu-input" style={{flex:1}}
                            value={gr.kanri||""} onChange={e=>setGR(gyomuDate,"kanri",e.target.value)}>
                            <option value="">選択</option>
                            {staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <button style={{
                            padding:"5px 10px",borderRadius:7,border:"1.5px solid #fde68a",
                            background:gr.kanriSign?"#d69e2e":"#fffbeb",
                            color:gr.kanriSign?"white":"#744210",
                            fontSize:gr.kanriSign?16:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"
                          }} onClick={()=>setGR(gyomuDate,"kanriSign",!gr.kanriSign)}>
                            {gr.kanriSign?"㊞":"確認"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* ===================================================
              采配簿（ドライバー時間 vs 施設時間）
          =================================================== */}
          {tab === "saibai" && (() => {
            const daysInMonth = getDaysInMonth(saibaiYear, saibaiMonth);
            const todayD = today.getDate();
            const todayM = today.getMonth()+1;
            const todayY = today.getFullYear();

            // 月ごと全スタッフ表
            const MonthlyView = () => {
              // 日付ごとに各スタッフの時間を集計
              const rows = Array.from({length:daysInMonth},(_,i)=>i+1).map(d => {
                const dateStr = `${saibaiYear}-${String(saibaiMonth).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                const dow     = getDow(saibaiYear,saibaiMonth,d);
                const wkend   = isWeekend(saibaiYear,saibaiMonth,d);
                const facMins = getFacilityMins(dateStr);
                const staffData = staff.map(s => ({
                  id: s.id,
                  name: s.name,
                  driveMins: getDriverMins(s.id, dateStr),
                }));
                return {d, dow, wkend, dateStr, facMins, staffData,
                  isToday: d===todayD && saibaiMonth===todayM && saibaiYear===todayY};
              });

              // 月合計
              const staffTotals = staff.map(s => ({
                id: s.id, name: s.name,
                totalDrive: rows.reduce((a,r) => a + r.staffData.find(x=>x.id===s.id)?.driveMins||0, 0),
              }));
              const totalFac = rows.reduce((a,r)=>a+r.facMins,0);

              return (
                <div className="saibai-wrap">
                  <table className="saibai-table" style={{width:"100%"}}>
                    <thead>
                      <tr>
                        <th style={{width:30}}>日</th>
                        <th style={{width:22}}>曜</th>
                        <th className="fac">施設<br/>対応</th>
                        {staff.map(s=>(
                          <th key={s.id} className="drive" colSpan={1}>🚗 {s.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(row => {
                        const dowCls = row.dow==="日"?"sun":row.dow==="土"?"sat":"";
                        return (
                          <tr key={row.d} className={`${row.wkend?"weekend":""} ${row.isToday?"today":""}`}>
                            <td style={{fontFamily:"'DM Mono',monospace",fontWeight:600}}>
                              <span className={`dnum ${dowCls}`}>{row.d}</span>
                            </td>
                            <td><span className={`dow ${dowCls}`}>{row.dow}</span></td>
                            <td>
                              {row.facMins>0
                                ? <span className="fac-val">{minsToHHMM(row.facMins)}</span>
                                : <span style={{color:"#e2e8f0"}}>—</span>}
                            </td>
                            {row.staffData.map(sd=>(
                              <td key={sd.id}>
                                {sd.driveMins>0
                                  ? <span className="drive-val">{minsToHHMM(sd.driveMins)}</span>
                                  : <span style={{color:"#e2e8f0"}}>—</span>}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      {/* 合計行 */}
                      <tr className="total-row">
                        <td colSpan={2} style={{textAlign:"right",paddingRight:6,fontSize:10}}>合計</td>
                        <td><span className="fac-val">{minsToHHMM(totalFac)}</span></td>
                        {staffTotals.map(st=>(
                          <td key={st.id}><span className="drive-val">{minsToHHMM(st.totalDrive)}</span></td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            };

            // スタッフ別詳細表
            const StaffView = () => {
              const sid = saibaiStaffId || (staff[0]?.id);
              const s   = staff.find(x=>x.id===sid);
              if (!s) return <div style={{padding:20,color:"#a0aec0",textAlign:"center"}}>スタッフを選択してください</div>;

              let totalDrive=0, totalFac=0, totalWork=0;

              const rows = Array.from({length:daysInMonth},(_,i)=>i+1).map(d => {
                const dateStr = `${saibaiYear}-${String(saibaiMonth).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                const dow     = getDow(saibaiYear,saibaiMonth,d);
                const wkend   = isWeekend(saibaiYear,saibaiMonth,d);
                const driveMins = getDriverMins(sid, dateStr);
                const facMins   = getFacilityMins(dateStr);
                // 勤務時間：施設+ドライバーの重複除いた合計（簡易：施設時間を基本にドライバー時間を加算）
                const workMins  = Math.max(driveMins, facMins) + (driveMins>0&&facMins>0?Math.min(driveMins,facMins)*0:0);
                const totalMins = driveMins + facMins;
                if (driveMins>0||facMins>0) { totalDrive+=driveMins; totalFac+=facMins; totalWork+=totalMins; }
                return {d, dow, wkend, driveMins, facMins, totalMins,
                  isToday: d===todayD&&saibaiMonth===todayM&&saibaiYear===todayY};
              });

              return (
                <div className="saibai-wrap">
                  <table className="saibai-table" style={{width:"100%"}}>
                    <thead>
                      <tr>
                        <th style={{width:30}}>日</th>
                        <th style={{width:22}}>曜</th>
                        <th className="drive">🚗 ドライバー時間</th>
                        <th className="fac">🏫 施設対応時間</th>
                        <th className="total">合計時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(row => {
                        const dowCls = row.dow==="日"?"sun":row.dow==="土"?"sat":"";
                        const hasData = row.driveMins>0||row.facMins>0;
                        return (
                          <tr key={row.d} className={`${row.wkend?"weekend":""} ${row.isToday?"today":""}`}>
                            <td><span className={`dnum ${dowCls}`}>{row.d}</span></td>
                            <td><span className={`dow ${dowCls}`}>{row.dow}</span></td>
                            <td>
                              {row.driveMins>0
                                ? <span className="drive-val">{minsToHHMM(row.driveMins)}</span>
                                : <span style={{color:"#e2e8f0"}}>—</span>}
                            </td>
                            <td>
                              {row.facMins>0
                                ? <span className="fac-val">{minsToHHMM(row.facMins)}</span>
                                : <span style={{color:"#e2e8f0"}}>—</span>}
                            </td>
                            <td>
                              {hasData
                                ? <span className="total-val">{minsToHHMM(row.totalMins)}</span>
                                : <span style={{color:"#e2e8f0"}}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="total-row">
                        <td colSpan={2} style={{textAlign:"right",paddingRight:6,fontSize:10}}>月合計</td>
                        <td><span className="drive-val">{minsToHHMM(totalDrive)}</span></td>
                        <td><span className="fac-val">{minsToHHMM(totalFac)}</span></td>
                        <td><span className="total-val">{minsToHHMM(totalWork)}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            };

            return (
              <>
                {/* コントロール */}
                <div className="saibai-ctrl">
                  <select className="msel" value={saibaiYear} onChange={e=>setSaibaiYear(Number(e.target.value))}>
                    {[today.getFullYear()-1,today.getFullYear(),today.getFullYear()+1].map(y=><option key={y} value={y}>令和{y-2018}年（{y}）</option>)}
                  </select>
                  <select className="msel" value={saibaiMonth} onChange={e=>setSaibaiMonth(Number(e.target.value))}>
                    {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}月</option>)}
                  </select>
                  <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
                    <button className={`saibai-view-btn ${saibaiView==="monthly"?"active":""}`} onClick={()=>setSaibaiView("monthly")}>
                      📅 全スタッフ
                    </button>
                    <button className={`saibai-view-btn ${saibaiView==="staff"?"active":""}`} onClick={()=>setSaibaiView("staff")}>
                      👤 スタッフ別
                    </button>
                  </div>
                </div>

                {/* 凡例 */}
                <div className="saibai-legend">
                  <div className="legend-item"><div className="legend-dot" style={{background:"#2b6cb0"}}/><span style={{color:"#2b6cb0",fontWeight:600}}>🚗 ドライバー時間</span>：送迎表から自動計算</div>
                  <div className="legend-item"><div className="legend-dot" style={{background:"#276749"}}/><span style={{color:"#276749",fontWeight:600}}>🏫 施設対応時間</span>：実績記録から自動計算</div>
                </div>

                {/* スタッフ別の場合はスタッフタブ */}
                {saibaiView==="staff" && (
                  <div className="saibai-staff-tabs">
                    {staff.map(s=>(
                      <button key={s.id}
                        className={`saibai-staff-tab ${(saibaiStaffId||staff[0]?.id)===s.id?"active":""}`}
                        onClick={()=>setSaibaiStaffId(s.id)}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* 表 */}
                {saibaiView==="monthly" ? <MonthlyView/> : <StaffView/>}
              </>
            );
          })()}

          {/* ===================================================
              名簿管理
          =================================================== */}
          {tab === "master" && (
            <>
              {/* 車種 */}
              <p className="sec-title">🚗 車種名簿</p>
              <div className="add-form">
                <div className="fg"><label>車種名</label>
                  <input placeholder="アルファード" value={nfCar.name} onChange={e=>setNfCar({name:e.target.value})} onKeyDown={e=>e.key==="Enter"&&addCar()}/>
                </div>
                <button className="btn btn-p" onClick={addCar}>＋ 追加</button>
              </div>
              {cars.map(car=>(
                <div key={car.id} className="mcard">
                  <div className="cicon" style={{background:car.color+"22",border:`2px solid ${car.color}`}}>🚗</div>
                  <div className="minfo"><div className="mname" style={{color:car.color}}>{car.name}</div><div className="mmeta">送迎表で選択可能</div></div>
                  <button className="btn btn-d" onClick={()=>del(setCars,car.id,"cars",cars)}>削除</button>
                </div>
              ))}

              <div style={{height:18}}/>

              {/* スタッフ */}
              <p className="sec-title">👤 スタッフ名簿</p>
              <div className="add-form">
                <div className="fg"><label>スタッフ名</label>
                  <input placeholder="山田 太郎" value={nfStaff.name} onChange={e=>setNfStaff({name:e.target.value})} onKeyDown={e=>e.key==="Enter"&&addStaff()}/>
                </div>
                <button className="btn btn-p" onClick={addStaff}>＋ 追加</button>
              </div>
              {staff.map(s=>(
                <div key={s.id} className="mcard">
                  <div className="mavatar" style={{background:"linear-gradient(135deg,#667eea,#1a3a5c)"}}>{s.name[0]}</div>
                  <div className="minfo"><div className="mname">{s.name}</div><div className="mmeta">運転者・同乗者として選択可能</div></div>
                  <button className="btn btn-d" onClick={()=>del(setStaff,s.id,"staff",staff)}>削除</button>
                </div>
              ))}

              <div style={{height:18}}/>

              {/* 利用者 */}
              <p className="sec-title">👦 利用者名簿</p>
              <div className="add-form">
                <div className="fg"><label>氏名</label><input placeholder="山田 太郎" value={nfChild.name} onChange={e=>setNfChild(p=>({...p,name:e.target.value}))}/></div>
                <div className="fg"><label>受給者証番号</label><input placeholder="0001234567" value={nfChild.jukyuNo} onChange={e=>setNfChild(p=>({...p,jukyuNo:e.target.value}))}/></div>
                <div className="fg"><label>市町村番号</label><input placeholder="市町村番号" value={nfChild.shichosonNo||""} onChange={e=>setNfChild(p=>({...p,shichosonNo:e.target.value}))}/></div>
                <div className="fg"><label>事業所番号（個別）</label><input placeholder="空欄の場合は共通番号を使用" value={nfChild.jigyoshoNo||""} onChange={e=>setNfChild(p=>({...p,jigyoshoNo:e.target.value}))}/></div>
                <div className="fg" style={{maxWidth:60}}><label>区分</label>
                  <select value={nfChild.kubun} onChange={e=>setNfChild(p=>({...p,kubun:e.target.value}))}>
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                  </select>
                </div>
                <div className="fg" style={{maxWidth:70}}><label>契約日数</label><input type="number" placeholder="10" value={nfChild.keiyakuDays} onChange={e=>setNfChild(p=>({...p,keiyakuDays:Number(e.target.value)}))}/></div>
                <button className="btn btn-p" onClick={addChild}>＋ 追加</button>
              </div>
              {children.map(c=>(
                <div key={c.id} className="mcard">
                  <div className="mavatar" style={{background:"linear-gradient(135deg,#48bb78,#276749)"}}>{c.name[0]}</div>
                  <div className="minfo">
                    <div className="mname">{c.name}</div>
                    <div className="mmeta">受給者証：{c.jukyuNo||"未入力"}　区分{c.kubun}　契約{c.keiyakuDays}日/月</div>
                  </div>
                  <button className="btn btn-d" onClick={()=>del(setChildren,c.id,"children",children)}>削除</button>
                </div>
              ))}
            </>
          )}


          {/* ===================================================
              出席予定表
          =================================================== */}
          {tab === "shusseki" && (() => {
            const weeks = getShussekiWeeks(shussekiYear, shussekiMonth);
            const DOW_LABELS = ["日","月","火","水","木","金","土"];

            return (
              <>
                {/* コントロール */}
                <div className="shusseki-ctrl">
                  <select className="msel" value={shussekiYear} onChange={e=>setShussekiYear(Number(e.target.value))}>
                    {[today.getFullYear()-1,today.getFullYear(),today.getFullYear()+1].map(y=>
                      <option key={y} value={y}>令和{y-2018}年（{y}）</option>
                    )}
                  </select>
                  <select className="msel" value={shussekiMonth} onChange={e=>setShussekiMonth(Number(e.target.value))}>
                    {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}月</option>)}
                  </select>
                  <span style={{fontSize:13,fontWeight:700,color:"#d69e2e",marginLeft:4}}>
                    令和{shussekiYear-2018}年{shussekiMonth}月　出席予定
                  </span>
                  <button className="dl-btn-pdf" style={{marginLeft:"auto"}} onClick={()=>printShusseki(shussekiYear,shussekiMonth)}>
                    🖨️ PDF印刷（週ごとA4）
                  </button>
                </div>

                {/* 名前選択ポップアップ */}
                {shussekiActivePopup && (
                  <>
                    <div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.4)",zIndex:999}}
                      onClick={()=>setShussekiActivePopup(null)}/>
                    <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
                      background:"white",border:"2px solid #1a3a5c",borderRadius:12,padding:14,
                      zIndex:1000,minWidth:200,maxHeight:"70vh",overflowY:"auto",boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#1a3a5c",marginBottom:8,paddingBottom:6,borderBottom:"1px solid #eee"}}>
                        {shussekiMonth}月{shussekiActivePopup.d}日　スロット{shussekiActivePopup.slot+1}
                      </div>
                      {children.map(c=>{
                        const k=`${shussekiYear}-${shussekiMonth}-${shussekiActivePopup.d}-${shussekiActivePopup.slot}-name`;
                        const isSelected=shussekiData[k]===c.name;
                        return (
                          <button key={c.id}
                            style={{display:"block",width:"100%",textAlign:"left",padding:"8px 10px",
                              border:"none",background:isSelected?"#dbeafe":"none",
                              fontSize:13,cursor:"pointer",borderRadius:6,fontFamily:"inherit",
                              fontWeight:isSelected?700:400,color:isSelected?"#1a3a5c":"#333"}}
                            onClick={()=>{setSD(k,c.name);setShussekiActivePopup(null);}}>
                            {c.name}
                          </button>
                        );
                      })}
                      <button
                        style={{display:"block",width:"100%",textAlign:"left",padding:"8px 10px",
                          border:"none",background:"none",fontSize:13,cursor:"pointer",
                          borderRadius:6,fontFamily:"inherit",color:"#e53e3e",
                          borderTop:"1px solid #eee",marginTop:4}}
                        onClick={()=>{
                          const k=`${shussekiYear}-${shussekiMonth}-${shussekiActivePopup.d}-${shussekiActivePopup.slot}-name`;
                          setSD(k,"");
                          setSD(`${shussekiYear}-${shussekiMonth}-${shussekiActivePopup.d}-${shussekiActivePopup.slot}-time`,"");
                          setSD(`${shussekiYear}-${shussekiMonth}-${shussekiActivePopup.d}-${shussekiActivePopup.slot}-memo`,"");
                          setShussekiActivePopup(null);
                        }}>
                        （削除）
                      </button>
                    </div>
                  </>
                )}

                {/* 週ごとのテーブル */}
                {weeks.map((week, wi) => (
                  <div key={wi} className="shusseki-wrap">
                    <table className="shusseki-table" style={{width:"100%"}}>
                      <thead>
                        <tr className={wi>0?"s-week-sep":""}>
                          <th className="s-name">出席児童名</th>
                          {week.map(({d,dow})=>(
                            <th key={d} className={dow===6?"s-sat":dow===0?"s-sun":"s-week"}
                              style={{minWidth:dow===0||dow===6?"44px":"80px"}}>
                              <div style={{fontSize:10}}>{DOW_LABELS[dow]}</div>
                              <div style={{fontSize:14,fontWeight:700}}>{d}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({length:NUM_SLOTS},(_,slot)=>(
                          <tr key={slot} className={wi>0?"s-week-sep-data":""}>
                            <td className="s-name-cell">
                              <span style={{color:"#aaa",fontSize:9}}>出席児童名 {slot+1}</span>
                            </td>
                            {week.map(({d,dow})=>{
                              const name=getSD(d,slot,"name");
                              const time=getSD(d,slot,"time");
                              const memo=getSD(d,slot,"memo");
                              const kTime=`${shussekiYear}-${shussekiMonth}-${d}-${slot}-time`;
                              const kMemo=`${shussekiYear}-${shussekiMonth}-${d}-${slot}-memo`;
                              return (
                                <td key={d} className={dow===6?"s-sat":dow===0?"s-sun":""} style={{position:"relative"}}>
                                  {/* ×削除ボタン */}
                                  {name && (
                                    <button
                                      style={{position:"absolute",top:1,right:1,width:16,height:16,
                                        border:"none",borderRadius:"50%",background:"#fc8181",color:"white",
                                        fontSize:9,fontWeight:700,cursor:"pointer",zIndex:10,
                                        display:"flex",alignItems:"center",justifyContent:"center",
                                        padding:0,lineHeight:1,fontFamily:"inherit"}}
                                      onClick={e=>{
                                        e.stopPropagation();
                                        const kName=`${shussekiYear}-${shussekiMonth}-${d}-${slot}-name`;
                                        setSD(kName,"");
                                        setSD(kTime,"");
                                        setSD(kMemo,"");
                                      }}>×</button>
                                  )}
                                  <div className="s-cell"
                                    style={{minWidth:dow===0||dow===6?"44px":"80px"}}
                                    onClick={()=>setShussekiActivePopup({d,slot})}>
                                    {name && <div className="s-cell-name">{name}</div>}
                                    {name && (
                                      <select className="s-cell-time" value={time}
                                        onChange={e=>{e.stopPropagation();setSD(kTime,e.target.value);}}
                                        onClick={e=>e.stopPropagation()}>
                                        {SHUSSEKI_TIMES.map(t=><option key={t} value={t}>{t||"時刻"}</option>)}
                                      </select>
                                    )}
                                    {name && (
                                      <input className="s-cell-memo" placeholder="メモ" value={memo}
                                        onChange={e=>setSD(kMemo,e.target.value)}
                                        onClick={e=>e.stopPropagation()}/>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {/* 集計行 */}
                        <tr>
                          <td className="s-name-count">出席予定人数</td>
                          {week.map(({d})=>{
                            const cnt=Array.from({length:NUM_SLOTS},(_,i)=>
                              shussekiData[`${shussekiYear}-${shussekiMonth}-${d}-${i}-name`]||""
                            ).filter(Boolean).length;
                            return <td key={d} className="s-count">{cnt>0?cnt:""}</td>;
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            );
          })()}

          {/* ===================================================
              ダウンロード
          =================================================== */}
          {tab === "dl" && (() => {
            const years2 = [today.getFullYear()-1, today.getFullYear(), today.getFullYear()+1];

            const YearMonthSel = () => (
              <div className="dl-row">
                <span className="dl-label">対象年月</span>
                <select className="dl-select" value={dlYear} onChange={e=>setDlYear(Number(e.target.value))}>
                  {years2.map(y=><option key={y} value={y}>令和{y-2018}年（{y}）</option>)}
                </select>
                <select className="dl-select" value={dlMonth} onChange={e=>setDlMonth(Number(e.target.value))}>
                  {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}月</option>)}
                </select>
              </div>
            );

            const ChildSel = () => (
              <div className="dl-row">
                <span className="dl-label">対象者</span>
                <select className="dl-select" value={dlChild} onChange={e=>setDlChild(e.target.value)}>
                  <option value="all">全員</option>
                  {children.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            );

            const CARDS = [
              {
                title:"送迎表",icon:"🚌",color:"#e67e22",
                body: <>
                  <YearMonthSel/>
                  <div className="dl-divider"/>
                  <div className="dl-row">
                    <button className="dl-btn-xlsx" onClick={()=>exportSougeiXLSX(dlYear,dlMonth)}>📥 Excel (.xlsx)</button>
                    <button className="dl-btn-csv"  onClick={()=>exportSougeiCSV(dlYear,dlMonth)}>📄 CSV</button>
                    <button className="dl-btn-pdf"  onClick={()=>printSougei(dlYear,dlMonth)}>🖨️ PDF印刷</button>
                  </div>
                </>
              },
              {
                title:"実績記録",icon:"📋",color:"#3182ce",
                body: <>
                  <YearMonthSel/>
                  <ChildSel/>
                  <div className="dl-divider"/>
                  <div className="dl-row">
                    <button className="dl-btn-xlsx" onClick={()=>exportJissekiXLSX(dlYear,dlMonth,dlChild)}>📥 Excel (.xlsx)</button>
                    <button className="dl-btn-csv"  onClick={()=>exportJissekiCSV(dlYear,dlMonth,dlChild)}>📄 CSV</button>
                    <button className="dl-btn-pdf"  onClick={()=>printJisseki(dlYear,dlMonth,dlChild)}>🖨️ PDF印刷</button>
                  </div>
                </>
              },
              {
                title:"個人記録",icon:"📓",color:"#805ad5",
                body: <>
                  <YearMonthSel/>
                  <ChildSel/>
                  <div className="dl-divider"/>
                  <div className="dl-row">
                    <button className="dl-btn-xlsx" onClick={()=>exportKojinXLSX(dlYear,dlMonth,dlChild)}>📥 Excel (.xlsx)</button>
                    <button className="dl-btn-csv"  onClick={()=>exportKojinCSV(dlYear,dlMonth,dlChild)}>📄 CSV</button>
                    <button className="dl-btn-pdf"  onClick={()=>printKojin(dlYear,dlMonth,dlChild)}>🖨️ PDF印刷</button>
                  </div>
                </>
              },
              {
                title:"乗降記録",icon:"🚗",color:"#319795",
                body: <>
                  <YearMonthSel/>
                  <div className="dl-divider"/>
                  <div className="dl-row">
                    <button className="dl-btn-xlsx" onClick={()=>exportJokoXLSX(dlYear,dlMonth)}>📥 Excel (.xlsx)</button>
                    <button className="dl-btn-csv"  onClick={()=>exportJokoCSV(dlYear,dlMonth)}>📄 CSV</button>
                    <button className="dl-btn-pdf"  onClick={()=>printJoko(dlYear,dlMonth)}>🖨️ PDF印刷</button>
                  </div>
                </>
              },
              {
                title:"業務日誌",icon:"📔",color:"#744210",
                body: <>
                  <YearMonthSel/>
                  <div className="dl-divider"/>
                  <div className="dl-row">
                    <button className="dl-btn-xlsx" onClick={()=>exportGyomuXLSX(dlYear,dlMonth)}>📥 Excel (.xlsx)</button>
                    <button className="dl-btn-csv"  onClick={()=>exportGyomuCSV(dlYear,dlMonth)}>📄 CSV</button>
                    <button className="dl-btn-pdf"  onClick={()=>printGyomu(dlYear,dlMonth)}>🖨️ PDF印刷</button>
                  </div>
                </>
              },
              {
                title:"采配簿",icon:"📊",color:"#2b6cb0",
                body: <>
                  <YearMonthSel/>
                  <div className="dl-divider"/>
                  <div className="dl-row">
                    <button className="dl-btn-xlsx" onClick={()=>exportSaibaiXLSX(dlYear,dlMonth)}>📥 Excel (.xlsx)</button>
                    <button className="dl-btn-csv"  onClick={()=>exportSaibaiCSV(dlYear,dlMonth)}>📄 CSV</button>
                    <button className="dl-btn-pdf"  onClick={()=>printSaibai(dlYear,dlMonth)}>🖨️ PDF印刷</button>
                  </div>
                </>
              },
              {
                title:"出席予定表",icon:"📅",color:"#d69e2e",
                body: <>
                  <YearMonthSel/>
                  <div className="dl-divider"/>
                  <div className="dl-row">
                    <button className="dl-btn-xlsx" style={{background:"#d69e2e"}} onClick={()=>exportShussekiXLSX(dlYear,dlMonth)}>📥 Excel (.xlsx)</button>
                    <button className="dl-btn-pdf" onClick={()=>printShusseki(dlYear,dlMonth)}>🖨️ PDF印刷（週ごとA4）</button>
                  </div>
                </>
              },
              {
                title:"業務実績簿（テレッサ書式）",icon:"📑",color:"#744210",
                body: <>
                  <div style={{fontSize:11,color:"#744210",background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:8,padding:"8px 10px",marginBottom:4}}>
                    ⭐ 提出用の固定書式（業務実績簿＋采配簿）を実績記録から自動生成します
                  </div>
                  <YearMonthSel/>
                  <div className="dl-divider"/>
                  <div className="dl-row">
                    <button className="dl-btn-xlsx" style={{background:"#744210"}} onClick={()=>exportTeresaXLSX(dlYear,dlMonth)}>
                      📑 固定書式 Excel出力
                    </button>
                  </div>
                </>
              },
            ];

            return (
              <div className="dl-page">
                <div style={{background:"#f0fff4",border:"1.5px solid #9ae6b4",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#276749"}}>
                  📥 ダウンロードしたいデータを選んでください。Excel（.xlsx）はExcelで開けます。スプレッドシート（.csv）はGoogleスプレッドシートで開けます。
                </div>
                {CARDS.map(card=>(
                  <div key={card.title} className="dl-card">
                    <div className="dl-card-header" style={{background:card.color}}>
                      <span className="dl-card-icon">{card.icon}</span>
                      <span className="dl-card-title">{card.title}</span>
                    </div>
                    <div className="dl-card-body">{card.body}</div>
                  </div>
                ))}
              </div>
            );
          })()}

        </div>
      </div>
    </>
  );
}
