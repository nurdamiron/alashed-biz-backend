import { ValueObject } from '../../../../shared/domain/ValueObject.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  get value(): string {
    return this.props.value;
  }

  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(email: string): Email {
    const normalized = email.trim().toLowerCase();

    if (!this.EMAIL_REGEX.test(normalized)) {
      throw new ValidationError('Invalid email format', { email: 'Invalid email format' });
    }

    return new Email({ value: normalized });
  }
}
