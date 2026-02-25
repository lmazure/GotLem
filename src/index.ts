import { loadConfig } from './config.js';
import { GitLabClient } from './gitlab.js';
import { RuleEngine, EvaluationResult } from './rules.js';
import open from 'open';
import path from 'path';
import { generateReport, saveReport } from './report.js';
import 'dotenv/config';

async function main() {
    const configPath = process.argv[2];
    const reportPath = process.argv[3];

    if (!configPath || !reportPath) {
        console.error('Usage: gotlem <configPath> <reportPath>');
        process.exit(1);
    }

    try {
        const token = process.env.GITLAB_TOKEN;
        if (!token) {
            console.error('Error: GITLAB_TOKEN environment variable is not defined.');
            process.exit(1);
        }

        console.log('--- GotLem Analysis Starting ---');
        const config = loadConfig(configPath);
        const client = new GitLabClient(config.gitlab_url, token);
        const engine = new RuleEngine();
        const results: EvaluationResult[] = [];

        // Analysis of Projects
        if (config.scope.projects) {
            for (const projectPath of config.scope.projects) {
                console.log(`Analyzing project: ${projectPath}...`);
                try {
                    const issues = await client.getProjectIssues(projectPath);
                    const milestones = await client.getProjectMilestones(projectPath);

                    for (const issue of issues) {
                        for (const rule of config.rules) {
                            const res = engine.evaluate(issue, rule, milestones, config.comment_prefix, config.comment_suffix);
                            if (res) results.push(res);
                        }
                    }
                } catch (e) {
                    console.error(`Error analyzing project ${projectPath}:`, e instanceof Error ? e.message : e);
                }
            }
        }

        // Analysis of Groups
        if (config.scope.groups) {
            const projectMilestonesCache = new Map<number, any[]>();

            for (const groupPath of config.scope.groups) {
                console.log(`Analyzing group: ${groupPath}...`);
                try {
                    // Epics (recursively)
                    const epics = await client.getGroupEpics(groupPath);
                    const groupMilestones = await client.getGroupMilestones(groupPath);

                    for (const epic of epics) {
                        for (const rule of config.rules) {
                            const res = engine.evaluate(epic, rule, groupMilestones, config.comment_prefix, config.comment_suffix);
                            if (res) results.push(res);
                        }
                    }

                    // Issues from all projects in group (recursively)
                    const groupIssues = await client.getGroupIssues(groupPath);
                    for (const issue of groupIssues) {
                        if (!projectMilestonesCache.has(issue.project_id)) {
                            const pMilestones = await client.getProjectMilestones(issue.project_id);
                            projectMilestonesCache.set(issue.project_id, pMilestones);
                        }
                        const milestones = projectMilestonesCache.get(issue.project_id)!;
                        for (const rule of config.rules) {
                            const res = engine.evaluate(issue, rule, milestones, config.comment_prefix, config.comment_suffix);
                            if (res) results.push(res);
                        }
                    }
                } catch (e) {
                    console.error(`Error analyzing group ${groupPath}:`, e instanceof Error ? e.message : e);
                }
            }
        }

        console.log(`Analysis complete. ${results.length} proposed improvements found.`);

        if (results.length === 0) {
            console.log('No issues found to report.');
        }
        const html = generateReport(results, config.gitlab_url);
        saveReport(html, reportPath);

        console.log(`Report generated: ${reportPath}`);
        const absoluteReportPath = path.resolve(reportPath);
        console.log(`Opening report: ${absoluteReportPath}`);
        await open(absoluteReportPath);

    } catch (error) {
        if (error instanceof Error) {
            console.error('Fatal Error:', error.message);
        } else {
            console.error('An unexpected fatal error occurred.');
        }
        process.exit(1);
    }
}

main();
