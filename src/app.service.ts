import { Injectable } from '@nestjs/common';

const puppeteer = require('puppeteer-extra')

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())


//document.querySelectorAll("a[data-what='0']")[0].href

//document.querySelectorAll("a[data-what='1']")[0].innerText

//document.querySelectorAll("[data-sh-gr='os']")[0].childNodes[0].children[1].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[1].childNodes[2].innerText


/*
export interface ISearch {
  productNameList: string[],
  productPriceList: string[],
  productStoreList: string[],
  imgLinks: string[]
}*/

export interface ISearch {
  name: string,
  price: string,
  store: string,
  imgUrl: string,
  link: string,
  rate: string
}

@Injectable()
export class AppService {

  async searchScrapShopping(qParam:string): Promise<ISearch[]> { 
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
      console.log("Search for ", qParam);
  

  
      const page = await browser.newPage();
      //await page.goto('https://consent.google.com/m?continue=https://shopping.google.com/&gl=FR&m=0&pc=shop&cm=2&hl=fr&src=1');
      await page.goto('https://www.google.fr/shopping');
      await page.waitForSelector('button[aria-label="Tout accepter"]');
      await page.click('button[aria-label="Tout accepter"]');
      await page.waitForSelector('input[type="search"]');
      await page.type('input[type="search"]', qParam);
      await page.keyboard.press('Enter');

      
      await page.waitForSelector('a[data-merchant-id]');

      // Ici : on doit faire ça parce qeu sinon ça fait une erreur et ça renvoit des base64 ( image vide ) 
      // avec une erreur dans la console (chrome) : 
      // m=cdos,hsm,jsa,d,csi:411 [Violation] Permissions policy violation: unload is not allowed in this document.
      await new Promise( resolve => setTimeout(resolve, 5000));

      let productDetailsList: ISearch[] = [];

      await page.waitForSelector("a[data-what='0']");
      await page.waitForSelector("a[data-what='1']");
      await page.waitForSelector("[data-sh-gr='os']");

      const imgList = await page.evaluate(() => {
        //@ts-ignore
        return Array.from(document.querySelectorAll("a[data-what='0']")).map(el=>el.querySelector('img').src);
      });

      const productNameList = await page.evaluate(() => {
        //@ts-ignore
        return Array.from(document.querySelectorAll("a[data-what='1']")).map( (element) => element.innerText.replace("\n", " "));
      });

      
      const productPriceList = await page.evaluate(() => {
        //@ts-ignore
        return Array.from(document.querySelectorAll("[data-sh-gr='os']")).map( (element) => element.innerText.split("€")[0]);
      });

      const productLinkList = await page.evaluate(() => { 
        //@ts-ignore
        return Array.from(document.querySelectorAll("[data-sh-gr='os']")).map(x=>x.querySelector('a').href)
      });

      for (let i = 0; i < imgList.length; i++) {
        const img = imgList[i];
        const name = productNameList[i];
        const price = productPriceList[i];
        const store = "Google Shopping";
        const rate = "";
        const link = productLinkList[i];
        const imgUrl = img;
        productDetailsList.push({name, price, store, imgUrl, link, rate});
      }

      browser.close();
      return new Promise( (resolve, _reject) => resolve(productDetailsList));
      //return new Promise( (resolve, _reject) => resolve(productDetails));

    } catch ( e ) {
      await browser.close();
      console.log("Search error : ", e);
      return new Promise( (_resolve, reject) => reject("search error " + e))
    }
  
  }

  async paginateKeep20First(data:string[]): Promise<string[]> {
    const maxResult:number = 20;
    return data.length > maxResult ? data.slice(0, maxResult) : data;
  }

}
