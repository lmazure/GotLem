import fs from 'fs';
import yaml from 'js-yaml';
import { Config } from './types.js';

export function loadConfig(configPath: string): Config {
    try {
        const fileContents = fs.readFileSync(configPath, 'utf8');
        const data = yaml.load(fileContents) as Config;

        // Basic validation
        if (!data.gitlab_url) throw new Error('config.gitlab_url is missing');
        if (!data.scope) throw new Error('config.scope is missing');
        if (!data.scope.projects && !data.scope.groups) throw new Error('config.scope must contain at least "projects" or "groups"');
        if (data.comment_prefix === undefined) throw new Error('config.comment_prefix is missing');
        if (data.comment_suffix === undefined) throw new Error('config.comment_suffix is missing');
        if (!data.rules || !Array.isArray(data.rules)) throw new Error('config.rules is missing or not an array');
        if (data.rules.length === 0) throw new Error('config.rules is empty');

        return data;
    } catch (e) {
        if (e instanceof Error) {
            throw new Error(`Failed to load config: ${e.message}`);
        }
        throw new Error('An unknown error occurred while loading config');
    }
}
