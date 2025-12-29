import { ValueObject } from '../../../../shared/domain/ValueObject.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

interface TINProps {
  value: string;
}

/**
 * TIN - Tax Identification Number (ИИН/БИН в РК)
 * Формат: 12 цифр
 * - ИИН (физ. лица): первые 6 цифр - дата рождения (YYMMDD)
 * - БИН (юр. лица): первые 6 цифр - дата регистрации (YYMMDD)
 */
export class TIN extends ValueObject<TINProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: TINProps) {
    super(props);
  }

  public static create(value: string): TIN {
    if (!value || !value.trim()) {
      throw new ValidationError('TIN cannot be empty');
    }

    const cleaned = value.trim().replace(/\s/g, '');

    // Проверка на 12 цифр (формат РК)
    if (!/^\d{12}$/.test(cleaned)) {
      throw new ValidationError('TIN must be 12 digits (ИИН/БИН format)');
    }

    return new TIN({ value: cleaned });
  }

  public static createOptional(value?: string | null): TIN | undefined {
    if (!value) return undefined;
    return TIN.create(value);
  }

  /**
   * Определить тип: ИИН или БИН
   * 7-й символ: 0-6 = ИИН (физ. лицо), 4-6 = БИН (юр. лицо)
   */
  public getType(): 'IIN' | 'BIN' {
    const seventhDigit = parseInt(this.value[6], 10);
    return seventhDigit >= 4 && seventhDigit <= 6 ? 'BIN' : 'IIN';
  }

  /**
   * Получить дату из ИИН/БИН (первые 6 символов - YYMMDD)
   */
  public getBirthOrRegistrationDate(): Date | null {
    try {
      const yy = parseInt(this.value.substring(0, 2), 10);
      const mm = parseInt(this.value.substring(2, 4), 10);
      const dd = parseInt(this.value.substring(4, 6), 10);

      // Определяем век (если YY > 30, то 19XX, иначе 20XX)
      const year = yy > 30 ? 1900 + yy : 2000 + yy;

      return new Date(year, mm - 1, dd);
    } catch {
      return null;
    }
  }

  public format(): string {
    // Форматировать для отображения: 123456 789012
    return `${this.value.substring(0, 6)} ${this.value.substring(6)}`;
  }
}
