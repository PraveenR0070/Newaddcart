const{Loginpage}=require('./loginpage');
const{Homepage}=require('./Homepage')
const{jwlery}=require('./jwlery');
const{cost}=require('./cost');
class PomManager{
    constructor(page){
        this.page=page;
        this.lp= new Loginpage(this.page);
        this.hp= new Homepage(this.page);
        this.vp=new jwlery(this.page);
        this.cs=new cost(this.page);

    }
     getLoginpage(){
        return this.lp;
    }
    getHomepage(){
        return this.hp;
    }
    getjwlery(){
        return this.vp;
    }
    getcost(){
        return this.cs;
    }
}
module.exports={PomManager};