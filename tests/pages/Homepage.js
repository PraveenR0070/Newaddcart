

class Homepage{
    constructor(page){
        this.page=page;
        this.headers="//ul[@class='top-menu notmobile']//li/a";


    }
    async validatingheaders(proname){
       const h= await this.page.$$(this.headers);

       //let obj="Jewelry";
       
       for(const w of h){
        console.log(await w.textContent());
        let s = await w.textContent();
        if(s.includes(proname)){
            await w.click();
            break;
        }
       

       }
    }
}
module.exports={Homepage};