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

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json');
const CARGO_TOML = path.join(ROOT_DIR, 'src-tauri', 'Cargo.toml');
const TAURI_CONF = path.join(ROOT_DIR, 'src-tauri', 'tauri.conf.json');

/**
 * Read current versions from all config files
 */
function readVersions() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    const tauriConf = JSON.parse(fs.readFileSync(TAURI_CONF, 'utf8'));
    
    if (!packageJson.version) {
      throw new Error('package.json missing version field');
    }
    if (!tauriConf.version) {
      throw new Error('tauri.conf.json missing version field');
    }
    
    const cargoToml = fs.readFileSync(CARGO_TOML, 'utf8');
    const cargoVersionMatch = cargoToml.match(/^version\s*=\s*"([^"]+)"/m);
    const cargoVersion = cargoVersionMatch ? cargoVersionMatch[1] : 'unknown';
    
    return {
      package: packageJson.version,
      cargo: cargoVersion,
      tauri: tauriConf.version
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Configuration file not found: ${error.path}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in configuration file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate semantic version format
 */
function validateSemver(version) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)$/;
  return semverRegex.test(version);
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
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10)
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
  try {
    const data = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    data.version = version;
    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`[OK] Updated package.json to ${version}`);
  } catch (error) {
    throw new Error(`Failed to update package.json: ${error.message}`);
  }
}

/**
 * Update version in Cargo.toml
 */
function updateCargoToml(version) {
  try {
    let data = fs.readFileSync(CARGO_TOML, 'utf8');
    const updated = data.replace(
      /^version\s*=\s*"[^"]+"/m,
      `version = "${version}"`
    );
    
    if (updated === data) {
      throw new Error('Version field not found in Cargo.toml');
    }
    
    fs.writeFileSync(CARGO_TOML, updated, 'utf8');
    console.log(`[OK] Updated Cargo.toml to ${version}`);
  } catch (error) {
    throw new Error(`Failed to update Cargo.toml: ${error.message}`);
  }
}

/**
 * Update version in tauri.conf.json
 */
function updateTauriConf(version) {
  try {
    const data = JSON.parse(fs.readFileSync(TAURI_CONF, 'utf8'));
    data.version = version;
    fs.writeFileSync(TAURI_CONF, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`[OK] Updated tauri.conf.json to ${version}`);
  } catch (error) {
    throw new Error(`Failed to update tauri.conf.json: ${error.message}`);
  }
}

/**
 * Check if all versions are synchronized
 */
function areVersionsSynchronized(versions) {
  return versions.package === versions.cargo &&
         versions.cargo === versions.tauri;
}

/**
 * Determine new version from command line argument
 */
function determineNewVersion(arg, currentVersion) {
  if (['major', 'minor', 'patch'].includes(arg)) {
    return {
      version: incrementVersion(currentVersion, arg),
      isIncrement: true,
      incrementType: arg
    };
  }
  
  if (!validateSemver(arg)) {
    throw new Error(`Invalid semver format: ${arg}. Version must be in format X.Y.Z (e.g., 1.2.3)`);
  }
  
  return {
    version: arg,
    isIncrement: false
  };
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  let currentVersions;
  try {
    currentVersions = readVersions();
  } catch (error) {
    console.error(`\n[ERROR] Error reading version files: ${error.message}`);
    process.exit(1);
  }
  
  // Display current versions
  console.log('\n[INFO] Current Versions:');
  console.log(`   package.json:      ${currentVersions.package}`);
  console.log(`   Cargo.toml:        ${currentVersions.cargo}`);
  console.log(`   tauri.conf.json:   ${currentVersions.tauri}`);
  
  // Check if versions are in sync
  const allSame = areVersionsSynchronized(currentVersions);
  
  if (allSame) {
    console.log('\n[OK] All versions are synchronized');
  } else {
    console.log('\n[WARN] Warning: Versions are not synchronized!');
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
  
  // Determine new version
  let versionInfo;
  try {
    versionInfo = determineNewVersion(args[0], currentVersions.package);
  } catch (error) {
    console.error(`\n[ERROR] Error: ${error.message}`);
    process.exit(1);
  }
  
  const newVersion = versionInfo.version;
  
  if (versionInfo.isIncrement) {
    console.log(`\n[BUMP] Incrementing ${versionInfo.incrementType} version: ${currentVersions.package} -> ${newVersion}`);
  } else {
    console.log(`\n[SET] Setting version to: ${newVersion}`);
  }
  
  // Update all files
  try {
    updatePackageJson(newVersion);
    updateCargoToml(newVersion);
    updateTauriConf(newVersion);
    
    console.log(`\n[SUCCESS] Successfully synchronized all versions to ${newVersion}`);
    console.log('\nNext steps:');
    console.log('  1. Review changes: git diff');
    console.log('  2. Commit: git commit -am "chore: bump version to ' + newVersion + '"');
    console.log('  3. Tag: git tag v' + newVersion);
    console.log('  4. Push: git push && git push --tags');
  } catch (error) {
    console.error(`\n[ERROR] Error updating files: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { 
  readVersions, 
  incrementVersion, 
  validateSemver,
  areVersionsSynchronized,
  determineNewVersion,
  parseSemver
};
