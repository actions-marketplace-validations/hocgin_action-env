import * as github from '@actions/github';
import {
    PullRequestEvent, PushEvent,
    ReleaseEvent,
} from '@octokit/webhooks-definitions/schema'
import {debugPrintf, Inputs, Outputs} from "./main";

export function run(input: Inputs): Outputs {
    let context = github.context;
    let eventName = context.eventName;
    let payload = context.payload;
    let ref = context.ref;
    let createdAt;
    let version;
    let env;

    let targetBranchRef: (string | undefined) = ref;
    let sourceBranchRef: (string | undefined) = ref;

    let tagName;
    if (context.eventName === 'release') {
        const payload = context.payload as ReleaseEvent;
        let release = payload.release;
        tagName = release.tag_name;
        createdAt = release.created_at;

        targetBranchRef = release.target_commitish
        sourceBranchRef = targetBranchRef
    }
    if (context.eventName === 'pull_request') {
        const payload = context.payload as PullRequestEvent;
        let pullRequest = payload.pull_request;
        tagName = undefined;
        createdAt = pullRequest.created_at;
        targetBranchRef = pullRequest.base.ref
        sourceBranchRef = pullRequest.head.ref
    }
    if (context.eventName === 'push') {
        const payload = context.payload as PushEvent;
        let commit = payload.head_commit;
        tagName = undefined;
        createdAt = commit?.timestamp;
        targetBranchRef = payload.ref
        sourceBranchRef = targetBranchRef;
    }

    let refSimpleName = getSimpleName(ref);
    if (['develop'].includes(refSimpleName) || /^develop-.*/.test(refSimpleName)) {
        env = 'test';
    } else if (['rls'].includes(refSimpleName) || /^rls-.*/.test(refSimpleName)) {
        env = 'rls';
    } else if (['feature'].includes(refSimpleName) || /^feature-.*/.test(refSimpleName)) {
        env = 'dev';
    } else if (['master', 'main'].includes(refSimpleName)
        || /^v\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(refSimpleName)) {
        env = 'prod';
    }

    if (tagName && /^v\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(tagName)) {
        version = tagName;
    } else if (refSimpleName && /^v\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(refSimpleName)) {
        version = refSimpleName;
    }
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
    let sender = payload.sender?.login;

    return {
        env,
        target_branch: getSimpleName(targetBranchRef),
        source_branch: getSimpleName(sourceBranchRef),
        tag: tagName,
        version,
        // === 触发信息 ===
        action_html_url,
        action_event_name: eventName,
        action_workflow: context.workflow,
        action_trigger_at: `${new Date().toISOString()}`,
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
        sender,
        sender_avatar_url: sender?.avatar_url,
        sender_html_url: sender?.html_url,
    }
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
