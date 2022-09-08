import core from '@actions/core';
import {getOctokit} from '@actions/github';

const OUTPUT = {
    ENV: "env",
    BRANCH_NAME: "branch_name",
    TAGS: "tags",
    VERSION: "version",
    EVENT_NAME: "event_name",
    CREATED: "created",
};

export async function run() {
    const github = getOctokit(process.env.GITHUB_TOKEN!, {});
    let eventName: any = process.env.github;

    // 输出结果
    core.setOutput(OUTPUT.ENV, null);
    core.setOutput(OUTPUT.BRANCH_NAME, null);
    core.setOutput(OUTPUT.TAGS, null);
    core.setOutput(OUTPUT.VERSION, null);
    core.setOutput(OUTPUT.EVENT_NAME, null);
    core.setOutput(OUTPUT.CREATED, null);
}
