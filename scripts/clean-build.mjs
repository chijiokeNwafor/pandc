import {readdir,rm} from 'node:fs/promises';
// Cloudflare's local preview sidecars must never enter the hosted archive.
for(const file of await readdir('dist/server')){
 if(file==='.dev.vars'||file.startsWith('.dev.vars.')||file==='.env'||file.startsWith('.env.'))await rm(`dist/server/${file}`);
}
