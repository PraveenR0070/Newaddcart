

const{test,expect}=require('@playwright/test');

test('ruf',async({page})=>{

    await page.goto('https://demo.nopcommerce.com/login?returnUrl=%2F');
    const heds=await page.$$("//ul[@class='top-menu notmobile']//li/a");
    const prod='Jewelry';
    for(const w of heds){
        console.log(await w.textContent());
        let s = await w.textContent();
        if(s.includes(prod)){
            await w.click();
            break;
        }
        
    }
    await page.waitForTimeout(5000);
})