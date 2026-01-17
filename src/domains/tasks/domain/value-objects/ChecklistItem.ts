export interface ChecklistItemData {
  id: string;
  text: string;
  done: boolean;
}

export class ChecklistItem {
  private readonly _id: string;
  private readonly _text: string;
  private readonly _done: boolean;

  private constructor(id: string, text: string, done: boolean) {
    this._id = id;
    this._text = text;
    this._done = done;
  }

  get id(): string {
    return this._id;
  }

  get text(): string {
    return this._text;
  }

  get done(): boolean {
    return this._done;
  }

  public static create(text: string, id?: string, done: boolean = false): ChecklistItem {
    const itemId = id || Date.now().toString() + Math.random().toString(36).substring(2, 9);
    return new ChecklistItem(itemId, text, done);
  }

  public static fromData(data: ChecklistItemData): ChecklistItem {
    return new ChecklistItem(data.id, data.text, data.done);
  }

  public toggle(): ChecklistItem {
    return new ChecklistItem(this._id, this._text, !this._done);
  }

  public toData(): ChecklistItemData {
    return {
      id: this._id,
      text: this._text,
      done: this._done,
    };
  }
}
