import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { Add, ArrowBack, CameraAltOutlined, DeleteOutlined, EditOutlined, ImageOutlined, InfoOutlined, Inventory2Outlined, LocalPrintshopOutlined, QrCodeScannerOutlined, Search, KeyboardOutlined, SaveOutlined, LayersOutlined } from "@mui/icons-material";
import { Dialog, DialogContent, DialogTitle, IconButton, Switch } from "@mui/material";
import BarcodeDisplay from "../../components/common/BarcodeDisplay/BarcodeDisplay";
import BarcodeScanner from "../../components/common/BarcodeScanner/BarcodeScanner";
import SinhalaTouchKeyboard from "../pos/SinhalaTouchKeyboard";
import BulkProductsPage from "./BulkProductsPage";
import type { InventoryProduct } from "../inventory/InventoryPage";
import "./ProductsPage.css";

type Props = { products: InventoryProduct[]; setProducts: Dispatch<SetStateAction<InventoryProduct[]>>; onNotice: (message: string) => void };
const money = (n:number) => "Rs. "+n.toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2});
const blank:InventoryProduct = {id:"",name:"",category:"Groceries",barcode:"",unit:"Pack",stock:0,buy:0,sell:0,reorder:10,emoji:"📦",brand:"",description:"",maxStock:0,active:true,images:[]};
const makeInternalEan13=(used:Set<string>):string=>{for(let attempt=0;attempt<1000;attempt++){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const first12="20"+String(bytes[0]).padStart(10,"0").slice(-10);let sum=0;for(let i=0;i<12;i++)sum+=Number(first12[i])*(i%2===0?1:3);const code=first12+String((10-sum%10)%10);if(!used.has(code))return code;}throw new Error("Unable to generate a unique barcode.");};
const categories=["Groceries","Beverages","Household","Personal Care","Snacks","Others"];
const units=["Bag","Bottle","Pack","Piece","Box","Kg","Litre","Gram","Carton","Dozen"];
const nextSku=(products:InventoryProduct[],reserved:string[]=[])=>"PRD-"+String(Math.max(0,...[...products.map(p=>p.id),...reserved].map(id=>Number(id.replace(/^PRD-/,""))||0))+1).padStart(5,"0");
const offerId=()=>Math.random().toString(36).slice(2,10);


export default function ProductsPage({products,setProducts,onNotice}:Props) {
  const [bulkOpen,setBulkOpen]=useState(false);
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("All Products");
  const [editing,setEditing]=useState<InventoryProduct|null>(null);
  const [originalId,setOriginalId]=useState<string|null>(null);
  const [variants,setVariants]=useState<InventoryProduct[]>([]);
  const [selectedImage,setSelectedImage]=useState(0);
  const [scannerOpen,setScannerOpen]=useState(false);
  const [scanForSearch,setScanForSearch]=useState(false);
  const [searchKeyboardOpen,setSearchKeyboardOpen]=useState(false);
  const searchRef=useRef<HTMLInputElement>(null);
  const [formError,setFormError]=useState("");
  const fileRef=useRef<HTMLInputElement|null>(null);
  const supplierNames=useMemo(()=>Array.from(new Set(products.flatMap(p=>(p.supplierOffers||[]).map(o=>o.supplier.trim())).filter(Boolean))).sort((a,b)=>a.localeCompare(b)),[products]);
  const selectedSupplier=editing?.supplierOffers?.find(o=>o.preferred)?.supplier||"";
  const selectSupplier=(name:string)=>{
    setEditing(p=>{
      if(!p)return p;
      const current=p.supplierOffers||[];
      if(!name)return {...p,supplierOffers:current.map(o=>({...o,preferred:false}))};
      const existing=current.find(o=>o.supplier===name);
      return {...p,supplierOffers:existing?current.map(o=>({...o,preferred:o.supplier===name})):[...current.map(o=>({...o,preferred:false})),{id:offerId(),supplier:name,cost:p.buy,preferred:true,supplierSku:""}]};
    });
  };
  const filtered=useMemo(()=>products.filter(p=>(category==="All Products"||p.category===category)&&[p.name,p.id,p.barcode,p.category,p.brand].join(" ").toLowerCase().includes(search.trim().toLowerCase())),[products,search,category]);
  const openEditor=(p?:InventoryProduct)=>{
    const family=p?.familyId||p?.id;
    const siblings=p?products.filter(x=>(x.familyId||x.id)===family):[];
    const draft=p?{...p,images:[...(p.images||[])],supplierOffers:(p.supplierOffers||[]).map(x=>({...x}))}:{...blank,id:nextSku(products),variantName:"Default",familyId:"",supplierOffers:[]};
    setOriginalId(p?.id??null);setVariants(siblings.filter(x=>x.id!==p?.id).map(x=>({...x,supplierOffers:(x.supplierOffers||[]).map(o=>({...o}))})));
    setEditing(draft);setSelectedImage(0);setFormError("");
  };
  const update=<K extends keyof InventoryProduct>(field:K,value:InventoryProduct[K])=>setEditing(p=>p?{...p,[field]:value}:p);
  const switchVariant=(id:string)=>{
    if(!editing||id===editing.id)return;
    const next=variants.find(v=>v.id===id);if(!next)return;
    setVariants(old=>[...old.filter(v=>v.id!==id),editing]);
    setEditing({...next});setSelectedImage(0);setFormError("");
  };
  const addVariant=()=>{
    if(!editing)return;
    const id=nextSku(products,[editing.id,...variants.map(v=>v.id)]);
    const family=editing.familyId||originalId||editing.id;
    setVariants(old=>[...old,editing]);
    setEditing({...editing,id,familyId:family,variantName:"New Variant",barcode:"",stock:0,reorder:10,maxStock:0,supplierOffers:[],images:[...(editing.images||[])]});
    setSelectedImage(0);setFormError("");
  };
  const save=()=>{
    if(!editing)return;
    const all=[...variants,editing];
    if(all.some(p=>!p.name.trim()||!p.id.trim()||!p.category||!p.unit||![p.buy,p.sell,p.stock,p.reorder].every(n=>Number.isFinite(n)&&n>=0)||p.maxStock!==undefined&&(!Number.isFinite(p.maxStock)||p.maxStock<0))){setFormError("Complete all required fields with valid non-negative numbers.");return;}
    const ids=all.map(p=>p.id),codes=all.map(p=>p.barcode.trim()).filter(Boolean);
    if(new Set(ids).size!==ids.length||new Set(codes).size!==codes.length){setFormError("Each variant must have a unique SKU and barcode.");return;}
    const family=editing.familyId||originalId||all[0].id;
    const previous=products.filter(p=>(p.familyId||p.id)===family);
    if(all.some(p=>products.some(existing=>existing.id===p.id&&!previous.some(old=>old.id===existing.id)))){setFormError("A product SKU already exists.");return;}
    if(all.some(p=>p.barcode&&products.some(existing=>existing.barcode===p.barcode&&!previous.some(old=>old.id===existing.id)))){setFormError("A barcode is already assigned to another product.");return;}
    const saved=all.map(p=>({...p,familyId:family,name:editing.name,category:editing.category,brand:editing.brand,description:editing.description,active:editing.active}));
    setProducts(old=>[...old.filter(p=>!previous.some(x=>x.id===p.id)),...saved]);
    setEditing(null);setVariants([]);setFormError("");onNotice(originalId?"Product variants updated.":"Product and variants added.");
  };
  const uploadImages=(event:ChangeEvent<HTMLInputElement>)=>{
    const files=Array.from(event.target.files||[]).filter(f=>f.type.startsWith("image/"));
    if(!files.length)return;
    const available=Math.max(0,5-(editing?.images?.length||0));
    if(files.length>available){setFormError("You can add up to five product images.");}
    files.slice(0,available).forEach(file=>{
      if(file.size>2*1024*1024){setFormError("Each image must be smaller than 2 MB.");return;}
      const reader=new FileReader();
      reader.onload=()=>{if(typeof reader.result==="string")setEditing(p=>p?{...p,images:[...(p.images||[]),reader.result as string]}:p);};
      reader.readAsDataURL(file);
    });
    event.target.value="";
  };
  const removeImage=(index:number)=>{setEditing(p=>p?{...p,images:(p.images||[]).filter((_,i)=>i!==index)}:p);setSelectedImage(0);};
  const printBarcode=()=>{
    if(!editing?.barcode.trim())return;
    const svg=document.querySelector(".products-barcode-print svg");
    if(!svg){setFormError("Enter a valid barcode before printing.");return;}
    const popup=window.open("","_blank","width=520,height=380");
    if(!popup){setFormError("Allow pop-ups to print the barcode.");return;}
    popup.document.write('<!doctype html><html><head><title>Product barcode</title><style>body{font-family:Arial;text-align:center;padding:24px}svg{max-width:100%;height:auto}h3{margin-bottom:14px}</style></head><body><h3>'+editing.name.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]||c))+'</h3>'+svg.outerHTML+'</body></html>');
    popup.document.close();popup.focus();popup.print();
  };
  useEffect(()=>{if(!editing)return;const listener=(e:KeyboardEvent)=>{if(e.key==="F10"){e.preventDefault();save();}};window.addEventListener("keydown",listener);return()=>window.removeEventListener("keydown",listener);});
  if(bulkOpen)return <BulkProductsPage products={products} setProducts={setProducts} onNotice={onNotice} onBack={()=>setBulkOpen(false)}/>;
  return <div className={`products-page ${editing ? "products-page--editing" : "products-page--listing"}`}>
    <header className="products-heading"><div className="products-heading-title"><Inventory2Outlined sx={{color:"#f58a00",fontSize:36}}/><div><h1>{editing?"Add / Edit Product":"Products"}</h1><p>{editing?"Product details, variants, suppliers and barcode management.":"Find, review, add and edit products in your inventory."}</p></div></div><div className="products-header-actions">{editing?<><label className="products-header-active"><Switch checked={editing.active!==false} onChange={e=>update("active",e.target.checked)} color="success" size="small" inputProps={{"aria-label":"Product active status"}}/> {editing.active===false?"Inactive":"Active"}</label><button className="products-secondary" onClick={()=>setEditing(null)}><ArrowBack/> Back to Products</button><button className="products-secondary" onClick={()=>setEditing(null)}>Cancel</button><button className="products-primary" onClick={save}><SaveOutlined/> Save Product (F10)</button></>:<><button className="products-secondary" onClick={()=>{setSearchKeyboardOpen(false);setBulkOpen(true)}}><LayersOutlined/> Bulk Add Products</button><button className="products-primary" onClick={()=>openEditor()}><Add/> Add Product</button></>}</div></header>
    {!editing?<section className="products-panel products-list-panel">
      <div className="products-search-controls"><label className="products-search"><Search/><input ref={searchRef} aria-label="Search existing products" placeholder="Search existing products by name, SKU or barcode..." value={search} onChange={e=>setSearch(e.target.value)}/></label><button type="button" className="products-secondary products-search-action" aria-label="Toggle Sinhala touch keyboard" aria-pressed={searchKeyboardOpen} onClick={()=>setSearchKeyboardOpen(v=>!v)}><KeyboardOutlined/> සිංහල</button><button type="button" className="products-secondary products-search-action" onClick={()=>{setScanForSearch(true);setScannerOpen(true);}}><QrCodeScannerOutlined/> Scan Product</button><select aria-label="Filter product category" value={category} onChange={e=>setCategory(e.target.value)}>{["All Products",...new Set(products.map(p=>p.category))].map(c=><option key={c}>{c}</option>)}</select></div>{searchKeyboardOpen&&<div className="products-keyboard-container"><SinhalaTouchKeyboard value={search} onChange={setSearch} onClose={()=>setSearchKeyboardOpen(false)} inputRef={searchRef}/></div>}
      <div className="products-table-wrap"><table><thead><tr><th>Product</th><th>SKU / Barcode</th><th>Category</th><th>Stock</th><th>Buying Price</th><th>Selling Price</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><span className="products-product">{p.images?.[0]?<img src={p.images[0]} alt="" />:<span>{p.emoji}</span>}<strong>{p.name}</strong></span></td><td><strong>{p.id}</strong><small>{p.barcode||"No barcode"}</small></td><td>{p.category}</td><td>{p.stock} {p.unit}</td><td>{money(p.buy)}</td><td>{money(p.sell)}</td><td><span className={"products-status "+(!p.active?"out":p.stock===0?"out":p.stock<=p.reorder?"low":"in")}>{!p.active?"Inactive":p.stock===0?"Out of Stock":p.stock<=p.reorder?"Low Stock":"In Stock"}</span></td><td><button className="products-edit" onClick={()=>openEditor(p)} aria-label={"Edit "+p.name}><EditOutlined fontSize="small"/> Edit</button></td></tr>)}</tbody></table>{filtered.length===0&&<p className="products-empty">No products match your search.</p>}</div><footer className="products-count">Showing {filtered.length} of {products.length} products</footer>
    </section>:<><div className="products-editor">
      <div className="products-editor-left">
      <section className="products-panel products-info"><h2><InfoOutlined/> Product Information</h2>
        <label>Product Name *<input value={editing.name} onChange={e=>update("name",e.target.value)} placeholder="Product name"/></label>
        <label>Category *<select value={editing.category} onChange={e=>update("category",e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
        <label>Brand<input value={editing.brand||""} onChange={e=>update("brand",e.target.value)} placeholder="Brand name (optional)"/></label>
        <label>Supplier<select value={selectedSupplier} onChange={e=>selectSupplier(e.target.value)}><option value="">No supplier selected</option>{selectedSupplier&&!supplierNames.includes(selectedSupplier)&&<option value={selectedSupplier}>{selectedSupplier}</option>}{supplierNames.map(name=><option key={name} value={name}>{name}</option>)}</select></label>
        <label>Description (Optional)<textarea rows={3} maxLength={250} value={editing.description||""} onChange={e=>update("description",e.target.value)} placeholder="Describe this product..."/></label><span className="products-char-count">{(editing.description||"").length} / 250</span>
        
      </section>

      <section className="products-panel products-pricing"><h2>Pricing</h2>
        <div className="products-field-pair"><label>Buying Price (Rs.) *<input type="number" min="0" step="0.01" value={editing.buy} onChange={e=>update("buy",Number(e.target.value))}/></label><label>Selling Price (Rs.) *<input type="number" min="0" step="0.01" value={editing.sell} onChange={e=>update("sell",Number(e.target.value))}/></label></div>
        <div className="products-margin">Profit Margin <strong>{editing.sell>0?(((editing.sell-editing.buy)/editing.sell)*100).toFixed(2):"0.00"}%</strong></div>
      </section>
    </div>
    <div className="products-editor-middle">
      <section className="products-panel"><h2><LayersOutlined/> Variants</h2>
        <label>Selected Variant<select value={editing.id} onChange={e=>switchVariant(e.target.value)}>{[...variants,editing].map(v=><option value={v.id} key={v.id}>{v.variantName||"Default"} · {v.id}</option>)}</select></label>
        <label>Variant Name / Size<input value={editing.variantName||""} onChange={e=>update("variantName",e.target.value)} placeholder="e.g. 500 ml, 1 L, Large"/></label>
        <div className="products-field-pair"><label>Unit *<select value={editing.unit} onChange={e=>update("unit",e.target.value)}>{units.map(c=><option key={c}>{c}</option>)}</select></label><label>SKU (Auto)<input value={editing.id} readOnly title="Automatically assigned product code"/></label></div>
        <button type="button" className="products-outline-action" onClick={addVariant}><Add/> Add Variant</button>
      </section>
      <section className="products-panel"><h2>Stock &amp; Reorder</h2>
        <label>Current Stock *<div className="products-unit-input"><input type="number" min="0" value={editing.stock} onChange={e=>update("stock",Number(e.target.value))}/><span>{editing.unit}</span></div></label>
        <label>Reorder Level *<div className="products-unit-input"><input type="number" min="0" value={editing.reorder} onChange={e=>update("reorder",Number(e.target.value))}/><span>{editing.unit}</span></div></label>
        <label>Maximum Stock (Optional)<div className="products-unit-input"><input type="number" min="0" value={editing.maxStock||0} onChange={e=>update("maxStock",Number(e.target.value))}/><span>{editing.unit}</span></div></label>
      </section>

    </div><div className="products-editor-right"><section className="products-panel"><h2><ImageOutlined/> Product Image</h2><div className="products-preview">{editing.images?.length?<img src={editing.images[Math.min(selectedImage,editing.images.length-1)]} alt={editing.name||"Product preview"}/>:<div className="products-preview-placeholder"><span>{editing.emoji}</span><strong>{editing.name||"New Product"}</strong><small>No image uploaded</small></div>}{editing.images?.length?<div className="products-image-actions"><button type="button" title="Replace image" aria-label="Replace selected image" onClick={()=>fileRef.current?.click()}><EditOutlined/></button><button type="button" title="Remove image" aria-label="Remove selected image" onClick={()=>removeImage(selectedImage)}><DeleteOutlined/></button></div>:null}</div><div className="products-thumbnails">{(editing.images||[]).map((src,i)=><button type="button" className={selectedImage===i?"active":""} key={i} onClick={()=>setSelectedImage(i)}><img src={src} alt={"Product image "+(i+1)}/></button>)}{(editing.images||[]).length<5&&<button type="button" className="products-add-image" onClick={()=>fileRef.current?.click()}><Add/> Add Image</button>}</div><input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={uploadImages}/><p className="products-note">Upload up to 5 images (maximum 2 MB each). Images are held in frontend state until backend storage is connected.</p></section><section className="products-panel"><h2><QrCodeScannerOutlined/> Barcode (for Printing)</h2><div className="products-barcode-entry"><input aria-label="Barcode" value={editing.barcode} onChange={e=>update("barcode",e.target.value)} placeholder="Scan or generate barcode"/><button type="button" className="products-soft-green" onClick={()=>{setScanForSearch(false);setScannerOpen(true);}}><QrCodeScannerOutlined/> Scan</button><button type="button" className="products-soft-green" onClick={()=>{const used=new Set(products.filter(p=>p.id!==editing.id).map(p=>p.barcode.trim()).filter(Boolean));try{update("barcode",makeInternalEan13(used));}catch{setFormError("Unable to generate a unique barcode.");}}}><Add/> Generate</button></div><div className="products-barcode-print">{editing.barcode.trim()?<BarcodeDisplay value={editing.barcode.trim()} format={/^\d{13}$/.test(editing.barcode.trim())?"EAN13":"CODE128"} height={55} width={1.5} fontSize={13} showDownload={false}/>:<p className="products-note">Enter a barcode to preview and print it.</p>}<button type="button" className="products-soft-green" disabled={!editing.barcode.trim()} onClick={printBarcode}><LocalPrintshopOutlined/> Print Barcode</button></div></section></div>
    </div>{formError&&<p className="products-form-error" role="alert">{formError}</p>}</>}

    <Dialog open={scannerOpen} onClose={()=>{setScannerOpen(false);setScanForSearch(false);}} maxWidth="sm" fullWidth><DialogTitle sx={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span><CameraAltOutlined sx={{verticalAlign:"middle",mr:1}}/>{scanForSearch?"Scan Product to Search":"Scan Product Barcode"}</span><IconButton onClick={()=>setScannerOpen(false)} aria-label="Close scanner">×</IconButton></DialogTitle><DialogContent><BarcodeScanner compact submitLabel="Use Barcode" onScan={code=>{if(scanForSearch){setSearch(code);setSearchKeyboardOpen(false);}else{update("barcode",code);}setScannerOpen(false);setScanForSearch(false);}}/></DialogContent></Dialog>
  </div>;
}
