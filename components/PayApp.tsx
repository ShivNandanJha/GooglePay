'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Camera, Check, CheckCircle2, ChevronDown, ChevronRight, CircleDollarSign, CreditCard,
  Download, Gauge, Gift, Globe, HandCoins, HeartHandshake, HelpCircle, History, Home, Landmark, Lightbulb, MoreVertical,
  Moon, Pencil, QrCode, Radio, RefreshCw, Rocket, ScanLine, Search, Send, Settings, Share2, ShieldCheck, Smartphone, Sun,
  Trophy, Tv, UserCircle2, Users, Wallet, X, Zap, BellRing,
} from 'lucide-react';
import { Swap } from './stageshow/motion/Swap';
import { createTransaction, DISCLAIMER, parseAmount, parseUPI, readTransactions, receiptText, type Recipient, type Transaction } from '@/lib/payments';
import { defaultProfile, imageToAvatar, readProfile, saveProfile, type Profile } from '@/lib/profile';

const Scanner = dynamic(() => import('./Scanner'), { ssr: false });

type View = 'home' | 'money' | 'you' | 'scan' | 'search' | 'pay' | 'success' | 'history' | 'receipt';
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const people = ['Anil', 'Archana', 'Abhinandan', 'Rimi', 'Rajib', 'Milan Das', 'Shubham K'];
const banks = ['Sample Bank ••••1024', 'City Bank ••••2048'];
const palette = ['#7b1fa2', '#8d6e63', '#f4511e', '#0b8043', '#3949ab', '#c2185b', '#5e35b1'];

function colorFor(name: string) { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0; return palette[h % palette.length]; }
const upiFor = (name: string) => `${name.toLowerCase().replace(/[^a-z]/g, '')}@okaxis`;
const money = (v: string | number) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Avatar({ name, photo, size = 56 }: { name: string; photo?: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.45, background: photo ? '#e8eaed' : colorFor(name) }}>
      {photo ? <img src={photo} alt="" /> : name.trim()[0]?.toUpperCase()}
    </span>
  );
}

function Footer() {
  return <footer className="disclaimer">{DISCLAIMER}</footer>;
}

export default function PayApp() {
  const [view, setView] = useState<View>('home');
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bank, setBank] = useState(banks[0]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [toast, setToast] = useState('');
  const [info, setInfo] = useState<{ title: string; body: string } | null>(null);
  const [dark, setDark] = useState(false);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile>(defaultProfile);
  const [detailsOpen, setDetailsOpen] = useState(true);

  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const main = useRef<HTMLElement>(null);
  const infoDialog = useRef<HTMLDialogElement>(null);
  const bankDialog = useRef<HTMLDialogElement>(null);
  const editDialog = useRef<HTMLDialogElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(readTransactions());
    setProfile(readProfile());
    try { setDark(localStorage.getItem('pay-theme') === 'dark'); } catch {}
    const listener = (e: Event) => { e.preventDefault(); setInstall(e as InstallPrompt); };
    window.addEventListener('beforeinstallprompt', listener);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => { window.removeEventListener('beforeinstallprompt', listener); if (timer.current) clearTimeout(timer.current); };
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (info) infoDialog.current?.showModal(); else infoDialog.current?.close(); }, [info]);
  useEffect(() => { if (sheet) bankDialog.current?.showModal(); else bankDialog.current?.close(); }, [sheet]);
  useEffect(() => { if (editing) editDialog.current?.showModal(); else editDialog.current?.close(); }, [editing]);
  useEffect(() => { main.current?.scrollTo(0, 0); setError(''); }, [view]);

  function go(v: View) { if (busy) return; setView(v); setSheet(false); }
  function receive(r: Recipient) { setRecipient(r); setAmount(r.amount || ''); setNote(r.note || ''); setView('pay'); }
  function submitRecipient(e: React.FormEvent) { e.preventDefault(); try { receive(parseUPI(query)); } catch (err) { setError((err as Error).message); } }
  function review(e: React.FormEvent) { e.preventDefault(); try { parseAmount(amount); setError(''); setSheet(true); } catch (err) { setError((err as Error).message); } }
  function service(title: string) { setInfo({ title, body: `${title} isn't available in this project yet. You can scan a UPI QR or use Pay anyone to try the payment flow.` }); }

  function pay() {
    if (lock.current || !recipient) return;
    lock.current = true; setBusy(true);
    const r = { ...recipient, note };
    timer.current = setTimeout(() => {
      const t = createTransaction(r, amount, bank);
      const next = [t, ...readTransactions()].slice(0, 100);
      setHistory(next);
      try { localStorage.setItem('pay-demo-history', JSON.stringify(next)); } catch { setToast('History could not be saved on this device.'); }
      setTransaction(t); setSheet(false); setBusy(false); lock.current = false; setDetailsOpen(true); setView('success');
    }, 1200);
  }

  async function share() {
    if (!transaction) return;
    const text = receiptText(transaction);
    try {
      if (navigator.share) await navigator.share({ title: 'Transaction details', text });
      else { await navigator.clipboard.writeText(text); setToast('Details copied'); }
    } catch (e) { if ((e as Error).name !== 'AbortError') setToast('Sharing unavailable'); }
  }

  function openEditor() { setDraft(profile); setError(''); setEditing(true); }
  async function pickPhoto(file?: File) {
    if (!file) return;
    try { const photo = await imageToAvatar(file); setDraft(d => ({ ...d, photo })); } catch (e) { setError((e as Error).message); }
  }
  function saveDraft(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.name.trim().replace(/\s+/g, ' ');
    if (name.length < 2) { setError('Enter a name with at least 2 characters.'); return; }
    const next = { ...draft, name };
    setProfile(next); setEditing(false);
    setToast(saveProfile(next) ? 'Profile updated' : 'Updated, but could not be saved on this device');
  }

  function toggleTheme() { const d = !dark; setDark(d); try { localStorage.setItem('pay-theme', d ? 'dark' : 'light'); } catch {} }
  async function installApp() {
    if (install) { await install.prompt(); await install.userChoice; setInstall(null); }
    else setInfo({ title: 'Install app', body: 'Use your browser’s “Install app” option. On iPhone, open in Safari, tap Share, then “Add to Home Screen”.' });
  }

  const row = (title: string, icon: ReactNode, action: () => void, sub?: string, trailing?: ReactNode) => (
    <button className="list-row" onClick={action}>
      <span className="row-icon">{icon}</span>
      <span className="row-text">{title}{sub && <small>{sub}</small>}</span>
      {trailing}
    </button>
  );
  const tile = (label: string, icon: ReactNode, action: () => void, badge?: ReactNode, cls = 'circle') => (
    <button className="tile" key={label} onClick={action}>
      {badge}
      <span className={`tile-icon ${cls}`}>{icon}</span>
      <span className="tile-label">{label}</span>
    </button>
  );
  const isTab = view === 'home' || view === 'money' || view === 'you';
  const date = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div className={`app-root ${dark ? 'dark' : ''}`}>
      <aside className="desktop-note">
        <span className="eyebrow">UPI PAYMENTS · PWA</span>
        <h1>Pay anyone.<br />Scan any QR.</h1>
        <p>A mobile-first payments interface. Scan a UPI QR with your camera or upload one from your gallery.</p>
        <div className="desktop-features"><span><ScanLine /> Camera & image QR scanning</span><span><UserCircle2 /> Editable profile</span><span><Download /> Installable PWA</span></div>
        <small>{DISCLAIMER}</small>
      </aside>

      <div className="app-shell">
        <main ref={main} className="app-main">
          {view === 'home' && (
            <div className="screen home">
              <header className="home-top">
                <div className="home-sky" aria-hidden><i className="b1" /><i className="b2" /><i className="b3" /><i className="b4" /><i className="sun" /></div>
                <div className="home-bar">
                  <button className="search-pill" onClick={() => go('search')}><Search size={22} /><span>Pay anyone on UPI</span></button>
                  <button className="me" aria-label="Your profile" onClick={() => go('you')}><Avatar name={profile.name} photo={profile.photo} size={40} /></button>
                </div>
              </header>
              <div className="quick">
                {tile('Scan any QR code', <QrCode />, () => go('scan'), undefined, 'square')}
                {tile('Pay anyone', <Send />, () => go('search'), undefined, 'square')}
                {tile('Bank transfer', <Landmark />, () => service('Bank transfer'), undefined, 'square')}
                {tile('Mobile recharge', <Smartphone />, () => service('Mobile recharge'), undefined, 'square')}
              </div>
              <div className="chips">
                <button onClick={() => go('money')}><span><Landmark size={20} /></span><b>Bank balance<small>Check</small></b></button>
                <button onClick={() => go('history')}><span><History size={20} /></span><b>Transactions<small>See all</small></b></button>
                <button onClick={() => service('UPI Lite')}><span><Rocket size={20} /></span><b>UPI Lite<small className="link">Activate</small></b></button>
              </div>

              <section className="section">
                <h2>Send money</h2>
                <div className="grid">
                  {people.map(n => (
                    <button className="tile" key={n} onClick={() => receive({ name: n, upi: upiFor(n) })}>
                      <Avatar name={n} /><span className="tile-label">{n}</span>
                    </button>
                  ))}
                  <button className="tile" onClick={() => go('search')}><span className="avatar outline"><ChevronDown /></span><span className="tile-label">More</span></button>
                </div>
              </section>

              <section className="section">
                <div className="section-title"><h2>Bills & recharges</h2><button onClick={() => service('Bills & recharges')}>Manage <ChevronRight size={18} /></button></div>
                <div className="grid">
                  {tile('Life insurance', <ShieldCheck />, () => service('Insurance'), <em className="badge red">Overdue</em>)}
                  {tile('Prepaid', <Radio />, () => service('Prepaid'), <em className="badge amber">Expiring</em>)}
                  {tile('Postpaid', <Smartphone />, () => service('Postpaid'))}
                  {tile('Broadband', <Globe />, () => service('Broadband'))}
                  {tile('Mobile recharge', <Smartphone />, () => service('Mobile recharge'))}
                  {tile('DTH / Cable TV', <Tv />, () => service('DTH / Cable TV'))}
                  {tile('Electricity', <Lightbulb />, () => service('Electricity'))}
                  {tile('FASTag recharge', <Zap />, () => service('FASTag recharge'))}
                </div>
              </section>

              <section className="section">
                <h2>Credit cards & loans</h2>
                <div className="grid">
                  {tile('CIBIL score', <Gauge />, () => service('Credit score'))}
                  {tile('Personal loan', <HandCoins />, () => service('Personal loan'))}
                  {tile('Flex credit card', <CreditCard />, () => service('Credit card'))}
                  {tile('Gold loan', <CircleDollarSign />, () => service('Gold loan'))}
                </div>
              </section>

              <section className="section">
                <h2>Offers & rewards</h2>
                <div className="grid">
                  {tile('Rewards', <Trophy />, () => service('Rewards'), undefined, 'circle warm1')}
                  {tile('Offers', <Gift />, () => service('Offers'), undefined, 'circle warm2')}
                  {tile('Referrals', <Users />, () => service('Referrals'), undefined, 'circle warm3')}
                  {tile('Pocket money', <HeartHandshake />, () => service('Pocket money'), undefined, 'circle warm4')}
                </div>
              </section>

              <section className="promo">
                <div><h3>Tap & Pay with your card</h3><p>Add a card and pay contactlessly at stores.</p><button className="link-btn" onClick={() => service('Tap & Pay')}>Tap & Pay now <ChevronRight size={16} /></button></div>
                <span className="promo-art" aria-hidden><Smartphone size={56} /></span>
              </section>
              <Footer />
            </div>
          )}

          {view === 'money' && (
            <div className="screen">
              <header className="money-top"><div className="money-art" aria-hidden><i /><i /><i /><i /></div><button className="icon-btn corner" aria-label="More" onClick={() => go('history')}><MoreVertical /></button><h1>Money</h1></header>
              <section className="section tight">
                {banks.map(b => (
                  <button className="bank-row" key={b} onClick={() => setInfo({ title: 'Bank balance', body: 'Balance check needs a bank connection, which this project does not have.' })}>
                    <span className="bank-icon"><Landmark size={20} /></span>
                    <span className="row-text">{b}<small>Savings account</small></span>
                    <b className="link">Check balance</b>
                  </button>
                ))}
                <button className="bank-row" onClick={() => service('Credit score')}>
                  <span className="bank-icon"><Gauge size={20} /></span>
                  <span className="row-text">Credit score<small>Tap for full report</small></span>
                  <b>—</b>
                </button>
              </section>
              <section className="section">
                <h2>Credit for you</h2>
                <div className="cards2">
                  <button onClick={() => service('Credit card')}><span className="card-ic"><CreditCard /></span><b>Credit card</b><span>Apply in a few steps</span><em>Check now</em></button>
                  <button onClick={() => service('Personal loan')}><span className="card-ic"><HandCoins /></span><b>Personal loan</b><span>Quick approval</span><em>Check details</em></button>
                </div>
              </section>
              <section className="section">
                <div className="section-title"><h2>Recent transactions</h2>{history.length > 0 && <button onClick={() => go('history')}>See all <ChevronRight size={18} /></button>}</div>
                {history.length === 0 ? <p className="muted">No transactions yet.</p> : history.slice(0, 4).map(t => (
                  <button className="txn-row" key={t.id} onClick={() => { setTransaction(t); setDetailsOpen(true); go('receipt'); }}>
                    <Avatar name={t.name} size={40} /><span className="row-text">{t.name}<small>{date(t.createdAt)}</small></span><b>₹{money(t.amount)}</b>
                  </button>
                ))}
              </section>
              <Footer />
            </div>
          )}

          {view === 'history' && (
            <div className="screen">
              <header className="toolbar"><button className="icon-btn" aria-label="Back" onClick={() => go('home')}><ArrowLeft /></button><h1>Transactions</h1></header>
              <section className="section tight">
                {history.length === 0 ? (
                  <div className="empty"><History size={36} /><h3>No transactions yet</h3><p>Payments you make will appear here.</p><button className="primary" onClick={() => go('scan')}><ScanLine size={18} /> Scan a QR</button></div>
                ) : history.map(t => (
                  <button className="txn-row" key={t.id} onClick={() => { setTransaction(t); setDetailsOpen(true); go('receipt'); }}>
                    <Avatar name={t.name} size={40} /><span className="row-text">{t.name}<small>{date(t.createdAt)}</small></span><b>₹{money(t.amount)}</b>
                  </button>
                ))}
              </section>
              <Footer />
            </div>
          )}

          {view === 'you' && (
            <div className="screen">
              <header className="you-top">
                <div className="you-art" aria-hidden><i className="c1" /><i className="c2" /><i className="hill" /></div>
                <button className="icon-btn corner" aria-label="Edit profile" onClick={openEditor}><MoreVertical /></button>
                <h1>{profile.name}</h1>
                <div className="you-meta">
                  <p>UPI ID: {profile.upi}</p>
                  <p>{profile.phone} <span className="upi-num"><BadgeCheck size={16} /> UPI number</span></p>
                </div>
                <button className="you-photo" aria-label="Change profile picture" onClick={openEditor}>
                  <Avatar name={profile.name} photo={profile.photo} size={92} />
                  <span className="you-edit"><Pencil size={16} /></span>
                </button>
              </header>
              <section className="section tight">
                <div className="pills">
                  <button className="gold" onClick={() => service('Rewards')}><Trophy size={20} /><b>₹0<small>Rewards earned</small></b></button>
                  <button className="aqua" onClick={() => service('Referrals')}><Users size={20} /><b>Refer<small>Invite a friend</small></b></button>
                </div>
                <div className="methods">
                  <button className="methods-title" onClick={() => service('Payment methods')}><h3>Set up payment methods 1/3</h3><ChevronRight size={20} /></button>
                  <div>
                    <button onClick={() => service('Bank account')}><span className="m-ic"><Landmark /></span>Bank account<small>{banks.length} accounts</small></button>
                    <button onClick={() => service('RuPay credit card')}><span className="m-ic dash"><CreditCard /><i>+</i></span>RuPay credit card<small>Pay with UPI</small></button>
                    <button onClick={() => service('UPI Lite')}><span className="m-ic dash"><Rocket /><i>+</i></span>UPI Lite<small>Pay PIN-free</small></button>
                  </div>
                </div>
                {row('Edit profile', <Pencil />, openEditor, 'Change your name and photo')}
                {row('Pay with credit or debit cards', <CreditCard />, () => service('Cards'), 'Pay bills with your card', <span className="link">Add</span>)}
                {row('Your QR code', <QrCode />, () => setInfo({ title: 'Your QR code', body: `Others can pay you at ${profile.upi}.` }), 'Use to receive money from any UPI app')}
                {row('Autopay', <RefreshCw />, () => service('Autopay'), 'No pending requests')}
                {row('Transaction history', <History />, () => go('history'))}
                {row(dark ? 'Light theme' : 'Dark theme', dark ? <Sun /> : <Moon />, toggleTheme)}
                {row('Install app', <Download />, installApp)}
                {row('Settings', <Settings />, () => setInfo({ title: 'Settings', body: 'Your profile and transaction history are stored only in this browser.' }))}
                {row('Get help', <HelpCircle />, () => setInfo({ title: 'Get help', body: 'Scan a UPI QR or upload an image of one, check the recipient, enter an amount and pay.' }))}
              </section>
              <Footer />
            </div>
          )}

          {view === 'scan' && <Scanner onScan={receive} onClose={() => go('home')} onManual={() => go('search')} />}

          {view === 'search' && (
            <div className="screen">
              <header className="toolbar"><button className="icon-btn" aria-label="Back" onClick={() => go('home')}><ArrowLeft /></button><h1>Pay anyone</h1></header>
              <form className="recipient-form" onSubmit={submitRecipient}>
                <div className="input-shell"><Search size={20} /><input id="upi" autoFocus autoComplete="off" spellCheck={false} placeholder="Enter UPI ID or paste payment link" value={query} onChange={e => { setQuery(e.target.value); setError(''); }} /></div>
                {error && <p className="error" role="alert">{error}</p>}
                <button className="primary" type="submit">Continue <ArrowRight size={18} /></button>
                <button type="button" className="outline" onClick={() => go('scan')}><ScanLine size={18} /> Scan QR instead</button>
              </form>
              <section className="section">
                <h2>People</h2>
                {people.map(n => (
                  <button className="txn-row" key={n} onClick={() => receive({ name: n, upi: upiFor(n) })}><Avatar name={n} size={40} /><span className="row-text">{n}<small>{upiFor(n)}</small></span><ChevronRight size={18} /></button>
                ))}
              </section>
              <Footer />
            </div>
          )}

          {view === 'pay' && recipient && (
            <div className="screen payment">
              <header className="toolbar"><button className="icon-btn" aria-label="Cancel" onClick={() => go('home')}><X /></button><span className="grow" /><button className="icon-btn" aria-label="More"><MoreVertical /></button></header>
              <form className="payment-form" onSubmit={review}>
                <Avatar name={recipient.name} size={64} />
                <p className="pay-to">Paying {recipient.name}</p>
                <span className="pay-id">{recipient.upi}</span>
                <label className="amount-input"><span>₹</span><input aria-label="Amount in rupees" inputMode="decimal" placeholder="0" maxLength={10} value={amount} onChange={e => { setAmount(e.target.value); setError(''); }} /></label>
                <input className="note-input" aria-label="Add a note" placeholder="Add a note" maxLength={140} value={note} onChange={e => setNote(e.target.value)} />
                {error && <p className="error" role="alert">{error}</p>}
                <div className="pay-bottom"><button className="primary wide" type="submit">Proceed <ArrowRight size={18} /></button><Footer /></div>
              </form>
            </div>
          )}

          {(view === 'success' || view === 'receipt') && transaction && (
            <div className="screen receipt">
              <header className="toolbar"><button className="icon-btn" aria-label="Back" onClick={() => go('home')}><ArrowLeft /></button><span className="grow" /><button className="icon-btn" aria-label="Share" onClick={share}><Share2 /></button></header>
              <div className="receipt-head">
                <Avatar name={transaction.name} size={72} />
                <p className="r-to">To {transaction.name.toUpperCase()}</p>
                <h1 className="r-amt"><span>₹</span>{money(transaction.amount)}</h1>
                <span className="r-chip">UPI</span>
                <p className="r-status"><CheckCircle2 size={20} /> Completed</p>
                <p className="r-note">Personal project · no money transferred</p>
                <hr />
                <p className="r-date">{date(transaction.createdAt)}</p>
              </div>
              <div className="r-card">
                <button className="r-bank" onClick={() => setDetailsOpen(o => !o)} aria-expanded={detailsOpen}>
                  <span className="bank-icon"><Landmark size={20} /></span><span className="grow">{transaction.bank.replace('••••', '')}</span>
                  <ChevronDown className={detailsOpen ? 'flip' : ''} />
                </button>
                {detailsOpen && <>
                  <div className="r-alert"><BellRing size={22} /><div><b>Payment of ₹{money(transaction.amount)} completed</b><p>Not a real transfer. This record is from a personal project and is not proof of payment.</p></div></div>
                  <dl>
                    <dt>Transaction ID</dt><dd>{transaction.id}</dd>
                    <dt>To: {transaction.name}</dt><dd>{transaction.upi}</dd>
                    <dt>From: {profile.name}</dt><dd>{profile.upi}</dd>
                    {transaction.note && <><dt>Note</dt><dd>{transaction.note}</dd></>}
                    <dt>Reference</dt><dd>{transaction.reference}</dd>
                  </dl>
                </>}
              </div>
              <div className="r-actions"><button className="outline" onClick={share}><Share2 size={16} /> Share</button><button className="primary" onClick={() => go('home')}>Done</button></div>
              <Footer />
            </div>
          )}
        </main>

        {view === 'home' && <button className="fab" onClick={() => go('scan')}><ScanLine size={22} /> Scan QR</button>}
        {isTab && (
          <nav className="bottom-nav" aria-label="Main navigation">
            {([['home', 'Home', <Home key="h" />], ['money', 'Money', <Wallet key="m" />], ['you', 'You', <Avatar key="y" name={profile.name} photo={profile.photo} size={26} />]] as const).map(([id, label, icon]) => (
              <button key={id} aria-current={view === id ? 'page' : undefined} onClick={() => go(id)}><span>{icon}</span>{label}</button>
            ))}
          </nav>
        )}
      </div>

      <dialog className={`sheet ${dark ? 'dark' : ''}`} ref={bankDialog} onCancel={e => { if (busy) e.preventDefault(); else setSheet(false); }}>
        <span className="handle" />
        <header><h2>Choose account to pay with</h2><button className="icon-btn" aria-label="Close" disabled={busy} onClick={() => setSheet(false)}><X /></button></header>
        <p className="muted">₹{money(amount || 0)} to {recipient?.name}</p>
        <div className="bank-options">
          {banks.map(b => <label key={b}><span className="bank-icon"><Landmark size={20} /></span><span className="grow">{b}<small>Savings account</small></span><input type="radio" name="bank" checked={bank === b} disabled={busy} onChange={() => setBank(b)} /></label>)}
        </div>
        <button className="primary wide" disabled={busy} onClick={pay}><Swap id={busy ? 'busy' : 'ready'} duration={240}>{busy ? 'Processing…' : `Pay ₹${money(amount || 0)}`}</Swap>{busy && <span className="spinner" />}</button>
        <Footer />
      </dialog>

      <dialog className={`sheet ${dark ? 'dark' : ''}`} ref={editDialog} onCancel={() => setEditing(false)}>
        <span className="handle" />
        <form onSubmit={saveDraft}>
          <header><h2>Edit profile</h2><button type="button" className="icon-btn" aria-label="Close" onClick={() => setEditing(false)}><X /></button></header>
          <div className="edit-photo">
            <button type="button" className="you-photo" aria-label="Choose a photo" onClick={() => photoInput.current?.click()}>
              <Avatar name={draft.name || 'A'} photo={draft.photo} size={104} /><span className="you-edit"><Camera size={18} /></span>
            </button>
            <div className="edit-photo-actions">
              <button type="button" className="link-btn" onClick={() => photoInput.current?.click()}>Change photo</button>
              {draft.photo && <button type="button" className="link-btn danger" onClick={() => setDraft(d => ({ ...d, photo: undefined }))}>Remove</button>}
            </div>
            <input ref={photoInput} type="file" accept="image/*" hidden onChange={e => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          <label className="field"><span>Name</span><input value={draft.name} maxLength={40} onChange={e => { setDraft(d => ({ ...d, name: e.target.value })); setError(''); }} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary wide" type="submit">Save</button>
        </form>
      </dialog>

      <dialog ref={infoDialog} className={`info ${dark ? 'dark' : ''}`} onCancel={() => setInfo(null)}>
        <h2>{info?.title}</h2><p>{info?.body}</p><button className="link-btn right" onClick={() => setInfo(null)}>OK</button>
      </dialog>
      {toast && <div className="toast" role="status"><Check size={18} />{toast}</div>}
    </div>
  );
}
