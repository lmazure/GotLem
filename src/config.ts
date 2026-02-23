import fs from 'fs';
import yaml from 'js-yaml';
import { Config } from './types.js';

export function loadConfig(configPath: string): Config {
    try {
        const fileContents = fs.readFileSync(configPath, 'utf8');
        const data = yaml.load(fileContents) as Config;

        // Basic validation
        if (!data.gitlab_url) throw new Error('config.gitlab_url is missing');
        if (!data.rules || !Array.isArray(data.rules)) throw new Error('config.rules is missing or not an array');

        return data;
    } catch (e) {
        if (e instanceof Error) {
            throw new Error(`Failed to load config: ${e.message}`);
        }
        throw new Error('An unknown error occurred while loading config');
    }
}
