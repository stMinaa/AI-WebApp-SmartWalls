// Fallback CPU profiler using Node inspector API.
// Directly captures a DevTools CPU profile and writes a .cpuprofile file
// without relying on --cpu-prof flush behavior.

const fs = require('fs');
const path = require('path');
const http = require('http');
const inspector = require('inspector');

const profilesDir = path.join(__dirname, 'profiles');
if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });

// Start backend server by requiring index.js (it binds immediately)
require('./backend/index.js');
console.log('[auto-inspector-prof] Backend required, waiting for warm-up...');

const session = new inspector.Session();
session.connect();

function startProfiler() {
  session.post('Profiler.enable', () => {
    session.post('Profiler.start', () => {
      console.log('[auto-inspector-prof] Profiler started, generating load...');
      generateLoad(500).then(() => {
        console.log('[auto-inspector-prof] Load finished, stopping profiler...');
        // Small delay to include tail activity
        setTimeout(() => {
          session.post('Profiler.stop', (err, { profile }) => {
            if (err) {
              console.error('Profiler stop error:', err);
              process.exit(1);
            }
            const file = path.join(profilesDir, `CPU.inspector.${Date.now()}.cpuprofile`);
            fs.writeFileSync(file, JSON.stringify(profile));
            console.log('[auto-inspector-prof] Wrote profile:', file);
            process.exit(0);
          });
        }, 750);
      });
    });
  });
}

function generateLoad(count) {
  const target = 'http://localhost:5000/';
  let pending = 0;
  for (let i = 0; i < count; i++) {
    pending++;
    http.get(target, res => { res.resume(); pending--; }).on('error', () => { pending--; });
  }
  return new Promise(resolve => {
    const check = () => { if (pending === 0) return resolve(); setTimeout(check, 40); };
    check();
  });
}

// Give the server a moment to connect DB then start profiler
setTimeout(startProfiler, 1500);