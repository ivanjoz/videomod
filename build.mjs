import path from 'path'
import fs from 'fs'
const __dirname = new URL('.', import.meta.url).pathname;

const buildFolder = path.join(__dirname,'frontend','.output','public')
const staticFolder = path.join(__dirname.replace("/frontend",""),'docs')

console.log("Build folder: ", buildFolder)
console.log("Static folder: ", staticFolder)

const buildSubFolder = [
  "", "images", "assets", "libs", "_build", path.join("_build","assets")
]

for(const folder of buildSubFolder){
  // console.log("Copiando folder:",folder)
  const buildPath = folder ? path.join(buildFolder,folder) : buildFolder
  const staticPath = folder ? path.join(staticFolder,folder) : staticFolder

  console.log("Copiando al folder destino: ", staticPath)
  if(folder){
    if(fs.existsSync(staticPath)){
      fs.rmSync(staticPath, { recursive: true, force: true })
    }
    fs.mkdirSync(staticPath)
  }
  
  const files = fs.readdirSync(buildPath)

  for(const file of files){
    const filePath = path.join(buildPath,file)
    if(fs.lstatSync(filePath).isDirectory()){ continue }
    
    const fileArray = file.split(".")
    const ext = fileArray[fileArray.length - 1]
    if(ext === "gz" || ext === "br"){ continue }
    console.log("Moviendo: ", path.join(staticPath,file))
    fs.copyFileSync(filePath, path.join(staticPath, file))
  }
}

