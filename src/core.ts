import * as core from '@actions/core';
import * as github from '@actions/github';
import {
    PullRequestEvent, PushEvent,
    ReleaseEvent,
} from '@octokit/webhooks-definitions/schema'
import {Inputs, Outputs} from "./main";

export function run(input: Inputs): Outputs {
    let context = github.context;
    let eventName = context.eventName;
    let payload = context.payload;
    let sender = payload.sender?.name ?? context.repo.owner;
    let ref = context.ref;
    let createdAt;
    let version = 'unknown';
    let env = 'unknown';

    let targetBranchRef: (string | undefined) = ref;
    let sourceBranchRef: (string | undefined) = ref;


    let tagName;
    if (github.context.eventName === 'release') {
        const payload = github.context.payload as ReleaseEvent;
        let release = payload.release;
        tagName = release.tag_name;
        createdAt = release.created_at;

        targetBranchRef = release.target_commitish
        sourceBranchRef = targetBranchRef
    }
    if (github.context.eventName === 'pull_request') {
        const payload = github.context.payload as PullRequestEvent;
        let pullRequest = payload.pull_request;
        tagName = undefined;
        createdAt = pullRequest.created_at;
        targetBranchRef = pullRequest.base.ref
        sourceBranchRef = pullRequest.head.ref
    }
    if (github.context.eventName === 'push') {
        const payload = github.context.payload as PushEvent;
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

    return {
        env,
        target_branch: getSimpleName(targetBranchRef),
        source_branch: getSimpleName(sourceBranchRef),
        tag: tagName,
        name: context.sha,
        version,
        event_name: eventName,
        created_at: createdAt as any,
        sender
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
