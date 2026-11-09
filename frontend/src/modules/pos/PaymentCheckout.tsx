import { useEffect, useState } from "react";
import { ArrowBack, CheckCircle, CreditCard, LocalAtm, Payments, PhoneAndroid, Print, PictureAsPdf, Email, Sms, ReceiptLong, Redeem, AccountBalanceWallet, Close, ShoppingCart, SwapHoriz, RestartAlt, QrCode2, AccountBalance } from "@mui/icons-material";
import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, TextField } from "@mui/material";
import "./PaymentCheckout.css";

export type CheckoutItem = { id: number; name: string; emoji: string; quantity: number; price: number; unit: string };
type Props = {
  items: CheckoutItem[];
  invoice: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  customer: string;
  onBack: () => void;
  onComplete: (received: number, notes: string, printReceipt: boolean, method: "cash" | "card" | "mobile") => void;
};
const money = (n: number) => "Rs. " + n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const methods = [
  { id: "cash", label: "Cash", icon: <Payments />, tone: "green" },
  { id: "card", label: "Card", icon: <CreditCard />, tone: "blue" },
  { id: "mobile", label: "Mobile Payment", icon: <PhoneAndroid />, tone: "purple" },
  { id: "credit", label: "Credit / Customer", icon: <AccountBalanceWallet />, tone: "blue" },
  { id: "mixed", label: "Mixed Payment", icon: <SwapHoriz />, tone: "purple" },
  { id: "voucher", label: "Gift Voucher", icon: <Redeem />, tone: "orange" },
] as const;

export default function PaymentCheckout({ items, invoice, subtotal, discount, tax, total, onBack, onComplete }: Props) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "card" | "mobile">("cash");
  const [cardNetwork, setCardNetwork] = useState("Visa");
  const [cardReference, setCardReference] = useState("");
  const [cardConfirmed, setCardConfirmed] = useState(false);
  const [mobileType, setMobileType] = useState<"qr" | "transfer">("qr");
  const [mobileDisplayOpen, setMobileDisplayOpen] = useState(false);
  const [mobileConfirmed, setMobileConfirmed] = useState(false);
  const [notes, setNotes] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [warning, setWarning] = useState("");
  const received = amount.trim() === "" ? 0 : Number(amount);
  const validAmount = Number.isFinite(received) && received >= 0;
  const cardReady = cardConfirmed;
  const canComplete = items.length > 0 && (method === "mobile" ? mobileConfirmed : method === "card" ? cardReady : validAmount && received >= total);
  const change = method === "cash" && validAmount ? Math.max(0, Math.round((received - total) * 100) / 100) : 0;

  const complete = () => {
    if (!canComplete) {
      setWarning(method === "mobile" ? "Confirm that the QR or online transfer payment has been received." : method === "card" ? "Confirm that the external card terminal approved the payment." : "Enter a valid cash amount that covers the total.");
      return;
    }
    onComplete(method === "cash" ? received : total, method === "card" ? `${notes}${notes ? " | " : ""}Card ${cardNetwork}${cardReference.trim() ? `, terminal reference: ${cardReference.trim()}` : ""}` : method === "mobile" ? `${notes}${notes ? " | " : ""}${mobileType === "qr" ? "QR payment" : "Online transfer"} (manually confirmed)` : notes, printReceipt, method);
  };
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onBack(); }
      if (event.key === "F10") { event.preventDefault(); complete(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <div className="checkout-heading">
          <CreditCard className="checkout-title-icon" />
          <div><h1>Payment</h1><p>Complete the sale by selecting a payment method.</p></div>
        </div>
        <div className="checkout-header-actions">
          <span className="checkout-invoice"><ReceiptLong /> Bill No: {invoice}</span>
          <button type="button" onClick={onBack} className="checkout-back"><ArrowBack /> Back to Bill (Esc)</button>
        </div>
      </header>
      <div className="checkout-columns">
        <section className="checkout-card checkout-details">
          <h2><ShoppingCart color="success" /> Bill Details ({items.length} Items)</h2>
          <div className="checkout-items-wrap">
            <table className="checkout-items">
              <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>{items.map((item, i) => (
                <tr key={item.id}><td>{i + 1}</td><td><span className="checkout-item-name"><span>{item.emoji}</span>{item.name}</span></td><td>{item.quantity}</td><td>{money(item.price)}</td><td><strong>{money(item.quantity * item.price)}</strong></td></tr>
              ))}</tbody>
            </table>
          </div>
          <div className="checkout-totals">
            <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <div><span>Discount</span><strong>− {money(discount)}</strong></div>
            <div><span>Tax (demo VAT 15%)</span><strong>{money(tax)}</strong></div>
            <div className="checkout-total"><strong>Total Amount</strong><strong>{money(total)}</strong></div>
          </div>
        </section>
        <section className="checkout-card checkout-payment">
          <h2><LocalAtm color="success" /> Payment Method</h2>
          <div className="checkout-methods">{methods.map(option => (
            <button type="button" key={option.id} className={`checkout-method checkout-${option.tone} ${option.id === method ? "checkout-selected" : ""}`}
              disabled={option.id !== "cash" && option.id !== "card" && option.id !== "mobile"} onClick={() => { if (option.id === "cash" || option.id === "card" || option.id === "mobile") { setMethod(option.id); setWarning(""); } }} title={option.id === "card" ? "Manual card terminal confirmation" : option.id === "mobile" ? "Manual QR or online transfer confirmation" : option.id !== "cash" ? "Coming soon" : "Cash payment"}>
              {option.id === method && <CheckCircle className="checkout-method-check" />}
              {option.icon}<span>{option.label}</span>{option.id === "card" ? <small>Manual terminal</small> : option.id === "mobile" ? <small>Manual verification</small> : option.id !== "cash" && <small>Coming soon</small>}
            </button>
          ))}</div>
          {method === "cash" ? <div className="checkout-cash">
            <h3><Payments color="success" /> Cash Payment</h3>
            <label htmlFor="checkout-amount">Amount Received</label>
            <TextField id="checkout-amount" fullWidth type="number" value={amount} placeholder="0.00"
              onChange={e => { setAmount(e.target.value); setWarning(""); }}
              slotProps={{ htmlInput: { min: 0, step: "0.01", inputMode: "decimal" } }} />
            <div className="checkout-quick">{[1,2,5,10,20,50,100,500,1000,2000,5000].map(n => <button type="button" key={n} onClick={() => { setAmount(String(Math.round(((validAmount ? received : 0) + n) * 100) / 100)); setWarning(""); }}>+{n.toLocaleString()}</button>)}</div>
            <Button variant="outlined" color="success" onClick={() => { setAmount(String(total)); setWarning(""); }}startIcon={<CheckCircle />} >Exact Amount</Button>
            <Button className="checkout-reset" variant="outlined" color="error" onClick={() => { setAmount(""); setWarning(""); }}startIcon={<RestartAlt />} >Reset Amount</Button>
          </div> : method === "card" ? <div className="checkout-cash checkout-card-payment">
            <h3><CreditCard color="success" /> Card Payment</h3>
            <div className="checkout-card-due"><span>Amount to charge on terminal</span><strong>{money(total)}</strong></div>
            
            <label htmlFor="checkout-card-network">Card Type</label>
            <select id="checkout-card-network" value={cardNetwork} onChange={e => setCardNetwork(e.target.value)}>
              <option>Visa</option><option>Mastercard</option><option>Other card</option>
            </select>
            <label htmlFor="checkout-card-ref">Terminal Transaction Reference (Optional)</label>
            <TextField id="checkout-card-ref" fullWidth size="small" value={cardReference} placeholder="Enter reference if available" onChange={e => { setCardReference(e.target.value); setCardConfirmed(false); setWarning(""); }} slotProps={{ htmlInput: { maxLength: 80 } }} />
            <FormControlLabel className="checkout-card-confirm" control={<Checkbox checked={cardConfirmed} onChange={e => { setCardConfirmed(e.target.checked); setWarning(""); }} />} label="I confirm the terminal shows an approved payment for this amount." />
            
            <Button className="checkout-reset" variant="outlined" color="error" startIcon={<RestartAlt />} onClick={() => { setCardReference(""); setCardConfirmed(false); setWarning(""); }}>Reset Card Details</Button>
          </div> : <div className="checkout-cash checkout-mobile-payment">
            <h3><PhoneAndroid color="success" /> Mobile Payment</h3>
            <div className="checkout-card-due"><span>Amount to Pay</span><strong>{money(total)}</strong></div>
            <label>Payment Type</label>
            <div className="checkout-mobile-types">
              <button type="button" className={mobileType === "qr" ? "is-active" : ""} onClick={() => { setMobileType("qr"); setMobileDisplayOpen(false); setMobileConfirmed(false); setWarning(""); }}><QrCode2 />QR Payment</button>
              <button type="button" className={mobileType === "transfer" ? "is-active" : ""} onClick={() => { setMobileType("transfer"); setMobileDisplayOpen(false); setMobileConfirmed(false); setWarning(""); }}><AccountBalance />Online Transfer</button>
            </div>
            <Button className="checkout-mobile-display-button" variant="contained" color="success" startIcon={mobileType === "qr" ? <QrCode2 /> : <AccountBalance />} onClick={() => setMobileDisplayOpen(true)}>
              {mobileType === "qr" ? "Display Payment QR" : "Display Bank Details"}
            </Button>
            <FormControlLabel className="checkout-card-confirm" control={<Checkbox checked={mobileConfirmed} onChange={e => { setMobileConfirmed(e.target.checked); setWarning(""); }} />} label="I confirm this payment has been received and verified." />
            <Button className="checkout-reset" variant="outlined" color="error" startIcon={<RestartAlt />} onClick={() => { setMobileDisplayOpen(false); setMobileConfirmed(false); setWarning(""); }}>Reset Payment Details</Button>
          </div>}
        </section>
        <section className="checkout-card checkout-summary">
          <h2 className="checkout-summary-title"><CheckCircle /> Payment Summary</h2>
          <div className="checkout-summary-row"><span>Total Amount</span><strong>{money(total)}</strong></div>
          <div className="checkout-summary-row"><span>Amount Received</span><strong>{money(method === "mobile" ? (mobileConfirmed ? total : 0) : method === "card" ? (cardReady ? total : 0) : (validAmount ? received : 0))}</strong></div>
          <div className="checkout-change"><strong>{method === "mobile" ? "Payment Status" : method === "card" ? "Card Status" : "Change"}</strong><strong>{method === "mobile" ? (mobileConfirmed ? "Manually confirmed" : "Awaiting verification") : method === "card" ? (cardReady ? "Terminal confirmed" : "Awaiting confirmation") : money(change)}</strong></div>
          <div className="checkout-receipt-options">
            <div className="checkout-receipt-heading">Receipt Options</div>
            <FormControlLabel control={<Checkbox checked={printReceipt} onChange={e => setPrintReceipt(e.target.checked)} />} label={<span><Print fontSize="small" /> Print Receipt <small>(demo preference)</small></span>} />
            <FormControlLabel control={<Checkbox disabled />} label={<span><PictureAsPdf fontSize="small" /> Save Receipt as PDF <small>(coming soon)</small></span>} />
            <FormControlLabel control={<Checkbox disabled />} label={<span><Email fontSize="small" /> Email Receipt <small>(not connected)</small></span>} />
            <FormControlLabel control={<Checkbox disabled />} label={<span><Sms fontSize="small" /> Send Receipt via SMS <small>(not connected)</small></span>} />
          </div>
          <label htmlFor="checkout-notes">Notes (Optional)</label>
          <TextField id="checkout-notes" multiline minRows={2} placeholder="Add a note for this sale..." value={notes} onChange={e => setNotes(e.target.value)} />
          {warning && <Alert severity="warning">{warning}</Alert>}
          <button type="button" className="checkout-complete" disabled={!canComplete} onClick={complete}><CheckCircle /> Complete Sale (F10)</button>
          <button type="button" className="checkout-cancel" onClick={onBack}><Close /> Cancel (Esc)</button>
        </section>
      </div>
      <Dialog open={mobileDisplayOpen && method === "mobile"} onClose={() => setMobileDisplayOpen(false)} fullWidth maxWidth="xs" aria-labelledby="checkout-mobile-display-title">
        <DialogTitle id="checkout-mobile-display-title">{mobileType === "qr" ? "Customer QR Display" : "Store Bank Details"}</DialogTitle>
        <DialogContent>
          <div className="checkout-mobile-dialog-body">
            {mobileType === "qr" ? <QrCode2 className="checkout-mobile-dialog-icon" /> : <AccountBalance className="checkout-mobile-dialog-icon" />}
            <strong>{money(total)}</strong>
            <p>{mobileType === "qr" ? "Merchant payment QR is not configured yet. A scannable payment QR will appear here after integration." : "Store bank account details have not been configured yet. The beneficiary and bank information will appear here once set up."}</p>
            <span>No payment is initiated or verified by this display.</span>
          </div>
        </DialogContent>
        <DialogActions><Button onClick={() => setMobileDisplayOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </div>
  );
}
