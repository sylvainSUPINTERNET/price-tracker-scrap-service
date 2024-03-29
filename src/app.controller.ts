import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { AppService, ISearch } from './app.service';
import express, {Request, Response} from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  // http://localhost:3000/search?q=air%20max%201

  @Get("/search")
  async searchShopping( @Res() res: Response, @Query("q") qParam) {
    
    try {
      const searchResult = await this.appService.searchScrapShopping(qParam);
      res.status(HttpStatus.OK).json(searchResult);
    } catch ( e ) {
      res.status(HttpStatus.OK).json({
        error: e
      });
    }

  }
}
