import { readFileSync } from 'node:fs';
import { validateSubdomainName } from '../util/validate.js';

const defaultReadFile = (path) => readFileSync(path, 'utf8');

export function parseDiff(lines, readFile = defaultReadFile) {
  const out = [];
  for (const line of lines) {
    if (!line) continue;
    const [status, ...fileParts] = line.split('\t');
    const file = fileParts.join('\t');
    if (status === 'A' || status === 'M') {
      try {
        const content = JSON.parse(readFile(file));
        out.push({ status, file, content });
      } catch (err) {
        throw new Error(`Failed to read ${file}: ${err.message}`);
      }
    } else if (status === 'D') {
      out.push({ status, file });
    } else if (status[0] === 'R' || status[0] === 'C') {
      throw new Error(`Unsupported status: ${status}`);
    }
  }
  return out;
}

export function buildRecoveryDiff(domain, readFile = defaultReadFile) {
  const validation = validateSubdomainName(domain);
  if (!validation.ok) {
    throw new Error(`Invalid recovery domain: ${validation.errors.join(' ')}`);
  }
  const file = `domains/${domain}.json`;
  let content;
  try {
    content = JSON.parse(readFile(file));
  } catch (err) {
    throw new Error(`Failed to read ${file}: ${err.message}`);
  }
  return [{ status: 'A', file, content }];
}

export function main(argv = process.argv) {
  if (argv[2] === '--recover-domain') {
    process.stdout.write(JSON.stringify(buildRecoveryDiff(argv[3] || '')));
    return 0;
  }
  const lines = readFileSync(0, 'utf8').split('\n').filter(Boolean);
  process.stdout.write(JSON.stringify(parseDiff(lines)));
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    process.exit(main());
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
