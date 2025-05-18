import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  // Example rules (optional, uncomment to use):
  // rules: {
  //   'type-enum': [2, 'always', [
  //     'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 
  //     'test', 'build', 'ci', 'chore', 'revert'
  //   ]],
  //   'subject-case': [2, 'always', 'lower-case']
  // }
};

export default config;
