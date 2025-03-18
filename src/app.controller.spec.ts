import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotController } from './chatbot/chatbot.controller';
import { ChatbotService } from './chatbot/chatbot.service';

describe('AppController', () => {
  let appController: ChatbotController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ChatbotController],
      providers: [ChatbotService],
    }).compile();

    appController = app.get<ChatbotController>(ChatbotController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
