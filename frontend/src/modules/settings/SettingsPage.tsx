import { useState } from "react";
import "./SettingsPage.css";

export type POSTheme = { primary: string; accent: string; button: string | null; header: string | null };
export const defaultPOSTheme: POSTheme = { primary: "#003f2d", accent: "#ff9200", button: null, header: null };
export const themePresets = [
  { name: "Emerald", primary: "#003f2d", accent: "#ff9200" },
  { name: "Ocean", primary: "#164b8b", accent: "#f59e0b" },
  { name: "Royal", primary: "#53338c", accent: "#e6a23c" },
  { name: "Charcoal", primary: "#283341", accent: "#f59e0b" },
  { name: "Ruby", primary: "#842d42", accent: "#e6aa46" },
  { name: "Teal", primary: "#006c73", accent: "#ff9e44" },
];
const sections = [
  ["Business Profile", "Store information and branding", "▣"],
  ["POS Preferences", "Billing, receipt, and POS options", "☷"],
  ["Users & Roles", "Manage staff, roles, and permissions", "♙"],
  ["Inventory Settings", "Stock, alerts, and product options", "▤"],
  ["Payment Methods", "Cash, card, and digital payments", "▣"],
  ["Receipt & Printing", "Receipt design and printer setup", "▤"],
  ["Language & Region", "System language, date, time, currency", "◎"],
  ["Sync & Backup", "Online sync, backup, and restore", "☁"],
  ["Security", "Login, password, and access control", "◇"],
  ["Theme & Appearance", "Colors and interface customization", "◉"],
  ["About System", "Version, license, and updates", "ⓘ"],
] as const;
const validHex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);
function ColorField({ label, value, onChange, auto = false }: { label: string; value: string; onChange: (value: string) => void; auto?: boolean }) {
  return <label className="st-color-field"><span>{label}</span><div className="st-color-input"><input aria-label={label + " color"} type="color" value={validHex(value) ? value : "#ffffff"} onChange={e => onChange(e.target.value)} /><input aria-label={label + " hex"} value={value} onChange={e => onChange(e.target.value)} maxLength={7} spellCheck={false} />{auto && <small>Auto</small>}</div></label>;
}
export default function SettingsPage({ theme, onSave }: { theme: POSTheme; onSave: (theme: POSTheme) => void }) {
  const [section, setSection] = useState<string>("Business Profile");
  const [draft, setDraft] = useState<POSTheme>(theme);
  const [autoButton, setAutoButton] = useState(theme.button === null);
  const [autoHeader, setAutoHeader] = useState(theme.header === null);
  const [savedNotice, setSavedNotice] = useState(false);
  const update = (patch: Partial<POSTheme>) => { setDraft(previous => ({ ...previous, ...patch })); setSavedNotice(false); };
  const reset = () => { setDraft(defaultPOSTheme); setAutoButton(true); setAutoHeader(true); setSavedNotice(false); };
  const save = () => {
    if (![draft.primary, draft.accent, ...(draft.button ? [draft.button] : []), ...(draft.header ? [draft.header] : [])].every(validHex)) return;
    onSave(draft); setSavedNotice(true);
  };
  return <div className="st-page">
    <header className="st-heading"><span className="st-gear">⚙</span><div><h1>System Settings</h1><p>Configure your POS, business, and system preferences.</p></div></header>
    <div className="st-layout">
      <nav className="st-navigation" aria-label="Settings sections">{sections.map(([name, description, icon]) => <button key={name} type="button" className={section === name ? "st-nav-item selected" : "st-nav-item"} onClick={() => setSection(name)}><span className="st-nav-icon">{icon}</span><span className="st-nav-label"><strong>{name}</strong><small>{description}</small></span><span className="st-nav-arrow">›</span></button>)}</nav>
      <div className="st-content">
        {section === "Theme & Appearance" ? <>
          <div className="st-section-head"><span className="st-section-icon">◉</span><div><h2>Theme & Appearance</h2><p>Customize your POS colors. The sidebar theme coordinates the rest of your interface.</p></div></div>
          <div className="st-panel"><h3>Choose a Theme</h3><div className="st-presets">{themePresets.map(p => <button type="button" key={p.name} className={"st-preset" + (draft.primary === p.primary && draft.accent === p.accent ? " active" : "")} onClick={() => { update({ primary: p.primary, accent: p.accent, button: null, header: null }); setAutoButton(true); setAutoHeader(true); }}><span className="st-preset-preview" style={{ background: p.primary }}><i style={{ background: p.accent }} /></span><span>{p.name}</span></button>)}</div></div>
          <div className="st-panel"><h3>Custom Colors</h3><p className="st-hint">Primary sidebar color also determines coordinated backgrounds, highlights and panels. Override individual colors only when needed.</p><div className="st-color-grid">
            <ColorField label="Sidebar / Primary Color" value={draft.primary} onChange={v => update({ primary: v })} />
            <ColorField label="Accent / Active Navigation" value={draft.accent} onChange={v => update({ accent: v })} />
            <div><label className="st-check"><input type="checkbox" checked={autoButton} onChange={e => { setAutoButton(e.target.checked); update({ button: e.target.checked ? null : draft.primary }); }} /> Match button color to theme</label>{!autoButton && <ColorField label="Primary Button Color" value={draft.button ?? draft.primary} onChange={v => update({ button: v })} />}</div>
            <div><label className="st-check"><input type="checkbox" checked={autoHeader} onChange={e => { setAutoHeader(e.target.checked); update({ header: e.target.checked ? null : "#e8f3ec" }); }} /> Match top bar to theme</label>{!autoHeader && <ColorField label="Top Bar Color" value={draft.header ?? "#e8f3ec"} onChange={v => update({ header: v })} />}</div>
          </div></div>
          <div className="st-panel"><h3>Live Theme Preview</h3><div className="st-preview"><div className="st-preview-sidebar" style={{ background: `radial-gradient(ellipse at 90% 85%, color-mix(in srgb, ${draft.primary} 66%, white) 32%, transparent 55%), linear-gradient(165deg, color-mix(in srgb, ${draft.primary} 74%, black), ${draft.primary} 42%, color-mix(in srgb, ${draft.primary} 80%, white) 72%, color-mix(in srgb, ${draft.primary} 93%, black))` }}><strong>Priyasaman POS</strong><span style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${draft.accent} 82%, white), ${draft.accent} 55%, color-mix(in srgb, ${draft.accent} 83%, black))` }}>Dashboard</span><span>Inventory</span><span>Reports</span></div><div className="st-preview-main"><div className="st-preview-top" style={{ background: draft.header ?? (draft.primary === defaultPOSTheme.primary ? "#E8F3EC" : `color-mix(in srgb, ${draft.primary} 11%, white)`) }}>POS Dashboard</div><div className="st-preview-cards"><div>Today's Sales<strong>Rs. 45,600</strong></div><div>Orders<strong>128</strong></div></div><button type="button" style={{ background: draft.button ?? draft.primary }}>Save Transaction</button></div></div></div>
        </> : section === "Business Profile" ? <>
          <div className="st-section-head"><span className="st-section-icon">▣</span><div><h2>Business Profile</h2><p>Update your store information, contact details, and branding.</p></div></div>
          <div className="st-panel"><div className="st-profile-grid"><div><label>Business Name *</label><input defaultValue="Priyasaman Super Mart" /><label>Business Type</label><select defaultValue="Retail Store"><option>Retail Store</option><option>Wholesale</option><option>Restaurant</option><option>Other</option></select><label>Phone Number</label><input defaultValue="077 123 4567" /><label>Email</label><input defaultValue="info@priyasamanmart.lk" /><label>Address</label><textarea defaultValue={"No. 120, Main Street,\nJa-Ela, Sri Lanka"} /></div><div><label>Business Logo</label><div className="st-logo-placeholder">🛒<small>Priyasaman<br/>Super Mart</small></div><label>Currency *</label><select defaultValue="LKR"><option value="LKR">LKR – Sri Lankan Rupee (Rs.)</option></select><label>Tax (VAT) Rate</label><input type="number" defaultValue="15" /><label>Fiscal Year Start</label><select defaultValue="January"><option>January</option><option>April</option></select></div></div></div>
          <div className="st-panel"><h3>Store Operating Hours</h3><div className="st-hours">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => <div key={day}><strong>{day}</strong><input type="checkbox" defaultChecked={i < 6}/><small>{i === 6 ? "Closed" : "08:00 AM – 09:00 PM"}</small></div>)}</div></div>
          <p className="st-hint">Business details are a visual preview; backend saving will be connected with the business settings API.</p>
        </> : <><div className="st-section-head"><span className="st-section-icon">⚙</span><div><h2>{section}</h2><p>{sections.find(item => item[0] === section)?.[1]}</p></div></div><div className="st-panel"><h3>{section}</h3><p className="st-hint">This settings section is ready for its dedicated configuration controls and backend integration.</p></div></>}
        {section === "Theme & Appearance" && <footer className="st-actions"><button type="button" className="st-reset" onClick={reset}>↻ Reset to Default</button><button type="button" className="st-save" onClick={save}>▣ Save Changes</button>{savedNotice && <span role="status">Theme saved successfully</span>}</footer>}
      </div>
    </div>
  </div>;
}
