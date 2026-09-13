import React from 'react';
import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import SignaturePad from '@/components/junkerz/SignaturePad';
let painted=false;
beforeEach(()=>{
 painted=false;
 const ctx={fillStyle:'',strokeStyle:'',lineWidth:0,lineCap:'',lineJoin:'',fillRect:()=>{painted=false;},beginPath:()=>{},moveTo:()=>{},lineTo:()=>{},stroke:()=>{painted=true;}};
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockImplementation(()=>`data:image/png;base64,${painted?'ink':'white'}`);
 vi.spyOn(HTMLCanvasElement.prototype,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:380,height:160} as DOMRect);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function gesture(canvas:HTMLCanvasElement,stroke=false){
 fireEvent(canvas,new MouseEvent('pointerdown',{clientX:10,clientY:10,bubbles:true}));
 if(stroke)fireEvent(canvas,new MouseEvent('pointermove',{clientX:30,clientY:25,bubbles:true}));
 fireEvent(canvas,new MouseEvent('pointerup',{clientX:30,clientY:25,bubbles:true}));
}
test('blank click emits no image',()=>{
 const change=vi.fn();const {container}=render(<SignaturePad onChange={change}/>);
 gesture(container.querySelector('canvas')!);
 expect(change.mock.calls.every(([value])=>value===null)).toBe(true);
 expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled();
});
test('real stroke emits PNG and clear prevents a later blank click from emitting an image',()=>{
 const change=vi.fn();const {container}=render(<SignaturePad onChange={change}/>);
 const canvas=container.querySelector('canvas')!;gesture(canvas,true);
 expect(change).toHaveBeenLastCalledWith('data:image/png;base64,ink');
 fireEvent.click(screen.getByRole('button',{name:'Clear'}));
 expect(change).toHaveBeenLastCalledWith(null);
 change.mockClear();gesture(canvas);
 expect(change.mock.calls.every(([value])=>value===null)).toBe(true);
});
test('disable/re-enable preserves real ink rather than emitting a cleared white canvas',()=>{
 const change=vi.fn();const {container,rerender}=render(<SignaturePad onChange={change}/>);
 const canvas=container.querySelector('canvas')!;gesture(canvas,true);
 rerender(<SignaturePad onChange={change} disabled/>);
 rerender(<SignaturePad onChange={change}/>);
 change.mockClear();gesture(canvas);
 expect(change).toHaveBeenLastCalledWith('data:image/png;base64,ink');
 expect(painted).toBe(true);
});
