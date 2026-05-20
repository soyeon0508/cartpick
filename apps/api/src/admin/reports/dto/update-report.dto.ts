import { IsEnum } from 'class-validator';

export enum ReportAction {
  RESOLVE = 'resolve',
  DISMISS = 'dismiss',
}

export class UpdateReportDto {
  @IsEnum(ReportAction)
  action!: ReportAction;
}
