const debug = true;
console.log('Running on ' + (debug ? 'debug' : 'prod') + ' mode')

require('dotenv').config()
const { exec } = require("child_process");
const simpleGit = require('simple-git');
const git = simpleGit(__dirname + '/out');

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

/*
$('git config --global user.name ' + process.env.USERNAME)
$('git config --global user.email ' + process.env.EMAIL)
$('git config --global credential.helper cache '  + process.env.PASSWORD)
*/

if (debug) $("node clear");
else git.fetch()
setInterval(run, 900000);

async function run() {
  try {
    log("Getting latest build");
    const out = await $("node download");
    if (out.endsWith("is already downloaded.\n")) return log("Latest already downloaded");

    log("Extracting assets");
    await $("node extract -skip");

    log("Converting SVG to PNG")
    await $("node convert")

    log("Staging files");
    await git.add('.');

    log("Checking status");
    const { staged } = await git.status();
    if (!staged.length) return log("No changed files");

    log("Commiting");
    const hash = out.split("\n\n\n").reverse()[0].trim();
    await git.commit('[AUTO] ' + hash);
    log("Commited");

    log("Pushing");
    await git.push(`https://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.REPO}`);
    log("Pushed build " + hash);
  } catch (e) {
    log(e);
  }
}