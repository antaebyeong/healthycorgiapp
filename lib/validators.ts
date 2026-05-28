export type AuthInput = {
  name: string;
  birthDate: string;
};

export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateAuthInput(input: AuthInput) {
  const name = normalizeName(input.name);
  const birthDate = input.birthDate;

  if (!name) {
    return { ok: false as const, message: "이름을 입력해주세요." };
  }

  if (!isValidBirthDate(birthDate)) {
    return { ok: false as const, message: "생년월일을 올바르게 입력해주세요." };
  }

  return { ok: true as const, name, birthDate };
}
