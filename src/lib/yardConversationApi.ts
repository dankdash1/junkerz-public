export type ConversationAudience = 'customer' | 'supplier';
export type RequestPhoto = { id: string; mime_type: string; size_bytes: number };
export type RequestMessage = { id: number; thread_id: number; audience: string; actor_role: string; text: string; attachments: RequestPhoto[]; created_at: string };
export type ConversationScope = { requestId?: string; token?: string; audience?: ConversationAudience };
export type MessageAttempt = { text: string; attachment_ids: string[]; idempotency_key: string };
const PUBLIC_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.dankdash.ai'}/api/junkyard-public/yard-requests`;

async function read(response: Response, binary = false) {
  if (!response.ok) {
    const value = await response.json().catch(() => ({}));
    throw Object.assign(new Error(value.error || `Request failed (${response.status})`), { status: response.status });
  }
  return binary ? response.blob() : response.json();
}

export function conversationAPI(scope: ConversationScope) {
  const account = Boolean(scope.requestId);
  const base = account ? `/api/customer/requests/${encodeURIComponent(scope.requestId!)}` : PUBLIC_BASE;
  const guest = { token: scope.token, audience: scope.audience || 'customer' };
  const json = (body: object) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account ? body : {...guest, ...body}), cache: 'no-store' as const, credentials: 'same-origin' as const });
  return {
    async list(afterId?: number, signal?: AbortSignal): Promise<{messages: RequestMessage[]; next_cursor: number | null}> {
      const query = afterId ? `?after_id=${afterId}` : '';
      const data = await read(await fetch(`${base}/messages${account ? query : ''}`, account ? {cache:'no-store',credentials:'same-origin',signal} : {...json({after_id:afterId}),signal}));
      if (!Array.isArray(data.messages)) throw new Error('The conversation could not be loaded.');
      return data;
    },
    async send(attempt: MessageAttempt): Promise<RequestMessage> {
      const data = await read(await fetch(`${base}/messages${account ? '' : '/send'}`, json(attempt)));
      if (!data.message?.id) throw new Error('The message was not confirmed. Retry with the same draft.');
      return data.message;
    },
    async upload(file: File, idempotencyKey: string): Promise<RequestPhoto> {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10*1024*1024) throw new Error('Choose a JPEG, PNG or WebP photo up to 10 MB.');
      const body = new FormData(); body.set('file',file); body.set('idempotency_key',idempotencyKey);
      if (!account) { body.set('token',scope.token || '');body.set('audience',scope.audience || 'customer'); }
      const data=await read(await fetch(`${base}/attachments`, {method:'POST',body,cache:'no-store',credentials:'same-origin'}));
      if (!data.attachment?.id) throw new Error('Photo upload was not confirmed.');
      return data.attachment;
    },
    async download(id: string): Promise<Blob> {
      return read(await fetch(`${base}/attachments/${encodeURIComponent(id)}${account ? '' : '/download'}`, account ? {cache:'no-store',credentials:'same-origin'} : json({})),true);
    },
  };
}

export async function savePrivatePhoto(blob: Blob, photo: RequestPhoto) {
  const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;
  anchor.download=`request-photo.${photo.mime_type==='image/jpeg'?'jpg':photo.mime_type==='image/webp'?'webp':'png'}`;
  anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
