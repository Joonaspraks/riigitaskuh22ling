const str = "jaja.mp3jaja.mp3"
const config = {extension:".mp3"};

console.log(str.replace(new RegExp(`${config.extension}$`), ".txt"));