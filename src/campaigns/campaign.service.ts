import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignPrismaService } from './prisma/campaign-prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Prisma } from '.prisma-campaign';

@Injectable()
export class CampaignService {
  constructor(private campaignPrisma: CampaignPrismaService) {}

  async create(createCampaignDto: CreateCampaignDto) {
    const data: any = {
      title: createCampaignDto.title,
      description: createCampaignDto.description || null,
      startDate: new Date(createCampaignDto.startDate),
      source: createCampaignDto.source,
      executionType: createCampaignDto.executionType,
      group: createCampaignDto.group,
      channel: createCampaignDto.channel,
      messageType: createCampaignDto.messageType,
      template: createCampaignDto.template,
      persons: createCampaignDto.persons ? createCampaignDto.persons as Prisma.JsonArray : Prisma.JsonNull,
      status: 'draft',
    };

    if (createCampaignDto.endDate) {
      data.endDate = new Date(createCampaignDto.endDate);
    }

    if (createCampaignDto.scheduledDate) {
      data.scheduledDate = new Date(createCampaignDto.scheduledDate);
    }

    if (createCampaignDto.scheduledTime) {
      data.scheduledTime = createCampaignDto.scheduledTime;
    }

    if (createCampaignDto.filePath) {
      data.filePath = createCampaignDto.filePath;
    }

    const campaign = await this.campaignPrisma.campaign.create({ data });
    return campaign;
  }

  async findAll() {
    const campaigns = await this.campaignPrisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return campaigns;
  }

  async findOne(id: number) {
    const campaign = await this.campaignPrisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async update(id: number, updateCampaignDto: UpdateCampaignDto) {
    const existingCampaign = await this.campaignPrisma.campaign.findUnique({
      where: { id },
    });

    if (!existingCampaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    const updateData: any = {};
    
    if (updateCampaignDto.title) updateData.title = updateCampaignDto.title;
    if (updateCampaignDto.description !== undefined) updateData.description = updateCampaignDto.description;
    if (updateCampaignDto.startDate) updateData.startDate = new Date(updateCampaignDto.startDate);
    if (updateCampaignDto.endDate !== undefined) {
      updateData.endDate = updateCampaignDto.endDate ? new Date(updateCampaignDto.endDate) : null;
    }
    if (updateCampaignDto.source) updateData.source = updateCampaignDto.source;
    if (updateCampaignDto.executionType) updateData.executionType = updateCampaignDto.executionType;
    if (updateCampaignDto.scheduledDate !== undefined) {
      updateData.scheduledDate = updateCampaignDto.scheduledDate ? new Date(updateCampaignDto.scheduledDate) : null;
    }
    if (updateCampaignDto.scheduledTime !== undefined) updateData.scheduledTime = updateCampaignDto.scheduledTime;
    if (updateCampaignDto.group) updateData.group = updateCampaignDto.group;
    if (updateCampaignDto.channel) updateData.channel = updateCampaignDto.channel;
    if (updateCampaignDto.messageType) updateData.messageType = updateCampaignDto.messageType;
    if (updateCampaignDto.template) updateData.template = updateCampaignDto.template;
    if (updateCampaignDto.persons !== undefined) {
      updateData.persons = updateCampaignDto.persons ? updateCampaignDto.persons as Prisma.JsonArray : Prisma.JsonNull;
    }
    if (updateCampaignDto.filePath !== undefined) updateData.filePath = updateCampaignDto.filePath;
    if (updateCampaignDto.status) updateData.status = updateCampaignDto.status;

    const campaign = await this.campaignPrisma.campaign.update({
      where: { id },
      data: updateData,
    });

    return campaign;
  }

  async remove(id: number) {
    const existingCampaign = await this.campaignPrisma.campaign.findUnique({
      where: { id },
    });

    if (!existingCampaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    await this.campaignPrisma.campaign.delete({
      where: { id },
    });

    return { message: 'Campaign deleted successfully' };
  }
}