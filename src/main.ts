import {run} from "./core";
import * as core from "@actions/core";

export interface Inputs {
    debug?: boolean;
}

export interface Outputs {
    workflow?: string;
    env?: string;
    source_branch?: string;
    target_branch?: string;
    tag?: string;
    version?: string;
    event_name?: string;
    created_at?: string;
    sender?: string;
    name?: string;
    full_name?: string;
    owner?: string;
    ref?: string;
    sha?: string;
    repo_url?: string;
    action_html_url?: string;
    repo_html_url?: string;
    commit_html_url?: string;
    commit_body?: string;

    [key: string]: any
}

let getInput = (): Inputs => ({
    debug: core.getInput('debug') === 'true'
})

let handleOutput = (output: Outputs = {}) => {
    Object.keys(output).forEach((key) => core.setOutput(key, output[key]));
    debugPrintf('输出变量: ', output);
};

try {
    handleOutput(run(getInput()))
} catch (error: any) {
    core.setFailed(error?.message);
}

export function debugPrintf(...args: any) {
    if (getInput().debug) {
        console.log(...args);
    }
}
