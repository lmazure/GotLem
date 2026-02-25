import Handlebars from 'handlebars';
import { Rule, GitLabIssue, GitLabEpic, GitLabMilestone } from './types.js';

export interface EvaluationResult {
    rule: Rule;
    item: GitLabIssue | GitLabEpic;
    proposedComment: string;
}

export class RuleEngine {
    constructor() {
        this.registerHelpers();
    }

    private registerHelpers() {
        Handlebars.registerHelper('hasNoMilestone', function (this: any) {
            const item = this.item as GitLabIssue | GitLabEpic;
            if (item.type === 'ISSUE') {
                return !item.milestone;
            }
            throw new Error('hasNoMilestone helper is only supported for Issues, not Epics.');
        });

        Handlebars.registerHelper('hasLabel', function (this: any, label: string) {
            const item = this.item as GitLabIssue | GitLabEpic;
            return item.labels.includes(label);
        });

        Handlebars.registerHelper('isIssue', function (this: any) {
            const item = this.item as GitLabIssue | GitLabEpic;
            return item.type === 'ISSUE';
        });

        Handlebars.registerHelper('isEpic', function (this: any) {
            const item = this.item as GitLabIssue | GitLabEpic;
            return item.type === 'EPIC';
        });

        Handlebars.registerHelper('and', function (...args: any[]) {
            // Last argument is the Handlebars options object
            const options = args.pop();
            return args.every(Boolean);
        });

        Handlebars.registerHelper('or', function (...args: any[]) {
            const options = args.pop();
            return args.some(Boolean);
        });

        Handlebars.registerHelper('getCurrentMilestone', function (this: any) {
            const milestones = this.milestones as GitLabMilestone[];
            if (!milestones || milestones.length === 0) {
                throw new Error('No open milestones found.');
            }
            if (milestones.length > 1) {
                throw new Error(`Multiple open milestones found (${milestones.map(m => m.title).join(', ')}).`);
            }
            return milestones[0].title;
        });
    }

    evaluate(item: GitLabIssue | GitLabEpic, rule: Rule, milestones: GitLabMilestone[], prefix: string, suffix: string): EvaluationResult | null {
        const context = { item, milestones };

        try {
            // Evaluate perimeter
            const perimeterTemplate = Handlebars.compile(rule.perimeter);
            const perimeterResult = perimeterTemplate(context).trim();

            if (perimeterResult === 'true') {
                // Evaluate comment
                const commentTemplate = Handlebars.compile(rule.comment);
                const commentBody = commentTemplate(context);
                const proposedComment = `${prefix}${commentBody}${suffix}`;

                return {
                    rule,
                    item,
                    proposedComment
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`Error evaluating rule "${rule.name}" version ${rule.version} for ${item.type} ${item.iid}:`, errorMessage);

            // We report the error in the final report
            return {
                rule,
                item,
                proposedComment: `Error: ${errorMessage}`
            };
        }

        return null;
    }
}
