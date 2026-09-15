# DSH File Upload evaluation

**Decision:** require users who need Web/Desktop upload and generic document
extraction to install exact `dsh-file-upload@0.4.3` separately. Do not add it to
the novel-agent manifest or lockfile, and do not create a wrapper, adapter,
Profile, Bundle or replacement front end.

**Evidence date:** 2026-08-28

## Product boundary

File Upload owns the existing `conversation.input.left` attachment button,
`conversation.input.dock` cards, drag/drop and `@` reference entry. Its Host
owns `/api/upload` and the generic `read_document` Tool. TXT/Markdown inline
text or document references enter the normal DSH composer and Agent path.

The single `@novel-agent/novel-project` plugin begins only at normalized text:
`propose_novel_import` generates the accepted-base Diff, SourceAnchor, hash and
provenance, then reuses the existing Result Packet review, atomic revision,
rollback and Publish paths. File Upload state never becomes Novel Project Canon.

## Exact artifact and license

| Item | Evidence |
| --- | --- |
| Package | `dsh-file-upload@0.4.3` |
| Source | [HongMing-Huang/dsh-file-upload](https://github.com/HongMing-Huang/dsh-file-upload) |
| License | MIT |
| Runtime shape | Host and Web client bundles; no Novel Remote |
| Published DSH peer | older `^0.1.0-rc.6` line, so runtime evidence is required for rc.2 |
| Lifecycle | the plugin package declares no install/postinstall script; its resolved `sharp@0.34.5` and `tesseract.js@6.0.1` dependencies require explicitly allowed builds |

No code, icon, font, theme or media asset from the package is redistributed by
novel-agent. The package remains an external user download.

## Observed seam

- `POST /api/upload` returns the stored path/relative path, name, byte count,
  Session id, sniffed type and label; small text may include `inlineText`, while
  larger content provides a preview/reference.
- `read_document({ file_path, offset?, limit? })` returns path, 1-based offset,
  numbered text lines and total line count.
- TXT and Markdown are treated as text. Small content is inserted into the
  composer; larger files are referenced by `@relativePath` for the Agent to read.
- The upload response does not supply a Canon record, Novel SourceAnchor or
  complete content hash. Those remain deterministic novel-domain outputs.

## Isolated rc.2 compatibility

The fresh evidence root was:

`C:\Users\33166\AppData\Local\Temp\novel-agent-dsh-file-upload-rc2-smoke-20260828-575bd2edfb4342c99cedaa83845afe6c`

The first normal add correctly stopped at Pnpm's ignored-build gate. DSH/Pnpm's
documented package allow-list was then limited to the two reported dependencies:

```powershell
dsh plugin --profile web add `
  --allow-build=sharp `
  --allow-build=tesseract.js `
  dsh-file-upload@0.4.3
```

The retry exited `0`. Exact DSH `0.1.1-rc.2` resolved the `file-upload` loader,
started a real Web Host on `127.0.0.1:3188`, returned HTTP `200` for the root and
for `/plugins/dsh-file-upload/client.js?rev=7d2699585484`, then stopped with no
remaining listener. The 24,183-byte JavaScript artifact contained the upload
endpoint and File Upload button contribution.

## Adoption and remaining proof

Adopt it unchanged as a named user download because it already supplies the
generic input surface and extraction Tool. Novel-agent keeps no dependency on
it and its tests operate at the normalized-text seam.

Install, resolution, Host mount and client-artifact delivery are verified. A
real browser TXT upload also inserted exact text into the stock composer and
continued through a stock Agent import Tool call, the existing Result Packet
panel, author Apply R1 and reload. The unchanged attachment dock concurrently
logged `Cannot read properties of undefined (reading 'text')`, so the community
UI is not promoted as clean verified. Markdown browser upload, larger referenced
documents, production installation and user acceptance remain unverified. These
gaps and the upstream dock error do not justify novel-agent upload UI or a
compatibility wrapper.
