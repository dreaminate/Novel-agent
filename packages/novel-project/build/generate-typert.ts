import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WorkspaceTypertGenerator } from '@deepseek-ai/dsh-typert-generator'

const packageName = '@novel-agent/novel-project'
const workspaceRoot = fileURLToPath(new URL('../../..', import.meta.url))
const artifacts = new WorkspaceTypertGenerator(workspaceRoot)
  .generate([packageName], ['host'])
const artifact = artifacts.find(candidate =>
  candidate.package === packageName && candidate.face === 'host')

if (artifact === undefined || artifact.remote === undefined) {
  throw new Error('Novel Project Typert generation produced no Host Remote artifact')
}

const output = fileURLToPath(new URL('../lib', import.meta.url))
mkdirSync(output, { recursive: true })
writeFileSync(join(output, 'typert.host.js'), artifact.js)
writeFileSync(join(output, 'typert.host.d.ts'), artifact.dts)
writeFileSync(join(output, 'typert.remote-client.js'), artifact.remote.js)
writeFileSync(join(output, 'typert.remote-client.d.ts'), artifact.remote.dts)
writeFileSync(join(output, 'typert.remote-client.d.ts.map'), artifact.remote.dtsMap)
