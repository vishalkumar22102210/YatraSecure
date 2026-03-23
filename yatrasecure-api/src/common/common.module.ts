import { Module } from '@nestjs/common';
import { UserMapperService } from './mappers/user.mapper';

@Module({
  providers: [UserMapperService],
  exports: [UserMapperService], // ✅ Export so other modules can use it
})
export class CommonModule {}