exports.Loginpage=
class Loginpage{

   constructor(page){
    this.page=page;
    this.uname = 'input#Email';
    this.pass = 'input#Password';
    this.loginbtn = 'button.login-button';
    this.URL = 'https://demo.nopcommerce.com/login?returnUrl=%2F';


   }
   async openurl(){
    await this.page.goto(this.URL, { waitUntil: 'domcontentloaded' });
   }
   async LoginPage(uname,password){
    await this.page.locator(this.uname).waitFor({ state: 'visible', timeout: 30000 });
    await this.page.locator(this.uname).fill(uname);
    await this.page.locator(this.pass).waitFor({ state: 'visible', timeout: 30000 });
    await this.page.locator(this.pass).fill(password);
    await this.page.locator(this.loginbtn).click();


   }
}
