import * as dayjs from "dayjs";

const doLog = (method, ...args) => {
  console[method](`[${dayjs().format("{YYYY} MM-DDTHH:mm:ss")}] ${[...args]}`);
};

const log = (...args) => doLog("log", ...args);
const warn = (...args) => doLog("warn", ...args);
const error = (...args) => doLog("error", ...args);

export const Log = {
  log,
  warn,
  error
};
