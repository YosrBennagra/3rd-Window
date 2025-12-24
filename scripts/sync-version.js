#!/usr/bin/env node

/**
 * Version Sync Script
 * 
 * Ensures version consistency across package.json, Cargo.toml, and tauri.conf.json.
 * This is critical for CI/CD to ensure reproducible builds and clear release tracking.
 * 
 * Usage:
 *   node scripts/sync-version.js [version]
 * 
 * Examples:
 *   node scripts/sync-version.js 1.0.0
 *   node scripts/sync-version.js patch  # increment patch version
 *   node scripts/sync-version.js        # display current versions
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json');
const CARGO_TOML = path.join(ROOT_DIR, 'src-tauri', 'Cargo.toml');
const TAURI_CONF = path.join(ROOT_DIR, 'src-tauri', 'tauri.conf.json');

/**
 * Read current versions from all config files
 */
function readVersions() {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const tauriConf = JSON.parse(fs.readFileSync(TAURI_CONF, 'utf8'));
  
  const cargoToml = fs.readFileSync(CARGO_TOML, 'utf8');
  const cargoVersionMatch = cargoToml.match(/^version\s*=\s*"([^"]+)"/m);
  const cargoVersion = cargoVersionMatch ? cargoVersionMatch[1] : 'unknown';
  
  return {
    package: packageJson.version,
    cargo: cargoVersion,
    tauri: tauriConf.version
  };
}

/**
 * Parse semantic version string
 */
function parseSemver(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid semver: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

/**
 * Increment version by type
 */
function incrementVersion(version, type) {
  const v = parseSemver(version);
  
  switch (type) {
    case 'major':
      v.major++;
      v.minor = 0;
      v.patch = 0;
      break;
    case 'minor':
      v.minor++;
      v.patch = 0;
      break;
    case 'patch':
      v.patch++;
      break;
    default:
      throw new Error(`Invalid increment type: ${type}`);
  }
  
  return `${v.major}.${v.minor}.${v.patch}`;
}

/**
 * Update version in package.json
 */
function updatePackageJson(version) {
  const data = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  data.version = version;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated package.json to ${version}`);
}

/**
 * Update version in Cargo.toml
 */
function updateCargoToml(version) {
  let data = fs.readFileSync(CARGO_TOML, 'utf8');
  data = data.replace(
    /^version\s*=\s*"[^"]+"/m,
    `version = "${version}"`
  );
  fs.writeFileSync(CARGO_TOML, data, 'utf8');
  console.log(`✓ Updated Cargo.toml to ${version}`);
}

/**
 * Update version in tauri.conf.json
 */
function updateTauriConf(version) {
  const data = JSON.parse(fs.readFileSync(TAURI_CONF, 'utf8'));
  data.version = version;
  fs.writeFileSync(TAURI_CONF, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated tauri.conf.json to ${version}`);
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const currentVersions = readVersions();
  
  // Display current versions
  console.log('\n📦 Current Versions:');
  console.log(`   package.json:      ${currentVersions.package}`);
  console.log(`   Cargo.toml:        ${currentVersions.cargo}`);
  console.log(`   tauri.conf.json:   ${currentVersions.tauri}`);
  
  // Check if versions are in sync
  const allSame = 
    currentVersions.package === currentVersions.cargo &&
    currentVersions.cargo === currentVersions.tauri;
  
  if (!allSame) {
    console.log('\n⚠️  Warning: Versions are not synchronized!');
  } else {
    console.log('\n✓ All versions are synchronized');
  }
  
  // If no arguments, just display current versions
  if (args.length === 0) {
    console.log('\nUsage: node scripts/sync-version.js [version|major|minor|patch]');
    console.log('Examples:');
    console.log('  node scripts/sync-version.js 1.2.3    # Set specific version');
    console.log('  node scripts/sync-version.js patch    # Increment patch (1.0.0 -> 1.0.1)');
    console.log('  node scripts/sync-version.js minor    # Increment minor (1.0.0 -> 1.1.0)');
    console.log('  node scripts/sync-version.js major    # Increment major (1.0.0 -> 2.0.0)');
    return;
  }
  
  let newVersion = args[0];
  
  // Handle increment shortcuts
  if (['major', 'minor', 'patch'].includes(newVersion)) {
    const baseVersion = currentVersions.package;
    newVersion = incrementVersion(baseVersion, newVersion);
    console.log(`\n📈 Incrementing ${args[0]} version: ${baseVersion} -> ${newVersion}`);
  } else {
    // Validate semver format
    try {
      parseSemver(newVersion);
      console.log(`\n🔄 Setting version to: ${newVersion}`);
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      console.error('Version must be in semver format (e.g., 1.2.3)');
      process.exit(1);
    }
  }
  
  // Update all files
  try {
    updatePackageJson(newVersion);
    updateCargoToml(newVersion);
    updateTauriConf(newVersion);
    
    console.log(`\n✅ Successfully synchronized all versions to ${newVersion}`);
    console.log('\nNext steps:');
    console.log('  1. Review changes: git diff');
    console.log('  2. Commit: git commit -am "chore: bump version to ' + newVersion + '"');
    console.log('  3. Tag: git tag v' + newVersion);
    console.log('  4. Push: git push && git push --tags');
  } catch (error) {
    console.error(`\n❌ Error updating files: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { readVersions, incrementVersion };
