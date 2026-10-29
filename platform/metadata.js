/* Редакционная навигация каталога: темы и уровни берутся из самого реестра (src/deck.js),
   чтобы фильтры, онлайн-игра и печать не расходились. Это не шкала оценки педагога. */
(() => {
  const D = globalThis.PEDAGOG_DATA;
  const themes = [...new Set(D.situations.map(c => c.theme))];
  const typeById = Object.fromEntries(D.roleTypes.map(t => [t.id, t]));
  for (const c of D.situations) {
    c.difficulty = c.level;
    c.roleCount = c.cast.length;
    c.roleTypes = [...new Set(c.cast.map(x => x.type))];
  }
  globalThis.PEDAGOG_META = {themes, levels:['Базовый','Углублённый'], typeById};
})();
