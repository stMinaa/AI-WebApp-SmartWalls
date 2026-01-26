// Automated CPU profiling runner using --cpu-prof and graceful SIGINT.
// Steps:
// 1. Cleans/creates root ./profiles
// 2. Spawns backend with --cpu-prof
// 3. Waits for server start line
// 4. Issues HTTP GET load (adjust requestCount if needed)
// 5. Sends SIGINT for graceful shutdown (flushes .cpuprofile)
// 6. Lists resulting profile file paths
// Produces Chrome DevTools-compatible .cpuprofile in ./profiles

const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const profilesDir = path.join(__dirname, 'profiles');
if (fs.existsSync(profilesDir)) {
  fs.rmSync(profilesDir, { recursive: true, force: true });
}
fs.mkdirSync(profilesDir, { recursive: true });
console.log('[auto-cpu-prof] Prepared profiles directory');

const requestCount = 400; // change if you want more sampling
let serverStarted = false;
let loadStarted = false;
let completed = 0;
let pending = 0;

console.log('[auto-cpu-prof] Spawning backend with --cpu-prof');
const child = spawn(process.execPath, ['--cpu-prof', '--cpu-prof-dir=profiles', 'backend/index.js'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.on('data', data => {
  process.stdout.write(data); // echo through
  const text = data.toString();
  if (!serverStarted && /Server running on port/i.test(text)) {
    serverStarted = true;
    console.log('[auto-cpu-prof] Server reported running. Starting load...');
    startLoad();
  }
});

child.stderr.on('data', data => {
  process.stderr.write(data);
});

child.on('exit', (code, signal) => {
  console.log(`[auto-cpu-prof] Child exited code=${code} signal=${signal}`);
  listProfilesAndExit(code || 0);
});

function startLoad() {
  if (loadStarted) return;
  loadStarted = true;
  const target = 'http://localhost:5000/';
  for (let i = 0; i < requestCount; i++) {
    pending++;
    http.get(target, res => {
      res.resume();
      pending--;
      completed++;
    }).on('error', () => {
      pending--;
      completed++;
    });
  }
  waitForAll().then(() => {
    console.log('[auto-cpu-prof] Load finished. Sending SIGINT for graceful flush...');
    // Give a tiny delay so final requests settle
    setTimeout(() => {
      try {
        child.kill('SIGINT');
      } catch (e) {
        console.warn('[auto-cpu-prof] SIGINT failed, killing forcefully');
        child.kill();
      }
    }, 500);
  });
}

function waitForAll() {
  return new Promise(resolve => {
    const check = () => {
      if (pending === 0) return resolve();
      setTimeout(check, 50);
    };
    check();
  });
}

function listProfilesAndExit(code) {
  try {
    const files = fs.readdirSync(profilesDir).filter(f => /\.cpuprofile$/i.test(f));
    if (files.length === 0) {
      console.warn('[auto-cpu-prof] No .cpuprofile file found. Node may not have flushed yet or profiling produced no data.');
    } else {
      console.log('[auto-cpu-prof] Generated .cpuprofile files:');
      files.forEach(f => console.log('  -', path.join('profiles', f)));
      console.log('[auto-cpu-prof] Load them in Chrome DevTools Performance panel (Load profile).');
    }
  } catch (e) {
    console.error('[auto-cpu-prof] Error listing profiles:', e);
  }
  process.exit(code);
}

// Safety timeout in case server never starts
setTimeout(() => {
  if (!serverStarted) {
    console.error('[auto-cpu-prof] Timeout: server did not start within expected window.');
    try { child.kill('SIGINT'); } catch (_) {}
  }
}, 15000);