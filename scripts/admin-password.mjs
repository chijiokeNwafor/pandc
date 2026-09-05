import { hashPassword } from '../lib/password.ts';
if (!process.stdin.isTTY)
  throw new Error('Run this command in an interactive terminal.');
process.stdout.write('Admin password (at least 12 characters, input hidden): ');
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');
let password = '';
process.stdin.on('data', async (chunk) => {
  for (const char of chunk) {
    if (char === '\u0003') {
      process.stdin.setRawMode(false);
      process.exit(130);
    }
    if (char === '\r' || char === '\n') {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      try {
        console.log(`\nADMIN_PASSWORD_HASH=${await hashPassword(password)}`);
      } catch (error) {
        console.error(`\n${error.message}`);
        process.exitCode = 1;
      }
      return;
    }
    if (char === '\u007f') password = password.slice(0, -1);
    else password += char;
  }
});
