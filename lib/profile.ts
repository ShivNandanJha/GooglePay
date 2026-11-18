export type Profile = { name: string; upi: string; phone: string; photo?: string };

const KEY = 'pay-profile';
export const defaultProfile: Profile = { name: 'Alex Mercer', upi: 'alexmercer@okicici', phone: '98765 43210' };

export function readProfile(): Profile {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (data && typeof data.name === 'string' && data.name.trim()) {
      return {
        name: data.name.slice(0, 40),
        upi: typeof data.upi === 'string' ? data.upi : defaultProfile.upi,
        phone: typeof data.phone === 'string' ? data.phone : defaultProfile.phone,
        photo: typeof data.photo === 'string' && data.photo.startsWith('data:image/') ? data.photo : undefined,
      };
    }
  } catch {}
  return defaultProfile;
}

export function saveProfile(p: Profile): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(p)); return true; } catch { return false; }
}

/** Downscale a picked image to a small square JPEG data URL so it fits in localStorage. */
export function imageToAvatar(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return reject(new Error('Could not process image.')); }
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}
