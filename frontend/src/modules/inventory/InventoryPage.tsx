import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Button, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Select } from "@mui/material";
import BarcodeScanner from "../../components/common/BarcodeScanner/BarcodeScanner";
import { Add, ArrowBack, ArrowForward, CheckCircle, DeleteOutlined, Inventory2Outlined, Search, SwapHoriz, Tune } from "@mui/icons-material";
import "./InventoryPage.css";

export type InventoryView = "overview" | "adjustment" | "transfer";
export type InventoryProduct = { id: string; name: string; category: string; barcode: string; unit: string; stock: number; buy: number; sell: number; reorder: number; emoji: string };
export const initialInventory: InventoryProduct[] = [
  {id:"PRD-00127",name:"Basmati Rice 5 kg",category:"Groceries",barcode:"8901234567890",unit:"Bag",stock:72,buy:4500,sell:4900,reorder:20,emoji:"🍚"},
  {id:"PRD-00456",name:"Sunflower Oil 1 L",category:"Groceries",barcode:"8901234567891",unit:"Bottle",stock:48,buy:1300,sell:1450,reorder:20,emoji:"🧴"},
  {id:"PRD-00389",name:"Toothpaste 120 g",category:"Personal Care",barcode:"8901234567892",unit:"Pack",stock:96,buy:320,sell:380,reorder:20,emoji:"🪥"},
  {id:"PRD-00741",name:"Tea 200 g",category:"Beverages",barcode:"8901234567893",unit:"Pack",stock:36,buy:580,sell:640,reorder:40,emoji:"🍵"},
  {id:"PRD-00567",name:"Milk Powder 400 g",category:"Groceries",barcode:"8901234567894",unit:"Pack",stock:15,buy:2100,sell:2350,reorder:20,emoji:"🥛"},
  {id:"PRD-00611",name:"Sugar 1 kg",category:"Groceries",barcode:"8901234567895",unit:"Pack",stock:0,buy:260,sell:280,reorder:20,emoji:"🍬"},
  {id:"PRD-00823",name:"Dish Wash Liquid 500 ml",category:"Household",barcode:"8901234567896",unit:"Bottle",stock:58,buy:580,sell:650,reorder:20,emoji:"🧼"},
];
type Props = { view: InventoryView; onNavigate: (view: InventoryView) => void; products: InventoryProduct[]; setProducts: Dispatch<SetStateAction<InventoryProduct[]>>; onNotice: (message: string) => void };
type Line = { id: string; qty: number; remarks: string };
const money = (n:number) => "Rs. " + n.toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2});
const stockStatus = (p:InventoryProduct) => p.stock===0?"Out of Stock":p.stock<=p.reorder?"Low Stock":"In Stock";
function ProductName({product}:{product:InventoryProduct}) {return <span className="inv-product-name"><span className="inv-emoji">{product.emoji}</span><strong>{product.name}</strong></span>}
export default function InventoryPage({view,onNavigate,products,setProducts,onNotice}:Props){
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("All Products");
  const [selected,setSelected]=useState(initialInventory[0].id);
  const [detailTab,setDetailTab]=useState("Overview");
  const [adjustType,setAdjustType]=useState<"increase"|"decrease">("increase");
  const [reason,setReason]=useState("Stock Count Correction");
  const [notes,setNotes]=useState("");
  const [reference,setReference]=useState("ADJ-"+new Date().toISOString().slice(0,10).replaceAll("-","")+"-001");
  const [from,setFrom]=useState("Main Store (Ja-Ela)");
  const [to,setTo]=useState("Branch Store (Gampaha)");
  const [transferRemarks,setTransferRemarks]=useState("");
  const [adjustLines,setAdjustLines]=useState<Line[]>([{id:initialInventory[0].id,qty:20,remarks:""},{id:initialInventory[1].id,qty:5,remarks:""},{id:initialInventory[2].id,qty:3,remarks:""}]);
  const [transferLines,setTransferLines]=useState<Line[]>([{id:initialInventory[0].id,qty:20,remarks:""},{id:initialInventory[1].id,qty:24,remarks:""},{id:initialInventory[2].id,qty:12,remarks:""},{id:initialInventory[3].id,qty:12,remarks:""}]);
  const [addOpen,setAddOpen]=useState(false);
  const [scanOpen,setScanOpen]=useState(false);
  const handleInventoryScan=(code:string)=>{
    const match=products.find(p=>p.barcode===code.trim()||p.id.toLowerCase()===code.trim().toLowerCase());
    if(!match) throw new Error("No inventory product matches this barcode or SKU.");
    if(view==="overview"){setCategory("All Products");setSearch(match.barcode);setSelected(match.id);setPage(1);}
    else {setActiveLines(old=>old.some(line=>line.id===match.id)?old:[...old,{id:match.id,qty:1,remarks:""}]);setSearch("");}
    setScanOpen(false);
    onNotice(match.name+" found.");
  };
  const [addId,setAddId]=useState("");
  const [page,setPage]=useState(1);
  const [pageSize,setPageSize]=useState(10);
  const activeLines=view==="adjustment"?adjustLines:transferLines;
  const setActiveLines=view==="adjustment"?setAdjustLines:setTransferLines;
  const productById=(id:string)=>products.find(p=>p.id===id);
  const updateLine=(id:string,patch:Partial<Line>)=>setActiveLines(old=>old.map(line=>line.id===id?{...line,...patch}:line));
  const addLine=()=>{if(!addId)return;setActiveLines(old=>old.some(line=>line.id===addId)?old:[...old,{id:addId,qty:1,remarks:""}]);setAddOpen(false);setAddId("");};
  const filtered=useMemo(()=>products.filter(p=>(category==="All Products"||p.category===category)&&(p.name+" "+p.id+" "+p.barcode).toLowerCase().includes(search.toLowerCase())),[products,category,search]);
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const chosen=productById(selected)??products[0];
  const totalQty=activeLines.reduce((sum,l)=>sum+l.qty,0);
  const commitAdjustment=()=>{
    if(!reason||!activeLines.length||activeLines.some(l=>!Number.isInteger(l.qty)||l.qty<=0||(adjustType==="decrease"&&l.qty>(productById(l.id)?.stock??0)))){onNotice("Check adjustment quantities, available stock and reason.");return;}
    setProducts(old=>old.map(p=>{const l=activeLines.find(item=>item.id===p.id);return l?{...p,stock:p.stock+(adjustType==="increase"?l.qty:-l.qty)}:p;}));
    setAdjustLines([]);setNotes("");onNotice("Stock adjustment applied to demo inventory.");
    onNavigate("overview");
  };
  const commitTransfer=()=>{
    if(from===to||!activeLines.length||activeLines.some(l=>!Number.isInteger(l.qty)||l.qty<=0||l.qty>(productById(l.id)?.stock??0))){onNotice("Choose different locations and valid quantities within available stock.");return;}
    // This demo represents stock at the source location only. Destination balances require location-specific backend inventory.
    setProducts(old=>old.map(p=>{const l=activeLines.find(item=>item.id===p.id);return l?{...p,stock:p.stock-l.qty}:p;}));
    setTransferLines([]);onNotice("Demo source stock updated. Destination ledger requires backend integration.");onNavigate("overview");
  };
  const heading=view==="overview"?"Inventory Management":view==="adjustment"?"Stock Adjustment":"Stock Transfer";
  return <div className="inventory-page">
    <header className="inv-heading"><div className="inv-heading-title"><span className="inv-heading-icon">{view==="overview"?<Inventory2Outlined/>:view==="adjustment"?<Tune/>:<SwapHoriz/>}</span><div><h1>{heading}</h1><p>{view==="overview"?"Track stock levels, manage adjustments, and monitor inventory movement.":view==="adjustment"?"Increase or decrease stock quantity with a valid reason.":"Move stock between stores or warehouses."}</p></div></div><div className="inv-heading-actions">{view!=="overview"&&<button onClick={()=>onNavigate("overview")}><ArrowBack/> Back to Inventory</button>}</div></header>
    {view==="overview"?<>
      <div className="inv-kpis"><div className="inv-kpi green"><span>📦</span><div>Total Products<strong>{products.length.toLocaleString()}</strong></div></div><div className="inv-kpi blue"><span>🔷</span><div>Total Stock Value<strong>{money(products.reduce((n,p)=>n+p.stock*p.buy,0))}</strong></div></div><div className="inv-kpi amber"><span>⚠️</span><div>Low Stock Items<strong>{products.filter(p=>p.stock>0&&p.stock<=p.reorder).length}</strong></div></div><div className="inv-kpi red"><span>📦</span><div>Out of Stock<strong>{products.filter(p=>p.stock===0).length}</strong></div></div></div>
      <div className="inv-overview-grid"><section className="inv-panel inv-catalog"><div className="inv-categories">{["All Products","Groceries","Beverages","Household","Personal Care","Snacks","Others"].map(c=><button key={c} className={category===c?"selected":""} onClick={()=>{setCategory(c);setPage(1)}}>{c}</button>)}</div><div className="inv-search-row"><label className="inv-search"><Search/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search products by name, barcode or SKU..." /></label><button className="inv-soft-green" onClick={()=>setScanOpen(true)}>▣ Scan (F2)</button></div>
      <div className="inv-table-scroll"><table className="inv-table"><thead><tr><th>Product</th><th>SKU / Barcode</th><th>Category</th><th>Stock</th><th>Unit</th><th>Buy Price</th><th>Sell Price</th><th>Status</th></tr></thead><tbody>{filtered.slice((page-1)*pageSize,page*pageSize).map(p=><tr key={p.id} className={selected===p.id?"inv-selected-row":""} onClick={()=>setSelected(p.id)}><td><ProductName product={p}/></td><td><strong>{p.id}</strong><small>{p.barcode}</small></td><td>{p.category}</td><td><span className={"inv-stock "+(p.stock===0?"red":p.stock<=p.reorder?"amber":"green")}>{p.stock}</span></td><td>{p.unit}</td><td>{money(p.buy)}</td><td>{money(p.sell)}</td><td><span className={"inv-status "+(p.stock===0?"red":p.stock<=p.reorder?"amber":"green")}>{stockStatus(p)}</span></td></tr>)}</tbody></table>{filtered.length===0&&<p className="inv-empty">No matching products.</p>}</div>
      <footer className="inv-table-footer"><span>Showing {filtered.length?((page-1)*pageSize+1):0}–{Math.min(page*pageSize,filtered.length)} of {filtered.length} products</span><div><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button><span>{page} / {pages}</span><button disabled={page===pages} onClick={()=>setPage(p=>p+1)}>›</button></div><label>Rows per page: <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1)}}><option>5</option><option>10</option><option>20</option></select></label></footer></section>
      <aside className="inv-panel inv-detail">{chosen&&<><div className="inv-detail-head"><span className="inv-detail-emoji">{chosen.emoji}</span><div><h2>{chosen.name}</h2><p>SKU: {chosen.id}</p><p>Barcode: {chosen.barcode}</p></div><span className={"inv-status "+(chosen.stock===0?"red":chosen.stock<=chosen.reorder?"amber":"green")}>{stockStatus(chosen)}</span></div><div className="inv-detail-tabs">{["Overview","Stock History","Details"].map(tab=><button key={tab} className={detailTab===tab?"selected":""} onClick={()=>setDetailTab(tab)}>{tab}</button>)}</div>{detailTab==="Overview"?<><div className="inv-detail-kpis"><div className="green">Current Stock<strong>{chosen.stock} {chosen.unit}</strong></div><div className="amber">Reorder Level<strong>{chosen.reorder} {chosen.unit}</strong></div><div className="blue">Buy Price<strong>{money(chosen.buy)}</strong></div><div className="purple">Sell Price<strong>{money(chosen.sell)}</strong></div></div><h3>Stock Movement (Demo)</h3><p className="inv-muted">Movement history will appear when inventory transactions are connected.</p></>:detailTab==="Details"?<div className="inv-detail-facts"><p>Category: {chosen.category}</p><p>Barcode: {chosen.barcode}</p><p>Unit: {chosen.unit}</p></div>:<p className="inv-muted">No persisted stock history is available yet.</p>}</>}</aside></div>
    </>:<>
      <div className="inv-form-top"><section className="inv-panel inv-form"><h2>{view==="adjustment"?"▤ Adjustment Details":"▤ Transfer Details"}</h2>{view==="adjustment"?<><div className="inv-form-grid"><div><label>Adjustment Type *</label><div className="inv-choice-row"><button className={adjustType==="increase"?"active":""} onClick={()=>setAdjustType("increase")}>↑ Increase Stock</button><button className={adjustType==="decrease"?"active":""} onClick={()=>setAdjustType("decrease")}>↓ Decrease Stock</button></div></div><div><label>Adjustment Date *</label><input type="datetime-local" defaultValue={new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)} /></div><div><label>Reason *</label><select value={reason} onChange={e=>setReason(e.target.value)}>{["Stock Count Correction","Damaged Goods","Expired Goods","Supplier Correction","Other"].map(r=><option key={r}>{r}</option>)}</select></div><div><label>Reference No. (Optional)</label><input value={reference} onChange={e=>setReference(e.target.value)}/></div></div><label>Notes (Optional)</label><textarea maxLength={250} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Reason or details for this adjustment"/></>:<><div className="inv-form-grid"><div><label>Transfer No.</label><input readOnly value={"TRF-"+new Date().getFullYear()+"-001"}/></div><div><label>Transfer Date *</label><input type="date" defaultValue={new Date().toISOString().slice(0,10)}/></div><div><label>From Location *</label><select value={from} onChange={e=>setFrom(e.target.value)}><option>Main Store (Ja-Ela)</option><option>Branch Store (Gampaha)</option></select></div><div><label>To Location *</label><select value={to} onChange={e=>setTo(e.target.value)}><option>Branch Store (Gampaha)</option><option>Main Store (Ja-Ela)</option></select></div></div><label>Remarks (Optional)</label><textarea maxLength={250} value={transferRemarks} onChange={e=>setTransferRemarks(e.target.value)} placeholder="Purpose of transfer"/></>}</section>
      <aside className="inv-panel inv-summary"><h2>{view==="adjustment"?"▥ Adjustment Summary":"▥ Transfer Summary"}</h2>{view==="transfer"&&<div className="inv-route"><div>🏬<strong>{from.split(" (")[0]}</strong></div><ArrowForward/><div>🏪<strong>{to.split(" (")[0]}</strong></div></div>}<div className="inv-summary-line"><span>{view==="adjustment"?"Products":"Total Items"}</span><strong>{activeLines.length}</strong></div><div className="inv-summary-line"><span>{view==="adjustment"?"Total Quantity Change":"Total Transfer Quantity"}</span><strong className="inv-green-text">{view==="adjustment"?(adjustType==="increase"?"+":"−"):""}{totalQty}</strong></div>{view==="adjustment"&&<><div className="inv-summary-line"><span>Adjustment Type</span><strong>{adjustType==="increase"?"Increase Stock":"Decrease Stock"}</strong></div><div className="inv-summary-line"><span>Reason</span><strong>{reason}</strong></div></>}</aside></div>
      <section className="inv-panel inv-lines"><div className="inv-lines-head"><h2>{view==="adjustment"?"▣ Products":"▣ Transfer Items"} ({activeLines.length})</h2><label className="inv-search"><Search/><input placeholder="Search product by name, SKU or barcode..." value={search} onChange={e=>setSearch(e.target.value)}/></label><button className="inv-soft-green" onClick={()=>setAddOpen(true)}><Add/> Add {view==="adjustment"?"Product":"Item"} (F2)</button></div><div className="inv-table-scroll"><table className="inv-table"><thead><tr><th>#</th><th>Product</th><th>SKU / Barcode</th><th>Current Stock</th><th>{view==="adjustment"?"Adjustment Qty":"Transfer Qty"}</th><th>{view==="adjustment"?"New Stock":"Balance After"}</th>{view==="adjustment"&&<th>Remarks</th>}<th>Action</th></tr></thead><tbody>{activeLines.filter(l=>{const p=productById(l.id);return p&&(p.name+" "+p.id+" "+p.barcode).toLowerCase().includes(search.toLowerCase())}).map((l,i)=>{const p=productById(l.id);if(!p)return null;const result=p.stock+(view==="adjustment"?(adjustType==="increase"?l.qty:-l.qty):-l.qty);return <tr key={l.id}><td>{i+1}</td><td><ProductName product={p}/></td><td><strong>{p.id}</strong><small>{p.barcode}</small></td><td><span className="inv-stock green">{p.stock}</span></td><td><div className="inv-qty"><button onClick={()=>updateLine(l.id,{qty:Math.max(1,l.qty-1)})}>−</button><input type="number" min={1} value={l.qty} onChange={e=>updateLine(l.id,{qty:Number(e.target.value)})}/><button onClick={()=>updateLine(l.id,{qty:l.qty+1})}>+</button></div></td><td><span className={"inv-stock "+(result<0?"red":"green")}>{result}</span></td>{view==="adjustment"&&<td><input className="inv-remark" value={l.remarks} onChange={e=>updateLine(l.id,{remarks:e.target.value})} placeholder="Optional remark"/></td>}<td><IconButton color="error" aria-label={"Remove "+p.name} onClick={()=>setActiveLines(old=>old.filter(item=>item.id!==l.id))}><DeleteOutlined/></IconButton></td></tr>})}</tbody></table>{!activeLines.length&&<p className="inv-empty">No products added. Use Add {view==="adjustment"?"Product":"Item"} to begin.</p>}</div></section>
      <div className="inv-bottom-actions"><button onClick={()=>onNavigate("overview")}>✕ Cancel</button><button className="inv-primary" onClick={view==="adjustment"?commitAdjustment:commitTransfer}>{view==="adjustment"?<CheckCircle/>:<SwapHoriz/>}{view==="adjustment"?"Apply Adjustment (F10)":"Transfer Stock (F10)"}</button></div>
      {addOpen&&<div className="inv-modal-shade" onClick={()=>setAddOpen(false)}><div className="inv-modal" onClick={e=>e.stopPropagation()}><h2>Add Product</h2><p>Select a product to include in this {view==="adjustment"?"adjustment":"transfer"}.</p><Select fullWidth size="small" displayEmpty value={addId} onChange={e=>setAddId(e.target.value)}><MenuItem value="" disabled>Select product</MenuItem>{products.filter(p=>!activeLines.some(l=>l.id===p.id)).map(p=><MenuItem key={p.id} value={p.id}>{p.name} — {p.stock} available</MenuItem>)}</Select><div className="inv-modal-actions"><Button onClick={()=>setAddOpen(false)}>Cancel</Button><Button variant="contained" disabled={!addId} onClick={addLine}>Add Product</Button></div></div></div>}
    </>}
    <Dialog open={scanOpen} onClose={()=>setScanOpen(false)} fullWidth maxWidth="sm" aria-labelledby="inventory-scanner-title"><DialogTitle id="inventory-scanner-title" sx={{fontWeight:800}}>Scan Product Barcode</DialogTitle><DialogContent dividers><BarcodeScanner compact label="Product barcode or SKU" placeholder="Scan or enter product barcode / SKU" submitLabel="Find Product" onScan={handleInventoryScan}/></DialogContent></Dialog>
    <div className="inv-bottom-wave" aria-hidden="true"/>
  </div>;
}
