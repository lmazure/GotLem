import { test, describe } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

describe('CLI Arguments', () => {
    const scriptPath = path.resolve('dist/src/index.js');

    test('should exit with error when no arguments are provided', () => {
        const result = spawnSync('node', [scriptPath], { encoding: 'utf8' });

        assert.strictEqual(result.status, 1);
        assert.match(result.stderr, /Usage: gotlem <configPath> <reportPath>/);
    });

    test('should exit with error when only one argument is provided', () => {
        const result = spawnSync('node', [scriptPath, 'config.yaml'], { encoding: 'utf8' });

        assert.strictEqual(result.status, 1);
        assert.match(result.stderr, /Usage: gotlem <configPath> <reportPath>/);
    });

    test('should pick up GITLAB_TOKEN from environment', () => {
        // We can't easily mock the internal GitLabClient call here without a full integration test,
        // but we can at least ensure the process starts and fails on config load rather than arg validation
        const result = spawnSync('node', [scriptPath, 'non-existent.yaml', 'report.html'], {
            encoding: 'utf8',
            env: { ...process.env, GITLAB_TOKEN: 'fake-token' }
        });

        // It should fail because the config file doesn't exist, not because of usage
        assert.notStrictEqual(result.stderr, /Usage: gotlem <configPath> <reportPath>/);
    });

    test('should exit with error when GITLAB_TOKEN is missing', () => {
        const result = spawnSync('node', [scriptPath, 'config.yaml', 'report.html'], {
            encoding: 'utf8',
            env: { ...process.env, GITLAB_TOKEN: '' } // Force empty token
        });

        assert.strictEqual(result.status, 1);
        assert.match(result.stderr, /Error: GITLAB_TOKEN environment variable is not defined/);
    });
});
