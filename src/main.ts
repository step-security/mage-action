import * as path from 'path';
import * as installer from './installer';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import axios, {isAxiosError} from 'axios';

async function validateSubscription(): Promise<void> {
  const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`;

  try {
    await axios.get(API_URL, {timeout: 3000});
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error('Subscription is not valid. Reach out to support@stepsecurity.io');
      process.exit(1);
    } else {
      core.info('Timeout or API not reachable. Continuing to next step.');
    }
  }
}

async function run(): Promise<void> {
  try {
    await validateSubscription();
    const version = core.getInput('version') || 'latest';
    const args = core.getInput('args');
    const workdir = core.getInput('workdir') || process.env['GITHUB_WORKSPACE'] || '.';
    const installOnly = core.getBooleanInput('install-only');
    const cacheBinary = core.getBooleanInput('cache-binary');

    const mage = await installer.getMage(version, cacheBinary);

    if (installOnly) {
      const dir = path.dirname(mage);
      core.addPath(dir);
      core.debug(`Added ${dir} to PATH`);
      return;
    }

    core.info('Running Mage...');
    await exec.exec(`${mage} ${args}`, undefined, {
      cwd: workdir
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
