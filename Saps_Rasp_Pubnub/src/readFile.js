
const readFile = async () => {
    let burnerad = require(`./data.json`);
    console.log("mai chala hu readFile", burnerad)
    return burnerad
}

export default readFile;