import { randomBytes } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { hashPassword } from '../lib/password.ts';
const container = `wedding-test-${randomBytes(6).toString('hex')}`;
const databasePassword = randomBytes(24).toString('hex');
const password = randomBytes(24).toString('hex');
const origin = 'http://localhost:3107';
const env = {
  ...process.env,
  DATABASE_URL: '',
  ADMIN_EMAIL: 'test@example.com',
  ADMIN_PASSWORD_HASH: await hashPassword(password),
  AUTH_SECRET: randomBytes(32).toString('hex'),
  AUTH_URL: origin,
  SITE_ORIGIN: origin,
  TEST_ORIGIN: origin,
  TEST_ADMIN_PASSWORD: password,
};
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Test command exited ${code}`)),
    );
  });
}
let server;
let databaseStarted = false;
try {
  execFileSync(
    'docker',
    [
      'run',
      '--detach',
      '--rm',
      '--name',
      container,
      '-e',
      `POSTGRES_PASSWORD=${databasePassword}`,
      '-e',
      'POSTGRES_DB=wedding_test',
      '-p',
      '127.0.0.1::5432',
      'postgres:17-alpine',
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
  databaseStarted = true;
  const address = execFileSync('docker', ['port', container, '5432/tcp'], {
    encoding: 'utf8',
  }).trim();
  const port = address.split(':').at(-1);
  env.DATABASE_URL = `postgresql://postgres:${databasePassword}@127.0.0.1:${port}/wedding_test`;
  let databaseReady = false;
  for (let i = 0; i < 60; i++) {
    try {
      execFileSync(
        'docker',
        [
          'exec',
          container,
          'pg_isready',
          '-U',
          'postgres',
          '-d',
          'wedding_test',
        ],
        { stdio: 'ignore' },
      );
      databaseReady = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (!databaseReady) throw new Error('Temporary PostgreSQL did not start.');
  await run(['scripts/migrate.mjs']);
  await run(['scripts/migrate.mjs']);
  server = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '-p', '3107'],
    { env, stdio: 'inherit' },
  );
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null)
      throw new Error('Test server exited before startup.');
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('Test server did not start.');
  await run(['--import', 'tsx', 'scripts/verify.mjs']);
} finally {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise((resolve) => server.once('exit', resolve));
  }
  if (databaseStarted)
    execFileSync('docker', ['stop', container], { stdio: 'ignore' });
}
