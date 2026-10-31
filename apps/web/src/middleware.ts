import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas que não devem ser interceptadas
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/cli') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Obtém o token JWT da sessão
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = (token as any)?.role;

  // 1. Proteção de Rotas de Administração (/admin)
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role !== 'ADMIN') {
      // Usuário autenticado mas sem permissão de admin é enviado para o aprendizado
      return NextResponse.redirect(new URL('/learn', req.url));
    }

    return NextResponse.next();
  }

  // 2. Proteção de Rotas de Aprendizado (/learn e /tracks)
  if (pathname.startsWith('/learn') || pathname.startsWith('/tracks')) {
    // Se não estiver logado, permite em desenvolvimento/modo demo com fallback ou redireciona
    if (!token) {
      if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_AUTH === 'true') {
        return NextResponse.next();
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Se o usuário estiver no papel PENDING, envia para a Sala de Espera
    if (role === 'PENDING') {
      return NextResponse.redirect(new URL('/waiting-room', req.url));
    }

    return NextResponse.next();
  }

  // 3. Sala de Espera (/waiting-room)
  if (pathname.startsWith('/waiting-room')) {
    if (token && role && role !== 'PENDING') {
      // Usuário já aprovado não precisa ficar na sala de espera
      return NextResponse.redirect(new URL('/learn', req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
