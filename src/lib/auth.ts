export const AUTH_COOKIE_NAME = "gipe_token";

const MOCK_CREDENTIALS = { cpf: "97250255126", password: "123456" };

export function mockLogin(cpf: string, password: string): Promise<{ token: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const cpfDigits = cpf.replace(/\D/g, "");
      if (cpfDigits === MOCK_CREDENTIALS.cpf && password === MOCK_CREDENTIALS.password) {
        resolve({ token: `mock.${Date.now()}` });
      } else {
        reject(new Error("CPF ou senha inválidos"));
      }
    }, 800);
  });
}

export function saveToken(token: string): void {
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 8}`;
}

export function clearToken(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
}
