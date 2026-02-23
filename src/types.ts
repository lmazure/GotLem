export interface Rule {
    name: string;
    version: number;
    perimeter: string;
    comment: string;
}

export interface Scope {
    groups?: string[];
    projects?: string[];
}

export interface Config {
    gitlab_url: string;
    scope: Scope;
    comment_prefix: string;
    comment_suffix: string;
    rules: Rule[];
}

export interface GitLabBase {
    id: number;
    iid: number;
    title: string;
    description: string;
    labels: string[];
    web_url: string;
}

export interface GitLabIssue extends GitLabBase {
    milestone?: {
        title: string;
    };
    project_id: number;
    type: 'ISSUE';
}

export interface GitLabEpic extends GitLabBase {
    group_id: number;
    type: 'EPIC';
}

export interface GitLabMilestone {
    id: number;
    title: string;
    state: string;
}
