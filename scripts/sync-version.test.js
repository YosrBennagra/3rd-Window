/**
 * Tests for version sync script
 * 
 * These tests validate version parsing, increment logic, and file reading
 * in isolation from file system operations.
 */

// Use vitest globals (configured in vitest.config.ts)
const {
  readVersions,
  incrementVersion,
  validateSemver,
  areVersionsSynchronized,
  determineNewVersion,
  parseSemver,
} = require('./sync-version.js');

describe('sync-version', () => {
  describe('incrementVersion', () => {
    it('should increment patch version', () => {
      expect(incrementVersion('1.0.0', 'patch')).toBe('1.0.1');
      expect(incrementVersion('1.2.3', 'patch')).toBe('1.2.4');
      expect(incrementVersion('0.0.9', 'patch')).toBe('0.0.10');
    });

    it('should increment minor version and reset patch', () => {
      expect(incrementVersion('1.0.0', 'minor')).toBe('1.1.0');
      expect(incrementVersion('1.2.3', 'minor')).toBe('1.3.0');
      expect(incrementVersion('0.9.9', 'minor')).toBe('0.10.0');
    });

    it('should increment major version and reset minor and patch', () => {
      expect(incrementVersion('1.0.0', 'major')).toBe('2.0.0');
      expect(incrementVersion('1.2.3', 'major')).toBe('2.0.0');
      expect(incrementVersion('9.9.9', 'major')).toBe('10.0.0');
    });

    it('should throw on invalid semver format', () => {
      expect(() => incrementVersion('1.0', 'patch')).toThrow('Invalid semver');
      expect(() => incrementVersion('v1.0.0', 'patch')).toThrow('Invalid semver');
      expect(() => incrementVersion('1.0.0-beta', 'patch')).toThrow('Invalid semver');
      expect(() => incrementVersion('invalid', 'patch')).toThrow('Invalid semver');
    });

    it('should throw on invalid increment type', () => {
      expect(() => incrementVersion('1.0.0', 'invalid')).toThrow('Invalid increment type');
      expect(() => incrementVersion('1.0.0', 'build')).toThrow('Invalid increment type');
    });

    it('should handle edge case versions', () => {
      expect(incrementVersion('0.0.0', 'patch')).toBe('0.0.1');
      expect(incrementVersion('0.0.0', 'minor')).toBe('0.1.0');
      expect(incrementVersion('0.0.0', 'major')).toBe('1.0.0');
    });
  });

  describe('validateSemver', () => {
    it('should validate correct semver formats', () => {
      expect(validateSemver('1.0.0')).toBe(true);
      expect(validateSemver('0.0.1')).toBe(true);
      expect(validateSemver('10.20.30')).toBe(true);
      expect(validateSemver('999.999.999')).toBe(true);
    });

    it('should reject invalid semver formats', () => {
      expect(validateSemver('1.0')).toBe(false);
      expect(validateSemver('1')).toBe(false);
      expect(validateSemver('v1.0.0')).toBe(false);
      expect(validateSemver('1.0.0-beta')).toBe(false);
      expect(validateSemver('1.0.0+build')).toBe(false);
      expect(validateSemver('invalid')).toBe(false);
      expect(validateSemver('')).toBe(false);
    });
  });

  describe('areVersionsSynchronized', () => {
    it('should return true when all versions match', () => {
      const versions = { package: '1.0.0', cargo: '1.0.0', tauri: '1.0.0' };
      expect(areVersionsSynchronized(versions)).toBe(true);
    });

    it('should return false when package version differs', () => {
      const versions = { package: '1.0.1', cargo: '1.0.0', tauri: '1.0.0' };
      expect(areVersionsSynchronized(versions)).toBe(false);
    });

    it('should return false when cargo version differs', () => {
      const versions = { package: '1.0.0', cargo: '1.0.1', tauri: '1.0.0' };
      expect(areVersionsSynchronized(versions)).toBe(false);
    });

    it('should return false when tauri version differs', () => {
      const versions = { package: '1.0.0', cargo: '1.0.0', tauri: '1.0.1' };
      expect(areVersionsSynchronized(versions)).toBe(false);
    });

    it('should return false when all versions are different', () => {
      const versions = { package: '1.0.0', cargo: '2.0.0', tauri: '3.0.0' };
      expect(areVersionsSynchronized(versions)).toBe(false);
    });
  });

  describe('determineNewVersion', () => {
    const currentVersion = '1.2.3';

    it('should handle patch increment', () => {
      const result = determineNewVersion('patch', currentVersion);
      expect(result).toEqual({
        version: '1.2.4',
        isIncrement: true,
        incrementType: 'patch'
      });
    });

    it('should handle minor increment', () => {
      const result = determineNewVersion('minor', currentVersion);
      expect(result).toEqual({
        version: '1.3.0',
        isIncrement: true,
        incrementType: 'minor'
      });
    });

    it('should handle major increment', () => {
      const result = determineNewVersion('major', currentVersion);
      expect(result).toEqual({
        version: '2.0.0',
        isIncrement: true,
        incrementType: 'major'
      });
    });

    it('should handle explicit version string', () => {
      const result = determineNewVersion('2.5.0', currentVersion);
      expect(result).toEqual({
        version: '2.5.0',
        isIncrement: false
      });
    });

    it('should throw on invalid semver format', () => {
      expect(() => determineNewVersion('1.0', currentVersion))
        .toThrow('Invalid semver format');
      expect(() => determineNewVersion('invalid', currentVersion))
        .toThrow('Invalid semver format');
    });

    it('should preserve specific version format in error', () => {
      try {
        determineNewVersion('v1.0.0', currentVersion);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).toContain('v1.0.0');
        expect(error.message).toContain('X.Y.Z');
      }
    });
  });

  describe('parseSemver', () => {
    it('should parse valid semver strings', () => {
      expect(parseSemver('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
      expect(parseSemver('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 });
      expect(parseSemver('10.20.30')).toEqual({ major: 10, minor: 20, patch: 30 });
    });

    it('should throw on invalid formats', () => {
      expect(() => parseSemver('1.0')).toThrow('Invalid semver: 1.0');
      expect(() => parseSemver('v1.0.0')).toThrow('Invalid semver: v1.0.0');
      expect(() => parseSemver('1.0.0-beta')).toThrow('Invalid semver: 1.0.0-beta');
    });
  });
});
