import type {Metadata} from "next";
import PickupMobile from "@/components/junkerz/PickupMobile";
export const metadata:Metadata={title:"Pickup",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function PickupAccessPage(){return <PickupMobile/>;}
