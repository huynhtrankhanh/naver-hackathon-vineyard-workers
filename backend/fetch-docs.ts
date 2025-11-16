/**
 * Script to fetch Clova Studio API documentation using Puppeteer
 */

import puppeteer from 'puppeteer';

async function fetchClovaDocumentation() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    console.log('Navigating to documentation...');
    
    await page.goto('https://api.ncloud-docs.com/docs/en/clovastudio-openaicompatibility', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('Page loaded, extracting content...');
    
    // Wait for main content to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Extract text content
    const content = await page.evaluate(() => {
      // Try to find the main content area
      const mainContent = document.querySelector('main') || 
                         document.querySelector('article') || 
                         document.querySelector('.content') ||
                         document.querySelector('#content') ||
                         document.body;
      
      return mainContent?.innerText || '';
    });
    
    console.log('\n=== CLOVA STUDIO API DOCUMENTATION ===\n');
    console.log(content);
    console.log('\n=== END OF DOCUMENTATION ===\n');
    
    // Also try to extract code examples
    const codeExamples = await page.evaluate(() => {
      const codeBlocks = document.querySelectorAll('pre, code');
      return Array.from(codeBlocks).map(block => block.textContent).join('\n\n---\n\n');
    });
    
    if (codeExamples) {
      console.log('\n=== CODE EXAMPLES ===\n');
      console.log(codeExamples);
      console.log('\n=== END OF CODE EXAMPLES ===\n');
    }
    
  } catch (error) {
    console.error('Error fetching documentation:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

fetchClovaDocumentation();
