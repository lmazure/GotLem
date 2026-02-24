import { test, describe, mock } from 'node:test';
import assert from 'node:assert';
import { GitLabClient } from '../src/gitlab.js';

describe('GitLabClient Recursive Fetching', () => {

    test('getGroupEpics should use include_descendant_groups', async () => {
        const client = new GitLabClient('https://gitlab.example.com', 'faketoken');

        // Mock the internal axios client's get method
        const mockGet = mock.method((client as any).client, 'get', async (url: string, config: any) => {
            assert.strictEqual(url, '/groups/mygroup/epics');
            assert.strictEqual(config.params.include_descendant_groups, true);
            return {
                data: [{ iid: 1, title: 'Epic 1' }],
                headers: {}
            };
        });

        const epics = await client.getGroupEpics('mygroup');
        assert.strictEqual(epics.length, 1);
        assert.strictEqual(epics[0].iid, 1);
        assert.strictEqual(mockGet.mock.callCount(), 1);
    });

    test('getGroupIssues should use include_subgroups', async () => {
        const client = new GitLabClient('https://gitlab.example.com', 'faketoken');

        const mockGet = mock.method((client as any).client, 'get', async (url: string, config: any) => {
            assert.strictEqual(url, '/groups/mygroup/issues');
            assert.strictEqual(config.params.include_subgroups, true);
            return {
                data: [{ iid: 10, title: 'Issue 10' }],
                headers: {}
            };
        });

        const issues = await client.getGroupIssues('mygroup');
        assert.strictEqual(issues.length, 1);
        assert.strictEqual(issues[0].iid, 10);
        assert.strictEqual(mockGet.mock.callCount(), 1);
    });

    test('getProjectMilestones should handle numeric IDs', async () => {
        const client = new GitLabClient('https://gitlab.example.com', 'faketoken');

        const mockGet = mock.method((client as any).client, 'get', async (url: string, config: any) => {
            assert.strictEqual(url, '/projects/123/milestones');
            return {
                data: [{ id: 1, title: 'v1.0' }],
                headers: {}
            };
        });

        const milestones = await client.getProjectMilestones(123);
        assert.strictEqual(milestones.length, 1);
        assert.strictEqual(mockGet.mock.callCount(), 1);
    });
});
