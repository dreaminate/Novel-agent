# TXT/Markdown import and export rc.2 proof — 2026-08-28

## Scope

This increment adds one `propose_novel_import` Tool to the existing
`@novel-agent/novel-project` plugin. It accepts complete normalized TXT or
Markdown text plus a stable source reference. It does not choose files, upload,
sniff MIME types or parse documents; those generic surfaces remain in the
separately installed `dsh-file-upload@0.4.3` plugin.

The Tool creates an authorization-free `NovelResultPacketDraft` containing the
unchanged manuscript text, a unified Diff against the same unit at the requested
accepted revision, one full-text SourceAnchor with SHA-256 content hash, optional
encoding/BOM/byte-length metadata from the upstream extractor, empty
deltas/issues and import provenance. Proposal creation does not advance Canon.
The existing `conversation.view` panel recognizes the Tool Result and reuses the
same author review/Apply transaction. Export reuses the existing separately
approved `publish_novel_manuscript` Tool; no second export Tool was added.

No upload UI, file parser, File Upload wrapper, Better Sidebar tab, Pi TUI
extension, adapter, Profile, Bundle, store or transport was added.

## TDD and domain round trip

The first Host RED failed because `propose_novel_import` was not registered.
The client RED failed because the existing Result Packet selector recognized
only `propose_novel_result_packet`.

GREEN verifies two complete normalized-text paths:

1. TXT and Markdown proposals start at R0 and retain their Unicode strings
   exactly, including line breaks and Markdown syntax.
2. Each proposal carries the caller's stable `sourceId`, offsets `0..text.length`,
   exact SHA-256 hash, generated unified Diff and `novel-import:<format>`
   provenance, but no authorization.
3. Proposal creation leaves the project at R0.
4. Existing author Apply mints authorization and appends R1.
5. Existing Publish writes exactly the accepted string and leaves the head R1.

A second integration imports TXT as R1, proposes a Markdown replacement against
the actual R1 text, accepts it as R2, uses the existing rollback to restore R1
as auditable R3, and publishes the restored R1 text. A temporary mutation that
generated every Diff from empty text made this test fail; restoring the accepted
revision lookup returned it to green.

## Separate File Upload compatibility smoke

Evidence directory:

`C:\Users\33166\AppData\Local\Temp\novel-agent-dsh-file-upload-rc2-smoke-20260828-575bd2edfb4342c99cedaa83845afe6c`

The isolated CLI was `@deepseek-ai/dsh@0.1.1-rc.2`. The initial plugin add
stopped at Pnpm's build gate for `sharp@0.34.5` and `tesseract.js@6.0.1`.
The documented package-manager flags were then limited to those two packages:

```powershell
dsh plugin --profile web add `
  --allow-build=sharp `
  --allow-build=tesseract.js `
  dsh-file-upload@0.4.3
```

The retry exited `0`. `dsh --profile web --dump-config` resolved the
`file-upload` loader. A real `dsh --profile web --no-open --port 3188` Host
started on `127.0.0.1`; `/` returned HTTP `200` with the File Upload client entry,
and `/plugins/dsh-file-upload/client.js?rev=7d2699585484` returned HTTP `200`,
`text/javascript`, 24,183 bytes. The Host was stopped and port 3188 no longer
listened.

This proves install, resolution, Host mount and real client-artifact delivery on
rc.2.

## Real browser File Upload composition

The visible composition used a second fresh evidence root:

`C:\Users\33166\AppData\Local\Temp\novel-agent-file-upload-e2e-20260828-1905`

Its Web Profile contained stock DSH `0.1.1-rc.2`, separately installed
`dsh-file-upload@0.4.3`, the linked current `novel-project`, and the official
DSH replay provider as the isolated model boundary. Playwright opened the real
Web page at `127.0.0.1:3191`, created a Workspace and standard Session, and used
the visible `上传文件` button to choose `uploaded-chapter.txt`.

Observed normal path:

1. File Upload inserted `[file: uploaded-chapter.txt]` and the exact file text
   into the existing composer.
2. Sending that composer content produced one native `propose_novel_import`
   call with the same text, format `txt` and source id.
3. The Tool Result had no authorization and the project remained R0.
4. The existing Novel Project tab automatically rendered the manuscript,
   accepted-base unified Diff, one SourceAnchor and pending author decision.
5. Existing Apply returned HTTP `200`, minted author authorization and appended
   R1 with content hash
   `10a7f44e476f6530fe4838236ec5c304540b4afbd0b721363b2d6a0402f6ad66`.
6. Reload restored the exact manuscript at `sourceRevision=1` with
   `producer=novel-import:txt`.

The run recorded zero page errors and zero failed requests. At the upload
moment, the unchanged File Upload `UploadDock` also logged
`Cannot read properties of undefined (reading 'text')`, followed by a
`conversation.input.dock` slot-crash message. The composer, Agent Tool, Result
Packet, Apply and reload paths still completed. This is retained as an upstream
community-plugin caveat; novel-agent does not patch or wrap the dock.

Evidence retained under the root includes
`file-upload-import-summary.json` and `file-upload-import-r1.png`. The browser
and Host were stopped; port 3191 had zero listeners and the origin was no longer
reachable.

## Verification

- missing-Tool and client-selector RED: failed for the expected reasons;
- TXT and Markdown normalized-text round trips: passed;
- re-import, accepted-base Diff, rollback and restored Publish: passed;
- real TXT button upload → composer → stock Agent import Tool → Result Packet →
  author Apply R1 → reload: passed with the upstream dock console error above;
- source encoding/BOM/byte-length metadata through packet → Apply → reload: passed;
- package suite: 5 files, 99 tests passed;
- root suite: 5 files, 99 tests passed;
- typecheck: passed;
- lint: passed;
- build: passed;
- package dry-run: passed and contained only `@novel-agent/novel-project`.

## Claim boundary

This verifies the first domain slice at the normalized Unicode string boundary,
plus preservation of importer-reported encoding, BOM and original byte length
metadata. It does not retain or reproduce the original source-file byte
sequence or newline encoding. Clean File Upload dock rendering, Markdown browser
upload, larger referenced documents, manuscript deletion, production installation
and user acceptance remain unverified.
