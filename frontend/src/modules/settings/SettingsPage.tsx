import { useState } from "react";
import "./SettingsPage.css";
import { businessTypes, defaultPOSBranding, iconForBusinessType } from "./posBranding";
import type { POSBranding } from "./posBranding";

export type POSTheme = { primary: string; accent: string; button: string | null; header: string | null };
export const defaultPOSTheme: POSTheme = { primary: "#003f2d", accent: "#ff9200", button: null, header: null };
const defaultBusinessProfile = { name: "Priyasaman Super Mart", type: "Retail Store", phone: "077 123 4567", email: "info@priyasamanmart.lk", address: "No. 120, Main Street,\\nJa-Ela, Sri Lanka", currency: "LKR", vat: "15", fiscal: "January" };
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
export default function SettingsPage({ theme, onSave, onPreview, branding, onBrandingPreview, onBrandingSave }: { theme: POSTheme; onSave: (theme: POSTheme) => void; onPreview: (theme: POSTheme | null) => void; branding: POSBranding; onBrandingPreview: (branding: POSBranding | null) => void; onBrandingSave: (branding: POSBranding) => void }) {
  const [brandDraft, setBrandDraft] = useState<POSBranding>(branding);
  const [businessDraft, setBusinessDraft] = useState(() => { try { const stored = window.localStorage.getItem("priyasaman-pos-business-profile"); return stored ? { ...defaultBusinessProfile, ...JSON.parse(stored) as Partial<typeof defaultBusinessProfile> } : defaultBusinessProfile; } catch { return defaultBusinessProfile; } });
  const [hoursDraft, setHoursDraft] = useState<boolean[]>(() => { try { const stored = window.localStorage.getItem("priyasaman-pos-operating-days"); const value: unknown = stored ? JSON.parse(stored) : null; return Array.isArray(value) && value.length === 7 && value.every(v => typeof v === "boolean") ? value : [true,true,true,true,true,true,false]; } catch { return [true,true,true,true,true,true,false]; } });
  const [savedNotice, setSavedNotice] = useState(false);
  const changeBrand = (patch: Partial<POSBranding>) => {
    const next = { ...brandDraft, ...patch };
    setBrandDraft(next);
    setSavedNotice(false);
    onBrandingPreview(next);
  };
  const [section, setSection] = useState<string>("Business Profile");
  const [draft, setDraft] = useState<POSTheme>(theme);
  const [autoButton, setAutoButton] = useState(theme.button === null);
  const [autoHeader, setAutoHeader] = useState(theme.header === null);
  const update = (patch: Partial<POSTheme>) => { setDraft(previous => { const next = { ...previous, ...patch }; if ([next.primary, next.accent, ...(next.button ? [next.button] : []), ...(next.header ? [next.header] : [])].every(validHex)) onPreview(next); return next; }); setSavedNotice(false); };
  const validTheme = [draft.primary, draft.accent, ...(draft.button ? [draft.button] : []), ...(draft.header ? [draft.header] : [])].every(validHex);
  const validBrand = Boolean(brandDraft.displayName.trim()) && brandDraft.displayName.trim().length <= 48;
  const [savedBusiness, setSavedBusiness] = useState(() => { try { const raw = window.localStorage.getItem("priyasaman-pos-business-profile"); return raw ? { ...defaultBusinessProfile, ...JSON.parse(raw) as Partial<typeof defaultBusinessProfile> } : defaultBusinessProfile; } catch { return defaultBusinessProfile; } });
  const [savedHours, setSavedHours] = useState<boolean[]>(() => { try { const raw = window.localStorage.getItem("priyasaman-pos-operating-days"); const v: unknown = raw ? JSON.parse(raw) : null; return Array.isArray(v) && v.length === 7 && v.every(x => typeof x === "boolean") ? v : [true,true,true,true,true,true,false]; } catch { return [true,true,true,true,true,true,false]; } });
  const dirty = JSON.stringify(draft) !== JSON.stringify(theme) || JSON.stringify(brandDraft) !== JSON.stringify(branding) || JSON.stringify(businessDraft) !== JSON.stringify(savedBusiness) || JSON.stringify(hoursDraft) !== JSON.stringify(savedHours);
  const discardAll = () => { setDraft(theme); setAutoButton(theme.button === null); setAutoHeader(theme.header === null); onPreview(null); setBrandDraft(branding); onBrandingPreview(null); setBusinessDraft(savedBusiness); setHoursDraft([...savedHours]); setSavedNotice(false); };
  const saveAll = () => {
    if (!validTheme || !validBrand || !dirty) return;
    const normalizedBrand = { ...brandDraft, displayName: brandDraft.displayName.trim() };
    onSave(draft);
    onBrandingSave(normalizedBrand);
    setBrandDraft(normalizedBrand);
    setSavedBusiness({ ...businessDraft });
    setSavedHours([...hoursDraft]);
    try {
      window.localStorage.setItem("priyasaman-pos-business-profile", JSON.stringify(businessDraft));
      window.localStorage.setItem("priyasaman-pos-operating-days", JSON.stringify(hoursDraft));
    } catch { /* In-memory settings remain available. */ }
    setSavedNotice(true);
  };
  return <div className="st-page">
    <header className="st-heading"><span className="st-gear">⚙</span><div><h1>System Settings</h1><p>Configure your POS, business, and system preferences.</p></div></header>
    <div className="st-layout">
      <nav className="st-navigation" aria-label="Settings sections">{sections.map(([name, description, icon]) => <button key={name} type="button" className={section === name ? "st-nav-item selected" : "st-nav-item"} onClick={() => setSection(name)}><span className="st-nav-icon">{icon}</span><span className="st-nav-label"><strong>{name}</strong><small>{description}</small></span><span className="st-nav-arrow">›</span></button>)}</nav>
      <div className="st-content">
        {section === "Theme & Appearance" ? <>
          
          <div className="st-panel"><h3>Choose a Theme</h3><div className="st-presets">{themePresets.map(p => <button type="button" key={p.name} className={"st-preset" + (draft.primary === p.primary && draft.accent === p.accent ? " active" : "")} onClick={() => { update({ primary: p.primary, accent: p.accent, button: null, header: null }); setAutoButton(true); setAutoHeader(true); }}><span className="st-preset-preview" style={{ background: `linear-gradient(165deg, color-mix(in srgb, ${p.primary} 48%, black), color-mix(in srgb, ${p.primary} 83%, black))` }}><i style={{ background: p.accent }} /></span><span>{p.name}</span></button>)}</div></div>
          <div className="st-panel"><h3>Color Customization Panel</h3><p className="st-hint">Choose any color using the full spectrum picker, enter a HEX code, or select a quick swatch. Automatic matching keeps the original POS gradient design.</p><div className="st-color-grid">
            <ColorField label="Sidebar / Primary Color" value={draft.primary} onChange={v => update({ primary: v })} />
            <ColorField label="Accent / Active Navigation" value={draft.accent} onChange={v => update({ accent: v })} />
            <div><label className="st-check"><input type="checkbox" checked={autoButton} onChange={e => { setAutoButton(e.target.checked); update({ button: e.target.checked ? null : draft.accent }); }} /> Automatically coordinate button color with accent</label>{!autoButton && <ColorField label="Primary Button Color" value={draft.button ?? draft.accent} onChange={v => update({ button: v })} />}</div>
            <div><label className="st-check"><input type="checkbox" checked={autoHeader} onChange={e => { setAutoHeader(e.target.checked); update({ header: e.target.checked ? null : "#e8f3ec" }); }} /> Automatically coordinate top bar with sidebar</label>{!autoHeader && <ColorField label="Top Bar Color" value={draft.header ?? "#e8f3ec"} onChange={v => update({ header: v })} />}</div>
          </div></div>
          
        </> : section === "Business Profile" ? <>
          
          <div className="st-panel st-brand-panel">
            <h3>System Branding</h3>
            <p className="st-hint">Personalize the name and icon displayed in the POS sidebar. Changes are previewed immediately. Use Save Changes below to apply edits across all sections.</p>
            <div className="st-brand-fields">
              <label>POS Display Name <input aria-label="POS Display Name" maxLength={48} value={brandDraft.displayName} onChange={e => changeBrand({ displayName: e.target.value })} placeholder="e.g. Dinith Bakery" /></label>
              <label>Business Category <select aria-label="Business Category" value={brandDraft.businessType} onChange={e => changeBrand({ businessType: e.target.value, icon: iconForBusinessType(e.target.value) })}>{businessTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></label>
            </div>

          </div>
          <div className="st-panel"><div className="st-profile-grid"><div><label>Business Name *</label><input value={businessDraft.name} onChange={e => { setBusinessDraft(v => ({ ...v, name: e.target.value })); setSavedNotice(false); }} /><label>Business Type</label><select value={businessDraft.type} onChange={e => { setBusinessDraft(v => ({ ...v, type: e.target.value })); setSavedNotice(false); }}><option>Retail Store</option><option>Wholesale</option><option>Restaurant</option><option>Other</option></select><label>Phone Number</label><input value={businessDraft.phone} onChange={e => { setBusinessDraft(v => ({ ...v, phone: e.target.value })); setSavedNotice(false); }} /><label>Email</label><input value={businessDraft.email} onChange={e => { setBusinessDraft(v => ({ ...v, email: e.target.value })); setSavedNotice(false); }} /><label>Address</label><textarea value={businessDraft.address} onChange={e => { setBusinessDraft(v => ({ ...v, address: e.target.value })); setSavedNotice(false); }} /></div><div><label>Business Logo</label><div className="st-logo-placeholder">🛒<small>Priyasaman<br/>Super Mart</small></div><label>Currency *</label><select value={businessDraft.currency} onChange={e => { setBusinessDraft(v => ({ ...v, currency: e.target.value })); setSavedNotice(false); }}><option value="LKR">LKR – Sri Lankan Rupee (Rs.)</option></select><label>Tax (VAT) Rate</label><input type="number" value={businessDraft.vat} onChange={e => { setBusinessDraft(v => ({ ...v, vat: e.target.value })); setSavedNotice(false); }} /><label>Fiscal Year Start</label><select value={businessDraft.fiscal} onChange={e => { setBusinessDraft(v => ({ ...v, fiscal: e.target.value })); setSavedNotice(false); }}><option>January</option><option>April</option></select></div></div></div>


        </> : section === "POS Preferences" ? <><div className="st-panel"><h3>Store Operating Hours</h3><p className="st-hint">Configure the days your business operates. Choose operating days, then save with the common Save Changes button.</p><div className="st-hours">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => <div key={day}><strong>{day}</strong><input type="checkbox" checked={hoursDraft[i]} onChange={e => { setHoursDraft(previous => previous.map((v, index) => index === i ? e.target.checked : v)); setSavedNotice(false); }}/><small>{hoursDraft[i] ? "08:00 AM – 09:00 PM" : "Closed"}</small></div>)}</div></div></> : <><div className="st-panel"><h3>{section}</h3><p className="st-hint">This settings section is ready for its dedicated configuration controls and backend integration.</p></div></>}

      </div>
    </div>
    <footer className="st-global-actions">
      <span className="st-save-status" role="status">{dirty ? "Unsaved changes" : savedNotice ? "All changes saved" : "No unsaved changes"}</span>
      <button type="button" className="st-reset" onClick={discardAll} disabled={!dirty}>Discard Changes</button>
      <button type="button" className="st-save" onClick={saveAll} disabled={!dirty || !validTheme || !validBrand}>Save Changes</button>
    </footer>
  </div>;
}
