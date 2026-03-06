import { Injectable } from '@nestjs/common';

@Injectable()
export class SystemRuntimeService {
  private pollingInterval = 60000;

  getPollingInterval(): number {
    return this.pollingInterval;
  }

  setPollingInterval(next: number): void {
    if (Number.isFinite(next) && next >= 5000) {
      this.pollingInterval = Math.floor(next);
    }
  }
}

