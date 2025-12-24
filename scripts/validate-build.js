#!/usr/bin/env node

/**
 * Build Validation Script
 * 
 * Validates that the build environment is correctly configured and
 * that all required tools are available for reproducible builds.
 * 
 * Usage:
 *   node scripts/validate-build.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
let hasErrors = false;

/**
 * Execute command and return output
 */
function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    return null;
  }
}

/**
 * Check if command exists
 */
function commandExists(command) {
  return exec(`${process.platform === 'win32' ? 'where' : 'which'} ${command}`) !== null;
}

/**
 * Check Node.js version
 */
function checkNode() {
  console.log('\n📦 Checking Node.js...');
  
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  console.log(`   Version: ${nodeVersion}`);
  
  if (major < 18) {
    console.error('   ❌ Node.js 18+ required');
    hasErrors = true;
  } else {
    console.log('   ✓ Version OK');
  }
}

/**
 * Check npm version
 */
function checkNpm() {
  console.log('\n📦 Checking npm...');
  
  if (!commandExists('npm')) {
    console.error('   ❌ npm not found');
    hasErrors = true;
    return;
  }
  
  const npmVersion = exec('npm --version');
  console.log(`   Version: ${npmVersion}`);
  console.log('   ✓ npm installed');
}

/**
 * Check Rust toolchain
 */
function checkRust() {
  console.log('\n🦀 Checking Rust...');
  
  if (!commandExists('cargo')) {
    console.error('   ❌ Rust toolchain not found');
    console.error('   Install from: https://rustup.rs');
    hasErrors = true;
    return;
  }
  
  const rustcVersion = exec('rustc --version');
  const cargoVersion = exec('cargo --version');
  
  console.log(`   rustc: ${rustcVersion}`);
  console.log(`   cargo: ${cargoVersion}`);
  
  // Check minimum Rust version (1.77.2 from Cargo.toml)
  const rustVersionMatch = rustcVersion.match(/rustc (\d+)\.(\d+)\.(\d+)/);
  if (rustVersionMatch) {
    const [_, major, minor, patch] = rustVersionMatch.map(Number);
    const minVersion = [1, 77, 2];
    
    if (major < minVersion[0] || 
        (major === minVersion[0] && minor < minVersion[1]) ||
        (major === minVersion[0] && minor === minVersion[1] && patch < minVersion[2])) {
      console.error(`   ❌ Rust 1.77.2+ required`);
      hasErrors = true;
    } else {
      console.log('   ✓ Version OK');
    }
  }
}

/**
 * Check Tauri CLI
 */
function checkTauriCli() {
  console.log('\n🦀 Checking Tauri CLI...');
  
  // Check if @tauri-apps/cli is installed
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const tauriCliVersion = 
    packageJson.devDependencies?.['@tauri-apps/cli'] ||
    packageJson.dependencies?.['@tauri-apps/cli'];
  
  if (!tauriCliVersion) {
    console.error('   ❌ @tauri-apps/cli not found in package.json');
    hasErrors = true;
  } else {
    console.log(`   Version: ${tauriCliVersion}`);
    console.log('   ✓ Tauri CLI configured');
  }
}

/**
 * Check for platform-specific dependencies
 */
function checkPlatformDeps() {
  console.log('\n🖥️  Checking platform dependencies...');
  
  if (process.platform === 'win32') {
    // Windows doesn't need additional packages for Tauri
    console.log('   Platform: Windows');
    console.log('   ✓ No additional dependencies required');
  } else if (process.platform === 'darwin') {
    console.log('   Platform: macOS');
    console.log('   ✓ Xcode Command Line Tools should be installed');
  } else if (process.platform === 'linux') {
    console.log('   Platform: Linux');
    console.log('   ⚠️  Ensure webkit2gtk and other dependencies are installed');
    console.log('   See: https://tauri.app/v2/guides/getting-started/prerequisites/#linux');
  }
}

/**
 * Check version consistency
 */
function checkVersions() {
  console.log('\n🔢 Checking version consistency...');
  
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8')
    );
    const tauriConf = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'src-tauri', 'tauri.conf.json'), 'utf8')
    );
    const cargoToml = fs.readFileSync(
      path.join(ROOT_DIR, 'src-tauri', 'Cargo.toml'),
      'utf8'
    );
    
    const cargoVersionMatch = cargoToml.match(/^version\s*=\s*"([^"]+)"/m);
    const cargoVersion = cargoVersionMatch ? cargoVersionMatch[1] : null;
    
    console.log(`   package.json:      ${packageJson.version}`);
    console.log(`   Cargo.toml:        ${cargoVersion}`);
    console.log(`   tauri.conf.json:   ${tauriConf.version}`);
    
    if (packageJson.version !== cargoVersion || cargoVersion !== tauriConf.version) {
      console.error('   ❌ Versions are not synchronized!');
      console.error('   Run: node scripts/sync-version.js <version>');
      hasErrors = true;
    } else {
      console.log('   ✓ All versions match');
    }
  } catch (error) {
    console.error(`   ❌ Error reading version files: ${error.message}`);
    hasErrors = true;
  }
}

/**
 * Check for required files
 */
function checkRequiredFiles() {
  console.log('\n📁 Checking required files...');
  
  const requiredFiles = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'src-tauri/Cargo.toml',
    'src-tauri/Cargo.lock',
    'src-tauri/tauri.conf.json',
    'src-tauri/build.rs',
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(ROOT_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✓ ${file}`);
    } else {
      console.error(`   ❌ Missing: ${file}`);
      hasErrors = true;
    }
  }
}

/**
 * Check environment variables
 */
function checkEnvironment() {
  console.log('\n🌍 Checking environment...');
  
  // Check if .env files exist (they shouldn't be committed)
  const envFiles = ['.env', '.env.local', '.env.production'];
  let hasEnvFiles = false;
  
  for (const envFile of envFiles) {
    const envPath = path.join(ROOT_DIR, envFile);
    if (fs.existsSync(envPath)) {
      console.log(`   ⚠️  Found ${envFile} (should not be committed)`);
      hasEnvFiles = true;
    }
  }
  
  if (!hasEnvFiles) {
    console.log('   ✓ No .env files found (good!)');
  }
  
  // Check if .env.example exists
  const envExamplePath = path.join(ROOT_DIR, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    console.log('   ✓ .env.example exists');
  } else {
    console.log('   ⚠️  .env.example not found (recommended)');
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 ThirdScreen Build Validation');
  console.log('================================');
  
  checkNode();
  checkNpm();
  checkRust();
  checkTauriCli();
  checkPlatformDeps();
  checkVersions();
  checkRequiredFiles();
  checkEnvironment();
  
  console.log('\n================================');
  
  if (hasErrors) {
    console.error('❌ Build validation failed');
    console.error('\nPlease fix the errors above before building.');
    process.exit(1);
  } else {
    console.log('✅ Build environment is ready!');
    console.log('\nNext steps:');
    console.log('  Development: npm run tauri:dev');
    console.log('  Production:  npm run tauri:build');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkNode, checkRust, checkVersions };
