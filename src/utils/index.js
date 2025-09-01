export const isDev = () => import.meta.env?.DEV === true; export const sleep=(ms)=>new Promise(r=>setTimeout(r,ms)); export const cn=(...p)=>p.flat(Infinity).filter(Boolean).join(' '); 
// Build a client-side page URL. Works with HashRouter and BrowserRouter.
export function createPageUrl(path = '', opts = {}) {
  const cleanInput = String(path || '');
  const clean = cleanInput.replace(/^#?\/+/, ''); // remove optional leading '#' and all leading slashes
  const query = opts && opts.query && typeof opts.query === 'object' ? ('?' + new URLSearchParams(opts.query).toString()) : '';
  return '/' + clean + query;
}

export default {isDev,sleep,cn, createPageUrl};