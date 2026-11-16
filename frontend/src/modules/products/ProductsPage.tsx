import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { Add, ArrowBack, CameraAltOutlined, DeleteOutlined, EditOutlined, ImageOutlined, InfoOutlined, Inventory2Outlined, LocalPrintshopOutlined, QrCodeScannerOutlined, Search, SaveOutlined } from "@mui/icons-material";
import { Dialog, DialogContent, DialogTitle, IconButton, Switch } from "@mui/material";
import BarcodeDisplay from "../../components/common/BarcodeDisplay/BarcodeDisplay";
import BarcodeScanner from "../../components/common/BarcodeScanner/BarcodeScanner";
import type { InventoryProduct } from "../inventory/InventoryPage";
import "./ProductsPage.css";

type Props = { products: InventoryProduct[]; setProducts: Dispatch<SetStateAction<InventoryProduct[]>>; onNotice: (message: string) => void };
const money = (n:number) => "Rs. "+n.toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2});
const blank:InventoryProduct = {id:"",name:"",category:"Groceries",barcode:"",unit:"Pack",stock:0,buy:0,sell:0,reorder:10,emoji:"📦",brand:"",description:"",maxStock:0,active:true,images:[]};
const categories=["Groceries","Beverages","Household","Personal Care","Snacks","Others"];
const units=["Bag","Bottle","Pack","Piece","Box","Kg","Litre","Gram","Carton","Dozen"];
const nextSku=(products:InventoryProduct[])=>"PRD-"+String(Math.max(0,...products.map(p=>Number(p.id.match(/^PRD-(\\d+)$/)?.[1]||0)))+1).padStart(5,"0");

export default function ProductsPage({products,setProducts,onNotice}:Props) {
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("All Products");
  const [editing,setEditing]=useState<InventoryProduct|null>(null);
  const [originalId,setOriginalId]=useState<string|null>(null);
  const [selectedImage,setSelectedImage]=useState(0);
  const [scannerOpen,setScannerOpen]=useState(false);
  const [formError,setFormError]=useState("");
  const fileRef=useRef<HTMLInputElement|null>(null);
  const filtered=useMemo(()=>products.filter(p=>(category==="All Products"||p.category===category)&&[p.name,p.id,p.barcode,p.category,p.brand].join(" ").toLowerCase().includes(search.trim().toLowerCase())),[products,search,category]);
  const openEditor=(p?:InventoryProduct)=>{setOriginalId(p?.id??null);setEditing(p?{...p,images:[...(p.images||[])]}:{...blank,id:nextSku(products)});setSelectedImage(0);setFormError("");};
  const update=<K extends keyof InventoryProduct>(field:K,value:InventoryProduct[K])=>setEditing(p=>p?{...p,[field]:value}:p);
  const save=()=>{
    if(!editing)return;
    if(!editing.name.trim()||!editing.id.trim()||!editing.category||!editing.unit||![editing.buy,editing.sell,editing.stock,editing.reorder].every(n=>Number.isFinite(n)&&n>=0)||editing.maxStock!==undefined&&(!Number.isFinite(editing.maxStock)||editing.maxStock<0)){setFormError("Complete the required fields using valid non-negative numbers.");return;}
    if(products.some(p=>p.id===editing.id&&p.id!==originalId)){setFormError("This product SKU already exists.");return;}
    if(editing.barcode&&products.some(p=>p.barcode===editing.barcode&&p.id!==originalId)){setFormError("This barcode is already assigned to another product.");return;}
    setProducts(old=>originalId?old.map(p=>p.id===originalId?editing:p):[...old,editing]);
    setEditing(null);setFormError("");onNotice(originalId?"Product updated.":"Product added.");
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
  return <div className="products-page">
    <header className="products-heading"><div className="products-heading-title"><Inventory2Outlined sx={{color:"#f58a00",fontSize:36}}/><div><h1>{editing?"Add / Edit Product":"Products"}</h1><p>{editing?"Create a new product or update an existing product.":"Find, review, add and edit products in your inventory."}</p></div></div><div className="products-header-actions">{editing?<><label className="products-header-active"><Switch checked={editing.active!==false} onChange={e=>update("active",e.target.checked)} color="success" size="small"/> Active</label><button className="products-secondary" onClick={()=>setEditing(null)}><ArrowBack/> Back to Products</button><button className="products-secondary" onClick={()=>setEditing(null)}>Cancel</button><button className="products-primary" onClick={save}><SaveOutlined/> Save Product (F10)</button></>:<button className="products-primary" onClick={()=>openEditor()}><Add/> Add Product</button>}</div></header>
    {!editing?<section className="products-panel">
      <div className="products-search-controls"><label className="products-search"><Search/><input aria-label="Search existing products" placeholder="Search existing products by name, SKU or barcode..." value={search} onChange={e=>setSearch(e.target.value)}/></label><select aria-label="Filter product category" value={category} onChange={e=>setCategory(e.target.value)}>{["All Products",...new Set(products.map(p=>p.category))].map(c=><option key={c}>{c}</option>)}</select></div>
      <div className="products-table-wrap"><table><thead><tr><th>Product</th><th>SKU / Barcode</th><th>Category</th><th>Stock</th><th>Buying Price</th><th>Selling Price</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><span className="products-product">{p.images?.[0]?<img src={p.images[0]} alt="" />:<span>{p.emoji}</span>}<strong>{p.name}</strong></span></td><td><strong>{p.id}</strong><small>{p.barcode||"No barcode"}</small></td><td>{p.category}</td><td>{p.stock} {p.unit}</td><td>{money(p.buy)}</td><td>{money(p.sell)}</td><td><span className={"products-status "+(!p.active?"out":p.stock===0?"out":p.stock<=p.reorder?"low":"in")}>{!p.active?"Inactive":p.stock===0?"Out of Stock":p.stock<=p.reorder?"Low Stock":"In Stock"}</span></td><td><button className="products-edit" onClick={()=>openEditor(p)} aria-label={"Edit "+p.name}><EditOutlined fontSize="small"/> Edit</button></td></tr>)}</tbody></table>{filtered.length===0&&<p className="products-empty">No products match your search.</p>}</div><footer className="products-count">Showing {filtered.length} of {products.length} products</footer>
    </section>:<><div className="products-editor">
      <div className="products-editor-left"><section className="products-panel products-info"><h2><InfoOutlined/> Product Information</h2><label>Product Name *<input value={editing.name} onChange={e=>update("name",e.target.value)} placeholder="Product name"/></label><label>SKU / Product Code *<input value={editing.id} onChange={e=>update("id",e.target.value)} placeholder="PRD-00001"/></label><label>Barcode<div className="products-inline-input"><input value={editing.barcode} onChange={e=>update("barcode",e.target.value)} placeholder="Scan or enter barcode"/><button type="button" className="products-soft-green" onClick={()=>setScannerOpen(true)}><QrCodeScannerOutlined/> Scan</button></div></label><label>Category *<select value={editing.category} onChange={e=>update("category",e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Brand<input value={editing.brand||""} onChange={e=>update("brand",e.target.value)} placeholder="Brand name (optional)"/></label><label>Unit *<select value={editing.unit} onChange={e=>update("unit",e.target.value)}>{units.map(c=><option key={c}>{c}</option>)}</select></label><label>Description (Optional)<textarea rows={3} maxLength={250} value={editing.description||""} onChange={e=>update("description",e.target.value)} placeholder="Describe this product..."/></label><span className="products-char-count">{(editing.description||"").length} / 250</span></section><section className="products-panel"><h2>Pricing</h2><label>Buying Price (Rs.) *<input type="number" min="0" step="0.01" value={editing.buy} onChange={e=>update("buy",Number(e.target.value))}/></label><label>Selling Price (Rs.) *<input type="number" min="0" step="0.01" value={editing.sell} onChange={e=>update("sell",Number(e.target.value))}/></label><div className="products-margin">Profit Margin <strong>{editing.sell>0?(((editing.sell-editing.buy)/editing.sell)*100).toFixed(2):"0.00"}%</strong></div></section></div><div className="products-editor-middle"><section className="products-panel"><h2>Stock &amp; Reorder</h2><label>Current Stock *<div className="products-unit-input"><input type="number" min="0" value={editing.stock} onChange={e=>update("stock",Number(e.target.value))}/><span>{editing.unit}</span></div></label><label>Reorder Level *<div className="products-unit-input"><input type="number" min="0" value={editing.reorder} onChange={e=>update("reorder",Number(e.target.value))}/><span>{editing.unit}</span></div></label><label>Maximum Stock (Optional)<div className="products-unit-input"><input type="number" min="0" value={editing.maxStock||0} onChange={e=>update("maxStock",Number(e.target.value))}/><span>{editing.unit}</span></div></label></section></div><div className="products-editor-right"><section className="products-panel"><h2><ImageOutlined/> Product Image</h2><div className="products-preview">{editing.images?.length?<img src={editing.images[Math.min(selectedImage,editing.images.length-1)]} alt={editing.name||"Product preview"}/>:<div className="products-preview-placeholder"><span>{editing.emoji}</span><strong>{editing.name||"New Product"}</strong><small>No image uploaded</small></div>}{editing.images?.length?<div className="products-image-actions"><button type="button" title="Replace image" aria-label="Replace selected image" onClick={()=>fileRef.current?.click()}><EditOutlined/></button><button type="button" title="Remove image" aria-label="Remove selected image" onClick={()=>removeImage(selectedImage)}><DeleteOutlined/></button></div>:null}</div><div className="products-thumbnails">{(editing.images||[]).map((src,i)=><button type="button" className={selectedImage===i?"active":""} key={i} onClick={()=>setSelectedImage(i)}><img src={src} alt={"Product image "+(i+1)}/></button>)}{(editing.images||[]).length<5&&<button type="button" className="products-add-image" onClick={()=>fileRef.current?.click()}><Add/> Add Image</button>}</div><input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={uploadImages}/><p className="products-note">Upload up to 5 images (maximum 2 MB each). Images are held in frontend state until backend storage is connected.</p></section><section className="products-panel"><h2><QrCodeScannerOutlined/> Barcode (for Printing)</h2><div className="products-barcode-print">{editing.barcode.trim()?<BarcodeDisplay value={editing.barcode.trim()} format="CODE128" height={55} width={1.5} fontSize={13} showDownload={false}/>:<p className="products-note">Enter a barcode to preview and print it.</p>}<button type="button" className="products-soft-green" disabled={!editing.barcode.trim()} onClick={printBarcode}><LocalPrintshopOutlined/> Print Barcode</button></div></section></div>
    </div>{formError&&<p className="products-form-error" role="alert">{formError}</p>}</>}
    <Dialog open={scannerOpen} onClose={()=>setScannerOpen(false)} maxWidth="sm" fullWidth><DialogTitle sx={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span><CameraAltOutlined sx={{verticalAlign:"middle",mr:1}}/>Scan Product Barcode</span><IconButton onClick={()=>setScannerOpen(false)} aria-label="Close scanner">×</IconButton></DialogTitle><DialogContent><BarcodeScanner compact submitLabel="Use Barcode" onScan={code=>{update("barcode",code);setScannerOpen(false);}}/></DialogContent></Dialog>
  </div>;
}
