const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Iniciando navegador...');
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--use-fake-ui-for-media-stream', '--window-size=1280,720'] // Simula permissões de câmera/mic
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // Captura logs do console
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type().toUpperCase(), msg.text()));
  
  // Captura erros não tratados
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.toString()));

  console.log('Navegando para a página da sala...');
  await page.goto('https://meet.colegiorodin.tech/room/teste?tag=8_ano', { waitUntil: 'networkidle2' });

  // Tenta preencher o nome e entrar na sala
  try {
    console.log('Procurando input de nome...');
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    await page.type('input[type="text"]', 'Visitante Teste');
    
    console.log('Clicando em Entrar na Reunião...');
    await page.click('button[type="submit"]');
  } catch (err) {
    console.log('Não encontrou o form de login, talvez já esteja logado ou tela preta direta:', err.message);
  }

  console.log('Esperando 10 segundos na sala para ver se algo trava...');
  await new Promise(r => setTimeout(r, 10000));

  // Injeta uma verificação de erros do React
  const rootHtml = await page.evaluate(() => {
    return document.getElementById('root')?.innerHTML || 'ROOT NAO ENCONTRADO';
  });
  
  console.log('ROOT HTML EXTRACT (primeiros 200 chars):', rootHtml.substring(0, 200));

  await browser.close();
  console.log('Teste concluído.');
})();
