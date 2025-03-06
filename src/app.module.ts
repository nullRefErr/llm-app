import { Module } from "@nestjs/common";
import { ChatbotController } from "./chatbot/chatbot.controller";
import { ChatbotService } from "./chatbot/chatbot.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AgentService } from "./agent/agent.service";
import { AgentModule } from "./agent/agent.module";

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    // MongooseModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //     uri: configService.get<string>('MONGO_URL'),
    //     dbName: 'future_agent_db',
    //   }),
    //   inject: [ConfigService],
    // }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    ConfigModule.forRoot(),
    AgentModule,
  ],
  controllers: [],
  providers: [AgentService],
})
export class AppModule {}
