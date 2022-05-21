const fs = require('fs-extra');
const path = require('path');
const app = require('../lib/index').default;
const shelljs = require('shelljs');

async function mainTest() {
  const root = path.join(__dirname, 'repo/');
  try {
    await fs.remove(root);
    await fs.ensureDir(root);
    shelljs.cd(root);
    shelljs.exec('git init -b master');
    shelljs.exec('git status');
    shelljs.exec('git checkout -b master');
    await fs.ensureFile(`${root}/1.txt`);
    await fs.writeFile(`${root}/1.txt`, '1234');
    shelljs.exec('git add .');
    const suto = shelljs.exec('git commit -m "test" -n');
    console.log(suto);
    await new Promise((res) => setTimeout(res, 1000));
    await app({ version: true, entry: root });
    console.log('\x1B[32m', '检查版本操作test >>> sucesss\n');
    await app({ check: 'master', entry: root });
    console.log('\x1B[32m', '检查分支操作test >>> sucesss\n');
    await app({ autoMerge: 'develop', entry: root });
    const nowBranch = shelljs.exec('git branch --show-current');
    if (nowBranch.trim() === 'develop') {
      console.log('\x1B[32m', '创建新分支develop并自动合并操作test >>> sucesss\n');
    } else {
      throw new Error('创建新分支develop并自动合并操作test >>> error');
    }
    await app({ autoMerge: 'master', entry: root });
    console.log('\x1B[32m', '切换到并自动合并master分支test >>> sucesss\n');
  } catch (error) {
    throw new Error(error);
  }
}

mainTest();
