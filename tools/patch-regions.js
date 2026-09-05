const fs = require("fs");
let t = fs.readFileSync("index.html", "utf8");
if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);

const sightings = `const SIGHTINGS = [
      { card:"Dark Magician, the Pharaoh's Servant", set:"MAMO-EN001", serial:"049/100", region:"Americas", country:null, source:"public pull", sold:false },
      { card:"Favorite HERO Shining Flare Wingman", set:"MAMO-EN004", serial:"052/100", region:"Americas", country:"US West Coast", source:"public listing", sold:false },
      { card:"Stardust Dragon - Victim Sanctuary", set:"MAMO-EN007", serial:"077/100", region:"Americas", country:null, source:"public pull", sold:false },
      { card:"Horoscope Sorcerer, the Stargazer Magician", set:"MAMO-EN014", serial:"010/100", region:"Americas", country:null, source:"public pull", sold:false },
      { card:"Horoscope Sorcerer, the Stargazer Magician", set:"MAMO-EN014", serial:"044/100E", region:"Europe", country:"United Kingdom", source:"public listing", sold:false },
      { card:"Dark Magical Curtain", set:"MAMO-EN003", serial:"006/100E", region:"Europe", country:"South Africa", source:"public pull", sold:false },
      { card:"Decode Talker Integration", set:"MAMO-EN016", serial:"077/100", region:"Americas", country:"Mexico", source:"public pull", sold:false },
      { card:"Dark Magical Curtain", set:"MAMO-EN003", serial:"060/100", region:"Americas", country:"United States", source:"public pull", sold:false },
      { card:"Odd-Eyes Pendulum Dragon, Four Heavenly Dragons", set:"MAMO-EN013", serial:"049/100", region:"Americas", country:"US West Coast", source:"public listing", sold:false },
      { card:"Gagaga Magician - Gagaga Magic", set:"MAMO-EN011", serial:"032/100", region:"Americas", country:"US Northeast", source:"public listing", sold:false },
      { card:"Cyberse Contract Witch", set:"MAMO-EN018", serial:"???/100E", region:"Europe", country:"Bulgaria", source:"public listing", sold:false },
      { card:"GMR (card TBD)", set:"MAMO-EN?", serial:"???/100E", region:"Europe", country:"Spain", source:"public pull", sold:false },
      { card:"GMR (card TBD)", set:"MAMO-EN?", serial:"???/100E", region:"Europe", country:"Australia", source:"public pull", sold:false }
    ];`;
t = t.replace(/const SIGHTINGS = \[[\s\S]*?\];/, sightings.trim());

const isoExtra = `const COUNTRY_ISO = {
      "South Africa":710, "Bulgaria":100, "Spain":724, "Australia":36,
      "United States":840, "Canada":124, "Mexico":484, "Brazil":76, "Argentina":32,
      "Colombia":170, "Chile":152, "Peru":604, "United Kingdom":826, "France":250,
      "Germany":276, "Italy":380, "Netherlands":528, "Japan":392
    };
    const US_REGION_LL = {
      "US West Coast": [-122.5, 40.5],
      "US South": [-97.5, 31.5],
      "US Midwest": [-92.5, 42.5],
      "US Southeast": [-84.5, 33.5],
      "US Northeast": [-74.5, 41.5]
    };`;
t = t.replace(/const COUNTRY_ISO = \{[\s\S]*?\};/, isoExtra);

t = t.replace(
  "Hard rule: no names, no cities. E-suffix = Europe-distributed, plotted separately from Americas. Unknown country is not placed on the map.",
  "Hard rule: no names, no cities. USA plots as West Coast / South / Midwest / Southeast / Northeast when known. E-suffix = Europe-distributed. Unknown place is not plotted."
);

t = t.replace(
  "const hitIso=new Set(Object.keys(loc.by).map(c=>String(COUNTRY_ISO[c])).filter(Boolean));",
  "const hitIso=new Set(Object.keys(loc.by).map(c=>US_REGION_LL[c]?\"840\":String(COUNTRY_ISO[c]||\"\")).filter(Boolean));"
);

const i = t.indexOf("Object.values(loc.by).forEach(row=>{");
if (i < 0) throw new Error("loop missing");
const endMarker = "\n      };\n      if (WORLD){ renderTopo(WORLD); return; }";
const k = t.indexOf(endMarker, i);
if (k < 0) throw new Error("end marker missing");
const blockEnd = t.lastIndexOf("        });", k);
if (blockEnd < i) throw new Error("block end missing");

const newLoop = `Object.values(loc.by).forEach(row=>{
          let xy=null;
          if (US_REGION_LL[row.country]) {
            xy = projection(US_REGION_LL[row.country]);
          } else {
            const iso=COUNTRY_ISO[row.country];
            if (!iso) return;
            const feat=land.features.find(f=>String(f.id)===String(iso));
            if (!feat) return;
            xy=projection(d3.geoCentroid(feat));
          }
          if (!xy || !isFinite(xy[0]) || !isFinite(xy[1])) return;
          const [x,y]=xy;
          svg.append("circle").attr("cx",x).attr("cy",y).attr("r", 6+2*row.n)
            .attr("fill","#d4b45a").attr("stroke","#0b0a09").attr("stroke-width",1.2);
          const label=(row.country||"").replace(/^US /,"")+"  |  "+row.n;
          svg.append("text").attr("x",x+10).attr("y",y+4)
            .attr("fill","#e8e0d4").attr("font-size",11).attr("font-family","IBM Plex Mono")
            .text(label);
        });
        if (Object.keys(loc.by).some(k=>k==="United States"||k.indexOf("US ")===0)) {
          const usa=land.features.find(f=>String(f.id)==="840");
          if (usa) {
            svg.append("path").datum(usa).attr("d", path)
              .attr("fill","#c9a24a").attr("fill-opacity",0.35)
              .attr("stroke","#e8d090").attr("stroke-width",0.6);
          }
        }`;

t = t.slice(0, i) + newLoop + t.slice(blockEnd + "        });".length);

t = t.replace(
  /Public GMR serials<\/td><td class="n">[^<]+/,
  "Public GMR serials</td><td class=\"n\">US regions + MX; Europe/Oceania /100E incl. ES/AU/BG/UK/ZA"
);

const sm = t.match(/<script(?![^>]+src=)[^>]*>([\s\S]*?)<\/script>/);
const tmp = (process.env.TEMP || "/tmp") + "/mamo-check.js";
fs.writeFileSync(tmp, sm[1]);
const {execSync} = require("child_process");
execSync('node --check "' + tmp + '"', {stdio:"inherit"});
for (let n = 0; n < t.length; n++) if (t.charCodeAt(n) > 127) throw new Error("high " + n);
fs.writeFileSync("index.html", t);
console.log("OK", fs.statSync("index.html").size);
