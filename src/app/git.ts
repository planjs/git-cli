import { join } from 'path';
import execa from 'execa';

type Repository = {
  path: string;
  stdout: string;
  execa: execa.ExecaReturnValue<string>;
};

/**
 * 打开仓库
 * @param path
 * @returns repo
 */
export async function openRepository(path: string): Promise<Repository> {
  const repositoryPtah = path[0] === '/' ? path : join(process.cwd(), path);
  const res = await execa('git', ['status'], { execPath: repositoryPtah, preferLocal: true });
  if (res.exitCode === 0 && res.stdout) {
    return { path: repositoryPtah, execa: res, stdout: res.stdout };
  }

  return Promise.reject(new Error(res.stderr));
}

/**
 * 检测是否存在没有commit的文件修改
 * @param repo
 */
export async function checkNotCommit(repo: Repository) {
  try {
    const { stdout } = await execa('git', ['diff', '--name-only'], {
      execPath: repo.path,
      preferLocal: true,
    });

    const { stdout: cachedStdout } = await execa('git', ['diff', '--cached', '--name-only'], {
      execPath: repo.path,
      preferLocal: true,
    });

    if (stdout.trim().length === 0 && cachedStdout.trim().length === 0)
      return Promise.resolve(repo);

    console.log('\x1B[33m', '发现存在文件未保存 🌝 \n');
    console.log(stdout);
    console.log(cachedStdout);
    throw '\n 请保存文件后重试';
  } catch (error) {
    return Promise.reject(error);
  }
}

/** 拉取代码 */
export async function pull(repo: Repository) {
  try {
    await execa('git', ['pull'], { execPath: repo.path, preferLocal: true });
  } catch (error) {
    return Promise.resolve(repo);
  }
  return Promise.resolve(repo);
}

/**
 * 获取当前分支名称
 * @param repo
 * @returns
 */
export async function getCurrenBranchName(repo: Repository): Promise<string> {
  const res = await execa('git', ['branch', '--show-current'], {
    execPath: repo.path,
    preferLocal: true,
  });
  return res.stdout;
}

/**
 * 获取分支列表
 * @param repo
 * @returns BranchList
 */
export async function getBranchList(repo: Repository): Promise<string[]> {
  try {
    const res = await execa('git', ['branch'], { execPath: repo.path, preferLocal: true });
    const list = res.stdout.split('\n').map((item) => item.replace(/^\*/, '').trim());
    return list;
  } catch (error) {
    return Promise.resolve([]);
  }
}

/**
 * 切换分支
 * @param repo 仓库对象
 * @param branchName 目标分支名称
 */
export async function switchBranch(repo: Repository, name: string): Promise<Repository> {
  try {
    const currenBranch = await getCurrenBranchName(repo);
    if (currenBranch === name) return Promise.resolve(repo); // 当前分支与目标分支一致

    const branchList = await getBranchList(repo);

    // 已经存在分支
    if (branchList.includes(name)) {
      await execa('git', ['checkout', name], { execPath: repo.path, preferLocal: true });
    } else {
      await execa('git', ['checkout', '-b', name], { execPath: repo.path, preferLocal: true });
    }
    return repo;
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * 合并其他分支
 * @param fromBranch
 */
export async function mergeBranch(repo: Repository, fromBranch: string): Promise<Repository> {
  const head = await getHeadCommit(repo);

  try {
    await execa('git', ['merge', fromBranch], { execPath: repo.path, preferLocal: true });
    return Promise.resolve(repo);
  } catch (error) {
    const nowBranch = await getCurrenBranchName(repo);

    // 回退操作
    await execa('git', ['reset', '--hard', head], { execPath: repo.path, preferLocal: true });
    // 回退到原始分支
    await switchBranch(repo, fromBranch);
    console.error(error);
    return Promise.reject(
      new Error(`自动合并 ${nowBranch} 分支失败，请手动合并 ${nowBranch} 后再尝试运行命令`),
    );
  }
}

export async function getHeadCommit(repo: Repository) {
  try {
    const res = await execa('git', ['rev-parse', 'HEAD'], {
      execPath: repo.path,
      preferLocal: true,
    });
    return res.stdout;
  } catch (error) {
    return '';
  }
}

export async function push(repo: Repository) {
  const name = await getCurrenBranchName(repo);

  return execa('git', ['push'], { execPath: repo.path, preferLocal: true })
    .catch(() =>
      execa('git', ['push', `--set-upstream origin ${name}`], {
        execPath: repo.path,
        preferLocal: true,
      }),
    )
    .catch(() => execa('git', ['push']))
    .catch(() => {
      console.warn('\x1B[33m', '推送仓库失败，请注意');
    });
}
