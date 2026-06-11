import { readFileSync } from 'node:fs';

const lines = readFileSync(0, 'utf8').split('\n').filter(Boolean);
const out = [];
for (const line of lines) {
  const [status, ...fileParts] = line.split('\t');
  const file = fileParts.join('\t');
  if (status === 'A' || status === 'M') {
    try {
      const content = JSON.parse(readFileSync(file, 'utf8'));
      out.push({ status, file, content });
    } catch (err) {
      console.error(`Failed to read ${file}: ${err.message}`);
      process.exit(1);
    }
  } else if (status === 'D') {
    out.push({ status, file });
  } else if (status[0] === 'R' || status[0] === 'C') {
    console.error(`Unsupported status: ${status}`);
    process.exit(1);
  }
}
process.stdout.write(JSON.stringify(out));
