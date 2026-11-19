const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const page = await browser.newPage();
    const pdf = async (name, expectedPages) => {
      await page.pdf({ path: name, format: 'A4', scale: 1, printBackground: true, preferCSSPageSize: true });
      const info = execFileSync('pdfinfo', [name], { encoding: 'utf8' });
      assert.match(info, new RegExp('^Pages:\\s+' + expectedPages + '$', 'm'));
      assert.match(info, /^Page size:.*\(A4\)/m);
    };
    const setup = async (query='') => {
      await page.goto('http://127.0.0.1:8765/print.html?preview=1'+query);
      await page.waitForSelector('#printPrepare');
    };
    const ready = () => page.waitForFunction(() => !document.querySelector('#printDo').disabled);
    const filled = () => page.locator('.pc-sheet').evaluateAll(sheets => sheets.map(s => s.querySelectorAll('.pc-card:not(.k-empty)').length));

    await setup('&case=%D0%A1-01');
    await page.click('#printPrepare');
    await ready();
    assert.deepEqual(await filled(), [8,8,8,8]);
    await pdf('/tmp/pedagog-case.pdf', 4);
    const pageOne = execFileSync('pdftotext',['-f','1','-l','1','/tmp/pedagog-case.pdf','-'],{encoding:'utf8'});
    assert.match(pageOne, /ТРИ ЗАМЕЧАНИЯ/);
    assert.match(pageOne, /трудность/);
    await setup();
    await page.click('#selNone');
    await page.selectOption('#printEdge','short');
    await page.check('#printEco');
    await page.click('#printPrepare');
    await ready();
    assert.deepEqual(await filled(), [8,8,8,8,8,8,4,4]);
    await pdf('/tmp/pedagog-common.pdf', 8);
    await page.click('#printCalibration');
    await ready();
    await pdf('/tmp/pedagog-calibration.pdf', 2);
    const numbers = await page.locator('.pc-sheet.is-back .pc-cal b').allTextContents();
    assert.deepEqual(numbers, ['7','8','5','6','3','4','1','2']);
    await page.click('#printWorksheets');
    await ready();
    await pdf('/tmp/pedagog-worksheets.pdf', 3);
    console.log('Microsoft Edge', browser.version(), 'verified');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
