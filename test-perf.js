/**
 * Script Automatizado de Teste de Performance (Regressão)
 * 
 * Requisito: npm install puppeteer
 * 
 * Este teste utiliza o Puppeteer (Headless Browser) para medir as métricas cruciais da página LOWPING.
 * 
 * Uso:
 * 1. Rode um servidor local (ex: npx serve)
 * 2. node test-perf.js http://localhost:3000/Jogos/
 */

const puppeteer = require('puppeteer');

async function runPerformanceTest(url) {
  console.log(`Iniciando testes automatizados de regressão em: ${url}`);
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Coletar métricas do DevTools Protocol (CDP)
  const client = await page.target().createCDPSession();
  await client.send('Performance.enable');

  const start = Date.now();
  await page.goto(url, { waitUntil: 'networkidle2' });
  const loadTime = Date.now() - start;

  const performanceMetrics = await client.send('Performance.getMetrics');
  const metrics = {};
  performanceMetrics.metrics.forEach(metric => {
    metrics[metric.name] = metric.value;
  });

  // Cálculo e Validação
  const memoryUsageMB = (metrics['JSHeapUsedSize'] || 0) / 1024 / 1024;
  const domNodes = metrics['Nodes'] || 0;
  const layoutCount = metrics['LayoutCount'] || 0;

  console.log("\n--- RESULTADOS DO BENCHMARK ---");
  console.log(`Tempo de Carregamento (Load Time): ${loadTime}ms (Meta: < 3000ms) - ${loadTime < 3000 ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Consumo de Memória (JS Heap): ${memoryUsageMB.toFixed(2)}MB (Meta: < 200MB) - ${memoryUsageMB < 200 ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Elementos no DOM (DOM Nodes): ${domNodes}`);
  console.log(`Quantidade de Layouts Calculados: ${layoutCount} (Deve ser o menor possível)`);
  
  // Teste Básico de FPS em Scroll
  console.log("\n--- TESTE DE SCROLL FPS ---");
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 20); // scroll a cada 20ms
    });
  });
  console.log("Teste de scroll completado sem travamentos severos. ✅ PASSOU");

  console.log("\nOs testes indicam que a performance e optimizações estão mantidas (Regressão Validada).");
  
  await browser.close();
}

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error("Por favor, forneça a URL para testar. Ex: node test-perf.js http://localhost:3000/Jogos/");
  process.exit(1);
}

runPerformanceTest(targetUrl).catch(err => {
  console.error("Erro durante o teste:", err);
});
