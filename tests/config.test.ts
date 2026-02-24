import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { loadConfig } from '../src/config.js';

describe('Config Loader', () => {
    test('should throw if config file does not exist', () => {
        // No mock needed, just point to a non-existent file
        assert.throws(() => loadConfig('really-non-existent-12345.yaml'), /no such file or directory/);
    });

    test('should throw if gitlab_url is missing', (t) => {
        t.mock.method(fs, 'readFileSync', () => 'scope:\n  projects: ["p1"]\ncomment_prefix: ""\ncomment_suffix: ""\nrules: []');
        assert.throws(() => loadConfig('fake.yaml'), /config.gitlab_url is missing/);
    });

    test('should throw if scope is missing', (t) => {
        t.mock.method(fs, 'readFileSync', () => 'gitlab_url: "http://test"\ncomment_prefix: ""\ncomment_suffix: ""\nrules: []');
        assert.throws(() => loadConfig('fake.yaml'), /config.scope is missing/);
    });

    test('should throw if no projects or groups in scope', (t) => {
        t.mock.method(fs, 'readFileSync', () => 'gitlab_url: "http://test"\nscope: {}\ncomment_prefix: ""\ncomment_suffix: ""\nrules: []');
        assert.throws(() => loadConfig('fake.yaml'), /config.scope must contain at least "projects" or "groups"/);
    });

    test('should load valid config', (t) => {
        const validYaml = `
gitlab_url: "https://gitlab.com"
scope:
  projects: ["org/proj"]
comment_prefix: "Prefix"
comment_suffix: "Suffix"
rules:
  - name: "Test"
    version: 1
    perimeter: "true"
    comment: "Hello"
`;
        t.mock.method(fs, 'readFileSync', () => validYaml);
        const config = loadConfig('fake.yaml');
        assert.strictEqual(config.gitlab_url, 'https://gitlab.com');
        assert.strictEqual(config.rules.length, 1);
    });
});
