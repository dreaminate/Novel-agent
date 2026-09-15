# DSH Browser and Web Search Pro evaluation

**Decision:** users who need Web/Desktop browser automation and Web search
install exact `@anweat/dsh-browser@0.1.9` and
`dsh-web-search-pro@0.1.11` directly in their selected DSH Web Profile.
Novel-agent does not add either dependency and does not create a wrapper,
Profile, Bundle, browser, search UI or replacement Tool.

**Evidence date:** 2026-08-31

## Product boundary

DSH owns the Agent, Tool catalog, approvals, settings, credentials and stock Web
settings surface. Browser owns the Playwright/Patchright/OpenCLI runtime and
interactive browser tools. Search Pro owns multi-engine routing, rendered
extraction, cache and the optional `ctx.web` provider over that browser service.

Novel-agent begins only where research changes a novel-domain transaction:
accepted Canon facts, source anchors, provenance, Result Packet review and
author decisions remain inside the single `novel-project` plugin. Community
plugin state never becomes Novel Project Canon.

## Exact artifacts and compatibility contract

| Item | Observed release metadata |
| --- | --- |
| Browser | `@anweat/dsh-browser@0.1.9`, MIT, Node `^22.19 || >=24`, npm integrity `sha512-q+C/1LrAOgpgfiuwgfOcUSfWXEjvUqz7T84gdqZb+e2zgESgvms6UqP5Zk6hoW2dqqa+8Jnxayd2XPlbf+2xyw==` |
| Search | `dsh-web-search-pro@0.1.11`, MIT, Node `^22.19 || >=24`, npm integrity `sha512-nJuOUxvK26wksgUlBFlSQ3cylWuWrTHXORqWYNVVgKySolkNThfsF3drODJe2Ha0PugPN3KRfvCzyX7kjrEXiQ==` |
| DSH peers | Both manifests request the published `^0.1.1-rc.2` Client/Host seams; Search also requests Browser `>=0.1.8 <0.2.0` |
| Browser runtime dependencies | `playwright`, `patchright` and `@jackwener/opencli` |
| Search runtime dependencies | `cross-spawn`, `js-yaml` and `jsdom`; the Browser service is a peer |

The installed production graph reported only permissive license families:
MIT, MIT-0, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, Python-2.0,
BlueOak-1.0.0 and CC0-1.0. No code or asset from either plugin is redistributed
by novel-agent.

## Fresh isolated rc.2 smoke

The evidence root was:

`C:\Users\33166\AppData\Local\Temp\novel-agent-browser-search-rc2-smoke-20260831-095405-35d738c91c844805a8d488b59d8b9b43`

Its new `dsh-home` was the only `DSH_HOME`; the user-global `.dsh` Profile was
not used. The normal first add resolved the exact two requested packages and
stopped at Pnpm's build gate with only
`@jackwener/opencli@1.8.7` reported. The successful retry was:

```powershell
dsh plugin --profile web add `
  --allow-build=@jackwener/opencli `
  @anweat/dsh-browser@0.1.9 `
  dsh-web-search-pro@0.1.11
```

It exited `0`. The Profile manifest contained only those two user dependencies
and composed them after stock `@deepseek-ai/dsh-base` and
`@deepseek-ai/dsh-web-app`; no novel-agent Profile or wrapper was introduced.
The CLI and resolved base/Web/Host packages were `0.1.1-rc.2`.

`dsh --profile web --dump-config` mounted loader `browser` with the published
Playwright/OpenCLI configuration, followed by loader `web-search-pro`. A real
Host then listened on `127.0.0.1:64112` and returned:

- root document: HTTP `200`, 15,147 bytes;
- `/plugins/@anweat/dsh-browser/client.js?rev=52bc87f0f4f6`: HTTP `200`,
  52,228 bytes;
- `/plugins/dsh-web-search-pro/client.js?rev=7675dd0cfbf8`: HTTP `200`,
  44,355 bytes.

## Visible stock-Web evidence

An isolated headless Playwright context opened the real stock Web page, passed
the normal first-run dialogs without adding credentials, and opened Settings →
Plugins. The stock page visibly showed:

- `Web Search Pro` with search strategy, engine order/result/time budgets,
  credential references, CLI/OpenCLI/Agent Reach switches, optional `ctx.web`
  provider, cache and Playwright configuration;
- `浏览器自动化` with service enablement, automation mode, OpenCLI,
  Playwright/Patchright selection, browser channel/headless/install controls,
  usage-policy buffers and reusable automation assets;
- Plugin Inventory entries `browser` and `web-search-pro`, both `已启用`.

The corresponding accessibility snapshot exposed named headings, regions,
tabs, controls and status text (`配置已与 Host 同步。`). A clean reload observed
both exact client URLs at HTTP `200`. Across the run, Playwright recorded zero
console events, page errors and failed requests. The full-page screenshot is
retained under the evidence root as `browser-search-settings.png`.

## Adoption and remaining proof

This verifies exact install, supply-chain build allowance, rc.2 composition,
Host load, client delivery and visible settings/inventory integration. It is
sufficient to name the pair as a compatible external download without writing
novel-agent adapters.

No live outbound browser navigation, search-engine request, credential flow,
OpenCLI bridge, cache persistence, restart persistence, production installation
or user acceptance was run. Those remain upstream capability validation, not a
reason to reimplement or patch browser/search inside novel-agent.
