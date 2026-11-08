import { useEffect, useState } from "react";
import { ArrowBack, CheckCircle, CreditCard, LocalAtm, Payments, PhoneAndroid, Print, ReceiptLong, Redeem, AccountBalanceWallet, Close, ShoppingCart, SwapHoriz } from "@mui/icons-material";
import { Alert, Button, Checkbox, FormControlLabel, TextField } from "@mui/material";
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
  onComplete: (received: number, notes: string, printReceipt: boolean) => void;
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
  const [notes, setNotes] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [digitalReceipt, setDigitalReceipt] = useState(false);
  const [warning, setWarning] = useState("");
  const received = amount.trim() === "" ? 0 : Number(amount);
  const validAmount = Number.isFinite(received) && received >= 0;
  const canComplete = items.length > 0 && validAmount && received >= total;
  const change = validAmount ? Math.max(0, Math.round((received - total) * 100) / 100) : 0;

  const complete = () => {
    if (!canComplete) {
      setWarning("Enter a valid cash amount that covers the total.");
      return;
    }
    onComplete(received, notes, printReceipt);
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
          <div className="checkout-methods">{methods.map(method => (
            <button type="button" key={method.id} className={`checkout-method checkout-${method.tone} ${method.id === "cash" ? "checkout-selected" : ""}`}
              disabled={method.id !== "cash"} title={method.id !== "cash" ? "Coming soon — no payment processing yet" : "Cash payment"}>
              {method.id === "cash" && <CheckCircle className="checkout-method-check" />}
              {method.icon}<span>{method.label}</span>{method.id !== "cash" && <small>Coming soon</small>}
            </button>
          ))}</div>
          <div className="checkout-cash">
            <h3><Payments color="success" /> Cash Payment</h3>
            <label htmlFor="checkout-amount">Amount Received</label>
            <TextField id="checkout-amount" fullWidth type="number" value={amount} placeholder="0.00"
              onChange={e => { setAmount(e.target.value); setWarning(""); }}
              slotProps={{ htmlInput: { min: 0, step: "0.01", inputMode: "decimal" } }} />
            <div className="checkout-quick">{[100,500,1000,5000].map(n => <button type="button" key={n} onClick={() => { setAmount(String(Math.round((received + n) * 100) / 100)); setWarning(""); }}>+{n.toLocaleString()}</button>)}</div>
            <Button variant="outlined" color="success" onClick={() => { setAmount(String(total)); setWarning(""); }}>Exact Amount</Button>
          </div>
        </section>
        <section className="checkout-card checkout-summary">
          <h2 className="checkout-summary-title"><CheckCircle /> Payment Summary</h2>
          <div className="checkout-summary-row"><span>Total Amount</span><strong>{money(total)}</strong></div>
          <div className="checkout-summary-row"><span>Amount Received</span><strong>{money(validAmount ? received : 0)}</strong></div>
          <div className="checkout-change"><strong>Change</strong><strong>{money(change)}</strong></div>
          <div className="checkout-receipt-options">
            <FormControlLabel control={<Checkbox checked={printReceipt} onChange={e => setPrintReceipt(e.target.checked)} />} label={<span><Print fontSize="small" /> Print Receipt (demo preference)</span>} />
            <FormControlLabel control={<Checkbox checked={digitalReceipt} onChange={e => setDigitalReceipt(e.target.checked)} />} label={<span><ReceiptLong fontSize="small" /> Digital Receipt (not connected)</span>} />
          </div>
          {digitalReceipt && <Alert severity="info">SMS/email delivery is not connected. No digital receipt will be sent.</Alert>}
          <label htmlFor="checkout-notes">Notes (Optional)</label>
          <TextField id="checkout-notes" multiline minRows={2} placeholder="Add a note for this sale..." value={notes} onChange={e => setNotes(e.target.value)} />
          {warning && <Alert severity="warning">{warning}</Alert>}
          <button type="button" className="checkout-complete" disabled={!canComplete} onClick={complete}><CheckCircle /> Complete Demo Sale (F10)</button>
          <button type="button" className="checkout-cancel" onClick={onBack}><Close /> Cancel (Esc)</button>
        </section>
      </div>
    </div>
  );
}
