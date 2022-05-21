#!/usr/bin/env node

import main from './app';
import { getAppOptions } from './utils/options';

const options = getAppOptions();
main(options);
