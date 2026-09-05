const fs = require("fs");
const path = "index.html";
let t = fs.readFileSync(path, "utf8");
if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);

t = t.replace(/#([0-9A-Fa-f]{5})-/g, "#$1a");

const colors = "d4b45a|7a9a6a|8a6a5a|c45c3a|3d4a3a|0e0c0a|1c2a1a|c9a24a|e0b8a8";
// include ] as a delimiter that used to follow the closing quote
const re = new RegExp("#(?:" + colors + ")(?!\")([,)\\s>.\\]])", "g");
t = t.replace(re, (m, delim) => m.slice(0, -1) + '"' + delim);

const prose = [
  ["Why ashrinka is not", "Why shrink is not"],
  ["1,800 (18 A- 100)", "1,800 (18 x 100)"],
  ["displays a 17,879", "displays ~ 17,879"],
  ["aCasea on YGO", '"Case" on YGO'],
  ["OCG a6,000 boxes per namea", "OCG ~6,000 boxes per name"],
  ["hits a expected", "hits vs expected"],
];
for (const [a,b] of prose) t = t.split(a).join(b);

const sm = t.match(/<script(?![^>]+src=)[^>]*>([\s\S]*?)<\/script>/);
fs.writeFileSync(process.env.TEMP + "\\mamo-fix.js", sm[1]);
const {execSync} = require("child_process");
try {
  execSync("node --check \"" + process.env.TEMP + "\\mamo-fix.js\"", {stdio:"pipe"});
  console.log("JS SYNTAX OK");
} catch (e) {
  console.error("JS STILL BAD");
  console.error((e.stderr || e.message).toString());
  const lines = sm[1].split(/\n/);
  const lm = (e.stderr||"").toString().match(/:(\d+)/);
  if (lm) {
    const n = +lm[1];
    for (let i=Math.max(1,n-2); i<=Math.min(lines.length,n+2); i++) console.log(String(i).padStart(4)+"| "+lines[i-1]);
  }
  // dump remaining hex-without-quote
  const bad = sm[1].match(/#[0-9A-Fa-f]{6}(?!\")[^\s;:]/g);
  console.log("hex missing quote samples:", bad && bad.slice(0,30));
  process.exit(1);
}

for (let i=0;i<t.length;i++) if (t.charCodeAt(i)>127) { console.error("high", i); process.exit(3); }
fs.writeFileSync(path, t);
console.log("WROTE OK");
