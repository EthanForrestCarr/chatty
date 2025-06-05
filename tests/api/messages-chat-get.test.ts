/* eslint-disable @typescript-eslint/no-explicit-any */
import { GET } from '@/app/api/messages/chat/[chatId]/route';
import { createRequest } from 'node-mocks-http';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';

// Ensure our manual mock (__mocks__/next-auth/next.ts) is used
jest.mock('next-auth/next');

const getSessionMock = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('GET /api/messages/chat/[chatId]', () => {
  let findUniqueSpy: jest.SpyInstance;
  let findManySpy: jest.SpyInstance;

  beforeAll(() => {
    // Spy on Prisma calls so we can control their output
    findUniqueSpy = jest.spyOn(prisma.chatUser, 'findUnique');
    findManySpy = jest.spyOn(prisma.message, 'findMany');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 1) Zod validation: chatId must be a valid CUID
  it('400s on invalid chatId', async () => {
    // Simulate a signed-in user
    getSessionMock.mockResolvedValue({ user: { id: 'foo' } });

    const res = await GET(createRequest() as any, { params: { chatId: 'not-a-cuid' } });

    expect(res.status).toBe(400);
    expect(await res.json()).toHaveProperty('error', 'Invalid chatId');
  });

  // 2) Authentication guard: must have a valid session
  it('401s when unauthenticated', async () => {
    // Simulate missing session
    getSessionMock.mockResolvedValue(null);

    const res = await GET(createRequest() as any, {
      params: { chatId: 'cmafq5a5f000aexukyor5hjy2' },
    });

    expect(res.status).toBe(401);
  });

  // 3) Authorization guard: user must belong to the chat
  it('403s when user is not a member of the chat', async () => {
    // Simulate signed-in user
    getSessionMock.mockResolvedValue({ user: { id: 'foo' } });
    // Simulate no ChatUser record found
    findUniqueSpy.mockResolvedValue(null);

    const res = await GET(createRequest() as any, {
      params: { chatId: 'cmafq5a5f000aexukyor5hjy2' },
    });

    expect(res.status).toBe(403);
    expect(await res.json()).toHaveProperty('error', 'Forbidden');
    expect(findUniqueSpy).toHaveBeenCalledWith({
      where: { chatId_userId: { chatId: 'cmafq5a5f000aexukyor5hjy2', userId: 'foo' } },
    });
  });

  // 4) Success case: valid session & membership returns messages list
  it('200s and returns messages when user is a member', async () => {
    // Simulate signed-in user
    getSessionMock.mockResolvedValue({ user: { id: 'foo' } });
    // Simulate ChatUser membership exists
    findUniqueSpy.mockResolvedValue({} as any);

    // Fake messages to be returned
    const fakeMessages = [
      {
        id: 'msg1',
        content: 'hello',
        createdAt: '2025-05-08T00:00:00.000Z',
        sender: { id: 'sender1', username: 'user1' },
      },
    ];
    findManySpy.mockResolvedValue(fakeMessages);

    const res = await GET(createRequest() as any, {
      params: { chatId: 'cmafq5a5f000aexukyor5hjy2' },
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(fakeMessages);

    // Verify Prisma calls used the correct arguments
    expect(findUniqueSpy).toHaveBeenCalledWith({
      where: { chatId_userId: { chatId: 'cmafq5a5f000aexukyor5hjy2', userId: 'foo' } },
    });
    expect(findManySpy).toHaveBeenCalledWith({
      where: { chatId: 'cmafq5a5f000aexukyor5hjy2' },
      include: {
        sender: { select: { id: true, username: true } },
        reactions: { include: { user: { select: { id: true, username: true } } } },
        attachments: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  });
});
