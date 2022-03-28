# @quan/git-utils
一个可编程和命令行的git工具集合, 基于 `nodegit` 组件包开发。

### 安装
```
npm i -g git-utils
# or 
npm i -D git-utils
```

## cli 方式调用

##### `--check=branch` 检测当前分支是否正确
```
git-us --check=test
```
如果当前分支不是 `test` 将会报错


#### `--autoMerge=targerBranch` 切换目标分支并且合并
```
git-us --autoMerge=develop
```
将当前分支合并到`develop`并且将本地分支切换到`develop`分支，失败条件：合并存在冲突、本地分支存在为commit内容。

## Node Api
#### 使用例子

```javascript
import { openRepository } from '@quan/git-utils';
const repo = openRepository(__dirname);
```

###### `openRepository(path?: string): Promise<Git.Repository>`
打开一个git仓库，path 参数为仓库目录路径。

###### `checkNotCommit(repo: Git.Repository): Promise<Git.Repository>`
检测本地分支是否存在为保存内容。

###### `function pull(repo: Git.Repository): Promise<Git.Repository>`
拉取远程仓库内容

###### `function switchBranch(repo: Git.Repository,name: string): Promise<Git.Repository>`
切换到对应分支

###### `mergeBranch(repo: Git.Repository,fromBranch: string): Promise<Git.Repository> `
合并对应的分支，如果发生冲突会合并失败。

###### `function push(repo: Git.Repository)`
推送到远程仓库中