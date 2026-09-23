import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), "utf8");
const expect = (path, pattern, message) => assert.match(read(path), pattern, `${path}: ${message}`);

expect(
  "src/styles.css",
  /@media \(max-width: 640px\)[\s\S]*?\.notification-bell-popover[\s\S]*?position:\s*fixed/,
  "notification popover must stay inside phone viewport",
);
expect(
  "src/styles/auth.css",
  /@media \(max-width: 375px\)[\s\S]*?\.auth-topbar[\s\S]*?flex-wrap:\s*wrap/,
  "auth topbar must wrap at 320-375px",
);
expect(
  "src/styles/account.css",
  /\.account-search-wrap\s*\{[^}]*flex:\s*1[^}]*min-width:\s*0/,
  "account search wrapper must be shrinkable",
);
expect(
  "src/styles/settings.css",
  /grid-template-columns:minmax\(0,1fr\) auto/,
  "setting rows need a stable mobile label/control grid",
);
expect("src/routes/search.tsx", /max-\[375px\]:w-full/, "search submit must use a full phone row");
expect(
  "src/components/home/SourceSelectorModal.tsx",
  /max-sm:flex-col/,
  "source rows must stack on phones",
);
expect(
  "src/styles/player-controls.css",
  /@media \(hover: none\), \(pointer: coarse\)[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px/,
  "player touch controls need 44px hit targets",
);
expect(
  "src/styles/player-controls.css",
  /\.player-settings-menu\s*\{[^}]*max-height:\s*calc\(100dvh/,
  "player settings must fit the dynamic viewport",
);
expect(
  "src/styles/player-controls.css",
  /@media \(max-width: 520px\)[\s\S]*?\.stream-mode-badge[\s\S]*?display:\s*none/,
  "secondary player controls must collapse on phones",
);
expect(
  "src/styles/details.css",
  /@media \(max-width: 520px\)[\s\S]*?\.hero-actions[\s\S]*?grid-template-columns:\s*repeat\(2/,
  "detail hero actions need a phone grid",
);
expect(
  "src/styles/details.css",
  /\.comment\s*>\s*div\s*\{[^}]*min-width:\s*0/,
  "comment content must shrink without overflow",
);
expect(
  "src/styles/admin.css",
  /@media \(max-width: 639px\)[\s\S]*?min-height:\s*44px/,
  "admin phone controls need 44px touch targets",
);

console.log("Responsive regression checks passed.");
