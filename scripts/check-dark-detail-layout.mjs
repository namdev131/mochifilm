import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const desktop = read("src/styles/desktop-navigation.css");
const details = read("src/styles/details.css");
const root = read("src/routes/__root.tsx");
const home = read("src/routes/index.tsx");
const admin = read("src/routes/admin.tsx");
const layout = read("src/components/admin/AdminLayoutView.tsx");
const globalCss = read("src/styles.css");
const adminCss = read("src/styles/admin.css");
assert.match(desktop, /\.details-root > \.app \{ margin-left: 0 !important; \}/);
assert.match(desktop, /\.details-root \.topbar \{[\s\S]*background: none;[\s\S]*border: 0;/);
assert.match(desktop, /\.details-root \.topbar \.search input \{ border: 0; \}/);
assert.match(details, /@media \(max-width: 1023px\)/);
for (const source of [root, home, admin, layout, globalCss, adminCss]) {
  assert.doesNotMatch(source, /mochi_theme|mochi_admin_theme|html\.light|data-admin-theme="light"/);
}
assert.doesNotMatch(home, /toggleTheme|Chuyển sang giao diện sáng/);
assert.doesNotMatch(layout, /onToggleTheme|Đổi giao diện/);
assert.match(details, /@media \(max-width: 520px\)[\s\S]*?\.details-root \.hero-inner \{[\s\S]*?grid-template-columns: 1fr/);
assert.match(details, /@media \(max-width: 520px\)[\s\S]*?\.details-root \.poster \{[\s\S]*?display: none/);
console.log("Dark detail layout passed: full width, one search chrome, responsive mobile, no light mode");
