export class TextMessageTemplate {
  type: 'text';
  body: string;
  preview_url: boolean;

  constructor(body: string, previewUrl = false) {
    this.body = body;
    this.preview_url = previewUrl;
  }
}
