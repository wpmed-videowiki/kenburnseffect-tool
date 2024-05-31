function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

const generateTemplateRegex = (text) =>
  new RegExp(
    `\\{\\{Ken Burns(\\seffect)?[^file]*file.*=\\s*(File:)?${escapeRegExp(
      text
    )}[^\\}]*\\}\\}`,
    "ig"
  );

export const replaceTemplateWithFile = (
  pageText,
  originalFileName,
  targetFileName
) => {
  const replacement = `[[${targetFileName}|100px|left]]`;

  const regex = generateTemplateRegex(originalFileName.replace("File:", ""));
  const spaceRegex = generateTemplateRegex(
    originalFileName.replace("File:", "").replace(/\_/g, " ")
  );

  return pageText.replace(regex, replacement).replace(spaceRegex, replacement);
};

// const result = replaceTemplateWithFile(
//   `
//   {{videowiki}}
// {{-}}

// ==Ken Burns testing==
// [[File:Gout2010(KenBurns).webm|100px|left]]
// {{clear}}

// ==Ken Burns testing2==
// [[File:The_gout_james_gillray(KenBurns).webm|100px|left]]
// {{clear}}

// ==Ken Burns testing3==
// {{Ken Burns effect
// |FileName    = File:Covid_19_(Radiopaedia_87534).PNG
// }}
// {{clear}}

// ==References==
// {{reflist}}`,
//   "File:Covid_19_(Radiopaedia_87534).PNG",
//   "File:Covid_19_(Radiopaedia_87534)(KenBurns).webm"
// );

// console.log(result);
