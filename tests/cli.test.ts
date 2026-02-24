import { test, describe } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

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
});
