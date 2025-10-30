import 'express-session';
import { User } from '@shared/schema';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: string;
    user?: User;
  }
}

declare module 'express' {
  interface Request {
    session?: Session & SessionData;
  }
}