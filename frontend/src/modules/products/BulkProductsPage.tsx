import { useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction, ChangeEvent } from "react";
import { Add, ArrowBack, ArrowForward, CheckCircleOutlined, DeleteOutlined, ContentCopy, QrCodeScanner, KeyboardOutlined, SaveOutlined, UploadFileOutlined } from "@mui/icons-material";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import * as XLSX from "xlsx";
import BarcodeScanner from "../../components/common/BarcodeScanner/BarcodeScanner";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import BarcodeDisplay from "../../components/common/BarcodeDisplay/BarcodeDisplay";
import SinhalaTouchKeyboard from "../pos/SinhalaTouchKeyboard";
import type { InventoryProduct } from "../inventory/InventoryPage";
import "./BulkProductsPage.css";

type Props={products:InventoryProduct[];setProducts:Dispatch<SetStateAction<InventoryProduct[]>>;onBack:()=>void;onNotice:(message:string)=>void};
const isValidEan13=(value:string):boolean=>{if(!isValidEan13(value))return false;let sum=0;for(let i=0;i<12;i++)sum+=Number(value[i])*(i%2===0?1:3);return (10-sum%10)%10===Number(value[12]);};
const makeInternalEan13=(used:Set<string>):string=>{for(let attempt=0;attempt<1000;attempt++){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const first12="20"+String(bytes[0]).padStart(10,"0").slice(-10);let sum=0;for(let i=0;i<12;i++)sum+=Number(first12[i])*(i%2===0?1:3);const code=first12+String((10-sum%10)%10);if(!used.has(code))return code;}throw new Error("Unable to generate a unique barcode.");};

type ImportRow=Record<string,unknown>;
const normalizeColumn=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]/g,"");
const importAliases:Record<string,string[]>={
 name:["productname","name","itemname","product","item","descriptionofgoods","itemdescription","stockname","stockdescription","productdescription","producttitle","itemtitle","particulars"],
 id:["sku","productsku","productcode","itemcode","stockcode"],
 barcode:["barcode","barcodenumber","ean","ean13","gtin","upc","barcodeno","itembarcode","productbarcode"],
 category:["category","productcategory","group"],
 brand:["brand","brandname"],
 supplier:["supplier","suppliername","vendor"],
 description:["description","details","productdescription"],
 variantName:["variant","variantname","size","productvariant"],
 unit:["unit","uom","unitofmeasure","measurementunit"],
 buy:["buy","buyingprice","purchaseprice","costprice","unitcost","cost","purchasecost","buyprice","averagecost","avgcost"],
 sell:["sell","sellingprice","saleprice","retailprice","price","unitprice","mrp","salesprice","sellingrate","rate"],
 stock:["stock","currentstock","quantity","qty","openingstock","stockquantity","onhand","qtyonhand","availableqty","balanceqty","stockonhand"],
 reorder:["reorder","reorderlevel","minimumstock","minstock","reorderpoint"],
 maxStock:["maxstock","maximumstock","stocklimit"],
 active:["status","active","productstatus"]
};
const mappedImportRow=(row:ImportRow)=>{
 const entries=Object.entries(row).map(([k,v])=>[normalizeColumn(k),v] as const);
 const get=(key:string):unknown=>{const aliases=importAliases[key]||[];return entries.find(([column])=>aliases.includes(column))?.[1];};
 const str=(key:string)=>String(get(key)??"").trim();
 const num=(key:string,defaultValue:number)=>{const raw=get(key);if(raw===undefined||raw===null||String(raw).trim()==="")return defaultValue;const n=Number(String(raw).replace(/[,\s]|Rs\.?/gi,""));return Number.isFinite(n)?n:NaN;};
 return {get,str,num};
};
const categories=["Groceries","Beverages","Household","Personal Care","Snacks","Others"];
const units=["Pack","Bag","Bottle","Piece","Box","Kg","Litre","Gram","Carton","Dozen","Tin"];
const steps=["Product Name","Category","Brand","Supplier","Description","Variant / Size","Unit","Buying Price","Selling Price","Current Stock","Reorder Level","Maximum Stock","Barcode","Product Images","Status"];
const required=new Set([0,1,6,7,8,9,10]);
const makeSku=(products:InventoryProduct[],drafts:InventoryProduct[])=>"PRD-"+String(Math.max(0,...[...products,...drafts].map(p=>Number(p.id.replace(/^PRD-/,""))||0))+1).padStart(5,"0");
const fresh=(products:InventoryProduct[],drafts:InventoryProduct[]):InventoryProduct=>({id:makeSku(products,drafts),name:"",category:"Groceries",barcode:"",unit:"Pack",stock:0,buy:0,sell:0,reorder:10,maxStock:0,brand:"",description:"",variantName:"Default",emoji:"📦",active:true,images:[],supplierOffers:[]});
const mandatoryIssues=(p:InventoryProduct):Record<string,string>=>{
 const issues:Record<string,string>={};
 if(!p.name.trim())issues.name="Product name is required";
 if(!p.category.trim())issues.category="Category is required";
 if(!p.unit.trim())issues.unit="Unit is required";
 for(const [key,label] of [["buy","Buying price"],["sell","Selling price"],["stock","Current stock"],["reorder","Reorder level"]] as const){
  if(!Number.isFinite(p[key]))issues[key]=label+" is missing or invalid";
  else if(p[key]<0)issues[key]=label+" cannot be negative";
 }
 return issues;
};
const validate=(p:InventoryProduct,others:InventoryProduct[])=>{
 const issues=Object.values(mandatoryIssues(p));
 if(!p.id.trim())issues.push("SKU is required");
 else if(others.some(x=>x.id===p.id))issues.push("SKU is already used by another product");
 if(p.barcode.trim()){
  const conflict=others.find(x=>x.id!==p.id&&x.barcode.trim()===p.barcode.trim());
  if(conflict)issues.push("Barcode belongs to another product: "+(conflict.name||conflict.id)+" ("+conflict.id+")");
 }
 if(Number.isFinite(p.maxStock??0)&&(p.maxStock??0)<0)issues.push("Maximum stock cannot be negative");
 return issues.join("; ");
};
export default function BulkProductsPage({products,setProducts,onBack,onNotice}:Props){
 const [drafts,setDrafts]=useState<InventoryProduct[]>([]);
 const [wizard,setWizard]=useState<InventoryProduct|null>(null);
 const [editingIndex,setEditingIndex]=useState<number|null>(null);
 const [step,setStep]=useState(0);
 const [error,setError]=useState("");
 const [selected,setSelected]=useState<number[]>([]);
 const [review,setReview]=useState(false);
 const [keyboard,setKeyboard]=useState(false);
 const [scanner,setScanner]=useState(false);
 const [query,setQuery]=useState("");
 const fileRef=useRef<HTMLInputElement>(null);
 const importRef=useRef<HTMLInputElement>(null);
 const [importing,setImporting]=useState(false);
 const [clearConfirmOpen,setClearConfirmOpen]=useState(false);
 const inputRef=useRef<HTMLInputElement>(null);
 const suppliers=useMemo(()=>Array.from(new Set(products.flatMap(p=>(p.supplierOffers||[]).map(x=>x.supplier)).filter(Boolean))),[products]);
 const currentSupplier=wizard?.supplierOffers?.find(x=>x.preferred)?.supplier||"";
 const setField=<K extends keyof InventoryProduct>(key:K,value:InventoryProduct[K])=>setWizard(p=>p?{...p,[key]:value}:p);
 const open=(index?:number)=>{setWizard(index===undefined?fresh(products,drafts):{...drafts[index],images:[...(drafts[index].images||[])]});setEditingIndex(index??null);setStep(0);setError("");setKeyboard(false);setReview(false)};
 const next=()=>{if(!wizard)return;const value=step===0?wizard.name:step===1?wizard.category:step===6?wizard.unit:step===7?wizard.buy:step===8?wizard.sell:step===9?wizard.stock:wizard.reorder;if(required.has(step)&&(typeof value==="string"?!value.trim():!Number.isFinite(value)||value<0)){setError("Enter a valid value to continue.");return;}setError("");setKeyboard(false);if(step<steps.length-1)setStep(x=>x+1);else setStep(steps.length)};
 const finish=()=>{if(!wizard)return;const others=[...products.filter(existing=>existing.id!==wizard.id),...drafts.filter((_,i)=>i!==editingIndex)];const issue=validate(wizard,others);if(editingIndex===null&&issue){setError(issue);return;}setDrafts(old=>editingIndex===null?[...old,wizard]:old.map((p,i)=>i===editingIndex?wizard:p));setWizard(null);setEditingIndex(null);setReview(true);onNotice(editingIndex===null?"Product added to bulk draft. Save All to commit.":issue?"Draft row updated. Remaining issues are highlighted in the table.":"Draft product updated. Save All to commit.");};
 const generateBarcode=()=>{if(!wizard)return;const used=new Set([...products,...drafts.filter((_,i)=>i!==editingIndex)].map(p=>p.barcode.trim()).filter(Boolean));try{setField("barcode",makeInternalEan13(used));setError("");setKeyboard(false);}catch{setError("Unable to generate a unique barcode. Please try again.");}};

 const importData=async(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];
  event.target.value="";
  if(!file)return;
  if(!/\.(xlsx|xls|csv)$/i.test(file.name)){onNotice("Choose a spreadsheet file (Excel or CSV).");return;}
  setImporting(true);
  try{
   const workbook=XLSX.read(await file.arrayBuffer(),{type:"array",raw:false});
   const sheet=workbook.Sheets[workbook.SheetNames[0]];
   if(!sheet)throw new Error("The file contains no readable sheet.");
   const rows=XLSX.utils.sheet_to_json<ImportRow>(sheet,{defval:"",raw:false});
   if(!rows.length)throw new Error("No product rows were found.");
   const keys=Object.keys(rows[0]).map(normalizeColumn);
   if(!keys.some(k=>importAliases.name.includes(k)))throw new Error("Could not identify a Product Name column. Add a Product Name or Name heading and try again.");
   const occupied=[...products,...drafts];
   const imported:InventoryProduct[]=[];
   let nextId=Math.max(0,...occupied.map(p=>Number(p.id.replace(/^PRD-/,""))||0));
   for(const row of rows){
    if(Object.values(row).every(v=>String(v??"").trim()===""))continue;
    const m=mappedImportRow(row);
    const requestedSku=m.str("id");
    const usedIds=new Set([...occupied,...imported].map(p=>p.id));
    let sku=requestedSku;
    if(!sku){do{sku="PRD-"+String(++nextId).padStart(5,"0");}while(usedIds.has(sku));}
    const supplier=m.str("supplier");
    const status=m.str("active").toLowerCase();
    imported.push({
     ...fresh(products,[...drafts,...imported]),
     id:sku,
     name:m.str("name"),
     barcode:m.str("barcode"),
     category:m.str("category"),
     brand:m.str("brand"),
     description:m.str("description"),
     variantName:m.str("variantName")||"Default",
     unit:m.str("unit"),
     buy:m.num("buy",NaN),
     sell:m.num("sell",NaN),
     stock:m.num("stock",NaN),
     reorder:m.num("reorder",NaN),
     maxStock:m.num("maxStock",0),
     active:!["inactive","disabled","false","no","0"].includes(status),
     supplierOffers:supplier?[{id:"import-"+imported.length,supplier,cost:m.num("buy",0),preferred:true}]:[]
    });
   }
   if(!imported.length)throw new Error("No non-empty product rows were found.");
   setDrafts(old=>[...old,...imported]);
   setReview(true);
   setSelected([]);
   const combined=[...drafts,...imported];
   const invalid=combined.filter((p,i)=>validate(p,[...products,...combined.filter((_,j)=>j!==i)])).length;
   onNotice(imported.length+" products imported into drafts. "+(invalid?invalid+" rows need correction before saving.":"Review the products before saving."));
  }catch(err){onNotice(err instanceof Error?err.message:"Could not read this spreadsheet. Please check the file and try again.");}
  finally{setImporting(false);}
 };
 const upload=(e:ChangeEvent<HTMLInputElement>)=>{const files=Array.from(e.target.files||[]);const available=5-(wizard?.images?.length||0);if(files.length>available||files.some(f=>!f.type.startsWith("image/")||f.size>2*1024*1024)){setError("Use up to five images, each under 2 MB.");return;}files.forEach(f=>{const reader=new FileReader();reader.onload=()=>{if(typeof reader.result==="string")setWizard(p=>p?{...p,images:[...(p.images||[]),reader.result as string]}:p)};reader.readAsDataURL(f)});e.target.value="";};
 const errors=drafts.map((p,i)=>validate(p,[...products.filter(existing=>existing.id!==p.id),...drafts.filter((_,j)=>j!==i)]));
 const valid=errors.every(x=>!x);
 const saveAll=()=>{if(!drafts.length){onNotice("Add at least one product first.");return;}setReview(true);if(!valid){onNotice("Correct the highlighted rows before saving.");return;}setProducts(old=>[...old,...drafts]);onNotice(drafts.length+" products saved to inventory.");setDrafts([]);setSelected([]);setReview(false);onBack();};
 const fieldError=(p:InventoryProduct,key:string)=>mandatoryIssues(p)[key];
 const visible=drafts.map((p,i)=>({p,i})).filter(({p})=>[p.name,p.id,p.barcode,p.category].join(" ").toLowerCase().includes(query.toLowerCase()));
 return <div className="bulk-page">
  <header className="bulk-header"><div><small>Products / Bulk Add Products</small><h1>Bulk Add Products</h1><p>Guided entry for accurate multi-product registration.</p></div><div className="bulk-actions"><button onClick={onBack}><ArrowBack/> Back to Products</button><button className="bulk-primary" onClick={()=>open()}><Add/> Add Product Row</button></div></header>
  <div className="bulk-progress"><span className={!review?"active":""}>1 · Enter Products</span><span className={review?"active":""}>2 · Review &amp; Validate</span><span>3 · Save</span></div>
  <section className="bulk-card bulk-workspace">
   <div className="bulk-toolbar"><input ref={importRef} type="file" accept=".xlsx,.xls,.csv" hidden aria-label="Select product spreadsheet" onChange={importData}/><input aria-label="Search draft products" placeholder="Search draft products..." value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>open()}><Add/> Add Row</button><button type="button" disabled={importing} onClick={()=>importRef.current?.click()}><UploadFileOutlined/> {importing?"Importing...":"Import Data"}</button><button disabled={!selected.length} onClick={()=>{const copies=selected.map(i=>({...drafts[i],id:makeSku(products,[...drafts,...selected.slice(0,selected.indexOf(i)).map(j=>drafts[j])]),barcode:"",name:drafts[i].name+" (Copy)"}));setDrafts(old=>[...old,...copies]);setSelected([])}}><ContentCopy/> Duplicate</button><button disabled={!selected.length} onClick={()=>{setDrafts(old=>old.filter((_,i)=>!selected.includes(i)));setSelected([])}}><DeleteOutlined/> Delete</button></div>
   <div className="bulk-table-scroll"><table><thead><tr><th><input aria-label="Select all" type="checkbox" checked={drafts.length>0&&selected.length===drafts.length} onChange={e=>setSelected(e.target.checked?drafts.map((_,i)=>i):[])}/></th><th>#</th><th>Product Name</th><th>SKU</th><th>Barcode</th><th>Category</th><th>Variant</th><th>Unit</th><th>Buying (Rs.)</th><th>Selling (Rs.)</th><th>Stock</th><th>Reorder</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map(({p,i})=><tr key={p.id} className={errors[i]?"bulk-invalid":""}><td><input type="checkbox" checked={selected.includes(i)} onChange={e=>setSelected(old=>e.target.checked?[...old,i]:old.filter(x=>x!==i))}/></td><td>{i+1}</td><td className={fieldError(p,"name")?"bulk-missing-cell":""} title={fieldError(p,"name")||undefined}><strong>{p.name||"Required"}</strong></td><td>{p.id}</td><td>{p.barcode||"—"}</td><td className={fieldError(p,"category")?"bulk-missing-cell":""} title={fieldError(p,"category")||undefined}>{p.category||"Required"}</td><td>{p.variantName||"Default"}</td><td className={fieldError(p,"unit")?"bulk-missing-cell":""} title={fieldError(p,"unit")||undefined}>{p.unit||"Required"}</td><td className={fieldError(p,"buy")?"bulk-missing-cell":""} title={fieldError(p,"buy")||undefined}>{Number.isFinite(p.buy)?p.buy.toFixed(2):"Required"}</td><td className={fieldError(p,"sell")?"bulk-missing-cell":""} title={fieldError(p,"sell")||undefined}>{Number.isFinite(p.sell)?p.sell.toFixed(2):"Required"}</td><td className={fieldError(p,"stock")?"bulk-missing-cell":""} title={fieldError(p,"stock")||undefined}>{Number.isFinite(p.stock)?p.stock:"Required"}</td><td className={fieldError(p,"reorder")?"bulk-missing-cell":""} title={fieldError(p,"reorder")||undefined}>{Number.isFinite(p.reorder)?p.reorder:"Required"}</td><td>{errors[i]?<span className="bulk-error">{errors[i]}</span>:<span className="bulk-ok">Ready</span>}</td><td><button onClick={()=>open(i)}>Edit</button></td></tr>)}</tbody></table>{!visible.length&&<div className="bulk-empty">{drafts.length?"No matching draft products.":"No products added yet. Select Add Row to enter your first product using the guided form."}</div>}</div>
   <footer className="bulk-footer"><div><strong>{drafts.length} products</strong><span>{drafts.length-errors.filter(Boolean).length} valid</span>{errors.filter(Boolean).length>0&&<span className="bulk-error">{errors.filter(Boolean).length} need attention</span>}</div><div className="bulk-actions"><button disabled={!drafts.length} onClick={()=>setClearConfirmOpen(true)}>Clear All</button><button onClick={()=>{setReview(true);onNotice(valid?"All draft products are valid.":"Some rows need correction.")}}>Validate All</button><button className="bulk-primary" onClick={saveAll}><SaveOutlined/> Save All Products</button></div></footer>
  </section>
  {wizard&&<div className="bulk-overlay" role="presentation"><section className="bulk-wizard" role="dialog" aria-modal="true" aria-label="Guided product entry"><header><div><small>{editingIndex===null?"New Product":"Edit Draft Product"} · {wizard.id}</small><h2>{step===steps.length?"Review Product":steps[step]}</h2></div><button onClick={()=>{setWizard(null);setKeyboard(false)}} aria-label="Close">×</button></header><div className="bulk-wizard-body"><div className="bulk-step-count">Step {Math.min(step+1,steps.length)} of {steps.length} <span>{Math.round(Math.min(step+1,steps.length)/steps.length*100)}%</span></div><div className="bulk-step-track"><div style={{width:Math.min(step+1,steps.length)/steps.length*100+"%"}}/></div>
   {step===steps.length?<div className="bulk-review"><h3>{editingIndex===null?"Review before adding to the table":"Review changes before updating"}</h3>{[["Name",wizard.name],["Category",wizard.category],["Brand",wizard.brand||"—"],["Supplier",currentSupplier||"—"],["Description",wizard.description||"—"],["Variant",wizard.variantName||"Default"],["Unit",wizard.unit],["SKU",wizard.id],["Buying",String(wizard.buy)],["Selling",String(wizard.sell)],["Stock",String(wizard.stock)],["Reorder",String(wizard.reorder)],["Max stock",String(wizard.maxStock??0)],["Barcode",wizard.barcode||"—"],["Images",String(wizard.images?.length||0)],["Active",wizard.active?"Yes":"No"]].map(([k,v])=><div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>:
   <div className="bulk-question"><label htmlFor="bulk-current">{steps[step]} {required.has(step)?"*":"(Optional)"}</label>
   {step===1?<select id="bulk-current" value={wizard.category} onChange={e=>{setField("category",e.target.value);setError("");}}><option value="" disabled>Select a category</option>{categories.map(x=><option key={x} value={x}>{x}</option>)}</select>:
   step===3?<select id="bulk-current" value={currentSupplier} onChange={e=>setField("supplierOffers",e.target.value?[{id:Math.random().toString(36).slice(2),supplier:e.target.value,cost:wizard.buy,preferred:true}]:[])}><option value="">No supplier selected</option>{suppliers.map(x=><option key={x}>{x}</option>)}</select>:
   step===4?<textarea id="bulk-current" maxLength={250} rows={4} value={wizard.description||""} onChange={e=>setField("description",e.target.value)}/>:
   step===6?<select id="bulk-current" value={wizard.unit} onChange={e=>{setField("unit",e.target.value);setError("");}}><option value="" disabled>Select a unit</option>{units.map(x=><option key={x} value={x}>{x}</option>)}</select>:
   step===13?<div><button onClick={()=>fileRef.current?.click()}>Upload Images ({wizard.images?.length||0}/5)</button><input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={upload}/><div className="bulk-images">{wizard.images?.map((src,i)=><div key={i}><img src={src} alt={"Product "+(i+1)}/><button onClick={()=>setField("images",(wizard.images||[]).filter((_,j)=>i!==j))}>Remove</button></div>)}</div></div>:
   step===14?<label className="bulk-checkbox"><input id="bulk-current" type="checkbox" checked={wizard.active!==false} onChange={e=>setField("active",e.target.checked)}/> Active / available for sale</label>:
   <div className="bulk-input-row"><input id="bulk-current" ref={inputRef} autoFocus={step===0} type={[7,8,9,10,11].includes(step)?"number":"text"} min="0" step={[7,8].includes(step)?"0.01":"1"} maxLength={step===0?150:undefined} placeholder={step===0?"Enter product name":step===5?"e.g. 500 ml, 1 kg":step===12?"Scan or enter barcode":""} value={step===0?wizard.name:step===2?wizard.brand||"":step===5?wizard.variantName||"":step===7?wizard.buy:step===8?wizard.sell:step===9?wizard.stock:step===10?wizard.reorder:step===11?wizard.maxStock??0:wizard.barcode} onChange={e=>{const v=e.target.value;if(step===0)setField("name",v);else if(step===2)setField("brand",v);else if(step===5)setField("variantName",v);else if(step===7)setField("buy",v===""?NaN:Number(v));else if(step===8)setField("sell",v===""?NaN:Number(v));else if(step===9)setField("stock",v===""?NaN:Number(v));else if(step===10)setField("reorder",v===""?NaN:Number(v));else if(step===11)setField("maxStock",v===""?0:Number(v));else setField("barcode",v)}}/>{[0,2,5,12].includes(step)&&<button aria-label="Toggle Sinhala keyboard" onClick={()=>setKeyboard(x=>!x)}><KeyboardOutlined/></button>}{step===12&&<button type="button" onClick={()=>setScanner(true)}><QrCodeScanner/> Scan</button>}</div>}
   {step===7||step===8?<p className="bulk-hint">Prices are in Sri Lankan rupees. Use 0 when appropriate.</p>:null}
   {step===12?<div className="bulk-barcode-generate"><button type="button" className="bulk-primary bulk-generate-button" onClick={generateBarcode}><QrCodeScanner/> Generate Barcode</button><p className="bulk-hint">{wizard.barcode.trim()?"Barcode: "+wizard.barcode+" — You can edit it above or generate another.":"No existing barcode? Click Generate Barcode to create a unique 13-digit internal EAN-13 code. Nothing is generated automatically."}</p>{wizard.barcode.trim()&&<div className="bulk-barcode-preview"><BarcodeDisplay value={wizard.barcode.trim()} format={isValidEan13(wizard.barcode.trim())?"EAN13":"CODE128"} height={60} width={1.5} fontSize={13} showDownload={false}/></div>}</div>:null}
   {keyboard&&[0,2,5,12].includes(step)&&<div className="bulk-keyboard"><SinhalaTouchKeyboard value={step===0?wizard.name:step===2?wizard.brand||"":step===5?wizard.variantName||"":wizard.barcode} onChange={v=>{if(step===0)setField("name",v);else if(step===2)setField("brand",v);else if(step===5)setField("variantName",v);else setField("barcode",v)}} onClose={()=>setKeyboard(false)} inputRef={inputRef}/></div>}
   </div>}
   {error&&<p className="bulk-error" role="alert">{error}</p>}</div><footer><button onClick={()=>{setError("");setKeyboard(false);setStep(x=>Math.max(0,x-1))}} disabled={step===0}><ArrowBack/> Back</button><div>{step<steps.length&&!required.has(step)&&<button onClick={()=>{setError("");setKeyboard(false);setStep(x=>x+1)}}>Skip</button>}{step===steps.length?<button className="bulk-primary" onClick={finish}><CheckCircleOutlined/> {editingIndex===null?"Add to List":"Update Product"}</button>:<button className="bulk-primary" onClick={next}>Next <ArrowForward/></button>}</div></footer></section></div>}
  <ConfirmDialog open={clearConfirmOpen} title="Clear Unsaved Products?" message={`Are you sure you want to remove all ${drafts.length} unsaved product rows? This action cannot be undone.`} confirmText="Clear All" cancelText="Keep Products" confirmColor="error" onCancel={()=>setClearConfirmOpen(false)} onConfirm={()=>{setDrafts([]);setSelected([]);setReview(false);setClearConfirmOpen(false);onNotice("Unsaved product rows cleared.");}}/>
  <Dialog open={scanner} onClose={()=>setScanner(false)} maxWidth="sm" fullWidth><DialogTitle>Scan Product Barcode <IconButton onClick={()=>setScanner(false)}>×</IconButton></DialogTitle><DialogContent><BarcodeScanner compact submitLabel="Use Barcode" onScan={code=>{setField("barcode",code);setScanner(false)}}/></DialogContent></Dialog>
 </div>;
}
