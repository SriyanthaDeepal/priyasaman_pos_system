import { useState } from "react";
import "./BoundedTimePicker.css";

type Props = { label: string; value: string; onChange: (value: string) => void };
const hours = [12,1,2,3,4,5,6,7,8,9,10,11];
function parse(value:string){
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return {hour:12,minute:0,period:"AM" as const};
  const [h,m]=value.split(":").map(Number);
  return {hour:h%12||12,minute:m,period:h>=12?"PM" as const:"AM" as const};
}
export default function BoundedTimePicker({label,value,onChange}:Props){
  const [open,setOpen]=useState(false);
  const time=parse(value);
  const update=(hour:number,minute:number,period:"AM"|"PM")=>onChange(String(hour%12+(period==="PM"?12:0)).padStart(2,"0")+":"+String(minute).padStart(2,"0"));
  const hourIndex=hours.indexOf(time.hour);
  const adjustHour=(delta:number)=>update(hours[Math.max(0,Math.min(11,hourIndex+delta))],time.minute,time.period);
  const adjustMinute=(delta:number)=>update(time.hour,Math.max(0,Math.min(59,time.minute+delta)),time.period);
  return <div className="sales-bounded-time"><span className="sales-bounded-label">{label}</span><button type="button" className="sales-bounded-trigger" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{value?time.hour+":"+String(time.minute).padStart(2,"0")+" "+time.period:"Any time"} <span>▾</span></button>{open&&<div className="sales-bounded-panel"><div className="sales-bounded-columns"><div className="sales-bounded-unit"><span>Hour</span><button type="button" disabled={hourIndex===0} onClick={()=>adjustHour(-1)} aria-label="Previous hour">▲</button><strong>{time.hour}</strong><button type="button" disabled={hourIndex===11} onClick={()=>adjustHour(1)} aria-label="Next hour">▼</button></div><div className="sales-bounded-unit"><span>Minute</span><button type="button" disabled={time.minute===0} onClick={()=>adjustMinute(-1)} aria-label="Previous minute">▲</button><strong>{String(time.minute).padStart(2,"0")}</strong><button type="button" disabled={time.minute===59} onClick={()=>adjustMinute(1)} aria-label="Next minute">▼</button></div><div className="sales-bounded-unit"><span>Period</span><button type="button" className={time.period==="AM"?"chosen":""} onClick={()=>update(time.hour,time.minute,"AM")}>AM</button><button type="button" className={time.period==="PM"?"chosen":""} onClick={()=>update(time.hour,time.minute,"PM")}>PM</button></div></div><div className="sales-bounded-actions"><button type="button" onClick={()=>{onChange("");setOpen(false)}}>Clear</button><button type="button" onClick={()=>{if(!value)update(time.hour,time.minute,time.period);setOpen(false)}}>Done</button></div></div>}</div>;
}
