'use client';
import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, ImagePlus, X, Flashlight, Keyboard } from 'lucide-react';
import { parseUPI, type Recipient } from '@/lib/payments';
export default function Scanner({ onScan, onClose, onManual }: { onScan: (r: Recipient) => void; onClose: () => void; onManual: () => void }) {
 const video = useRef<HTMLVideoElement>(null), stream = useRef<MediaStream | null>(null), finished = useRef(false), input = useRef<HTMLInputElement>(null);
 const [error,setError] = useState(''), [active,setActive] = useState(false), [torch,setTorch] = useState(false), [torchAvailable,setTorchAvailable] = useState(false), [retry,setRetry] = useState(0), [reading,setReading] = useState(false);
 const callback = useRef(onScan); callback.current = onScan;
 useEffect(() => {
  let disposed = false, frame = 0, last = 0, lastCode = '';
  finished.current = false; setError(''); setActive(false);
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently:true });
  const tick = (now: number) => {
   if(disposed || finished.current) return;
   if(video.current && ctx && video.current.readyState >= 2 && now-last > 160) {
    last=now; const v=video.current; canvas.width=Math.min(v.videoWidth,960); canvas.height=v.videoHeight*canvas.width/v.videoWidth;
    ctx.drawImage(v,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);const code=jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:'attemptBoth'});
    if(code && code.data!==lastCode){lastCode=code.data;try{const r=parseUPI(code.data);finished.current=true;stream.current?.getTracks().forEach(t=>t.stop());callback.current(r);return;}catch(e){setError((e as Error).message);}}
   } frame=requestAnimationFrame(tick);
  };
  async function start(){try{
   if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Camera needs HTTPS and a supported browser. You can upload a QR image instead.');
   const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280}},audio:false});
   if(disposed){s.getTracks().forEach(t=>t.stop());return;}stream.current=s;
   const cap=s.getVideoTracks()[0].getCapabilities() as MediaTrackCapabilities & {torch?:boolean};setTorchAvailable(!!cap.torch);
   if(video.current){video.current.srcObject=s;await video.current.play();if(disposed)return;setActive(true);frame=requestAnimationFrame(tick);}
  }catch(e){if(disposed)return;const err=e as DOMException;setError(err.name==='NotAllowedError'?'Camera access was denied. Allow camera access in your browser, or upload a QR image.':err.name==='NotFoundError'?'No camera found. Upload a QR image to continue.':err.message);}}
  start();return()=>{disposed=true;cancelAnimationFrame(frame);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;};
 },[retry]);
 async function upload(file?: File){if(!file)return;setError('');setReading(true);try{
  if(!file.type.startsWith('image/'))throw new Error('Choose a PNG, JPEG, or WebP QR image.');
  if(file.size>15*1024*1024)throw new Error('Choose an image smaller than 15 MB.');
  const bitmap=await createImageBitmap(file);const scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));const c=document.createElement('canvas');c.width=Math.round(bitmap.width*scale);c.height=Math.round(bitmap.height*scale);const ctx=c.getContext('2d')!;ctx.drawImage(bitmap,0,0,c.width,c.height);bitmap.close();const p=ctx.getImageData(0,0,c.width,c.height);const code=jsQR(p.data,p.width,p.height,{inversionAttempts:'attemptBoth'});
  if(!code)throw new Error('No QR code found. Try a clearer image with the entire QR visible.');const recipient=parseUPI(code.data);if(finished.current)return;finished.current=true;stream.current?.getTracks().forEach(t=>t.stop());callback.current(recipient);
 }catch(e){setError((e as Error).message);}finally{setReading(false);if(input.current)input.current.value='';}}
 async function toggleTorch(){try{const track=stream.current?.getVideoTracks()[0];await track?.applyConstraints({advanced:[{torch:!torch} as MediaTrackConstraintSet]});setTorch(!torch);}catch{setError('Flashlight is unavailable on this camera.');}}
 return <section className="scanner screen" aria-label="UPI QR scanner"><video ref={video} muted playsInline aria-label="Camera view"/><div className="scan-shade"/><header className="scan-toolbar"><button aria-label="Close scanner" onClick={onClose}><X/></button><span/>{torchAvailable&&<button aria-label="Toggle flashlight" aria-pressed={torch} onClick={toggleTorch}><Flashlight/></button>}<button aria-label="Enter UPI ID" onClick={onManual}><Keyboard/></button></header><div className="scan-center"><div className="scan-frame">{!active&&<Camera size={52}/>}<i/><i/><i/><i/></div><button className="upload" disabled={reading} onClick={()=>input.current?.click()}><ImagePlus size={18}/>{reading?'Reading QR…':'Upload from gallery'}</button><input ref={input} type="file" accept="image/*" hidden onChange={e=>upload(e.target.files?.[0])}/>{error&&<div className="scan-error" role="alert">{error}{!active&&<button onClick={()=>setRetry(x=>x+1)}>Try camera again</button>}</div>}</div><footer className="scan-footer"><span className="handle"/><h2>Scan any QR code to pay</h2><p>Works with any UPI app QR</p><small>Personal project · not affiliated with Google · no real money moves</small></footer></section>;
}
