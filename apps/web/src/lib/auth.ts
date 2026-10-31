import { NextAuthOptions } from 'next-auth';
import GitLabProvider from 'next-auth/providers/gitlab';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import crypto from 'crypto';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  providers: [
    // 1. Provedor Oficial de Produção: GitLab.com OAuth 2.0
    GitLabProvider({
      clientId: process.env.GITLAB_CLIENT_ID || 'mock-gitlab-client-id',
      clientSecret: process.env.GITLAB_CLIENT_SECRET || 'mock-gitlab-client-secret',
      authorization: {
        params: {
          scope: 'read_user api',
        },
      },
    }),

    // 2. Provedor Universal com E-mail (Credenciais)
    // Permite login institucional direto para membros e trainees pré-cadastrados ou auto-registro
    CredentialsProvider({
      id: 'email-credentials',
      name: 'E-mail Institucional',
      credentials: {
        email: { label: 'E-mail', type: 'email', placeholder: 'usuario@empresa.com' },
        name: { label: 'Nome Completo', type: 'text', placeholder: 'Seu Nome' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const normalizedEmail = credentials.email.toLowerCase().trim();
        if (!normalizedEmail.includes('@')) return null;

        let user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // Se o usuário não existir no banco, cria como PENDING (ou ADMIN se for o primeiro usuário)
        if (!user) {
          const totalUsers = await prisma.user.count();
          const initialRole = totalUsers === 0 ? Role.ADMIN : Role.PENDING;

          user = await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: credentials.name || normalizedEmail.split('@')[0],
              role: initialRole,
              cliToken: crypto.randomUUID(),
              cohort: initialRole === Role.ADMIN ? 'Gestão da Empresa' : 'Novos Ingressantes',
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          image: user.avatarUrl,
          role: user.role,
          cliToken: user.cliToken,
          cohort: user.cohort,
          trainingRepoId: user.trainingRepoId,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      const normalizedEmail = user.email.toLowerCase().trim();

      try {
        // Se a autenticação foi via GitLab OAuth, sincroniza dados do GitLab
        if (account?.provider === 'gitlab') {
          const gitlabProfile = profile as any;
          const gitlabUserId = gitlabProfile?.id ? Number(gitlabProfile.id) : undefined;
          const gitlabUsername = gitlabProfile?.username;
          const gitlabToken = account?.access_token;
          const avatarUrl = user.image || gitlabProfile?.avatar_url;

          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email: normalizedEmail },
                ...(gitlabUserId ? [{ gitlabUserId }] : []),
              ],
            },
          });

          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                avatarUrl: avatarUrl || existingUser.avatarUrl,
                gitlabUserId: gitlabUserId || existingUser.gitlabUserId,
                gitlabUsername: gitlabUsername || existingUser.gitlabUsername,
                gitlabToken: gitlabToken || existingUser.gitlabToken,
              },
            });
          } else {
            await prisma.user.create({
              data: {
                email: normalizedEmail,
                name: user.name || gitlabUsername || 'Novo Usuário',
                avatarUrl,
                gitlabUserId,
                gitlabUsername,
                gitlabToken,
                role: Role.PENDING,
                cliToken: crypto.randomUUID(),
              },
            });
          }
        }

        return true;
      } catch (error) {
        console.error('Erro ao autenticar e sincronizar usuário com o banco:', error);
        return false;
      }
    },

    async jwt({ token, user }) {
      // Se acabou de fazer login ou atualizou token
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase().trim() },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.cliToken = dbUser.cliToken;
          token.cohort = dbUser.cohort;
          token.trainingRepoId = dbUser.trainingRepoId;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || '';
        session.user.role = token.role as Role;
        session.user.cliToken = (token.cliToken as string) || '';
        session.user.cohort = token.cohort || null;
        session.user.trainingRepoId = token.trainingRepoId || null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
