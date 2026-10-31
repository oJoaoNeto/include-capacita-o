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

    // 2. Provedor de Demonstração / Homologação (quando habilitado)
    ...(process.env.ENABLE_DEMO_AUTH === 'true' || process.env.NODE_ENV !== 'production'
      ? [
          CredentialsProvider({
            id: 'demo-credentials',
            name: 'Acesso Rápido de Demonstração',
            credentials: {
              email: { label: 'E-mail', type: 'email', placeholder: 'trainee@ej.com' },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;

              const user = await prisma.user.findUnique({
                where: { email: credentials.email.toLowerCase().trim() },
              });

              if (!user) return null;

              return {
                id: user.id,
                email: user.email,
                name: user.name || user.email,
                image: user.avatarUrl,
                role: user.role,
                cliToken: user.cliToken,
                cohort: user.cohort,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      const normalizedEmail = user.email.toLowerCase().trim();

      try {
        const gitlabProfile = profile as any;
        const gitlabUserId = gitlabProfile?.id ? Number(gitlabProfile.id) : undefined;
        const gitlabUsername = gitlabProfile?.username;
        const gitlabToken = account?.access_token;
        const avatarUrl = user.image || gitlabProfile?.avatar_url;

        // Busca se usuário já existe (por email ou gitlabUserId)
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalizedEmail },
              ...(gitlabUserId ? [{ gitlabUserId }] : []),
            ],
          },
        });

        if (existingUser) {
          // Atualiza dados sincronizados do GitLab mantendo o papel (Role) e Turma (Cohort)
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
          // Novo usuário não pré-cadastrado entra com Role PENDING (RF02)
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

        return true;
      } catch (error) {
        console.error('Erro ao autenticar e sincronizar usuário com o banco:', error);
        return false;
      }
    },

    async jwt({ token, user }) {
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
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).cliToken = token.cliToken;
        (session.user as any).cohort = token.cohort;
        (session.user as any).trainingRepoId = token.trainingRepoId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
