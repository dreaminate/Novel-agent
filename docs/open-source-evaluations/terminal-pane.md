# Terminal pane evaluation — superseded

**Current decision:** do not ship a novel-agent terminal package. Web/Desktop
terminal behavior comes from separately installed
`dsh-better-sidebar@0.16.1`; terminal-mode interaction comes from
`@xmoon76/dsh-pi-tui@0.3.4`; the community Desktop retains its operator
terminal. The former `terminal-remote`, `client-ui-terminal` and direct xterm
dependency are removed.

**Evaluated:** 2026-08-24

**Exact source:** npm `6.0.0`, upstream commit
[`f447274f430fd22513f6adbf9862d19524471c04`](https://github.com/xtermjs/xterm.js/tree/f447274f430fd22513f6adbf9862d19524471c04).

## Historical boundary

In the retired implementation, xterm owned character rendering, keyboard input, selection and renderer-local
viewport geometry only. Original DSH `@deepseek-ai/dsh-terminal` owns terminal
identity and owner checks; `@deepseek-ai/dsh-terminal-bash` and the already
composed DSH subprocess/PowerShell providers own PTY creation, signals and
process-tree cleanup. The novel-agent adapter contributes a Workbench Client
Slot and a generated Typert Remote. It does not add `node-pty`, a process owner,
an Electron-main terminal service, or a second Session/runtime.

DSH `0.1.1-rc.1` intentionally exposes no PTY resize operation. The first pane
therefore resizes xterm's renderer viewport without claiming a backend ConPTY
resize. Backend resize remains an upstream DSH capability boundary, not a local
patch target.

## Candidates

| Criterion | `@xterm/xterm` `6.0.0` | `jquery.terminal` `2.46.2` | `react-console-emulator` `5.0.2` |
| --- | --- | --- | --- |
| Source/license | [xtermjs/xterm.js](https://github.com/xtermjs/xterm.js), MIT | [jcubic/jquery.terminal](https://github.com/jcubic/jquery.terminal), MIT | [linuswillner/react-console-emulator](https://github.com/linuswillner/react-console-emulator), MIT |
| Maintenance signal checked 2026-08-24 | Stable `6.0.0` published 2025-12-22; registry activity continued through 2026-08-10. | Registry updated 2026-08-04. | Registry last updated 2022-06-02. |
| Terminal capability | Mature VT/xterm emulator, Unicode input, selection, scrollback and accessibility support. | Command-interpreter UI built around jQuery rather than a direct PTY viewport. | React command-console simulation, not a general PTY/VT renderer. |
| Runtime/bundle shape | No runtime dependencies in the published package; browser-only JS/CSS (`344,970` + `7,112` bytes before novel-agent bundling). | Adds jQuery-oriented UI/runtime conventions. | Smaller conceptual surface but cannot render arbitrary shell control sequences. |
| DSH seam fit | Clean presentation adapter over the DSH Terminal Remote. | Would require translating a PTY into an interpreter abstraction. | Would replace real shell behavior with a simulated command registry. |
| Decision | **Historical selection; now retired.** | Rejected. | Rejected. |

## Registry and license record

- Package: <https://registry.npmjs.org/@xterm/xterm/-/xterm-6.0.0.tgz>
- Integrity: `sha512-TQwDdQGtwwDt+2cgKDLn0IRaSxYu1tSUjgKarSDkUM0ZNiSRXFpjxEsvc/Zgc5kq5omJ+V0a8/kIM2WD3sMOYg==`
- License: MIT.
- Copyright: 2017–2019 The xterm.js authors; 2014–2016 SourceLair
  Private Company; 2012–2013 Christopher Jeffrey.
- The published package has no runtime dependencies and no install/postinstall
  lifecycle script. Its development-only `node-pty` entry is not installed as
  a dependency of the package and is not adopted by novel-agent.
- The bundled CSS is covered by the same MIT license; no logo, font or branded
  media asset is incorporated.

## Retirement rule

No xterm artifact is part of the current novel-agent product or lockfile. Do not
restore the local terminal to preserve its historical tests or smoke. A future
terminal change must first use the installed community plugin's published seam;
reintroducing a novel-agent terminal requires a new concrete domain gap and a
user-directed architecture decision.
