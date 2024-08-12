import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { PrismaService } from 'src/prisma/prisma.servise';
import { UsersController } from './controllers/users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ImageService } from './services/image.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [
	UsersService,
	PrismaService,
	ImageService],
  controllers: [UsersController],
  exports: [UsersService, ImageService],
})
export class UsersModule {}
