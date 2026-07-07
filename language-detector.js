(function () {
function detectLanguage(text, project) {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return null;
  }

  const candidates = [project.languageA, project.languageB]
    .filter(Boolean)
    .map((language) => ({
      language,
      score: scoreLanguage(normalizedText, language),
    }))
    .sort((first, second) => second.score - first.score);

  const first = candidates[0];
  const second = candidates[1];

  if (!first || first.score <= 0) {
    return project.languageA;
  }

  if (second && first.score === second.score) {
    return project.languageA;
  }

  return first.language;
}

function scoreLanguage(text, language) {
  const lowerText = text.toLowerCase();
  const latinCharacters = countMatches(text, /[a-z]/gi);
  const hanCharacters = countMatches(text, /[\u3400-\u9fff]/g);
  const kanaCharacters = countMatches(text, /[\u3040-\u30ff]/g);
  const hangulCharacters = countMatches(text, /[\uac00-\ud7af]/g);
  const cyrillicCharacters = countMatches(text, /[\u0400-\u04ff]/g);
  const arabicCharacters = countMatches(text, /[\u0600-\u06ff]/g);
  const totalScriptCharacters = latinCharacters
    + hanCharacters
    + kanaCharacters
    + hangulCharacters
    + cyrillicCharacters
    + arabicCharacters;
  const rules = {
    中文: { script: hanCharacters },
    日语: { script: kanaCharacters + Math.min(hanCharacters, 4) },
    韩语: { script: hangulCharacters },
    俄语: { script: cyrillicCharacters },
    阿拉伯语: { script: arabicCharacters },
    英语: /\b(the|and|you|hello|hi|thanks|please|is|are|to|of|for)\b/g,
    法语: /\b(le|la|les|bonjour|merci|vous|etre|est|pour|avec|une|des)\b|[àâçéèêëîïôûùüÿœ]/g,
    德语: /\b(der|die|das|und|ich|sie|danke|bitte|nicht|ein|eine|ist)\b|[äöüß]/g,
    西班牙语: /\b(el|la|los|las|hola|gracias|usted|para|con|que|una|estoy)\b|[áéíóúñ¿¡]/g,
    葡萄牙语: /\b(o|a|os|as|ola|obrigado|voce|para|com|que|uma|estou)\b|[ãõáéíóúç]/g,
  };

  if (!rules[language]) {
    return 0;
  }

  if (Object.prototype.hasOwnProperty.call(rules[language] || {}, "script")) {
    return rules[language].script * 4;
  }

  const matches = lowerText.match(rules[language]);
  const latinLanguages = ["英语", "法语", "德语", "西班牙语", "葡萄牙语"];

  if (latinLanguages.includes(language)) {
    const latinRatio = totalScriptCharacters ? latinCharacters / totalScriptCharacters : 0;
    const isLatinDominant = latinRatio >= 0.72;
    const latinWeight = isLatinDominant ? latinCharacters : Math.min(latinCharacters, 2);
    const keywordWeight = isLatinDominant ? 5 : 2;
    return latinWeight + (matches ? matches.length * keywordWeight : 0);
  }

  if (matches) {
    return matches.length * 3;
  }

  return 0;
}

function countMatches(text, pattern) {
  return text.match(pattern)?.length || 0;
}

window.PixelPenguinLanguage = {
  detectLanguage,
  scoreLanguage,
};
})();
