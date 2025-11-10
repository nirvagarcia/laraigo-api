import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient as CampaignPrismaClient } from '.prisma-campaign';

@Injectable()
export class CampaignPrismaService extends CampaignPrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}