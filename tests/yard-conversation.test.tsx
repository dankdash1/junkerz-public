import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import YardRequestConversation from '@/components/YardRequestConversation';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
const message = {id:1,thread_id:1,audience:'customer',actor_role:'staff',text:'Reviewed answer',attachments:[],created_at:'2026-09-15T10:00:00Z'};

test('private guest conversation renders only returned text and posts capability in body', async () => {
  const calls: Array<{url:string,init?:RequestInit}>=[];
  vi.stubGlobal('fetch',vi.fn(async (url,init) => {calls.push({url:String(url),init});return Response.json({messages:[message],next_cursor:null});}));
  render(<YardRequestConversation token="private-token" audience="customer"/>);
  expect(await screen.findByText('Reviewed answer')).toBeTruthy();
  expect(screen.queryByRole('tab',{name:'Yard'})).toBeNull();
  expect(calls[0].url).not.toContain('private-token');
  expect(JSON.parse(String(calls[0].init?.body))).toMatchObject({token:'private-token',audience:'customer'});
});

test('failed send preserves draft and retry uses same idempotency key', async () => {
  const attempts: string[]=[];
  vi.stubGlobal('fetch',vi.fn(async (url,init) => {
    if(String(url).endsWith('/send')) { attempts.push(String(init.body)); if(attempts.length===1) throw new Error('Connection interrupted'); return Response.json({message:{...message,id:2,text:'My draft',actor_role:'customer'}}); }
    return Response.json({messages:[],next_cursor:null});
  }));
  render(<YardRequestConversation token="private-token" audience="customer"/>);
  await screen.findByText('No messages yet.');
  fireEvent.change(screen.getByLabelText('Message to Junkerz'),{target:{value:'My draft'}});
  fireEvent.click(screen.getByRole('button',{name:'Send message'}));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('Connection interrupted'));
  expect((screen.getByLabelText('Message to Junkerz') as HTMLTextAreaElement).value).toBe('My draft');
  fireEvent.click(screen.getByRole('button',{name:'Retry message'}));
  await waitFor(()=>expect(screen.getByText('My draft')).toBeTruthy());
  expect(attempts[1]).toBe(attempts[0]);
});

test('focus refresh adds new messages and hidden page does not poll', async () => {
  vi.useFakeTimers(); let page=0;
  const fetcher=vi.fn(async()=>Response.json({messages:page++?[{...message,id:2,text:'New reply'}]:[message],next_cursor:null}));
  vi.stubGlobal('fetch',fetcher);
  render(<YardRequestConversation token="private-token"/>);
  await act(async()=>{await vi.advanceTimersByTimeAsync(1);});
  expect(screen.getByText('Reviewed answer')).toBeTruthy();
  await act(async()=>{window.dispatchEvent(new Event('focus'));await vi.advanceTimersByTimeAsync(1);});
  expect(screen.getByText('New reply')).toBeTruthy();
  const before=fetcher.mock.calls.length;
  Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});
  await act(async()=>{document.dispatchEvent(new Event('visibilitychange'));await vi.advanceTimersByTimeAsync(30_000);});
  expect(fetcher.mock.calls.length).toBe(before);
  Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});
});

test('account session expiry offers sign-in and never sends a capability', async () => {
  const fetcher=vi.fn(async(_url:RequestInfo|URL,_init?:RequestInit)=>Response.json({error:'Session expired'},{status:401}));vi.stubGlobal('fetch',fetcher);
  render(<YardRequestConversation requestId="00000000-0000-0000-0000-000000000001"/>);
  expect(await screen.findByRole('link',{name:'Sign in to continue'})).toHaveProperty('href',expect.stringContaining('/account/sign-in'));
  expect(String(fetcher.mock.calls[0][0])).toContain('/api/customer/requests/');
});

test('photo is persisted before sending and message replay never uploads it again', async()=>{
  let uploads=0;const sends: Array<Record<string,unknown>>=[];
  vi.stubGlobal('fetch',vi.fn(async(url,init)=>{
    if(String(url).endsWith('/attachments')) {uploads++;return Response.json({attachment:{id:'photo-1',mime_type:'image/png',size_bytes:10}});}
    if(String(url).endsWith('/send')) {const payload=JSON.parse(init.body);sends.push(payload);return Response.json({message:{...message,id:3,text:'',attachments:[{id:'photo-1',mime_type:'image/png',size_bytes:10}]}});}
    return Response.json({messages:[],next_cursor:null});
  }));
  render(<YardRequestConversation token="private-token"/>);
  fireEvent.change(screen.getByLabelText('Attach photos'),{target:{files:[new File(['photo'],'photo.png',{type:'image/png'})]}});
  expect(await screen.findByText(/Photo 1.*uploaded/)).toBeTruthy();
  const form=screen.getByRole('button',{name:'Send message'}).closest('form')!;
  fireEvent.submit(form);fireEvent.submit(form);
  expect(await screen.findByRole('button',{name:'Download photo 1'})).toBeTruthy();
  expect(uploads).toBe(1);expect(sends).toHaveLength(1);expect(sends[0].attachment_ids).toEqual(['photo-1']);
});

test('sending does not skip an earlier concurrent incoming reply on next poll', async()=>{
  let loads=0;
  vi.stubGlobal('fetch',vi.fn(async(url)=>{
    if(String(url).endsWith('/send'))return Response.json({message:{...message,id:3,text:'My outgoing reply'}});
    return Response.json({messages:loads++?[{...message,id:2,text:'Concurrent incoming reply'}]:[message],next_cursor:null});
  }));
  render(<YardRequestConversation token="private-token"/>);
  await screen.findByText('Reviewed answer');
  fireEvent.change(screen.getByLabelText('Message to Junkerz'),{target:{value:'My outgoing reply'}});
  fireEvent.click(screen.getByRole('button',{name:'Send message'}));
  await screen.findByText('My outgoing reply');
  fireEvent.click(screen.getByRole('button',{name:'Refresh messages'}));
  expect(await screen.findByText('Concurrent incoming reply')).toBeTruthy();
});
