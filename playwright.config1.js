// @ts-check
const { devices } = require('@playwright/test');

const config={
  testDir: './tests',
  
  timeout:30 * 1000,
  expect:{
    timeout:5000
  },
  reporter:'html',

  projects:[
    {
      name:"chromium",
      use:{

        broswername:'chromium',
        headless:false,
        screenshot:'on',
        trace:'on',
    
       }

    },
    {
      name:"firefox",
      use:{

        broswername:'firefox',
        headless:false,
        screenshot:'on',
        trace:'on',
       }
    },
    {
      name:"webkit",
      use:{

        broswername:'webkit',
        headless:false,
        screenshot:'on',
        trace:'on',
       }
    }
  ]

 
 
}
module.exports= config;

