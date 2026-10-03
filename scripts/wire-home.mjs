// One-off: point HomeScreen/Footer at DB-driven data + admin-controlled sections.
import { readFileSync, writeFileSync } from "node:fs";

const rep = (s, a, b) => {
  if (!s.includes(a)) throw new Error("missing: " + a.slice(0, 60));
  return s.replace(a, b);
};

let f = "src/ui/screens/HomeScreen.tsx";
let s = readFileSync(f, "utf8");
s = rep(s, "import { MOCK_LISTINGS, CITIES_DATA, BLOG_POSTS } from '../data/mockData';", "import { useData } from '../data/DataProvider';");
s = rep(s, "import { T } from '../content';", "import { T, Show } from '../content';");
s = rep(s, "}) => {\n  const [activeTab", "}) => {\n  const { listings, cities, blog, stats, categoryCounts } = useData();\n  const [activeTab");
s = s.replaceAll("MOCK_LISTINGS", "listings").replaceAll("CITIES_DATA", "cities").replaceAll("BLOG_POSTS", "blog");

s = rep(s, '<span className="font-bold text-ivory">2,340+ Verified Plots</span>', '<span className="font-bold text-ivory">{stats.plots} <T k="home.stats.plots-label">Verified Plots</T></span>');
s = rep(s, '<span className="font-bold text-ivory">45 Industrial Cities</span>', '<span className="font-bold text-ivory">{stats.cities} <T k="home.stats.cities-label">Cities</T></span>');
s = rep(s, '<span className="font-bold text-ivory">890 Institutional Deals Closed</span>', '<span className="font-bold text-ivory">{stats.deals} <T k="home.stats.deals-label">Deals Closed</T></span>');
s = rep(s, "<span>View All 2,340+ Listings</span>", "<span>View All {stats.plots} Listings</span>");

s = rep(s, '<T k="home.1-120-plots">1,120 Plots</T>', "{categoryCounts.Industrial ?? 0} Plots");
s = rep(s, '<T k="home.540-hubs">540 Hubs</T>', "{categoryCounts.Warehousing ?? 0} Listings");
s = rep(s, '<T k="home.380-sites">380 Sites</T>', "{categoryCounts.Commercial ?? 0} Sites");
s = rep(s, '<T k="home.300-sites">300 Sites</T>', "{categoryCounts.Residential ?? 0} Plots");

// testimonials: hidden until the admin switches it on with real quotes
const i = s.indexOf('<T k="home.institutional-trust">');
const start = s.lastIndexOf("      <section", i);
const end = s.indexOf("      </section>", i) + "      </section>".length;
s = s.slice(0, start) + '      <Show k="home.testimonials">\n' + s.slice(start, end) + "\n      </Show>" + s.slice(end);

// blog cards link to the real post
s = rep(s, "className=\"bg-white rounded-sm border border-line p-5 hover:border-graphite transition-all flex flex-col justify-between group shadow-xs hover:shadow-md cursor-pointer\"", "className=\"bg-white rounded-sm border border-line p-5 hover:border-graphite transition-all flex flex-col justify-between group shadow-xs hover:shadow-md cursor-pointer\"\n              onClick={() => { window.location.href = `/blog/${post.slug}`; }}");
writeFileSync(f, s);

f = "src/ui/components/Footer.tsx";
s = readFileSync(f, "utf8");
s = rep(s, "import { T } from '../content';", "import { T, Show } from '../content';");
const a = s.indexOf('            <div className="pt-2 flex flex-wrap gap-2 text-xs">');
const b = s.indexOf("            </div>\n", s.indexOf("footer.tnrera-registered", a)) ;
const b2 = s.indexOf("            </div>\n", b + 5) >= 0 ? b : b;
const endIdx = s.indexOf("</div>", s.indexOf("</span>", s.indexOf("footer.tnrera-registered", a))) ;
// wrap: from a to the closing </div> of that container
const close = s.indexOf("            </div>", s.indexOf("footer.tnrera-registered", a)) + "            </div>".length;
s = s.slice(0, a) + '            <Show k="footer.rera-badges">\n' + s.slice(a, close) + "\n            </Show>" + s.slice(close);
writeFileSync(f, s);
console.log("wired");
