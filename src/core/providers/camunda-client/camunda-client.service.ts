import { Injectable } from '@nestjs/common';
import { type } from 'os';
import { ZBClient } from 'zeebe-node';

interface Outcome<T> {
  bpmnProcessId: string;
  processDefinitionKey: string;
  processInstanceKey: string;
  variables: T;
}

@Injectable()
export class CamundaClientService {
  private zbClient;

  constructor() {
    this.zbClient = new ZBClient();
  }

  async getOutcome<T>(processId: string, params): Promise<T> {
    const result: Outcome<T> =
      await this.zbClient.createProcessInstanceWithResult(processId, params);

    return result.variables;
  }
}
