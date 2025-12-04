#!/usr/bin/env node
/**
 * watch-errors.ts
 * CLI script to start ODAVL Insight error watcher
 */

import { ErrorWatcher } from "../src/error-watcher";

const watcher = new ErrorWatcher();
watcher.start();
