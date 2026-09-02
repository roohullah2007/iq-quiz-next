# Pre-Push Security & Malware Integrity Policy

## Mandatory Rule

Before ANY `git commit` or `git push`, treat the working tree and repository history as potentially compromised.

Do NOT assume that existing files, GitHub content, previous commits, generated files, or AI-generated code are trusted.

The goal is to ensure that only legitimate application code is committed and pushed.

---

## 1. Pre-Push Security Check

Before pushing code, perform the following checks:

1. Inspect the current Git state:
   - `git status`
   - `git diff`
   - `git diff --cached`

2. Review all modified and newly created files.

3. Pay special attention to:
   - `tailwind.config.*`
   - `postcss.config.*`
   - `package.json`
   - `package-lock.json`
   - `composer.json`
   - `composer.lock`
   - `.github/workflows/*`
   - shell scripts
   - build scripts
   - deployment scripts
   - PHP files
   - JavaScript/TypeScript files
   - configuration files
   - files containing encoded or obfuscated content

4. Look for unexpected:
   - `eval`
   - `exec`
   - `system`
   - `shell_exec`
   - `passthru`
   - `proc_open`
   - `child_process`
   - `spawn`
   - `execSync`
   - `curl`
   - `wget`
   - remote script downloads
   - `base64` decoding
   - obfuscated strings
   - dynamically generated code
   - unexpected network requests
   - Telegram/bot/webhook communication
   - filesystem deletion commands
   - unexpected cron/system commands
   - npm lifecycle scripts
   - commands unrelated to the application's purpose

These patterns are indicators for investigation, NOT automatic proof of malware.

---

## 2. Never Execute Suspicious Code

If suspicious or potentially malicious code is discovered:

DO NOT:

- execute it
- run `npm install` to "see what happens"
- run `npm run build` to test it
- run Composer scripts to test it
- deploy it
- push it
- execute shell commands contained inside it

Analyze the code statically first.

---

## 3. Verify Against a Trusted/Original Version

When a suspicious modification is found:

1. Determine what the file is supposed to contain based on:
   - the application's framework/version
   - official framework documentation
   - the project's known-good implementation
   - a previously verified clean Git commit
   - package documentation
   - a clean generated configuration

2. Compare the suspicious file with the trusted version.

3. Identify exactly what was added, removed, or modified.

4. Do NOT blindly trust the current GitHub version as the clean source.

If Git history may already be compromised, find the last known-good commit or regenerate the configuration from a trusted baseline.

Example:

```bash
# every commit that ever touched the file, across all branches
git log --oneline --all -- path/to/file

# what a specific commit did to it
git show <commit> -- path/to/file

# the file's size at each revision - a config that jumps to ~35KB is a payload
git rev-list --all -- path/to/file | while read c; do
  printf '%s %s\n' "$c" "$(git cat-file -s "$(git rev-parse "$c:path/to/file" 2>/dev/null)" 2>/dev/null)"
done
```

---

## 4. Known Campaign: EtherHiding Build-Config Dropper

This organisation has been hit by this specific dropper. Know its shape.

**Where it hides:** appended to a legitimate build config - `postcss.config.js`,
`eslint.config.js`, `vite.config.js`, `tailwind.config.js`, `postcss.config.mjs`.
It has also been found masquerading as a static asset:
`public/fonts/fa-solid-400.woff2` that is not a font at all.

**Its shape:** the real file content, then a run of 100+ tab characters that
pushes the payload off the right-hand edge of an editor, then 5-35KB of
obfuscated JavaScript crammed onto that single line.

**Detect it by that shape, not by a signature.** Three variants of this dropper
were found across these repositories, and each one defeats a different keyword
search. What none of them can drop is the structure: *a long run of padding
whitespace, immediately followed by thousands of characters on one line.* That
is the check worth writing.

| Variant | Marker | Identifier style |
| --- | --- | --- |
| 1 | `global.i = 'A8-<n>-<n>'` | `_0x` + 4 hex digits, ~1,785 per file |
| 2 | `global.i = 'A11'` | random word-like names, no `_0x` at all |
| 3 | `global['!'] = '8-3653'` | string-shuffle decoder, no `_0x` at all |

**Indicators of compromise:**

- the marker uses **single quotes**; a grep for `global.i="A8-` finds none of them
- an assignment to a global whose name is a single character - `i`, or even `!`
- `_0x[0-9a-f]{4,}` mangled identifiers, but only in variant 1 - their absence
  proves nothing
- Ethereum RPC endpoints used as the command-and-control channel:
  `eth_getBlockByNumber`, `eth_blockNumber`, `drpc.org`, `blockscout`,
  `publicnode.com`, `1rpc.io`
- contract address `0xa322E5f3D311D3080e6f0121063e9aDC2490Ef1a`
- it launches a second copy of the Node binary on an inline script string, then
  releases it from the parent process so it outlives the build that started it
- a build config whose file size is over ~20KB

**Fast check on any repo:**

```bash
# a legitimate postcss.config.js is ~185 bytes, never 35KB
find . -name '*.config.*' -not -path './node_modules/*' -size +20k

# the structural tell - catches all three variants, and any fourth one
grep -rlIE '[[:space:]]{100,}.{400,}' --exclude-dir=node_modules --exclude-dir=.git .

# an assignment to a single-character global, any quote style
grep -rlIE "global[[:space:]]*[.[][[:space:]]*['\"]?.['\"]?]?[[:space:]]*=" \
  --include='*.js' --include='*.mjs' --include='*.cjs' --exclude-dir=.git .
```

Checking the working tree is not enough. The payload also sits at branch tips
you have not checked out, and in old commits:

```bash
# every branch tip, not just the one you are on
for r in $(git for-each-ref --format='%(refname)' refs/remotes); do
  git ls-tree -r "$r" | awk '$4 ~ /config\.(js|mjs|cjs|ts)$/ {print $3, $4}' | \
  while read o p; do
    [ "$(git cat-file -s "$o")" -gt 20000 ] && echo "$r: $p"
  done
done
```

**How to clean it:** everything from the long whitespace run onward is payload.
Truncate the file at that run and keep the prefix - that prefix is the original,
legitimate config.

The dropper also prepends scaffolding so it can call `require()` from an ESM
config. If these two lines appear and nothing else in the file uses `require`,
they are the dropper's, not yours, and should go too:

```js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
```

Then confirm no obfuscated identifiers, no RPC hostnames and no remaining
whitespace run survive. If a file cleans down to nothing, it was pure payload
and should be deleted outright.

**Do not trust a previous "security" commit.** In this repository set, a commit
titled *"Security: strip injected build-config payload"* left the file **larger**
than before (31,487 -> 34,879 bytes). Verify the result, do not assume it.

---

## 5. After Cleaning

1. Confirm the tip of every branch is clean, not just the default branch.
2. Remember that old commits still contain the payload. A rebase, `git bisect`,
   or a checkout of an old branch can reintroduce it. Re-scan after any such
   operation.
3. Rotate any credential that was reachable from an infected checkout.
4. Never resolve a blocked push with `git push --no-verify` as a first move.
   Read the flagged file in full and justify the finding before overriding.
