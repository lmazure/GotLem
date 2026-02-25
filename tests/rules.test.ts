import { test, describe } from 'node:test';
import assert from 'node:assert';
import { RuleEngine } from '../src/rules.js';
import { GitLabIssue, GitLabEpic, GitLabMilestone, Rule } from '../src/types.js';

describe('RuleEngine', () => {
    const engine = new RuleEngine();
    const mockIssue: GitLabIssue = {
        id: 1,
        iid: 101,
        title: 'Fix bug',
        description: 'Important bug',
        labels: ['bug', 'critical'],
        web_url: 'https://gitlab.com/issue/101',
        project_id: 1,
        type: 'ISSUE'
    };

    const mockMilestones: GitLabMilestone[] = [
        { id: 1, title: 'v1.0', state: 'active' }
    ];

    test('should match simple perimeter', () => {
        const rule: Rule = {
            name: 'Test Rule',
            version: 1,
            perimeter: 'true',
            comment: 'Match'
        };
        const result = engine.evaluate(mockIssue, rule, mockMilestones, '', '');
        assert.ok(result);
        assert.strictEqual(result.proposedComment, 'Match');
    });

    test('should match hasNoMilestone helper', () => {
        const rule: Rule = {
            name: 'No Milestone',
            version: 1,
            perimeter: '{{#if (hasNoMilestone)}}true{{/if}}',
            comment: 'No milestone found'
        };
        const result = engine.evaluate(mockIssue, rule, mockMilestones, '', '');
        assert.ok(result);
        assert.strictEqual(result.proposedComment, 'No milestone found');
    });

    test('should NOT match hasNoMilestone helper when milestone is present', () => {
        const issueWithMilestone: GitLabIssue = { ...mockIssue, milestone: { title: 'v1.0' } };
        const rule: Rule = {
            name: 'No Milestone',
            version: 1,
            perimeter: '{{#if (hasNoMilestone)}}true{{/if}}',
            comment: 'No milestone found'
        };
        const result = engine.evaluate(issueWithMilestone, rule, mockMilestones, '', '');
        assert.strictEqual(result, null);
    });

    test('should match hasLabel helper', () => {
        const rule: Rule = {
            name: 'Bug Label',
            version: 1,
            perimeter: "{{#if (hasLabel 'bug')}}true{{/if}}",
            comment: 'Bug found'
        };
        const result = engine.evaluate(mockIssue, rule, mockMilestones, '', '');
        assert.ok(result);
        assert.strictEqual(result.proposedComment, 'Bug found');
    });

    test('should support and logic', () => {
        const rule: Rule = {
            name: 'And Logic',
            version: 1,
            perimeter: "{{#if (and (hasLabel 'bug') (hasNoMilestone))}}true{{/if}}",
            comment: 'Bug without milestone'
        };
        const result = engine.evaluate(mockIssue, rule, mockMilestones, '', '');
        assert.ok(result);
    });

    test('should handle getCurrentMilestone helper', () => {
        const rule: Rule = {
            name: 'Current Milestone',
            version: 1,
            perimeter: 'true',
            comment: 'Milestone: {{getCurrentMilestone}}'
        };
        const result = engine.evaluate(mockIssue, rule, mockMilestones, '', '');
        assert.ok(result);
        assert.strictEqual(result.proposedComment, 'Milestone: v1.0');
    });

    test('should error if multiple milestones are active', () => {
        const multipleMilestones = [
            { id: 1, title: 'v1.0', state: 'active' },
            { id: 2, title: 'v1.1', state: 'active' }
        ];
        const rule: Rule = {
            name: 'Current Milestone',
            version: 1,
            perimeter: 'true',
            comment: 'Milestone: {{getCurrentMilestone}}'
        };
        const result = engine.evaluate(mockIssue, rule, multipleMilestones, '', '');
        assert.ok(result);
        assert.match(result.proposedComment, /^Error: Multiple open milestones found/);
    });

    test('should error if hasNoMilestone is called on an Epic', () => {
        const mockEpic: GitLabEpic = {
            id: 2,
            iid: 201,
            title: 'Big Epic',
            description: 'Main epic',
            labels: [],
            web_url: 'https://gitlab.com/epic/201',
            group_id: 1,
            type: 'EPIC'
        };
        const rule: Rule = {
            name: 'No Milestone',
            version: 1,
            perimeter: '{{#if (hasNoMilestone)}}true{{/if}}',
            comment: 'No milestone found'
        };
        const result = engine.evaluate(mockEpic, rule, [], '', '');
        assert.ok(result);
        assert.strictEqual(result.proposedComment, 'Error: hasNoMilestone helper is only supported for Issues, not Epics.');
    });

    test('should match isIssue helper for issues', () => {
        const rule: Rule = {
            name: 'Issue Check',
            version: 1,
            perimeter: '{{#if (isIssue)}}true{{/if}}',
            comment: 'This is an issue'
        };
        const result = engine.evaluate(mockIssue, rule, mockMilestones, '', '');
        assert.ok(result);
        assert.strictEqual(result.proposedComment, 'This is an issue');
    });

    test('should NOT match isIssue helper for epics', () => {
        const mockEpic: GitLabEpic = {
            id: 2,
            iid: 201,
            title: 'Big Epic',
            description: 'Main epic',
            labels: [],
            web_url: 'https://gitlab.com/epic/201',
            group_id: 1,
            type: 'EPIC'
        };
        const rule: Rule = {
            name: 'Issue Check',
            version: 1,
            perimeter: '{{#if (isIssue)}}true{{/if}}',
            comment: 'This is an issue'
        };
        const result = engine.evaluate(mockEpic, rule, [], '', '');
        assert.strictEqual(result, null);
    });

    test('should match isEpic helper for epics', () => {
        const mockEpic: GitLabEpic = {
            id: 2,
            iid: 201,
            title: 'Big Epic',
            description: 'Main epic',
            labels: [],
            web_url: 'https://gitlab.com/epic/201',
            group_id: 1,
            type: 'EPIC'
        };
        const rule: Rule = {
            name: 'Epic Check',
            version: 1,
            perimeter: '{{#if (isEpic)}}true{{/if}}',
            comment: 'This is an epic'
        };
        const result = engine.evaluate(mockEpic, rule, [], '', '');
        assert.ok(result);
        assert.strictEqual(result.proposedComment, 'This is an epic');
    });

    test('should NOT match isEpic helper for issues', () => {
        const rule: Rule = {
            name: 'Epic Check',
            version: 1,
            perimeter: '{{#if (isEpic)}}true{{/if}}',
            comment: 'This is an epic'
        };
        const result = engine.evaluate(mockIssue, rule, mockMilestones, '', '');
        assert.strictEqual(result, null);
    });
});
