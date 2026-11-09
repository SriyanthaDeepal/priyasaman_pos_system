import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, Close, QrCodeScanner, Keyboard, ReceiptLong, CalendarMonth, PersonOutlined, Payments } from "@mui/icons-material";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import BarcodeScanner from "../../components/common/BarcodeScanner/BarcodeScanner";
import SinhalaTouchKeyboard from "../pos/SinhalaTouchKeyboard";
import { products } from "../pos/productCatalog";
import type { Product } from "../pos/productCatalog";
import "./ReturnExchangePage.css";

export type ExchangeItem = { name: string; qty: number; price: number; barcode?: string };
export type ExchangeSale = { invoice: string; customer: string; cashier: string; method: string; time: string; items: ExchangeItem[]; status: string };
type ReturnRow = { index: number; qty: number; reason: string; restock: boolean };
type ReplacementRow = ExchangeItem & { id: number };
const CASH_DENOMINATIONS = [1, 2, 5, 10, 20, 50, 100, 500, 1000, 2000, 5000] as const;
const money = (n: number) => "Rs. " + n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default function ReturnExchangePage({ sale, onBack }: { sale: ExchangeSale; onBack: () => void }) {
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [replacements, setReplacements] = useState<ReplacementRow[]>([]);
  const [returnSearch, setReturnSearch] = useState("");
  const [replacementSearch, setReplacementSearch] = useState("");
  const [scanner, setScanner] = useState<"return" | "replacement" | null>(null);
  const [touchTarget, setTouchTarget] = useState<"return" | "replacement" | null>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);
  const replacementInputRef = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState("Cash");
  const [cashCounts, setCashCounts] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [viewOriginal, setViewOriginal] = useState(false);
  const [focusedSearch, setFocusedSearch] = useState<"return" | "replacement" | null>(null);
  // Dismiss uncommitted searches when the cashier interacts elsewhere.
  // Keep the touch keyboard and both suggestion lists interactive.
  useEffect(() => {
    const dismissOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".rex-search, .rex-suggestions, .rex-keyboard-dock")) return;
      setFocusedSearch(null);
      setReturnSearch("");
      setReplacementSearch("");
    };
    document.addEventListener("pointerdown", dismissOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", dismissOnOutsidePointer);
  }, []);
  const returnMatches = useMemo(() => { const q = returnSearch.trim().toLocaleLowerCase(); return q ? sale.items.map((item,index) => ({item,index})).filter(({item}) => item.name.toLocaleLowerCase().includes(q) || item.barcode?.toLowerCase().includes(q) || products.some(p => p.name === item.name && (p.sku.toLowerCase().includes(q) || p.barcode.includes(q) || p.sinhalaName?.toLocaleLowerCase().includes(q)))).slice(0,8) : []; },[returnSearch,sale.items]);
  const replacementMatches = useMemo(() => { const q = replacementSearch.trim().toLocaleLowerCase(); return q ? products.filter(p => p.name.toLocaleLowerCase().includes(q) || p.sinhalaName?.toLocaleLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q)).slice(0,8) : []; },[replacementSearch]);
  const originalSubtotal = sale.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const returnCredit = useMemo(() => returns.reduce((sum, row) => sum + sale.items[row.index].price * row.qty, 0), [returns, sale.items]);
  const replacementTotal = useMemo(() => replacements.reduce((sum, row) => sum + row.price * row.qty, 0), [replacements]);
  const balance = Math.round((replacementTotal - returnCredit) * 100) / 100;
  const cashCounted = CASH_DENOMINATIONS.reduce((sum, value) => sum + value * (cashCounts[value] ?? 0), 0);
  const updateCashCount = (value: number, change: number) => {
    setCashCounts(previous => ({ ...previous, [value]: Math.max(0, (previous[value] ?? 0) + change) }));
    setConfirmed(false);
  };
  const selectedReturn = (index: number) => returns.find(row => row.index === index);
  const setReturnQty = (index: number, qty: number) => {
    const bounded = Math.min(sale.items[index].qty, Math.max(0, Math.floor(qty) || 0));
    setReturns(prev => [...prev.filter(row => row.index !== index), ...(bounded ? [{ index, qty: bounded, reason: prev.find(row => row.index === index)?.reason ?? "Customer request", restock: prev.find(row => row.index === index)?.restock ?? true }] : [])]);
    setConfirmed(false);
  };
  const addReturnIndex = (index: number) => {
    const current = selectedReturn(index)?.qty ?? 0;
    if (current >= sale.items[index].qty) throw new Error("All purchased units are already selected for return.");
    setReturnQty(index, current + 1);
    setReturnSearch("");
    setFocusedSearch(null);
    setMessage("");
  };
  const addReturn = (query: string) => {
    const q = query.trim().toLocaleLowerCase();
    const match = sale.items.findIndex(item => item.name.toLocaleLowerCase() === q || item.barcode?.toLowerCase() === q || products.some(p => p.name === item.name && (p.sku.toLowerCase() === q || p.barcode === q)));
    if (!q || match < 0) {
      if (returnMatches.length === 1) return addReturnIndex(returnMatches[0].index);
      throw new Error(returnMatches.length > 1 ? "Choose the correct item from the matching invoice products." : "This product is not present on the original invoice.");
    }
    addReturnIndex(match);
  };
  const addReplacementProduct = (found: Product) => {
    const existing = replacements.find(item => item.barcode === found.barcode);
    if (found.stock <= (existing?.qty ?? 0)) throw new Error("No additional demonstration stock available for this product.");
    setReplacements(prev => existing ? prev.map(item => item.id === existing.id ? { ...item, qty: item.qty + 1 } : item) : [...prev, { name:found.name, price:found.price, barcode:found.barcode, qty:1, id:nextId }]);
    setNextId(v => v + 1);
    setReplacementSearch("");
    setFocusedSearch(null);
    setConfirmed(false);
    setMessage("");
  };
  const addReplacement = (query: string) => {
    const q = query.trim().toLocaleLowerCase();
    const exact = products.find(item => item.barcode === q || item.sku.toLowerCase() === q || item.name.toLocaleLowerCase() === q || item.sinhalaName?.toLocaleLowerCase() === q);
    const found = exact ?? (replacementMatches.length === 1 ? replacementMatches[0] : undefined);
    if (!q || !found) throw new Error(replacementMatches.length > 1 ? "Choose a product from the matching catalog results." : "Product not found in the POS demonstration catalog.");
    addReplacementProduct(found);
  };
  const runSearch = (kind: "return" | "replacement") => {
    try { kind === "return" ? addReturn(returnSearch) : addReplacement(replacementSearch); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add product."); }
  };
  const submitTouchKeyboard = (kind: "return" | "replacement") => {
    setTouchTarget(null);
    setFocusedSearch(kind);
  };
  const scan = (code: string) => {
    if (scanner === "return") addReturn(code);
    else addReplacement(code);
    setScanner(null);
  };
  const changeReplacementQty = (id: number, qty: number) => {
    setReplacements(prev => prev.map(item => item.id === id ? { ...item, qty: Math.min(products.find(p => p.barcode === item.barcode)?.stock ?? Number.MAX_SAFE_INTEGER, Math.max(1, Math.floor(qty) || 1)) } : item));
    setConfirmed(false);
  };
  const confirm = () => {
    if (!returns.length) { setMessage("Select at least one original invoice item to return."); return; }
    setConfirmed(true);
    setMessage("Demo preview confirmed. No refund, payment, stock change, or new invoice was saved to the backend.");
  };
  return <div className="rex-page">
    <header className="rex-heading">
      <div className="rex-heading-title"><div><h1>Return / Exchange</h1><p>Manage returns, replacements and refunds.</p></div></div>
      <section className="rex-invoice-strip" aria-label="Selected original invoice">
        <div className="rex-invoice-primary"><ReceiptLong/><span><small>Invoice</small><button type="button" className="rex-invoice-link" onClick={() => { setTouchTarget(null); setViewOriginal(true); }} title="View original invoice details" aria-label={`View original invoice ${sale.invoice}`}>{sale.invoice}</button></span></div>
        <div><CalendarMonth fontSize="small"/><span><small>Time</small><strong>{sale.time}</strong></span></div>
        <div><PersonOutlined fontSize="small"/><span><small>Customer</small><strong>{sale.customer}</strong></span></div>
        <div><PersonOutlined fontSize="small"/><span><small>Cashier</small><strong>{sale.cashier}</strong></span></div>
        <div><Payments fontSize="small"/><span><small>Payment</small><strong className="rex-payment-pill">{sale.method}</strong></span></div>
        <div><span><small>Original Subtotal</small><strong>{money(originalSubtotal)}</strong></span></div>
      </section>
    </header>
    {message && <div className="rex-alert" role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss"><Close fontSize="small" /></button></div>}
    <div className="rex-grid">
      <div className="rex-products">
        <section className="rex-panel rex-return"><div className="rex-section-head"><h2>↩ Return Items</h2><div className="rex-search"><input ref={returnInputRef} onFocus={() => setFocusedSearch("return")} aria-label="Search returned item" placeholder="Scan or type original item name / SKU" value={returnSearch} onChange={e => setReturnSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") runSearch("return"); }} /><button onClick={() => setTouchTarget("return")} title="Open touch keyboard for returned item" aria-label="Open return item keyboard"><Keyboard fontSize="small" /></button><button onClick={() => setScanner("return")} title="Scan returned item"><QrCodeScanner fontSize="small" /> Scan</button></div></div>{focusedSearch === "return" && returnSearch.trim() && <div className="rex-suggestions" role="listbox" aria-label="Matching original invoice items">{returnMatches.length ? returnMatches.map(({item,index}) => <button key={index} type="button" role="option" aria-selected={false} onClick={() => { try { addReturnIndex(index); } catch(error) { setMessage(error instanceof Error ? error.message : "Unable to return item."); } }}><span><strong>{item.name}</strong><small>Purchased: {item.qty} · Available to return: {item.qty - (selectedReturn(index)?.qty ?? 0)}</small></span><b>{money(item.price)}</b></button>) : <p>No matching items on this invoice.</p>}</div>}<div className="rex-table-scroll"><table><thead><tr><th>Item</th><th>Return Qty</th><th>Unit Price</th><th>Return Value</th><th>Reason / Condition</th><th></th></tr></thead><tbody>{returns.length ? [...returns].sort((a,b) => a.index-b.index).map(row => { const item = sale.items[row.index]; return <tr key={row.index}><td>{item.name}</td><td><div className="rex-qty"><button onClick={() => setReturnQty(row.index, row.qty-1)}>−</button><input aria-label={"Return quantity for " + item.name} type="number" min={0} max={item.qty} value={row.qty} onChange={e => setReturnQty(row.index, Number(e.target.value))}/><button onClick={() => setReturnQty(row.index, row.qty+1)}>+</button></div></td><td>{money(item.price)}</td><td>{money(item.price*row.qty)}</td><td><select aria-label={"Reason for " + item.name} value={row.reason} onChange={e => setReturns(prev => prev.map(r => r.index===row.index?{...r,reason:e.target.value}:r))}><option>Customer request</option><option>Wrong item</option><option>Damaged</option><option>Defective</option><option>Other</option></select><label className="rex-restock"><input type="checkbox" checked={row.restock} onChange={e => setReturns(prev => prev.map(r => r.index===row.index?{...r,restock:e.target.checked}:r))}/> Restock</label></td><td><button className="rex-delete" onClick={() => setReturnQty(row.index,0)} aria-label={"Remove " + item.name}>×</button></td></tr>; }) : <tr><td colSpan={6} className="rex-empty">Scan or search an item from the original invoice to return it.</td></tr>}</tbody></table></div><div className="rex-total">Return Credit <strong>{money(returnCredit)}</strong></div></section>
        <section className="rex-panel rex-replacement"><div className="rex-section-head"><h2>✚ Replacement Items</h2><div className="rex-search"><input ref={replacementInputRef} onFocus={() => setFocusedSearch("replacement")} aria-label="Search replacement product" placeholder="Scan or type product name / SKU" value={replacementSearch} onChange={e => setReplacementSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") runSearch("replacement"); }} /><button onClick={() => setTouchTarget("replacement")} title="Open touch keyboard for replacement item" aria-label="Open replacement item keyboard"><Keyboard fontSize="small" /></button><button onClick={() => setScanner("replacement")} title="Scan replacement product"><QrCodeScanner fontSize="small" /> Scan</button></div></div>{focusedSearch === "replacement" && replacementSearch.trim() && <div className="rex-suggestions" role="listbox" aria-label="Matching POS catalog products">{replacementMatches.length ? replacementMatches.map(item => <button key={item.id} type="button" role="option" aria-selected={false} disabled={item.stock <= (replacements.find(r => r.barcode === item.barcode)?.qty ?? 0)} onClick={() => { try { addReplacementProduct(item); } catch(error) { setMessage(error instanceof Error ? error.message : "Unable to add product."); } }}><span><strong>{item.emoji} {item.name}</strong><small>{item.sinhalaName ? item.sinhalaName+" · " : ""}{item.sku} · Stock: {item.stock} {item.unit}</small></span><b>{money(item.price)}</b></button>) : <p>No matching products in the POS catalog.</p>}</div>}<div className="rex-table-scroll"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th><th></th></tr></thead><tbody>{replacements.length ? replacements.map(item => <tr key={item.id}><td>{item.name}<small className="rex-sku">{item.barcode}</small></td><td><div className="rex-qty"><button onClick={() => changeReplacementQty(item.id,item.qty-1)}>−</button><input aria-label={"Quantity for " + item.name} type="number" min={1} value={item.qty} onChange={e => changeReplacementQty(item.id,Number(e.target.value))}/><button onClick={() => changeReplacementQty(item.id,item.qty+1)}>+</button></div></td><td>{money(item.price)}</td><td>{money(item.price*item.qty)}</td><td><button className="rex-delete" onClick={() => {setReplacements(prev => prev.filter(r => r.id!==item.id));setConfirmed(false);}} aria-label={"Remove " + item.name}>×</button></td></tr>) : <tr><td colSpan={5} className="rex-empty">Scan or search replacement products, or leave empty for a refund-only transaction.</td></tr>}</tbody></table></div><div className="rex-total">Replacement Total <strong>{money(replacementTotal)}</strong></div></section>
      </div>
      <section className="rex-panel rex-settlement"><h2>▦ Settlement Summary</h2><div className="rex-line"><span>Return Credit</span><strong>− {money(returnCredit)}</strong></div><div className="rex-line"><span>Replacement Total</span><strong>+ {money(replacementTotal)}</strong></div><div className="rex-difference"><small>{balance>0?"Customer Pays (Additional)":balance<0?"Refund to Customer":"Even Exchange"}</small><strong>{money(Math.abs(balance))}</strong></div><h3>{balance>0?"Payment Method":balance<0?"Refund Method":"Settlement"}</h3>{balance!==0 ? <div className="rex-methods">{(balance>0?["Cash","Card","QR Payment","Bank Transfer","Mixed Payment","Credit"]:["Cash","Bank Transfer","QR / Digital Refund","Customer Credit Account","Store Credit","Gift Voucher"]).map(option => <button key={option} className={method===option?"active":""} onClick={() => setMethod(option)}>{option}</button>)}</div> : <p className="rex-muted">No money needs to change hands.</p>}{balance!==0 && method==="Cash" && <div className="rex-cash-denominations">
        <div className="rex-cash-heading"><h3>Cash Denominations <small>(Optional)</small></h3><button type="button" onClick={() => {setCashCounts({});setConfirmed(false);}} disabled={!cashCounted}>Clear</button></div>
        <div className="rex-cash-grid">{CASH_DENOMINATIONS.map(value => <div className="rex-cash-denom" key={value}>
          <button type="button" className="rex-cash-add" onClick={() => updateCashCount(value,1)} aria-label={`Add one ${value} rupee denomination`}>+{value.toLocaleString("en-LK")}</button>
          {(cashCounts[value] ?? 0)>0 && <div className="rex-cash-counter"><button type="button" onClick={() => updateCashCount(value,-1)} aria-label={`Remove one ${value} rupee denomination`}>−</button><span>{cashCounts[value]}</span><button type="button" onClick={() => updateCashCount(value,1)} aria-label={`Add another ${value} rupee denomination`}>+</button></div>}
        </div>)}</div>
        <div className="rex-cash-counted"><span>Cash Counted <strong>{money(cashCounted)}</strong></span><span>{cashCounted===Math.abs(balance)?"Exact Match":cashCounted<Math.abs(balance)?"Remaining":"Excess"} <strong>{money(Math.abs(Math.abs(balance)-cashCounted))}</strong></span></div>
      </div>}<h3>Notes (Optional)</h3><textarea aria-label="Return notes" placeholder="Return or exchange notes..." value={notes} onChange={e => setNotes(e.target.value)}/></section>
      <section className="rex-panel rex-receipt"><h2>Adjusted Invoice</h2><div className="rex-receipt-paper"><div className="rex-receipt-static"><div className="rex-receipt-meta"><div>Original Invoice: {sale.invoice}</div><div>Customer: {sale.customer}</div></div></div><div className="rex-receipt-items"><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>{sale.items.map((item,index) => { const returned=selectedReturn(index)?.qty ?? 0; return <tr key={index}><td>{item.name}{returned>0&&<small className="rex-returned-tag">RETURNED {returned} / {item.qty}</small>}</td><td>{item.qty}</td><td>{money(item.qty*item.price)}{returned>0&&<small className="rex-returned-tag rex-crossed">− {money(returned*item.price)}</small>}</td></tr>; })}{replacements.map(item => <tr className="rex-new" key={item.id}><td>+ {item.name}</td><td>{item.qty}</td><td>{money(item.qty*item.price)}</td></tr>)}</tbody></table></div><div className="rex-receipt-bottom"><div className="rex-line"><span>Original Subtotal</span><strong>{money(originalSubtotal)}</strong></div><div className="rex-line"><span>Returned Value</span><strong>− {money(returnCredit)}</strong></div><div className="rex-line"><span>New Items</span><strong>+ {money(replacementTotal)}</strong></div><div className="rex-adjusted">Adjusted Subtotal <strong>{money(originalSubtotal-returnCredit+replacementTotal)}</strong></div><div className="rex-receipt-due">{balance>0?"Additional Payment":balance<0?"Customer Refund":"No Balance Due"} <strong>{money(Math.abs(balance))}</strong></div><div className="rex-receipt-actions"><button className="rex-cancel" onClick={onBack}><Close fontSize="small"/> Cancel</button><button className="rex-confirm" onClick={confirm} disabled={!returns.length}><CheckCircle fontSize="small"/> {confirmed?"Demo Confirmed":"Confirm Return / Exchange"}</button></div></div></div></section>
    </div>
    {touchTarget && <aside className="rex-keyboard-dock" aria-label={touchTarget === "return" ? "Return item touch keyboard" : "Replacement item touch keyboard"}><div className="rex-keyboard-dock-title"><strong>{touchTarget === "return" ? "Return item search" : "Replacement product search"}</strong><span>Choose a matching product from the list on the left.</span></div><SinhalaTouchKeyboard key={touchTarget} value={touchTarget === "return" ? returnSearch : replacementSearch} onChange={touchTarget === "return" ? setReturnSearch : setReplacementSearch} inputRef={touchTarget === "return" ? returnInputRef : replacementInputRef} onClose={() => submitTouchKeyboard(touchTarget)}/></aside>}
    <Dialog open={viewOriginal} onClose={() => setViewOriginal(false)} fullWidth maxWidth="md" aria-labelledby="rex-original-invoice-title" slotProps={{paper:{sx:{borderRadius:3,overflow:"hidden",maxHeight:"min(85dvh,800px)"}}}}>
      <DialogTitle id="rex-original-invoice-title" component="div" sx={{p:0}}>
        <div className="rex-original-header">
          <div className="rex-original-header-icon"><ReceiptLong /></div>
          <div className="rex-original-header-text"><span>ORIGINAL SALES INVOICE</span><h2>{sale.invoice}</h2><p>Purchase details for this return or exchange</p></div>
          <IconButton onClick={() => setViewOriginal(false)} aria-label="Close original invoice"><Close /></IconButton>
        </div>
      </DialogTitle>
      <DialogContent dividers className="rex-original-content">
        <div className="rex-original-info">
          <div><small>Customer</small><strong>{sale.customer}</strong></div>
          <div><small>Cashier</small><strong>{sale.cashier}</strong></div>
          <div><small>Purchase Time</small><strong>{sale.time}</strong></div>
          <div><small>Payment Method</small><strong className="rex-original-payment">{sale.method}</strong></div>
        </div>
        <div className="rex-original-products-heading"><ReceiptLong fontSize="small"/><strong>Purchased Items</strong><span>{sale.items.length} products</span></div>
        <div className="rex-original-table-wrap"><table className="rex-original-table">
          <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr></thead>
          <tbody>{sale.items.map((item,index)=><tr key={index}><td><span className="rex-original-row-number">{index+1}</span><strong>{item.name}</strong></td><td>{item.qty}</td><td>{money(item.price)}</td><td>{money(item.qty*item.price)}</td></tr>)}</tbody>
        </table></div>
        <div className="rex-original-grand-total"><span>Original Subtotal</span><strong>{money(originalSubtotal)}</strong></div>
        <p className="rex-original-disclaimer">Demonstration invoice summary. Original sale taxes and discounts are not recalculated here.</p>
      </DialogContent>
    </Dialog>
    <Dialog open={scanner!==null} onClose={() => setScanner(null)} fullWidth maxWidth="sm" slotProps={{paper:{sx:{borderRadius:2.5}}}}><DialogTitle sx={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>{scanner==="return"?"Scan Returned Item":"Scan Replacement Item"}<IconButton onClick={() => setScanner(null)} aria-label="Close scanner"><Close/></IconButton></DialogTitle><DialogContent dividers><BarcodeScanner label="Product barcode / SKU" placeholder="Scan or enter product barcode" submitLabel="Add Item" onScan={scan}/></DialogContent></Dialog>
  </div>;
}
