import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(@Body() createCampaignDto: CreateCampaignDto) {
    const campaign = await this.campaignService.create(createCampaignDto);
    return {
      message: 'Campaign created successfully',
      data: campaign,
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('USER', 'ADMIN')
  async findAll() {
    const campaigns = await this.campaignService.findAll();
    return {
      message: 'Campaigns retrieved successfully',
      data: campaigns,
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('USER', 'ADMIN')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const campaign = await this.campaignService.findOne(id);
    return {
      message: 'Campaign retrieved successfully',
      data: campaign,
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    const campaign = await this.campaignService.update(id, updateCampaignDto);
    return {
      message: 'Campaign updated successfully',
      data: campaign,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.campaignService.remove(id);
    return result;
  }
}