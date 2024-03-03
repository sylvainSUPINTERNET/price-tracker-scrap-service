import { Injectable } from '@nestjs/common';

const puppeteer = require('puppeteer-extra')

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())


//document.querySelectorAll("a[data-what='0']")

//document.querySelectorAll("a[data-what='1']")

//document.querySelectorAll("[data-sh-gr='os']")


export interface ISearch {
  productNameList: string[],
  productPriceList: string[],
  productStoreList: string[],
  imgLinks: string[]
}


@Injectable()
export class AppService {

  async searchScrapShopping(qParam:string): Promise<ISearch> { 
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

      const productDetails = await page.evaluate(() => {

        const imgLinkImgList = [];
        const linkHrefList = [];
        const elements = document.querySelectorAll('a[data-merchant-id]')

        for ( const element of elements ) {
        // get image for each shopping link
        // document.querySelectorAll('a[data-merchant-id]')[1].children[1].children[0].src
          const link = element.getAttribute('href');
          linkHrefList.push(`https://www.google.fr/${link}`);
        
          const child1 = element.children[1];
        // children 2 is variable ( must loop to find img element )
          for ( const child of child1.children ) {
            if ( child.tagName === "IMG" ) {
              //@ts-ignore
              imgLinkImgList.push(child.src);
            }
          }

        }

        //document.querySelectorAll('a[data-merchant-id]')[0].children[3].children[0].children[IDX]
        // IDX = 0 => nom
        // IDX = 1 => prix
        // IDX = 2 => magasin
        const productDetailList = [];
        for ( const element of document.querySelectorAll('a[data-merchant-id]') ) {
          const child2 = element.lastChild.childNodes[0].childNodes;

          //@ts-ignore
          console.log("NAME : ", child2[0].innerText);
          //@ts-ignore
          console.log("PRICE : ", child2[1].innerText);
          //@ts-ignore
          console.log("STORE : ", child2[2].innerText);

          productDetailList.push({
                      //@ts-ignore
            name: child2[0].innerText,
                      //@ts-ignore
            price: child2[1].innerText,
                     //@ts-ignore
            store: child2[2].innerText
          })

        }
        return Array.from(productDetailList).map( (element, idx) => {
          return {
            name: element.name,
            price: element.price,
            store: element.store,
            imgUrl: imgLinkImgList[idx],
            linkHrefList: linkHrefList[idx]
            };
        });

      });

      browser.close();
      return new Promise( (resolve, _reject) => resolve(productDetails));

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
