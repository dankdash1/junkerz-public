import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import SiteExtras from '@/components/SiteExtras';
const route=vi.hoisted(()=>({path:'/pickup'}));
vi.mock('next/navigation',()=>({usePathname:()=>route.path}));
vi.mock('@/components/Analytics',()=>({default:()=> <div>Tracking scripts</div>}));
vi.mock('@/components/ChatBubble',()=>({default:()=> <div>Public chat</div>}));
afterEach(cleanup);
test('capability pickup pages never mount analytics or chat',()=>{
 route.path='/pickup';render(<SiteExtras/>);
 expect(screen.queryByText('Tracking scripts')).toBeNull();
 expect(screen.queryByText('Public chat')).toBeNull();
});
test.each(['/yard-request','/yard-reply'])('yard capability page %s never mounts analytics or chat',(path)=>{
 route.path=path;render(<SiteExtras/>);
 expect(screen.queryByText('Tracking scripts')).toBeNull();
 expect(screen.queryByText('Public chat')).toBeNull();
});
test('buyer pages that issue pickup capabilities never mount trackers',()=>{
 route.path='/buyers/won-cars/42';render(<SiteExtras/>);
 expect(screen.queryByText('Tracking scripts')).toBeNull();
});
test('public marketing pages retain analytics and chat',()=>{
 route.path='/quote';render(<SiteExtras/>);
 expect(screen.getByText('Tracking scripts')).toBeTruthy();
 expect(screen.getByText('Public chat')).toBeTruthy();
});
