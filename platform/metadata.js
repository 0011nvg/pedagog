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
    /* Цвет темы — полоска на карточке ситуации в каталоге. */
  const themeColors = {'Урок и мотивация':'#3B4A99','Оценивание':'#6874C2','Семья и школа':'#E0A64E','Поддержка ученика':'#2A958E','Отношения и воспитание':'#E8673F','Дисциплина и школьные правила':'#4A8DBE','Этика и профессиональные границы':'#8366B0','Коллеги и наставничество':'#62B9AF','Нагрузка и организация':'#28336E'};
  globalThis.PEDAGOG_META = {themes, levels:['Базовый','Углублённый'], typeById, themeColors};
})();
