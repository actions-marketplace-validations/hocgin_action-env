import {run} from "./core";
import * as core from "@actions/core";

try {
    run()
} catch (error: any) {
    core.setFailed(error?.message);
}
