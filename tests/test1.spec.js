const{test,expect}=require('@playwright/test')

test('logintest',async({page})=>{
await page.goto("https://demo.nopcommerce.com/login?returnUrl=%2F");
await page.locator("//input[@class='email']").fill("praveenpadigapati70@gmail.com")
await page.locator("//input[@class='password']").fill("123456");
await page.locator("button.login-button").click();


});