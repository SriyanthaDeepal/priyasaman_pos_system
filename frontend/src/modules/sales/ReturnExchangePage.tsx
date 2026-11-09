import { useMemo, useState } from "react";
import { ArrowBack, CheckCircle, Close, LocalPrintshop, QrCodeScanner, Search, ReceiptLong, CalendarMonth, PersonOutlined, Payments, Visibility } from "@mui/icons-material";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import BarcodeScanner from "../../components/common/BarcodeScanner/BarcodeScanner";
import BarcodeDisplay from "../../components/common/BarcodeDisplay/BarcodeDisplay";
import "./ReturnExchangePage.css";

export type ExchangeItem = { name: string; qty: number; price: number; barcode?: string };
export type ExchangeSale = { invoice: string; customer: string; cashier: string; method: string; time: string; items: ExchangeItem[]; status: string };
type ReturnRow = { index: number; qty: number; reason: string; restock: boolean };
type ReplacementRow = ExchangeItem & { id: number };
const money = (n: number) => "Rs. " + n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const catalog: ExchangeItem[] = [
  { name: "Basmati Rice 5 kg", price: 4900, qty: 1, barcode: "RICE-005" },
  { name: "Sunflower Oil 1 L", price: 1450, qty: 1, barcode: "OIL-001" },
  { name: "Toothpaste 120 g", price: 380, qty: 1, barcode: "PASTE-120" },
  { name: "Tea 200 g", price: 640, qty: 1, barcode: "TEA-200" },
  { name: "Premium Rice 5 kg", price: 890, qty: 1, barcode: "RICE-001" },
  { name: "Black Tea 200 g", price: 640, qty: 1, barcode: "TEA-001" },
  { name: "Cooking Oil 1 L", price: 1800, qty: 1, barcode: "OIL-002" },
];
export default function ReturnExchangePage({ sale, onBack, onFindInvoice }: { sale: ExchangeSale; onBack: () => void; onFindInvoice: () => void }) {
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [replacements, setReplacements] = useState<ReplacementRow[]>([]);
  const [returnSearch, setReturnSearch] = useState("");
  const [replacementSearch, setReplacementSearch] = useState("");
  const [scanner, setScanner] = useState<"return" | "replacement" | null>(null);
  const [method, setMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [viewOriginal, setViewOriginal] = useState(false);
  const originalSubtotal = sale.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const returnCredit = useMemo(() => returns.reduce((sum, row) => sum + sale.items[row.index].price * row.qty, 0), [returns, sale.items]);
  const replacementTotal = useMemo(() => replacements.reduce((sum, row) => sum + row.price * row.qty, 0), [replacements]);
  const balance = Math.round((replacementTotal - returnCredit) * 100) / 100;
  const selectedReturn = (index: number) => returns.find(row => row.index === index);
  const setReturnQty = (index: number, qty: number) => {
    const bounded = Math.min(sale.items[index].qty, Math.max(0, Math.floor(qty) || 0));
    setReturns(prev => [...prev.filter(row => row.index !== index), ...(bounded ? [{ index, qty: bounded, reason: prev.find(row => row.index === index)?.reason ?? "Customer request", restock: prev.find(row => row.index === index)?.restock ?? true }] : [])]);
    setConfirmed(false);
  };
  const addReturn = (query: string) => {
    const q = query.trim().toLowerCase();
    const index = sale.items.findIndex(item => item.name.toLowerCase().includes(q) || item.barcode?.toLowerCase() === q);
    if (!q || index < 0) throw new Error("This item is not present on the selected original invoice.");
    const current = selectedReturn(index)?.qty ?? 0;
    if (current >= sale.items[index].qty) throw new Error("All purchased units are already selected for return.");
    setReturnQty(index, current + 1);
    setReturnSearch("");
    setMessage("");
  };
  const addReplacement = (query: string) => {
    const q = query.trim().toLowerCase();
    const found = catalog.find(item => item.barcode?.toLowerCase() === q || item.name.toLowerCase() === q)
      ?? catalog.find(item => item.name.toLowerCase().includes(q));
    if (!q || !found) throw new Error("Product not found in the demonstration catalog. Search by product name or SKU.");
    setReplacements(prev => {
      const existing = prev.find(item => item.name === found.name);
      return existing ? prev.map(item => item.id === existing.id ? { ...item, qty: item.qty + 1 } : item) : [...prev, { ...found, qty: 1, id: nextId }];
    });
    setNextId(v => v + 1);
    setReplacementSearch("");
    setConfirmed(false);
    setMessage("");
  };
  const runSearch = (kind: "return" | "replacement") => {
    try { kind === "return" ? addReturn(returnSearch) : addReplacement(replacementSearch); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add product."); }
  };
  const scan = (code: string) => {
    if (scanner === "return") addReturn(code);
    else addReplacement(code);
    setScanner(null);
  };
  const changeReplacementQty = (id: number, qty: number) => {
    setReplacements(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, Math.floor(qty) || 1) } : item));
    setConfirmed(false);
  };
  const preview = () => window.print();
  const confirm = () => {
    if (!returns.length) { setMessage("Select at least one original invoice item to return."); return; }
    setConfirmed(true);
    setMessage("Demo preview confirmed. No refund, payment, stock change, or new invoice was saved to the backend.");
  };
  return <div className="rex-page">
    <header className="rex-heading"><div><button className="rex-back" onClick={onBack} aria-label="Back to Sales Management"><ArrowBack /></button><div><h1>Return / Exchange</h1><p>Process product returns, exchanges and refunds with an adjusted invoice preview.</p></div></div><div className="rex-heading-actions"><button className="rex-top-scan" onClick={onFindInvoice}><QrCodeScanner fontSize="small"/> Scan Invoice</button><button className="rex-top-find" onClick={onFindInvoice}><Search fontSize="small"/> Find Invoice</button></div></header>
    <section className="rex-invoice-strip">
      <div className="rex-invoice-primary"><ReceiptLong/><span><small>Original Invoice</small><strong>{sale.invoice}</strong></span></div>
      <div><CalendarMonth fontSize="small"/><span><small>Date &amp; Time</small><strong>{sale.time}</strong></span></div>
      <div><PersonOutlined fontSize="small"/><span><small>Customer</small><strong>{sale.customer}</strong></span></div>
      <div><Payments fontSize="small"/><span><small>Payment</small><strong className="rex-payment-pill">{sale.method}</strong></span></div>
      <div><span><small>Original Total (Demo)</small><strong>{money(originalSubtotal)}</strong></span></div>
      <button className="rex-view-invoice" onClick={() => setViewOriginal(true)}><Visibility fontSize="small"/> View Invoice</button>
    </section>
    <div className="rex-steps"><span className="current">1 &nbsp; Select Returned Items</span><span>2 &nbsp; Add Replacement Items</span><span>3 &nbsp; Settle & Confirm</span></div>
    {message && <div className="rex-alert" role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss"><Close fontSize="small" /></button></div>}
    <div className="rex-grid">
      <div className="rex-products">
        <section className="rex-panel"><h2>Original Invoice Items <small>(for reference)</small></h2><div className="rex-table-scroll"><table><thead><tr><th>Item</th><th>Purchased</th><th>Returning</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>{sale.items.map((item, index) => <tr key={index}><td>{item.name}</td><td>{item.qty}</td><td>{selectedReturn(index)?.qty ?? 0}</td><td>{money(item.price)}</td><td>{money(item.qty * item.price)}</td></tr>)}</tbody></table></div></section>
        <section className="rex-panel rex-return"><div className="rex-section-head"><h2>↩ Return Items</h2><div className="rex-search"><input aria-label="Search returned item" placeholder="Scan or type original item name / SKU" value={returnSearch} onChange={e => setReturnSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") runSearch("return"); }} /><button onClick={() => runSearch("return")} title="Find item"><Search fontSize="small" /></button><button onClick={() => setScanner("return")} title="Scan returned item"><QrCodeScanner fontSize="small" /> Scan</button></div></div><div className="rex-table-scroll"><table><thead><tr><th>Item</th><th>Return Qty</th><th>Unit Price</th><th>Return Value</th><th>Reason / Condition</th><th></th></tr></thead><tbody>{returns.length ? [...returns].sort((a,b) => a.index-b.index).map(row => { const item = sale.items[row.index]; return <tr key={row.index}><td>{item.name}</td><td><div className="rex-qty"><button onClick={() => setReturnQty(row.index, row.qty-1)}>−</button><input aria-label={"Return quantity for " + item.name} type="number" min={0} max={item.qty} value={row.qty} onChange={e => setReturnQty(row.index, Number(e.target.value))}/><button onClick={() => setReturnQty(row.index, row.qty+1)}>+</button></div></td><td>{money(item.price)}</td><td>{money(item.price*row.qty)}</td><td><select aria-label={"Reason for " + item.name} value={row.reason} onChange={e => setReturns(prev => prev.map(r => r.index===row.index?{...r,reason:e.target.value}:r))}><option>Customer request</option><option>Wrong item</option><option>Damaged</option><option>Defective</option><option>Other</option></select><label className="rex-restock"><input type="checkbox" checked={row.restock} onChange={e => setReturns(prev => prev.map(r => r.index===row.index?{...r,restock:e.target.checked}:r))}/> Restock</label></td><td><button className="rex-delete" onClick={() => setReturnQty(row.index,0)} aria-label={"Remove " + item.name}>×</button></td></tr>; }) : <tr><td colSpan={6} className="rex-empty">Scan or search an item from the original invoice to return it.</td></tr>}</tbody></table></div><div className="rex-total">Return Credit <strong>{money(returnCredit)}</strong></div></section>
        <section className="rex-panel rex-replacement"><div className="rex-section-head"><h2>✚ Replacement Items</h2><div className="rex-search"><input aria-label="Search replacement product" placeholder="Scan or type product name / SKU" value={replacementSearch} onChange={e => setReplacementSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") runSearch("replacement"); }} /><button onClick={() => runSearch("replacement")} title="Find product"><Search fontSize="small" /></button><button onClick={() => setScanner("replacement")} title="Scan replacement product"><QrCodeScanner fontSize="small" /> Scan</button></div></div><div className="rex-table-scroll"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th><th></th></tr></thead><tbody>{replacements.length ? replacements.map(item => <tr key={item.id}><td>{item.name}<small className="rex-sku">{item.barcode}</small></td><td><div className="rex-qty"><button onClick={() => changeReplacementQty(item.id,item.qty-1)}>−</button><input aria-label={"Quantity for " + item.name} type="number" min={1} value={item.qty} onChange={e => changeReplacementQty(item.id,Number(e.target.value))}/><button onClick={() => changeReplacementQty(item.id,item.qty+1)}>+</button></div></td><td>{money(item.price)}</td><td>{money(item.price*item.qty)}</td><td><button className="rex-delete" onClick={() => {setReplacements(prev => prev.filter(r => r.id!==item.id));setConfirmed(false);}} aria-label={"Remove " + item.name}>×</button></td></tr>) : <tr><td colSpan={5} className="rex-empty">Scan or search replacement products, or leave empty for a refund-only transaction.</td></tr>}</tbody></table></div><div className="rex-total">Replacement Total <strong>{money(replacementTotal)}</strong></div></section>
      </div>
      <section className="rex-panel rex-settlement"><h2>▦ Settlement Summary</h2><div className="rex-line"><span>Return Credit</span><strong>− {money(returnCredit)}</strong></div><div className="rex-line"><span>Replacement Total</span><strong>+ {money(replacementTotal)}</strong></div><div className="rex-difference"><small>{balance>0?"Customer Pays (Additional)":balance<0?"Refund to Customer":"Even Exchange"}</small><strong>{money(Math.abs(balance))}</strong></div><h3>{balance>0?"Payment Method":balance<0?"Refund Method":"Settlement"}</h3>{balance!==0 ? <div className="rex-methods">{(balance>0?["Cash","Card","QR Payment","Bank Transfer","Mixed Payment"]:["Cash","Original Payment Method","Bank Transfer","Store Credit"]).map(option => <button key={option} className={method===option?"active":""} onClick={() => setMethod(option)}>{option}</button>)}</div> : <p className="rex-muted">No money needs to change hands.</p>}<h3>Notes (Optional)</h3><textarea aria-label="Return notes" placeholder="Return or exchange notes..." value={notes} onChange={e => setNotes(e.target.value)}/><p className="rex-muted">Amounts are illustrative and exclude tax, discount, prior returns, and payment-provider adjustments until backend integration.</p></section>
      <section className="rex-panel rex-receipt"><h2>Adjusted Invoice <small>(Live Preview)</small></h2><div className="rex-receipt-paper"><div className="rex-receipt-brand">PRIYASAMAN POS</div><div className="rex-receipt-sub">RETURN & EXCHANGE INVOICE</div><div className="rex-receipt-meta"><div>Preview: EX-DEMO</div><div>Original: {sale.invoice}</div><div>Customer: {sale.customer}</div></div><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>{sale.items.map((item,index) => { const returned=selectedReturn(index)?.qty ?? 0; return <tr key={index}><td>{item.name}{returned>0&&<small className="rex-returned-tag">RETURNED {returned} / {item.qty}</small>}</td><td>{item.qty}</td><td>{money(item.qty*item.price)}{returned>0&&<small className="rex-returned-tag rex-crossed">− {money(returned*item.price)}</small>}</td></tr>; })}{replacements.map(item => <tr className="rex-new" key={item.id}><td>+ {item.name}</td><td>{item.qty}</td><td>{money(item.qty*item.price)}</td></tr>)}</tbody></table><div className="rex-line"><span>Original Subtotal</span><strong>{money(originalSubtotal)}</strong></div><div className="rex-line"><span>Returned Value</span><strong>− {money(returnCredit)}</strong></div><div className="rex-line"><span>New Items</span><strong>+ {money(replacementTotal)}</strong></div><div className="rex-adjusted">Adjusted Subtotal <strong>{money(originalSubtotal-returnCredit+replacementTotal)}</strong></div><div className="rex-receipt-due">{balance>0?"Additional Payment":balance<0?"Customer Refund":"No Balance Due"} <strong>{money(Math.abs(balance))}</strong></div><div className="rex-barcode"><BarcodeDisplay value="EX-DEMO" height={42} width={1.3} fontSize={11} margin={3} showDownload={false}/></div><div className="rex-receipt-foot">Preview only · Not a fiscal invoice</div></div></section>
    </div>
    <footer className="rex-footer"><button className="rex-cancel" onClick={onBack}><Close fontSize="small"/> Cancel</button><div><button className="rex-print" onClick={preview}><LocalPrintshop fontSize="small"/> Print Preview</button><button className="rex-confirm" onClick={confirm}><CheckCircle fontSize="small"/> {confirmed?"Demo Confirmed":"Confirm Return / Exchange"}</button></div></footer>
    <Dialog open={viewOriginal} onClose={() => setViewOriginal(false)} fullWidth maxWidth="sm"><DialogTitle sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>Original Invoice — {sale.invoice}<IconButton onClick={() => setViewOriginal(false)} aria-label="Close original invoice"><Close/></IconButton></DialogTitle><DialogContent dividers><p><strong>Customer:</strong> {sale.customer} &nbsp; <strong>Cashier:</strong> {sale.cashier}</p><p><strong>Time:</strong> {sale.time} &nbsp; <strong>Payment:</strong> {sale.method}</p><div className="rex-table-scroll"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>{sale.items.map((item,index)=><tr key={index}><td>{item.name}</td><td>{item.qty}</td><td>{money(item.price)}</td><td>{money(item.qty*item.price)}</td></tr>)}</tbody></table></div><div className="rex-total">Original Subtotal <strong>{money(originalSubtotal)}</strong></div><p className="rex-muted">This is a demonstration invoice summary; original sale tax and discounts are not recalculated here.</p></DialogContent></Dialog>
    <Dialog open={scanner!==null} onClose={() => setScanner(null)} fullWidth maxWidth="sm" slotProps={{paper:{sx:{borderRadius:2.5}}}}><DialogTitle sx={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>{scanner==="return"?"Scan Returned Item":"Scan Replacement Item"}<IconButton onClick={() => setScanner(null)} aria-label="Close scanner"><Close/></IconButton></DialogTitle><DialogContent dividers><BarcodeScanner label="Product barcode / SKU" placeholder="Scan or enter product barcode" submitLabel="Add Item" onScan={scan}/></DialogContent></Dialog>
  </div>;
}
