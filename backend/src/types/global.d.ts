// src/types/global.d.ts

import { User } from '../../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
