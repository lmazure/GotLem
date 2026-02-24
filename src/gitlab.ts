import axios, { AxiosInstance } from 'axios';
import { GitLabIssue, GitLabEpic, GitLabMilestone } from './types.js';

export class GitLabClient {
    private client: AxiosInstance;

    constructor(private baseUrl: string, private pat?: string) {
        if (!baseUrl) {
            throw new Error('GitLab Base URL is required');
        }
        this.client = axios.create({
            baseURL: `${baseUrl.replace(/\/$/, '')}/api/v4`,
            headers: pat ? { 'PRIVATE-TOKEN': pat } : {},
        });
    }

    private async fetchPaginated<T>(url: string, params: any = {}): Promise<T[]> {
        let results: T[] = [];
        let page = 1;
        const perPage = 100;

        while (true) {
            const response = await this.client.get(url, {
                params: { ...params, page, per_page: perPage },
            });
            results = results.concat(response.data);

            const nextHeader = response.headers['x-next-page'];
            if (!nextHeader || nextHeader === '') {
                break;
            }
            page = parseInt(nextHeader, 10);
        }

        return results;
    }

    async getProjectIssues(projectPath: string): Promise<GitLabIssue[]> {
        const encodedPath = encodeURIComponent(projectPath);
        const issues = await this.fetchPaginated<GitLabIssue>(`/projects/${encodedPath}/issues`, { state: 'opened' });
        return issues.map(i => ({ ...i, type: 'ISSUE' }));
    }

    async getGroupEpics(groupPath: string): Promise<GitLabEpic[]> {
        const encodedPath = encodeURIComponent(groupPath);
        const epics = await this.fetchPaginated<GitLabEpic>(`/groups/${encodedPath}/epics`, {
            state: 'opened',
            include_descendant_groups: true
        });
        return epics.map(e => ({ ...e, type: 'EPIC' }));
    }

    async getGroupIssues(groupPath: string): Promise<GitLabIssue[]> {
        const encodedPath = encodeURIComponent(groupPath);
        const issues = await this.fetchPaginated<GitLabIssue>(`/groups/${encodedPath}/issues`, {
            state: 'opened',
            include_subgroups: true
        });
        return issues.map(i => ({ ...i, type: 'ISSUE' }));
    }

    async getProjectMilestones(projectPath: string | number): Promise<GitLabMilestone[]> {
        const encodedPath = typeof projectPath === 'string' ? encodeURIComponent(projectPath) : projectPath;
        return this.fetchPaginated<GitLabMilestone>(`/projects/${encodedPath}/milestones`, { state: 'active' });
    }

    async getGroupMilestones(groupPath: string): Promise<GitLabMilestone[]> {
        const encodedPath = encodeURIComponent(groupPath);
        return this.fetchPaginated<GitLabMilestone>(`/groups/${encodedPath}/milestones`, { state: 'active' });
    }
}
