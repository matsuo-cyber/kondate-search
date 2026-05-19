const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getStagedFiles() {
  const output = execSync('git diff --cached --name-only --diff-filter=ACM').toString();
  return output.split('\n').filter(Boolean);
}

function fileContainsSecret(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const secretPattern = /(sb_secret_|sb_publishable_|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY)/i;
    return secretPattern.test(content);
  } catch (e) {
    return false;
  }
}

const staged = getStagedFiles();
let found = false;
for (const file of staged) {
  const abs = path.resolve(process.cwd(), file);
  if (fs.existsSync(abs) && fileContainsSecret(abs)) {
    console.error('Potential secret found in staged file:', file);
    found = true;
  }
}
if (found) {
  console.error('\nCommit aborted. Remove secrets from your changes or unstage the file.');
  process.exit(1);
}
process.exit(0);
