/**
 * Export contact form submissions (DynamoDB) to CSV.
 *
 *   npm run contacts:export                       # all submissions
 *   npm run contacts:export -- --subscribed       # only people who ticked "product updates"
 *   CONTACT_TABLE=… AWS_REGION=… npm run contacts:export
 *
 * Uses the AWS CLI with your current credentials (read-only Scan). Output goes to
 * exports/ (gitignored) — it contains personal data, never commit or share it casually.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const table = process.env.CONTACT_TABLE ?? 'uppush-branding-contact-submissions';
const region = process.env.AWS_REGION ?? 'us-west-1';
const onlySubscribed = process.argv.includes('--subscribed');
const columns = ['createdAt', 'email', 'name', 'topic', 'store', 'subscribe', 'page', 'message'];

const items = [];
let startKey;
do {
  const args = ['dynamodb', 'scan', '--table-name', table, '--region', region, '--output', 'json'];
  if (startKey) args.push('--starting-token', startKey);
  const page = JSON.parse(execFileSync('aws', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }));
  items.push(...page.Items);
  startKey = page.NextToken;
} while (startKey);

const value = (attr) => (attr ? (attr.S ?? attr.N ?? String(attr.BOOL ?? '')) : '');
const csvCell = (text) => {
  // Neutralise spreadsheet formulas, then quote.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};

const rows = items
  .filter((item) => !onlySubscribed || item.subscribe?.BOOL)
  .sort((a, b) => value(b.createdAt).localeCompare(value(a.createdAt)))
  .map((item) => columns.map((c) => csvCell(value(item[c]))).join(','));

mkdirSync('exports', { recursive: true });
const file = `exports/contacts-${onlySubscribed ? 'subscribed-' : ''}${new Date().toISOString().slice(0, 10)}.csv`;
writeFileSync(file, [columns.join(','), ...rows].join('\n') + '\n');
console.log(`${rows.length} submissions → ${file}`);
