"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dayjs = require("dayjs");
var doLog = function (method) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    console[method]("[" + dayjs().format("{YYYY} MM-DDTHH:mm:ss") + "] " + args.slice());
};
var log = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return doLog.apply(void 0, ["log"].concat(args));
};
var warn = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return doLog.apply(void 0, ["warn"].concat(args));
};
var error = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return doLog.apply(void 0, ["error"].concat(args));
};
exports.Logger = {
    log: log,
    warn: warn,
    error: error
};
