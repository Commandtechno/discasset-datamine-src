const debug = true;
console.log('Running on ' + (debug ? 'debug' : 'prod') + ' mode')

const { exec } = require("child_process");
const $ = (string) => {
  log(string, "EXECUTE");
  return new Promise((resolve, reject) =>
    exec(string, (error, out, err) => {
      if (error) reject(error);
      if (out) resolve(out.toString());
      if (err) reject(err.toString());
      resolve("");
    })
  );
};

const log = debug
  ? (string, type = "INFO") =>
    console.log(
      "["
      + new Date().toLocaleTimeString()
      + "]["
      + type
      + "] "
      + string
    )
  : () => { };

if (debug) $("node clear");
const git =
  'git --git-dir="' + __dirname + '\\out\\.git" -C "' + __dirname + '\\out" ';

if (debug) run()
setInterval(run, 300000);

async function run() {
  try {
    log("Getting latest build");
    const out = await $("node download");
    if (out.endsWith("is already downloaded.\n")) return log("Latest already downloaded");

    log("Extracting assets");
    await $("node extract -skip");

    log("Staging files");
    await $(git + "add .");

    log("Checking status");
    const status = await $(git + "status");
    if (status.endsWith("nothing to commit, working tree clean\n")) return log("No changed files");

    log("Commiting");
    const hash = out.split("\n\n\n").reverse()[0].trim();
    await $(git + 'commit -m "[AUTO] ' + hash + '"');
    log("Commited");

    log("Pushing");
    await $(git + "push");
    log("Pushed build " + hash);
  } catch (e) {
    log(e);
  }
}