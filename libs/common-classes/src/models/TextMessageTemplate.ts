export class TextMessageTemplate {
  type = 'text';
  body: string;

  constructor(body: string) {
    this.type = 'text';
    this.body = body;
  }
}
