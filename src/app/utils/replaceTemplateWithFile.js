export const replaceTemplateWithFile = (
  pageText,
  originalFileName,
  targetFileName
) => {
  const regex = new RegExp(
    `\\{\\{Ken Burns effect\\n\\|FileName\\s*=\\s*(File:)?${originalFileName.replace('File:', '')}\\n\\}\\}`
  );
  const replacement = `[[${targetFileName}|100px|left]]`;

  return pageText.replace(regex, replacement);
};
