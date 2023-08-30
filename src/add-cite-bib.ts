import { window } from "vscode"
import { getBibliography, pickCiteKeys } from "./api"
import { getLatestBibName } from "./config"
import { dirname, extname, join } from "path"
import { getBibliographyKeyFromFile, insertCiteKeys } from "./utils"
import { writeFileSync } from "fs"


/**
 * 给pandoc以及latex添加citation以及bibliography
 */
export async function addCiteBib(_selected: boolean = false) {
  try {
    const editor = window.activeTextEditor
    if (editor === undefined) {
      throw new Error("No editor is active.")
    }
    var currentlyOpenTabfilePath = editor.document.uri.fsPath

    // Current file tab is not saved.
    if (currentlyOpenTabfilePath.indexOf("Untitled") !== -1) {
      throw new Error("Please SAVE Current Tab.")
    }

    // 得到bib文件的latest文件名
    const bibName = getLatestBibName()

    if (bibName.length < 5 || extname(bibName) !== ".bib") {
      throw new Error("bibName is invalid or its length is less than 5.")
    }

    // Create bib Path
    var parentDir = dirname(currentlyOpenTabfilePath)
    var bibPath = join(parentDir, bibName)

    // get selected keys
    var citeKeys = await pickCiteKeys(_selected)
    insertCiteKeys(citeKeys)

    // 根据bib文件，而不是cite去获取keys。
    var bibKeys = getBibliographyKeyFromFile(bibPath)

    // 过滤已经包含的引用
    var uniqueKeys = citeKeys.filter((v, i) => !bibKeys.includes(v))

    // 如果为空，代表不需要添加内容的bib文件里边
    if (uniqueKeys.length === 0) {
      return
    }

    getBibliography(uniqueKeys)
      .then((res) => {
        writeFileSync(bibPath, res, {
          flag: "a",
          encoding: "utf8",
        })
      })
      .catch((err) => {
        window.showErrorMessage(err.message)
      })
  } catch (err: Error | any) {
    window.showErrorMessage(err.message)
  }
}



export async function addZoteroSelectedCiteBib() {
  return addCiteBib(true)
}
