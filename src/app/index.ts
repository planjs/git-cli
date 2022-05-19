import {
  checkNotCommit,
  getCurrenBranchName,
  mergeBranch,
  openRepository,
  pull,
  switchBranch,
  push,
} from './git';
import fs from 'fs';
import { join } from 'path';

export type AppOption = {
  check?: string;
  autoMerge?: string;
  entry?: string;
  version?: string;
};

/** 检测分支程序 */
async function checkApp(options: AppOption) {
  const repo = await openRepository(options.entry || '');
  const currenBranch = await getCurrenBranchName(repo);
  if (options.check !== currenBranch) throw new Error(`错误：当前git分支不是${options.check} \n`);
}

/**
 * 自动合并分支程序
 * @param options
 */
async function autoMerge(options: AppOption) {
  const repo = await openRepository(options.entry || '');
  await checkNotCommit(repo);
  const fromBranch = await getCurrenBranchName(repo);
  await switchBranch(repo, options.autoMerge!);
  await pull(repo);
  await mergeBranch(repo, fromBranch);
  await push(repo);
}

export default async function main(options: AppOption) {
  try {
    if (options.version) {
      const data = fs.readFileSync(join(__dirname, '../../package.json')).toString();
      const Package = JSON.parse(data);
      console.log(Package.version);
    }
    if (options.check) {
      await checkApp(options);
    }

    if (options.autoMerge) {
      await autoMerge(options);
    }
  } catch (error) {
    console.error('\x1B[31m', '');
    throw error;
  }
}
