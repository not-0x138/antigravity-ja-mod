const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Determine Antigravity resources path dynamically across any Windows machine
const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local');
const RES_DIR = path.join(localAppData, 'Programs', 'antigravity', 'resources');
const ASAR_PATH = path.join(RES_DIR, 'app.asar');
const BAK_PATH = path.join(RES_DIR, 'app.asar.bak');
const UNPACKED_DIR = path.join(RES_DIR, 'app.asar.unpacked');
const BAK_UNPACKED_DIR = path.join(RES_DIR, 'app.asar.bak.unpacked');

const WORK_DIR = __dirname;
const TEMP_EXTRACT_DIR = path.join(WORK_DIR, 'temp_extract');
const TEMP_OUTPUT_ASAR = path.join(WORK_DIR, 'app.asar.patched');

async function run() {
  console.log('============================================');
  console.log('   Antigravity Japanese Localization Mod');
  console.log('============================================\n');

  if (!fs.existsSync(ASAR_PATH)) {
    console.error('[Error] Antigravity installation not found at:');
    console.error('       ', ASAR_PATH);
    console.error('\nPlease make sure Antigravity (Windows) is installed.');
    process.exit(1);
  }

  // 1. Check if current app.asar is a fresh update (unpatched)
  console.log('[1/5] Checking application update state...');
  let isAlreadyPatched = false;
  try {
    execSync(`npx --yes asar extract-file "${ASAR_PATH}" "dist/preload.js" > nul 2>&1`);
    const extractedPreload = path.join(process.cwd(), 'dist', 'preload.js');
    if (fs.existsSync(extractedPreload)) {
      const content = fs.readFileSync(extractedPreload, 'utf8');
      if (content.includes('Antigravity Japanese Localization Mod Start')) {
        isAlreadyPatched = true;
      }
      fs.rmSync(path.join(process.cwd(), 'dist'), { recursive: true, force: true });
    }
  } catch (e) {
    // Fallback if check fails
  }

  if (!isAlreadyPatched) {
    console.log('      Clean or updated app.asar detected. Creating fresh backup...');
    fs.copyFileSync(ASAR_PATH, BAK_PATH);
    console.log('      Backup saved to:', BAK_PATH);
  } else {
    if (!fs.existsSync(BAK_PATH)) {
      console.log('      Notice: asar is already patched. Creating backup of current state.');
      fs.copyFileSync(ASAR_PATH, BAK_PATH);
    } else {
      console.log('      Using clean baseline backup:', BAK_PATH);
    }
  }

  // Ensure junction exists for app.asar.bak.unpacked
  if (!fs.existsSync(BAK_UNPACKED_DIR) && fs.existsSync(UNPACKED_DIR)) {
    try {
      execSync(`cmd /c mklink /J "${BAK_UNPACKED_DIR}" "${UNPACKED_DIR}" > nul 2>&1`);
    } catch (e) {}
  }

  // 2. Clean up temp extract directory
  if (fs.existsSync(TEMP_EXTRACT_DIR)) {
    fs.rmSync(TEMP_EXTRACT_DIR, { recursive: true, force: true });
  }

  // 3. Extract asar from clean backup
  console.log('[2/5] Extracting asar archive...');
  execSync(`npx --yes asar extract "${BAK_PATH}" "${TEMP_EXTRACT_DIR}"`, { stdio: 'inherit' });

  // 4. Patch dist/preload.js
  console.log('[3/5] Injecting localization engine into preload script...');
  const preloadPath = path.join(TEMP_EXTRACT_DIR, 'dist', 'preload.js');
  const dictData = fs.readFileSync(path.join(WORK_DIR, 'jp-dict.json'), 'utf8');
  let rendererScript = fs.readFileSync(path.join(WORK_DIR, 'jp-mod-renderer.js'), 'utf8');
  rendererScript = rendererScript.replace('__JP_MOD_DATA__', dictData);

  const preloadPatch = `\n\n// --- Antigravity Japanese Localization Mod Start ---\n${rendererScript}\n// --- Antigravity Japanese Localization Mod End ---\n`;
  fs.appendFileSync(preloadPath, preloadPatch, 'utf8');

  // 5. Patch dist/menu.js
  console.log('[4/5] Patching application menu (File, View, Window, Help)...');
  const menuPath = path.join(TEMP_EXTRACT_DIR, 'dist', 'menu.js');
  const menuPatchCode = fs.readFileSync(path.join(WORK_DIR, 'menu-patch-snippet.js'), 'utf8');
  let menuContent = fs.readFileSync(menuPath, 'utf8');
  if (menuContent.includes('electron_1.Menu.setApplicationMenu(menu);')) {
    menuContent = menuContent.replace(
      'electron_1.Menu.setApplicationMenu(menu);',
      'translateMenuItems(menu);\n    electron_1.Menu.setApplicationMenu(menu);'
    );
    menuContent += `\n\n${menuPatchCode}\n`;
    fs.writeFileSync(menuPath, menuContent, 'utf8');
  }

  // 6. Pack new asar with unpack matching
  console.log('[5/5] Repacking patched app.asar...');
  if (fs.existsSync(TEMP_OUTPUT_ASAR)) {
    fs.unlinkSync(TEMP_OUTPUT_ASAR);
  }
  execSync(`npx --yes asar pack "${TEMP_EXTRACT_DIR}" "${TEMP_OUTPUT_ASAR}" --unpack "**/node_modules/chrome-devtools-mcp/**"`, { stdio: 'inherit' });

  const newSize = fs.statSync(TEMP_OUTPUT_ASAR).size;
  console.log(`\nPatched archive created successfully (${newSize} bytes).`);

  // 7. Deploy to app resources
  try {
    console.log('Deploying to Antigravity resources...');
    fs.copyFileSync(TEMP_OUTPUT_ASAR, ASAR_PATH);
    console.log('\n[SUCCESS] Japanese Mod successfully installed!');
  } catch (err) {
    if (err.code === 'EBUSY' || err.code === 'EPERM') {
      console.log('\n[Notice] Antigravity is currently running.');
      console.log('Please close Antigravity completely and re-run install.bat.');
      process.exit(1);
    } else {
      throw err;
    }
  } finally {
    // Clean temp folder
    if (fs.existsSync(TEMP_EXTRACT_DIR)) {
      fs.rmSync(TEMP_EXTRACT_DIR, { recursive: true, force: true });
    }
    if (fs.existsSync(TEMP_OUTPUT_ASAR)) {
      fs.unlinkSync(TEMP_OUTPUT_ASAR);
    }
  }

  console.log('\n=== Done! Launch Antigravity to enjoy Japanese UI. ===');
}

run().catch(err => {
  console.error('\n[Error] Installation failed:', err.message);
  process.exit(1);
});
