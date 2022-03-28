import { checkNotCommit, getCurrenBranchName, mergeBranch, openRepository, pull, switchBranch, push } from "./git"

export type AppOption = {
  check?: string
  autoMerge?: string
  entry?: string
}

/** 检测分支程序 */
async function checkApp(options: AppOption) {
  const repo = await openRepository(options.entry || '');
  const currenBranch = await getCurrenBranchName(repo);
  if (options.check !== currenBranch) throw `错误：当前git分支不是${options.check} \n`
}

/**
 * 自动合并分支程序
 * @param options 
 */
async function autoMerge(options: AppOption) {
  const repo = await openRepository(options.entry || '');
  await checkNotCommit(repo);
  await pull(repo);
  const fromBranch = await await getCurrenBranchName(repo);
  const targetBranch = options.autoMerge as string
  await switchBranch(repo, targetBranch);
  await mergeBranch(repo, fromBranch);
  // await push(repo);
}

export default async function main(options: AppOption) {
  try {
    if (options.check) {
      await checkApp(options);
    }
  
    if(options.autoMerge) {
      await autoMerge(options)
    }
  } catch (error) {
    console.error('\x1B[31m', error);
    throw error;
  }

}