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
const palette = ["#003F2D", "#047857", "#006C73", "#164B8B", "#2563EB", "#53338C", "#842D42", "#283341", "#FF9200", "#F59E0B", "#DC2626", "#E8F3EC", "#FFFFFF", "#111827"];
const colorGradient = (color: string) => `linear-gradient(165deg, color-mix(in srgb, ${color} 48%, black), color-mix(in srgb, ${color} 68%, black) 42%, color-mix(in srgb, ${color} 83%, black) 72%, color-mix(in srgb, ${color} 63%, black))`;
const accentGradient = (color: string) => `linear-gradient(180deg, color-mix(in srgb, ${color} 82%, white), ${color} 55%, color-mix(in srgb, ${color} 83%, black))`;
const textOn = (hex: string) => {
  if (!validHex(hex)) return "#ffffff";
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const luminance = rgb.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * luminance[0] + 0.7152 * luminance[1] + 0.0722 * luminance[2] > 0.36 ? "#172132" : "#ffffff";
};
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="st-color-field">
    <span>{label}</span>
    <div className="st-color-input">
      <button type="button" className="st-color-swatch" style={{ backgroundColor: validHex(value) ? value : "#ffffff" }} onClick={() => setOpen(v => !v)} aria-label={`Open ${label} palette`} aria-expanded={open} />
      <input aria-label={label + " color picker"} type="color" value={validHex(value) ? value : "#ffffff"} onChange={e => onChange(e.target.value)} title="Open full color spectrum" />
      <input aria-label={label + " hex"} value={value} onChange={e => onChange(e.target.value)} maxLength={7} spellCheck={false} />
      <button type="button" className="st-palette-toggle" onClick={() => setOpen(v => !v)} aria-label={`Toggle ${label} color palette`}>▦</button>
    </div>
    {open && <div className="st-color-palette"><div className="st-palette-title">Quick colors <small>Or use the spectrum picker for any color</small></div><div className="st-swatch-grid">{palette.map(color => <button key={color} type="button" className="st-palette-color" title={color} aria-label={`Choose ${color}`} aria-pressed={value.toLowerCase() === color.toLowerCase()} onClick={() => onChange(color)} style={{ backgroundColor: color }} />)}</div></div>}
  </div>;
}
export default function SettingsPage({ theme, onSave, onPreview }: { theme: POSTheme; onSave: (theme: POSTheme) => void; onPreview: (theme: POSTheme | null) => void }) {
  const [section, setSection] = useState<string>("Business Profile");
  const [draft, setDraft] = useState<POSTheme>(theme);
  const [autoButton, setAutoButton] = useState(theme.button === null);
  const [autoHeader, setAutoHeader] = useState(theme.header === null);
  const [savedNotice, setSavedNotice] = useState(false);
  const update = (patch: Partial<POSTheme>) => { setDraft(previous => { const next = { ...previous, ...patch }; if ([next.primary, next.accent, ...(next.button ? [next.button] : []), ...(next.header ? [next.header] : [])].every(validHex)) onPreview(next); return next; }); setSavedNotice(false); };
  const reset = () => { setDraft(defaultPOSTheme); onPreview(defaultPOSTheme); setAutoButton(true); setAutoHeader(true); setSavedNotice(false); };
  const cancel = () => { setDraft(theme); setAutoButton(theme.button === null); setAutoHeader(theme.header === null); onPreview(null); setSavedNotice(false); };
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
          <div className="st-panel"><h3>Choose a Theme</h3><div className="st-presets">{themePresets.map(p => <button type="button" key={p.name} className={"st-preset" + (draft.primary === p.primary && draft.accent === p.accent ? " active" : "")} onClick={() => { update({ primary: p.primary, accent: p.accent, button: null, header: null }); setAutoButton(true); setAutoHeader(true); }}><span className="st-preset-preview" style={{ background: colorGradient(p.primary) }}><i style={{ background: accentGradient(p.accent) }} /></span><span>{p.name}</span></button>)}</div></div>
          <div className="st-panel"><h3>Color Customization Panel</h3><p className="st-hint">Choose any color using the full spectrum picker, enter a HEX code, or select a quick swatch. Automatic matching keeps the original POS gradient design.</p><div className="st-color-grid">
            <ColorField label="Sidebar / Primary Color" value={draft.primary} onChange={v => update({ primary: v })} />
            <ColorField label="Accent / Active Navigation" value={draft.accent} onChange={v => update({ accent: v })} />
            <div><label className="st-check"><input type="checkbox" checked={autoButton} onChange={e => { setAutoButton(e.target.checked); update({ button: e.target.checked ? null : draft.accent }); }} /> Automatically coordinate button color with accent</label>{!autoButton && <ColorField label="Primary Button Color" value={draft.button ?? draft.accent} onChange={v => update({ button: v })} />}</div>
            <div><label className="st-check"><input type="checkbox" checked={autoHeader} onChange={e => { setAutoHeader(e.target.checked); update({ header: e.target.checked ? null : "#e8f3ec" }); }} /> Automatically coordinate top bar with sidebar</label>{!autoHeader && <ColorField label="Top Bar Color" value={draft.header ?? "#e8f3ec"} onChange={v => update({ header: v })} />}</div>
          </div></div>
          <div className="st-panel"><h3>Live Theme Preview</h3><div className="st-preview"><div className="st-preview-sidebar" style={{ background: colorGradient(draft.primary), color: textOn(draft.primary) }}><strong>Priyasaman POS</strong><span style={{ background: accentGradient(draft.accent), color: textOn(draft.accent) }}>Dashboard</span><span>Inventory</span><span>Reports</span></div><div className="st-preview-main"><div className="st-preview-top" style={{ background: draft.header ?? (draft.primary === defaultPOSTheme.primary ? "#E8F3EC" : `color-mix(in srgb, ${draft.primary} 11%, white)`) }}>POS Dashboard</div><div className="st-preview-cards"><div>Today's Sales<strong>Rs. 45,600</strong></div><div>Orders<strong>128</strong></div></div><button type="button" style={{ background: draft.button ?? draft.accent, color: textOn(draft.button ?? draft.accent) }}>Save Transaction</button></div></div></div>
        </> : section === "Business Profile" ? <>
          <div className="st-section-head"><span className="st-section-icon">▣</span><div><h2>Business Profile</h2><p>Update your store information, contact details, and branding.</p></div></div>
          <div className="st-panel"><div className="st-profile-grid"><div><label>Business Name *</label><input defaultValue="Priyasaman Super Mart" /><label>Business Type</label><select defaultValue="Retail Store"><option>Retail Store</option><option>Wholesale</option><option>Restaurant</option><option>Other</option></select><label>Phone Number</label><input defaultValue="077 123 4567" /><label>Email</label><input defaultValue="info@priyasamanmart.lk" /><label>Address</label><textarea defaultValue={"No. 120, Main Street,\nJa-Ela, Sri Lanka"} /></div><div><label>Business Logo</label><div className="st-logo-placeholder">🛒<small>Priyasaman<br/>Super Mart</small></div><label>Currency *</label><select defaultValue="LKR"><option value="LKR">LKR – Sri Lankan Rupee (Rs.)</option></select><label>Tax (VAT) Rate</label><input type="number" defaultValue="15" /><label>Fiscal Year Start</label><select defaultValue="January"><option>January</option><option>April</option></select></div></div></div>
          <div className="st-panel"><h3>Store Operating Hours</h3><div className="st-hours">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => <div key={day}><strong>{day}</strong><input type="checkbox" defaultChecked={i < 6}/><small>{i === 6 ? "Closed" : "08:00 AM – 09:00 PM"}</small></div>)}</div></div>
          <p className="st-hint">Business details are a visual preview; backend saving will be connected with the business settings API.</p>
        </> : <><div className="st-section-head"><span className="st-section-icon">⚙</span><div><h2>{section}</h2><p>{sections.find(item => item[0] === section)?.[1]}</p></div></div><div className="st-panel"><h3>{section}</h3><p className="st-hint">This settings section is ready for its dedicated configuration controls and backend integration.</p></div></>}
        {section === "Theme & Appearance" && <footer className="st-actions"><button type="button" className="st-reset" onClick={reset}>↻ Restore Original Theme</button><button type="button" className="st-reset" onClick={cancel}>Cancel Preview</button><button type="button" className="st-save" onClick={save}>▣ Save Changes</button>{savedNotice && <span role="status">Theme saved successfully</span>}</footer>}
      </div>
    </div>
  </div>;
}
