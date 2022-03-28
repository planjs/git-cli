import { AppOption } from '../app';

const OptionMap = {
  '--check': 'check',
  '--autoMerge': 'autoMerge',
  '--entry': 'entry'
}

function argvKeyToOptionKey(argvKey: any): keyof AppOption | void {
  return OptionMap[argvKey as keyof typeof OptionMap] as keyof AppOption;
}

export function getAppOptions(option?: AppOption): AppOption {
  if (option) return option;

  const options: AppOption = {};
  const argv = process.argv.slice(2);

  argv.forEach((item) => {
    const [argvKey, val] = item.split('=');
    const key = argvKeyToOptionKey(argvKey);
    if (key) options[key] = val;
  })
  
  return options;
}