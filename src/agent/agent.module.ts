import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AgentService } from "./agent.service";

@Module({
  imports: [  ],
  controllers: [],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
