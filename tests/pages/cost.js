
class cost{

constructor(page){
    this.page = page;
    this.rate="//tr/td[@class='subtotal']/span";

}
async validating_cost(){
   let r = await this.page.$$(this.rate);
   //console.log(await r.count());
   //const ar= r.split(" ");
//    const c1=ar[1];
//    const c2=ar[2];
   

   for(const w of r){
     //console.log(await w.textContent());
     let am =await w.textContent();
     const as=am.replaceAll('$','');
     const total =as[0]+as[1];
     console.log(total);
     
    
     

    


   


    

   }

}

}
module.exports={cost};