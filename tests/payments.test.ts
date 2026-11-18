import { test } from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { createTransaction, parseAmount, parseUPI, receiptText } from '../lib/payments';
test('UPI QR decodes actual encoded recipient, amount and note',()=>{
 const raw='upi://pay?pa=merchant.123%40okicici&pn=Corner%20Coffee&am=125.50&cu=INR&tn=Two%20coffees';
 const qr=QRCode.create(raw,{errorCorrectionLevel:'M'});const scale=8,pad=4,w=(qr.modules.size+pad*2)*scale;const pixels=new Uint8ClampedArray(w*w*4).fill(255);
 for(let y=0;y<qr.modules.size;y++)for(let x=0;x<qr.modules.size;x++)if(qr.modules.get(y,x))for(let yy=0;yy<scale;yy++)for(let xx=0;xx<scale;xx++){const i=(((y+pad)*scale+yy)*w+(x+pad)*scale+xx)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;}
 const decoded=jsQR(pixels,w,w);assert.ok(decoded);assert.deepEqual(parseUPI(decoded.data),{upi:'merchant.123@okicici',name:'Corner Coffee',amount:'125.50',note:'Two coffees',merchantCode:undefined});
});
test('rejects nonpayment QR, malformed and ambiguous data',()=>{for(const input of ['https://example.com','upi://collect?pa=x@y','upi://pay?pa=abc@bank&pa=def@bank','upi://pay?pa=abc@bank&cu=USD','upi://pay?pa=abc@bank&am=-1','bad id@bank'])assert.throws(()=>parseUPI(input));});
test('UPI without encoded name falls back to address local part',()=>{assert.equal(parseUPI('test.user@bank').name,'test.user');});
test('amount validation rejects invalid values',()=>{for(const amount of ['0','-5','Infinity','1e4','100001','12.345','abc',''])assert.throws(()=>parseAmount(amount));assert.equal(parseAmount('0.01'),'0.01');assert.equal(parseAmount('100000'),'100000.00');});
test('each simulated receipt has unique IDs and explicit labels',()=>{const r=parseUPI('person@bank');const a=createTransaction(r,'20','Demo bank'),b=createTransaction(r,'20','Demo bank');assert.notEqual(a.id,b.id);assert.notEqual(a.reference,b.reference);assert.equal(a.status,'simulated');assert.match(receiptText(a),/NO MONEY TRANSFERRED/);assert.match(a.id,/^DEMO-TXN-/);});
