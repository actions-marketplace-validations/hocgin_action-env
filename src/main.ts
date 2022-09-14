import {run} from "./core";
import * as core from "@actions/core";

export interface Inputs {
    debug?: boolean;
    offset_hours: number;
}

export interface Outputs {
    env?: string;
    source_branch?: string;
    target_branch?: string;
    tag?: string;
    version?: string;

    action_event_name?: string;
    action_html_url?: string;
    action_workflow?: string;
    action_trigger_at?: string;

    sender?: string;
    sender_avatar_url?: string;
    sender_html_url?: string;

    repo_name?: string;
    repo_full_name?: string;
    repo_owner?: string;
    repo_homepage?: string;
    repo_description?: string;
    repo_html_url?: string;
    repo_language?: string;

    commit_html_url?: string;
    commit_body?: string;
    commit_ref?: string;
    commit_sha?: string;

    [key: string]: any
}

let getInput = (): Inputs => ({
    debug: core.getInput('debug') === 'true',
    offset_hours: parseInt(core.getInput('offset_hours', {required: true}) ?? '8')
})

let handleOutput = (output: Outputs = {}) => {
    Object.keys(output).forEach((key) => core.setOutput(key, output[key]));
    debugPrintf('输出变量: ', output);
};

export function debugPrintf(...args: any) {
    if (getInput().debug) console.log(...args)
}

try {
    handleOutput(run(getInput()));
} catch (error: any) {
    core.setFailed(error?.message);
}
