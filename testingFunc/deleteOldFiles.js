const fs = require("fs");

function removeOldContent() {
  const contentDir = "./deleteOldFilesTestFolder/";
  const maxSize = 3;
  const fileNames = fs.readdirSync(contentDir);

  const filesToBeRemoved = fileNames
    .map(name => {
      return {
        name: name,
        time: fs.statSync(contentDir + name).birthtime
      };
    })
    .sort((file1, file2) => file1.time - file2.time)
    .slice(maxSize);

  filesToBeRemoved.forEach(file => {
    fs.unlinkSync(contentDir + file.name);
  });
}

removeOldContent();
