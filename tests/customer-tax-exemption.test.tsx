import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import TaxExemptionPage from '@/app/(site)/account/tax-exemption/page';
import { GET, POST } from '@/app/api/customer/[...path]/route';
import { NextRequest } from 'next/server';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const block=(over={})=>({tax_exemption:{status:'none',exempt:false,certificate_on_file:false,certificate_required:'Texas Form 01-339 resale certificate',tax_permit_number:null,tax_permit_state:null,...over}});
it('first upload requires the certificate file, not just a permit number',async()=>{
 const fetcher=vi.fn<typeof fetch>(async()=>new Response(JSON.stringify(block()),{status:200}));vi.stubGlobal('fetch',fetcher);
 render(<TaxExemptionPage/>);
 await screen.findByText('No exemption on file');
 const file=screen.getByLabelText(/Completed Form 01-339/) as HTMLInputElement;
 expect(file.required).toBe(true);
});
it('shows a submitted certificate as waiting and lets the file be optional on update',async()=>{
 const fetcher=vi.fn<typeof fetch>(async()=>new Response(JSON.stringify(block({status:'submitted',certificate_on_file:true,tax_permit_number:'32012345678',tax_permit_state:'TX'})),{status:200}));vi.stubGlobal('fetch',fetcher);
 render(<TaxExemptionPage/>);
 await screen.findByText('Waiting for Junkerz to check it');
 expect((screen.getByLabelText(/Completed Form 01-339/) as HTMLInputElement).required).toBe(false);
 fireEvent.submit(screen.getByRole('button',{name:'Send for review'}).closest('form')!);
 await waitFor(()=>expect(fetcher).toHaveBeenCalledTimes(2));
 const [url,init]=fetcher.mock.calls[1];
 expect(url).toBe('/api/customer/tax-exemption');expect(init?.method).toBe('POST');
 const body=init?.body as FormData;expect(body.get('permit_number')).toBe('32012345678');expect(body.get('state')).toBe('TX');expect(body.has('file')).toBe(false);
});
it('proxy forwards the tax exemption routes and passes the certificate through as a download',async()=>{
 const fetcher=vi.fn<typeof fetch>(async()=>new Response(new Uint8Array([37,80,68,70]),{status:200,headers:{'content-type':'application/pdf','content-disposition':'attachment; filename="resale-certificate.pdf"'}}));vi.stubGlobal('fetch',fetcher);
 const cert=await GET(new NextRequest('https://www.junkerz.com/api/customer/tax-exemption/certificate'),{params:{path:['tax-exemption','certificate']}});
 expect(cert.status).toBe(200);expect(cert.headers.get('content-disposition')).toContain('attachment');expect(cert.headers.get('x-content-type-options')).toBe('nosniff');
 expect(fetcher.mock.calls[0][0]).toBe('https://api.dankdash.ai/api/junkyard-public/customer/tax-exemption/certificate');
 const cross=await POST(new NextRequest('https://www.junkerz.com/api/customer/tax-exemption',{method:'POST',headers:{origin:'https://evil.invalid'}}),{params:{path:['tax-exemption']}});
 expect(cross.status).toBe(403);
 const other=await POST(new NextRequest('https://www.junkerz.com/api/customer/tax-exemption/certificate',{method:'POST',headers:{origin:'https://www.junkerz.com'}}),{params:{path:['tax-exemption','certificate']}});
 expect(other.status).toBe(404);
});
