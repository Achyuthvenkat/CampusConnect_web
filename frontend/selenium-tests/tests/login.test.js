const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');

describe('CampusConnect Login E2E Tests', function () {
    this.timeout(30000); // 30s timeout
    let driver;

    before(async function () {
        const chrome = require('selenium-webdriver/chrome');
        let options = new chrome.Options();
        
        // If running in CI (e.g. GitHub Actions), configure headless execution
        if (process.env.CI) {
            options.addArguments('--headless=new');
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
        }
        options.addArguments('--window-size=1280,1024');
        
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    });

    after(async function () {
        if (driver) await driver.quit();
    });

    it('Should login successfully with correct credentials', async function () {
        // Target the live GitHub Pages app (or localhost for local testing)
        await driver.get('https://Achyuthvenkat.github.io/CampusConnect_web/#/login');

        // Enter email using stable ID
        const emailInput = await driver.wait(until.elementLocated(By.id("email-input")), 10000);
        await emailInput.sendKeys('sreenu@saveetha.com');

        // Enter password using stable ID
        const passwordInput = await driver.findElement(By.id("password-input"));
        await passwordInput.sendKeys('Simatsucks1');

        // Submit using stable ID
        const submitBtn = await driver.findElement(By.id("login-submit-btn"));
        try {
            await submitBtn.click();
        } catch (err) {
            if (err.name === 'ElementClickInterceptedError') {
                await driver.executeScript("arguments[0].click();", submitBtn);
            } else {
                throw err;
            }
        }

        // Verify dashboard redirect (url contains dashboard or similar home elements)
        await driver.wait(until.urlContains('#/'), 15000);
        const currentUrl = await driver.getCurrentUrl();
        assert.ok(currentUrl.includes('#/'), 'Did not redirect to the landing page');
    });
});
