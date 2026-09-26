import bcrypt from "bcryptjs";

const PASSWORD_ROUNDS = 12;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("stocksense-invalid-password", PASSWORD_ROUNDS);

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function verifyAgainstDummyHash(password: string): Promise<boolean> {
  return bcrypt.compare(password, DUMMY_PASSWORD_HASH);
}
