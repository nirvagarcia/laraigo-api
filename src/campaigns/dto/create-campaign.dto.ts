import { IsString, MinLength, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsString()
  source: string;

  @IsString()
  executionType: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsString()
  group: string;

  @IsString()
  channel: string;

  @IsString()
  messageType: string;

  @IsString()
  template: string;

  @IsOptional()
  @IsArray()
  persons?: any[];

  @IsOptional()
  @IsString()
  filePath?: string;
}