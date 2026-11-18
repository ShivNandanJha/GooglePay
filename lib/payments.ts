export type Recipient = { upi: string; name: string; amount?: string; note?: string; merchantCode?: string };
export type Transaction = Recipient & { id: string; reference: string; amount: string; createdAt: string; status: 'simulated'; bank: string };
export function parseAmount(input: string): string {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(input) || Number(input) <= 0 || Number(input) > 100000) throw new Error('Enter an amount between ₹0.01 and ₹1,00,000, with up to 2 decimal places.');
  return Number(input).toFixed(2);
}
export function parseUPI(input: string): Recipient {
  const text = input.trim();
  let upi = text, name = '', amount: string | undefined, note: string | undefined, merchantCode: string | undefined;
  if (/^upi:/i.test(text)) {
    let uri: URL;
    try { uri = new URL(text); } catch { throw new Error('This is not a valid UPI payment QR code.'); }
    if (uri.protocol.toLowerCase() !== 'upi:' || uri.hostname.toLowerCase() !== 'pay' || (uri.pathname && uri.pathname !== '/')) throw new Error('Only UPI payment QR codes are supported.');
    for (const key of ['pa','pn','am','cu','tn','mc']) if (uri.searchParams.getAll(key).length > 1) throw new Error('This QR has duplicate payment details. Please use another QR.');
    upi = uri.searchParams.get('pa') || '';
    name = uri.searchParams.get('pn')?.trim().slice(0,100) || '';
    if (uri.searchParams.has('cu') && uri.searchParams.get('cu')?.toUpperCase() !== 'INR') throw new Error('Only INR payments are supported.');
    if (uri.searchParams.has('am')) amount = parseAmount(uri.searchParams.get('am') || '');
    note = uri.searchParams.get('tn')?.slice(0,140);
    merchantCode = uri.searchParams.get('mc') || undefined;
  }
  if (!/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9.-]{2,64}$/.test(upi)) throw new Error('Enter a valid UPI ID, or scan a QR containing a upi://pay link.');
  return { upi, name: name || upi.split('@')[0], amount, note, merchantCode };
}
export function createTransaction(recipient: Recipient, amount: string, bank: string): Transaction {
  return { ...recipient, amount: parseAmount(amount), id: `DEMO-TXN-${crypto.randomUUID()}`, reference: `DEMO-REF-${crypto.randomUUID().slice(0,18).toUpperCase()}`, createdAt: new Date().toISOString(), status: 'simulated', bank };
}
export function receiptText(t: Transaction) { return `DEMO PAYMENT — NO MONEY TRANSFERRED\n₹${t.amount} to ${t.name}\nUPI ID: ${t.upi}\nDate: ${new Date(t.createdAt).toLocaleString('en-IN')}\nDemo reference: ${t.reference}\nDemo transaction ID: ${t.id}\nThis is a simulation, not proof of payment.`; }
export function readTransactions(): Transaction[] {
  try { const data: unknown = JSON.parse(localStorage.getItem('pay-demo-history') || '[]'); return Array.isArray(data) ? data.filter((t): t is Transaction => t && t.status === 'simulated' && typeof t.id === 'string' && typeof t.upi === 'string' && typeof t.name === 'string' && typeof t.amount === 'string' && Number(t.amount) > 0 && typeof t.createdAt === 'string' && !isNaN(Date.parse(t.createdAt)) && typeof t.reference === 'string' && typeof t.bank === 'string').slice(0,100) : []; } catch { return []; }
}
