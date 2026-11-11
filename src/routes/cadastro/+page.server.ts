// BACK-END DA TELA DE CADASTRO
// Arquivos +page.server.ts só rodam no servidor. O navegador nunca recebe este código,
// então aqui é seguro lidar com senha e banco de dados.

// fail() devolve uma resposta de erro com status HTTP, sem derrubar a página.
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
// As regras de validação (schema) e a criação do usuário (service) ficam em outros arquivos.
// Este arquivo só faz a ponte entre o formulário e essas regras.
import { registerSchema } from '../../lib/schemas/auth';
import { registerUser } from '../../lib/server/services/auth';

// `actions` são as funções que recebem os envios de formulário desta rota.
// A action `default` é a chamada quando o <form> faz POST para /cadastro.
export const actions: Actions = {
  default: async ({ request }) => {
    // 1. LER: pega os campos enviados, usando o atributo `name` de cada input.
    const formData = await request.formData();

    const email = formData.get('email');
    const password = formData.get('password');
    const name = formData.get('name');

    // 2. GUARDAR O QUE VOLTA PARA A TELA: é o que preenche os campos de novo se der erro.
    // A senha fica de fora de propósito. formData.get pode devolver null ou um arquivo,
    // e por isso o typeof garante que é texto.
    const values = {
      email: typeof email === 'string' ? email : '',
      name: typeof name === 'string' ? name : ''
    };

    // 3. MONTAR A ENTRADA: nome vazio ou só com espaços vira undefined, ou seja, "não informado".
    const input = {
      email: values.email,
      password: typeof password === 'string' ? password : '',
      name: values.name.trim() || undefined
    };

    // 4. VALIDAR: safeParse não lança erro, ele devolve { success, data } ou { success, error }.
    const parsed = registerSchema.safeParse(input);

    if (!parsed.success) {
      // 400 = dados inválidos. flatten().fieldErrors separa os erros por campo, assim:
      // { email: ['Invalid email address'], password: ['Password must...'] }.
      // A tela lê isso em form.errors.
      return fail(400, {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
        values
      });
    }

    let result;

    // 5. CRIAR O USUÁRIO: o try/catch cuida de erros inesperados, como o banco fora do ar.
    try {
      result = await registerUser(parsed.data);
    } catch (error) {
      // O detalhe do erro fica só no log do servidor. A pessoa vê uma mensagem genérica,
      // para não expor informações internas.
      console.error('Registration failed:', error);

      return fail(500, {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        values
      });
    }

    // 6. ERROS PREVISTOS: registerUser não lança erro nesses casos, ele avisa em `reason`.
    if (!result.success) {
      // 409 = conflito: já existe uma conta com esse e-mail.
      if (result.reason === 'EMAIL_ALREADY_EXISTS') {
        return fail(409, {
          success: false,
          message: 'An account with this email already exists.',
          values
        });
      }

      return fail(400, {
        success: false,
        message: 'The submitted data is invalid.',
        values
      });
    }

    // 7. SUCESSO: este objeto chega na tela como `form`.
    // O cadastro não faz login automático: a pessoa ainda precisa entrar em /login.
    return {
      success: true,
      message: 'Account created successfully. You can now log in.'
    };
  }
};
