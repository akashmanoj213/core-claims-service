export class TextMessageTemplate {
  type = 'template';
  body: string;

  constructor(body: string) {
    this.body = body;
  }
}
