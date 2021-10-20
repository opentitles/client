const core = require('@actions/core');
const { exec } = require('@actions/exec');
const github = require('@actions/github');
const { Toolkit } = require('actions-toolkit');
const fs = require('fs');
const { mainModule } = require('process');

const STRATEGIES = [
  '#minor',
  '#major'
];

Toolkit.run(async tools => {
  {
    try {
      // Get commit message
      // Get commit description

      // get context
      const { pusher: { email, name }, head_commit: { message } } = github.context.payload;

      // get input credentials
      const inputUser = core.getInput('user');
      const inputEmail = core.getInput('email');
      const inputBranch = core.getInput('branch');
      const unrelated = core.getInput('unrelated');
      const prefix = core.getInput('prefix');

      const userName = inputUser || name;
      const userEmail = inputEmail || email;

      const defaultStrategy = STRATEGIES.filter(strat => message.includes(strat))[0] || STRATEGIES[0];
      const strategy = defaultStrategy.replace('#', '');
      const commitMessage = message.replace(defaultStrategy, '');
      const description = message.split('\n').slice(1).join('\n').trim();

      tools.log(`Latest commit message: ${commitMessage}`);
      tools.log(`Extracted description: ${description}`)
      tools.log(`Running with ${userName} ${userEmail} and bumping strategy ${strategy}`);
      tools.log(`Branch is ${inputBranch}`);

      // git login and pull
      const pullArgs = ['pull', 'origin', inputBranch];

      if (unrelated) {
        pullArgs.push('--allow-unrelated-histories');
      }

      await exec('git', ['config', '--local', 'user.name', userName]);
      await exec('git', ['config', '--local', 'user.email', userEmail]);
      await exec('git', pullArgs);

      // version by strategy
      await exec('npm', ['version', strategy, '--no-commit-hooks', '--no-git-tag-version']);

      const version = tools.getPackageJSON().version;
      core.info(`New version is ${version}`);

      // Bump version in manifest.json
      let manifest = fs.readFileSync('src/static/manifest.json', 'utf-8');
      manifest = JSON.parse(manifest);
      manifest.version = version;
      fs.writeFileSync('src/static/manifest.json', JSON.stringify(manifest, null, 2));

      // Update changelog
      let changelog = fs.readFileSync('changelog.md', 'utf-8');
      changelog = `### OpenTitles v${version} (${new Date(Date.now()).toLocaleString('en-GB').split(',')[0]})\n${description}\n\n${changelog}`;
      fs.writeFileSync('changelog.md', changelog);
      
      // Stage all files and push new version
      const bumpCommitMessage = `${prefix || 'chore(deps):'} bump version to ${version}`
      await exec('git', ['commit', '-am', bumpCommitMessage])
      await exec('git', ['push', 'origin', `HEAD:${inputBranch}`])

      // set output version
      core.setOutput('version', version);
      core.setOutput('message', commitMessage)
      core.setOutput('description', description)
    }
    catch (error) {
      core.setFailed(error.message);
    }
  }
});