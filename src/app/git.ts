import Git from "nodegit";
import { join } from "path";
import shell from "shelljs";

/**
 * 打开仓库
 * @param path
 * @returns repo
 */
export async function openRepository(path: string): Promise<Git.Repository> {
  if (path[0] === "/") return Git.Repository.open(path);
  else {
    return Git.Repository.open(join(process.cwd(), path));
  }
}

/**
 * 检测是否存在没有commit的文件修改
 * @param repo
 */
export async function checkNotCommit(
  repo: Git.Repository
): Promise<Git.Repository> {
  try {
    const res = await repo.getStatus();
    if (res.length === 0) return Promise.resolve(repo);

    console.log("\x1B[33m", "发现存在文件未保存 🌝 \n");

    res.forEach((file) => {
      console.log("\x1B[32m", `* ${file.path()}`);
    });

    console.log("\x1B[31m", "\n 请保存文件后重试");

    throw "存未保存文件，终止程序 \n";
  } catch (error) {
    return Promise.reject(error);
  }
}

/** 拉取代码 */
export async function pull(repo: Git.Repository) {
  await shell.cd(repo.workdir());
  await shell.exec("git pull");
  return Promise.resolve(repo);
}

/**
 * 获取当前分支名称
 * @param repo
 * @returns
 */
export async function getCurrenBranchName(
  repo: Git.Repository
): Promise<string> {
  try {
    const branch = await repo.getCurrentBranch();
    const branchName = branch.name();
    return Promise.resolve(branchName.replace("refs/heads/", ""));
  } catch (error) {
    return Promise.reject(error);
  }
}

type BranchList = {
  heads: string[];
  remotes: string[];
};

/**
 * 获取分支列表
 * @param repo
 * @returns BranchList
 */
export async function getBranchList(repo: Git.Repository): Promise<BranchList> {
  const result: BranchList = {
    heads: [],
    remotes: [],
  };
  try {
    const list = await repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
    list.forEach((item) => {
      if (/^refs\/heads\//.test(item))
        result.heads.push(item.replace("refs/heads/", ""));
      else result.remotes.push(item.replace("refs/remotes/origin/", ""));
    });

    return Promise.resolve(result);
  } catch (error) {
    return Promise.resolve(result);
  }
}

/**
 * 切换分支
 * @param repo 仓库对象
 * @param branchName 目标分支名称
 */
export async function switchBranch(
  repo: Git.Repository,
  name: string
): Promise<Git.Repository> {
  try {
    const currenBranch = await getCurrenBranchName(repo);
    if (currenBranch === name) return Promise.resolve(repo); // 当前分支与目标分支一致

    const branch = await getBranchList(repo);

    /** 远程和本地都存在或者本地存在，直接切换 */
    if (branch.heads.includes(name) && branch.remotes.includes(name)) {
      await repo.checkoutBranch(name);
      return repo;
    }

    /** 远程存在，本地不存在 */
    if (branch.remotes.includes(name)) {
      const commit = await repo.getHeadCommit();
      const res = await repo.createBranch(name, commit, false);
      await repo.checkoutBranch(name);

      // 关联远端分支
      await Git.Branch.setUpstream(res, `origin/${name}`);

      // 更新本地分支
      await repo.mergeBranches(name, `origin/${name}`);
      return repo;
    }

    /** 本地存在，远程不存在 */
    if (branch.heads.includes(name)) {
      await repo.checkoutBranch(name);
      shell.cd(repo.workdir());
      await shell.exec(`git push --set-upstream origin ${name}`);
      return repo;
    }

    /** 远程本地不存在，本地不存在 */
    const commit = await repo.getHeadCommit();
    await repo.createBranch(name, commit, false);
    await repo.checkoutBranch(name);
    shell.cd(repo.workdir());
    await shell.exec(`git push --set-upstream origin ${name}`);
    return repo;

    
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * 合并其他分支
 * @param fromBranch
 */
export async function mergeBranch(
  repo: Git.Repository,
  fromBranch: string
): Promise<Git.Repository> {
  try {
    const current = await getCurrenBranchName(repo);
    await repo.mergeBranches(current, fromBranch).catch(async (err) => {
      if (err.hasConflicts()) {

        // 遍历冲突的文件
        const conflictEntriesByPath = await getConflictEntriesByPath(err);
        conflictEntriesByPath.forEach((item) => {
          console.log("\x1B[34m", ` -> ${item}`);
        });

        // 回退分支
        await repo.checkoutBranch(fromBranch);
        throw `合并分支失败，请手动把 ${fromBranch} 合并到 ${current} 后重试 \n`;
      }

      throw err;
    });

    return Promise.resolve(repo);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function push(repo: Git.Repository) {
  shell.cd(repo.workdir());
  await shell.exec(`git push`);
}

/**
 * 获取冲突文件的内容
 * @param index
 * @returns
 */
async function getConflictEntriesByPath(index: Git.Index) {
  const entries = index.entries();
  const conflictEntryPath = entries.reduce((_conflictEntryNames, entry) => {
    if (Git.Index.entryIsConflict(entry)) _conflictEntryNames.add(entry.path);
    return _conflictEntryNames;
  }, new Set<string>());

  return conflictEntryPath;
}
