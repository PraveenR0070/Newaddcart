

class jwlery{

    constructor(page){
        this.page=page;
        this.subproduct="//div/h2[@class='product-title']//a";
        this.addcartbtn1="(//div[@class='product-item']//button[@class='button-2 product-box-add-to-cart-button'])[1]";
        this.addcartbtn2="(//div[@class='product-item']//button[@class='button-2 product-box-add-to-cart-button'])[2]";
        this.addcartbtn3="(//div[@class='product-item']//button[@class='button-2 product-box-add-to-cart-button'])[3]";
        this.prodBTN="//li[@id='topcartlink']//a";

    }

    async validatesub(ip){
      const sprod=  await this.page.$$(this.subproduct);

      if(ip==="Elegant Gemstone Necklace (rental)"){
      await this.gen(sprod,ip,this.addcartbtn1);
      }else if(ip==="Flower Girl Bracelet"){
        await this.gen(sprod,ip,this.addcartbtn2);
      }else if(ip==="Vintage Style Engagement Ring"){
        await this.gen(sprod,ip,this.addcartbtn3);
      }
     
    }
      



      async gen(x,p,l){
      for(const w of x){

        console.log(await w.textContent());
       const m= await w.textContent();
       if(m.includes(p)){
       //await w.click();
       await this.page.locator(l).click();
       

       
       break;
       }
    

      }
   
      
    
    }
    
  async clickproBTN(){
    await this.page.locator(this.prodBTN).click();
  }
   


}
module.exports={jwlery};