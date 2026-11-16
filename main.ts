import {mkdirSync,readFileSync,writeFileSync,cpSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildBoard} from './model.mjs';
import {buildDossier} from './vendor/makefun-board.ts';

const here=dirname(fileURLToPath(import.meta.url));
const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
let input=option('--input','/input/snapshot.json');
if(!input.endsWith('.json')) input=join(input,'snapshot.json');
const out=option('--output',process.env.MAKEFUN_OUTPUT_DIR||'/output');
const snapshot=JSON.parse(readFileSync(input,'utf8'));
const rows=buildBoard(snapshot);
mkdirSync(out,{recursive:true});
writeFileSync(join(out,'board.json'),JSON.stringify({rows})+'\n');
writeFileSync(join(out,'data.js'),'window.LAUNCH_ATLAS='+JSON.stringify({as_of:snapshot.as_of,source:snapshot.source,rows})+';\n');
cpSync(join(here,'dashboard'),join(out,'dashboard'),{recursive:true});
if(existsSync(join(here,'screenshots'))) cpSync(join(here,'screenshots'),join(out,'screenshots'),{recursive:true});
if(!process.argv.includes('--preview')) {
  writeFileSync(join(out,'dossier.json'),buildDossier(out,{text_max_bytes:65536,screenshots:{max:4,max_bytes:524288},dashboard:{max_files:400,max_bytes:4194304}}));
}
console.log('Launch Atlas: '+rows.length+' protocols, '+rows.filter(r=>r.watchlist).length+' watchlist rows; snapshot '+snapshot.as_of);
