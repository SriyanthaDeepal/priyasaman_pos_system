import { Dialog, DialogContent, DialogTitle, IconButton, Menu, MenuItem } from "@mui/material";
import { useMemo, useState } from "react";
import { BarChart, CalendarMonth, AccessTime, KeyboardArrowDown, CheckCircle, Close, Description, Email, LocalPrintshop, PersonOutlined, PointOfSale, ReceiptLong, Replay, Search, Payments, CreditCard, AccountBalance, QrCode2, AccountBalanceWallet, SwapHoriz, CardGiftcard, FilterList, QrCodeScanner } from "@mui/icons-material";
import "./SalesPage.css";
import BoundedTimePicker from "./BoundedTimePicker";
import BarcodeScanner from "../../components/common/BarcodeScanner/BarcodeScanner";

type SaleStatus = "Completed" | "Returned" | "Voided" | "Held";
type Method = "Cash" | "Card" | "Online Transfer" | "QR Payment" | "Credit" | "Mixed Payment" | "Gift Voucher";
type Sale = { invoice: string; time: string; customer: string; cashier: string; items: { name: string; qty: number; price: number }[]; method: Method; status: SaleStatus; received: number; };
const demoSales: Sale[] = [
  {invoice:"INV-009842",time:"08:19 AM",customer:"Walk-in Customer",cashier:"Admin User",method:"Cash",status:"Completed",received:12000,items:[{name:"Basmati Rice 5 kg",qty:1,price:4900},{name:"Sunflower Oil 1 L",qty:1,price:1450},{name:"Toothpaste 120 g",qty:1,price:380},{name:"Tea 200 g",qty:1,price:640}]},
  {invoice:"INV-009841",time:"08:10 AM",customer:"Nishan Perera",cashier:"Admin User",method:"Card",status:"Completed",received:6280,items:[{name:"Grocery items",qty:8,price:682.61}]},
  {invoice:"INV-009840",time:"08:03 AM",customer:"Walk-in Customer",cashier:"Cashier 01",method:"Cash",status:"Completed",received:2000,items:[{name:"Household items",qty:3,price:556.52}]},
  {invoice:"INV-009839",time:"07:58 AM",customer:"Kamal Silva",cashier:"Cashier 01",method:"QR Payment",status:"Completed",received:4870,items:[{name:"Grocery items",qty:6,price:705.80}]},
  {invoice:"INV-009838",time:"07:51 AM",customer:"Walk-in Customer",cashier:"Admin User",method:"Cash",status:"Completed",received:3000,items:[{name:"Vegetables and fruit",qty:4,price:556.52}]},
  {invoice:"INV-009837",time:"07:43 AM",customer:"Saman De Silva",cashier:"Cashier 02",method:"Card",status:"Completed",received:3750,items:[{name:"Grocery items",qty:5,price:652.17}]},
  {invoice:"INV-009836",time:"07:32 AM",customer:"Walk-in Customer",cashier:"Cashier 02",method:"Cash",status:"Returned",received:890,items:[{name:"Household items",qty:2,price:386.96}]},
  {invoice:"INV-009835",time:"07:25 AM",customer:"Ruwan Fernando",cashier:"Admin User",method:"Cash",status:"Completed",received:6000,items:[{name:"Grocery items",qty:7,price:742.86}]},
  {invoice:"INV-009834",time:"07:18 AM",customer:"Walk-in Customer",cashier:"Cashier 01",method:"Online Transfer",status:"Held",received:0,items:[{name:"Grocery items",qty:3,price:600}]},
  {invoice:"INV-009833",time:"07:11 AM",customer:"Nimali Perera",cashier:"Admin User",method:"Card",status:"Voided",received:0,items:[{name:"Grocery items",qty:2,price:500}]}
];
const money=(n:number)=>"Rs. "+n.toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2});
const subtotal=(sale:Sale)=>sale.items.reduce((sum,item)=>sum+item.qty*item.price,0);
const total=(sale:Sale)=>Math.round(subtotal(sale)*1.15*100)/100;
export default function SalesPage({onNewSale,onReturnRefund,initialScanOpen=false,returnedInvoices=[]}:{onNewSale:()=>void;initialScanOpen?:boolean;returnedInvoices?:string[];onReturnRefund:(sale: { invoice:string;customer:string;cashier:string;method:string;time:string;items:{name:string;qty:number;price:number}[];status:string })=>void}){
  const [search,setSearch]=useState("");
  const [cashier,setCashier]=useState("All Cashiers");
  const [method,setMethod]=useState("All Payment Methods");
  const [paymentAnchor,setPaymentAnchor]=useState<HTMLElement|null>(null);
  const [status,setStatus]=useState("All Sales");
  const [date,setDate]=useState("today");
  const [dateMenuOpen,setDateMenuOpen]=useState(false);
  const [dateFrom,setDateFrom]=useState("2026-11-03");
  const [dateTo,setDateTo]=useState("2026-11-03");
  const [timeFrom,setTimeFrom]=useState("");
  const [timeTo,setTimeTo]=useState("");
  const [page,setPage]=useState(1);
  const [perPage,setPerPage]=useState(8);
  const [selected,setSelected]=useState("INV-009842");
  const [notice,setNotice]=useState("");
  const [scanOpen,setScanOpen]=useState(initialScanOpen);
  const [sales,setSales]=useState(()=>demoSales.map(s=>returnedInvoices.includes(s.invoice)?{...s,status:"Returned" as SaleStatus}:s));
  const toMinutes=(value:string)=>{ const [clock,period]=value.split(" "); const [hour,minute]=clock.split(":").map(Number); return (hour%12+(period==="PM"?12:0))*60+minute; };
  const filtered=useMemo(()=>sales.filter(s=>(date!=="custom"||((!dateFrom||"2026-11-03">=dateFrom)&&(!dateTo||"2026-11-03"<=dateTo)))&&(!timeFrom||toMinutes(s.time)>=Number(timeFrom.slice(0,2))*60+Number(timeFrom.slice(3)))&&(!timeTo||toMinutes(s.time)<=Number(timeTo.slice(0,2))*60+Number(timeTo.slice(3)))&&(s.invoice+" "+s.customer+" "+s.cashier).toLowerCase().includes(search.toLowerCase())&&(cashier==="All Cashiers"||s.cashier===cashier)&&(method==="All Payment Methods"||s.method===method)&&(status==="All Sales"||s.status===status)),[sales,search,cashier,method,status,date,dateFrom,dateTo,timeFrom,timeTo]);
  const pages=Math.max(1,Math.ceil(filtered.length/perPage));
  const rows=filtered.slice((Math.min(page,pages)-1)*perPage,Math.min(page,pages)*perPage);
  const active=sales.find(s=>s.invoice===selected)??null;
  const completed=sales.filter(s=>s.status==="Completed");
  const salesTotal=completed.reduce((sum,s)=>sum+total(s),0);
  const findScannedInvoice=(barcode:string)=>{
    const invoice=barcode.trim().toUpperCase();
    const match=sales.find(s=>s.invoice.toUpperCase()===invoice);
    if(!match) throw new Error("Invoice not found in the available demonstration sales. Check the barcode or invoice number.");
    setSearch("");
    setCashier("All Cashiers");
    setMethod("All Payment Methods");
    setStatus("All Sales");
    setDate("today");
    setTimeFrom("");
    setTimeTo("");
    setPage(Math.floor(sales.indexOf(match)/perPage)+1);
    setSelected(match.invoice);
    setScanOpen(false);
    setNotice(match.invoice+" selected. Review Sale Details before starting a return or refund.");
  };
  const notify=(action:string)=>setNotice(action+" is not connected to the backend yet. This page currently uses demonstration data.");
  const changeStatus=(next:SaleStatus)=>{if(!active)return;setSales(prev=>prev.map(s=>s.invoice===active.invoice?{...s,status:next}:s));setNotice(active.invoice+" marked "+next.toLowerCase()+" in this demo only. No backend records were changed.");};
  return <div className="sales-page">
    <div className="sales-heading"><div><h1><BarChart/> Sales Management</h1><p>View, search and manage sales transactions.</p></div><div className="sales-heading-actions"><div className="sales-date-picker"><button type="button" className="sales-date-trigger" aria-expanded={dateMenuOpen} aria-haspopup="dialog" onClick={()=>setDateMenuOpen(v=>!v)}><CalendarMonth/><span>{date==="today"?"Today":date==="week"?"This Week":date==="month"?"This Month":"Custom Date"}{timeFrom||timeTo?" · Time filter":""}</span><KeyboardArrowDown/></button>{dateMenuOpen&&<div className="sales-date-menu" role="dialog" aria-label="Filter sales by date and time"><div className="sales-date-menu-title">Date & Time Filter</div><div className="sales-date-presets">{[["today","Today"],["week","This Week"],["month","This Month"],["custom","Custom"]].map(([value,label])=><button type="button" key={value} className={date===value?"selected":""} onClick={()=>setDate(value)}>{label}</button>)}</div><div className="sales-time-title"><CalendarMonth/> Specific date or date range</div><div className="sales-time-fields"><label>From date<input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setDate("custom");setPage(1)}}/></label><label>To date<input type="date" min={dateFrom||undefined} value={dateTo} onChange={e=>{setDateTo(e.target.value);setDate("custom");setPage(1)}}/></label></div><div className="sales-time-title"><AccessTime/> Specific time range (optional)</div><div className="sales-time-fields"><BoundedTimePicker label="From" value={timeFrom} onChange={v=>{setTimeFrom(v);setPage(1)}}/><BoundedTimePicker label="To" value={timeTo} onChange={v=>{setTimeTo(v);setPage(1)}}/></div>{(date==="custom" && dateFrom && dateTo && dateTo<dateFrom)||(timeFrom && timeTo && timeTo<timeFrom && (!dateFrom || !dateTo || dateFrom===dateTo))?<p className="sales-date-error" role="alert">End date/time must not be earlier than start date/time.</p>:null}<p className="sales-date-hint">Custom date and time filters use the sample sales date (Nov 03, 2026). Today, Week and Month presets remain display-only until backend integration.</p><div className="sales-date-menu-actions"><button type="button" onClick={()=>{setTimeFrom("");setTimeTo("");setDateFrom("2026-11-03");setDateTo("2026-11-03");setDate("today");setPage(1)}}>Reset</button><button type="button" disabled={Boolean((date==="custom" && dateFrom && dateTo && dateTo<dateFrom)||(timeFrom && timeTo && timeTo<timeFrom && (!dateFrom || !dateTo || dateFrom===dateTo)))} onClick={()=>setDateMenuOpen(false)}>Apply</button></div></div>}</div><button className="sales-new" onClick={onNewSale}><PointOfSale/> New Sale (F2)</button></div></div>
    <div className="sales-workspace"><div className="sales-left">
      <div className="sales-stats">
        <div className="sales-stat green"><PointOfSale/><div><span>Today's Sales</span><strong>{money(salesTotal)}</strong><small>Demo sales total</small></div></div>
        <div className="sales-stat blue"><ReceiptLong/><div><span>Total Transactions</span><strong>{sales.length}</strong><small>Sample transactions</small></div></div>
        <div className="sales-stat purple"><Description/><div><span>Average Bill Value</span><strong>{money(completed.length?salesTotal/completed.length:0)}</strong><small>Completed sales</small></div></div>
        <div className="sales-stat orange"><Replay/><div><span>Returns / Refunds</span><strong>{sales.filter(s=>s.status==="Returned").length}</strong><small>Demo returns</small></div></div>
      </div>
      <section className="sales-panel sales-transactions"><h2><ReceiptLong/> Sales Transactions ({filtered.length})</h2>
        <div className="sales-filters"><label className="sales-search"><Search/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search by invoice no, customer or cashier..." /></label><select aria-label="Cashier" value={cashier} onChange={e=>{setCashier(e.target.value);setPage(1)}}>{["All Cashiers","Admin User","Cashier 01","Cashier 02"].map(v=><option key={v}>{v}</option>)}</select><button type="button" className="sales-scan-invoice" onClick={()=>setScanOpen(true)}><QrCodeScanner/> Scan Invoice</button></div>
        <div className="sales-filter-actions">
          <div className="sales-tabs">{["All Sales","Completed","Held","Returned","Voided"].map(v=><button key={v} className={status===v?"active":""} onClick={()=>{setStatus(v);setPage(1)}}>{v}</button>)}</div>
          <button type="button" className={"sales-payment-trigger"+(method!=="All Payment Methods"?" selected":"")} aria-haspopup="menu" aria-expanded={Boolean(paymentAnchor)} aria-controls={paymentAnchor?"sales-payment-menu":undefined} onClick={e=>setPaymentAnchor(e.currentTarget)}><FilterList/>{method==="All Payment Methods"?"All Payments":method}<KeyboardArrowDown/></button>
          <Menu id="sales-payment-menu" anchorEl={paymentAnchor} open={Boolean(paymentAnchor)} onClose={()=>setPaymentAnchor(null)} anchorOrigin={{vertical:"bottom",horizontal:"right"}} transformOrigin={{vertical:"top",horizontal:"right"}} slotProps={{paper:{sx:{mt:.5,borderRadius:2,minWidth:215,maxHeight:"min(420px,70vh)",boxShadow:"0 8px 24px rgba(15,35,50,.16)"}},list:{dense:true}}}>
            {([["All Payment Methods",<FilterList/>],["Cash",<Payments/>],["Card",<CreditCard/>],["QR Payment",<QrCode2/>],["Online Transfer",<AccountBalance/>],["Credit",<AccountBalanceWallet/>],["Mixed Payment",<SwapHoriz/>],["Gift Voucher",<CardGiftcard/>]] as const).map(([name,icon])=><MenuItem key={name} selected={method===name} onClick={()=>{setMethod(name);setPage(1);setPaymentAnchor(null)}} sx={{gap:1.2,fontSize:13,fontWeight:method===name?750:500,py:1,"&.Mui-selected":{backgroundColor:"#e0f8e7",color:"#086b2a"},"&.Mui-focusVisible":{outline:"none"}}}>{icon}<span style={{flex:1}}>{name==="All Payment Methods"?"All Payments":name}</span>{method===name&&<CheckCircle sx={{fontSize:16,color:"#13853a"}}/>}</MenuItem>)}
          </Menu>
        </div>
        <div className="sales-table-wrap"><table className="sales-table"><thead><tr><th>Invoice No.</th><th>Date & Time</th><th>Customer</th><th>Items</th><th>Total Amount</th><th>Payment</th><th>Status</th></tr></thead><tbody>{rows.map(s=><tr key={s.invoice} className={selected===s.invoice?"selected":""} onClick={()=>setSelected(s.invoice)}><td><button className="sales-invoice" onClick={()=>setSelected(s.invoice)}>{s.invoice}</button></td><td>Nov 03, {s.time}</td><td><PersonOutlined/> {s.customer}</td><td>{s.items.reduce((sum,item)=>sum+item.qty,0)}</td><td><strong>{money(total(s))}</strong></td><td><span className={"sales-pill method-"+s.method.toLowerCase().replace(/ /g,"-")}>{s.method==="Cash"?<Payments/>:s.method==="Card"?<CreditCard/>:s.method==="QR Payment"?<QrCode2/>:s.method==="Online Transfer"?<AccountBalance/>:s.method==="Credit"?<AccountBalanceWallet/>:s.method==="Mixed Payment"?<SwapHoriz/>:<CardGiftcard/>}{s.method}</span></td><td><span className={"sales-status status-"+s.status.toLowerCase()}>{s.status==="Completed"?<CheckCircle/>:s.status==="Returned"?<Replay/>:null}{s.status}</span></td></tr>)}</tbody></table>{rows.length===0&&<p className="sales-empty">No matching sales found.</p>}</div>
        <div className="sales-pagination"><span>Showing {rows.length?((Math.min(page,pages)-1)*perPage+1):0}–{Math.min(Math.min(page,pages)*perPage,filtered.length)} of {filtered.length} sales</span><div><button disabled={page<=1} onClick={()=>setPage(v=>v-1)}>‹</button><strong>{Math.min(page,pages)} / {pages}</strong><button disabled={page>=pages} onClick={()=>setPage(v=>v+1)}>›</button></div><label>Rows per page: <select value={perPage} onChange={e=>{setPerPage(Number(e.target.value));setPage(1)}}><option>8</option><option>10</option><option>20</option></select></label></div>
      </section>
    </div>
    <aside className="sales-right"><section className="sales-panel sales-details"><div className="sales-details-title"><h2><Description/> Sale Details</h2>{active&&<span className={"sales-status status-"+active.status.toLowerCase()}>{active.status}</span>}</div>{active?<><div className="sales-meta"><span>Invoice No.</span><strong>{active.invoice}</strong><span>Date & Time</span><strong>Nov 03, 2026 {active.time}</strong><span>Cashier</span><strong>{active.cashier}</strong><span>Customer</span><strong>{active.customer}</strong><span>Payment</span><strong>{active.method}</strong></div><div className="sales-detail-table"><table><thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>{active.items.map((item,i)=><tr key={i}><td>{i+1}</td><td>{item.name}</td><td>{item.qty}</td><td>{money(item.price)}</td><td>{money(item.qty*item.price)}</td></tr>)}</tbody></table></div><div className="sales-totals"><div><span>Subtotal</span><strong>{money(subtotal(active))}</strong></div><div><span>Discount</span><strong>{money(0)}</strong></div><div><span>Tax (demo 15%)</span><strong>{money(total(active)-subtotal(active))}</strong></div><div className="sales-grand"><strong>Total Amount</strong><strong>{money(total(active))}</strong></div><div><span>Amount Received</span><strong>{money(active.received)}</strong></div><div><span>Change Given</span><strong>{money(active.method==="Cash"?Math.max(0,active.received-total(active)):0)}</strong></div></div></>:<p>Select a transaction.</p>}</section>
      <div className="sales-actions"><button onClick={()=>notify("Print")}><LocalPrintshop/> Print (F2)</button><button onClick={()=>notify("PDF export")}><Description/> PDF</button><button onClick={()=>notify("Email receipt")}><Email/> Email</button><button onClick={()=>{if(active)onReturnRefund(active)}} disabled={!active||active.status!=="Completed"}><Replay/> Return / Refund</button><button onClick={()=>notify("Duplicate sale")}><Description/> Duplicate Sale</button><button className="danger" onClick={()=>changeStatus("Voided")} disabled={!active||active.status!=="Completed"}><Close/> Void Sale</button></div>
    </aside></div>
    <Dialog open={scanOpen} onClose={()=>setScanOpen(false)} fullWidth maxWidth="sm" aria-labelledby="sales-scan-dialog-title" slotProps={{paper:{sx:{borderRadius:2.5}}}}>
      <DialogTitle id="sales-scan-dialog-title" sx={{display:"flex",alignItems:"center",justifyContent:"space-between",fontWeight:750}}>Scan Invoice<IconButton aria-label="Close invoice scanner" onClick={()=>setScanOpen(false)}><Close/></IconButton></DialogTitle>
      <DialogContent dividers sx={{pt:2}}><BarcodeScanner label="Invoice barcode" placeholder="Scan or enter invoice number (e.g. INV-009842)" submitLabel="Find Invoice" onScan={findScannedInvoice} maxLength={100}/></DialogContent>
    </Dialog>
    {notice&&<div className="sales-notice" role="status"><span>{notice}</span><button onClick={()=>setNotice("")} aria-label="Dismiss"><Close/></button></div>}
  </div>;
}
