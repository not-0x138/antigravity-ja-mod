const fs = require('fs');
const path = require('path');

const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local');
const RES_DIR = path.join(localAppData, 'Programs', 'antigravity', 'resources');
const ASAR_PATH = path.join(RES_DIR, 'app.asar');
const BAK_PATH = path.join(RES_DIR, 'app.asar.bak');

function restore() {
  console.log('============================================');
  console.log('   Antigravity Japanese Localization Restore');
  console.log('============================================\n');

  if (!fs.existsSync(BAK_PATH)) {
    console.error('[Error] Backup file app.asar.bak not found at:');
    console.error('       ', BAK_PATH);
    console.error('\nCannot restore without backup.');
    process.exit(1);
  }

  try {
    fs.copyFileSync(BAK_PATH, ASAR_PATH);
    console.log('[SUCCESS] Original app.asar restored successfully!');
    console.log('Antigravity has been reverted to the official English state.\n');
  } catch (err) {
    if (err.code === 'EBUSY' || err.code === 'EPERM') {
      console.log('\n[Notice] Antigravity is currently running.');
      console.log('Please close Antigravity completely and re-run uninstall.bat.');
      process.exit(1);
    } else {
      console.error('[Error] Restoring backup failed:', err.message);
      process.exit(1);
    }
  }
}

restore();
