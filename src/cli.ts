#!/usr/bin/env

import main from './app';
import { getAppOptions } from './utils/options';

const options = getAppOptions();

main(options);
