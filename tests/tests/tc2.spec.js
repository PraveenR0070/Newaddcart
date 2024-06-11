const{test,expect}=require('@playwright/test')

const{PomManager}=require('../pages/PomManager')

test('loginpage',async({page})=>{
const pommanager = new PomManager(page);
const lp= await pommanager.getLoginpage();
await lp.openurl();
await lp.LoginPage('praveenpadigapati09@gmail.com','123456');

const hp= await pommanager.getHomepage();
await hp.validatingheaders('Jewelry');

await page.waitForTimeout(3000);

// const vp = await pommanager.getjwlery();
// await vp.validatesub('Elegant Gemstone Necklace (rental)');
// await page.waitForTimeout(3000);




})