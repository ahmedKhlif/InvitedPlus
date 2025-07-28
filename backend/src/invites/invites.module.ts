import { Module } from '@nestjs/common';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { SecureInvitesService } from './secure-invites.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvitesController],
  providers: [InvitesService, SecureInvitesService],
  exports: [InvitesService, SecureInvitesService],
})
export class InvitesModule {}
