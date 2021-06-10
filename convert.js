const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const folders = ["cdn", "css", "svg"];

const { pngSize } = require("./config.json");

async function render(folder, file) {
  let image = await loadImage(`out/${folder}/${file}`);

  if (image.width > image.height) {
    image.height = Math.max(1, (image.height / image.width) * pngSize);
    image.width = pngSize;
  } else if (image.height > image.width) {
    image.width = Math.max(1, (image.width / image.height) * pngSize);
    image.height = pngSize;
  } else {
    image.width = pngSize;
    image.height = pngSize;
  }

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);
  fs.writeFileSync(
    `out/${folder}/png/${file.replace(".svg", ".png")}`,
    canvas.toBuffer()
  );
}

module.exports = (async () => {
  for (const folder of folders) {
    const existing = fs
      .readdirSync("out/" + folder + "/png")
      .filter((file) => file.endsWith(".png"));
    const svgs = fs
      .readdirSync("out/" + folder)
      .filter((file) => file.endsWith(".svg"));
    existing.forEach(
      (file) =>
        !svgs.includes(file.replace(".png", ".svg")) &&
        fs.unlinkSync("out/" + folder + "/png/" + file)
    );

    const files = svgs.filter(
      (file) => !existing.includes(file.replace(".svg", ".png"))
    );
    const max = files.length;

    for (const file of files) await render(folder, file);
    count = 1;
  }

  console.log("Completed!");
  process.exit();
})();
