import { Request, Response } from 'express';
import { z } from 'zod';
import { AIAssistantService } from '../ai/assistant.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export const serviceDetectSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
});

export const assistantChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationHistory: z.array(z.any()).optional(),
});

export const grievanceClassifySchema = z.object({
  text: z.string().min(5, 'Grievance description too short for classification'),
});

export class AIController {
  public static async detectService(req: Request, res: Response): Promise<void> {
    const { query } = req.body;
    const result = await AIAssistantService.detectService(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  public static async assistantChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { message, conversationHistory } = req.body;
    const userId = req.user?.userId;
    const conversationResult = await AIAssistantService.processConversation(message, conversationHistory, userId);

    res.status(200).json({
      success: true,
      data: conversationResult,
    });
  }

  public static async classifyGrievance(req: Request, res: Response): Promise<void> {
    const { text } = req.body;
    const classification = await AIAssistantService.classifyGrievance(text);

    res.status(200).json({
      success: true,
      data: classification,
    });
  }
}
