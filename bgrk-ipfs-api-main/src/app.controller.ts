import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Proposal } from './interface/proposal.interface';
import { ApiBody } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Post('proposal')
  @ApiBody({type: Proposal})
  async proposal(
    @Body('signers') signers: any[],
    @Body('description') description: string,
  ) {
    try {
      const res = await this.appService.proposalIpfs(description, signers);
      return { result: res };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
}
