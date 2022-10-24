import * as github from '@actions/github';
import {
    PullRequestEvent, PushEvent,
    ReleaseEvent, WorkflowRunEvent,
} from '@octokit/webhooks-definitions/schema'
import {debugPrintf, Inputs, Outputs} from "./main";

export function run(input: Inputs): Outputs {
    let context = github.context;
    let eventName = context.eventName;
    let payload = context.payload;
    let ref = context.ref;
    let createdAt = new Date();
    let version;
    let env;

    let repository = context.payload.repository;
    let fullName = repository?.full_name;
    let repo_url = repository?.html_url;
    let name = repository?.name;
    let owner = repository?.owner;
    let repo_description = repository?.description;

    debugPrintf('github.context', context);

    let repo_homepage = repository?.homepage;
    let action_html_url = `${repo_url}/actions/runs/${context.runId}`;
    let pullRequest = payload?.pull_request;
    let commit_html_url = pullRequest?.html_url ?? `${repo_url}/commit/${context.sha}`;
    let commit_body = `${pullRequest?.body ?? `commit`}`
    let sender = payload.sender;

    let tagName = getTagName(ref);
    let sourceSimpleName = getSimpleName(ref);
    let targetBranchName = getSimpleName(ref);

    if (context.eventName === 'release') {
        const payload = context.payload as ReleaseEvent;
        let release = payload.release;

        targetBranchName = release.target_commitish
    }
    if (context.eventName === 'pull_request') {
        const payload = context.payload as PullRequestEvent;
        let pullRequest = payload.pull_request;
        targetBranchName = getSimpleName(pullRequest.base.ref)
        sourceSimpleName = getSimpleName(pullRequest.head.ref)
    }
    if (context.eventName === 'push') {
        const payload = context.payload as PushEvent;
        targetBranchName = getSimpleName(payload.ref);
    }
    if (context.eventName === 'workflow_run') {
        const payload = context.payload as WorkflowRunEvent;
        let workflowRun = payload.workflow_run;

        commit_body = `${workflowRun?.head_commit?.message}`;
        sourceSimpleName = workflowRun?.head_branch;
    }

    if (['develop'].includes(targetBranchName) || /^develop-.*/.test(targetBranchName)) {
        env = 'test';
    } else if (['rls'].includes(targetBranchName) || /^rls-.*/.test(targetBranchName)) {
        env = 'rls';
    } else if (['feature'].includes(targetBranchName) || /^feature-.*/.test(targetBranchName)) {
        env = 'dev';
    } else if (['master', 'main'].includes(targetBranchName)
        || /^v\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(targetBranchName)) {
        env = 'prod';
    }

    if (tagName && /^v\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(tagName)) {
        version = tagName;
    } else if (sourceSimpleName && /^v\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(sourceSimpleName)) {
        version = sourceSimpleName;
    }
    let version_number;
    if (`${version}`.startsWith('v')) {
        version_number = `${version}`.substring(1);
    }

    return {
        env,
        target_branch: targetBranchName,
        source_branch: sourceSimpleName,
        tag: tagName,
        version,
        version_number,
        // === 触发信息 ===
        action_html_url,
        action_event_name: eventName,
        action_workflow: context.workflow,
        action_trigger_at: DateISOString(createdAt, input.offset_hours),
        // === 仓库信息 ===
        repo_owner: owner?.login,
        repo_name: name,
        repo_full_name: fullName,
        repo_homepage,
        repo_description,
        repo_html_url: repo_url,
        repo_language: repository?.language,
        // === 提交信息 ===
        commit_html_url,
        commit_body,
        commit_ref: context.ref,
        commit_sha: context.sha,
        // === 触发人信息 ===
        sender: sender?.login,
        sender_avatar_url: sender?.avatar_url,
        sender_html_url: sender?.html_url,
    }
}

let getTagName = (ref: string): (string | undefined) => {
    ref = `${ref}`;
    if (ref.startsWith('refs/tags/')) {
        return ref.replace('refs/tags/', '');
    }
    return undefined;
}


let getSimpleName = (refName: string) => {
    refName = `${refName}`;
    if (refName.startsWith('refs/tags/')) {
        return refName.replace('refs/tags/', '');
    } else if (refName.startsWith('refs/heads/')) {
        return refName.replace('refs/heads/', '');
    }
    return refName;
};

function DateISOString(date: Date, offsetHours: number): string {
    let tzoffset = offsetHours * 60 * 60000;
    let localISOTime = (new Date(Date.now() - tzoffset)).toISOString();
    return localISOTime.slice(0, -5);
}
