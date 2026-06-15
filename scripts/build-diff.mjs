import { readFileSync } from 'node:fs';

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

export function main() {
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
