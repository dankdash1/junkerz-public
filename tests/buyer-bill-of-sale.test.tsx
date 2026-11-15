import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import SignedBillOfSaleDownload from '@/components/junkerz/SignedBillOfSaleDownload';
import {buyerApi} from '@/lib/buyer-api';

afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('downloads a private PDF using bearer auth without putting credentials in a URL',async()=>{
 vi.stubGlobal('localStorage',{getItem:()=> 'private-buyer-token'});
 const fetchMock=vi.fn().mockResolvedValue(new Response('%PDF-1.4',{headers:{'Content-Type':'application/pdf'}}));
 vi.stubGlobal('fetch',fetchMock);
 const blob=await buyerApi.pickupBillOfSale(42);
 expect(blob.type).toBe('application/pdf');
 const [url,init]=fetchMock.mock.calls[0];
 expect(url).toBe('/api/buyers/pickup/42/bill-of-sale');
 expect(init.headers.Authorization).toBe('Bearer private-buyer-token');
 expect(init.cache).toBe('no-store');
});

it('creates a PDF download from the authorized blob and releases the object URL',async()=>{
 const blob=new Blob(['%PDF'],{type:'application/pdf'});
 vi.spyOn(buyerApi,'pickupBillOfSale').mockResolvedValue(blob);
 const create=vi.fn().mockReturnValue('blob:private-copy');
 const revoke=vi.fn();
 vi.stubGlobal('URL',class extends URL {static createObjectURL=create;static revokeObjectURL=revoke;});
 const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(function(this:HTMLAnchorElement){
  expect(this.href).toBe('blob:private-copy');
  expect(this.download).toBe('signed-bill-of-sale-42.pdf');
 });
 render(<SignedBillOfSaleDownload matchId={42}/>);
 fireEvent.click(screen.getByRole('button',{name:'Download signed bill of sale'}));
 await waitFor(()=>expect(click).toHaveBeenCalledTimes(1));
 expect(create).toHaveBeenCalledWith(blob);
 await waitFor(()=>expect(revoke).toHaveBeenCalledWith('blob:private-copy'),{timeout:2000});
});

it('shows a failed download without creating a public document link',async()=>{
 vi.spyOn(buyerApi,'pickupBillOfSale').mockRejectedValue(new Error('Document unavailable'));
 render(<SignedBillOfSaleDownload matchId={42}/>);
 fireEvent.click(screen.getByRole('button',{name:'Download signed bill of sale'}));
 expect((await screen.findByRole('alert')).textContent).toBe('Document unavailable');
 expect(screen.queryByRole('link')).toBeNull();
});
