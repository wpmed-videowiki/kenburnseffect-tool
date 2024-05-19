export const replaceTemplateWithFile = (pageText, fileName) => {
  const pattern = /\{\{Ken Burns effect\n\|FileName\s*=\s*File:[^\n]+\n\}\}/;
  const replacement = `[[${fileName}|100px|left]]`;

  return pageText.replace(pattern, replacement);
};
