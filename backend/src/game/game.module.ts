import { Module } from '@nestjs/common';
// import { GameController } from './game.controller';
import { LobbyService } from './services/lobby.service';
import { CommonModule } from '../common/common.module';
import {GameGateway} from "./game.gateway";
import { PrismaService } from 'src/prisma/prisma.servise';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  providers: [LobbyService, GameGateway, PrismaService],
  imports: [CommonModule, ChatModule],
})

export class GameModule {}
