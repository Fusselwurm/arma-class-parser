import {parse} from './class-parser';

declare var window: {parse?: Function};

window.parse = parse;
