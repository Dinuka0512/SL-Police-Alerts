import { AuthService } from './auth.service';
import { ContactService } from './contact.service';
import { MessageService } from './message.service';
import { PenaltyService } from './penalty.service';

export const authService = new AuthService();
export const contactService = new ContactService();
export const messageService = new MessageService();
export const penaltyService = new PenaltyService();

export { AuthService } from './auth.service';
export { ContactService } from './contact.service';
export { MessageService } from './message.service';
export { PenaltyService } from './penalty.service';
