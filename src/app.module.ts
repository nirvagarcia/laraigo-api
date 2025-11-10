import { Module } from '@nestjs/common';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { CampaignModule } from './campaigns/campaign.module';

@Module({
  imports: [UserModule, AuthModule, CampaignModule],
})
export class AppModule {}
