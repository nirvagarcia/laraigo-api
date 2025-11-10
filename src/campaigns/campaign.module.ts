import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { CampaignPrismaService } from './prisma/campaign-prisma.service';

@Module({
  controllers: [CampaignController],
  providers: [CampaignService, CampaignPrismaService],
  exports: [CampaignService],
})
export class CampaignModule {}