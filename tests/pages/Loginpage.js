exports.Loginpage=
class Loginpage{

   constructor(page){
    this.page=page;
    this.uname="//input[@class='email']";
    this.pass="//input[@class='password']";
    this.loginbtn="button.login-button";
    this.URL="https://demo.nopcommerce.com/login?returnUrl=%2F";


   }
   async openurl(){
    await this.page.goto(this.URL);
   }
   async LoginPage(uname,password){
    await this.page.locator(this.uname).fill(uname);
    await this.page.locator(this.pass).fill(password);
    await this.page.locator(this.loginbtn).click();


   }
}
