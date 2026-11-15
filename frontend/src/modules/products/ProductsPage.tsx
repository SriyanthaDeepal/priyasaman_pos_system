import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Add, ArrowBack, EditOutlined, Inventory2Outlined, Search, SaveOutlined } from "@mui/icons-material";
import type { InventoryProduct } from "../inventory/InventoryPage";
import "./ProductsPage.css";

type Props = { products: InventoryProduct[]; setProducts: Dispatch<SetStateAction<InventoryProduct[]>>; onNotice: (message: string) => void };
const money = (n:number) => "Rs. "+n.toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2});
const blank:InventoryProduct = {id:"",name:"",category:"Groceries",barcode:"",unit:"Pack",stock:0,buy:0,sell:0,reorder:10,emoji:"📦"};

export default function ProductsPage({products,setProducts,onNotice}:Props) {
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("All Products");
  const [editing,setEditing]=useState<InventoryProduct|null>(null);
  const [originalId,setOriginalId]=useState<string|null>(null);
  const filtered=useMemo(()=>products.filter(p=>(category==="All Products"||p.category===category)&&[p.name,p.id,p.barcode,p.category].join(" ").toLowerCase().includes(search.trim().toLowerCase())),[products,search,category]);
  const openEditor=(p?:InventoryProduct)=>{setOriginalId(p?.id??null);setEditing({...p??blank});};
  const update=<K extends keyof InventoryProduct>(field:K,value:InventoryProduct[K])=>setEditing(p=>p?{...p,[field]:value}:p);
  const save=()=>{
    if(!editing)return;
    if(!editing.name.trim()||!editing.id.trim()||!editing.category||!editing.unit||editing.buy<0||editing.sell<0||editing.stock<0||editing.reorder<0){onNotice("Enter valid required product information.");return;}
    if(products.some(p=>p.id===editing.id&&p.id!==originalId)){onNotice("This product SKU already exists.");return;}
    if(editing.barcode&&products.some(p=>p.barcode===editing.barcode&&p.id!==originalId)){onNotice("This barcode is already assigned to another product.");return;}
    setProducts(old=>originalId?old.map(p=>p.id===originalId?editing:p):[...old,editing]);
    setEditing(null);onNotice(originalId?"Product updated.":"Product added.");
  };
  return <div className="products-page">
    <header className="products-heading"><div className="products-heading-title"><Inventory2Outlined sx={{color:"#f58a00",fontSize:36}}/><div><h1>{editing?"Add / Edit Product":"Products"}</h1><p>{editing?"Create a new product or update an existing product.":"Find, review, add and edit products in your inventory."}</p></div></div><div>{editing?<button className="products-secondary" onClick={()=>setEditing(null)}><ArrowBack/> Back to Products</button>:<button className="products-primary" onClick={()=>openEditor()}><Add/> Add Product</button>}</div></header>
    {!editing?<section className="products-panel">
      <div className="products-search-controls"><label className="products-search"><Search/><input aria-label="Search existing products" placeholder="Search existing products by name, SKU or barcode..." value={search} onChange={e=>setSearch(e.target.value)}/></label><select aria-label="Filter product category" value={category} onChange={e=>setCategory(e.target.value)}>{["All Products",...new Set(products.map(p=>p.category))].map(c=><option key={c}>{c}</option>)}</select></div>
      <div className="products-table-wrap"><table><thead><tr><th>Product</th><th>SKU / Barcode</th><th>Category</th><th>Stock</th><th>Buying Price</th><th>Selling Price</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><span className="products-product"><span>{p.emoji}</span><strong>{p.name}</strong></span></td><td><strong>{p.id}</strong><small>{p.barcode||"No barcode"}</small></td><td>{p.category}</td><td>{p.stock} {p.unit}</td><td>{money(p.buy)}</td><td>{money(p.sell)}</td><td><span className={"products-status "+(p.stock===0?"out":p.stock<=p.reorder?"low":"in")}>{p.stock===0?"Out of Stock":p.stock<=p.reorder?"Low Stock":"In Stock"}</span></td><td><button className="products-edit" onClick={()=>openEditor(p)} aria-label={"Edit "+p.name}><EditOutlined fontSize="small"/> Edit</button></td></tr>)}</tbody></table>{filtered.length===0&&<p className="products-empty">No products match your search.</p>}</div><footer className="products-count">Showing {filtered.length} of {products.length} products</footer>
    </section>:<div className="products-editor">
      <section className="products-panel"><h2>Product Information</h2><label>Product Name *<input value={editing.name} onChange={e=>update("name",e.target.value)} placeholder="Product name"/></label><label>SKU / Product Code *<input value={editing.id} onChange={e=>update("id",e.target.value)} placeholder="PRD-00001"/></label><label>Barcode<input value={editing.barcode} onChange={e=>update("barcode",e.target.value)} placeholder="Barcode number"/></label><label>Category *<select value={editing.category} onChange={e=>update("category",e.target.value)}>{["Groceries","Beverages","Household","Personal Care","Snacks","Others"].map(c=><option key={c}>{c}</option>)}</select></label><label>Unit *<select value={editing.unit} onChange={e=>update("unit",e.target.value)}>{["Bag","Bottle","Pack","Piece","Box","Kg","Litre"].map(c=><option key={c}>{c}</option>)}</select></label></section>
      <section className="products-panel"><h2>Pricing</h2><label>Buying Price (Rs.) *<input type="number" min="0" step="0.01" value={editing.buy} onChange={e=>update("buy",Number(e.target.value))}/></label><label>Selling Price (Rs.) *<input type="number" min="0" step="0.01" value={editing.sell} onChange={e=>update("sell",Number(e.target.value))}/></label><div className="products-margin">Profit Margin <strong>{editing.sell>0?(((editing.sell-editing.buy)/editing.sell)*100).toFixed(2):"0.00"}%</strong></div><h2>Stock & Reorder</h2><label>Current Stock *<input type="number" min="0" value={editing.stock} onChange={e=>update("stock",Number(e.target.value))}/></label><label>Reorder Level *<input type="number" min="0" value={editing.reorder} onChange={e=>update("reorder",Number(e.target.value))}/></label></section>
      <section className="products-panel"><h2>Product Preview</h2><div className="products-preview"><span>{editing.emoji}</span><strong>{editing.name||"New Product"}</strong><small>{editing.id||"SKU not entered"}</small></div><p className="products-note">Product images, barcode printing and backend persistence will be connected in a later implementation.</p></section>
      <div className="products-editor-actions"><button className="products-secondary" onClick={()=>setEditing(null)}>Cancel</button><button className="products-primary" onClick={save}><SaveOutlined/> Save Product</button></div>
    </div>}
  </div>;
}
